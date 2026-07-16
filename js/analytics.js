/* ============================================================
   analytics.js — Fullscreen Analytics Dashboard & KPI tracking
   ============================================================ */

const Analytics = (() => {
  'use strict';

  // ── DOM refs ──
  let modalEl, openBtn, closeBtn;
  let currentStreakEl, longestStreakEl;
  let focusChartEl, tasksChartEl, blockedListEl;

  // KPI elements
  let kpiEl, kpiTimeEl, kpiGoalEl;

  const LOGS_KEY = 'analyticsLogs';
  const KPI_KEY = 'focusTimeKPI';

  /* ── Initialise ── */
  async function init() {
    _cacheDom();
    if (!modalEl) return;

    _bindEvents();
    await updateKPI();

    // Listen for storage changes to update KPI and refresh charts if open
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local') {
          if (changes[KPI_KEY]) {
            await updateKPI();
            if (!modalEl.classList.contains('hidden')) {
              await _renderDashboard();
            }
          }
          if (changes.settings && !modalEl.classList.contains('hidden')) {
            await _renderDashboard();
          }
        }
      });
    }
  }

  function _cacheDom() {
    modalEl       = document.getElementById('analytics-modal');
    openBtn       = document.getElementById('analytics-btn');
    closeBtn      = document.getElementById('analytics-close-btn');

    currentStreakEl = document.getElementById('analytics-current-streak');
    longestStreakEl = document.getElementById('analytics-longest-streak');
    
    focusChartEl  = document.getElementById('focus-hours-chart');
    tasksChartEl  = document.getElementById('tasks-completed-chart');
    blockedListEl = document.getElementById('blocked-sites-list');

    kpiEl     = document.getElementById('focus-kpi');
    kpiTimeEl = document.getElementById('focus-kpi-time');
    kpiGoalEl = document.getElementById('focus-kpi-goal');
  }

  function _bindEvents() {
    if (openBtn) openBtn.addEventListener('click', _openDashboard);
    if (closeBtn) closeBtn.addEventListener('click', _closeDashboard);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) _closeDashboard();
      });
    }
  }

  /* ── Open / Close ── */
  async function _openDashboard() {
    if (modalEl) {
      modalEl.classList.remove('hidden');
      await _renderDashboard();
    }
  }

  function _closeDashboard() {
    if (modalEl) modalEl.classList.add('hidden');
  }

  /* ── Load stats and render charts ── */
  async function _renderDashboard() {
    try {
      // 1. Load Streaks
      const data = await Storage.get(['focusStreak', 'longestStreak', LOGS_KEY, 'settings']);
      const currentStreak = data.focusStreak || 0;
      const longestStreak = data.longestStreak || 0;
      const logs = data[LOGS_KEY] || { completedTasks: {}, blockedAttempts: {} };
      const s = data.settings || {};

      if (currentStreakEl) currentStreakEl.textContent = currentStreak;
      if (longestStreakEl) longestStreakEl.textContent = longestStreak;

      // Get last 7 calendar days
      const days = [];
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyymmdd = d.toISOString().split('T')[0];
        const dayLabel = weekdays[d.getDay()];
        days.push({ key: yyyymmdd, label: dayLabel });
      }

      // 2. Render Focus Hours Chart (last 7 days)
      // Retrieve focus KPI data from logs + active today
      const focusMinsData = {};
      
      // Load focus logs (if any are saved inside history, or check today's current KPI)
      const kpiData = await Storage.get(KPI_KEY);
      const todayKpi = kpiData[KPI_KEY] || { date: '', accumulatedMinutes: 0 };
      const todayKey = new Date().toISOString().split('T')[0];

      // Retrieve previous focus logs
      const focusLogs = logs.dailyActiveFocusTime || {};

      days.forEach(day => {
        if (day.key === todayKey && todayKpi.date === todayKey) {
          focusMinsData[day.key] = todayKpi.accumulatedMinutes;
        } else {
          focusMinsData[day.key] = focusLogs[day.key] || 0;
        }
      });

      const focusHours = days.map(day => (focusMinsData[day.key] / 60).toFixed(1));
      const maxHours = Math.max(...focusHours.map(Number), 1);

      if (focusChartEl) {
        focusChartEl.innerHTML = '';
        days.forEach((day, idx) => {
          const hours = parseFloat(focusHours[idx]);
          const pct = Math.min(100, Math.max(4, (hours / maxHours) * 100));

          const col = document.createElement('div');
          col.className = 'bar-chart-col';
          col.innerHTML = `
            <div class="bar-chart-bar-wrapper">
              <div class="bar-chart-bar" style="height: ${pct}%;">
                <span class="bar-chart-value">${hours}h</span>
              </div>
            </div>
            <span class="bar-chart-label">${day.label}</span>
          `;
          focusChartEl.appendChild(col);
        });
      }

      // 3. Render Completed Tasks Chart (last 7 days)
      const taskLogs = logs.completedTasks || {};
      const taskCounts = days.map(day => taskLogs[day.key] || 0);
      const maxTasks = Math.max(...taskCounts, 1);

      if (tasksChartEl) {
        tasksChartEl.innerHTML = '';
        days.forEach((day, idx) => {
          const count = taskCounts[idx];
          const pct = Math.min(100, Math.max(4, (count / maxTasks) * 100));

          const col = document.createElement('div');
          col.className = 'bar-chart-col';
          col.innerHTML = `
            <div class="bar-chart-bar-wrapper">
              <div class="bar-chart-bar" style="height: ${pct}%;">
                <span class="bar-chart-value">${count}</span>
              </div>
            </div>
            <span class="bar-chart-label">${day.label}</span>
          `;
          tasksChartEl.appendChild(col);
        });
      }

      // 4. Render Blocked Site Attempts
      const blockedLogs = logs.blockedAttempts || {};
      const domainTotals = {};

      // Sum domain attempts across all recorded days
      Object.values(blockedLogs).forEach(dayObj => {
        if (typeof dayObj === 'object' && dayObj !== null) {
          Object.entries(dayObj).forEach(([domain, count]) => {
            domainTotals[domain] = (domainTotals[domain] || 0) + count;
          });
        }
      });

      const sortedDomains = Object.entries(domainTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4); // top 4 domains

      const maxAttempts = sortedDomains.length > 0 ? sortedDomains[0][1] : 1;

      if (blockedListEl) {
        blockedListEl.innerHTML = '';
        if (sortedDomains.length === 0) {
          blockedListEl.innerHTML = '<p class="block-list__empty" style="text-align: center; line-height: 100px;">No blocked attempts recorded.</p>';
          return;
        }

        sortedDomains.forEach(([domain, count]) => {
          const pct = (count / maxAttempts) * 100;
          const item = document.createElement('div');
          item.className = 'blocked-attempts-item';
          item.innerHTML = `
            <div class="blocked-attempts-info">
              <span class="blocked-attempts-domain">${_escapeHtml(domain)}</span>
              <span class="blocked-attempts-count">${count} attempt${count > 1 ? 's' : ''}</span>
            </div>
            <div class="blocked-attempts-progress-bar">
              <div class="blocked-attempts-progress-fill" style="width: ${pct}%;"></div>
            </div>
          `;
          blockedListEl.appendChild(item);
        });
      }

    } catch (err) {
      console.error('Analytics: render error', err);
    }
  }

  /* ── Update Center Header KPI Display (Assignment 8) ── */
  async function updateKPI() {
    if (!kpiEl) return;
    try {
      const data = await Storage.get(['settings', KPI_KEY]);
      const s = data.settings || {};
      
      if (!s.focusModeEnabled) {
        kpiEl.classList.add('hidden');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const kpi = data[KPI_KEY] || { date: today, accumulatedMinutes: 0 };
      const minutes = kpi.date === today ? kpi.accumulatedMinutes : 0;
      const targetHours = s.focusTimeGoal ? (s.focusTimeGoal / 60) : 4; // default 4 hours

      let timeText = `${minutes}m`;
      if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        timeText = `${h}h ${m}m`;
      }

      if (kpiTimeEl) kpiTimeEl.textContent = `Focused: ${timeText}`;
      if (kpiGoalEl) kpiGoalEl.textContent = `/ ${targetHours}h goal`;
      kpiEl.classList.remove('hidden');

      // Also copy active focus time to historical logs on a timezone rollover
      if (kpi.date && kpi.date !== today) {
        const logsData = await Storage.get(LOGS_KEY);
        const logs = logsData[LOGS_KEY] || {};
        logs.dailyActiveFocusTime = logs.dailyActiveFocusTime || {};
        logs.dailyActiveFocusTime[kpi.date] = kpi.accumulatedMinutes;
        
        await Storage.set({
          [LOGS_KEY]: logs,
          [KPI_KEY]: { date: today, accumulatedMinutes: 0 } // reset KPI key
        });
      }

    } catch (_) {}
  }

  /* ── Public Method: Log Task Completion ── */
  async function logCompletedTask() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await Storage.get(LOGS_KEY);
      const logs = data[LOGS_KEY] || {};
      logs.completedTasks = logs.completedTasks || {};
      
      logs.completedTasks[today] = (logs.completedTasks[today] || 0) + 1;
      await Storage.set({ [LOGS_KEY]: logs });
    } catch (_) {}
  }

  /* ── Helpers ── */
  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, updateKPI, logCompletedTask, LOGS_KEY };
})();
