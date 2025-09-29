<<<<<<< HEAD
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySubtitle = document.getElementById("overlaySubtitle");
const overlayInfo = document.getElementById("overlayInfo");
const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const pauseButton = document.getElementById("pauseButton");
const levelSelect = document.getElementById("levelSelect");
const wallModeButton = document.getElementById("wallModeButton");
const touchControls = document.getElementById("touchControls");
const soundButton = document.getElementById("soundButton");
const pointerCoarseQuery =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)")
    : null;

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const levels = {
  classic: { label: "Classic", speed: 8 },
  turbo: { label: "Turbo", speed: 12 },
  insane: { label: "Insane", speed: 16 }
};
let updateRate = levels.classic.speed; // frames per second
let stepInterval = 1000 / updateRate;
const bestKey = "retro-snake-best-map";
const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 }
};
const touchDirectionMap = {
  up: directions.ArrowUp,
  down: directions.ArrowDown,
  left: directions.ArrowLeft,
  right: directions.ArrowRight
};
const soundPreferenceKey = "retro-snake-sound";
let soundEnabled = true;
try {
  soundEnabled = window.localStorage.getItem(soundPreferenceKey) !== "off";
} catch (error) {
  console.warn("Unable to read sound preference; defaulting to on.", error);
}
let audioContext;
let masterGain;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { ...direction };
let food = {
  x: Math.floor(tileCount / 2),
  y: Math.floor(tileCount / 2)
};
let score;
let currentLevel = "classic";
let wallMode = "wrap";
let bestScores;
try {
  bestScores = JSON.parse(window.localStorage.getItem(bestKey) || "{}");
} catch (error) {
  console.warn("Failed to parse best scores, resetting store.", error);
  bestScores = {};
}
let gameState = "idle"; // idle | running | paused | over
let lastStep = 0;

function getBestKey() {
  return `${currentLevel}-${wallMode}`;
}

function getBestScore() {
  return bestScores[getBestKey()] || 0;
}

function setBestScore(value) {
  bestScores[getBestKey()] = value;
  window.localStorage.setItem(bestKey, JSON.stringify(bestScores));
}

function refreshBestDisplay() {
  bestValue.textContent = getBestScore();
}

setLevel(currentLevel);
updateWallModeButton();
updateTouchControlsVisibility();
updateSoundButton();

drawBoard();
showOverlay(
  "Press Enter to Start",
  "Move with Arrow Keys or WASD",
  `${composeSettingsDetails()} · Press P to Pause · Enter to Restart`
);
updatePauseButtonLabel();

function startGame() {
  updateRate = levels[currentLevel].speed;
  stepInterval = 1000 / updateRate;
  snake = [
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  scoreValue.textContent = score;
  food = spawnFood();
  gameState = "running";
  lastStep = 0;
  if (soundEnabled) {
    ensureAudioContext();
  }
  hideOverlay();
  updatePauseButtonLabel();
}

function togglePause() {
  if (gameState === "running") {
    gameState = "paused";
    showOverlay("Paused", "Press P or the button to resume", composeSettingsDetails());
    updatePauseButtonLabel();
  } else if (gameState === "paused") {
    gameState = "running";
    hideOverlay();
    updatePauseButtonLabel();
  }
}

function endGame() {
  gameState = "over";
  showOverlay("Game Over", `Score: ${score}`, `${composeSettingsDetails()} · Press Enter to try again`);
  if (score > getBestScore()) {
    setBestScore(score);
    refreshBestDisplay();
  }
  updatePauseButtonLabel();
  playGameOverSound();
}

function spawnFood() {
  const available = [];
  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        available.push({ x, y });
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

function update() {
  direction = nextDirection;
  let headX = snake[0].x + direction.x;
  let headY = snake[0].y + direction.y;

  if (wallMode === "wrap") {
    headX = (headX + tileCount) % tileCount;
    headY = (headY + tileCount) % tileCount;
  } else if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
    endGame();
    return;
  }

  const head = { x: headX, y: headY };

  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreValue.textContent = score;
    food = spawnFood();
    playEatSound();
  } else {
    snake.pop();
  }
}

