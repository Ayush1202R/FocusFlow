/* ============================================================
   greeting.js — Time-based greeting with user's name
   ============================================================ */

const Greeting = (() => {

  const greetingEl = document.getElementById('greeting');

  /**
   * Render the greeting using the saved user name.
   * @param {string} name
   */
  function render(name) {
    if (!greetingEl || !name) return;

    const hour = new Date().getHours();
    let period;

    if (hour >= 5 && hour < 12) {
      period = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      period = 'Good Afternoon';
    } else {
      period = 'Good Evening';
    }

    greetingEl.textContent = `${period}, ${name}.`;
  }

  return { render };
})();
