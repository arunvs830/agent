// --- Nokia Bounce Platformer Engine ---
const canvas = document.getElementById("bounceCanvas");
const ctx = canvas.getContext("2d");

const statusBanner = document.getElementById("statusBanner");
const statusTitle = document.getElementById("statusTitle");
const statusSubtitle = document.getElementById("statusSubtitle");
const startButton = document.getElementById("startButton");

const scoreValue = document.getElementById("scoreValue");
const livesValue = document.getElementById("livesValue");
const ringsValue = document.getElementById("ringsValue");
const levelValue = document.getElementById("levelValue");
const bestValue = document.getElementById("bestValue");

const STORAGE_KEY = "retro-arcade-bounce-best";

const TILE_SIZE = 40;
const BALL_RADIUS = 16;
// Physics constants to match specifications
const GRAVITY = 900 * 2.5; // Gravity scale 2.5 for weighty feel
const JUMP_VELOCITY = 360;
const MOVE_ACCEL = 900;
const MOVE_DECAY = 0.5; // Linear drag 0.5 for smooth deceleration
const MAX_VX = 220;
const MAX_VY = 720;
const CAMERA_LERP = 0.18;
const PLATFORM_SPEED = 70;
const PLATFORM_RANGE = TILE_SIZE * 2.5;
// Physics material properties
const BALL_FRICTION = 0.2;
const BALL_RESTITUTION = 0.2;
const BOUNCY_RESTITUTION = 1.5;

// Level 1 map (20x12 tiles, 40px each) - Exact specifications layout
const LEVEL_MAP = [
  "....................",
  "....................",
  "....................",
  "........#...........",  // High Platform for Ring #5
  "........o...........",  // Ring #5 on High Platform  
  "@o.o.#.oB.......>...",  // Start(@), Ring#1(o), Ring#2(o), Small Step(#), Ring#3(o), Bouncy Floor(B), Moving Platform(>)
  "######...^..o.......",  // Ground Floor 1, Spike(^), Ring#4(o) after spike  
  ".........#.........#",  // Platform after spike, Final Ledge
  "................o...",  // Ring #6 on Final Ledge
  "...................*",  // Exit Portal on ground level
  "####################",  // Bottom ground
  "...................."
];

// Legend:
// . = empty, # = platform, o = ring, * = exit, @ = start, ^ = spike
// B = bouncy floor, > = moving platform

const MAP_ROWS = LEVEL_MAP.length;
const MAP_COLS = LEVEL_MAP[0].length;
const LEVEL_WIDTH = MAP_COLS * TILE_SIZE;
const LEVEL_HEIGHT = MAP_ROWS * TILE_SIZE;

const state = {
  status: "idle", // idle | running | paused | victory | over
  score: 0,
  best: 0,
  lives: 3,
  rings: 0,
  ringsCollected: 0,
  level: 1,
  ball: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    onGround: false
  },
  camera: {
    x: canvas.width / 2,
    y: canvas.height / 2
  },
  keys: {
    left: false,
    right: false
  },
  objects: [],
  platforms: [],
  message: "",
  messageTimer: 0
};

let lastTimestamp = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function circleIntersectsRect(cx, cy, radius, rx, ry, width, height) {
  const nearestX = clamp(cx, rx, rx + width);
  const nearestY = clamp(cy, ry, ry + height);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= radius * radius;
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
  livesValue.textContent = state.lives.toString().padStart(2, "0");
  ringsValue.textContent = `${state.ringsCollected.toString().padStart(2, "0")}/${state.rings
    .toString()
    .padStart(2, "0")}`;
  levelValue.textContent = state.level.toString().padStart(2, "0");
  bestValue.textContent = Math.max(state.best, state.score).toString().padStart(6, "0");
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

function setMessage(text, duration = 1.6) {
  state.message = text;
  state.messageTimer = duration;
}

function isSolid(x, y) {
  const tx = Math.floor(x / TILE_SIZE);
  const ty = Math.floor(y / TILE_SIZE);
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) {
    return false;
  }
  return LEVEL_MAP[ty][tx] === "#";
}

