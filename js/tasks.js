/* ============================================================
   tasks.js — Task Manager: CRUD, sorting, active highlighting
   ============================================================ */

const TaskManager = (() => {

  // ── DOM refs ──
  let taskListEl, addTaskBtn, emptyState;
  let modalBackdrop, modalTitle, modalForm;
  let inputTitle, inputDesc, inputStart, inputEnd;
  let modalSaveBtn, modalCancelBtn, modalDeleteBtn;

  // ── State ──
  let tasks = [];
  let editingId = null;          // null = adding, string = editing
  let highlightInterval = null;

  // Active Task Card elements
  let activeTaskSection, activeTaskTitle, activeTaskTime;

  const STORAGE_KEY = 'tasks';

  /* ────────────────────────────────────────────────────────────
     Public: init
     ──────────────────────────────────────────────────────────── */
  async function init() {
    _cacheDom();
    _bindEvents();
    await _loadTasks();
    _render();
    _startHighlightLoop();
  }

  /* ────────────────────────────────────────────────────────────
     DOM
     ──────────────────────────────────────────────────────────── */
  function _cacheDom() {
    taskListEl     = document.getElementById('task-list');
    addTaskBtn     = document.getElementById('add-task-btn');
    emptyState     = document.getElementById('task-empty-state');

    modalBackdrop  = document.getElementById('task-modal');
    modalTitle     = document.getElementById('task-modal-title');
    modalForm      = document.getElementById('task-modal-form');
    inputTitle     = document.getElementById('task-title-input');
    inputDesc      = document.getElementById('task-desc-input');
    inputStart     = document.getElementById('task-start-input');
    inputEnd       = document.getElementById('task-end-input');
    modalSaveBtn   = document.getElementById('task-modal-save');
    modalCancelBtn = document.getElementById('task-modal-cancel');
    modalDeleteBtn = document.getElementById('task-modal-delete');

    activeTaskSection = document.getElementById('current-task-section');
    activeTaskTitle   = document.getElementById('current-task-title');
    activeTaskTime    = document.getElementById('current-task-time');
  }

  /* ────────────────────────────────────────────────────────────
     Events
     ──────────────────────────────────────────────────────────── */
  function _bindEvents() {
    addTaskBtn.addEventListener('click', () => _openModal());

    modalCancelBtn.addEventListener('click', _closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) _closeModal();
    });

    modalDeleteBtn.addEventListener('click', _handleDelete);
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      _handleSave();
    });

    // Delegate clicks on task items (complete, edit)
    taskListEl.addEventListener('click', (e) => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = item.dataset.id;

      if (e.target.closest('.task-item__check')) {
        _toggleComplete(id);
      } else if (e.target.closest('.task-item__edit')) {
        _openModal(id);
      }
    });
  }

  /* ────────────────────────────────────────────────────────────
     Storage
     ──────────────────────────────────────────────────────────── */
  async function _loadTasks() {
    try {
      const data = await Storage.get(STORAGE_KEY);
      tasks = data[STORAGE_KEY] || [];
    } catch (err) {
      console.warn('TaskManager: load failed', err);
      tasks = [];
    }
  }

  async function _saveTasks() {
    await Storage.set({ [STORAGE_KEY]: tasks });
  }

  /* ────────────────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────────────────── */
  function _render() {
    // Sort by start time
    tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

    taskListEl.innerHTML = '';

    const now = _currentTimeStr();
    _updateActiveTaskDisplay(now);

    if (tasks.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    tasks.forEach((task) => {
      const isActive = !task.completed && task.startTime <= now && now < task.endTime;

      const el = document.createElement('div');
      el.className = 'task-item' +
        (task.completed ? ' task-item--done' : '') +
        (isActive ? ' task-item--active' : '');
      el.dataset.id = task.id;

      el.innerHTML = `
        <button class="task-item__check" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
          <span class="task-item__checkbox ${task.completed ? 'task-item__checkbox--checked' : ''}">
            ${task.completed ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </span>
        </button>
        <div class="task-item__body">
          <span class="task-item__time">${_formatTime(task.startTime)}–${_formatTime(task.endTime)}</span>
          <span class="task-item__title">${_escapeHtml(task.title)}</span>
          ${task.description ? `<span class="task-item__desc">${_escapeHtml(task.description)}</span>` : ''}
        </div>
        <span class="task-item__duration">${task.duration}</span>
        <button class="task-item__edit" aria-label="Edit task" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      `;

      taskListEl.appendChild(el);
    });
  }

  /* ────────────────────────────────────────────────────────────
     Modal: Open / Close
     ──────────────────────────────────────────────────────────── */
  function _openModal(id) {
    editingId = id || null;

    if (editingId) {
      const task = tasks.find((t) => t.id === editingId);
      if (!task) return;
      modalTitle.textContent = 'Edit Task';
      inputTitle.value = task.title;
      inputDesc.value  = task.description || '';
      inputStart.value = task.startTime;
      inputEnd.value   = task.endTime;
      modalDeleteBtn.classList.remove('hidden');
      modalSaveBtn.textContent = 'Update';
    } else {
      modalTitle.textContent = 'New Task';
      modalForm.reset();
      modalDeleteBtn.classList.add('hidden');
      modalSaveBtn.textContent = 'Add Task';
    }

    modalBackdrop.classList.remove('hidden');
    inputTitle.focus();
  }

  function _closeModal() {
    modalBackdrop.classList.add('hidden');
    editingId = null;
    modalForm.reset();
  }

  /* ────────────────────────────────────────────────────────────
     CRUD handlers
     ──────────────────────────────────────────────────────────── */
  async function _handleSave() {
    const title = inputTitle.value.trim();
    const desc  = inputDesc.value.trim();
    const start = inputStart.value;
    const end   = inputEnd.value;

    // Validation
    if (!title) { inputTitle.focus(); return; }
    if (!start || !end) return;
    if (start >= end) {
      inputEnd.focus();
      return;
    }

    const duration = _calcDuration(start, end);

    if (editingId) {
      // Update existing
      const idx = tasks.findIndex((t) => t.id === editingId);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], title, description: desc, startTime: start, endTime: end, duration };
      }
    } else {
      // Create new
      tasks.push({
        id: String(Date.now()),
        title,
        description: desc,
        startTime: start,
        endTime: end,
        duration,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }

    await _saveTasks();
    _render();
    _closeModal();
  }

  async function _handleDelete() {
    if (!editingId) return;
    tasks = tasks.filter((t) => t.id !== editingId);
    await _saveTasks();
    _render();
    _closeModal();
  }

  async function _toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    await _saveTasks();
    _render();

    // If marked completed, trigger study log auto-record
    if (task.completed && typeof Timer !== 'undefined' && Timer.recordTaskTime) {
      await Timer.recordTaskTime(task);
    }
  }

  /* ────────────────────────────────────────────────────────────
     Active task highlighting (runs every 60 s)
     ──────────────────────────────────────────────────────────── */
  function _startHighlightLoop() {
    // Initial run already handled inside _render
    highlightInterval = setInterval(() => {
      _render();
    }, 10_000);
  }

  /** Render the active task card in the center dashboard */
  function _updateActiveTaskDisplay(nowStr) {
    if (!activeTaskSection) return;

    const activeTask = tasks.find((task) => !task.completed && task.startTime <= nowStr && nowStr < task.endTime);

    if (activeTask) {
      if (activeTaskTitle) activeTaskTitle.textContent = activeTask.title;
      if (activeTaskTime) activeTaskTime.textContent = `${_formatTime(activeTask.startTime)} – ${_formatTime(activeTask.endTime)}`;
      activeTaskSection.classList.remove('hidden');
    } else {
      activeTaskSection.classList.add('hidden');
    }
  }

  /* ────────────────────────────────────────────────────────────
     Helpers
     ──────────────────────────────────────────────────────────── */

  /** Current time as "HH:MM" */
  function _currentTimeStr() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  /** Convert "HH:MM" 24h to "9:00 AM" display */
  function _formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  /** Calculate readable duration string */
  function _calcDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '—';
    const hours = Math.floor(diff / 60);
    const mins  = diff % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  }

  /** Simple HTML escaper */
  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();
