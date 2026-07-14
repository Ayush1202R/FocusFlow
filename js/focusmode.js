/* ============================================================
   focusmode.js — Dashboard toggle for Focus Mode
   ============================================================ */

const FocusMode = (() => {

  let toggleEl, toggleLabel;

  /* ── Init ── */
  async function init() {
    toggleEl    = document.getElementById('focus-toggle');
    toggleLabel = document.getElementById('focus-toggle-label');

    if (!toggleEl) return;

    toggleEl.addEventListener('change', _handleToggle);
    await _loadState();

    // Listen for external settings changes (e.g., disabled from blocked page)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.settings) {
          const enabled = changes.settings.newValue?.focusModeEnabled ?? false;
          toggleEl.checked = enabled;
          _updateLabel(enabled);
        }
      });
    }
  }

  /* ── Load current state ── */
  async function _loadState() {
    try {
      const { settings } = await Storage.get('settings');
      const enabled = settings?.focusModeEnabled ?? false;
      toggleEl.checked = enabled;
      _updateLabel(enabled);
    } catch (_) { /* ignore */ }
  }

  /* ── Handle toggle ── */
  async function _handleToggle() {
    const enabled = toggleEl.checked;
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.focusModeEnabled = enabled;
      await Storage.set({ settings: s });
      _updateLabel(enabled);
    } catch (err) {
      console.error('FocusMode: toggle failed', err);
      toggleEl.checked = !enabled; // revert
    }
  }

  /* ── Update label ── */
  function _updateLabel(enabled) {
    if (toggleLabel) {
      toggleLabel.textContent = enabled ? 'Focus ON' : 'Focus OFF';
      toggleLabel.classList.toggle('focus-label--on', enabled);
    }
  }

  return { init };
})();