function resetLevel() {
  state.objects = [];
  state.platforms = [];
  state.rings = 0;
  state.ringsCollected = 0;

  let startX = TILE_SIZE * 2;
  let startY = TILE_SIZE * 6;

  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const tile = LEVEL_MAP[row][col];
      const px = col * TILE_SIZE;
      const py = row * TILE_SIZE;
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;

      switch (tile) {
        case "@":
          startX = cx;
          startY = cy;
          break;
        case "o":
          state.objects.push({ type: "ring", x: cx, y: cy, collected: false });
          state.rings += 1;
          break;
        case "^":
          state.objects.push({ type: "spike", x: cx, y: cy });
          break;
        case "*":
          state.objects.push({ type: "exit", x: cx, y: cy, active: false });
          break;
        case "~":
          state.objects.push({ type: "water", x: px, y: py, width: TILE_SIZE, height: TILE_SIZE });
          break;
        case "=":
          state.objects.push({ type: "lava", x: px, y: py, width: TILE_SIZE, height: TILE_SIZE });
          break;
        case "B":
          // Bouncy floor - create as platform with high restitution
          state.platforms.push({
            x: px,
            y: py + TILE_SIZE - 8,
            width: TILE_SIZE,
            height: 8,
            bouncy: true,
            velocity: 0,
            deltaX: 0,
            min: px,
            max: px
          });
          break;
        case ">": {
          // Vertical moving platform as specified
          const width = TILE_SIZE;
          const height = 14;
          const minY = py - PLATFORM_RANGE;
          const maxY = py + PLATFORM_RANGE;
          const direction = Math.random() < 0.5 ? 1 : -1;
          const platform = {
            x: px,
            y: py,
            width,
            height,
            minY: clamp(minY, 0, LEVEL_HEIGHT - height),
            maxY: clamp(maxY, 0, LEVEL_HEIGHT - height),
            velocity: PLATFORM_SPEED * direction,
            deltaX: 0,
            deltaY: 0,
            vertical: true
          };
          if (platform.minY === platform.maxY) {
            platform.velocity = 0;
          }
          state.platforms.push(platform);
          break;
        }
        default:
          break;
      }
    }
  }

  state.ball = {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    onGround: false
  };

  state.camera.x = clamp(startX, canvas.width / 2, LEVEL_WIDTH - canvas.width / 2);
  state.camera.y = clamp(startY, canvas.height / 2, LEVEL_HEIGHT - canvas.height / 2);
  updateHud();
}

function updatePlatforms(delta) {
  for (const platform of state.platforms) {
    if (!platform.velocity) {
      platform.deltaX = 0;
      platform.deltaY = 0;
      continue;
    }
    
    if (platform.vertical) {
      // Vertical moving platform
      const prevY = platform.y;
      platform.y += platform.velocity * delta;

      if (platform.y <= platform.minY) {
        platform.y = platform.minY;
        platform.velocity = Math.abs(platform.velocity);
      } else if (platform.y >= platform.maxY) {
        platform.y = platform.maxY;
        platform.velocity = -Math.abs(platform.velocity);
      }

      platform.deltaY = platform.y - prevY;
      platform.deltaX = 0;
    } else {
      // Horizontal moving platform (existing logic)
      const prevX = platform.x;
      platform.x += platform.velocity * delta;

      if (platform.x <= platform.min) {
        platform.x = platform.min;
        platform.velocity = Math.abs(platform.velocity);
      } else if (platform.x >= platform.max) {
        platform.x = platform.max;
        platform.velocity = -Math.abs(platform.velocity);
      }

      platform.deltaX = platform.x - prevX;
      platform.deltaY = 0;
    }
  }
}

