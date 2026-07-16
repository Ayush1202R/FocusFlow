/* ============================================================
   pomodoro.js — Pomodoro timer panel logic (Assignment 4)
   ============================================================ */

const Pomodoro = (() => {
  'use strict';

  // ── DOM refs ──
  let panelEl, phaseEl, displayEl, toggleBtn, toggleTextEl, skipBtn, resetBtn;

  let localInterval = null;
  let currentWorkMin = 25;
  let currentBreakMin = 5;

  const STORAGE_KEY = 'pomodoroState';

  /* ── Initialise ── */
  async function init() {
    _cacheDom();
    if (!panelEl) return;

    _bindEvents();
    await _loadState();

    // Sync across tabs
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[STORAGE_KEY]) {
          _syncState(changes[STORAGE_KEY].newValue);
        }
        if (area === 'local' && changes.settings) {
          const s = changes.settings.newValue || {};
          currentWorkMin = s.pomodoroWorkLength || 25;
          currentBreakMin = s.pomodoroBreakLength || 5;
        }
      });
    }
  }

  function _cacheDom() {
    panelEl      = document.getElementById('pomodoro-panel');
    phaseEl      = document.getElementById('pomodoro-phase');
    displayEl    = document.getElementById('pomodoro-display');
    toggleBtn    = document.getElementById('pomodoro-toggle');
    toggleTextEl = document.getElementById('pomodoro-toggle-text');
    skipBtn      = document.getElementById('pomodoro-skip');
    resetBtn     = document.getElementById('pomodoro-reset');
  }

  function _bindEvents() {
    toggleBtn.addEventListener('click', _handleToggle);
    skipBtn.addEventListener('click', _handleSkip);
    resetBtn.addEventListener('click', _handleReset);
  }

  /* ── Load settings & initial state ── */
  async function _loadState() {
    try {
      const data = await Storage.get(['settings', STORAGE_KEY]);
      const s = data.settings || {};
      currentWorkMin = s.pomodoroWorkLength || 25;
      currentBreakMin = s.pomodoroBreakLength || 5;

      let state = data[STORAGE_KEY];
      if (!state) {
        state = {
          status: 'idle',
          type: 'work',
          endTime: 0,
          remainingMs: currentWorkMin * 60 * 1000
        };
        await Storage.set({ [STORAGE_KEY]: state });
      }

      _syncState(state);
    } catch (_) {
      _renderDisplay(currentWorkMin * 60 * 1000);
    }
  }

  /* ── Sync state with Storage ── */
  function _syncState(state) {
    if (!state) return;

    // Phase label
    if (phaseEl) {
      phaseEl.textContent = state.type === 'work' ? 'Work' : 'Break';
      phaseEl.style.color = state.type === 'work' ? 'var(--color-accent-start)' : 'var(--color-accent-end)';
      phaseEl.style.background = state.type === 'work' ? 'rgba(108, 99, 255, 0.15)' : 'rgba(224, 64, 251, 0.15)';
    }

    // Toggle button text
    if (toggleTextEl) {
      toggleTextEl.textContent = state.status === 'running' ? 'Pause' : 'Start';
    }

    // Skip button visibility
    if (skipBtn) {
      if (state.status === 'running' || state.status === 'paused') {
        skipBtn.classList.remove('hidden');
      } else {
        skipBtn.classList.add('hidden');
      }
    }

    // Stop existing tick
    if (localInterval) {
      clearInterval(localInterval);
      localInterval = null;
    }

    if (state.status === 'running') {
      _startLocalTick(state.endTime);
    } else {
      _renderDisplay(state.remainingMs);
    }
  }

  /* ── Handle Play / Pause ── */
  async function _handleToggle() {
    try {
      const data = await Storage.get(STORAGE_KEY);
      const state = data[STORAGE_KEY];
      if (!state) return;

      if (state.status === 'running') {
        // Pause
        const remaining = state.endTime - Date.now();
        state.status = 'paused';
        state.remainingMs = Math.max(0, remaining);
        state.endTime = 0;
      } else {
        // Start/Resume
        state.status = 'running';
        const duration = state.remainingMs > 0 ? state.remainingMs : (state.type === 'work' ? currentWorkMin : currentBreakMin) * 60 * 1000;
        state.endTime = Date.now() + duration;
        state.remainingMs = 0;
      }

      await Storage.set({ [STORAGE_KEY]: state });
    } catch (_) {}
  }

  /* ── Handle Reset ── */
  async function _handleReset() {
    try {
      const data = await Storage.get(STORAGE_KEY);
      const state = data[STORAGE_KEY];
      if (!state) return;

      state.status = 'idle';
      state.endTime = 0;
      state.remainingMs = (state.type === 'work' ? currentWorkMin : currentBreakMin) * 60 * 1000;

      await Storage.set({ [STORAGE_KEY]: state });
    } catch (_) {}
  }

  /* ── Handle Skip Phase ── */
  async function _handleSkip() {
    try {
      const data = await Storage.get(STORAGE_KEY);
      const state = data[STORAGE_KEY];
      if (!state) return;

      const nextType = state.type === 'work' ? 'break' : 'work';
      const duration = (nextType === 'work' ? currentWorkMin : currentBreakMin) * 60 * 1000;

      state.status = 'idle';
      state.type = nextType;
      state.endTime = 0;
      state.remainingMs = duration;

      await Storage.set({ [STORAGE_KEY]: state });
    } catch (_) {}
  }

  /* ── Local Ticking Interval ── */
  function _startLocalTick(endTime) {
    const tick = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearInterval(localInterval);
        localInterval = null;
        _renderDisplay(0);
        // Note: background service worker alarm handler transitions the state and saves it.
      } else {
        _renderDisplay(remaining);
      }
    };
    tick();
    localInterval = setInterval(tick, 1000);
  }

  /* ── Format and Render Countdown ── */
  function _renderDisplay(ms) {
    if (!displayEl) return;
    const totalSecs = Math.ceil(ms / 1000);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    displayEl.textContent = `${m}:${s}`;
  }

  return { init };
})();
