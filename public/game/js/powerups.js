// Power-ups and level up menu

let powerupPool = [
  "Double Bullets",
  "Piercing",
  "Faster Firerate",
  "Move Speed",
  "Wider Bullets"
];

let currentChoices = [];
let selectedIndex = 0;

let doubleShot = false;
let piercing = false;

function resetPowerups() {
  doubleShot = false;
  piercing = false;
}

function openLevelUpMenu() {
  gameState = "levelup";
  currentChoices = [];
  selectedIndex = 0;

  while (currentChoices.length < 3) {
    const p = powerupPool[Math.floor(Math.random() * powerupPool.length)];
    if (!currentChoices.includes(p)) currentChoices.push(p);
  }
}

function handlePowerupSelection() {
  if (input.selectNext) {
    selectedIndex = (selectedIndex + 1) % currentChoices.length;
    input.selectNext = false;
  }

  if (input.selectPrevious) {
    selectedIndex = (selectedIndex - 1 + currentChoices.length) % currentChoices.length;
    input.selectPrevious = false;
  }

  if (input.confirm) {
    applyPowerup(currentChoices[selectedIndex]);
    input.confirm = false;
    gameState = "playing";
  }
}

function applyPowerup(p) {
  switch (p) {
    case "Double Bullets":
      doubleShot = true;
      powerupPool = powerupPool.filter(p => p !== "Double Bullets")
      break;
    case "Piercing":
      piercing = true;
      powerupPool = powerupPool.filter(p => p !== "Piercing");
      break;
    case "Faster Firerate":
      fireCooldown = Math.max(80, fireCooldown * 0.8);
      break;
    case "Move Speed":
      if (player) player.speed += 1;
      break;
    case "Wider Bullets":
    bulletHeight += 10;
    bulletWidth += 10;
    break;
  }
}
