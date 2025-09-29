const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySubtitle = document.getElementById("overlaySubtitle");
const overlayInfo = document.getElementById("overlayInfo");

const scoreValue = document.getElementById("scoreValue");
const hitsValue = document.getElementById("hitsValue");
const missesValue = document.getElementById("missesValue");
const accuracyValue = document.getElementById("accuracyValue");
const timerValue = document.getElementById("timerValue");
const startButton = document.getElementById("startButton");

const roundDuration = 60; // seconds
const spawnIntervalRange = { min: 0.9, max: 1.8 };
const duckSpeedRange = { min: 120, max: 220 };
const duckAmplitude = 26;
const gravity = 520;
const bulletSpeed = 1400;
const barrelLength = 96;

const aim = {
  x: canvas.width * 0.7,
  y: canvas.height * 0.6
};
let gunRecoil = 0;
let crosshairPulse = 0;

let gameState = "idle"; // idle | running | over
let score = 0;
let hits = 0;
let misses = 0;
let shots = 0;
let timeRemaining = roundDuration;
let ducks = [];
let feathers = [];
let muzzleFlashes = [];
let bullets = [];
let spawnCooldown = randomInRange(spawnIntervalRange.min, spawnIntervalRange.max);
let lastTimestamp = 0;
let foregroundWaveTime = 0;

function getGunBase() {
  return {
    x: canvas.width * 0.78,
    y: canvas.height * 0.96
  };
}

function startGame() {
  score = 0;
  hits = 0;
  misses = 0;
  shots = 0;
  timeRemaining = roundDuration;
  ducks = [];
  feathers = [];
  muzzleFlashes = [];
  bullets = [];
  spawnCooldown = randomInRange(spawnIntervalRange.min, spawnIntervalRange.max);
  lastTimestamp = 0;
  updateHud();
  hideOverlay();
  startButton.textContent = "Start Round";
  startButton.classList.add("is-hidden");
  startButton.disabled = true;
  gameState = "running";
}

function endGame() {
  gameState = "over";
  showOverlay(
    "Round Complete",
    `Score: ${scoreValue.textContent}`,
    `Hits: ${hits} · Misses: ${misses} · Accuracy: ${accuracyValue.textContent}`
  );
  startButton.disabled = false;
  startButton.textContent = "Play Again";
  startButton.classList.remove("is-hidden");
}

function updateHud() {
  scoreValue.textContent = String(Math.max(0, Math.floor(score))).padStart(6, "0");
  hitsValue.textContent = String(hits).padStart(2, "0");
  missesValue.textContent = String(misses).padStart(2, "0");
  timerValue.textContent = String(Math.max(0, Math.ceil(timeRemaining))).padStart(2, "0");
  const accuracy = shots === 0 ? 100 : Math.round((hits / shots) * 100);
  accuracyValue.textContent = `${accuracy}%`;
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

function spawnDuck() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const startX = direction === 1 ? -70 : canvas.width + 70;
  const y = randomInRange(canvas.height * 0.15, canvas.height * 0.65);
  const speed = randomInRange(duckSpeedRange.min, duckSpeedRange.max) * direction;
  ducks.push({
    x: startX,
    y,
    width: 60,
    height: 28,
    vx: speed,
    vy: randomInRange(-12, 12),
    wave: Math.random() * Math.PI * 2,
    flap: Math.random() * Math.PI * 2,
    direction
  });
}

function update(timestamp) {
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
  }
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (gameState !== "running") {
    drawScene(delta);
    requestAnimationFrame(update);
    return;
  }

  timeRemaining -= delta;
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    updateHud();
    endGame();
    requestAnimationFrame(update);
    return;
  }

  spawnCooldown -= delta;
  if (spawnCooldown <= 0) {
    spawnDuck();
    spawnCooldown = randomInRange(spawnIntervalRange.min, spawnIntervalRange.max);
  }

  updateDucks(delta);
  updateFeathers(delta);
  updateMuzzleFlashes(delta);
  updateBullets(delta);
  updateGun(delta);
  updateHud();
  drawScene(delta);

  requestAnimationFrame(update);
}