function drawBoard() {
  ctx.fillStyle = "#0b1021";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  if (food) {
    drawFood();
  }
  if (snake.length > 0) {
    drawSnake();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#54f7a5" : "#1fd36b";
    ctx.shadowColor = "rgba(84, 247, 165, 0.4)";
    ctx.shadowBlur = index === 0 ? 12 : 2;
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
  });
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

function drawFood() {
  ctx.fillStyle = "#ff6b6b";
  ctx.shadowColor = "rgba(255, 107, 107, 0.6)";
  ctx.shadowBlur = 16;
  const x = food.x * gridSize + 3;
  const y = food.y * gridSize + 3;
  const size = gridSize - 6;
  const radius = 4;

  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, size, size);
  }
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

function showOverlay(title, subtitle, info) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle || "";
  overlayInfo.textContent = info || "";
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function handleDirectionChange(newDirection) {
  if (!newDirection) return;

  const isOpposite =
    direction &&
    newDirection.x === -direction.x &&
    newDirection.y === -direction.y;

  if (isOpposite && snake.length > 1) {
    return;
  }

  nextDirection = newDirection;
}

function updatePauseButtonLabel() {
  if (gameState === "running") {
    pauseButton.textContent = "Pause";
  } else if (gameState === "paused") {
    pauseButton.textContent = "Resume";
  } else {
    pauseButton.textContent = "Start";
  }
}

function updateWallModeButton() {
  if (!wallModeButton) return;
  const label = wallMode === "wrap" ? "Walls: Wrap" : "Walls: Solid";
  wallModeButton.textContent = label;
  wallModeButton.setAttribute("aria-pressed", String(wallMode === "solid"));
}

function setLevel(levelKey) {
  if (!levels[levelKey]) {
    return;
  }
  currentLevel = levelKey;
  if (levelSelect) {
    levelSelect.value = currentLevel;
  }
  updateRate = levels[currentLevel].speed;
  stepInterval = 1000 / updateRate;
  lastStep = 0;
  refreshBestDisplay();
  refreshOverlayForCurrentState();
}

function toggleWallModeSetting() {
  wallMode = wallMode === "wrap" ? "solid" : "wrap";
  updateWallModeButton();
  refreshBestDisplay();
  lastStep = 0;
  refreshOverlayForCurrentState();
}

function composeSettingsDetails() {
  const levelLabel = levels[currentLevel].label;
  const wallLabel = wallMode === "wrap" ? "Wrap" : "Solid";
  const soundLabel = soundEnabled ? "Sound On" : "Sound Off";
  return `Level: ${levelLabel} · Walls: ${wallLabel} · ${soundLabel}`;
}

function refreshOverlayForCurrentState() {
  if (overlay.classList.contains("hidden")) {
    return;
  }
  if (gameState === "paused") {
    showOverlay("Paused", "Press P or the button to resume", composeSettingsDetails());
  } else if (gameState === "over") {
    showOverlay(
      "Game Over",
      `Score: ${score}`,
      `${composeSettingsDetails()} · Press Enter to try again`
    );
  } else if (gameState === "idle") {
    showOverlay(
      "Press Enter to Start",
      "Move with Arrow Keys or WASD",
      `${composeSettingsDetails()} · Press P to Pause · Enter to Restart`
    );
  }
}

function updateTouchControlsVisibility() {
  if (!touchControls) return;
  const shouldShow =
    (pointerCoarseQuery && pointerCoarseQuery.matches) || window.innerWidth <= 560;
  if (shouldShow) {
    touchControls.classList.add("visible");
    touchControls.setAttribute("aria-hidden", "false");
  } else {
    touchControls.classList.remove("visible");
    touchControls.setAttribute("aria-hidden", "true");
  }
}

