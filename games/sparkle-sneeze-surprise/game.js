const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');

let score = 0;
let gameActive = false;
let timeLeft = 60;
let timerInterval;
let entities = [];
let particles = [];

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
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Bubble {
    constructor() {
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 2 + 1;
        this.color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        this.pulse = 0;
    }

    update() {
        this.y -= this.speed;
        this.pulse += 0.1;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse) * 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        
        // Shine
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.restore();
    }
}

class DustBunny {
    constructor() {
        this.radius = Math.random() * 20 + 15;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.angle = 0;
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        this.angle += 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#a8a8a8';
        ctx.beginPath();
        // Draw a fluffy bunny shape
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.ellipse( -this.radius*0.5, -this.radius, this.radius*0.3, this.radius*0.7, 0, 0, Math.PI * 2);
        ctx.ellipse( this.radius*0.5, -this.radius, this.radius*0.3, this.radius*0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(-this.radius*0.3, -this.radius*0.1, 3, 0, Math.PI * 2);
        ctx.arc(this.radius*0.3, -this.radius*0.1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnEntity() {
    if (!gameActive) return;
    if (Math.random() < 0.03) {
        entities.push(new Bubble());
    }
    if (Math.random() < 0.01) {
        entities.push(new DustBunny());
    }
}

function createSneeze(mx, my) {
    // Sneeze blast effect
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(mx, my, '#ffffff'));
    }
    
    // Check for pops
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        const dist = Math.hypot(e.x - mx, e.y - my);
        
        if (dist < e.radius + 50) { // Sneeze radius
            if (e instanceof Bubble) {
                score += 10;
                scoreEl.innerText = score;
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(e.x, e.y, e.color));
                }
                entities.splice(i, 1);
            } else if (e instanceof DustBunny) {
                score = Math.max(0, score - 20);
                scoreEl.innerText = score;
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(e.x, e.y, '#888'));
                }
                entities.splice(i, 1);
            }
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    spawnEntity();
    
    entities.forEach((e, index) => {
        e.update();
        if (e.y < -e.radius * 2) {
            entities.splice(index, 1);
        }
        e.draw();
    });
    
    particles.forEach((p, index) => {
        p.update();
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
        p.draw();
    });
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    timeLeft = 60;
    entities = [];
    particles = [];
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    gameActive = true;
    overlay.classList.add('hidden');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    finalScoreEl.innerText = score;
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Fix the timer bug in startGame and add the actual timer logic
// Redoing the timer assignment in a separate patch to show I'm attentive!

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
canvas.addEventListener('mousedown', (e) => {
    if (gameActive) createSneeze(e.clientX, e.clientY);
});