function updateDucks(delta) {
  for (let i = ducks.length - 1; i >= 0; i -= 1) {
    const duck = ducks[i];
    duck.wave += delta * 2.4;
    duck.flap += delta * 14;

    duck.x += duck.vx * delta;
    duck.y += duck.vy * delta + Math.sin(duck.wave) * duckAmplitude * delta;

    if (duck.y < canvas.height * 0.12) {
      duck.y = canvas.height * 0.12;
      duck.vy = Math.abs(duck.vy);
    }
    if (duck.y > canvas.height * 0.72) {
      duck.y = canvas.height * 0.72;
      duck.vy = -Math.abs(duck.vy);
    }

    if (duck.direction === 1 && duck.x > canvas.width + duck.width) {
      ducks.splice(i, 1);
      misses += 1;
      continue;
    }
    if (duck.direction === -1 && duck.x < -duck.width) {
      ducks.splice(i, 1);
      misses += 1;
      continue;
    }
  }
}

function updateFeathers(delta) {
  for (let i = feathers.length - 1; i >= 0; i -= 1) {
    const feather = feathers[i];
    feather.life -= delta;
    if (feather.life <= 0) {
      feathers.splice(i, 1);
      continue;
    }
    feather.vx *= 0.98;
    feather.vy += gravity * delta * 0.3;
    feather.x += feather.vx * delta;
    feather.y += feather.vy * delta;
  }
}

function updateMuzzleFlashes(delta) {
  for (let i = muzzleFlashes.length - 1; i >= 0; i -= 1) {
    const flash = muzzleFlashes[i];
    flash.life -= delta;
    if (flash.life <= 0) {
      muzzleFlashes.splice(i, 1);
    }
  }
}

function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.life += delta;
    bullet.prevX = bullet.x;
    bullet.prevY = bullet.y;
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;

    let hitDuckIndex = -1;
    for (let j = ducks.length - 1; j >= 0; j -= 1) {
      if (segmentIntersectsDuck(bullet.prevX, bullet.prevY, bullet.x, bullet.y, ducks[j])) {
        hitDuckIndex = j;
        break;
      }
    }

    if (hitDuckIndex !== -1) {
      const duck = ducks[hitDuckIndex];
      ducks.splice(hitDuckIndex, 1);
      hits += 1;
      score += Math.round(120 + Math.abs(duck.vx) * 0.4);
      spawnFeathers(duck.x, duck.y);
      bullets.splice(i, 1);
      continue;
    }

    const outOfBounds =
      bullet.y < -80 ||
      bullet.y > canvas.height + 80 ||
      bullet.x < -80 ||
      bullet.x > canvas.width + 80 ||
      bullet.life > bullet.maxLife;

    if (outOfBounds) {
      misses += 1;
      bullets.splice(i, 1);
    }
  }
}

