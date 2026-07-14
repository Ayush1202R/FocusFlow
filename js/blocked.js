/* ============================================================
   blocked.js — Logic for blocked.html website blocker page
   ============================================================ */

(async function () {
  'use strict';

  // 1. Bind event listeners
  
  // Go Back (Avoid Redirect Loops & Fallback to Dashboard)
  const backBtn = document.getElementById('blocked-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      try {
        const data = await Storage.get('settings');
        const blockedSites = data.settings?.blockedSites || [];
        
        const isBlockedUrl = (urlStr) => {
          if (!urlStr) return false;
          try {
            const hostname = new URL(urlStr).hostname.toLowerCase();
            return blockedSites.some(site => hostname.includes(site));
          } catch (_) {
            return false;
          }
        };

        if (document.referrer && !isBlockedUrl(document.referrer)) {
          window.location.replace(document.referrer);
        } else if (history.length > 2) {
          history.go(-2);
          setTimeout(() => {
            if (window.location.pathname.includes('blocked.html')) {
              window.location.replace('newtab.html');
            }
          }, 500);
        } else {
          window.location.replace('newtab.html');
        }
      } catch (_) {
        window.location.replace('newtab.html');
      }
    });
  }

  // Disable Focus Mode
  const disableBtn = document.getElementById('blocked-disable-btn');
  if (disableBtn) {
    disableBtn.addEventListener('click', async () => {
      const originalUrl = window.location.hash.slice(1);
      const redirect = () => {
        if (originalUrl && originalUrl.startsWith('http')) {
          window.location.replace(originalUrl);
        } else {
          window.location.replace('newtab.html');
        }
      };

      try {
        // 1. Update storage first to ensure settings state is persistent
        const d = await Storage.get('settings');
        const s = d.settings || {};
        s.focusModeEnabled = false;
        await Storage.set({ settings: s });

        // 2. Notify background service worker safely
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'DISABLE_FOCUS_MODE' }, () => {
              const err = chrome.runtime.lastError;
              resolve();
            });
          });
        }
      } catch (err) {
        console.warn('Disable focus mode failed', err);
      } finally {
        redirect();
      }
    });
  }

  // 2. Load today's active task
  try {
    const data = await Storage.get('tasks');
    const tasks = data.tasks || [];
    const labelEl = document.getElementById('blocked-focus-label');
    const textEl = document.getElementById('blocked-focus-text');
    
    if (textEl) {
      const now = new Date();
      const nowStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const activeTask = tasks.find(t => !t.completed && t.startTime && t.endTime && t.startTime <= nowStr && nowStr < t.endTime);
      
      if (activeTask) {
        if (labelEl) labelEl.textContent = 'Active Task';
        
        const formatTime = (timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          const suffix = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
        };
        
        textEl.textContent = `"${activeTask.title}" (${formatTime(activeTask.startTime)}–${formatTime(activeTask.endTime)})`;
      } else {
        if (labelEl) labelEl.textContent = 'Focus Flow';
        textEl.textContent = 'Stay focused on your goals today!';
      }
    }
  } catch (err) {
    console.error('Error loading active task:', err);
    const textEl = document.getElementById('blocked-focus-text');
    if (textEl) textEl.textContent = 'Stay focused!';
  }
})();
