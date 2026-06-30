const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let particles = [];
let targets = [];
let timerInterval;

const colors = [
    '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', 
    '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7'
];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.gravity = 0.1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Target {
    constructor() {
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 200;
        this.maxLife = 200;
        this.pulse = 0;
    }

    update() {
        this.life--;
        this.pulse += 0.1;
    }

    draw() {
        const pulseSize = Math.sin(this.pulse) * 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        
        // Center sprinkle
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function spawnTarget() {
    if (targets.length < 5) {
        targets.push(new Target());
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grey-ish background effect
    ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    targets.forEach((target, index) => {
        target.update();
        target.draw();
        if (target.life <= 0) {
            targets.splice(index, 1);
        }
    });

    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });

    spawnTarget();
    requestAnimationFrame(update);
}

function handleInput(e) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    targets.forEach((target, index) => {
        const dist = Math.hypot(x - target.x, y - target.y);
        if (dist < target.radius + 10) {
            createExplosion(target.x, target.y, target.color);
            targets.splice(index, 1);
            score++;
            scoreElement.innerText = score;
        }
    });
}

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    particles = [];
    targets = [];
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    update();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
