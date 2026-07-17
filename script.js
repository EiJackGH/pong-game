// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Paddles
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_MARGIN = 14;
const PLAYER_X = PADDLE_MARGIN;
const COMP_X = W - PADDLE_MARGIN - PADDLE_WIDTH;
let playerY = (H - PADDLE_HEIGHT) / 2;
let compY = (H - PADDLE_HEIGHT) / 2;
const PADDLE_SPEED = 6; // keyboard speed
const COMP_MAX_SPEED = 4.5; // AI max speed

// Ball
const BALL_RADIUS = 8;
let ball = {
  x: W / 2,
  y: H / 2,
  vx: 5 * (Math.random() > 0.5 ? 1 : -1),
  vy: 3 * (Math.random() > 0.5 ? 1 : -1),
  r: BALL_RADIUS
};

// Game
let playerScore = 0;
let computerScore = 0;
const WIN_SCORE = 10;
let paused = false;
let gameOver = false;

// Controls
let keys = { ArrowUp: false, ArrowDown: false };
let hasMouse = false;

// UI elements
const playerScoreEl = document.getElementById('playerScore');
const compScoreEl = document.getElementById('computerScore');

function resetBall(direction = 0) {
  ball.x = W / 2;
  ball.y = H / 2;
  // randomize initial velocity; direction: -1 left, 1 right, 0 random
  const angle = (Math.random() * 0.6 - 0.3); // small angle
  const speed = 5;
  let sign;
  if (direction === 0) sign = (Math.random() > 0.5 ? 1 : -1);
  else sign = direction;
  ball.vx = speed * (0.9 + Math.random() * 0.4) * sign;
  ball.vy = speed * Math.tan(angle);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Collision: circle vs rect (paddle)
function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
  // Find closest point on rectangle to circle center
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= (r * r);
}

// Draw
function drawNet() {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const step = 18;
  for (let y = 10; y < H; y += step) {
    ctx.fillRect((W/2) - 1, y, 2, step/2);
  }
  ctx.restore();
}

function draw() {
  // background
  ctx.clearRect(0,0,W,H);

  // center net
  drawNet();

  // paddles
  ctx.fillStyle = '#e6eefc';
  ctx.fillRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(COMP_X, compY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // ball
  ctx.beginPath();
  ctx.fillStyle = '#60a5fa';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();

  // scores (we update DOM separately)
}

// Update physics
function update() {
  if (paused || gameOver) return;

  // Player keyboard movement
  if (!hasMouse) {
    if (keys.ArrowUp) playerY -= PADDLE_SPEED;
    if (keys.ArrowDown) playerY += PADDLE_SPEED;
  }
  // keep paddles in bounds
  playerY = clamp(playerY, 0, H - PADDLE_HEIGHT);

  // Simple AI: move toward ball center
  const target = ball.y - (PADDLE_HEIGHT / 2);
  let dy = target - compY;
  // proportional movement with max speed
  compY += clamp(dy * 0.12, -COMP_MAX_SPEED, COMP_MAX_SPEED);
  compY = clamp(compY, 0, H - PADDLE_HEIGHT);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions (top/bottom)
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy *= -1;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy *= -1;
  }

  // Left right: check scoring or paddle collisions
  // Player paddle collision
  if (ball.vx < 0 && circleRectCollision(ball.x, ball.y, ball.r, PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT)) {
    // Bounce and add spin based on where it hit the paddle
    const hitPos = (ball.y - (playerY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2); // -1..1
    const speed = Math.min(11, Math.hypot(ball.vx, ball.vy) + 0.5); // slightly speed up
    ball.vx = Math.abs(speed) * (1 + Math.abs(hitPos)*0.07); // ensure moving right
    ball.vy = speed * hitPos * 0.9;
    // nudge to avoid sticking
    ball.x = PLAYER_X + PADDLE_WIDTH + ball.r + 0.1;
  }

  // Computer paddle collision
  if (ball.vx > 0 && circleRectCollision(ball.x, ball.y, ball.r, COMP_X, compY, PADDLE_WIDTH, PADDLE_HEIGHT)) {
    const hitPos = (ball.y - (compY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
    const speed = Math.min(11, Math.hypot(ball.vx, ball.vy) + 0.5);
    ball.vx = -Math.abs(speed) * (1 + Math.abs(hitPos)*0.07); // ensure moving left
    ball.vy = speed * hitPos * 0.9;
    ball.x = COMP_X - ball.r - 0.1;
  }

  // Score conditions
  if (ball.x + ball.r < 0) {
    // computer scores
    computerScore++;
    compScoreEl.textContent = computerScore;
    if (computerScore >= WIN_SCORE) {
      finishGame('Computer wins!');
    } else {
      paused = true;
      resetBall(1); // send ball toward player
    }
  } else if (ball.x - ball.r > W) {
    // player scores
    playerScore++;
    playerScoreEl.textContent = playerScore;
    if (playerScore >= WIN_SCORE) {
      finishGame('Player wins!');
    } else {
      paused = true;
      resetBall(-1); // send ball toward computer
    }
  }
}

function finishGame(message) {
  gameOver = true;
  paused = true;
  setTimeout(() => {
    alert(message + '\nRefresh to play again.');
  }, 50);
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  // center paddle on cursor
  playerY = clamp(y - PADDLE_HEIGHT/2, 0, H - PADDLE_HEIGHT);
  hasMouse = true;
});

canvas.addEventListener('mouseleave', () => {
  // allow keyboard when mouse leaves
  hasMouse = false;
});

canvas.addEventListener('click', () => {
  // resume after a point or if paused (click canvas)
  if (gameOver) {
    // reload entire game
    location.reload();
  } else {
    paused = false;
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    paused = !paused;
    e.preventDefault();
    return;
  }
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    keys[e.code] = true;
    // if user starts using keyboard, mark hasMouse=false so keyboard takes precedence
    hasMouse = false;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    keys[e.code] = false;
    e.preventDefault();
  }
});

// initialize scoreboard
playerScoreEl.textContent = playerScore;
compScoreEl.textContent = computerScore;

// Start
resetBall(0);
requestAnimationFrame(loop);
