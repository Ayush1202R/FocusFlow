# FocusFlow Project Tasks

This document breaks down the Product Requirements Document (PRD) into atomic, phase-based tasks for development.

## Phase 1: Foundation (Personalized Dashboard) ✅

- [x] **Task 1.1: Project Setup**
  - [x] Initialize project directory structure (`assets/icons/`, `css/`, `js/`).
  - [x] Create `manifest.json` (Manifest V3 format).
  - [x] Configure `manifest.json` to override the new tab page using `chrome_url_overrides.newtab`.
- [x] **Task 1.2: Core UI Skeleton**
  - [x] Create `newtab.html` for the new tab page.
  - [x] Create `css/styles.css` with full design system and link to HTML.
  - [x] Implement responsive layout (Flexbox) with glassmorphism for the dashboard.
- [x] **Task 1.3: Clock & Date**
  - [x] Add DOM elements for the clock and date in `newtab.html`.
  - [x] Write `js/clock.js` to get the current system time.
  - [x] Implement `setInterval` to update the clock UI every second.
  - [x] Format and display the current date (e.g., "Sunday, 13 July 2026").
- [x] **Task 1.4: User Greeting & Name Storage**
  - [x] Add a DOM element for the greeting message.
  - [x] Write logic to determine time of day → "Good Morning" / "Good Afternoon" / "Good Evening".
  - [x] Implement first-launch check: if no user name in `chrome.storage.local`, show onboarding modal.
  - [x] Save the entered name to `chrome.storage.local`.
  - [x] Display the personalized greeting (e.g., "Good Morning, Ayush.").
- [x] **Task 1.5: Wallpaper Management**
  - [x] Add a full-screen background container in `newtab.html`.
  - [x] Create drag-and-drop upload zone with file input fallback.
  - [x] Write `js/wallpaper.js` to process selected image files.
  - [x] Convert image to Base64 data URL and store in `chrome.storage.local`.
  - [x] Load wallpaper from storage on page load and apply as background.

## Phase 2: Daily Focus ✅

- [x] **Task 2.1: Focus UI Setup**
  - [x] Create HTML structure for the Daily Focus section (prompt input + display with label).
  - [x] Apply glassmorphism styling, prominent but unobtrusive, with animations.
- [x] **Task 2.2: Focus State Management**
  - [x] Write JS logic (`js/focus.js`) to check `chrome.storage.local` for a saved focus and its date.
  - [x] If no focus exists for the *current calendar date*, display the input prompt: "What is your main focus today?".
  - [x] Handle input submission (Enter key or button press).
- [x] **Task 2.3: Storage and Display**
  - [x] Save the submitted focus text and current date (YYYY-MM-DD) to storage as `dailyFocus`.
  - [x] Hide the input field and display the saved focus text in a glass card.
- [x] **Task 2.4: Daily Reset Logic**
  - [x] On page load, compare saved focus date with current date.
  - [x] If dates don't match (new day), clear display and re-show the input prompt.

## Phase 3: Task Manager ✅

- [x] **Task 3.1: Task Manager UI**
  - [x] Create glass-card task panel (fixed right side, scrollable).
  - [x] Create "Add" button with plus icon in panel header.
  - [x] Create modal form for adding/editing tasks with Title, Description, Start Time, End Time.
- [x] **Task 3.2: Create and Read Tasks (CR)**
  - [x] Implement form validation (title required, start < end).
  - [x] Generate unique ID via `Date.now()`.
  - [x] Calculate human-readable duration (e.g., "1h 30m").
  - [x] Save tasks array to `chrome.storage.local`.
  - [x] Render task list sorted chronologically by start time.
  - [x] Empty state with calendar icon when no tasks exist.
- [x] **Task 3.3: Update and Delete Tasks (UD)**
  - [x] Checkbox to toggle complete (gradient fill + strikethrough + dim).
  - [x] Edit pencil icon (appears on hover) opens modal pre-filled.
  - [x] Delete button in modal (visible only in edit mode).
- [x] **Task 3.4: Active Task Highlighting**
  - [x] `setInterval` (60s) compares current time against task windows.
  - [x] Active task gets purple border, accent glow, and highlighted time.
  - [x] CSS class `task-item--active` applied automatically.

## Phase 4: Notifications ✅

- [x] **Task 4.1: Reminder Configuration & Permissions**
  - [x] Add `notifications` and `alarms` permissions to `manifest.json`.
  - [x] Define default reminder time (e.g., 5 minutes before end) and store it in `chrome.storage.local`.
  - [x] Request browser notification permissions from the user.
