# Retro Snake

A browser-based retro snake game built with HTML, CSS, and vanilla JavaScript. Features a neon-infused aesthetic, smooth grid movement, pause/resume controls, and persistent high scores stored in the browser.

## Play locally

1. From the repository root, start a simple static server:

	```bash
	python3 -m http.server 8000
	```

2. Open your browser to <http://localhost:8000> and launch `index.html`.

> **Tip:** You can also open `index.html` directly in your browser, but running a local server avoids issues with certain browser security restrictions.

## Controls

- **Arrow Keys / WASD** — steer the snake
- **Enter** — start a new round or restart after game over
- **P** or **Pause/Resume button** — toggle pause state

High scores are stored locally in `localStorage`, so you can chase your personal best between sessions.