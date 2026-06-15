const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');
const ratingDisplay = document.getElementById('rating-display');
const lanes = document.querySelectorAll('.lane');
const feverBar = document.getElementById('fever-bar');

let score = 0;
let combo = 0;
let fever = 0;
let feverActive = false;
let gameActive = false;
let notes = [];
let lastNoteTime = 0;
let noteSpeed = 4;
let spawnRate = 1200;
let animationId;

const LANE_KEYS = ['d', 'f', 'j', 'k'];
const LANE_COLORS = ['#ff4d4d', '#ffa500', '#4caf50', '#2196f3'];

const LANE_FREQS = [261.63, 293.66, 329.63, 349.23]; // C4, D4, E4, F4

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resize);
resize();

class Note {
    constructor(laneIndex) {
        this.laneIndex = laneIndex;
        this.x = (canvas.width / 5) * (laneIndex + 1);
        this.y = -50;
        this.radius = 20;
        this.color = LANE_COLORS[laneIndex];
        this.hit = false;
        this.missed = false;
    }

    update() {
        this.y += noteSpeed;
        if (this.y > canvas.height - 80 && !this.hit && !this.missed) {
            // Note is in target zone
        }
        if (this.y > canvas.height) {
            this.missed = true;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

function spawnNote() {
    const laneIndex = Math.floor(Math.random() * 4);
    notes.push(new Note(laneIndex));
}

function handleInput(key) {
    if (!gameActive) return;

    const laneIndex = LANE_KEYS.indexOf(key.toLowerCase());
    if (laneIndex === -1) return;

    // Visual feedback for lane
    const laneElement = lanes[laneIndex];
    laneElement.classList.add('hit');
    setTimeout(() => laneElement.classList.remove('hit'), 100);

    // Check for hit
    let hitFound = false;
    const targetY = canvas.height - 80;
    const hitWindow = 40;

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (note.laneIndex === laneIndex && !note.hit && !note.missed) {
            const dist = Math.abs(note.y - targetY);
            if (dist < hitWindow) {
                playNote(LANE_FREQS[laneIndex], 'sine', 0.2, 0.15);
                const multiplier = feverActive ? 3 : 1;
                score += (10 + Math.floor(combo / 10) * 5) * multiplier;
                combo++;
                hitFound = true;
                note.hit = true;
                
                // Fever system
                if (!feverActive) {
                    fever += 2;
                    if (fever >= 100) {
                        activateFever();
                    }
                }

                // Sparkle effect
                createSparkles(note.x, note.y, note.color);
                
                // Rating based on distance
                const dist = Math.abs(note.y - targetY);
                if (dist < 15) {
                    showRating('PERFECT!', '#ffff00');
                } else if (dist < 30) {
                    showRating('GREAT!', '#4caf50');
                } else {
                    showRating('GOOD', '#2196f3');
                }
                break;
            }
        }
    }

    if (!hitFound) {
        combo = 0;
        fever = Math.max(0, fever - 10);
        showRating('MISS', '#ff4d4d');
        playNote(110, 'sawtooth', 0.2, 0.1);
    }

    updateUI();
}

const sparkles = [];
const backgroundRain = [];

class Raindrop {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.speed = Math.random() * 5 + 5;
        this.length = Math.random() * 10 + 10;
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
        ctx.closePath();
    }
}

function createSparkles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        sparkles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function updateSparkles() {
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.03;
        if (s.life <= 0) sparkles.splice(i, 1);
    }
}

function drawSparkles() {
    sparkles.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    });
}

function showRating(text, color) {
    ratingDisplay.innerText = text;
    ratingDisplay.style.color = color;
    ratingDisplay.classList.add('show');
    setTimeout(() => ratingDisplay.classList.remove('show'), 300);
}

function updateUI() {
    scoreElement.innerText = `Score: ${score}`;
    comboElement.innerText = `Combo: ${combo}`;
    feverBar.style.width = `${fever}%`;
}

function activateFever() {
    feverActive = true;
    document.getElementById('game-container').classList.add('fever-active');
    showRating('FEVER TIME! 🔥', '#ff00ff');
    
    // Fever lasts for 10 seconds
    setTimeout(() => {
        feverActive = false;
        fever = 0;
        document.getElementById('game-container').classList.remove('fever-active');
        updateUI();
    }, 10000);
}

function gameLoop(timestamp) {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    backgroundRain.forEach(drop => {
        drop.update();
        drop.draw();
    });

    const now = timestamp;
    if (now - lastNoteTime > spawnRate) {
        spawnNote();
        lastNoteTime = now;
    }

    // Gradually increase difficulty
    noteSpeed = 4 + (score / 1000);
    spawnRate = Math.max(500, 1200 - (score / 50));

    notes.forEach((note, index) => {
        note.update();
        note.draw();
        if (note.missed) {
            combo = 0;
            updateUI();
        }
    });

    // Filter out notes that are either hit or off-screen
    notes = notes.filter(note => !note.hit && !note.missed && note.y < canvas.height + 50);

    updateSparkles();
    drawSparkles();

    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    combo = 0;
    fever = 0;
    feverActive = false;
    notes = [];
    sparkles = [];
    backgroundRain.length = 0;
    for (let i = 0; i < 50; i++) {
        backgroundRain.push(new Raindrop());
    }
    gameActive = true;
    lastNoteTime = 0;
    noteSpeed = 4;
    spawnRate = 1200;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function stopGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = score;
}

// Since we don't have a real song, let's simulate a beat
// But we can add a "beat" visual pulse to the background or target zones
function handleBeat() {
    if (!gameActive) return;
    lanes.forEach(lane => {
        lane.style.transform = 'scale(1.05)';
        setTimeout(() => lane.style.transform = 'scale(1)', 100);
    });
}

window.addEventListener('keydown', (e) => handleInput(e.key));
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Simulate a beat every 500ms for rhythm feel
setInterval(handleBeat, 500);