- [x] **Task 4.2: Reminder Trigger Logic**
  - [x] Setup a background script (`background.js`) to handle alarms (using `chrome.alarms`) and interval checks in the main tab.
  - [x] Calculate when the reminder should fire based on the active task's end time and the user's reminder setting.
  - [x] Trigger an event when the reminder time is reached.
- [x] **Task 4.3: Displaying Reminders**
  - [x] Design and implement an HTML/CSS banner that appears inside the New Tab page to show the reminder message.
  - [x] Implement the native browser notification (via `chrome.notifications.create`).
  - [x] Include details in the notification: "Current task ending soon", next task info.
- [x] **Task 4.4: Acknowledgement/Dismissal**
  - [x] Add a close button to the in-tab banner.
  - [x] Write logic to auto-hide the banner/notification after a set timeout (e.g., 15 seconds).

## Phase 5: Focus Mode ✅

- [x] **Task 5.1: Declarative Net Request Setup**
  - [x] Add `declarativeNetRequest`, `declarativeNetRequestWithHostAccess` permissions to `manifest.json`.
  - [x] Add host permissions for the default blocked sites (`<all_urls>`).
  - [x] Configure web accessible resources for dynamic redirect matching.
- [x] **Task 5.2: Focus Mode Toggle & Storage**
  - [x] Create a UI toggle (switch/button) on the dashboard for Focus Mode.
  - [x] Save the toggle state (true/false) to `chrome.storage.local`.
  - [x] Define the default list of blocked domains in a constant variable.
- [x] **Task 5.3: Blocking Logic**
  - [x] In `background.js`, listen for changes to the Focus Mode state.
  - [x] When enabled, use `chrome.declarativeNetRequest.updateDynamicRules` to add rules blocking the specified domains.
  - [x] When disabled, remove those dynamic rules.
- [x] **Task 5.4: Custom Block Page**
  - [x] Create `blocked.html` and `css/blocked.css` (the page users see instead of the blocked site).
  - [x] Design `blocked.html` to include: The motivational quote, the current Daily Focus (fetched from storage), and buttons ("Go Back", "Open New Tab", "Disable Focus Mode").
  - [x] Configure the blocking rules to redirect matched URLs to the local extension `blocked.html` page.
  - [x] Implement logic in `blocked.html` to handle button clicks (e.g., `history.back()` for Go Back).

## Phase 6: Settings ✅

- [x] **Task 6.1: Settings UI Layout**
  - [x] Create a Settings icon on the dashboard.
  - [x] Build a modal overlay for the settings interface.
  - [x] Create navigation tabs/sections: Profile, Wallpaper, Focus Mode/Block List, Notifications.
- [x] **Task 6.2: Profile & Wallpaper Settings**
  - [x] Implement an input field to update the user's name. Update storage on change.
  - [x] Add controls to: Upload a new wallpaper, Remove current wallpaper, Restore default color/gradient.
- [x] **Task 6.3: Block List Management**
  - [x] Build UI to display the current list of blocked sites.
  - [x] Add an input and button to add a new domain to the list.
  - [x] Add delete buttons next to each domain.
  - [x] Wire these changes to update storage and trigger a rule update in `background.js`.
  - [x] Implement simple Import/Export functionality (JSON format) for the block list.
- [x] **Task 6.4: Notification Settings**
  - [x] Build UI (radio-style buttons) to select reminder times: 2m, 5m, 10m, 15m.
  - [x] Save the preference to storage and ensure the reminder logic (Task 4.2) respects the new value.

## Phase 7: Polish ✅

- [x] **Task 7.1: Visual Design & Animations**
  - [x] Apply glassmorphism effects (backdrop-filter: blur, semi-transparent backgrounds).
  - [x] Add CSS transitions for hover states, button clicks, and modal opening/closing.
  - [x] Ensure typography is large, readable, and elegant.
- [x] **Task 7.2: Motivational Quote Integration**
  - [x] Ensure the core motivational quote is placed elegantly on the dashboard where it cannot be accidentally removed.
- [x] **Task 7.3: Responsive & Theme Support**
  - [x] Test and adjust CSS media queries to ensure the dashboard looks good on various window sizes.
  - [x] Ensure text remains readable against various light/dark uploaded wallpapers.
- [x] **Task 7.4: Accessibility & Optimization**
  - [x] Add proper `aria-labels` and ensure the dashboard is navigable.
  - [x] Review performance: Ensure the extension loads quickly (<500ms) by optimizing images and minimizing blocking scripts.
- [x] **Task 7.5: Final Testing**
  - [x] Test offline capabilities (all local resources loaded).
  - [x] Test edge cases (midnight rollover, overlapping task times, missing permissions).
