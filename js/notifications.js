/* ============================================================
   notifications.js — In-tab reminder banners for ending tasks
   ============================================================ */

const Notifications = (() => {

  let bannerEl, bannerMsg, bannerNext, bannerClose;
  let checkInterval = null;
  let dismissTimeout = null;
  let lastShownTaskId = null;

  let countdownInterval = null;
  let activeCountdownTaskId = null;

  /* ── Init ── */
  function init() {
    bannerEl    = document.getElementById('reminder-banner');
    bannerMsg   = document.getElementById('reminder-msg');
    bannerNext  = document.getElementById('reminder-next');
    bannerClose = document.getElementById('reminder-close');

    if (!bannerEl) return;

    bannerClose.addEventListener('click', _dismiss);

    // Check every 10 seconds to detect windows precisely
    _check();
    checkInterval = setInterval(_check, 10_000);
  }

  /* ── Periodic check ── */
  async function _check() {
    try {
      const data = await Storage.get(['tasks', 'settings']);
      const tasks = data.tasks || [];
      const settings = data.settings || {};
      const reminderMin = settings.reminderMinutes ?? 5;

      const now = new Date();

      // If a countdown is running, verify the task is still active and incomplete
      if (activeCountdownTaskId) {
        const activeTaskObj = tasks.find((t) => t.id === activeCountdownTaskId);
        if (!activeTaskObj || activeTaskObj.completed) {
          _dismiss();
          return;
        }
      }

      // Find tasks ending within reminderMin window
      for (const task of tasks) {
        if (task.completed) continue;

        const [eh, em] = task.endTime.split(':').map(Number);
        
        // Get target end time on today's date
        const targetTime = new Date(now);
        targetTime.setHours(eh, em, 0, 0);

        const diffMs = targetTime.getTime() - now.getTime();
        const diffSecs = Math.floor(diffMs / 1000);

        if (diffSecs > 0 && diffSecs <= reminderMin * 60) {
          if (lastShownTaskId === task.id) continue;

          _startCountdown(task, targetTime, tasks);
          lastShownTaskId = task.id;
          return;
        }
      }
    } catch (err) {
      console.warn('Notifications: check failed', err);
    }
  }

  /* ── Start countdown loop ── */
  function _startCountdown(task, targetTime, allTasks) {
    if (activeCountdownTaskId === task.id) return;

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    clearTimeout(dismissTimeout);

    activeCountdownTaskId = task.id;

    // Find next task starting at or after the current task's end time
    const upcoming = allTasks
      .filter((t) => !t.completed && t.startTime >= task.endTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const nextTask = upcoming[0];

    const updateUI = () => {
      const now = new Date();
      const diffMs = targetTime.getTime() - now.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));

      if (diffSecs <= 0) {
        bannerMsg.textContent = `⏰  Time's up! It's time to move to the next task.`;
        if (bannerNext) bannerNext.classList.add('hidden');

        clearInterval(countdownInterval);
        countdownInterval = null;
        activeCountdownTaskId = null;

        dismissTimeout = setTimeout(_dismiss, 10_000);
        return;
      }

      const m = Math.floor(diffSecs / 60);
      const s = String(diffSecs % 60).padStart(2, '0');
      const timeStr = `${m}:${s}`;

      bannerMsg.textContent = `⏰  Pack the things up and wrap up because it's time to move to the next task in ${timeStr}`;

      if (nextTask) {
        bannerNext.textContent = `Next: ${nextTask.title}`;
        bannerNext.classList.remove('hidden');
      } else {
        bannerNext.classList.add('hidden');
      }

      bannerEl.classList.remove('hidden');
      bannerEl.classList.add('banner--visible');
    };

    updateUI();
    countdownInterval = setInterval(updateUI, 1000);
  }

  /* ── Dismiss ── */
  function _dismiss() {
    bannerEl.classList.remove('banner--visible');
    clearTimeout(dismissTimeout);
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    activeCountdownTaskId = null;

    setTimeout(() => {
      bannerEl.classList.add('hidden');
    }, 400);
  }

  return { init };
})();
