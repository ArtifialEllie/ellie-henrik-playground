const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');

// Game Settings
let canvasWidth, canvasHeight;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let highScore = localStorage.getItem('puffinHighScore') || 0;
highScoreElement.innerText = `High Score: ${highScore}`;

// Puffin Player
const player = {
    x: 0,
    y: 0,
    radius: 20,
    vy: 0,
    vx: 0,
    gravity: 0.25,
    lift: -6,
    color: '#ffffff',
    beakColor: '#ffeb3b',
    feetColor: '#ff80ab',
    rotation: 0
};

// Game Entities
let bubbles = [];
let fish = [];
let particles = [];

// Input Handling
let isPressing = false;

function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 3;
}

window.addEventListener('resize', resize);
resize();

// Input listeners
window.addEventListener('mousedown', () => isPressing = true);
window.addEventListener('mouseup', () => isPressing = false);
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isPressing = true;
}, { passive: false });
window.addEventListener('touchend', () => isPressing = false);

function spawnBubble() {
    const radius = Math.random() * 30 + 20;
    bubbles.push({
        x: canvasWidth + radius,
        y: Math.random() * canvasHeight,
        radius: radius,
        speed: Math.random() * 2 + 1,
        color: `hsla(${Math.random() * 360}, 70%, 80%, 0.5)`
    });
}

function spawnFish() {
    const size = 15;
    fish.push({
        x: canvasWidth + size,
        y: Math.random() * canvasHeight,
        size: size,
        speed: Math.random() * 2 + 2,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        type: 'normal'
    });
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function drawPuffin(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    // Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = p.beakColor;
    ctx.beginPath();
    ctx.moveTo(18, -5);
    ctx.lineTo(28, -2);
    ctx.lineTo(18, 2);
    ctx.closePath();
    ctx.fill();

    // Feet
    ctx.fillStyle = p.feetColor;
    ctx.beginPath();
    ctx.ellipse(-5, 15, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(5, 15, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Puffin Physics
    if (isPressing) {
        player.vy += player.lift * 0.1; // Soft dive
    } else {
        player.vy += player.gravity;
    }

    // Puffin horizontal movement (follows mouse/touch loosely)
    // Since it's a "Plunge", we'll make it move mostly vertically but slightly floaty
    player.vy *= 0.98; // Friction
    player.y += player.vy;

    // Screen bounds
    if (player.y < 0) {
        player.y = 0;
        player.vy = 0;
    }
    if (player.y > canvasHeight) {
        // Falling off bottom is okay, but let's make it bounce
        player.y = canvasHeight;
        player.vy *= -0.5;
    }

    // Rotation based on velocity
    player.rotation = Math.max(-0.5, Math.min(0.5, player.vy * 0.05));

    // Entities
    if (Math.random() < 0.02) spawnBubble();
    if (Math.random() < 0.01) spawnFish();

    bubbles.forEach((b, i) => {
        b.x -= b.speed;
        if (b.x < -b.radius) bubbles.splice(i, 1);
    });

    fish.forEach((f, i) => {
        f.x -= f.speed;
        if (f.x < -f.size) fish.splice(i, 1);

        // Collision check
        const dx = player.x - f.x;
        const dy = player.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + f.size) {
            score += 10;
            scoreElement.innerText = `Score: ${score}`;
            createParticles(f.x, f.y, f.color);
            fish.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background bubbles
    ctx.globalAlpha = 0.4;
    bubbles.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    ctx.globalAlpha = 1.0;

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Fish
    fish.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.size, f.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(f.x + f.size, f.y);
        ctx.lineTo(f.x + f.size + 5, f.y - 5);
        ctx.lineTo(f.x + f.size + 5, f.y + 5);
        ctx.closePath();
        ctx.fill();
    });

    drawPuffin(player);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    scoreElement.innerText = `Score: ${score}`;
    player.y = canvasHeight / 3;
    player.vy = 0;
    bubbles = [];
    fish = [];
    particles = [];
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('puffinHighScore', highScore);
        highScoreElement.innerText = `High Score: ${highScore}`;
    }
    finalScoreElement.innerText = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

resize();
gameLoop();
