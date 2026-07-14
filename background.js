/* ============================================================
   background.js — Service Worker (Manifest V3)
   Handles: Focus Mode blocking, Task alarms & notifications
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

/* ── Install: seed default settings ── */
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
      },
    });
  } else {
    // If settings exist, merge any missing default blocked sites
    s.blockedSites = s.blockedSites || [];
    let updated = false;
    DEFAULT_BLOCKED_SITES.forEach((site) => {
      if (!s.blockedSites.includes(site)) {
        s.blockedSites.push(site);
        updated = true;
      }
    });
    if (updated) {
      await chrome.storage.local.set({ settings: s });
    }
  }
});

/* ────────────────────────────────────────────────────────────
   Storage listener — react to settings / task changes
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
    console.log('FocusMode: successfully enabled blocking rules for', sites);
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
    console.log('FocusMode: successfully disabled blocking rules');
  } catch (err) {
    console.error('FocusMode: failed to disable dynamic rules', err);
  }
}

// Debug listener to log rule matches
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    console.log('FocusMode: blocklist rule matched:', info);
  });
}

/* ────────────────────────────────────────────────────────────
   Task Alarms & Notifications
   ──────────────────────────────────────────────────────────── */
async function _updateTaskAlarms(tasks) {
  // Clear old task alarms
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

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('task-')) return;

  const taskId = alarm.name.replace('task-', '');
  const data = await chrome.storage.local.get(['tasks', 'settings']);
  const tasks = data.tasks || [];
  const settings = data.settings || {};
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  // Find next task
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
});

/* ────────────────────────────────────────────────────────────
   Message handler (from newtab / blocked pages)
   ──────────────────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'DISABLE_FOCUS_MODE') {
    chrome.storage.local.get('settings', async (data) => {
      const s = data.settings || {};
      s.focusModeEnabled = false;
      await chrome.storage.local.set({ settings: s });
      await _disableBlocking();
      sendResponse({ ok: true });
    });
    return true; // keep channel open for async response
  }
});
