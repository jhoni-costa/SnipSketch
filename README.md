# SnipSketch 📸

<p align="center">
  <b>Capture beautiful code screenshots and annotate them in real time — like Lightshot for VS Code.</b>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=jhoni-costa.snipsketch"><img src="https://img.shields.io/visual-studio-marketplace/v/jhoni-costa.snipsketch?style=flat-square&color=0a84ff&label=VS%20Code%20Marketplace" alt="Marketplace Version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=jhoni-costa.snipsketch"><img src="https://img.shields.io/visual-studio-marketplace/i/jhoni-costa.snipsketch?style=flat-square&color=30d158" alt="Installs"></a>
  <a href="https://github.com/jhoni-costa/SnipSketch/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
</p>

---

**SnipSketch** brings the speed and convenience of screenshot annotation tools like **Lightshot** and **CleanShot X** natively into your coding workflow. Select code in any file, capture it with beautiful syntax highlighting and macOS window controls, and annotate it on the fly with arrows, shapes, text, step badges, and blur redaction.

---

## ✨ Features

- ⚡ **Instant Code Capture**: Select any block of code and press `Cmd+Alt+C` (Mac) or `Ctrl+Alt+C` (Windows/Linux).
- ↗️ **Precision Vector Arrows**: Point out bugs, variables, and lines with razor-sharp mathematical arrows.
- ⬜ **Rectangles & Ellipses**: Highlight logic branches, parameters, or functions with clean geometric frames.
- ✏️ **Smooth Freehand Pen**: Draw curves interpolated with Bézier smoothing — no jagged lines.
- 🖍️ **Highlighter Tool**: Semi-transparent marker to emphasize key syntax without obscuring code.
- 🔤 **Text Annotations**: Add notes and explanations with contrast-enhancing background cards.
- 🔢 **Step Counter Badges**: Click to stamp incremental steps (`1`, `2`, `3`...) — perfect for tutorials and code reviews.
- ⬛ **Blur / Redact Tool**: Pixelate API keys, passwords, and sensitive client data before sharing.
- 📋 **One-Click Clipboard Export**: Copy high-DPI (Retina 2x) PNGs directly to your clipboard for Slack, Discord, PRs, or Notion.
- 💾 **Save to File**: Export directly as crisp PNG images to your disk or workspace.
- ↩️ **Full History (Undo / Redo)**: Seamless `Cmd+Z` / `Cmd+Y` support for every stroke and shape.

---

## 🚀 Quick Start (3 Steps)

1. **Select Code**: Highlight any code in your active editor.
2. **Capture**: 
   - Press `Cmd + Alt + C` (Mac) or `Ctrl + Alt + C` (Windows/Linux)
   - Or right-click and choose **SnipSketch: Capture Selected Code**.
3. **Annotate & Share**: Draw arrows, add comments, and click **Copy** to paste anywhere!

---

## ⌨️ Keyboard Shortcuts

### Extension Hotkeys
| Action | macOS | Windows / Linux |
|---|---|---|
| **Capture Selected Code** | `Cmd + Alt + C` | `Ctrl + Alt + C` |
| **Open Screenshot Editor** | Command Palette | Command Palette |

### Canvas Editor Shortcuts
| Key | Tool / Action |
|:---:|---|
| <kbd>V</kbd> | **Select / Move** (drag shapes, delete with Backspace/Delete) |
| <kbd>A</kbd> | **Arrow** (directional vector) |
| <kbd>R</kbd> | **Rectangle** (rounded box) |
| <kbd>E</kbd> | **Ellipse** (circle) |
| <kbd>P</kbd> | **Pen** (smooth freehand drawing) |
| <kbd>H</kbd> | **Highlighter** (translucent highlighter stroke) |
| <kbd>T</kbd> | **Text** (click to type on canvas) |
| <kbd>S</kbd> | **Step Badge** (click to drop numbered 1, 2, 3... badges) |
| <kbd>B</kbd> | **Blur** (pixelate sensitive secrets/tokens) |
| <kbd>Cmd/Ctrl + Z</kbd> | **Undo** |
| <kbd>Cmd/Ctrl + Y</kbd> | **Redo** |

---

## ⚙️ Configuration Settings

Customize SnipSketch in your VS Code settings (`Preferences` -> `Settings` -> search `SnipSketch`):

| Setting | Default | Description |
|---|---|---|
| `snipsketch.showLineNumbers` | `true` | Show synchronized line numbers on the code card |
| `snipsketch.showWindowControls` | `true` | Show macOS traffic light buttons (🔴🟡🟢) |
| `snipsketch.padding` | `32` | Outer canvas padding around code card (px) |
| `snipsketch.fontFamily` | `"JetBrains Mono, Fira Code..."` | Monospace font family for code rendering |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
