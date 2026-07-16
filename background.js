/* ============================================================
   background.js — Service Worker (Manifest V3)
   Handles: Focus Mode blocking, Task alarms, Focus Schedules,
            Pomodoro background alerts & Focus KPI ticking.
   ============================================================ */

const DEFAULT_BLOCKED_SITES = [
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
  'twitch.tv',
];

const POMODORO_KEY = 'pomodoroState';

/* ── Install: seed default settings and alarms ── */
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('settings');
  let s = data.settings;
  if (typeof s !== 'object' || s === null) {
    await chrome.storage.local.set({
      settings: {
        blockedSites: [...DEFAULT_BLOCKED_SITES],
        focusModeEnabled: false,
        notificationsEnabled: true,
        reminderMinutes: 5,
        theme: 'dark',
        pomodoroWorkLength: 25,
        pomodoroBreakLength: 5,
        wallpaperMode: 'default',
        uploadedWallpapers: [],
        currentWallpaperIndex: 0
      },
    });
  } else {
    // Merge any missing settings
    s.blockedSites = s.blockedSites || [];
    let updated = false;
    DEFAULT_BLOCKED_SITES.forEach((site) => {
      if (!s.blockedSites.includes(site)) {
        s.blockedSites.push(site);
        updated = true;
      }
    });
    if (s.theme === undefined) { s.theme = 'dark'; updated = true; }
    if (s.pomodoroWorkLength === undefined) { s.pomodoroWorkLength = 25; updated = true; }
    if (s.pomodoroBreakLength === undefined) { s.pomodoroBreakLength = 5; updated = true; }
    if (s.wallpaperMode === undefined) { s.wallpaperMode = 'default'; updated = true; }
    if (s.uploadedWallpapers === undefined) { s.uploadedWallpapers = []; updated = true; }
    if (s.currentWallpaperIndex === undefined) { s.currentWallpaperIndex = 0; updated = true; }

    if (updated) {
      await chrome.storage.local.set({ settings: s });
    }
  }

  // Create background loops
  chrome.alarms.create('schedule-check', { periodInMinutes: 1 });
  chrome.alarms.create('focus-kpi-tick', { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('schedule-check', { periodInMinutes: 1 });
  chrome.alarms.create('focus-kpi-tick', { periodInMinutes: 1 });
});

/* ────────────────────────────────────────────────────────────
   Storage listener — react to settings / task / pomodoro changes
   ──────────────────────────────────────────────────────────── */
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;

  if (changes.settings) {
    const s = changes.settings.newValue;
    if (s && s.focusModeEnabled) {
      await _enableBlocking(s.blockedSites || DEFAULT_BLOCKED_SITES);
    } else {
      await _disableBlocking();
    }
  }

  if (changes.tasks) {
    await _updateTaskAlarms(changes.tasks.newValue || []);
  }

  if (changes[POMODORO_KEY]) {
    await _updatePomodoroAlarm(changes[POMODORO_KEY].newValue);
  }
});

/* ────────────────────────────────────────────────────────────
   Focus Mode — declarativeNetRequest
   ──────────────────────────────────────────────────────────── */
async function _enableBlocking(sites) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((r) => r.id);

    const redirectUrl = chrome.runtime.getURL('/blocked.html') + '#\\0';
    const addRules = sites.map((site, i) => {
      const escapedSite = site.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      return {
        id: i + 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { regexSubstitution: redirectUrl },
        },
        condition: {
          regexFilter: `^https?://(?:[^/]*\\.)?${escapedSite}(?::[0-9]+)?(?:/.*)?$`,
          resourceTypes: ['main_frame'],
        },
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
    console.log('FocusMode: enabled blocking rules for', sites);
  } catch (err) {
    console.error('FocusMode: failed to update dynamic rules', err);
  }
}

async function _disableBlocking() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((r) => r.id);
    if (removeRuleIds.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    }
    console.log('FocusMode: disabled blocking rules');
  } catch (err) {
    console.error('FocusMode: failed to disable dynamic rules', err);
  }
}

/* ────────────────────────────────────────────────────────────
   Task Alarms & Notifications
   ──────────────────────────────────────────────────────────── */
async function _updateTaskAlarms(tasks) {
  const allAlarms = await chrome.alarms.getAll();
  for (const a of allAlarms) {
    if (a.name.startsWith('task-')) await chrome.alarms.clear(a.name);
  }

  const data = await chrome.storage.local.get('settings');
  const reminderMin = data.settings?.reminderMinutes ?? 5;
  const now = Date.now();

  for (const task of tasks) {
    if (task.completed) continue;

    const [eh, em] = task.endTime.split(':').map(Number);
    const alarm = new Date();
    alarm.setHours(eh, em, 0, 0);
    alarm.setMinutes(alarm.getMinutes() - reminderMin);

    if (alarm.getTime() > now) {
      chrome.alarms.create(`task-${task.id}`, { when: alarm.getTime() });
    }
  }
}

/* ── Pomodoro Alarm Tracker (Assignment 4) ── */
async function _updatePomodoroAlarm(state) {
  await chrome.alarms.clear('pomodoro-end');
  if (state && state.status === 'running' && state.endTime > Date.now()) {
    chrome.alarms.create('pomodoro-end', { when: state.endTime });
  }
}

