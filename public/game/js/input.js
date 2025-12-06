// Input-handling (keyboard, implement ESP32 later)

let input = {
  left: false,
  right: false,
  selectNext: false,
  selectPrevious: false,
  confirm: false
};

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = true;
  if (e.key === "ArrowRight" || e.key === "d") input.right = true;

  if ((e.key === "ArrowDown" || e.key === "s") && !e.repeat) {
    input.selectNext = true;
  }
  if ((e.key === "ArrowUp" || e.key === "w") && !e.repeat) {
    input.selectPrevious = true;
  }
  if ((e.key === "Enter" || e.key === "e") && !e.repeat) {
    input.confirm = true;
  }

  if ((e.key === "r" || e.key === "R") && !e.repeat) {
    if (gameState === "gameover") {
      restartGame();
    }
  }
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = false;
  if (e.key === "ArrowRight" || e.key === "d") input.right = false;
});

window.addEventListener("message", (event) => {
  if (event.data.type === "ESP32_BUTTON") {
    const { btn, action } = event.data;
    
    if (btn === "LEFT") {
      input.left = (action === "press" || action === "held");
      if (action === "press") {
        input.selectPrevious = true;
      }
    } else if (btn === "RIGHT") {
      input.right = (action === "press" || action === "held");
      if (action === "press") {
        input.selectNext = true;
      }
    } else if (btn === "CONFIRM") {
      if (action === "press") {
        input.confirm = true;
        if (gameState === "gameover") {
          restartGame();
        }
      }
    }
  }
});
