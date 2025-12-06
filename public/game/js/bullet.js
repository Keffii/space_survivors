// Bullets

let bullets = [];
let lastShot = 0;
let fireCooldown;
let bulletWidth;
let bulletHeight;
let bulletSpeed;

function resetBullets() {
  bullets = [];
  lastShot = 0;
  bulletWidth = 30;
  bulletHeight = 30;
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
    const spread = player.width * 0.15;
    
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
  bullets.forEach(b => {
    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;
    const radius = b.width / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(255,250,150,1)');
    gradient.addColorStop(0.4, 'rgba(255,220,0,0.95)');
    gradient.addColorStop(1, 'rgba(255,220,0,0)');

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(255,230,100,0.9)';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // bright white/yellow core for contrast for visibility
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(2, radius / 3), 0, Math.PI * 2);
    ctx.fill();
  });
}