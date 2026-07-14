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
      const { wallpaper } = await Storage.get('wallpaper');
      if (wallpaper) {
        _applyToBackground(wallpaper);
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

  /* ── Save pending wallpaper to storage ── */
  async function savePending() {
    if (pendingDataUrl) {
      await Storage.set({ wallpaper: pendingDataUrl });
      _applyToBackground(pendingDataUrl);
      pendingDataUrl = null;
    }
  }

  /* ── Remove wallpaper entirely (restore default gradient) ── */
  async function remove() {
    await Storage.remove('wallpaper');
    pendingDataUrl = null;
    _clearPreview();
    layer.style.backgroundImage = '';
  }

  /* ── Apply a data URL to the background layer ── */
  function _applyToBackground(dataUrl) {
    if (!layer) return;
    layer.style.backgroundImage = `url('${dataUrl}')`;
  }

  return { init, savePending, remove };
})();
