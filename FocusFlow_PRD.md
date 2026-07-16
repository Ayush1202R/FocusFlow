# Product Requirements Document (PRD)

# Project
**FocusFlow – Personal Productivity New Tab Chrome Extension**

## Vision
Build a Chrome extension that replaces the default New Tab page with a beautiful, distraction-free productivity dashboard designed to help users focus on their most important work every day.

---

# Goals

- Replace Chrome's default New Tab page.
- Help users identify one primary daily focus.
- Manage daily tasks with scheduled reminders.
- Reduce distractions using website blocking.
- Create a visually pleasing dashboard with personalized wallpaper.
- Store everything locally so the extension works offline.

---

# Core Features

## 1. Personalized Dashboard

### Functional Requirements

Display:

- Full-screen wallpaper
- Greeting:
  - Good Morning
  - Good Afternoon
  - Good Evening
- User name
- Live clock (updates every second)
- Current date

Example:

> Good Morning, Ayush.

### Wallpaper

Requirements:

- Upload image
- Drag & Drop support (optional)
- Preview before saving
- Remove wallpaper
- Restore default wallpaper

Storage:

- Chrome Storage Local

---

## 2. Daily Focus Question

Morning prompt:

> **What is your main focus today?**

`Focus.js` implements this flow:
- Asked once each day
- User enters one sentence
- Stored with today's date
- Visible all day
- Automatically resets the next calendar day
- If not entered:
  - Keep asking until submitted

Example:

Today's Focus

Finish RAG pipeline documentation.

---

## 3. Motivational Statement

Always display this message somewhere on the dashboard:

> **You are going to change your family life. It only requires one person in the family to change the entire family's lifestyle. Let that person be you.**

Requirements:

- Always visible
- Elegant typography
- User cannot accidentally delete it

---

## 4. Task Manager

Each task contains:

- Task title
- Description (optional)
- Start time
- End time
- Duration
- Completed status
- Created timestamp

Functions:

- Add task
- Edit task
- Delete task
- Mark complete
- Sort by time
- Auto-highlight current task

Example:

09:00–10:00 Deep Work

10:00–10:30 Email

11:00–12:00 Study

---

## 5. Task Notifications

When a task is close to ending:

Example:

> Current task is about to end.
> Wrap things up.
> Your next task starts in 5 minutes.

Requirements:

- Banner appears inside New Tab page
- Browser notification (optional if permission granted)
- Configurable reminder (default: 5 minutes before end)
- Notification disappears after acknowledgement or timeout

---

## 6. Focus Mode

Purpose:

Block distracting websites.

Default blocked sites:

- instagram.com
- youtube.com
- linkedin.com
- facebook.com
- x.com
- reddit.com

Requirements:

Toggle:

Focus Mode ON / OFF

When blocked website is opened:

Instead of browser error show custom page.

Example:

Stay focused.

Today's Focus

Finish API integration.

Remember:

You are going to change your family life.
It only requires one person to change your family's future.

Buttons:

- Go Back
- Open New Tab
- Disable Focus Mode (optional confirmation)

Implementation:

Use declarativeNetRequest where possible and extension rules/permissions.

---

## 7. Settings

Settings icon opens modal.

Sections:

### Profile

- Name
- Greeting preview

### Wallpaper

- Upload
- Remove
- Restore default

### Focus Mode

- Enable
- Disable

### Block List

- Add website
- Remove website
- Import list
- Export list

### Notifications

Reminder time:

- 2 minutes
- 5 minutes
- 10 minutes
- Custom

---

# User Flow

## First Launch

1. Install extension
2. Enter name
3. Upload wallpaper (optional)
4. Save

Open dashboard.

---

## Every Morning

Open New Tab

↓

Prompt:

"What is your main focus today?"

↓

User answers

↓

Visible entire day

↓

Reset next day

---

## Task Workflow

Create Task

↓

Assign time

↓

Dashboard highlights active task

↓

Reminder shown

↓

Mark complete

---

## Focus Mode Workflow

Toggle ON

↓

Visit YouTube

↓

Custom focus page appears

↓

User returns to work

---

# Data Model

## User

- name
- wallpaper
- createdAt

## Daily Focus

- date
- text

## Task

- id
- title
- description
- startTime
- endTime
- duration
- completed
- createdAt

## Settings

- blockedSites
- notificationsEnabled
- reminderMinutes
- focusModeEnabled

---

# Storage

Use chrome.storage.local.

Future support:

- chrome.storage.sync

---

# UI Requirements

Theme:

- Minimal
- Glassmorphism cards
- Blur effects
- Responsive
- Large typography
- Readable on any wallpaper

---

# Suggested Tech Stack

- Manifest V3
- HTML
- CSS
- JavaScript or TypeScript
- Chrome Storage API
- Chrome Alarms API
- Notifications API
- Declarative Net Request API

---

# Non-Functional Requirements

- Loads in under 500 ms
- Offline support
- Local-first
- No backend required
- Low memory usage
- Accessible keyboard navigation

---

# Edge Cases

- Invalid wallpaper
- Empty task title
- Overlapping tasks
- Deleted active task
- Time zone changes
- System date changes
- Focus reset after midnight
- Missing notification permissions