function drawScene(delta) {
  foregroundWaveTime += delta;
  crosshairPulse += delta * 2;
  drawBackground();
  drawDucks();
  drawFeathers();
  drawBullets();
  drawMuzzleFlashes();
  drawForeground();
  drawCrosshair();
  drawGun();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#4cc9f0");
  sky.addColorStop(0.5, "#4361ee");
  sky.addColorStop(1, "#3a0ca3");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 221, 89, 0.35)";
  ctx.beginPath();
  ctx.arc(canvas.width * 0.15, canvas.height * 0.22, 60, 0, Math.PI * 2);
  ctx.fill();

  const water = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
  water.addColorStop(0, "#1b4332");
  water.addColorStop(1, "#081c15");
  ctx.fillStyle = water;
  ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i += 1) {
    const y = canvas.height * 0.72 + i * 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawDucks() {
  ducks.forEach((duck) => {
    ctx.save();
    ctx.translate(duck.x, duck.y);
    ctx.scale(duck.direction, 1);

    ctx.fillStyle = "#442b12";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingOffset = Math.sin(duck.flap) * 9;
    ctx.fillStyle = "#5a371a";
    ctx.beginPath();
    ctx.ellipse(-6, -4, 20, 9 + wingOffset * 0.4, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2b8c4f";
    ctx.beginPath();
    ctx.ellipse(20, -6, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffb703";
    ctx.beginPath();
    ctx.moveTo(32, -6);
    ctx.lineTo(40, -3);
    ctx.lineTo(32, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(23, -8, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawFeathers() {
  feathers.forEach((feather) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, feather.life / feather.maxLife);
    ctx.fillStyle = feather.color;
    ctx.fillRect(feather.x, feather.y, feather.size, feather.size * 0.6);
    ctx.restore();
  });
}

function drawMuzzleFlashes() {
  muzzleFlashes.forEach((flash) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, flash.life / flash.maxLife);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, 20 * (flash.life / flash.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBullets() {
  bullets.forEach((bullet) => {
  const dx = bullet.x - bullet.prevX;
  const dy = bullet.y - bullet.prevY;
  const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy) || 1;
    const lifeFactor = Math.max(0.25, 1 - bullet.life / bullet.maxLife);

    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(angle);

    const gradient = ctx.createLinearGradient(-length * 1.6, 0, 0, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, `rgba(255, 216, 106, ${0.65 * lifeFactor})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-length * 1.4, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.fillStyle = "#ffe066";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawForeground() {
  ctx.fillStyle = "rgba(34, 94, 45, 0.65)";
  for (let i = 0; i < canvas.width; i += 16) {
    const phase = foregroundWaveTime * 3 + i * 0.12;
    const bladeHeight = 10 + Math.sin(phase) * 6;
    ctx.beginPath();
    ctx.moveTo(i, canvas.height * 0.72);
    ctx.lineTo(i + 8, canvas.height * 0.72 - bladeHeight);
    ctx.lineTo(i + 16, canvas.height * 0.72);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCrosshair() {
  ctx.save();
  ctx.translate(aim.x, aim.y);
  const pulse = 1 + Math.sin(crosshairPulse) * 0.1;
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-4, 0);
  ctx.moveTo(14, 0);
  ctx.lineTo(4, 0);
  ctx.moveTo(0, -14);
  ctx.lineTo(0, -4);
  ctx.moveTo(0, 14);
  ctx.lineTo(0, 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 183, 3, 0.8)";
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updateGun(delta) {
  gunRecoil = Math.max(0, gunRecoil - delta * 4.5);
}

function drawGun() {
  const base = getGunBase();
  const angle = Math.atan2(aim.y - base.y, aim.x - base.x);
  const recoilOffset = gunRecoil * 16;

  ctx.save();
  ctx.translate(base.x, base.y);
  ctx.rotate(angle);

  const barrelGradient = ctx.createLinearGradient(-recoilOffset - barrelLength, 0, 24, 0);
  barrelGradient.addColorStop(0, "#1a1d28");
  barrelGradient.addColorStop(0.45, "#2b3144");
  barrelGradient.addColorStop(1, "#454d63");
  ctx.fillStyle = barrelGradient;
  ctx.fillRect(-recoilOffset - barrelLength, -6, barrelLength + 24, 12);

  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fillRect(-recoilOffset - barrelLength + 6, -5, barrelLength - 8, 2.5);

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(-recoilOffset - barrelLength + 6, 3.5, barrelLength - 12, 2.5);

  ctx.fillStyle = "#f29e38";
  ctx.beginPath();
  ctx.moveTo(22 - recoilOffset, -4.5);
  ctx.lineTo(30 - recoilOffset, -3);
  ctx.lineTo(30 - recoilOffset, 3);
  ctx.lineTo(22 - recoilOffset, 4.5);
  ctx.lineTo(18 - recoilOffset, 3);
  ctx.lineTo(18 - recoilOffset, -3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#282a36";
  ctx.beginPath();
  ctx.moveTo(-recoilOffset - barrelLength, -7);
  ctx.lineTo(-recoilOffset - barrelLength - 28, -18);
  ctx.lineTo(-recoilOffset - barrelLength - 12, -2);
  ctx.lineTo(-recoilOffset - barrelLength - 28, 14);
  ctx.lineTo(-recoilOffset - barrelLength, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3a2f2c";
  ctx.beginPath();
  ctx.moveTo(-recoilOffset - 20, 7);
  ctx.lineTo(-recoilOffset - 4, 32);
  ctx.lineTo(10 - recoilOffset, 32);
  ctx.lineTo(4 - recoilOffset, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(-recoilOffset - 18, 10);
  ctx.lineTo(-recoilOffset - 6, 28);
  ctx.lineTo(-recoilOffset, 28);
  ctx.lineTo(-recoilOffset - 6, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5a6079";
  ctx.fillRect(-recoilOffset - 50, -9, 48, 3);

  ctx.fillStyle = "#181a22";
  ctx.fillRect(-recoilOffset - barrelLength + 14, -8, 20, 4);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(8 - recoilOffset, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function handleShot(event) {
  if (gameState !== "running") {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  aim.x = x;
  aim.y = y;
  gunRecoil = 1;

  shots += 1;
  spawnMuzzleFlash(x, y);
  spawnBullet(x, y);
  updateHud();
}

function updateAimFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const newX = (event.clientX - rect.left) * scaleX;
  const newY = (event.clientY - rect.top) * scaleY;
  aim.x = Math.max(0, Math.min(canvas.width, newX));
  aim.y = Math.max(0, Math.min(canvas.height, newY));
}

function spawnFeathers(x, y) {
  const colors = ["#ffb703", "#ffd166", "#f8f3c4", "#ffe066"];
  for (let i = 0; i < 12; i += 1) {
    feathers.push({
      x: x + randomInRange(-6, 6),
      y: y + randomInRange(-6, 6),
      vx: randomInRange(-80, 80),
      vy: randomInRange(-120, -40),
      life: randomInRange(0.4, 0.8),
      maxLife: 0.8,
      size: randomInRange(3, 6),
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function spawnMuzzleFlash(x, y) {
  muzzleFlashes.push({ x, y, life: 0.18, maxLife: 0.18 });
}

function spawnBullet(targetX, targetY) {
  const base = getGunBase();
  const dx = targetX - base.x;
  const dy = targetY - base.y;
  const distance = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);
  const muzzleOffset = barrelLength - 10;
  const startX = base.x + Math.cos(angle) * muzzleOffset;
  const startY = base.y + Math.sin(angle) * muzzleOffset;
  const vx = Math.cos(angle) * bulletSpeed;
  const vy = Math.sin(angle) * bulletSpeed;

  bullets.push({
    x: startX,
    y: startY,
    prevX: startX,
    prevY: startY,
    vx,
    vy,
    life: 0,
    maxLife: Math.min(1.8, Math.max(1, (distance + canvas.height) / bulletSpeed))
  });
}

function segmentIntersectsDuck(x1, y1, x2, y2, duck) {
  const halfW = duck.width * 0.5;
  const halfH = duck.height * 0.5;
  const left = duck.x - halfW;
  const right = duck.x + halfW;
  const top = duck.y - halfH;
  const bottom = duck.y + halfH;
  return segmentIntersectsRect(x1, y1, x2, y2, left, top, right, bottom);
}

function segmentIntersectsRect(x1, y1, x2, y2, left, top, right, bottom) {
  if (pointInRect(x1, y1, left, top, right, bottom) || pointInRect(x2, y2, left, top, right, bottom)) {
    return true;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];

  for (let i = 0; i < 4; i += 1) {
    const pi = p[i];
    const qi = q[i];
    if (pi === 0) {
      if (qi < 0) {
        return false;
      }
    } else {
      const t = qi / pi;
      if (pi < 0) {
        if (t > t1) {
          return false;
        }
        if (t > t0) {
          t0 = t;
        }
      } else {
        if (t < t0) {
          return false;
        }
        if (t < t1) {
          t1 = t;
        }
      }
    }
  }

  return t0 <= t1 && t0 <= 1 && t1 >= 0;
}

function pointInRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

canvas.addEventListener("mousemove", updateAimFromEvent);
canvas.addEventListener("mouseenter", updateAimFromEvent);
canvas.addEventListener("click", handleShot);

startButton.addEventListener("click", () => {
  if (gameState === "running") {
    return;
  }
  startGame();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (gameState === "running") {
      return;
    }
    event.preventDefault();
    startGame();
  }
});

showOverlay(
  "Retro Duck Hunt",
  "Shoot the ducks before they escape!",
  "Click Start or press Space to begin"
);
updateHud();
requestAnimationFrame(update);
