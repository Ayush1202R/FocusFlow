/* ============================================================
   tasks.js — Task Manager: CRUD, sorting, active highlighting,
              and Category Tagging & Filtering.
   ============================================================ */

const TaskManager = (() => {
  'use strict';

  // ── DOM refs ──
  let taskListEl, addTaskBtn, emptyState;
  let modalBackdrop, modalTitle, modalForm;
  let inputTitle, inputDesc, inputStart, inputEnd;
  let modalSaveBtn, modalCancelBtn, modalDeleteBtn;
  
  // Category DOM refs
  let categorySelect, customCatBtn, customCatRow, customCatSaveBtn, filterChipsEl;

  // ── State ──
  let tasks = [];
  let categories = [];
  let activeFilter = 'all'; // 'all' or category name
  let editingId = null;     // null = adding, string = editing
  let highlightInterval = null;

  // Active Task Card elements
  let activeTaskSection, activeTaskTitle, activeTaskTime;

  const STORAGE_KEY = 'tasks';

  /* ────────────────────────────────────────────────────────────
     Public: init
     ──────────────────────────────────────────────────────────── */
  async function init() {
    _cacheDom();
    _bindEvents();
    await _loadTasks();
    _render();
    _startHighlightLoop();
  }

  /* ────────────────────────────────────────────────────────────
     DOM
     ──────────────────────────────────────────────────────────── */
  function _cacheDom() {
    taskListEl     = document.getElementById('task-list');
    addTaskBtn     = document.getElementById('add-task-btn');
    emptyState     = document.getElementById('task-empty-state');

    modalBackdrop  = document.getElementById('task-modal');
    modalTitle     = document.getElementById('task-modal-title');
    modalForm      = document.getElementById('task-modal-form');
    inputTitle     = document.getElementById('task-title-input');
    inputDesc      = document.getElementById('task-desc-input');
    inputStart     = document.getElementById('task-start-input');
    inputEnd       = document.getElementById('task-end-input');
    modalSaveBtn   = document.getElementById('task-modal-save');
    modalCancelBtn = document.getElementById('task-modal-cancel');
    modalDeleteBtn = document.getElementById('task-modal-delete');

    // Category elements
    categorySelect = document.getElementById('task-category-select');
    customCatBtn   = document.getElementById('task-custom-cat-btn');
    customCatRow   = document.getElementById('task-custom-cat-row');
    customCatSaveBtn = document.getElementById('task-custom-cat-save');
    filterChipsEl  = document.getElementById('task-filter-chips');

    activeTaskSection = document.getElementById('current-task-section');
    activeTaskTitle   = document.getElementById('current-task-title');
    activeTaskTime    = document.getElementById('current-task-time');
  }

  /* ────────────────────────────────────────────────────────────
     Events
     ──────────────────────────────────────────────────────────── */
  function _bindEvents() {
    addTaskBtn.addEventListener('click', () => _openModal());

    modalCancelBtn.addEventListener('click', _closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) _closeModal();
    });

    modalDeleteBtn.addEventListener('click', _handleDelete);
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      _handleSave();
    });

    // Custom category toggle
    if (customCatBtn) {
      customCatBtn.addEventListener('click', () => {
        customCatRow.classList.toggle('hidden');
        if (!customCatRow.classList.contains('hidden')) {
          document.getElementById('task-custom-cat-name').focus();
        }
      });
    }

    // Custom category save
    if (customCatSaveBtn) {
      customCatSaveBtn.addEventListener('click', _handleSaveCustomCategory);
    }

    // Clicks on filter chips
    if (filterChipsEl) {
      filterChipsEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        activeFilter = chip.dataset.category;
        
        filterChipsEl.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');

        _render();
      });
    }

    // Delegate clicks on task items (complete, edit)
    taskListEl.addEventListener('click', (e) => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = item.dataset.id;

      if (e.target.closest('.task-item__check')) {
        _toggleComplete(id);
      } else if (e.target.closest('.task-item__edit')) {
        _openModal(id);
      }
    });
  }

  /* ────────────────────────────────────────────────────────────
     Storage
     ──────────────────────────────────────────────────────────── */
  async function _loadTasks() {
    try {
      const data = await Storage.get([STORAGE_KEY, 'settings']);
      tasks = data[STORAGE_KEY] || [];
      const s = data.settings || {};
      categories = s.categories || [
        { name: "Work", color: "#6c63ff" },
        { name: "Personal", color: "#4caf50" },
        { name: "Learning", color: "#9c27b0" }
      ];
      _renderCategoryDropdownOptions();
      _renderFilterChips();
    } catch (err) {
      console.warn('TaskManager: load failed', err);
      tasks = [];
    }
  }

  async function _saveTasks() {
    await Storage.set({ [STORAGE_KEY]: tasks });
  }

  /* ────────────────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────────────────── */
  function _render() {
    // Sort by start time
    tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

    taskListEl.innerHTML = '';

    const now = _currentTimeStr();
    _updateActiveTaskDisplay(now);

    // Apply active filter
    let filteredTasks = tasks;
    if (activeFilter !== 'all') {
      filteredTasks = tasks.filter(task => task.category === activeFilter);
    }

    if (filteredTasks.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    filteredTasks.forEach((task) => {
      const isActive = !task.completed && task.startTime <= now && now < task.endTime;

      const el = document.createElement('div');
      el.className = 'task-item' +
        (task.completed ? ' task-item--done' : '') +
        (isActive ? ' task-item--active' : '');
      el.dataset.id = task.id;

      const catObj = categories.find(c => c.name === task.category);
      const categoryTag = task.category && catObj
        ? `<span class="task-item__category-badge" style="background: ${catObj.color}20; color: ${catObj.color}; border: 1px solid ${catObj.color}35;">${_escapeHtml(task.category)}</span>`
        : '';

      el.innerHTML = `
        <button class="task-item__check" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
          <span class="task-item__checkbox ${task.completed ? 'task-item__checkbox--checked' : ''}">
            ${task.completed ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </span>
        </button>
        <div class="task-item__body">
          <span class="task-item__time">${_formatTime(task.startTime)}–${_formatTime(task.endTime)}</span>
          <span class="task-item__title">${_escapeHtml(task.title)}</span>
          ${task.description ? `<span class="task-item__desc">${_escapeHtml(task.description)}</span>` : ''}
          ${categoryTag}
        </div>
        <span class="task-item__duration">${task.duration}</span>
        <button class="task-item__edit" aria-label="Edit task" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      `;

      taskListEl.appendChild(el);
    });
  }

  /* ────────────────────────────────────────────────────────────
     Categories options render
     ──────────────────────────────────────────────────────────── */
  function _renderCategoryDropdownOptions() {
    if (!categorySelect) return;
    categorySelect.innerHTML = '<option value="">Uncategorized</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });
  }

  function _renderFilterChips() {
    if (!filterChipsEl) return;
    filterChipsEl.innerHTML = `<button class="filter-chip ${activeFilter === 'all' ? 'filter-chip--active' : ''}" data-category="all">All</button>`;
    
    categories.forEach((cat) => {
      const activeClass = activeFilter === cat.name ? 'filter-chip--active' : '';
      const btn = document.createElement('button');
      btn.className = `filter-chip ${activeClass}`;
      btn.dataset.category = cat.name;
      btn.textContent = cat.name;
      filterChipsEl.appendChild(btn);
    });
  }

  async function _handleSaveCustomCategory() {
    const nameInput = document.getElementById('task-custom-cat-name');
    const colorInput = document.getElementById('task-custom-cat-color');
    if (!nameInput) return;

    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) return;

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists!');
      return;
    }

    categories.push({ name, color });

    try {
      const data = await Storage.get('settings');
      const s = data.settings || {};
      s.categories = categories;
      await Storage.set({ settings: s });

      _renderCategoryDropdownOptions();
      _renderFilterChips();
      
      categorySelect.value = name;
      nameInput.value = '';
      customCatRow.classList.add('hidden');
    } catch (_) {}
  }

  /* ────────────────────────────────────────────────────────────
     Modal: Open / Close
     ──────────────────────────────────────────────────────────── */
  function _openModal(id) {
    editingId = id || null;

    if (editingId) {
      const task = tasks.find((t) => t.id === editingId);
      if (!task) return;
      modalTitle.textContent = 'Edit Task';
      inputTitle.value = task.title;
      inputDesc.value  = task.description || '';
      inputStart.value = task.startTime;
      inputEnd.value   = task.endTime;
      categorySelect.value = task.category || '';
      modalDeleteBtn.classList.remove('hidden');
      modalSaveBtn.textContent = 'Update';
    } else {
      modalTitle.textContent = 'New Task';
      modalForm.reset();
      categorySelect.value = '';
      modalDeleteBtn.classList.add('hidden');
      modalSaveBtn.textContent = 'Add Task';
    }

    if (customCatRow) customCatRow.classList.add('hidden');
    modalBackdrop.classList.remove('hidden');
    inputTitle.focus();
  }

  function _closeModal() {
    modalBackdrop.classList.add('hidden');
    editingId = null;
    modalForm.reset();
  }

  /* ────────────────────────────────────────────────────────────
     CRUD handlers
     ──────────────────────────────────────────────────────────── */
  async function _handleSave() {
    const title = inputTitle.value.trim();
    const desc  = inputDesc.value.trim();
    const start = inputStart.value;
    const end   = inputEnd.value;
    const category = categorySelect.value || '';

    // Validation
    if (!title) { inputTitle.focus(); return; }
    if (!start || !end) return;
    if (start >= end) {
      inputEnd.focus();
      return;
    }

    const duration = _calcDuration(start, end);

    if (editingId) {
      // Update existing
      const idx = tasks.findIndex((t) => t.id === editingId);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], title, description: desc, startTime: start, endTime: end, duration, category };
      }
    } else {
      // Create new
      tasks.push({
        id: String(Date.now()),
        title,
        description: desc,
        startTime: start,
        endTime: end,
        duration,
        category,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }

    await _saveTasks();
    _render();
    _closeModal();
  }

  async function _handleDelete() {
    if (!editingId) return;
    tasks = tasks.filter((t) => t.id !== editingId);
    await _saveTasks();
    _render();
    _closeModal();
  }

  async function _toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    await _saveTasks();
    _render();

    // Trigger study log auto-record
    if (task.completed && typeof Timer !== 'undefined' && Timer.recordTaskTime) {
      await Timer.recordTaskTime(task);
    }

    // Trigger completed task log for Analytics (Assignment 9)
    if (task.completed && typeof Analytics !== 'undefined' && Analytics.logCompletedTask) {
      await Analytics.logCompletedTask();
    }
  }

  /* ────────────────────────────────────────────────────────────
     Active task highlighting (runs every 10 s)
     ──────────────────────────────────────────────────────────── */
  function _startHighlightLoop() {
    highlightInterval = setInterval(() => {
      _render();
    }, 10_000);
  }

  /** Render the active task card in the center dashboard */
  function _updateActiveTaskDisplay(nowStr) {
    if (!activeTaskSection) return;

    const activeTask = tasks.find((task) => !task.completed && task.startTime <= nowStr && nowStr < task.endTime);

    if (activeTask) {
      if (activeTaskTitle) activeTaskTitle.textContent = activeTask.title;
      if (activeTaskTime) activeTaskTime.textContent = `${_formatTime(activeTask.startTime)} – ${_formatTime(activeTask.endTime)}`;
      activeTaskSection.classList.remove('hidden');
    } else {
      activeTaskSection.classList.add('hidden');
    }
  }

  /* ────────────────────────────────────────────────────────────
     Helpers
     ──────────────────────────────────────────────────────────── */

  function _currentTimeStr() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  function _formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  function _calcDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '—';
    const hours = Math.floor(diff / 60);
    const mins  = diff % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();
