// Enemy state and spawn configuration
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnRate = 30; // frames between spawns
let enemyBaseSpeed = 1.5; // minimum speed
let enemySpeedMultiplier = 2; // speed scaling factor
let enemySpawnMultiplier = 4; // spawn frequency multiplier

// Sprite animation settings
const ENEMY_SPRITE_COLS = 6;
const ENEMY_ANIM_FPS = 8;
const ENEMY_FRAME_DELAY = 60 / ENEMY_ANIM_FPS;
const ENEMY_SCALE = 2.5; // visual size multiplier
const MAX_ENEMIES = 50; // safety cap

// Death animation settings
const DEATH_SPRITE_COLS = 10;
const DEATH_ANIM_FPS = 12;
const DEATH_FRAME_DELAY = 60 / DEATH_ANIM_FPS;

// Sprite loading and animation state
let enemyImg = new Image();
enemyImg.src = "./assets/sprites/Slime2_Idle_with_shadow.png";
enemyImg.onerror = (err) => console.error('Failed to load enemy sprite:', err, enemyImg.src);
let enemySpriteReady = false;
let enemyFrameW = 0;
let enemyFrameH = 0;
let enemyAnimFrame = 0;
let enemyAnimTimer = 0;

// Death sprite
let deathImg = new Image();
deathImg.src = "./assets/sprites/Slime2_Death_with_shadow.png";
deathImg.onerror = (err) => console.error('Failed to load death sprite:', err, deathImg.src);
let deathSpriteReady = false;
let deathFrameW = 0;
let deathFrameH = 0;

// Calculate frame dimensions when sprite loads
enemyImg.onload = () => {
  enemyFrameW = Math.floor(enemyImg.width / ENEMY_SPRITE_COLS);
  enemyFrameH = Math.floor(enemyFrameW);
  enemySpriteReady = true;
  console.log('Enemy sprite loaded', { src: enemyImg.src, imgW: enemyImg.width, imgH: enemyImg.height, frameW: enemyFrameW, frameH: enemyFrameH });
  const scale = ENEMY_SCALE;
  enemies.forEach(e => {
    e.width = enemyFrameW * scale;
    e.height = enemyFrameH * scale;
  });
};

deathImg.onload = () => {
  deathFrameW = Math.floor(deathImg.width / DEATH_SPRITE_COLS);
  deathFrameH = deathFrameW;
  deathSpriteReady = true;
  console.log('Death sprite loaded', { src: deathImg.src, imgW: deathImg.width, imgH: deathImg.height, frameW: deathFrameW, frameH: deathFrameH });
};

function resetEnemies() {
  enemies = [];
  enemySpawnTimer = 0;
}

function spawnEnemy(canvas) {
  const defaultSize = 50;
  if (enemies.length >= MAX_ENEMIES) return;
  const scale = ENEMY_SCALE;
  const size = enemySpriteReady ? Math.max(24, Math.floor(enemyFrameW * scale)) : defaultSize;
  const x = randRange(0, canvas.width - size);
  const e = {
    x,
    y: -size,
    width: size,
    height: size,
    speed: (enemyBaseSpeed + level * 0.1) * enemySpeedMultiplier,
    dying: false,
    deathFrame: 0,
    deathTimer: 0
  }
  if(!checkSpawnCollision(e)){
      enemies.push(e);
  }
}

function updateEnemies(canvas, dt) {
  enemySpawnTimer += dt;

  // Scale spawn rate with level (15% increase per level)
  const levelSpawnMultiplier = 1 + (level - 1) * 0.15;
  const activeMultiplier = enemySpawnMultiplier * levelSpawnMultiplier;
  const spawnThreshold = enemySpawnRate / Math.max(1, activeMultiplier);
  if (enemySpawnTimer >= spawnThreshold) {
    spawnEnemy(canvas);
    enemySpawnTimer = 0;
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.dying) {
      // Advance death animation
      e.deathTimer += dt;
      if (e.deathTimer >= DEATH_FRAME_DELAY) {
        e.deathFrame++;
        e.deathTimer -= DEATH_FRAME_DELAY;
        if (e.deathFrame >= DEATH_SPRITE_COLS) {
          // Death animation complete, remove enemy
          enemies.splice(i, 1);
        }
      }
    } else {
      // Move enemies downward
      e.y += e.speed * dt;
    }
  }

  // Update sprite animation frame
  if (enemySpriteReady) {
    enemyAnimTimer += dt;
    if (enemyAnimTimer >= ENEMY_FRAME_DELAY) {
      enemyAnimFrame = (enemyAnimFrame + 1) % ENEMY_SPRITE_COLS;
      enemyAnimTimer -= ENEMY_FRAME_DELAY;
    }
  }
}

function drawEnemies(ctx) {
  enemies.forEach(e => {
    if (e.dying && deathSpriteReady) {
      // Draw death animation
      const sx = e.deathFrame * deathFrameW;
      const sy = 0;
      const sw = deathFrameW;
      const sh = deathFrameH;
      ctx.drawImage(deathImg, sx, sy, sw, sh, e.x, e.y, e.width, e.height);
    } else if (enemySpriteReady) {
      // Draw idle animation
      const sx = enemyAnimFrame * enemyFrameW;
      const sy = 0;
      const sw = enemyFrameW;
      const sh = enemyFrameH;
      ctx.drawImage(enemyImg, sx, sy, sw, sh, e.x, e.y, e.width, e.height);
    } else {
      // Fallback rectangle
      ctx.fillStyle = "red";
      ctx.fillRect(e.x, e.y, e.width, e.height);
    }
  });
}
