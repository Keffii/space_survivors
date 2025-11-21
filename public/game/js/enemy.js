// Enemy statistics

let enemies = [];
let enemySpawnTimer = 0; // frame-scaled timer (adds dt each frame)
let enemySpawnRate = 60;   // frames (1 enemy/sec at 60fps)
let enemyBaseSpeed = 0;
// Global multiplier to scale enemy vertical speed. 1 = normal, 2 = 100% faster
let enemySpeedMultiplier = 5; // set to 2 to make enemies move 100% faster
// Global multiplier to scale enemy spawn frequency. 1 = normal, 2 = twice as many
let enemySpawnMultiplier = 2; // set to 2 to make enemies spawn 100% more often

function resetEnemies() {
  enemies = [];
  enemySpawnTimer = 0;
}

function spawnEnemy(canvas) {
  const size = 50;
  const x = randRange(0, canvas.width - size);
  const e = {
    x,
    y: -size,
    width: size,
    height: size,
    // Calculate base speed and then scale by the global multiplier so we can
    // easily change overall enemy velocity without changing individual code.
    speed: (enemyBaseSpeed + level * 0.2) * enemySpeedMultiplier
  }
  if(!checkSpawnCollision(e)){
      enemies.push(e);
  }
}

function updateEnemies(canvas, dt) {
  // enemySpawnTimer is a frame-equivalent counter; dt ~1 at 60fps
  // accumulate the frame-equivalent dt and spawn when it reaches enemySpawnRate
  enemySpawnTimer += dt;

  // Adjust spawn threshold by multiplier so we can increase/decrease spawn
  // frequency without changing the base rate.
  const spawnThreshold = enemySpawnRate / Math.max(1, enemySpawnMultiplier);
  if (enemySpawnTimer >= spawnThreshold) {
    spawnEnemy(canvas);
    enemySpawnTimer = 0;
  }

  enemies.forEach(e => {
    // speed is expressed in pixels-per-60fps-frame; scale with dt
    e.y += e.speed * dt;
  });
}

function drawEnemies(ctx) {
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.width, e.height);
  });
}
