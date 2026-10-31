# Arcade Runner Game (Progressive Web App)

This is an **infinite retro runner game** built using **HTML5, CSS, and JavaScript (Canvas API)**, fully ported to a **Progressive Web App (PWA)**. It demonstrates core arcade game mechanics alongside offline caching, app installability, mobile touch support, and interactive Easter eggs.

## Features

* **Progressive Web App (PWA):**
  * **Installable:** Add to Home Screen on iOS, Android, macOS, Windows, and ChromeOS via Web App Manifest.
  * **100% Offline Capable:** Service worker (`sw.js`) pre-caches core assets and serves static files even without an active internet connection.
  * **Offline Indicator:** Real-time HUD status badge notifying players when running offline.
  * **Responsive & Mobile Ready:** Fullscreen standalone experience with mobile touch/tap support and notch-safe insets.
* **Core Mechanics:** Gravity, jump physics, acceleration, and infinitely spawning obstacles.
* **Scoring System:** Real-time score tracking with local storage to save your highest score.
* **Collectibles:** Gather gold coins as you run.
* **Companion & Humor:** Interactive 8-bit Roast Horse mascot offering witty gameplay commentary, roasts, and debug hints.
* **Dark / White Mode:** Built-in theme switcher with dynamic UI and canvas gradient adaptation.
* **Retro UI:** Arcade-style HUD, pixel font (`Press Start 2P`), custom SVG icons, and dedicated Start/Game Over screens.

## Controls

* **Jump:**
  * **Desktop / Keyboard:** Press `Spacebar` or `ArrowUp`
  * **Mobile / Touchscreen:** Tap anywhere on the game canvas
* **Poke Horse Mascot:** Click/tap the pixel art horse or the "Poke for Hint" button.

## How to Run & Install

1. **Local Play:** Open `index.html` in any modern web browser or serve it via a local web server (e.g., `python -m http.server 8000` or VS Code Live Server).
2. **Install as App:** When opened in Chrome, Edge, Safari, or mobile browsers, click the **"Install App"** button in the HUD or use your browser's install option (**"Install Neon Runner"** or **"Add to Home Screen"**).
