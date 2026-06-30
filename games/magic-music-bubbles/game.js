const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const highscoreElement = document.getElementById('highscore');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');

let score = 0;
let highscore = localStorage.getItem('musicBubbleHighscore') || 0;
let timeLeft = 60;
let gameActive = false;
let gameInterval;
let timerInterval;
let combo = 0;
let lastPopTime = 0;

highscoreElement.textContent = highscore;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Bubble {
    constructor() {
        this.radius = 20 + Math.random() * 40;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = 2 + Math.random() * 4;
        this.color = `hsl(${Math.random() * 360}, 70%, 80%)`;
        this.vx = (Math.random() - 0.5) * 2;
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = 0.02 + Math.random() * 0.03;
        this.popScale = 1;
        this.popped = false;
    }

    update() {
        this.y -= this.speed;
        this.x += Math.sin(this.oscillation) * 2;
        this.oscillation += this.oscillationSpeed;

        if (this.y < -this.radius) {
            this.popped = true; // Treat as popped to remove, but no score
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Bubble gradient
        const grad = ctx.createRadialGradient(
            this.x - this.radius * 0.3, 
            this.y - this.radius * 0.3, 
            this.radius * 0.1, 
            this.x, 
            this.y, 
            this.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.4, this.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.4, this.y - this.radius * 0.4, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
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

const bubbles = [];
const particles = [];

function spawnBubble() {
    if (!gameActive) return;
    bubbles.push(new Bubble());
}

function createPopParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function handlePop(e) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(mouseX - b.x, mouseY - b.y);

        if (dist < b.radius) {
            // POP!
            popBubble(i);
            return; // Only pop one bubble per click
        }
    }
}

function popBubble(index) {
    const b = bubbles[index];
    
    // Combo logic
    const now = Date.now();
    const timeDiff = now - lastPopTime;
    if (timeDiff < 800) {
        combo++;
    } else {
        combo = 1;
    }
    lastPopTime = now;

    const points = 10 * combo;
    score += points;
    scoreElement.textContent = score;

    createPopParticles(b.x, b.y, b.color);
    
    // Create floating combo text
    const text = document.createElement('div');
    text.className = 'combo-text';
    text.innerText = `${points} ✨ ${combo > 1 ? 'x' + combo + ' COMBO!' : ''}`;
    text.style.left = b.x + 'px';
    text.style.top = b.y + 'px';
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 800);

    bubbles.splice(index, 1);
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.update();
        b.draw();
        if (b.popped) bubbles.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(update);
}

function startGame() {
    startOverlay.style.display = 'none';
    gameActive = true;
    score = 0;
    combo = 0;
    lastPopTime = 0;
    scoreElement.textContent = score;

    gameInterval = setInterval(spawnBubble, 600);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    update();
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('musicBubbleHighscore', highscore);
        highscoreElement.textContent = highscore;
    }

    overlay.style.display = 'flex';
    finalScoreElement.textContent = `Du skapte ${score} harmoni!`;
}

startBtn.addEventListener('click', startGame);
window.addEventListener('mousedown', handlePop);
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePop(e.touches[0]);
}, { passive: false });
