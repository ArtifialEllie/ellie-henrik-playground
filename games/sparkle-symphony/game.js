const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const magicBar = document.getElementById('magic-bar');
const burstButton = document.getElementById('burst-button');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

let score = 0;
let combo = 0;
let magicPower = 0;
let gameActive = false;
let sparkles = [];
let particles = [];
let lastTime = 0;
let spawnTimer = 0;

// Set canvas size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Sparkle {
    constructor() {
        this.radius = Math.random() * 10 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = Math.random() * 2 + 2 + (score / 500);
        this.color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.y += this.speed;
        this.angle += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.radius,
                       Math.sin((18 + i * 72) * Math.PI / 180) * this.radius);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.radius / 2),
                       Math.sin((54 + i * 72) * Math.PI / 180) * (this.radius / 2));
        }
        ctx.closePath();
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

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function handleInput(ex, ey) {
    if (!gameActive) return;

    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        const dist = Math.hypot(ex - s.x, ey - s.y);
        if (dist < s.radius * 1.5) {
            combo++;
            const comboBonus = Math.floor(combo / 5) * 5;
            score += 10 + comboBonus;
            magicPower = Math.min(100, magicPower + 10 + (comboBonus / 2));
            updateUI();
            createExplosion(s.x, s.y, s.color);
            sparkles.splice(i, 1);
            
            playMagicalNote();
            break;
        }
    }
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playMagicalNote(freqMult = 1) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const note = notes[Math.floor(Math.random() * notes.length)] * freqMult;
    oscillator.frequency.setValueAtTime(note, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function triggerMagicBurst() {
    if (magicPower < 100 || !gameActive) return;

    const burstScore = sparkles.length * 20;
    score += burstScore;
    magicPower = 0;
    
    sparkles.forEach(s => {
        createExplosion(s.x, s.y, s.color);
        playMagicalNote(1.5);
    });
    
    sparkles = [];
    updateUI();
    
    // Big flash effect
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateUI() {
    scoreElement.innerText = score;
    comboElement.innerText = combo;
    magicBar.style.width = magicPower + '%';
    
    if (magicPower >= 100) {
        burstButton.classList.remove('hidden');
    } else {
        burstButton.classList.add('hidden');
    }
}

function gameLoop(time) {
    if (!gameActive) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnTimer += deltaTime;
    if (spawnTimer > 1000 - Math.min(600, score / 10)) {
        sparkles.push(new Sparkle());
        spawnTimer = 0;
    }

    sparkles.forEach((s, index) => {
        s.update();
        s.draw();
        if (s.y > canvas.height + s.radius) {
            sparkles.splice(index, 1);
            magicPower = Math.max(0, magicPower - 15);
            combo = 0;
            updateUI();
        }
    });

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(index, 1);
    });

    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    combo = 0;
    magicPower = 50;
    sparkles = [];
    particles = [];
    gameActive = true;
    updateUI();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

canvas.addEventListener('mousedown', (e) => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

burstButton.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerMagicBurst();
});

setInterval(() => {
    if (gameActive) {
        magicPower = Math.max(0, magicPower - 1);
        updateUI();
        if (magicPower <= 0 && sparkles.length === 0 && score === 0) {
            // Don't game over immediately at start, but if they lose all power...
            // Actually, let's make it a bit more forgiving.
        }
    }
}, 100);

// Revised Game Over: only when power hits 0 and they can't get it back? 
// No, let's keep it simple: if power hits 0, you have a few seconds or you lose.
// Let's just make it: power hits 0 -> Game Over.
setInterval(() => {
    if (gameActive && magicPower <= 0) {
        gameOver();
    }
}, 500);

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
