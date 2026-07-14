/* ============================================================
   clock.js — Live clock & date display (updates every second)
   ============================================================ */

const Clock = (() => {

  const clockEl = document.getElementById('clock');
  const dateEl  = document.getElementById('date-display');

  let intervalId = null;

  /* ── Start the clock ── */
  function init() {
    _update();                       // Render immediately
    intervalId = setInterval(_update, 1000);  // Then every second
  }

  /* ── Stop (if ever needed) ── */
  function stop() {
    if (intervalId) clearInterval(intervalId);
  }

  /* ── Core update ── */
  function _update() {
    const now = new Date();

    // Time — e.g. 09:42
    if (clockEl) {
      const hours   = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}`;
    }

    // Date — e.g. Sunday, 13 July 2026
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
      });
    }
  }

  /**
   * Returns the current hour (0-23), useful for greeting logic.
   */
  function getCurrentHour() {
    return new Date().getHours();
  }

  return { init, stop, getCurrentHour };
})();
