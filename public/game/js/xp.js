// XP & levels

let xp = 0;
let level = 1;
let xpNeeded = 50;

function resetXP() {
  xp = 0;
  level = 1;
  xpNeeded = 50;
}

function addXP(amount) {
  xp += amount;
  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    xpNeeded += 25;
    openLevelUpMenu();
  }
}