function updateBall(delta) {
  const ball = state.ball;
  const prevX = ball.x;
  const prevY = ball.y;

  if (state.keys.left) {
    ball.vx -= MOVE_ACCEL * delta;
  }
  if (state.keys.right) {
    ball.vx += MOVE_ACCEL * delta;
  }

  // Apply linear drag (proper physics)
  ball.vx *= (1 - MOVE_DECAY * delta);
  if (Math.abs(ball.vx) < 8) {
    ball.vx = 0;
  }
  ball.vx = clamp(ball.vx, -MAX_VX, MAX_VX);

  ball.vy += GRAVITY * delta;
  ball.vy = clamp(ball.vy, -MAX_VY, MAX_VY);

  let nx = ball.x + ball.vx * delta;
  let ny = ball.y + ball.vy * delta;
  ball.onGround = false;

  // Vertical collisions
  if (ball.vy >= 0) {
    const foot = ny + BALL_RADIUS;
    if (
      isSolid(nx, foot) ||
      isSolid(nx - BALL_RADIUS * 0.6, foot) ||
      isSolid(nx + BALL_RADIUS * 0.6, foot)
    ) {
      ny = Math.floor(foot / TILE_SIZE) * TILE_SIZE - BALL_RADIUS - 0.01;
      ball.vy = 0;
      ball.onGround = true;
    }
  } else {
    const head = ny - BALL_RADIUS;
    if (
      isSolid(nx, head) ||
      isSolid(nx - BALL_RADIUS * 0.6, head) ||
      isSolid(nx + BALL_RADIUS * 0.6, head)
    ) {
      ny = Math.floor(head / TILE_SIZE + 1) * TILE_SIZE + BALL_RADIUS + 0.01;
      ball.vy = 0;
    }
  }

  // Horizontal collisions
  if (ball.vx > 0) {
    const right = nx + BALL_RADIUS;
    if (
      isSolid(right, ny) ||
      isSolid(right, ny - BALL_RADIUS * 0.6) ||
      isSolid(right, ny + BALL_RADIUS * 0.6)
    ) {
      nx = Math.floor(right / TILE_SIZE) * TILE_SIZE - BALL_RADIUS - 0.01;
      ball.vx = 0;
    }
  } else if (ball.vx < 0) {
    const left = nx - BALL_RADIUS;
    if (
      isSolid(left, ny) ||
      isSolid(left, ny - BALL_RADIUS * 0.6) ||
      isSolid(left, ny + BALL_RADIUS * 0.6)
    ) {
      nx = Math.floor(left / TILE_SIZE + 1) * TILE_SIZE + BALL_RADIUS + 0.01;
      ball.vx = 0;
    }
  }

  ball.x = clamp(nx, BALL_RADIUS, LEVEL_WIDTH - BALL_RADIUS);
  ball.y = ny;

  handlePlatformCollisions(ball, prevX, prevY);

  if (ball.y > LEVEL_HEIGHT + BALL_RADIUS * 2) {
    setMessage("You fell!", 1.6);
    loseLife();
  }
}

function handlePlatformCollisions(ball, prevX, prevY) {
  for (const platform of state.platforms) {
    const top = platform.y;
    const bottom = platform.y + platform.height;
    const left = platform.x;
    const right = platform.x + platform.width;

    // Landing on top
    if (
      prevY + BALL_RADIUS <= top &&
      ball.y + BALL_RADIUS >= top &&
      ball.x + BALL_RADIUS > left &&
      ball.x - BALL_RADIUS < right &&
      ball.vy >= 0
    ) {
      ball.y = top - BALL_RADIUS - 0.01;
      
      // Apply bouncy floor physics
      if (platform.bouncy) {
        // High restitution for bouncy floor
        ball.vy = -Math.abs(ball.vy) * BOUNCY_RESTITUTION;
        if (Math.abs(ball.vy) < 100) {
          ball.vy = -400; // Minimum bounce velocity for bouncy floor
        }
      } else {
        // Normal platform - apply regular restitution
        ball.vy = -Math.abs(ball.vy) * BALL_RESTITUTION;
        ball.onGround = true;
      }
      
      ball.x += platform.deltaX || 0;
      ball.y += platform.deltaY || 0;
    }

    // Bumping underside
    if (
      prevY - BALL_RADIUS >= bottom &&
      ball.y - BALL_RADIUS <= bottom &&
      ball.x + BALL_RADIUS > left &&
      ball.x - BALL_RADIUS < right &&
      ball.vy < 0
    ) {
      ball.y = bottom + BALL_RADIUS + 0.01;
      ball.vy = 0;
    }

    // Left side
    if (
      prevX + BALL_RADIUS <= left &&
      ball.x + BALL_RADIUS >= left &&
      ball.y + BALL_RADIUS > top &&
      ball.y - BALL_RADIUS < bottom &&
      ball.vx > 0
    ) {
      ball.x = left - BALL_RADIUS - 0.01;
      ball.vx = 0;
    }

    // Right side
    if (
      prevX - BALL_RADIUS >= right &&
      ball.x - BALL_RADIUS <= right &&
      ball.y + BALL_RADIUS > top &&
      ball.y - BALL_RADIUS < bottom &&
      ball.vx < 0
    ) {
      ball.x = right + BALL_RADIUS + 0.01;
      ball.vx = 0;
    }
  }
}

