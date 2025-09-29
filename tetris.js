const canvas = document.getElementById("tetrisCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("holdCanvas");
const holdCtx = holdCanvas.getContext("2d");

const statusBanner = document.getElementById("statusBanner");
const statusTitle = document.getElementById("statusTitle");
const statusSubtitle = document.getElementById("statusSubtitle");
const startButton = document.getElementById("startButton");

const scoreValue = document.getElementById("scoreValue");
const linesValue = document.getElementById("linesValue");
const levelValue = document.getElementById("levelValue");
const bestValue = document.getElementById("bestValue");

const STORAGE_KEY = "retro-arcade-tetris-best";
const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const CELL_SIZE = canvas.width / BOARD_COLS;

const LINE_SCORES = [0, 100, 300, 500, 800];
const SOFT_DROP_BONUS = 1;
const HARD_DROP_BONUS = 2;

const TETROMINO_DATA = {
  I: {
    color: "#2ad7ff",
    glow: "rgba(42, 215, 255, 0.55)",
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  J: {
    color: "#2b67ff",
    glow: "rgba(43, 103, 255, 0.55)",
    matrix: [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  L: {
    color: "#ff9f1c",
    glow: "rgba(255, 159, 28, 0.55)",
    matrix: [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  O: {
    color: "#ffe45e",
    glow: "rgba(255, 228, 94, 0.55)",
    matrix: [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  S: {
    color: "#06d6a0",
    glow: "rgba(6, 214, 160, 0.55)",
    matrix: [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  T: {
    color: "#c77dff",
    glow: "rgba(199, 125, 255, 0.55)",
    matrix: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  Z: {
    color: "#ff3cac",
    glow: "rgba(255, 60, 172, 0.55)",
    matrix: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  }
};

const KICKS_STANDARD = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 2, y: 0 },
  { x: -2, y: 0 },
  { x: 0, y: 1 }
];

const KICKS_I = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 }
];

const pieceRotations = {};

for (const [key, data] of Object.entries(TETROMINO_DATA)) {
  pieceRotations[key] = generateRotations(data.matrix);
}

const state = {
  board: createEmptyBoard(),
  current: null,
  queue: [],
  hold: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 1,
  best: 0,
  status: "idle",
  dropAccumulator: 0,
  softDrop: false
};

let lastTimestamp = 0;

function createEmptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

function generateRotations(matrix) {
  const coords = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if (matrix[y][x]) {
        coords.push({ x, y });
      }
    }
  }
  const rotations = [];
  for (let rot = 0; rot < 4; rot += 1) {
    rotations.push(coords.map((point) => rotatePoint(point, rot)));
  }
  return rotations.map((rotation) => rotation.map((point) => ({ x: point.x, y: point.y })));
}

function rotatePoint(point, times) {
  let { x, y } = point;
  const pivot = 1.5;
  for (let i = 0; i < times; i += 1) {
    const relX = x - pivot;
    const relY = y - pivot;
    const rotatedX = pivot + relY;
    const rotatedY = pivot - relX;
    x = Math.round(rotatedX * 100) / 100;
    y = Math.round(rotatedY * 100) / 100;
  }
  return { x: Math.round(x), y: Math.round(y) };
}

function loadBestScore() {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  state.best = Number.isFinite(stored) && stored > 0 ? stored : 0;
}

function saveBestScore() {
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.best));
  }
}

function updateHud() {
  scoreValue.textContent = state.score.toString().padStart(6, "0");
  linesValue.textContent = state.lines.toString().padStart(3, "0");
  levelValue.textContent = state.level.toString().padStart(2, "0");
  bestValue.textContent = state.best.toString().padStart(6, "0");
}

function showBanner(title, subtitle, buttonLabel = "Start") {
  statusTitle.textContent = title;
  statusSubtitle.textContent = subtitle;
  startButton.textContent = buttonLabel;
  statusBanner.classList.remove("hidden");
}

function hideBanner() {
  statusBanner.classList.add("hidden");
}

function getPieceCells(type, rotation) {
  return pieceRotations[type][rotation];
}

function spawnPiece() {
  refillQueue();
  const type = state.queue.shift();
  const piece = {
    type,
    rotation: 0,
    x: 3,
    y: type === "I" ? -1 : -2
  };
  if (collides(piece)) {
    state.current = null;
    endGame();
    return;
  }
  state.current = piece;
  state.canHold = true;
}

function refillQueue() {
  const bag = Object.keys(TETROMINO_DATA);
  while (state.queue.length < 6) {
    const shuffled = shuffle([...bag]);
    state.queue.push(...shuffled);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function collides(piece, offsetX = 0, offsetY = 0, rotation = piece.rotation) {
  const cells = getPieceCells(piece.type, rotation);
  for (const cell of cells) {
    const x = piece.x + cell.x + offsetX;
    const y = piece.y + cell.y + offsetY;
    if (x < 0 || x >= BOARD_COLS) {
      return true;
    }
    if (y >= BOARD_ROWS) {
      return true;
    }
    if (y >= 0 && state.board[y][x]) {
      return true;
    }
  }
  return false;
}

function movePiece(dx, dy) {
  if (!state.current) {
    return;
  }
  if (!collides(state.current, dx, dy)) {
    state.current.x += dx;
    state.current.y += dy;
    return true;
  }
  return false;
}

function rotatePiece(direction) {
  if (!state.current) {
    return;
  }
  const piece = state.current;
  const kicks = piece.type === "I" ? KICKS_I : piece.type === "O" ? [{ x: 0, y: 0 }] : KICKS_STANDARD;
  const newRotation = (piece.rotation + direction + 4) % 4;
  for (const kick of kicks) {
    if (!collides(piece, kick.x, kick.y, newRotation)) {
      piece.x += kick.x;
      piece.y += kick.y;
      piece.rotation = newRotation;
      return true;
    }
  }
  return false;
}

function hardDrop() {
  if (!state.current) {
    return;
  }
  let distance = 0;
  while (movePiece(0, 1)) {
    distance += 1;
  }
  if (distance > 0) {
    state.score += distance * HARD_DROP_BONUS;
  }
  state.softDrop = false;
  lockPiece();
}

function softDrop(active) {
  state.softDrop = active;
}

function lockPiece() {
  if (!state.current) {
    return;
  }
  const { type } = state.current;
  const cells = getPieceCells(type, state.current.rotation);
  for (const cell of cells) {
    const x = state.current.x + cell.x;
    const y = state.current.y + cell.y;
    if (y < 0) {
      endGame();
      return;
    }
    state.board[y][x] = type;
  }
  state.softDrop = false;
  state.dropAccumulator = 0;
  clearLines();
  saveBestScore();
  spawnPiece();
}

function clearLines() {
  let cleared = 0;
  for (let y = BOARD_ROWS - 1; y >= 0; y -= 1) {
    if (state.board[y].every(Boolean)) {
      state.board.splice(y, 1);
      state.board.unshift(Array(BOARD_COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared > 0) {
    state.lines += cleared;
    const lineScore = LINE_SCORES[cleared] || 0;
    state.score += lineScore * state.level;
    state.level = Math.min(20, Math.floor(state.lines / 10) + 1);
  }
}

function holdPiece() {
  if (!state.current || !state.canHold) {
    return;
  }
  const currentType = state.current.type;
  if (state.hold) {
    const temp = state.hold;
    state.hold = currentType;
    state.current = {
      type: temp,
      rotation: 0,
      x: 3,
      y: temp === "I" ? -1 : -2
    };
    if (collides(state.current)) {
      endGame();
      return;
    }
  } else {
    state.hold = currentType;
    spawnPiece();
  }
  state.canHold = false;
}

function step(delta) {
  if (state.status !== "running") {
    return;
  }
  const interval = getDropInterval();
  state.dropAccumulator += delta;
  const softDropInterval = interval * 0.1;
  const target = state.softDrop ? softDropInterval : interval;
  while (state.dropAccumulator >= target) {
    if (!movePiece(0, 1)) {
      lockPiece();
    }
    if (state.softDrop && state.status === "running") {
      state.score += SOFT_DROP_BONUS;
    }
    state.dropAccumulator -= target;
  }
}

function getDropInterval() {
  return Math.max(0.08, 0.8 - (state.level - 1) * 0.07);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawGhostPiece();
  drawCurrentPiece();
  updateHud();
  drawNextPreview();
  drawHoldPreview();
}

function drawBoard() {
  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLS; x += 1) {
      const cell = state.board[y][x];
      if (cell) {
        drawCell(x, y, TETROMINO_DATA[cell].color, TETROMINO_DATA[cell].glow);
      }
    }
  }
}

function drawCurrentPiece() {
  if (!state.current) {
    return;
  }
  const cells = getPieceCells(state.current.type, state.current.rotation);
  for (const cell of cells) {
    const x = state.current.x + cell.x;
    const y = state.current.y + cell.y;
    if (y >= 0) {
      const { color, glow } = TETROMINO_DATA[state.current.type];
      drawCell(x, y, color, glow);
    }
  }
}

function drawGhostPiece() {
  if (!state.current) {
    return;
  }
  const ghost = { ...state.current };
  while (!collides(ghost, 0, 1)) {
    ghost.y += 1;
  }
  const cells = getPieceCells(ghost.type, ghost.rotation);
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (const cell of cells) {
    const x = ghost.x + cell.x;
    const y = ghost.y + cell.y;
    if (y >= 0) {
      drawCell(x, y, TETROMINO_DATA[ghost.type].color, TETROMINO_DATA[ghost.type].glow, true);
    }
  }
  ctx.restore();
}

function drawCell(x, y, color, glow, skipStroke = false) {
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;
  const gradient = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  gradient.addColorStop(0, lighten(color, 0.2));
  gradient.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = gradient;
  ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  if (!skipStroke) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
  }

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(px + 6, py + CELL_SIZE - 10, CELL_SIZE - 12, 6);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }
}

function lighten(color, amount) {
  return mixColor(color, amount);
}

function darken(color, amount) {
  return mixColor(color, -amount);
}

function mixColor(color, amount) {
  const rgb = color.replace("#", "");
  const num = parseInt(rgb, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  if (amount >= 0) {
    r = clamp(Math.round(r + (255 - r) * amount), 0, 255);
    g = clamp(Math.round(g + (255 - g) * amount), 0, 255);
    b = clamp(Math.round(b + (255 - b) * amount), 0, 255);
  } else {
    const factor = 1 + amount;
    r = clamp(Math.round(r * factor), 0, 255);
    g = clamp(Math.round(g * factor), 0, 255);
    b = clamp(Math.round(b * factor), 0, 255);
  }

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawNextPreview() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!state.queue.length) {
    return;
  }
  drawMiniPiece(nextCtx, nextCanvas, state.queue[0]);
}

function drawHoldPreview() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!state.hold) {
    return;
  }
  drawMiniPiece(holdCtx, holdCanvas, state.hold);
}

function drawMiniPiece(context, canvasElement, type) {
  const cells = getPieceCells(type, 0);
  const size = canvasElement.width;
  const scale = size / 6;
  const offsetX = size / 2;
  const offsetY = size / 2;
  context.save();
  context.translate(offsetX, offsetY);
  context.clearRect(-size / 2, -size / 2, size, size);
  for (const cell of cells) {
    const x = (cell.x - 1.5) * scale;
    const y = (cell.y - 1.5) * scale;
    const width = scale;
    const height = scale;
    const px = Math.round(x - width / 2);
    const py = Math.round(y - height / 2);
    const gradient = context.createLinearGradient(px, py, px, py + scale);
    gradient.addColorStop(0, lighten(TETROMINO_DATA[type].color, 0.18));
    gradient.addColorStop(1, darken(TETROMINO_DATA[type].color, 0.18));
    context.fillStyle = gradient;
    context.fillRect(px + 4, py + 4, scale - 8, scale - 8);
    context.strokeStyle = "rgba(255, 255, 255, 0.24)";
    context.strokeRect(px + 3.5, py + 3.5, scale - 7, scale - 7);
  }
  context.restore();
}

function update(time) {
  if (!lastTimestamp) {
    lastTimestamp = time;
  }
  const delta = (time - lastTimestamp) / 1000;
  lastTimestamp = time;
  step(delta);
  draw(delta);
  requestAnimationFrame(update);
}

function startGame() {
  state.board = createEmptyBoard();
  state.queue = [];
  state.hold = null;
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.dropAccumulator = 0;
  state.softDrop = false;
  state.current = null;
  state.status = "running";
  hideBanner();
  refillQueue();
  spawnPiece();
}

function endGame() {
  state.status = "over";
  state.current = null;
  state.softDrop = false;
  state.dropAccumulator = 0;
  saveBestScore();
  updateHud();
  showBanner("Game Over", `Score: ${state.score.toString().padStart(6, "0")}`, "Restart");
}

function pauseGame() {
  if (state.status !== "running") {
    return;
  }
  state.status = "paused";
  showBanner("Paused", "Press Start or P to resume", "Resume");
}

function resumeGame() {
  if (state.status !== "paused") {
    return;
  }
  state.status = "running";
  hideBanner();
}

function togglePause() {
  if (state.status === "running") {
    pauseGame();
  } else if (state.status === "paused") {
    resumeGame();
  }
}

function handleStartButton() {
  if (state.status === "idle" || state.status === "over") {
    startGame();
  } else if (state.status === "paused") {
    resumeGame();
  }
}

function handleKeyDown(event) {
  if (state.status === "idle") {
    return;
  }
  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      movePiece(1, 0);
      break;
    case "ArrowUp":
    case "KeyX":
      event.preventDefault();
      rotatePiece(1);
      break;
    case "KeyZ":
      event.preventDefault();
      rotatePiece(-1);
      break;
    case "ArrowDown":
      event.preventDefault();
      softDrop(true);
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    case "ShiftLeft":
    case "ShiftRight":
    case "KeyC":
      event.preventDefault();
      holdPiece();
      break;
    case "KeyP":
      event.preventDefault();
      togglePause();
      break;
    default:
      break;
  }
}

function handleKeyUp(event) {
  if (event.code === "ArrowDown") {
    softDrop(false);
  }
}

function init() {
  loadBestScore();
  updateHud();
  draw(0);
  showBanner("Ready?", "Press Start or Space", "Start Game");
  requestAnimationFrame(update);
}

startButton.addEventListener("click", handleStartButton);
window.addEventListener("keydown", (event) => {
  if (state.status === "idle" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    startGame();
    return;
  }
  if (state.status === "paused" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    resumeGame();
    return;
  }
  if (state.status === "over" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    startGame();
    return;
  }
  handleKeyDown(event);
});

window.addEventListener("keyup", handleKeyUp);

init();