function handleTouchControl(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (event.type === "click" && target.dataset.skipClick === "true") {
    target.removeAttribute("data-skip-click");
    return;
  }
  if (event.type === "pointerdown") {
    target.dataset.skipClick = "true";
    window.setTimeout(() => {
      target.removeAttribute("data-skip-click");
    }, 0);
  }
  const directionKey = target.dataset.direction;
  if (!directionKey) {
    return;
  }
  if (event.type === "pointerdown") {
    event.preventDefault();
  }
  if (soundEnabled) {
    ensureAudioContext();
  }
  const mappedDirection = touchDirectionMap[directionKey];
  if (mappedDirection) {
    handleDirectionChange(mappedDirection);
  }
}

function ensureAudioContext() {
  if (typeof window.AudioContext !== "function" && typeof window.webkitAudioContext !== "function") {
    return null;
  }
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = soundEnabled ? 0.18 : 0;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  if (masterGain) {
    masterGain.gain.setValueAtTime(soundEnabled ? 0.18 : 0, audioContext.currentTime);
  }
  return audioContext;
}

function updateSoundButton() {
  if (!soundButton) return;
  const label = soundEnabled ? "Sound: On" : "Sound: Off";
  soundButton.textContent = label;
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try {
    window.localStorage.setItem(soundPreferenceKey, soundEnabled ? "on" : "off");
  } catch (error) {
    console.warn("Unable to persist sound preference.", error);
  }
  ensureAudioContext();
  updateSoundButton();
  refreshOverlayForCurrentState();
}

function playTone(frequency, duration = 0.18, type = "square") {
  if (!soundEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.05);
}

function playEatSound() {
  playTone(660, 0.12, "square");
  setTimeout(() => playTone(880, 0.1, "square"), 40);
}

function playGameOverSound() {
  if (!soundEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(440, now);
  oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.6);

  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(now);
  oscillator.stop(now + 0.7);
}

let animationFrame;

function loop(timestamp) {
  animationFrame = window.requestAnimationFrame(loop);
  if (gameState !== "running") return;

  if (timestamp - lastStep < stepInterval) return;
  lastStep = timestamp;

  update();
  if (gameState === "running") {
    drawBoard();
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    if (gameState === "idle" || gameState === "over") {
      startGame();
      return;
    }

    if (gameState === "paused") {
      togglePause();
      return;
    }
  }

  if (event.code === "KeyP") {
    if (gameState === "running" || gameState === "paused") {
      togglePause();
    }
    return;
  }

  handleDirectionChange(directions[event.code]);
});

if (levelSelect) {
  levelSelect.addEventListener("change", (event) => {
    const value = event.target && typeof event.target.value === "string" ? event.target.value : null;
    if (value) {
      setLevel(value);
    }
  });
}

if (wallModeButton) {
  wallModeButton.addEventListener("click", () => {
    toggleWallModeSetting();
  });
}

if (touchControls) {
  touchControls.addEventListener("pointerdown", handleTouchControl);
  touchControls.addEventListener("click", handleTouchControl);
}

if (soundButton) {
  soundButton.addEventListener("click", () => {
    toggleSound();
  });
}

const touchMediaChangeHandler = () => updateTouchControlsVisibility();

if (pointerCoarseQuery) {
  if (typeof pointerCoarseQuery.addEventListener === "function") {
    pointerCoarseQuery.addEventListener("change", touchMediaChangeHandler);
  } else if (typeof pointerCoarseQuery.addListener === "function") {
    pointerCoarseQuery.addListener(touchMediaChangeHandler);
  }
}

window.addEventListener("resize", updateTouchControlsVisibility);

pauseButton.addEventListener("click", () => {
  if (gameState === "idle" || gameState === "over") {
    startGame();
    return;
  }
  if (gameState === "running" || gameState === "paused") {
    togglePause();
  }
});

window.addEventListener("blur", () => {
  if (gameState === "running") {
    togglePause();
  }
});

window.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState === "running") {
    togglePause();
  }
});

