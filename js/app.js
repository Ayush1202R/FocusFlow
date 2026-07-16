/* ============================================================
   app.js — Main orchestrator — boots all modules
   ============================================================ */

(async function App() {
  'use strict';

  // ── DOM refs ──
  const onboardingModal = document.getElementById('onboarding-modal');
  const dashboard       = document.getElementById('dashboard');
  const nameInput       = document.getElementById('onboarding-name');
  const saveBtn         = document.getElementById('onboarding-save-btn');

  // ── 1. Initialise sub-modules ──
  Wallpaper.init();
  Clock.init();

  // ── Apply theme on boot ──
  try {
    const data = await Storage.get('settings');
    if (data.settings && data.settings.theme === 'light') {
      document.body.classList.add('light-theme');
    }
  } catch (_) {}

  // ── Ensure default settings are initialized ──
  try {
    const { settings } = await Storage.get('settings');
    const defaultSites = [
      'instagram.com',
      'youtube.com',
      'linkedin.com',
      'facebook.com',
      'x.com',
      'twitter.com',
      'reddit.com',
      'netflix.com',
      'tiktok.com',
      'pinterest.com',
      'twitch.tv'
    ];

    let s = settings;
    if (typeof s !== 'object' || s === null) {
      s = null;
    }

    if (!s) {
      await Storage.set({
        settings: {
          blockedSites: [...defaultSites],
          focusModeEnabled: false,
          notificationsEnabled: true,
          reminderMinutes: 5
        }
      });
    } else if (!s.blockedSites || s.blockedSites.length === 0) {
      s.blockedSites = [...defaultSites];
      await Storage.set({ settings: s });
    }
  } catch (err) {
    console.warn('App: failed to initialize settings', err);
  }

  // ── 2. Check if user has completed onboarding ──
  try {
    const { userName } = await Storage.get('userName');

    if (userName) {
      // Returning user → show dashboard
      _showDashboard(userName);
    } else {
      // First launch → show onboarding
      _showOnboarding();
    }
  } catch (err) {
    console.error('App: failed to read storage', err);
    _showOnboarding();
  }

  /* ── Show Onboarding ── */
  function _showOnboarding() {
    onboardingModal.classList.remove('hidden');
    dashboard.classList.add('hidden');

    // Enable save button only when name is entered
    nameInput.addEventListener('input', () => {
      saveBtn.disabled = nameInput.value.trim().length === 0;
    });

    // Submit on Enter key
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !saveBtn.disabled) {
        _handleSave();
      }
    });

    // Submit on button click
    saveBtn.addEventListener('click', _handleSave);
  }

  /* ── Handle onboarding save ── */
  async function _handleSave() {
    const name = nameInput.value.trim();
    if (!name) return;

    // Disable button to prevent double-clicks
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      // Save user name
      await Storage.set({ userName: name, createdAt: new Date().toISOString() });

      // Save wallpaper (if one was selected)
      await Wallpaper.savePending();

      // Transition to dashboard
      _showDashboard(name);
    } catch (err) {
      console.error('App: save failed', err);
      saveBtn.disabled = false;
      saveBtn.textContent = "Let's Go";
    }
  }

  /* ── Show Dashboard ── */
  function _showDashboard(name) {
    onboardingModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
    Greeting.render(name);
    Focus.init();       // Daily Focus Prompt & Streak
    Quotes.init();      // Daily Motivational Quote (Assignment 1)
    Timer.init();       // Phase 8: Study stopwatch timer & queue
    TaskManager.init(); // Phase 3: Task manager panel
    Notifications.init(); // Phase 4: In-tab reminder banner
    FocusMode.init();   // Phase 5: Focus mode switch
    Settings.init();    // Phase 6: Tabbed settings panel
    Pomodoro.init();    // Pomodoro Timer Panel (Assignment 4)
    Analytics.init();   // Analytics Dashboard (Assignment 9)
  }

})();
