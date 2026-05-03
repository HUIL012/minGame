var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;

var player = document.getElementById("boss");
var chaser = document.getElementById("bossMax");
var food = document.getElementById("foods");
var gameover = document.getElementById("gameover");
var foodScore = document.getElementById("foodfs");
var eatenText = document.getElementById("b");
var scoreText = document.getElementById("cs3");
var speedText = document.getElementById("speedText");
var dieText = document.getElementById("die");
var foodText = document.getElementById("food");
var levelText = document.getElementById("level");
var restart = document.getElementById("restart");
var startOrStop = document.getElementById("startorstop");
var again = document.getElementById("again");

var state = {
  playerX: 380,
  playerY: 275,
  chaserX: 760,
  chaserY: 18,
  foodX: 120,
  foodY: 120,
  score: 0,
  eaten: 0,
  deaths: 0,
  running: true,
  gameEnded: false,
  scoreStep: 10,
  chaserSpeed: 76,
  playerSpeed: 245,
  pointerActive: false,
  pointerX: 380,
  pointerY: 275,
  lastTime: 0
};

var keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

var playerSize = { width: 39, height: 50 };
var chaserSize = { width: 43, height: 54 };
var foodSize = { width: 43, height: 46 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPosition(element, x, y) {
  element.style.left = x + "px";
  element.style.top = y + "px";
}

function centerOf(x, y, size) {
  return {
    x: x + size.width / 2,
    y: y + size.height / 2
  };
}

function distance(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function randomFoodPosition() {
  var padding = 36;
  var playerCenter = centerOf(state.playerX, state.playerY, playerSize);
  var nextX = 0;
  var nextY = 0;
  var attempts = 0;

  do {
    nextX = padding + Math.random() * (GAME_WIDTH - foodSize.width - padding * 2);
    nextY = 78 + Math.random() * (GAME_HEIGHT - foodSize.height - 124);
    attempts++;
  } while (
    attempts < 20 &&
    distance(playerCenter, centerOf(nextX, nextY, foodSize)) < 130
  );

  state.foodX = Math.round(nextX);
  state.foodY = Math.round(nextY);
  setPosition(food, state.foodX, state.foodY);
}

function updateHud() {
  eatenText.textContent = state.eaten;
  scoreText.textContent = state.score;
  speedText.textContent = (state.chaserSpeed / 76).toFixed(1) + "x";
}

function showScorePop(x, y, amount) {
  var pop = document.createElement("span");
  pop.className = "score-pop";
  pop.textContent = "+" + amount;
  pop.style.left = x + "px";
  pop.style.top = y + "px";
  foodScore.appendChild(pop);
  window.setTimeout(function () {
    pop.remove();
  }, 760);
}

function resetGame(countDeath) {
  if (countDeath) {
    state.deaths++;
  }

  state.playerX = Math.round((GAME_WIDTH - playerSize.width) / 2);
  state.playerY = Math.round((GAME_HEIGHT - playerSize.height) / 2);
  state.chaserX = GAME_WIDTH - chaserSize.width - 24;
  state.chaserY = 24;
  state.pointerX = state.playerX;
  state.pointerY = state.playerY;
  state.score = 0;
  state.eaten = 0;
  state.scoreStep = 10;
  state.chaserSpeed = 76;
  state.running = true;
  state.gameEnded = false;
  state.pointerActive = false;
  state.lastTime = 0;

  gameover.classList.remove("show");
  foodScore.innerHTML = "";
  startOrStop.textContent = "暂停";
  player.classList.remove("is-moving");
  setPosition(player, state.playerX, state.playerY);
  setPosition(chaser, state.chaserX, state.chaserY);
  randomFoodPosition();
  updateHud();
}

function endGame() {
  if (state.gameEnded) {
    return;
  }

  state.gameEnded = true;
  state.running = false;
  state.deaths++;
  player.classList.remove("is-moving");
  startOrStop.textContent = "继续";
  dieText.textContent = "挑战次数：" + state.deaths;
  foodText.textContent = "吃到甜点：" + state.eaten;
  levelText.textContent = "最终分数：" + state.score;
  gameover.classList.add("show");
}

function eatFood() {
  var earned = state.scoreStep;
  state.eaten++;
  state.score += earned;

  if (state.eaten % 10 === 0) {
    state.chaserSpeed += 16;
    state.scoreStep += 10;
  }

  food.classList.remove("is-eaten");
  void food.offsetWidth;
  food.classList.add("is-eaten");
  showScorePop(state.foodX + 8, state.foodY - 4, earned);
  randomFoodPosition();
  updateHud();
}

function moveToward(current, target, maxStep) {
  var delta = target - current;
  if (Math.abs(delta) <= maxStep) {
    return target;
  }
  return current + Math.sign(delta) * maxStep;
}

function updatePlayer(delta) {
  var horizontal = 0;
  var vertical = 0;

  if (keys.ArrowLeft) horizontal--;
  if (keys.ArrowRight) horizontal++;
  if (keys.ArrowUp) vertical--;
  if (keys.ArrowDown) vertical++;

  var moving = horizontal !== 0 || vertical !== 0 || state.pointerActive;
  var step = state.playerSpeed * delta;

  if (horizontal !== 0 && vertical !== 0) {
    step *= Math.SQRT1_2;
  }

  state.playerX += horizontal * step;
  state.playerY += vertical * step;

  if (state.pointerActive) {
    state.playerX = moveToward(state.playerX, state.pointerX - playerSize.width / 2, step * 1.08);
    state.playerY = moveToward(state.playerY, state.pointerY - playerSize.height / 2, step * 1.08);
  }

  state.playerX = clamp(state.playerX, 0, GAME_WIDTH - playerSize.width);
  state.playerY = clamp(state.playerY, 0, GAME_HEIGHT - playerSize.height);
  player.classList.toggle("is-moving", moving && state.running);
  setPosition(player, Math.round(state.playerX), Math.round(state.playerY));
}

function updateChaser(delta) {
  var playerCenter = centerOf(state.playerX, state.playerY, playerSize);
  var chaserCenter = centerOf(state.chaserX, state.chaserY, chaserSize);
  var dx = playerCenter.x - chaserCenter.x;
  var dy = playerCenter.y - chaserCenter.y;
  var length = Math.sqrt(dx * dx + dy * dy) || 1;
  var step = state.chaserSpeed * delta;

  state.chaserX += (dx / length) * step;
  state.chaserY += (dy / length) * step;
  state.chaserX = clamp(state.chaserX, 0, GAME_WIDTH - chaserSize.width);
  state.chaserY = clamp(state.chaserY, 0, GAME_HEIGHT - chaserSize.height);
  setPosition(chaser, Math.round(state.chaserX), Math.round(state.chaserY));
}

function checkCollisions() {
  var playerRect = {
    x: state.playerX + 7,
    y: state.playerY + 7,
    width: playerSize.width - 14,
    height: playerSize.height - 12
  };
  var chaserRect = {
    x: state.chaserX + 8,
    y: state.chaserY + 8,
    width: chaserSize.width - 16,
    height: chaserSize.height - 14
  };
  var foodRect = {
    x: state.foodX + 6,
    y: state.foodY + 6,
    width: foodSize.width - 12,
    height: foodSize.height - 12
  };

  if (rectsOverlap(playerRect, foodRect)) {
    eatFood();
  }

  if (rectsOverlap(playerRect, chaserRect)) {
    endGame();
  }
}

function gameLoop(time) {
  if (!state.lastTime) {
    state.lastTime = time;
  }

  var delta = Math.min((time - state.lastTime) / 1000, 0.032);
  state.lastTime = time;

  if (state.running && !state.gameEnded) {
    updatePlayer(delta);
    updateChaser(delta);
    checkCollisions();
  }

  window.requestAnimationFrame(gameLoop);
}

function setPaused(paused) {
  if (state.gameEnded) {
    return;
  }

  state.running = !paused;
  state.pointerActive = false;
  startOrStop.textContent = paused ? "继续" : "暂停";
  player.classList.remove("is-moving");
}

function getPointerPosition(event) {
  var rect = document.getElementById("playground").getBoundingClientRect();
  return {
    x: clamp(event.clientX - rect.left, 0, GAME_WIDTH),
    y: clamp(event.clientY - rect.top, 0, GAME_HEIGHT)
  };
}

document.addEventListener("keydown", function (event) {
  if (event.key in keys) {
    keys[event.key] = true;
    event.preventDefault();
  }

  if (event.key === " " || event.key === "Enter") {
    if (state.gameEnded) {
      resetGame(false);
    } else {
      setPaused(state.running);
    }
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  if (event.key in keys) {
    keys[event.key] = false;
    event.preventDefault();
  }
});

document.addEventListener("pointerdown", function (event) {
  if (event.button !== 0 || state.gameEnded || !state.running) {
    return;
  }

  var point = getPointerPosition(event);
  state.pointerActive = true;
  state.pointerX = point.x;
  state.pointerY = point.y;
});

document.addEventListener("pointermove", function (event) {
  if (!state.pointerActive) {
    return;
  }

  var point = getPointerPosition(event);
  state.pointerX = point.x;
  state.pointerY = point.y;
});

document.addEventListener("pointerup", function () {
  state.pointerActive = false;
});

document.addEventListener("pointerleave", function () {
  state.pointerActive = false;
});

document.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

restart.addEventListener("click", function () {
  resetGame(false);
});

startOrStop.addEventListener("click", function () {
  setPaused(state.running);
});

again.addEventListener("click", function () {
  resetGame(false);
});

gameover.addEventListener("click", function (event) {
  if (event.target === gameover) {
    resetGame(false);
  }
});

resetGame(false);
window.requestAnimationFrame(gameLoop);
