/* ============================================================
   timer.js — Active Study Stopwatch & Session Queue manager
   ============================================================ */

const Timer = (() => {

  // ── DOM refs ──
  let displayEl, toggleBtn, toggleIcon, toggleText;
  let descInput, logBtn, queueContainer, queueEl;

  // ── State ──
  let cumulativeStudyTime = 0; // seconds
  let timerRunning = false;
  let timerStartTime = null;   // timestamp (ms)
  let studyQueue = [];         // Array of queue items
  let cachedTasks = [];        // Local sync copy of tasks

  let tickInterval = null;

  /* ────────────────────────────────────────────────────────────
     Public: init
     ──────────────────────────────────────────────────────────── */
  async function init() {
    _cacheDom();
    if (!displayEl) return;

    await _loadFromStorage();
    _bindEvents();
    _listenStorage();

    // Start ticks if currently running
    if (timerRunning) {
      _startTicks();
    }
  }

  /* ────────────────────────────────────────────────────────────
     DOM Cache & Event Bindings
     ──────────────────────────────────────────────────────────── */
  function _cacheDom() {
    displayEl      = document.getElementById('study-timer-display');
    toggleBtn      = document.getElementById('study-timer-toggle');
    toggleIcon     = document.getElementById('study-timer-toggle-icon');
    toggleText     = document.getElementById('study-timer-toggle-text');
    descInput      = document.getElementById('study-timer-desc');
    logBtn         = document.getElementById('study-timer-log-btn');
    queueContainer = document.getElementById('study-queue-container');
    queueEl        = document.getElementById('study-timer-queue');
  }

  function _bindEvents() {
    toggleBtn.addEventListener('click', _handleToggle);
    logBtn.addEventListener('click', _handleManualLog);

    descInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _handleManualLog();
    });
  }

  /* ────────────────────────────────────────────────────────────
     Storage Handling & Real-time Sync
     ──────────────────────────────────────────────────────────── */
  async function _loadFromStorage() {
    try {
      const data = await Storage.get(['cumulativeStudyTime', 'timerRunning', 'timerStartTime', 'studyQueue', 'tasks']);
      cumulativeStudyTime = data.cumulativeStudyTime || 0;
      timerRunning = data.timerRunning || false;
      timerStartTime = data.timerStartTime || null;
      studyQueue = data.studyQueue || [];
      cachedTasks = data.tasks || [];

      _updateUI();
    } catch (err) {
      console.warn('Timer: failed to load storage data', err);
    }
  }

  function _listenStorage() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      let changed = false;

      if (changes.tasks) {
        cachedTasks = changes.tasks.newValue || [];
      }
      if (changes.studyQueue) {
        studyQueue = changes.studyQueue.newValue || [];
        _renderQueue();
      }
      if (changes.cumulativeStudyTime) {
        cumulativeStudyTime = changes.cumulativeStudyTime.newValue || 0;
        changed = true;
      }
      if (changes.timerRunning) {
        timerRunning = changes.timerRunning.newValue || false;
        changed = true;
      }
      if (changes.timerStartTime) {
        timerStartTime = changes.timerStartTime.newValue || null;
        changed = true;
      }

      if (changed) {
        _updateUI();
        if (timerRunning) {
          _startTicks();
        } else {
          _stopTicks();
        }
      }
    });
  }

  /* ────────────────────────────────────────────────────────────
     Timer Operations
     ──────────────────────────────────────────────────────────── */
  function _handleToggle() {
    if (timerRunning) {
      _pauseTimer();
    } else {
      _startTimer();
    }
  }

  async function _startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerStartTime = Date.now();

    await Storage.set({
      timerRunning: true,
      timerStartTime: timerStartTime
    });

    _updateUI();
    _startTicks();
  }

  async function _pauseTimer() {
    if (!timerRunning) return;
    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    cumulativeStudyTime += elapsed;
    timerRunning = false;
    timerStartTime = null;

    await Storage.set({
      timerRunning: false,
      timerStartTime: null,
      cumulativeStudyTime: cumulativeStudyTime
    });

    _updateUI();
    _stopTicks();
  }

  function _startTicks() {
    if (tickInterval) return;
    tickInterval = setInterval(() => {
      _updateDisplay();
      _checkAutoRecord();
    }, 1000);
  }

  function _stopTicks() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  /* ────────────────────────────────────────────────────────────
     Log Queue Handlers
     ──────────────────────────────────────────────────────────── */
  async function _handleManualLog() {
    const desc = descInput.value.trim();
    if (!desc) {
      descInput.focus();
      return;
    }

    const liveSecs = _getLiveSeconds();
    const sumQueue = studyQueue.reduce((acc, item) => acc + item.duration, 0);
    const unrecordedSecs = Math.max(0, liveSecs - sumQueue);

    if (unrecordedSecs <= 0) {
      descInput.blur();
      return;
    }

    const newItem = {
      id: String(Date.now()),
      description: desc,
      duration: unrecordedSecs,
      timestamp: new Date().toISOString()
    };

    studyQueue.push(newItem);
    await Storage.set({ studyQueue: studyQueue });

    descInput.value = '';
  }

  async function _deleteQueueItem(itemId) {
    studyQueue = studyQueue.filter((item) => item.id !== itemId);
    await Storage.set({ studyQueue: studyQueue });
  }

  /* ────────────────────────────────────────────────────────────
     Automatic Task Time Logging
     ──────────────────────────────────────────────────────────── */
  async function _checkAutoRecord() {
    const now = new Date();
    const nowStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    let tasksUpdated = false;

    for (const task of cachedTasks) {
      const alreadyLogged = studyQueue.some((item) => item.taskId === task.id);
      if (alreadyLogged) continue;

      const hasEnded = nowStr >= task.endTime;
      const isCompleted = task.completed;

      if (hasEnded || isCompleted) {
        // Automatically record
        await recordTaskTime(task);

        // Mark the ended task completed if it wasn't yet
        if (!task.completed) {
          task.completed = true;
          tasksUpdated = true;
        }
      }
    }

    if (tasksUpdated) {
      await Storage.set({ tasks: cachedTasks });
    }
  }

  /**
   * Automatically log time for a task into the study queue (capping at the allotted duration).
   * Declared public so js/tasks.js can call it when the checkbox is manually checked.
   */
  async function recordTaskTime(task) {
    const data = await Storage.get(['cumulativeStudyTime', 'timerRunning', 'timerStartTime', 'studyQueue']);
    const queue = data.studyQueue || [];
    const cumulative = data.cumulativeStudyTime || 0;
    const running = data.timerRunning || false;
    const startTime = data.timerStartTime || null;

    const alreadyLogged = queue.some((item) => item.taskId === task.id);
    if (alreadyLogged) return;

    let liveSecs = cumulative;
    if (running && startTime) {
      liveSecs += Math.floor((Date.now() - startTime) / 1000);
    }

    const sumQueue = queue.reduce((acc, item) => acc + item.duration, 0);
    const unrecordedSecs = Math.max(0, liveSecs - sumQueue);

    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    const allottedSecs = (eh * 60 + em - (sh * 60 + sm)) * 60;

    const durationToLog = Math.min(unrecordedSecs, allottedSecs);

    const newItem = {
      id: String(Date.now()),
      description: task.title,
      duration: durationToLog,
      taskId: task.id,
      timestamp: new Date().toISOString()
    };

    queue.push(newItem);
    await Storage.set({ studyQueue: queue });
  }

  /* ────────────────────────────────────────────────────────────
     Helpers
     ──────────────────────────────────────────────────────────── */
  function _getLiveSeconds() {
    let secs = cumulativeStudyTime;
    if (timerRunning && timerStartTime) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      secs += elapsed;
    }
    return secs;
  }

  function _updateUI() {
    _updateDisplay();
    _renderQueue();
    _updateToggleState();
  }

  function _updateDisplay() {
    if (!displayEl) return;
    const secs = _getLiveSeconds();
    displayEl.textContent = _formatSecs(secs);
  }

  function _updateToggleState() {
    if (!toggleBtn) return;
    if (timerRunning) {
      toggleBtn.classList.remove('btn--primary');
      toggleBtn.classList.add('btn--danger');
      toggleText.textContent = 'Pause';
      toggleIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    } else {
      toggleBtn.classList.remove('btn--danger');
      toggleBtn.classList.add('btn--primary');
      toggleText.textContent = 'Start';
      toggleIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
    }
  }

  function _renderQueue() {
    if (!queueEl) return;
    queueEl.innerHTML = '';

    if (studyQueue.length === 0) {
      queueContainer.classList.add('hidden');
      return;
    }

    queueContainer.classList.remove('hidden');

    studyQueue.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'study-queue-item';
      el.innerHTML = `
        <div class="study-queue-item__info">
          <span class="study-queue-item__desc" title="${_escapeHtml(item.description)}">${_escapeHtml(item.description)}</span>
          <span class="study-queue-item__duration">${_formatSecs(item.duration)}</span>
        </div>
        <button class="study-queue-item__delete" data-id="${item.id}" title="Delete session log">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      `;

      el.querySelector('.study-queue-item__delete').addEventListener('click', () => _deleteQueueItem(item.id));
      queueEl.appendChild(el);
    });
  }

  function _formatSecs(totalSecs) {
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}.${m}.${s}`;
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, recordTaskTime };
})();