---

# Development Phases

## Phase 1 — Foundation

- Manifest V3
- Replace New Tab
- Dashboard layout
- Greeting
- Live clock
- Date
- Name storage
- Wallpaper upload

Deliverable:
Personalized dashboard.

---

## Phase 2 — Daily Focus

- Morning prompt
- Save today's focus
- Reset next day
- Display focus prominently

Deliverable:
Daily focus system.

---

## Phase 3 — Task Manager

- CRUD tasks
- Time allocation
- Active task highlighting
- Completion tracking

Deliverable:
Daily planner.

---

## Phase 4 — Notifications

- Countdown
- Reminder banners
- Browser notifications
- Reminder settings

Deliverable:
Smart task reminders.

---

## Phase 5 — Focus Mode

- Toggle
- Default block list
- Custom block list
- Custom motivational block page

Deliverable:
Distraction blocker.

---

## Phase 6 — Settings

- Profile
- Wallpaper
- Block list
- Notifications

Deliverable:
Complete settings module.

---

## Phase 7 — Polish

- Animations
- Smooth transitions
- Performance optimization
- Accessibility
- Dark/light improvements
- Testing

Deliverable:
Production-ready extension.

---

# Acceptance Criteria

- New Tab fully replaces Chrome default page.
- Daily focus persists only for the current day.
- Tasks can be created, edited, completed and deleted.
- Timed reminders appear reliably.
- Focus Mode blocks configured websites and displays the custom page.
- Settings persist across browser restarts.
- Wallpaper and user name are retained.
- Dashboard remains functional offline.

---

# Extension Upgrades (Assignments 1–9)

This section documents the requirements for adding the extension features from the assignment challenge document.

## 1. Daily Motivational Quote (Assignment 1)
* **What to build**: A short motivational quote displaying below the greeting/focus message on the center dashboard. A new quote rotates in each day. 
* **Details**:
  * Date-based indexing ensures the same quote displays for the entire day.
  * Default list of 30-50 quotes provided automatically.
  * A user-editable quotes manager added under a new "Quotes" settings tab where users can add custom quotes, delete existing ones, or restore defaults.

## 2. Daily Focus Streak Counter (Assignment 2)
* **What to build**: A small, visually attractive streak badge showing consecutive days a focus prompt has been completed.
* **Details**:
  * Increments only on new daily focus submission.
  * Resets to 0 if a calendar day passes without setting a focus.
  * Stores `longestStreak` ever achieved to display in Analytics.

## 3. Dark Mode / Light Mode Toggle (Assignment 3)
* **What to build**: A settings toggle that swaps the dashboard between a light theme and the default dark theme.
* **Details**:
  * Implemented using clean CSS variable overlays.
  * Swapping changes card blurs, borders, text contrast, and panel backdrops without page reload.
  * Theme preference persists in local storage.

## 4. Pomodoro Timer Widget (Assignment 4)
* **What to build**: A Pomodoro timer widget positioned on the left side of the dashboard.
* **Details**:
  * Focus sessions run for 25 minutes, followed by 5-minute break sessions (durations adjustable in Settings).
  * System alerts trigger at the end of each session using Chrome Notifications and audio chimes.
  * Timer counts down in the background even if the browser/tab is closed.

## 5. Wallpaper Gallery & Rotation (Assignment 5)
* **What to build**: Support for uploading and rotating multiple wallpapers.
* **Details**:
  * A thumbnail manager in Settings under "Wallpaper" with delete buttons.
  * Rotation settings: "Rotate on new tab", "Rotate daily", "Rotate hourly", or "Static (no rotation)".
  * Storage is capped at 8 uploads to protect local storage quota limits.

## 6. Task Categories with Colored Tags (Assignment 6)
* **What to build**: Categorization tags for tasks and filters to group lists.
* **Details**:
  * Choose preset categories (Work, Personal, Learning) or add custom categories with custom colors.
  * Tasks display a small tag indicating their category.
  * Filter chips (e.g. "All", "Work", "Personal") sit at the top of the Task panel to filter active lists.

## 7. Focus Mode Schedule (Assignment 7)
* **What to build**: Automated scheduling to auto-enable Focus Mode during set hours.
* **Details**:
  * Users can configure schedule blocks (e.g. 9:00 AM - 12:00 PM) in a new Settings panel.
  * Alarm worker checks time ranges and toggles focus mode active.
  * Manual override allows turning Focus Mode OFF during an active schedule block without auto-re-enabling it until the block ends.

## 8. Daily Focus Time KPI (Assignment 8)
* **What to build**: A dashboard KPI tracker showing total active Focus Mode time today.
* **Details**:
  * Located at the top center of the screen (e.g. "Focused: 2h 45m / 4h Goal").
  * Increments every minute Focus Mode remains enabled and resets at midnight.

## 9. Analytics Dashboard (Assignment 9)
* **What to build**: Fullscreen dashboard overlay for usage logs and progress charts.
* **Details**:
  * Logs task completion counts, focus durations, and blocked domain visits.
  * Displays graphs for the past 7 days, top blocked sites, and streak milestones.
  * Built using custom responsive HTML, SVG, and CSS for offline extension support.
