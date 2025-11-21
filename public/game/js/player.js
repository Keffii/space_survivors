// Player

let playerImg = new Image();
playerImg.src = "./assets/sprites/player.png";

let player = null;

function initPlayer(canvas) {
  player = {
    x: canvas.width / 2 - 100,
    y: canvas.height - 160,
    width: 200,
    height: 200,
    speed: 10,
  };
}

function updatePlayer(canvas, dt) {
  if (!player) return;

  if (input.left) player.x -= player.speed * dt;
  if (input.right) player.x += player.speed * dt;

  player.x = clamp(player.x, -player.width * 0.2, canvas.width - player.width * 0.8);
}

function drawPlayer(ctx) {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}
