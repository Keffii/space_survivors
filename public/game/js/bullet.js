// Bullets

let bullets = [];
let lastShot = 0;
let fireCooldown = 250;   // ms
let bulletWidth = 50;
let bulletHeight = 50;
let bulletSpeed = 9;

function resetBullets() {
  bullets = [];
  lastShot = 0;
  bulletWidth = 20;
  bulletHeight = 20;
  bulletSpeed = 9;
  fireCooldown = 250;
}

function canShoot() {
  return Date.now() - lastShot > fireCooldown;
}

function shoot() {
  if (!player) return;

  const baseBullet = () => ({
    x: player.x + player.width / 2 - bulletWidth / 2,
    y: player.y,
    width: bulletWidth,
    height: bulletHeight,
    speed: bulletSpeed
  });

  if (doubleShot) {
    const centerX = player.x + player.width / 2;
    const spread = player.width * 0.15; // Spread variable
    
    bullets.push({
      x: centerX - spread - bulletWidth / 2,
      y: player.y,
      width: bulletWidth,
      height: bulletHeight,
      speed: bulletSpeed
    });
    bullets.push({
      x: centerX + spread - bulletWidth / 2,
      y: player.y,
      width: bulletWidth,
      height: bulletHeight,
      speed: bulletSpeed
    });
  } else {
    bullets.push(baseBullet());
  }

  lastShot = Date.now();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bullets[i].speed * dt;
    if (bullets[i].y + bullets[i].height < 0) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets(ctx) {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}