// Helperfunctions

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function rectsOverlapTight(a, b, inset = 8) {
  const ax = a.x + inset;
  const ay = a.y + inset;
  const aw = a.width - inset * 2;
  const ah = a.height - inset * 2;
  const bx = b.x + inset;
  const by = b.y + inset;
  const bw = b.width - inset * 2;
  const bh = b.height - inset * 2;
  
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}