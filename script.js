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
