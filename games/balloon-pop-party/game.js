const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('time');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let balloons = [];
let animationId;
let timerInterval;

const COLORS = [
    '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', 
    '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'
];

class Balloon {
    constructor() {
        this.radius = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 2 + 1;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.vx = (Math.random() - 0.5) * 1;
        this.popped = false;
        this.popParticles = [];
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        
        // Gentle swaying
        this.vx += Math.sin(Date.now() / 1000) * 0.01;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(this.x, this.y, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // String
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.quadraticCurveTo(this.x + 5, this.y + this.radius * 1.5, this.x, this.y + this.radius * 2);
        ctx.stroke();
        
        // Highlight
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, this.radius * 0.3, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    pop() {
        this.popped = true;
        for (let i = 0; i < 10; i++) {
            this.popParticles.push(new Particle(this.x, this.y, this.color));
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.radius = Math.random() * 3 + 1;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= 0.02;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnBalloon() {
    if (!gameActive) return;
    balloons.push(new Balloon());
    
    // Randomize spawn interval
    setTimeout(spawnBalloon, Math.random() * 800 + 400);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    balloons.forEach((balloon, index) => {
        balloon.update();
        balloon.draw();
        
        if (balloon.y + balloon.radius * 2 < 0) {
            balloons.splice(index, 1);
        }
    });
    
    // Update and draw particles
    const allParticles = balloons.flatMap(b => b.popParticles);
    allParticles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) {
            // This is tricky because particles stay in the balloon object
            // We'll just let them fade out.
        }
    });
    
    // Clean up popped balloons
    balloons = balloons.filter(b => !b.popped);
    
    // Note: particles are lost when balloon is filtered. 
    // Let's refine particle management.
    
    animationId = requestAnimationFrame(update);
}

// Refined particle system
let globalParticles = [];
function updateRefined() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    balloons.forEach((balloon, index) => {
        balloon.update();
        balloon.draw();
        if (balloon.y + balloon.radius * 2 < 0) {
            balloons.splice(index, 1);
        }
    });
    
    globalParticles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) globalParticles.splice(index, 1);
    });
    
    animationId = requestAnimationFrame(updateRefined);
}

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    balloons.forEach(balloon => {
        if (!balloon.popped) {
            const dist = Math.hypot(x - balloon.x, y - balloon.y);
            if (dist < balloon.radius) {
                balloon.pop();
                score++;
                scoreElement.textContent = score;
                
                // Add particles to global system
                for (let i = 0; i < 10; i++) {
                    globalParticles.push(new Particle(balloon.x, balloon.y, balloon.color));
                }
            }
        }
    });
}

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    balloons = [];
    globalParticles = [];
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    resize();
    spawnBalloon();
    startTimer();
}

function stopGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
    
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            stopGame();
        }
    }, 1000);
}

window.addEventListener('resize', resize);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, {passive: false});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize
resize();
loop();
// I'll rewrite the startGame function slightly in game.js to fit this.
