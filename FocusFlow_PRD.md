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

Behavior:

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

Add website

Remove website

Import list

Export list

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

Minimal

Glassmorphism cards

Blur effects

Responsive

Large typography

Readable on any wallpaper

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

