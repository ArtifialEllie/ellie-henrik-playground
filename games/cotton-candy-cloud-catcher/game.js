const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let clouds = [];
let particles = [];
let basket = {
    x: 0,
    y: 0,
    width: 100,
    height: 60
};

// Configure canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    basket.y = canvas.height - 80;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input handling
function handleInput(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    basket.x = clientX - basket.width / 2;
}

canvas.addEventListener('mousemove', handleInput);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

// Cloud class
class Cloud {
    constructor() {
        this.reset();
    }

    reset() {
        this.width = 60 + Math.random() * 60;
        this.height = this.width * 0.6;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2 + Math.random() * 3;
        this.color = `hsl(${Math.random() * 360}, 100%, 85%)`;
        this.drift = (Math.random() - 0.5) * 2;
        this.isSpecial = Math.random() < 0.1; // 10% chance to be a golden cloud
        if (this.isSpecial) {
            this.color = '#ffd700';
            this.speed *= 1.5;
        }
    }

    update() {
        this.y += this.speed;
        this.x += this.drift;
        
        // Bounce off walls
        if (this.x < 0 || this.x + this.width > canvas.width) {
            this.drift *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.height/2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/4, this.y + this.height/4, this.height/3, 0, Math.PI * 2);
        ctx.arc(this.x + 3*this.width/4, this.y + this.height/4, this.height/3, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isSpecial) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// Particle system for "pop" effect
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
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

function createPopEffect(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function spawnCloud() {
    if (!gameActive) return;
    if (clouds.length < 10) {
        clouds.push(new Cloud());
    }
    setTimeout(spawnCloud, 800 + Math.random() * 1000);
}

function update() {
    if (!gameActive) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw basket
    ctx.fillStyle = '#d2b48c';
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 10);
    ctx.fill();
    
    // Basket details
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(basket.x + 5, basket.y + 5, basket.width - 10, basket.height - 10);

    // Update and draw clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        cloud.update();
        cloud.draw();

        // Collision check
        if (
            cloud.y + cloud.height > basket.y &&
            cloud.y < basket.y + basket.height &&
            cloud.x + cloud.width > basket.x &&
            cloud.x < basket.x + basket.width
        ) {
            score += cloud.isSpecial ? 5 : 1;
            scoreElement.innerText = score;
            createPopEffect(cloud.x + cloud.width/2, cloud.y + cloud.height/2, cloud.color);
            clouds.splice(i, 1);
        } else if (cloud.y > canvas.height) {
            clouds.splice(i, 1);
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(update);
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            gameActive = false;
            endGame();
        }
    }, 1000);
}

function endGame() {
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function startGame() {
    score = 0;
    timeLeft = 60;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    clouds = [];
    particles = [];
    gameActive = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    spawnCloud();
    startTimer();
    update();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
