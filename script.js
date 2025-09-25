const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySubtitle = document.getElementById("overlaySubtitle");
const overlayInfo = document.getElementById("overlayInfo");
const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const pauseButton = document.getElementById("pauseButton");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const updateRate = 8; // frames per second
const stepInterval = 1000 / updateRate;
const bestKey = "retro-snake-best";
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

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { ...direction };
let food = {
  x: Math.floor(tileCount / 2),
  y: Math.floor(tileCount / 2)
};
let score;
let best = Number(window.localStorage.getItem(bestKey)) || 0;
let gameState = "idle"; // idle | running | paused | over
let lastStep = 0;

bestValue.textContent = best;

drawBoard();
showOverlay("Press Enter to Start", "Move with Arrow Keys or WASD", "Press P to Pause · Enter to Restart");
updatePauseButtonLabel();

function startGame() {
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
  hideOverlay();
  updatePauseButtonLabel();
}

function togglePause() {
  if (gameState === "running") {
    gameState = "paused";
    showOverlay("Paused", "Press P or the button to resume", "");
    updatePauseButtonLabel();
  } else if (gameState === "paused") {
    gameState = "running";
    hideOverlay();
    updatePauseButtonLabel();
  }
}

function endGame() {
  gameState = "over";
  showOverlay("Game Over", `Score: ${score}`, "Press Enter to try again");
  if (score > best) {
    best = score;
    bestValue.textContent = best;
    window.localStorage.setItem(bestKey, String(best));
  }
  updatePauseButtonLabel();
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
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    endGame();
    return;
  }

  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreValue.textContent = score;
    food = spawnFood();
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
