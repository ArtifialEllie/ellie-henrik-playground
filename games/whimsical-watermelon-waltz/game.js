const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');

let score = 0;
let combo = 0;
let lives = 3;
let gameActive = false;
let slices = [];
let particles = [];
let lastSliceTime = 0;
let spawnRate = 1500;
let gameSpeed = 2;

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resize);
resize();

class Slice {
    constructor() {
        this.type = Math.random() < 0.1 ? 'golden' : 'normal';
        this.radius = 30 + Math.random() * 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = gameSpeed + Math.random() * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.color = this.type === 'golden' ? '#ffd700' : '#ff4d6d';
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw watermelon slice (semi-circle)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Rind
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI, false);
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.type === 'golden' ? '#fff' : '#2ecc71';
        ctx.stroke();

        // Seeds
        ctx.fillStyle = this.type === 'golden' ? '#b8860b' : '#333';
        for (let i = 0; i < 5; i++) {
            const seedX = -this.radius * 0.6 + Math.random() * this.radius * 1.2;
            const seedY = -Math.random() * this.radius * 0.5;
            ctx.beginPath();
            ctx.arc(seedX, seedY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function spawnSlice() {
    const now = Date.now();
    if (now - lastSliceTime > spawnRate) {
        slices.push(new Slice());
        lastSliceTime = now;
        spawnRate = Math.max(600, spawnRate - 10);
        gameSpeed = Math.min(6, gameSpeed + 0.01);
    }
}

function handleInput(e) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!clientX || !clientY) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = slices.length - 1; i >= 0; i--) {
        const s = slices[i];
        const dist = Math.hypot(x - s.x, y - s.y);
        if (dist < s.radius + 10) {
            if (s.type === 'golden') {
                score += 50 * (combo + 1);
                createParticles(s.x, s.y, '#ffd700');
            } else {
                score += 10 * (combo + 1);
                createParticles(s.x, s.y, '#ff4d6d');
            }
            combo++;
            slices.splice(i, 1);
            updateUI();
            return;
        }
    }
    
    combo = 0;
    updateUI();
}

function updateUI() {
    scoreElement.innerText = `Score: ${score}`;
    comboElement.innerText = `Combo: x${combo + 1} | Lives: ${'❤️'.repeat(lives)}`;
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnSlice();

    for (let i = slices.length - 1; i >= 0; i--) {
        const s = slices[i];
        s.update();
        s.draw();
        if (s.y > canvas.height + s.radius) {
            slices.splice(i, 1);
            handleMiss();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    combo = 0;
    lives = 3;
    slices = [];
    particles = [];
    spawnRate = 1500;
    gameSpeed = 2;
    gameActive = true;
    
    updateUI();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    gameLoop();
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = `Your score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

function handleMiss() {
    combo = 0;
    lives--;
    updateUI();
    createParticles(canvas.width / 2, canvas.height / 2, '#fff');
    if (lives <= 0) {
        gameOver();
    }
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput);