function checkObjects() {
  const ball = state.ball;
  for (const obj of state.objects) {
    if (obj.type === "ring" && !obj.collected) {
      if (distance(ball.x, ball.y, obj.x, obj.y) < BALL_RADIUS + 8) {
        obj.collected = true;
        state.ringsCollected += 1;
        state.score += 100;
        setMessage("Ring collected!", 0.8);
        
        // Activate portal when all 6 rings are collected
        if (state.ringsCollected >= state.rings) {
          for (const exitObj of state.objects) {
            if (exitObj.type === "exit") {
              exitObj.active = true;
              setMessage("Portal activated!", 1.2);
              break;
            }
          }
        }
      }
      continue;
    }

    if (obj.type === "spike") {
      if (distance(ball.x, ball.y, obj.x, obj.y) < BALL_RADIUS + 6) {
        setMessage("Spiked!", 1.4);
        // Spike pit restarts the level immediately
        resetLevel();
        return;
      }
      continue;
    }

    if (obj.type === "water" || obj.type === "lava") {
      const radius = BALL_RADIUS - 6;
      if (circleIntersectsRect(ball.x, ball.y, radius, obj.x, obj.y, obj.width, obj.height)) {
        setMessage(obj.type === "water" ? "Splash!" : "Too hot!", 1.6);
        loseLife();
        return;
      }
      continue;
    }

    if (obj.type === "exit") {
      if (distance(ball.x, ball.y, obj.x, obj.y) < BALL_RADIUS + 14) {
        if (obj.active && state.ringsCollected >= state.rings) {
          winLevel();
        } else if (!obj.active) {
          setMessage("Portal is inactive - collect all rings!", 1.2);
        } else {
          setMessage("Collect all rings first!", 1.2);
        }
        return;
      }
    }
  }
}

function loseLife() {
  if (state.status !== "running") {
    return;
  }
  state.lives -= 1;
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = "over";
    saveBestScore();
    updateHud();
    showBanner("Game Over", `Score: ${state.score.toString().padStart(6, "0")}`, "Play Again");
    return;
  }
  resetLevel();
  updateHud();
}

function winLevel() {
  if (state.status !== "running") {
    return;
  }
  state.status = "victory";
  state.score += 500;
  saveBestScore();
  updateHud();
  showBanner(
    "Level Complete!",
    `Rings: ${state.ringsCollected}/${state.rings}`,
    "Play Again"
  );
}

function updateCamera() {
  const ball = state.ball;
  const halfW = canvas.width / 2;

  const minX = halfW;
  const maxX = LEVEL_WIDTH - halfW;

  const targetX = maxX <= minX ? LEVEL_WIDTH / 2 : clamp(ball.x, minX, maxX);
  // Lock Y-position as specified in requirements
  const targetY = LEVEL_HEIGHT / 2;

  state.camera.x += (targetX - state.camera.x) * CAMERA_LERP;
  state.camera.y = targetY; // Y-position locked
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(12, 15, 36, 0.96)");
  gradient.addColorStop(1, "rgba(2, 4, 15, 0.96)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTiles() {
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      if (LEVEL_MAP[row][col] !== "#") {
        continue;
      }
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const gradient = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
      gradient.addColorStop(0, "#1c6de8");
      gradient.addColorStop(1, "#1345a4");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }
  }
}

