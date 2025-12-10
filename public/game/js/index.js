// Maingame: setup, game loop, collisions, states

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameState = "start";
let score = 0;
let bgImg = new Image();
bgImg.src = "./assets/sprites/background.png";

initPlayer(canvas);
resetEnemies();
resetBullets();
resetXP();
resetPowerups();

let lastTime = performance.now();

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 16.67;
  lastTime = timestamp;

  const clampedDt = Math.min(dt, 5);

  hue = (hue + 3) % 360;

  updateGame(clampedDt);
  drawGame();
  requestAnimationFrame(gameLoop);
}

function updateGame(dt) {
  if (gameState === "start") {
    if (input.confirm) {
      input.confirm = false;
      gameState = "playing";
    }
  } else if (gameState === "playing") {
    updatePlayer(canvas, dt);

    if (canShoot()) {
      shoot();
    }

    updateBullets(dt);
    updateEnemies(canvas, dt);
    handleBulletEnemyCollisions();
    handleEnemyBottomOrPlayerHit();
  } else if (gameState === "levelup") {
    handlePowerupSelection();
  } else if (gameState === "gameover") {
    if (input.confirm) {
      input.confirm = false;
      restartGame();
    }
  }
}

function handleBulletEnemyCollisions() {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (!e.dying && rectsOverlapTight(b, e, 20)) {
        // Start death animation instead of removing immediately
        e.dying = true;
        e.deathFrame = 0;
        e.deathTimer = 0;
        score += 10;
        addXP(10);

        if (!piercing) {
          bullets.splice(bi, 1);
          break;
        }
      }
    }
  }
}

function checkSpawnCollision(e) {
  return enemies.some((f) => rectsOverlap(e, f));
}

function handleEnemyBottomOrPlayerHit() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];

    if (e.y + e.height >= canvas.height - 40) {
      gameOver();
      return;
    }
  }
}


function gameOver() {
  gameState = "gameover";

  window.parent.postMessage({
    type: 'GAME_OVER',
    score: score,
  }, '*');
}

function restartGame() {
  gameState = "playing";
  score = 0;
  resetEnemies();
  resetBullets();
  resetXP();
  resetPowerups();
  initPlayer(canvas);
  lastTime = performance.now();
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  drawPlayer(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);

  drawHUD(ctx, score);
  drawXPBar(ctx, canvas);

  if (gameState === "start") {
    drawStartScreen(ctx, canvas);
  } else if (gameState === "levelup") {
    drawLevelUpMenu(ctx, canvas);
  } else if (gameState === "gameover") {
    drawGameOver(ctx, canvas, score);
  }
}

requestAnimationFrame(gameLoop);

