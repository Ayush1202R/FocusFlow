# FocusFlow — Distraction-Free Productivity Dashboard

[![GitHub license](https://img.shields.io/github/license/Ayush1202R/FocusFlow?style=flat-square)](https://github.com/Ayush1202R/FocusFlow/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/Ayush1202R/FocusFlow?style=flat-square)](https://github.com/Ayush1202R/FocusFlow/graphs/contributors)
[![GitHub issues](https://img.shields.io/github/issues/Ayush1202R/FocusFlow?style=flat-square)](https://github.com/Ayush1202R/FocusFlow/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/Ayush1202R/FocusFlow/pulls)

FocusFlow is a premium, glassmorphic Chrome Extension that replaces your default New Tab page with a beautiful, minimalist productivity dashboard. It helps you stay focused by tracking active study sessions, organizing tasks, and blocking distracting websites.

---

## 🌟 Key Features

* **Minimalist Glassmorphism UI**: Curated dark palettes, Outfit and Inter Google Fonts, and smooth hover micro-animations.
* **Sidebar Study Stopwatch**: Track active study hours in `HH.MM.SS` format. Play, pause, log with custom descriptions, and clear session history.
* **Auto-Session Logger**: Automatically logs task sessions to the queue when they end, or when you mark a task complete.
* **Active Task Panel**: Shows details of the currently running task in the center dashboard.
* **Website Blocker Overlay**: Redirects distracting sites (e.g. YouTube, social media) to a focus-retaining dashboard.
* **Wrap-up Countdowns**: Gives a 5-minute wrapping-up alert before your current task ends to help transition smoothly.

---

## 🛠️ Installation & Setup (For Contributors)

To run FocusFlow locally in your browser for testing and development:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/FocusFlow.git
   ```
2. **Open Extensions Page**:
   Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner.
4. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top-left.
   - Select the directory containing the cloned repository (`Focus_Dashboard-1`).
5. **Open a New Tab**:
   Open a new tab to see your local instance of FocusFlow in action!

---

## 📁 Project Structure

```text
Focus_Dashboard-1/
├── assets/             # Icons and media assets
├── css/                # Styling files
│   ├── blocked.css     # Styles for the blocked site overlay
│   └── styles.css      # Core styles for the New Tab dashboard
├── js/                 # Javascript modules
│   ├── app.js          # Main application initializer
│   ├── background.js   # MV3 service worker (alarms, blocklist rules)
│   ├── blocked.js      # Logic for the blocked site overlay
│   ├── clock.js        # Core clock and greeting logic
│   ├── focusmode.js    # Focus mode toggles
│   ├── greeting.js     # Name greeting and storage synchronization
│   ├── notifications.js# Countdown banners and alerts
│   ├── settings.js     # Settings overlay and blocklist settings
│   ├── storage.js      # Unified local/sync storage wrapper
│   ├── tasks.js        # Task planner list and rendering
│   └── timer.js        # Active study stopwatch & auto-recorder logic
├── blocked.html        # Website blocker overlay markup
└── newtab.html         # Main dashboard page markup
```

---

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
