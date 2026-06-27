const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const comboBoard = document.getElementById('combo-board');
const feverBoard = document.getElementById('fever-board');
const timerElement = document.getElementById('time');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let combo = 0;
let timeLeft = 60;
let highscore = localStorage.getItem('balloonPopHighscore') || 0;
let gameActive = false;
let balloons = [];
let clouds = [];
let globalParticles = [];
let animationId;
let timerInterval;
let lastPopTime = 0;
let feverMode = false;
let feverTimer = 0;

const COLORS = {
    NORMAL: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'],
    GOLD: '#FFD700',
    BOMB: '#333333',
    RAINBOW: 'RAINBOW',
    HEART: '#FF69B4',
    SPARKLE: '#E0B0FF'
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
    } else if (type === 'RAINBOW') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.2);
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
        if (rand < 0.05) {
            this.type = 'RAINBOW';
            this.color = COLORS.RAINBOW;
            this.points = 10;
            this.speedMultiplier = 1.2;
        } else if (rand < 0.1) {
            this.type = 'GOLD';
            this.color = COLORS.GOLD;
            this.points = 5;
            this.speedMultiplier = 1.5;
        } else if (rand < 0.15) {
            this.type = 'HEART';
            this.color = COLORS.HEART;
            this.points = 2;
            this.speedMultiplier = 1.1;
        } else if (rand < 0.2) {
            this.type = 'SPARKLE';
            this.color = COLORS.SPARKLE;
            this.points = 3;
            this.speedMultiplier = 1.3;
        } else if (rand < 0.3) {
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
        if (this.color === COLORS.RAINBOW) {
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.2, '#ff00ff');
            gradient.addColorStop(0.4, '#00ffff');
            gradient.addColorStop(0.6, '#ffff00');
            gradient.addColorStop(0.8, '#00ff00');
            gradient.addColorStop(1, '#ff0000');
            ctx.fillStyle = gradient;
            
            // Animate rainbow color shift
            const time = Date.now() * 0.002;
            ctx.translate(this.x, this.y);
            ctx.rotate(time);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else if (this.type === 'HEART') {
            ctx.fillStyle = this.color;
            const x = this.x;
            const y = this.y;
            const r = this.radius;
            ctx.beginPath();
            ctx.moveTo(x, y + r * 0.3);
            ctx.bezierCurveTo(x - r, y - r * 0.5, x - r * 1.5, y + r * 0.3, x, y + r * 0.8);
            ctx.bezierCurveTo(x + r * 1.5, y + r * 0.3, x + r, y - r * 0.5, x, y + r * 0.3);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
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

        if (this.type === 'GOLD' || this.type === 'RAINBOW' || this.type === 'SPARKLE') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    pop() {
        this.popped = true;
        playPopSound(this.type);
        
        if (this.type === 'HEART') {
            timeLeft += 2;
            timerElement.style.color = '#FF69B4';
            setTimeout(() => timerElement.style.color = '', 500);
        }

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
    
    let spawnRate = Math.random() * 800 + 400;
    if (feverMode) {
        spawnRate = Math.random() * 300 + 100;
    }
    
    setTimeout(spawnBalloon, spawnRate);
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
        if (feverMode) {
            feverTimer--;
            if (feverTimer <= 0) {
                feverMode = false;
                feverBoard.classList.add('hidden');
            }
        }
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
                
                // Combo System
                const now = Date.now();
                if (now - lastPopTime < 1000) {
                    combo++;
                } else {
                    combo = 1;
                }
                lastPopTime = now;

                let multiplier = 1;
                if (combo >= 10) multiplier = 3;
                else if (combo >= 5) multiplier = 2;
                else if (combo >= 2) multiplier = 1.5;

                score += Math.floor(balloon.points * multiplier);
                if (score < 0) score = 0;
                
                scoreElement.textContent = score;
                
                if (combo > 1) {
                    comboBoard.classList.remove('hidden');
                    comboElement.textContent = combo;
                } else {
                    comboBoard.classList.add('hidden');
                }

                // Fever Mode Trigger
                if (combo >= 15) {
                    triggerFever();
                }
                
                // Add combo particles if high combo
                if (multiplier > 1) {
                    for (let i = 0; i < 5; i++) {
                        globalParticles.push(new Particle(x, y, '#FFD700'));
                    }
                }
            }
        }
    });
}

function triggerFever() {
    if (feverMode) return;
    feverMode = true;
    feverTimer = 300; // Approx 5 seconds at 60fps
    feverBoard.classList.remove('hidden');
    
    // Special effects for fever
    for (let i = 0; i < 20; i++) {
        globalParticles.push(new Particle(canvas.width / 2, canvas.height / 2, '#FFD700'));
    }
}

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    combo = 0;
    timeLeft = 60;
    gameActive = true;
    balloons = [];
    globalParticles = [];
    feverMode = false;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    comboBoard.classList.add('hidden');
    feverBoard.classList.add('hidden');
    
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

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('balloonPopHighscore', highscore);
    }
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
document.getElementById('high-score').textContent = highscore;
gameLoop(); // Start loop for clouds even before game starts
