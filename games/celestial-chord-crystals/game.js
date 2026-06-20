const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let multiplier = 1;
let multiplierTimer = 0;
let gameActive = false;
let crystals = [];
let particles = [];
let lastTime = 0;

// Musical tones (Hz) - a magical pentatonic scale
const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
const COLORS = ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF0000', '#FFFFFF'];

class Crystal {
    constructor() {
        this.radius = Math.random() * 15 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = Math.random() * 2 + 1 + (score / 1000);
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.noteIndex = COLORS.indexOf(this.color);
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    update() {
        this.y += this.speed;
        this.angle += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.7, 0);
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
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
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Audio context for synthesized sounds
let audioCtx = null;
function playNote(index) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(NOTES[index], audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnCrystal() {
    if (!gameActive) return;
    crystals.push(new Crystal());
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    startButton.onclick = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        startScreen.classList.add('hidden');
        gameActive = true;
        score = 0;
        multiplier = 1;
        crystals = [];
        particles = [];
        requestAnimationFrame(gameLoop);
    };

    restartButton.onclick = () => {
        gameOverScreen.classList.add('hidden');
        gameActive = true;
        score = 0;
        multiplier = 1;
        crystals = [];
        particles = [];
        requestAnimationFrame(gameLoop);
    };

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let hit = false;
        for (let i = crystals.length - 1; i >= 0; i--) {
            const crystal = crystals[i];
            const dist = Math.hypot(mouseX - crystal.x, mouseY - crystal.y);
            if (dist < crystal.radius * 1.5) {
                // Hit!
                playNote(crystal.noteIndex);
                score += 10 * multiplier;
                multiplier++;
                multiplierTimer = 60; // frames
                
                // Create explosion particles
                for (let j = 0; j < 12; j++) {
                    particles.push(new Particle(crystal.x, crystal.y, crystal.color));
                }
                
                crystals.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (!hit) {
            multiplier = 1;
            multiplierTimer = 0;
        }
    });
}

function gameLoop(time) {
    if (!gameActive) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw crystals
    for (let i = crystals.length - 1; i >= 0; i--) {
        const crystal = crystal = crystals[i]; // fixed typo
        crystal.update();
        crystal.draw();

        if (crystal.y > canvas.height + crystal.radius) {
            gameActive = false;
            gameOver();
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const crystal = particles[i]; // fixed typo
        crystal.update();
        crystal.draw();
        if (crystal.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Handle multiplier
    if (multiplierTimer > 0) {
        multiplierTimer--;
    } else {
        multiplier = 1;
    }

    scoreElement.innerText = `Score: ${score}`;
    multiplierElement.innerText = `x${multiplier}`;

    // Spawn new crystals
    if (Math.random() < 0.02 + (score / 10000)) {
        spawnCrystal();
    }

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = `Your Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

init();
