
# Copilot Instructions

## Repository Overview
This repository contains browser-based retro mini-games built with HTML, CSS, and vanilla JavaScript. Each game is self-contained in its own HTML, JS, and CSS files. No build step or external dependencies are required; serve statically for local development.

## Architecture & Major Components
- **Games:** Each game (Snake, Duck Hunt, Bounce, Tetris) is implemented in its own set of files (e.g., `snake.html`, `snake.js`, `snake.css`).
- **Game Engines:** Core logic is in the JS files, using the HTML5 Canvas API for rendering and direct DOM manipulation for UI overlays and controls.
- **State Management:** High scores and persistent settings use `localStorage` (see `snake.js`, `bounce.js`).
- **Controls:** Keyboard, mouse, and touch events are handled directly in JS. Mobile support includes on-screen D-pads and HUD buttons.
- **Audio:** Uses browser-native audio APIs; no external libraries.

## Developer Workflows
- **Run Locally:** Start a static server (e.g., `python3 -m http.server 8000`) and open the desired game HTML file in your browser.
- **Debugging:** Use browser DevTools for JS debugging and Canvas inspection. No custom debug tooling.
- **Testing:** No formal test suite; manual playtesting is standard. If adding automated tests, place them in a new `tests/` directory and document in README.
- **Commits:** Make small, focused commits with clear messages. Use semantic versioning for releases if tagging.

## Project-Specific Conventions
- **File Structure:** Each game is isolated; avoid cross-file dependencies unless refactoring shared utilities.
- **Naming:** Use descriptive variable and function names reflecting game logic (e.g., `scoreValue`, `levelMap`, `moveAccel`).
- **Comments:** Add comments for complex game logic, physics, or event handling. Simple UI code may be left uncommented.
- **Assets:** All assets (audio, images) should be referenced relative to the HTML file and compatible with static serving.
- **High Scores:** Store per-mode highscores in `localStorage` using unique keys (see `STORAGE_KEY` in `bounce.js`).

## Integration Points & External Dependencies
- No external JS/CSS dependencies; all code is vanilla and self-contained.
- No backend or API integration; all logic runs client-side.

## Examples & Patterns
- **Snake:** Implements level/wall/sound toggles, touch D-pad, and per-mode highscores. See `snake.js` for event handling and state persistence.
- **Duck Hunt:** Tracks accuracy, hits, and misses per round. See `duck.js` for scoring and round logic.
- **Bounce:** Platformer engine with physics constants and tile-based level maps. See `bounce.js` for map structure and camera logic.

## Documentation
- Update `README.md` for new games, features, or developer instructions.
- Document public APIs and interfaces if adding reusable modules.

## General Practices
- Prefer existing patterns and code structure.
- Keep code readable and maintainable.
- Use meaningful branch names for feature development.

---
If any section is unclear or missing, please provide feedback to improve these instructions for future AI agents.
