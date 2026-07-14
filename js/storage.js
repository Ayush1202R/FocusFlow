/* ============================================================
   storage.js — Thin wrapper around chrome.storage.local
   With fallback to localStorage for web/file testing contexts.
   ============================================================ */

const Storage = (() => {

  let isExtension = false;
  try {
    isExtension = !!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);
  } catch (_) {
    isExtension = false;
  }

  /**
   * Retrieve one or more keys from storage.
   * @param {string|string[]} keys
   * @returns {Promise<Object>}
   */
  function get(keys) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Storage: extension get warning', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(result);
          }
        });
      });
    } else {
      return new Promise((resolve) => {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(key => {
          const val = localStorage.getItem(key);
          if (val !== null) {
            try {
              result[key] = JSON.parse(val);
            } catch (_) {
              result[key] = val;
            }
          }
        });
        resolve(result);
      });
    }
  }

  /**
   * Save one or more key-value pairs.
   * @param {Object} data
   * @returns {Promise<void>}
   */
  function set(data) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn('Storage: extension set warning', chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else {
      return new Promise((resolve) => {
        for (const [key, val] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(val));
        }
        resolve();
      });
    }
  }

  /**
   * Remove one or more keys.
   * @param {string|string[]} keys
   * @returns {Promise<void>}
   */
  function remove(keys) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            console.warn('Storage: extension remove warning', chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else {
      return new Promise((resolve) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(key => localStorage.removeItem(key));
        resolve();
      });
    }
  }

  return { get, set, remove, isExtension };
})();
