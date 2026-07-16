/* ============================================================
   settings.js — Settings modal with tabbed interface
   ============================================================ */

const Settings = (() => {
  'use strict';

  let modal, closeBtn;
  let tabs, panels;
  
  // Profile
  let nameInput, nameSaveBtn, themeToggle;
  
  // Wallpaper
  let wpModeSelect, wpUploadBtn, wpUploadInput, wpGalleryEl;
  
  // Block list
  let blockListEl, blockInput, blockAddBtn, blockImportBtn, blockExportBtn, blockImportFile;
  
  // Schedule
  let schedStartInput, schedEndInput, schedAddBtn, schedListEl;
  
  // Quotes
  let quoteInput, quoteAuthorInput, quoteAddBtn, quotesListEl, quotesRestoreBtn;

  // Reminder / Pomodoro
  let reminderBtns;
  let pomoWorkInput, pomoBreakInput;

  /* ── Init ── */
  function init() {
    modal    = document.getElementById('settings-modal');
    closeBtn = document.getElementById('settings-close-btn');

    if (!modal) return;

    // Tab navigation
    tabs   = modal.querySelectorAll('.settings-tab');
    panels = modal.querySelectorAll('.settings-panel');

    // Profile
    nameInput   = document.getElementById('settings-name');
    nameSaveBtn = document.getElementById('settings-name-save');
    themeToggle = document.getElementById('settings-theme-toggle');

    // Wallpaper
    wpModeSelect  = document.getElementById('settings-wp-mode');
    wpUploadBtn   = document.getElementById('settings-wp-upload');
    wpUploadInput = document.getElementById('settings-wp-input');
    wpGalleryEl   = document.getElementById('settings-wp-gallery');

    // Block list
    blockListEl    = document.getElementById('settings-block-list');
    blockInput     = document.getElementById('settings-block-input');
    blockAddBtn    = document.getElementById('settings-block-add');
    blockImportBtn = document.getElementById('settings-block-import');
    blockExportBtn = document.getElementById('settings-block-export');
    blockImportFile = document.getElementById('settings-block-file');

    // Schedule
    schedStartInput = document.getElementById('settings-sched-start');
    schedEndInput   = document.getElementById('settings-sched-end');
    schedAddBtn     = document.getElementById('settings-sched-add');
    schedListEl     = document.getElementById('settings-schedule-list');

    // Quotes
    quoteInput        = document.getElementById('settings-quote-input');
    quoteAuthorInput  = document.getElementById('settings-quote-author');
    quoteAddBtn       = document.getElementById('settings-quote-add');
    quotesListEl      = document.getElementById('settings-quotes-list');
    quotesRestoreBtn  = document.getElementById('settings-quotes-restore');

    // Reminder / Pomodoro
    reminderBtns = modal.querySelectorAll('.reminder-option');
    pomoWorkInput  = document.getElementById('settings-pomo-work');
    pomoBreakInput = document.getElementById('settings-pomo-break');

    _bindEvents();
  }

  /* ── Open / Close ── */
  function open() {
    modal.classList.remove('hidden');
    _loadAllSettings();
  }

  function close() {
    modal.classList.add('hidden');
  }

  /* ── Events ── */
  function _bindEvents() {
    // Open via settings icon
    document.getElementById('settings-btn').addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Tabs
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('settings-tab--active'));
        panels.forEach((p) => p.classList.add('hidden'));
        tab.classList.add('settings-tab--active');
        document.getElementById(tab.dataset.panel).classList.remove('hidden');
      });
    });

    // Profile (Name & Theme Toggle)
    nameSaveBtn.addEventListener('click', _saveName);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') _saveName(); });
    themeToggle.addEventListener('change', _toggleTheme);

    // Wallpaper
    wpModeSelect.addEventListener('change', _changeWpMode);
    wpUploadBtn.addEventListener('click', () => wpUploadInput.click());
    wpUploadInput.addEventListener('change', _handleWpUpload);

    // Block list
    blockAddBtn.addEventListener('click', _addBlockedSite);
    blockInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') _addBlockedSite(); });
    blockExportBtn.addEventListener('click', _exportBlockList);
    blockImportBtn.addEventListener('click', () => blockImportFile.click());
    blockImportFile.addEventListener('change', _importBlockList);

    // Schedule
    schedAddBtn.addEventListener('click', _addSchedule);

    // Quotes
    quoteAddBtn.addEventListener('click', _addCustomQuote);
    quotesRestoreBtn.addEventListener('click', _restoreDefaultQuotes);

    // Reminder options
    reminderBtns.forEach((btn) => {
      btn.addEventListener('click', () => _setReminder(btn));
    });

    // Pomodoro lengths
    pomoWorkInput.addEventListener('change', _changePomoWorkLength);
    pomoBreakInput.addEventListener('change', _changePomoBreakLength);
  }

  async function _loadAllSettings() {
    try {
      const data = await Storage.get(['userName', 'settings', 'focusSchedules']);
      const settings = data.settings || {};
      const userName = data.userName || '';
      const focusSchedules = data.focusSchedules || [];

      // Profile
      nameInput.value = userName;
      themeToggle.checked = settings.theme === 'light';

      // Wallpaper
      wpModeSelect.value = settings.wallpaperMode || 'default';
      _renderWpGallery();

      // Block list
      _renderBlockList(settings.blockedSites || []);

      // Schedules
      _renderScheduleList(focusSchedules);

      // Quotes
      _renderQuotesList();

      // Reminder
      const mins = settings.reminderMinutes ?? 5;
      reminderBtns.forEach((btn) => {
        btn.classList.toggle('reminder-option--active', Number(btn.dataset.minutes) === mins);
      });

      // Pomodoro
      pomoWorkInput.value = settings.pomodoroWorkLength || 25;
      pomoBreakInput.value = settings.pomodoroBreakLength || 5;

    } catch (err) {
      console.error('Settings: load failed', err);
    }
  }

  /* ── Profile ── */
  async function _saveName() {
    const name = nameInput.value.trim();
    if (!name) return;
    await Storage.set({ userName: name });
    Greeting.render(name);
    nameSaveBtn.textContent = 'Saved!';
    setTimeout(() => { nameSaveBtn.textContent = 'Save'; }, 1500);
  }

  async function _toggleTheme() {
    const isLight = themeToggle.checked;
    document.body.classList.toggle('light-theme', isLight);
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.theme = isLight ? 'light' : 'dark';
      await Storage.set({ settings: s });
    } catch (_) {}
  }

  /* ── Wallpaper ── */
  async function _changeWpMode() {
    const mode = wpModeSelect.value;
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.wallpaperMode = mode;
      await Storage.set({ settings: s });
      await Wallpaper.updateRotationMode(mode);
      _renderWpGallery();
    } catch (_) {}
  }

  async function _handleWpUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      const uploadedWallpapers = s.uploadedWallpapers || [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (uploadedWallpapers.length >= 8) {
          alert('Maximum of 8 wallpapers allowed.');
          break;
        }

        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            uploadedWallpapers.push({
              id: String(Date.now()) + Math.random().toString(36).substr(2, 5),
              dataUrl: ev.target.result
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      s.uploadedWallpapers = uploadedWallpapers;
      await Storage.set({ settings: s });
      _renderWpGallery();
      wpUploadInput.value = '';
    } catch (err) {
      console.error('Wallpaper: upload failed', err);
    }
  }

  async function _deleteWallpaper(id) {
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.uploadedWallpapers = (s.uploadedWallpapers || []).filter(wp => wp.id !== id);
      
      // If we deleted the active wallpaper, adjust index
      if (s.currentWallpaperIndex >= s.uploadedWallpapers.length) {
        s.currentWallpaperIndex = Math.max(0, s.uploadedWallpapers.length - 1);
      }
      
      await Storage.set({ settings: s });
      Wallpaper.applyActiveWallpaper();
      _renderWpGallery();
    } catch (_) {}
  }

  async function _renderWpGallery() {
    if (!wpGalleryEl) return;
    wpGalleryEl.innerHTML = '';
    
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      const wallpapers = s.uploadedWallpapers || [];

      if (!wallpapers.length) {
        wpGalleryEl.innerHTML = '<p class="block-list__empty" style="grid-column: span 4;">No wallpapers uploaded.</p>';
        return;
      }

      wallpapers.forEach((wp, idx) => {
        const item = document.createElement('div');
        item.className = 'wp-gallery__item';
        item.style.backgroundImage = `url('${wp.dataUrl}')`;

        const delBtn = document.createElement('button');
        delBtn.className = 'wp-gallery__delete';
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          _deleteWallpaper(wp.id);
        });

        item.appendChild(delBtn);

        // Preview & set active
        item.addEventListener('click', async () => {
          s.wallpaperMode = 'single';
          s.currentWallpaperIndex = idx;
          wpModeSelect.value = 'single';
          await Storage.set({ settings: s });
          Wallpaper.applyActiveWallpaper();
          _renderWpGallery();
        });

        if (s.wallpaperMode === 'single' && s.currentWallpaperIndex === idx) {
          item.classList.add('wp-gallery__item--active');
        }

        wpGalleryEl.appendChild(item);
      });
    } catch (_) {}
  }

  /* ── Block List ── */
  function _renderBlockList(sites) {
    blockListEl.innerHTML = '';
    if (sites.length === 0) {
      blockListEl.innerHTML = '<p class="block-list__empty">No blocked sites.</p>';
      return;
    }
    sites.forEach((site) => {
      const item = document.createElement('div');
      item.className = 'block-list__item';
      item.innerHTML = `
        <span class="block-list__domain">${_escapeHtml(site)}</span>
        <button class="btn btn--icon-sm block-list__remove" data-site="${_escapeHtml(site)}" title="Remove" aria-label="Remove ${_escapeHtml(site)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      item.querySelector('.block-list__remove').addEventListener('click', () => _removeBlockedSite(site));
      blockListEl.appendChild(item);
    });
  }

  async function _addBlockedSite() {
    let domain = blockInput.value.trim().toLowerCase();
    if (!domain) return;
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (!domain) return;

    try {
      const { settings } = await Storage.get('settings');
      let s = settings || {};
      s.blockedSites = s.blockedSites || [];
      if (s.blockedSites.includes(domain)) { blockInput.value = ''; return; }
      s.blockedSites.push(domain);
      await Storage.set({ settings: s });
      _renderBlockList(s.blockedSites);
      blockInput.value = '';
    } catch (err) {
      console.error('Settings: failed to add blocked site', err);
    }
  }

  async function _removeBlockedSite(site) {
    try {
      const { settings } = await Storage.get('settings');
      let s = settings || {};
      s.blockedSites = (s.blockedSites || []).filter((d) => d !== site);
      await Storage.set({ settings: s });
      _renderBlockList(s.blockedSites);
    } catch (err) {
      console.error('Settings: failed to remove blocked site', err);
    }
  }

  async function _exportBlockList() {
    const { settings } = await Storage.get('settings');
    const sites = settings?.blockedSites || [];
    const blob = new Blob([JSON.stringify(sites, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focusflow-blocklist.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function _importBlockList(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      const existing = new Set(s.blockedSites || []);
      imported.forEach((d) => { if (typeof d === 'string') existing.add(d.toLowerCase()); });
      s.blockedSites = [...existing];
      await Storage.set({ settings: s });
      _renderBlockList(s.blockedSites);
    } catch (err) {
      console.error('Settings: import failed', err);
    }
    blockImportFile.value = '';
  }

  /* ── Schedule (Assignment 7) ── */
  async function _addSchedule() {
    const start = schedStartInput.value;
    const end = schedEndInput.value;
    if (!start || !end) return;
    if (start >= end) {
      alert('Start time must be before end time.');
      return;
    }

    try {
      const data = await Storage.get('focusSchedules');
      const schedules = data.focusSchedules || [];
      schedules.push({
        id: String(Date.now()),
        startTime: start,
        endTime: end
      });
      await Storage.set({ focusSchedules: schedules });
      _renderScheduleList(schedules);
      schedStartInput.value = '';
      schedEndInput.value = '';
    } catch (_) {}
  }

  async function _removeSchedule(id) {
    try {
      const data = await Storage.get('focusSchedules');
      const schedules = (data.focusSchedules || []).filter(sched => sched.id !== id);
      await Storage.set({ focusSchedules: schedules });
      _renderScheduleList(schedules);
    } catch (_) {}
  }

  function _renderScheduleList(schedules) {
    schedListEl.innerHTML = '';
    if (schedules.length === 0) {
      schedListEl.innerHTML = '<p class="block-list__empty">No scheduled focus times.</p>';
      return;
    }
    schedules.forEach((sched) => {
      const item = document.createElement('div');
      item.className = 'block-list__item';
      item.innerHTML = `
        <span class="block-list__domain">${_formatTime12(sched.startTime)} – ${_formatTime12(sched.endTime)}</span>
        <button class="btn btn--icon-sm block-list__remove" title="Remove block" aria-label="Remove block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      item.querySelector('.block-list__remove').addEventListener('click', () => _removeSchedule(sched.id));
      schedListEl.appendChild(item);
    });
  }

  /* ── Quotes (Assignment 1) ── */
  async function _addCustomQuote() {
    const text = quoteInput.value.trim();
    const author = quoteAuthorInput.value.trim() || 'Unknown';
    if (!text) return;

    try {
      const quotes = await Quotes.getQuotes();
      quotes.push({ text, author });
      await Quotes.saveQuotes(quotes);
      _renderQuotesList();
      quoteInput.value = '';
      quoteAuthorInput.value = '';
    } catch (_) {}
  }

  async function _removeQuote(index) {
    try {
      let quotes = await Quotes.getQuotes();
      quotes = quotes.filter((_, idx) => idx !== index);
      await Quotes.saveQuotes(quotes);
      _renderQuotesList();
    } catch (_) {}
  }

  async function _restoreDefaultQuotes() {
    try {
      await Quotes.saveQuotes(Quotes.DEFAULT_QUOTES);
      _renderQuotesList();
    } catch (_) {}
  }

  async function _renderQuotesList() {
    quotesListEl.innerHTML = '';
    const quotes = await Quotes.getQuotes();
    if (quotes.length === 0) {
      quotesListEl.innerHTML = '<p class="block-list__empty">No custom quotes.</p>';
      return;
    }
    quotes.forEach((q, idx) => {
      const item = document.createElement('div');
      item.className = 'block-list__item';
      item.innerHTML = `
        <span class="block-list__domain" style="max-width: 80%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="“${_escapeHtml(q.text)}”">${_escapeHtml(q.text)}</span>
        <button class="btn btn--icon-sm block-list__remove" title="Remove quote" aria-label="Remove quote">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      item.querySelector('.block-list__remove').addEventListener('click', () => _removeQuote(idx));
      quotesListEl.appendChild(item);
    });
  }

  /* ── Reminder ── */
  async function _setReminder(btn) {
    const mins = Number(btn.dataset.minutes);
    reminderBtns.forEach((b) => b.classList.remove('reminder-option--active'));
    btn.classList.add('reminder-option--active');

    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.reminderMinutes = mins;
      await Storage.set({ settings: s });
    } catch (_) {}
  }

  /* ── Pomodoro length updates (Assignment 4) ── */
  async function _changePomoWorkLength() {
    let val = Math.max(1, parseInt(pomoWorkInput.value) || 25);
    pomoWorkInput.value = val;
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.pomodoroWorkLength = val;
      await Storage.set({ settings: s });
    } catch (_) {}
  }

  async function _changePomoBreakLength() {
    let val = Math.max(1, parseInt(pomoBreakInput.value) || 5);
    pomoBreakInput.value = val;
    try {
      const { settings } = await Storage.get('settings');
      const s = settings || {};
      s.pomodoroBreakLength = val;
      await Storage.set({ settings: s });
    } catch (_) {}
  }

  /* ── Helpers ── */
  function _formatTime12(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, open, close };
})();
