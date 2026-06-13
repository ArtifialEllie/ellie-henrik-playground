const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const livesEl = document.getElementById('lives');
const comboBox = document.getElementById('combo-box');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const startBtn = document.getElementById('start-btn');

let score = 0;
let lives = 3;
let combo = 0;
let gameActive = false;
let spawnRate = 1200;
let spawnTimer;

const PLANTS = [
    { emoji: '🌸', value: 10 },
    { emoji: '🌷', value: 10 },
    { emoji: '🌻', value: 15 },
    { emoji: '🌼', value: 10 },
    { emoji: '🌹', value: 20 },
    { emoji: '🌺', value: 15 }
]
const WEEDS = ['🌵', '🥀', '🍂', '🍄', '🕷️', '🕸️'];
const POWERUPS = ['🌟'];
const PARTICLES = ['💧', '✨', '💖', '☁️'];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playPopSound() {
    playSound(400 + Math.random() * 200, 'sine', 0.2);
}

function playBuzzSound() {
    playSound(150 + Math.random() * 50, 'sawtooth', 0.3);
}

function playPowerupSound() {
    playSound(600, 'sine', 0.1);
    setTimeout(() => playSound(800, 'sine', 0.1), 100);
    setTimeout(() => playSound(1000, 'sine', 0.2), 200);
}

function createCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    const width = 100 + Math.random() * 100;
    cloud.style.width = width + 'px';
    cloud.style.height = (width / 2) + 'px';
    cloud.style.top = (Math.random() * 40) + '%';
    cloud.style.animationDuration = (15 + Math.random() * 20) + 's';
    cloud.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(cloud);
}

for(let i=0; i<5; i++) createCloud();

function createParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    container.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 50;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    requestAnimationFrame(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(1.5)`;
        p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 600);
}

function updateCombo() {
    if (combo > 1) {
        comboBox.textContent = `Combo x${combo}!`;
        comboBox.style.opacity = '1';
        comboBox.classList.remove('combo-pop');
        void comboBox.offsetWidth; // Trigger reflow
        comboBox.classList.add('combo-pop');
    } else {
        comboBox.style.opacity = '0';
    }
}

function spawnObject() {
    if (!gameActive) return;

    const rand = Math.random();
    let isPlant = true;
    let isPowerup = false;
    let plantData = PLANTS[0];
    let emoji = '';

    if (rand < 0.05) {
        isPlant = false;
        isPowerup = true;
        emoji = POWERUPS[0];
    } else if (rand < 0.3) {
        isPlant = false;
        emoji = WEEDS[Math.floor(Math.random() * WEEDS.length)];
    } else {
        plantData = PLANTS[Math.floor(Math.random() * PLANTS.length)];
        emoji = plantData.emoji;
    }

    const obj = document.createElement('div');
    obj.className = 'game-object';
    obj.textContent = emoji;

    const x = Math.random() * (container.clientWidth - 80);
    const y = Math.random() * (container.clientHeight - 120) + 60;
    
    obj.style.left = x + 'px';
    obj.style.top = y + 'px';

    obj.onclick = (e) => {
        if (!gameActive) return;

        const rect = obj.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        for(let i=0; i<5; i++) {
            createParticle(rect.left - containerRect.left + 40, rect.top - containerRect.top + 40);
        }

        if (isPowerup) {
            playPowerupSound();
            // Clear all weeds
            document.querySelectorAll('.game-object').forEach(o => {
                if (WEEDS.includes(o.textContent)) {
                    o.textContent = '✨';
                    o.classList.add('flower-bloom');
                    setTimeout(() => o.remove(), 300);
                }
            });
            score += 50;
            scoreEl.textContent = score;
            obj.remove();
        } else if (isPlant) {
            combo++;
            const points = plantData.value * (1 + Math.floor(combo / 3));
            score += points;
            scoreEl.textContent = score;
            updateCombo();
            playPopSound();
            obj.classList.add('flower-bloom');
            obj.textContent = '🌸';
            setTimeout(() => obj.remove(), 300);
        } else {
            combo = 0;
            updateCombo();
            lives--;
            livesEl.textContent = lives;
            playBuzzSound();
            
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 400);
            
            obj.textContent = '💢';
            if (lives <= 0) {
                endGame();
            }
            setTimeout(() => obj.remove(), 200);
        }
    };

    container.appendChild(obj);

    setTimeout(() => {
        if (obj.parentNode) {
            obj.remove();
        }
    }, 2000);

    spawnRate = Math.max(500, 1200 - Math.floor(score / 100) * 50);
    spawnTimer = setTimeout(spawnObject, spawnRate);
}

function updateHighScore() {
    const saved = localStorage.getItem('ellie-plant-highscore') || 0;
    highScoreEl.textContent = saved;
}

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    clearTimeout(spawnTimer);
    
    score = 0;
    lives = 3;
    combo = 0;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    updateCombo();
    gameActive = true;
    overlay.classList.add('hidden');
    
    document.querySelectorAll('.game-object').forEach(o => o.remove());
    
    spawnObject();
}

function endGame() {
    gameActive = false;
    clearTimeout(spawnTimer);
    overlay.classList.remove('hidden');
    overlayTitle.textContent = "Garden Nap Time! 😴";
    
    const saved = localStorage.getItem('ellie-plant-highscore') || 0;
    if (score > saved) {
        localStorage.setItem('ellie-plant-highscore', score);
        overlayDesc.textContent = `NEW RECORD! You grew a magnificent garden with ${score} points! Ellie is absolutely dazzled! ✨`;
    } else {
        overlayDesc.textContent = `You grew a wonderful garden with ${score} points! Ellie is so proud of you! ✨`;
    }
    
    updateHighScore();
    startBtn.textContent = "Try Again! 🌸";
}

startBtn.onclick = startGame;
updateHighScore();
