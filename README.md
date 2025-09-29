# Snake Game 🐍

A retro-style Snake game built with HTML5 Canvas and JavaScript. Features a neon green aesthetic with sound effects and high score tracking.

## 🚀 Quick Start with GitHub Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/arunvs830/agent)

1. Click the "Open in GitHub Codespaces" badge above
2. Wait for the container to build and start
3. Run `npm start` in the terminal
4. The game will automatically open in your browser!

## 🕹️ How to Play

- Use **Arrow Keys** or **WASD** to move the snake
- Press **SPACE** to start the game or restart after game over
- Press **P** to pause/unpause the game
- Eat the red food to grow and increase your score
- Avoid hitting the walls or your own tail!

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or higher)
- A modern web browser

### Setup
```bash
# Clone the repository
git clone https://github.com/arunvs830/agent.git
cd agent

# Install dependencies
npm install

# Start the development server
npm start
```

### Alternative: Simple HTTP Server
If you don't want to use Node.js, you can serve the files with Python:
```bash
# Python 3
python3 -m http.server 8080

# Then open http://localhost:8080 in your browser
```

## 📁 Project Structure

```
├── index.html          # Main HTML file
├── script.js           # Game logic and Snake class
├── style.css           # Retro styling and animations
├── package.json        # Dependencies and scripts
└── .devcontainer/      # CodeSpace configuration
    └── devcontainer.json
```

## ✨ Features

- **Retro Neon Aesthetic**: Green glow effects and matrix-style colors
- **Sound Effects**: Eat and game over sounds using Web Audio API
- **High Score Tracking**: Persistent high scores using localStorage
- **Responsive Design**: Works on different screen sizes
- **Pause Functionality**: Pause and resume the game
- **Smooth Animations**: CSS animations for the title and effects

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| ↑ ↓ ← → | Move snake |
| W A S D | Alternative movement |
| SPACE | Start/Restart game |
| P | Pause/Unpause |

## 🔧 Customization

You can easily customize the game by modifying:
- **Game speed**: Change the timeout in `gameLoop()` method
- **Colors**: Update CSS custom properties in `style.css`
- **Grid size**: Modify `gridSize` property in the SnakeGame class
- **Sound effects**: Adjust frequencies in `playEatSound()` and `playGameOverSound()`

## 📱 Browser Compatibility

This game works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- Web Audio API (for sound effects)
- localStorage (for high scores)

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!