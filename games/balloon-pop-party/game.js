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
let clouds = [];
let globalParticles = [];
let animationId;
let timerInterval;

const COLORS = {
    NORMAL: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'],
    GOLD: '#FFD700',
    BOMB: '#333333'
};

// Simple Audio Context for pops
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playPopSound(type) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'GOLD') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    } else if (type === 'BOMB') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
    } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    }

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

class Balloon {
    constructor() {
        const rand = Math.random();
        if (rand < 0.1) {
            this.type = 'GOLD';
            this.color = COLORS.GOLD;
            this.points = 5;
            this.speedMultiplier = 1.5;
        } else if (rand < 0.2) {
            this.type = 'BOMB';
            this.color = COLORS.BOMB;
            this.points = -3;
            this.speedMultiplier = 1.0;
        } else {
            this.type = 'NORMAL';
            this.color = COLORS.NORMAL[Math.floor(Math.random() * COLORS.NORMAL.length)];
            this.points = 1;
            this.speedMultiplier = 1.0;
        }

        this.radius = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = (Math.random() * 2 + 1) * this.speedMultiplier;
        this.vx = (Math.random() - 0.5) * 1;
        this.popped = false;
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        this.vx += Math.sin(Date.now() / 1000) * 0.01;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(this.x, this.y, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // String
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.quadraticCurveTo(this.x + 5, this.y + this.radius * 1.5, this.x, this.y + this.radius * 2);
        ctx.stroke();
        
        // Highlight
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, this.radius * 0.3, 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'GOLD') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    pop() {
        this.popped = true;
        playPopSound(this.type);
        for (let i = 0; i < 12; i++) {
            globalParticles.push(new Particle(this.x, this.y, this.color));
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
        this.vy += 0.1;
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

class Cloud {
    constructor() {
        this.reset();
        this.x = Math.random() * canvas.width;
    }

    reset() {
        this.x = -200;
        this.y = Math.random() * (canvas.height * 0.6);
        this.speed = Math.random() * 0.5 + 0.2;
        this.scale = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.x += this.speed;
        if (this.x > canvas.width + 200) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 25 * this.scale, this.y - 10 * this.scale, 35 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 50 * this.scale, this.y, 30 * this.scale, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnBalloon() {
    if (!gameActive) return;
    balloons.push(new Balloon());
    setTimeout(spawnBalloon, Math.random() * 800 + 400);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });

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
    
    balloons = balloons.filter(b => !b.popped);
    
    if (gameActive) {
        animationId = requestAnimationFrame(gameLoop);
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
    
    balloons.forEach(balloon => {
        if (!balloon.popped) {
            const dist = Math.hypot(x - balloon.x, y - balloon.y);
            if (dist < balloon.radius) {
                balloon.pop();
                score += balloon.points;
                if (score < 0) score = 0;
                scoreElement.textContent = score;
            }
        }
    });
}

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
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
    gameLoop();
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
clouds = Array.from({ length: 5 }, () => new Cloud());
gameLoop(); // Start loop for clouds even before game starts
