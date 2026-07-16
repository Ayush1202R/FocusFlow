/* ============================================================
   wallpaper.js — Wallpaper upload, preview, storage & display
   ============================================================ */

const Wallpaper = (() => {

  // ── DOM refs ──
  const layer          = document.getElementById('wallpaper-layer');
  const dropZone       = document.getElementById('wallpaper-drop-zone');
  const fileInput      = document.getElementById('wallpaper-input');
  const previewContainer = document.getElementById('wallpaper-preview-container');
  const previewImg     = document.getElementById('wallpaper-preview-img');
  const removeBtn      = document.getElementById('wallpaper-remove-btn');

  let pendingDataUrl = null; // Holds the data URL before the user saves

  /* ── Initialise (called from app.js) ── */
  async function init() {
    _bindEvents();
    await _loadFromStorage();
  }

  /* ── Apply wallpaper from storage on page load ── */
  async function _loadFromStorage() {
    try {
      const { settings } = await Storage.get('settings');
      if (settings) {
        await rotateWallpaper(settings);
      }
    } catch (err) {
      console.warn('Wallpaper: could not load from storage', err);
    }
  }

  /* ── Event listeners ── */
  function _bindEvents() {
    if (!dropZone) return;

    // Click on drop zone opens file dialog
    dropZone.addEventListener('click', () => fileInput.click());

    // File chosen via dialog
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) _handleFile(e.target.files[0]);
    });

    // Drag-over visual feedback
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    // Drop
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]);
    });

    // Remove preview
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _clearPreview();
      });
    }
  }

  /* ── Read file → preview ── */
  function _handleFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      pendingDataUrl = e.target.result;
      _showPreview(pendingDataUrl);
    };
    reader.readAsDataURL(file);
  }

  /* ── Show / hide preview ── */
  function _showPreview(dataUrl) {
    if (!previewContainer || !previewImg) return;
    previewImg.src = dataUrl;
    previewContainer.classList.remove('hidden');
    dropZone.classList.add('hidden');
  }

  function _clearPreview() {
    pendingDataUrl = null;
    if (previewContainer) previewContainer.classList.add('hidden');
    if (dropZone)         dropZone.classList.remove('hidden');
    if (fileInput)        fileInput.value = '';
  }

  /* ── Save pending wallpaper to storage (onboarding first launch) ── */
  async function savePending() {
    if (pendingDataUrl) {
      try {
        const { settings } = await Storage.get('settings');
        const s = settings || {};
        s.uploadedWallpapers = s.uploadedWallpapers || [];
        s.uploadedWallpapers.push({
          id: String(Date.now()),
          dataUrl: pendingDataUrl
        });
        s.wallpaperMode = 'single';
        s.currentWallpaperIndex = s.uploadedWallpapers.length - 1;
        await Storage.set({ settings: s });
        _applyToBackground(pendingDataUrl);
      } catch (_) {}
      pendingDataUrl = null;
    }
  }

  /* ── Rotate wallpaper based on mode ── */
  async function rotateWallpaper(s) {
    const mode = s.wallpaperMode || 'default';
    const wallpapers = s.uploadedWallpapers || [];

    if (mode === 'default' || wallpapers.length === 0) {
      _clearBackground();
      return;
    }

    if (mode === 'single') {
      const idx = s.currentWallpaperIndex ?? 0;
      const wp = wallpapers[idx] || wallpapers[0];
      if (wp) _applyToBackground(wp.dataUrl);
      return;
    }

    // Rotation modes
    let curIndex = s.currentWallpaperIndex ?? 0;
    if (curIndex >= wallpapers.length) curIndex = 0;

    const now = Date.now();
    const lastRotated = s.lastWallpaperChangeTime || 0;
    let shouldRotate = false;

    if (mode === 'newtab') {
      shouldRotate = true;
    } else if (mode === 'daily') {
      const lastDate = new Date(lastRotated).toDateString();
      const todayDate = new Date(now).toDateString();
      if (lastDate !== todayDate) {
        shouldRotate = true;
      }
    } else if (mode === 'hourly') {
      if (now - lastRotated >= 3600000) {
        shouldRotate = true;
      }
    }

    if (shouldRotate && wallpapers.length > 1) {
      curIndex = (curIndex + 1) % wallpapers.length;
      s.currentWallpaperIndex = curIndex;
      s.lastWallpaperChangeTime = now;
      await Storage.set({ settings: s });
    }

    const wp = wallpapers[curIndex] || wallpapers[0];
    if (wp) {
      _applyToBackground(wp.dataUrl);
    }
  }

  /* ── Set active wallpaper manually ── */
  async function applyActiveWallpaper() {
    const { settings } = await Storage.get('settings');
    if (settings) {
      const wallpapers = settings.uploadedWallpapers || [];
      const idx = settings.currentWallpaperIndex ?? 0;
      const wp = wallpapers[idx];
      if (wp && settings.wallpaperMode !== 'default') {
        _applyToBackground(wp.dataUrl);
      } else {
        _clearBackground();
      }
    }
  }

  /* ── Update mode and re-trigger ── */
  async function updateRotationMode(mode) {
    const { settings } = await Storage.get('settings');
    if (settings) {
      settings.wallpaperMode = mode;
      await Storage.set({ settings });
      await rotateWallpaper(settings);
    }
  }

  /* ── Apply a data URL to the background layer ── */
  function _applyToBackground(dataUrl) {
    if (!layer) return;
    layer.style.backgroundImage = `url('${dataUrl}')`;
  }

  function _clearBackground() {
    if (layer) layer.style.backgroundImage = '';
  }

  return { init, savePending, applyActiveWallpaper, updateRotationMode };
})();
