const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highscoreElement = document.getElementById('highscore');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

canvas.width = 400;
canvas.height = 600;

// Game State
let gameActive = false;
let score = 0;
let highscore = localStorage.getItem('noodleJumpHighscore') || 0;
highscoreElement.innerText = `Best: ${highscore}`;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    radius: 15,
    vx: 0,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.4,
    color: '#ff00ff',
    glow: '#ff00ff'
};

// Platforms (the "Noodles")
let platforms = [];
const platformWidth = 70;
const platformHeight = 15;
const minPlatformDist = 80;
const maxPlatformDist = 140;

function createPlatform(y, isFirst = false) {
    return {
        x: Math.random() * (canvas.width - platformWidth),
        y: y,
        width: platformWidth,
        height: platformHeight,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        glow: `hsl(${Math.random() * 360}, 100%, 70%)`
    };
}

function initPlatforms() {
    platforms = [];
    for (let i = 0; i < 7; i++) {
        platforms.push(createPlatform(canvas.height - i * 100));
    }
    // First platform is always under player
    platforms[0].x = player.x - platformWidth / 2;
    platforms[0].y = player.y + player.radius;
}

// Controls
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
    if (!gameActive) return;

    // Movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= 0.8;
    if (keys['ArrowRight'] || keys['KeyD']) player.vx += 0.8;
    player.vx *= 0.92; // Friction

    player.x += player.vx;

    // Screen wrap
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;

    // Gravity and Jump
    player.vy += player.gravity;
    player.y += player.vy;

    // Platform collision
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x + player.radius > p.x && 
                player.x - player.radius < p.x + p.width &&
                player.y + player.radius > p.y && 
                player.y + player.radius < p.y + p.height + player.vy) {
                
                player.vy = player.jumpStrength;
                // Little "boing" effect could go here
            }
        });
    }

    // Camera scroll
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        score += Math.floor(diff);
        
        platforms.forEach(p => {
            p.y += diff;
            if (p.y > canvas.height) {
                // Recycle platform to top
                const lastPlatformY = platforms.reduce((min, p) => Math.min(min, p.y), canvas.height);
                p.y = lastPlatformY - (Math.random() * (maxPlatformDist - minPlatformDist) + minPlatformDist);
                p.x = Math.random() * (canvas.width - platformWidth);
                p.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
                p.glow = p.color;
            }
        });
    }

    // Game Over
    if (player.y > canvas.height + 100) {
        endGame();
    }

    scoreElement.innerText = `Score: ${score}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Platforms (Noodles)
    platforms.forEach(p => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.glow;
        ctx.fillStyle = p.color;
        
        // Draw as a rounded noodle
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Player
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.glow;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Add some "neon particles" in background
    if (Math.random() > 0.95) {
        // This is a simple trick: just draw some random dots
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.vy = 0;
    player.vx = 0;
    initPlatforms();
    gameActive = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function endGame() {
    gameActive = false;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('noodleJumpHighscore', highscore);
        highscoreElement.innerText = `Best: ${highscore}`;
    }
    finalScoreElement.innerText = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start the animation loop
gameLoop();