animationFrame = window.requestAnimationFrame(loop);

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrame);
});
=======
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.gameMessage = document.getElementById('gameMessage');
        this.startMessage = document.getElementById('startMessage');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.gameRunning = false;
        this.gameStarted = false;
        this.isPaused = false;
        
        this.updateHighScoreDisplay();
        this.generateFood();
        this.setupEventListeners();
        this.showStartScreen();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameStarted || !this.gameRunning) {
                    this.startGame();
                } else if (this.isPaused) {
                    this.resumeGame();
                }
            } else if (e.code === 'KeyP' && this.gameRunning) {
                this.togglePause();
            } else if (this.gameRunning && !this.isPaused) {
                this.handleInput(e);
            }
        });
    }
    
    handleInput(e) {
        const LEFT_KEY = ['ArrowLeft', 'KeyA'];
        const RIGHT_KEY = ['ArrowRight', 'KeyD'];
        const UP_KEY = ['ArrowUp', 'KeyW'];
        const DOWN_KEY = ['ArrowDown', 'KeyS'];
        
        if (LEFT_KEY.includes(e.code) && this.dx !== 1) {
            this.dx = -1;
            this.dy = 0;
        } else if (UP_KEY.includes(e.code) && this.dy !== 1) {
            this.dx = 0;
            this.dy = -1;
        } else if (RIGHT_KEY.includes(e.code) && this.dx !== -1) {
            this.dx = 1;
            this.dy = 0;
        } else if (DOWN_KEY.includes(e.code) && this.dy !== -1) {
            this.dx = 0;
            this.dy = 1;
        }
    }
    
    startGame() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = true;
        this.gameStarted = true;
        this.isPaused = false;
        this.updateScore();
        this.generateFood();
        this.hideOverlay();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showPauseScreen();
        } else {
            this.hideOverlay();
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        this.hideOverlay();
    }
    
    showStartScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.startMessage.classList.remove('hidden');
        this.gameMessage.classList.add('hidden');
    }
    
    showGameOverScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.gameMessage.classList.remove('hidden');
        this.startMessage.classList.add('hidden');
        this.gameMessage.innerHTML = `
            <h2>GAME OVER</h2>
            <p>Final Score: ${this.score}</p>
            <p>Press SPACE to restart</p>
        `;
    }
    
    showPauseScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.gameMessage.classList.remove('hidden');
        this.startMessage.classList.add('hidden');
        this.gameMessage.innerHTML = `
            <h2>PAUSED</h2>
            <p>Press SPACE to continue</p>
        `;
    }
    
    hideOverlay() {
        this.gameOverlay.classList.add('hidden');
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    update() {
        if (!this.gameRunning || this.isPaused) return;
        
        // Don't move if no direction is set (snake hasn't started moving yet)
        if (this.dx === 0 && this.dy === 0) return;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
            this.playEatSound();
        } else {
            this.snake.pop();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.updateHighScore();
        this.showGameOverScreen();
        this.playGameOverSound();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
    
    draw() {
        // Clear canvas with retro grid effect
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid
        this.ctx.strokeStyle = '#003300';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw food with glow effect
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        
        // Reset shadow for snake
        this.ctx.shadowBlur = 0;
        
        // Draw snake with gradient and glow
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#00ff41';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = '#00ff41';
            } else {
                // Snake body with gradient effect
                const intensity = Math.max(0.3, 1 - (index * 0.1));
                this.ctx.fillStyle = `rgba(0, 255, 65, ${intensity})`;
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#00ff41';
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    // Simple sound effects using Web Audio API
    playEatSound() {
        this.playTone(800, 0.1);
    }
    
    playGameOverSound() {
        this.playTone(200, 0.5);
    }
    
    playTone(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // Fallback if Web Audio API is not supported
            console.log('Audio not supported');
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        setTimeout(() => this.gameLoop(), 150); // Game speed
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
>>>>>>> 75159e6f5b08e4ebf35b706155a96a3cc2866183
