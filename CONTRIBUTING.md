# Contributing to FocusFlow

First off, thank you for taking the time to contribute! It is people like you who make FocusFlow such an amazing productivity tool for everyone.

Please read our contribution guidelines below to ensure a smooth collaboration process.

---

## 🛠️ Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/FocusFlow.git
   ```
3. Create a new branch for your work:
   - For bug fixes: `fix/issue-description`
   - For features: `feat/feature-name`
   - For documentation: `docs/documentation-update`

---

## 📝 Coding Standards & Guidelines

To maintain a clean and consistent codebase:

### JavaScript
- Use clean, modular, and self-documenting code.
- Always use `const` and `let` (never `var`).
- Keep scripts modular (avoid putting unrelated logic in the same file).
- Bulletproof your storage fetches and background runtime calls with `try-catch` blocks.
- Adhere to the default Extension CSP: **No inline scripts** in HTML files.

### CSS
- Use modern CSS variables (declared in `:root`) for color palettes and margins.
- Adhere to the established **glassmorphic design tokens** (vibrant borders, translucent card backgrounds, smooth scaling hover transitions).
- Keep layouts fully responsive across desktop resolutions.

---

## 📬 Submitting a Pull Request

1. Push your changes to your feature branch on your fork:
   ```bash
   git push origin feat/AmazingFeature
   ```
2. Open a **Pull Request (PR)** against our `main` branch.
3. Make sure to fill out the Pull Request template completely so reviewers can understand your work.
4. Once the review is approved and all checks pass, your changes will be merged!
