const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const comboEl = document.getElementById('combo');
const comboBoard = document.getElementById('combo-board');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const frenzyBoard = document.getElementById('frenzy-board');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');

let score = 0;
let combo = 0;
let lastClickTime = 0;
let timeLeft = 30;
let gameActive = false;
let jellyfish = [];
let particles = [];
let isFrenzy = false;
let frenzyTimeout;
let timerInterval;

const COLORS = [
    '#FF00DE', '#00D4FF', '#FFFB00', '#00FF6A', '#FF4D00', '#9D00FF'
];

class Jellyfish {
    constructor() {
        this.reset();
    }

    reset() {
        this.radius = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 2 + 1;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.amplitude = Math.random() * 50 + 20;
        this.frequency = Math.random() * 0.02 + 0.01;
        this.offset = Math.random() * Math.PI * 2;
        this.pulse = 0;
        this.pulseSpeed = Math.random() * 0.05 + 0.05;
    }

    update() {
        this.y -= this.speed;
        this.x += Math.sin(this.y * this.frequency + this.offset) * 0.5;
        this.pulse += this.pulseSpeed;
        
        if (this.y < -this.radius * 2) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const pulseScale = 1 + Math.sin(this.pulse) * 0.1;
        
        // Tentacles
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 8, this.radius * 0.5);
            ctx.bezierCurveTo(
                i * 12 + Math.sin(this.pulse) * 5, this.radius * 1.2,
                i * 8 + Math.cos(this.pulse) * 5, this.radius * 1.8,
                i * 10, this.radius * 2.5
            );
            ctx.stroke();
        }

        // Head (Bell)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulseScale, Math.PI, 0);
        ctx.fill();
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        gradient.addColorStop(0, this.color + '66');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isClicked(mx, my) {
        const dx = mx - this.x;
        const dy = my - this.y;
        return Math.sqrt(dx*dx + dy*dy) < this.radius * 1.5;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
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
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnJellyfish() {
    jellyfish = [];
    for (let i = 0; i < 8; i++) {
        jellyfish.push(new Jellyfish());
        // Stagger their starts
        jellyfish[i].y = canvas.height + Math.random() * canvas.height;
    }
}

function startGame() {
    score = 0;
    combo = 0;
    lastClickTime = 0;
    timeLeft = 30;
    isFrenzy = false;
    gameActive = true;
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    comboBoard.classList.add('hidden');
    overlay.classList.add('hidden');
    
    spawnJellyfish();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.textContent = score;
}

function handleInput(e) {
    if (!gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const my = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    for (let i = jellyfish.length - 1; i >= 0; i--) {
        const j = jellyfish[i];
        if (j.isClicked(mx, my)) {
            // Combo logic
            const now = Date.now();
            if (now - lastClickTime < 1000) {
                combo++;
            } else {
                combo = 1;
            }
            lastClickTime = now;

            // Trigger Frenzy Mode at combo 10
            if (combo >= 10 && !isFrenzy) {
                activateFrenzy();
            }

            // Show combo board if combo > 1
            if (combo > 1) {
                comboBoard.classList.remove('hidden');
                comboEl.textContent = combo;
            } else {
                comboBoard.classList.add('hidden');
            }

            // Explosion of particles
            for (let p = 0; p < 15; p++) {
                particles.push(new Particle(j.x, j.y, j.color));
            }
            
            // Points based on combo
            const pointsGained = (isFrenzy ? 2 : 1) * combo;
            score += pointsGained;
            scoreEl.textContent = score;
            
            // Play a little beep (simulated)
            playNote();
            
            j.reset();
            break;
        }
    }
}

function activateFrenzy() {
    isFrenzy = true;
    frenzyBoard.classList.remove('hidden');
    
    // Spawn extra jellyfish for the frenzy!
    for (let i = 0; i < 5; i++) {
        jellyfish.push(new Jellyfish());
    }

    clearTimeout(frenzyTimeout);
    frenzyTimeout = setTimeout(() => {
        isFrenzy = false;
        frenzyBoard.classList.add('hidden');
    }, 5000);
}

function playNote() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = new (window.AudioContext || window.webkitAudioContext)().createOscillator();
    const gainNode = new (window.AudioContext || window.webkitAudioContext)().createGain();

    oscillator.type = 'sine';
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameActive) {
        jellyfish.forEach(j => {
            j.update();
            j.draw();
        });
    }
    
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

resize();
spawnJellyfish(); // Initial spawn for the background effect
animate();
