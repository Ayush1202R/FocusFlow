/* ============================================================
   quotes.js — Daily Rotating Quotes & Quotes Manager
   ============================================================ */

const Quotes = (() => {
  'use strict';

  // ── DOM refs ──
  const quoteTextEl   = document.getElementById('quote-text');
  const quoteAuthorEl = document.getElementById('quote-author');

  const STORAGE_KEY = 'quotes';

  const DEFAULT_QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Do not watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
    { text: "Actions speak louder than thoughts. Get to work.", author: "Unknown" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "You are going to change your family life. Keep going.", author: "Unknown" },
    { text: "It is not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary" },
    { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
    { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Be miserable. Or motivate yourself. Whatever has to be done, it's always your choice.", author: "Wayne Dyer" },
    { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
    { text: "Tomorrow is often the busiest day of the week.", author: "Spanish Proverb" },
    { text: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
    { text: "One day or day one. You decide.", author: "Unknown" },
    { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "You got this. One task at a time.", author: "Unknown" }
  ];

  /* ── Get Day of Year ── */
  function _getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /* ── Initialise (called from app.js) ── */
  async function init() {
    let quotes = await getQuotes();
    if (!quotes || quotes.length === 0) {
      await Storage.set({ [STORAGE_KEY]: DEFAULT_QUOTES });
      quotes = DEFAULT_QUOTES;
    }
    renderDailyQuote(quotes);
  }

  /* ── Get quotes list ── */
  async function getQuotes() {
    try {
      const data = await Storage.get(STORAGE_KEY);
      return data[STORAGE_KEY] || [];
    } catch (_) {
      return [];
    }
  }

  /* ── Save quotes list ── */
  async function saveQuotes(quotesList) {
    await Storage.set({ [STORAGE_KEY]: quotesList });
  }

  /* ── Render today's quote ── */
  function renderDailyQuote(quotes) {
    if (!quoteTextEl || !quotes || quotes.length === 0) return;
    const index = _getDayOfYear() % quotes.length;
    const todayQuote = quotes[index];

    quoteTextEl.textContent = `“${todayQuote.text}”`;
    if (quoteAuthorEl) {
      quoteAuthorEl.textContent = todayQuote.author ? `— ${todayQuote.author}` : '';
    }
  }

  return { init, getQuotes, saveQuotes, DEFAULT_QUOTES };
})();
