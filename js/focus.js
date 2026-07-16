/* ============================================================
   focus.js — Daily Focus prompt, storage & reset logic
   ============================================================ */

const Focus = (() => {

  // ── DOM refs (set after init) ──
  let focusSection, focusPrompt, focusInput, focusSubmitBtn;
  let focusDisplay, focusText, focusEditBtn;

  /**
   * Get today's date string in YYYY-MM-DD format.
   */
  function _todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function _yesterdayKey() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* ── Initialise ── */
  async function init() {
    // Grab DOM refs
    focusSection   = document.getElementById('focus-section');
    focusPrompt    = document.getElementById('focus-prompt');
    focusInput     = document.getElementById('focus-input');
    focusSubmitBtn = document.getElementById('focus-submit-btn');
    focusDisplay   = document.getElementById('focus-display');
    focusText      = document.getElementById('focus-text');
    focusEditBtn   = document.getElementById('focus-edit-btn');

    if (!focusSection) return;

    _bindEvents();
    await _loadFocus();
  }

  /* ── Bind UI events ── */
  function _bindEvents() {
    // Submit focus on button click
    focusSubmitBtn.addEventListener('click', _handleSubmit);

    // Submit focus on Enter key
    focusInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && focusInput.value.trim()) {
        _handleSubmit();
      }
    });

    // Enable/disable submit button based on input
    focusInput.addEventListener('input', () => {
      focusSubmitBtn.disabled = focusInput.value.trim().length === 0;
    });

    // Edit focus (click the pencil icon to go back to input)
    focusEditBtn.addEventListener('click', _handleEdit);
  }

  /* ── Load focus from storage ── */
  async function _loadFocus() {
    try {
      const { dailyFocus } = await Storage.get('dailyFocus');
      const today = _todayKey();

      if (dailyFocus && dailyFocus.date === today && dailyFocus.text) {
        // Focus already set for today → display it
        _showDisplay(dailyFocus.text);
      } else {
        // No focus yet or it's a new day → show prompt
        _showPrompt();
      }

      await _checkAndRenderStreak();
    } catch (err) {
      console.warn('Focus: could not load from storage', err);
      _showPrompt();
    }
  }

  /* ── Check & Render Daily Focus Streak (Assignment 2) ── */
  async function _checkAndRenderStreak() {
    const { focusStreak, longestStreak, lastFocusDate } = await Storage.get(['focusStreak', 'longestStreak', 'lastFocusDate']);
    const streakEl = document.getElementById('streak-counter');
    const countEl = document.getElementById('streak-count');
    if (!streakEl || !countEl) return;

    let streak = focusStreak || 0;
    let lastDate = lastFocusDate || '';

    if (lastDate) {
      const today = _todayKey();
      const diffDays = _calcDiffDays(lastDate, today);
      if (diffDays > 1) {
        // Skipped a day → reset streak to 0
        streak = 0;
        await Storage.set({ focusStreak: 0 });
      }
    } else {
      streak = 0;
    }

    if (streak > 0) {
      countEl.textContent = streak;
      streakEl.classList.remove('hidden');
    } else {
      streakEl.classList.add('hidden');
    }
  }

  function _calcDiffDays(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /* ── Handle focus submission ── */
  async function _handleSubmit() {
    const text = focusInput.value.trim();
    if (!text) return;

    const today = _todayKey();
    const focusData = {
      date: today,
      text: text,
    };

    try {
      await Storage.set({ dailyFocus: focusData });

      // Update streak
      const { focusStreak, longestStreak, lastFocusDate } = await Storage.get(['focusStreak', 'longestStreak', 'lastFocusDate']);
      let streak = focusStreak || 0;
      let longest = longestStreak || 0;
      const lastDate = lastFocusDate || '';

      if (lastDate === today) {
        // Already set today, no change
      } else if (lastDate === _yesterdayKey()) {
        streak++;
      } else {
        streak = 1;
      }

      if (streak > longest) {
        longest = streak;
      }

      await Storage.set({
        focusStreak: streak,
        longestStreak: longest,
        lastFocusDate: today
      });

      _showDisplay(text);
      await _checkAndRenderStreak();
    } catch (err) {
      console.error('Focus: failed to save', err);
    }
  }

  /* ── Handle edit (go back to prompt) ── */
  function _handleEdit() {
    _showPrompt();
    // Pre-fill input with current focus text
    if (focusText) {
      focusInput.value = focusText.textContent;
      focusSubmitBtn.disabled = false;
    }
    focusInput.focus();
  }

  /* ── Show the input prompt ── */
  function _showPrompt() {
    focusSection.classList.remove('hidden');
    focusPrompt.classList.remove('hidden');
    focusDisplay.classList.add('hidden');
    focusInput.value = '';
    focusSubmitBtn.disabled = true;
  }

  /* ── Show the saved focus text ── */
  function _showDisplay(text) {
    focusSection.classList.remove('hidden');
    focusPrompt.classList.add('hidden');
    focusDisplay.classList.remove('hidden');
    focusText.textContent = text;
  }

  /**
   * Public getter — returns today's focus text (for other modules like blocked page).
   * @returns {Promise<string|null>}
   */
  async function getTodayFocus() {
    try {
      const { dailyFocus } = await Storage.get('dailyFocus');
      if (dailyFocus && dailyFocus.date === _todayKey()) {
        return dailyFocus.text;
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  return { init, getTodayFocus };
})();