function drawHazards() {
  for (const obj of state.objects) {
    if (obj.type === "water") {
      ctx.fillStyle = "rgba(20, 200, 255, 0.6)";
      ctx.fillRect(obj.x, obj.y + TILE_SIZE / 3, obj.width, (TILE_SIZE * 2) / 3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(obj.x, obj.y + TILE_SIZE / 3, obj.width, 3);
    } else if (obj.type === "lava") {
      const gradient = ctx.createLinearGradient(obj.x, obj.y, obj.x, obj.y + obj.height);
      gradient.addColorStop(0, "#ffed75");
      gradient.addColorStop(0.4, "#ff8b2b");
      gradient.addColorStop(1, "#d62222");
      ctx.fillStyle = gradient;
      ctx.fillRect(obj.x, obj.y + TILE_SIZE / 2, obj.width, obj.height / 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fillRect(obj.x, obj.y + obj.height / 2, obj.width, 3);
    }
  }
}

function drawPlatforms() {
  for (const platform of state.platforms) {
    if (platform.bouncy) {
      // Draw bouncy floor in bright blue as specified
      const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
      gradient.addColorStop(0, "#00ccff");
      gradient.addColorStop(1, "#0088cc");
      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.strokeRect(platform.x + 0.5, platform.y + 0.5, platform.width - 1, platform.height - 1);
      
      // Add sparkle effect for bouncy floor
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 3; i++) {
        const sparkleX = platform.x + (platform.width / 4) * (i + 1);
        const sparkleY = platform.y + platform.height / 2;
        ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
      }
      ctx.restore();
    } else {
      // Regular platform
      const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
      gradient.addColorStop(0, "#14fff7");
      gradient.addColorStop(1, "#0ab5ff");
      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.strokeRect(platform.x + 0.5, platform.y + 0.5, platform.width - 1, platform.height - 1);
    }
  }
}

function drawRingsAndHazards() {
  for (const obj of state.objects) {
    if (obj.type === "ring" && !obj.collected) {
      ctx.save();
      ctx.strokeStyle = "#ffe45e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (obj.type === "spike") {
      ctx.save();
      ctx.fillStyle = "#ff3c3c";
      ctx.beginPath();
      ctx.moveTo(obj.x - 12, obj.y + 12);
      ctx.lineTo(obj.x, obj.y - 14);
      ctx.lineTo(obj.x + 12, obj.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.stroke();
      ctx.restore();
    }

    if (obj.type === "exit") {
      ctx.save();
      if (obj.active) {
        // Active portal - swirling bright cyan
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add swirling effect
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const time = Date.now() * 0.005;
        ctx.arc(obj.x, obj.y, 14, time, time + Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 10, -time, -time + Math.PI);
        ctx.stroke();
      } else {
        // Inactive portal - dim gray
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawBall() {
  const ball = state.ball;
  const gradient = ctx.createRadialGradient(ball.x - 6, ball.y - 8, 4, ball.x, ball.y, BALL_RADIUS);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#ff5c5c");
  gradient.addColorStop(1, "#8c0d0d");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawMessageOverlay() {
  if (state.messageTimer <= 0 || !state.message) {
    return;
  }
  ctx.save();
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillStyle = "rgba(255, 228, 94, 0.9)";
  ctx.textAlign = "center";
  ctx.fillText(state.message, canvas.width / 2, 42);
  ctx.restore();
}

function drawPausedOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(2, 4, 15, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "18px 'Press Start 2P', monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function render() {
  drawBackground();
  ctx.save();
  ctx.translate(canvas.width / 2 - state.camera.x, canvas.height / 2 - state.camera.y);
  drawTiles();
  drawHazards();
  drawPlatforms();
  drawRingsAndHazards();
  drawBall();
  ctx.restore();
  drawMessageOverlay();
  if (state.status === "paused") {
    drawPausedOverlay();
  }
}

function updateGame(delta) {
  if (state.messageTimer > 0) {
    state.messageTimer = Math.max(0, state.messageTimer - delta);
  }

  if (state.status === "running") {
    updatePlatforms(delta);
    updateBall(delta);
    checkObjects();
    updateCamera();
  }

  updateHud();
}

function gameLoop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const delta = clamp((timestamp - lastTimestamp) / 1000, 0, 0.05);
  lastTimestamp = timestamp;
  updateGame(delta);
  render();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  state.status = "running";
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.message = "";
  state.messageTimer = 0;
  resetLevel();
  hideBanner();
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

startButton.addEventListener("click", () => {
  if (state.status === "idle" || state.status === "over" || state.status === "victory") {
    startGame();
    return;
  }
  if (state.status === "paused") {
    resumeGame();
  }
});

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

  if (state.status === "victory" || state.status === "over") {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      startGame();
    }
    return;
  }

  if (state.status !== "running") {
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.keys.left = true;
    event.preventDefault();
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.keys.right = true;
    event.preventDefault();
  }
  if (event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW") {
    if (state.ball.onGround) {
      state.ball.vy = -JUMP_VELOCITY;
      state.ball.onGround = false;
    }
    event.preventDefault();
  }
  if (event.code === "KeyP") {
    event.preventDefault();
    togglePause();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.keys.left = false;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.keys.right = false;
  }
});

loadBestScore();
updateHud();
showBanner("Ready?", "Press Start or Space", "Start Game");
requestAnimationFrame(gameLoop);