/* ────────────────────────────────────────────────────────────
   Main Alarms Listener
   ──────────────────────────────────────────────────────────── */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('task-')) {
    await _handleTaskAlarm(alarm);
  } else if (alarm.name === 'pomodoro-end') {
    await _handlePomodoroEnd();
  } else if (alarm.name === 'schedule-check') {
    await _handleScheduleCheck();
  } else if (alarm.name === 'focus-kpi-tick') {
    await _handleFocusKpiTick();
  }
});

/* ── Task Alarm Handler ── */
async function _handleTaskAlarm(alarm) {
  const taskId = alarm.name.replace('task-', '');
  const data = await chrome.storage.local.get(['tasks', 'settings']);
  const tasks = data.tasks || [];
  const settings = data.settings || {};
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  const upcoming = tasks
    .filter((t) => !t.completed && t.startTime > task.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const next = upcoming[0];

  const msg = next
    ? `"${task.title}" is ending soon. Next up: "${next.title}"`
    : `"${task.title}" is ending soon. Wrap things up!`;

  if (settings.notificationsEnabled !== false) {
    chrome.notifications.create(`task-${taskId}`, {
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: 'FocusFlow — Task Reminder',
      message: msg,
      priority: 2,
    });
  }
}

/* ── Pomodoro End Alarm Handler (Assignment 4) ── */
async function _handlePomodoroEnd() {
  const data = await chrome.storage.local.get([POMODORO_KEY, 'settings']);
  const state = data[POMODORO_KEY];
  const s = data.settings || {};
  if (!state || state.status !== 'running') return;

  const nextType = state.type === 'work' ? 'break' : 'work';
  const workLen = s.pomodoroWorkLength || 25;
  const breakLen = s.pomodoroBreakLength || 5;
  const nextDuration = (nextType === 'work' ? workLen : breakLen) * 60 * 1000;

  state.status = 'idle'; // Phase ends, goes to idle waiting for start
  state.type = nextType;
  state.endTime = 0;
  state.remainingMs = nextDuration;

  await chrome.storage.local.set({ [POMODORO_KEY]: state });

  const title = nextType === 'break' ? 'Break Time!' : 'Back to Focus!';
  const msg = nextType === 'break'
    ? `Focus block complete! Time for a ${breakLen}-minute break.`
    : `Break block complete! Time to start a ${workLen}-minute focus session.`;

  if (s.notificationsEnabled !== false) {
    chrome.notifications.create('pomodoro-end-alert', {
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: title,
      message: msg,
      priority: 2,
      silent: false
    });
  }
}

/* ── Focus Mode Schedule Check Handler (Assignment 7) ── */
async function _handleScheduleCheck() {
  const data = await chrome.storage.local.get(['settings', 'focusSchedules', 'manualOverrideBlock']);
  const s = data.settings || {};
  const schedules = data.focusSchedules || [];
  const overrideBlock = data.manualOverrideBlock || '';

  if (!schedules.length) return;

  const now = new Date();
  const nowTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const today = now.toISOString().split('T')[0];

  let activeBlock = null;
  for (const block of schedules) {
    if (block.startTime <= nowTime && nowTime < block.endTime) {
      activeBlock = block;
      break;
    }
  }

  if (activeBlock) {
    const overrideKey = `${today}-${activeBlock.id}`;
    if (overrideBlock === overrideKey) {
      // User overrode it manually during this block -> respect override
      return;
    }

    if (!s.focusModeEnabled) {
      s.focusModeEnabled = true;
      s.focusAutoEnabled = true;
      await chrome.storage.local.set({ settings: s });
    }
  } else {
    // Outside any scheduled block -> clear override block
    if (overrideBlock) {
      await chrome.storage.local.remove('manualOverrideBlock');
    }

    // Auto-disable if it was auto-enabled
    if (s.focusModeEnabled && s.focusAutoEnabled) {
      s.focusModeEnabled = false;
      s.focusAutoEnabled = false;
      await chrome.storage.local.set({ settings: s });
    }
  }
}

/* ── Focus Mode KPI Ticking Handler (Assignment 8) ── */
async function _handleFocusKpiTick() {
  const data = await chrome.storage.local.get(['settings', 'focusTimeKPI']);
  const s = data.settings || {};
  if (!s.focusModeEnabled) return;

  const today = new Date().toISOString().split('T')[0];
  let kpi = data.focusTimeKPI || { date: today, accumulatedMinutes: 0 };

  if (kpi.date !== today) {
    kpi = { date: today, accumulatedMinutes: 0 };
  }

  kpi.accumulatedMinutes++;
  await chrome.storage.local.set({ focusTimeKPI: kpi });
}

/* ────────────────────────────────────────────────────────────
   Message handler (from newtab / blocked pages)
   ──────────────────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'DISABLE_FOCUS_MODE') {
    chrome.storage.local.get(['settings', 'focusSchedules'], async (data) => {
      const s = data.settings || {};
      s.focusModeEnabled = false;
      
      // Determine if we manually overrode an active schedule block
      const schedules = data.focusSchedules || [];
      const now = new Date();
      const nowTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const today = now.toISOString().split('T')[0];

      let activeBlock = null;
      for (const block of schedules) {
        if (block.startTime <= nowTime && nowTime < block.endTime) {
          activeBlock = block;
          break;
        }
      }

      if (activeBlock) {
        // Set manual override so the scheduler doesn't turn it back on in the next minute check
        await chrome.storage.local.set({ manualOverrideBlock: `${today}-${activeBlock.id}` });
      }

      await chrome.storage.local.set({ settings: s });
      await _disableBlocking();
      sendResponse({ ok: true });
    });
    return true; // keep channel open
  }
});
