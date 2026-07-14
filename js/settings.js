/* ============================================================
   settings.js — Settings modal with tabbed interface
   ============================================================ */

const Settings = (() => {

  let modal, closeBtn;
  let tabs, panels;
  let nameInput, nameSaveBtn;
  let wpUploadBtn, wpUploadInput, wpRemoveBtn, wpRestoreBtn;
  let blockListEl, blockInput, blockAddBtn, blockImportBtn, blockExportBtn, blockImportFile;
  let reminderBtns;

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

    // Wallpaper
    wpUploadBtn   = document.getElementById('settings-wp-upload');
    wpUploadInput = document.getElementById('settings-wp-input');
    wpRemoveBtn   = document.getElementById('settings-wp-remove');
    wpRestoreBtn  = document.getElementById('settings-wp-restore');

    // Block list
    blockListEl    = document.getElementById('settings-block-list');
    blockInput     = document.getElementById('settings-block-input');
    blockAddBtn    = document.getElementById('settings-block-add');
    blockImportBtn = document.getElementById('settings-block-import');
    blockExportBtn = document.getElementById('settings-block-export');
    blockImportFile = document.getElementById('settings-block-file');

    // Reminder
    reminderBtns = modal.querySelectorAll('.reminder-option');

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

    // Profile
    nameSaveBtn.addEventListener('click', _saveName);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') _saveName(); });

    // Wallpaper
    wpUploadBtn.addEventListener('click', () => wpUploadInput.click());
    wpUploadInput.addEventListener('change', _handleWpUpload);
    wpRemoveBtn.addEventListener('click', _handleWpRemove);
    wpRestoreBtn.addEventListener('click', _handleWpRestore);

    // Block list
    blockAddBtn.addEventListener('click', _addBlockedSite);
    blockInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') _addBlockedSite(); });
    blockExportBtn.addEventListener('click', _exportBlockList);
    blockImportBtn.addEventListener('click', () => blockImportFile.click());
    blockImportFile.addEventListener('change', _importBlockList);

    // Reminder
    reminderBtns.forEach((btn) => {
      btn.addEventListener('click', () => _setReminder(btn));
    });
  }

  async function _loadAllSettings() {
    try {
      const data = await Storage.get(['userName', 'settings']);
      let settings = data.settings;
      if (typeof settings !== 'object' || settings === null) {
        settings = {};
      }

      // Profile
      nameInput.value = data.userName || '';

      // Block list
      _renderBlockList(settings.blockedSites || []);

      // Reminder
      const mins = settings.reminderMinutes ?? 5;
      reminderBtns.forEach((btn) => {
        btn.classList.toggle('reminder-option--active', Number(btn.dataset.minutes) === mins);
      });
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

  /* ── Wallpaper ── */
  async function _handleWpUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await Storage.set({ wallpaper: ev.target.result });
      document.getElementById('wallpaper-layer').style.backgroundImage = `url('${ev.target.result}')`;
    };
    reader.readAsDataURL(file);
    wpUploadInput.value = '';
  }

  async function _handleWpRemove() {
    await Storage.remove('wallpaper');
    document.getElementById('wallpaper-layer').style.backgroundImage = '';
  }

  async function _handleWpRestore() {
    await Storage.remove('wallpaper');
    document.getElementById('wallpaper-layer').style.backgroundImage = '';
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
    // Strip protocol and path
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (!domain) return;

    try {
      const { settings } = await Storage.get('settings');
      let s = settings;
      if (typeof s !== 'object' || s === null) {
        s = {};
      }
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
      let s = settings;
      if (typeof s !== 'object' || s === null) {
        s = {};
      }
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

  /* ── Reminder ── */
  async function _setReminder(btn) {
    const mins = Number(btn.dataset.minutes);
    reminderBtns.forEach((b) => b.classList.remove('reminder-option--active'));
    btn.classList.add('reminder-option--active');

    const { settings } = await Storage.get('settings');
    const s = settings || {};
    s.reminderMinutes = mins;
    await Storage.set({ settings: s });
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, open, close };
})();
