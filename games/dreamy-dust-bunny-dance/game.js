const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let score = 0;
let combo = 0;
let missedCount = 0;
const MAX_MISSED = 10;
let gameActive = false;
let notes = [];
let particles = [];
let lastNoteTime = 0;
let noteSpeed = 5;
let spawnRate = 1500;
let feverMode = false;
let feverTimer = 0;
const FEVER_THRESHOLD = 20;
const FEVER_DURATION = 5000;

const keys = {
    'a': { x: 0.2, color: '#ffb7ce', label: 'A' },
    's': { x: 0.4, color: '#b2e2f2', label: 'S' },
    'k': { x: 0.6, color: '#c2f0c2', label: 'K' },
    'l': { x: 0.8, color: '#fff2b2', label: 'L' },
};

class Note {
    constructor(key) {
        this.key = key;
        this.x = keys[key].x * canvas.width;
        this.y = -50;
        this.speed = noteSpeed;
        this.hit = false;
        this.missed = false;
        this.radius = 30;
        this.color = keys[key].color;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height + 50) {
            this.missed = true;
            missedCount++;
            if (missedCount >= MAX_MISSED) {
                gameOver();
            }
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ox = Math.cos(angle) * (this.radius + 5);
            const oy = Math.sin(angle) * (this.radius + 5);
            ctx.beginPath();
            ctx.arc(this.x + ox, this.y + oy, 8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y + 2, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y + 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function spawnNote() {
    const keyList = Object.keys(keys);
    const key = keyList[Math.floor(Math.random() * keyList.length)];
    notes.push(new Note(key));
}

function handleInput(e) {
    if (!gameActive) return;
    const key = e.key.toLowerCase();
    if (keys[key]) {
        const targetY = canvas.height - 100;
        let hit = false;
        
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.key === key && Math.abs(note.y - targetY) < 60) {
                note.hit = true;
                hit = true;
                createExplosion(note.x, note.y, note.color);
                break;
            }
        }
        
        if (hit) {
            const multiplier = feverMode ? 3 : (1 + Math.floor(combo / 10));
            score += 10 * multiplier;
            combo++;
            updateUI();
            triggerComboPop();
            
            if (combo >= FEVER_THRESHOLD && !feverMode) {
                startFever();
            }
        } else {
            combo = 0;
            updateUI();
            stopFever();
        }
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateUI() {
    scoreElement.textContent = score;
    comboElement.textContent = combo;
}

function triggerComboPop() {
    comboElement.parentElement.classList.add('combo-pop');
    setTimeout(() => {
        comboElement.parentElement.classList.remove('combo-pop');
    }, 100);
}

function startFever() {
    feverMode = true;
    feverTimer = Date.now() + FEVER_DURATION;
    document.getElementById('gameCanvas').classList.add('fever-bg');
    document.getElementById('fever-text').classList.add('visible');
}

function stopFever() {
    feverMode = false;
    document.getElementById('gameCanvas').classList.remove('fever-bg');
    document.getElementById('fever-text').classList.remove('visible');
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (feverMode && Date.now() > feverTimer) {
        stopFever();
    }

    const targetY = canvas.height - 100;
    Object.values(keys).forEach(k => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(k.x * canvas.width, targetY, 40, 0, Math.PI * 2);
        ctx.strokeStyle = k.color;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const time = Date.now() * 0.005;
        const sSize = 5 + Math.sin(time) * 3;
        ctx.fillStyle = k.color;
        ctx.beginPath();
        ctx.arc(k.x * canvas.width, targetY, sSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        note.update();
        note.draw();

        if (note.hit || note.missed) {
            notes.splice(i, 1);
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

    const now = Date.now();
    if (now - lastNoteTime > spawnRate) {
        spawnNote();
        lastNoteTime = now;
        spawnRate = Math.max(600, spawnRate * 0.99);
        noteSpeed = Math.min(12, noteSpeed + 0.01);
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    combo = 0;
    missedCount = 0;
    notes = [];
    particles = [];
    lastNoteTime = Date.now();
    spawnRate = 1500;
    noteSpeed = 5;
    gameActive = true;
    stopFever();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    updateUI();
    gameLoop();
}

function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

window.addEventListener('keydown', handleInput);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
