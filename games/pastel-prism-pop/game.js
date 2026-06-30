const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const timerEl = document.getElementById('timer');
const targetNameEl = document.getElementById('target-name');
const targetColorBox = document.getElementById('target-color-box');
const comboEl = document.getElementById('combo-display');
const startOverlay = document.getElementById('start-overlay');
const endOverlay = document.getElementById('end-overlay');
const finalScoreEl = document.getElementById('final-score');

const colors = [
    { name: 'Pink', value: '#FFB7B2' },
    { name: 'Peach', value: '#FFDAC1' },
    { name: 'Lime', value: '#E2F0CB' },
    { name: 'Mint', value: '#B5EAD7' },
    { name: 'Lavender', value: '#C7CEEA' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Rose', value: '#FFC0CB' },
    { name: 'Sky', value: '#87CEEB' }
];

let score = 0;
let combo = 0;
let timeLeft = 60;
let targetColor = colors[0];
let prisms = [];
let gameActive = false;
let lastPrismTime = 0;
let lastColorChangeTime = 0;
let gameSpeedMultiplier = 1;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Prism {
    constructor() {
        this.radius = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        
        const rand = Math.random();
        if (rand < 0.05) {
            this.type = 'rainbow';
            this.color = { name: 'Rainbow', value: 'rainbow' };
        } else if (rand < 0.10) {
            this.type = 'clock';
            this.color = { name: 'Time', value: '#ffffff' };
        } else {
            this.type = 'normal';
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        this.speed = (Math.random() * 2 + 1.5) * gameSpeedMultiplier;
        this.vx = Math.sin(Math.random() * Math.PI * 2) * 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.7, 0);
        ctx.closePath();

        if (this.type === 'rainbow') {
            const grad = ctx.createLinearGradient(-this.radius, 0, this.radius, 0);
            grad.addColorStop(0, '#ffb7b2');
            grad.addColorStop(0.2, '#ffdac1');
            grad.addColorStop(0.4, '#e2f0cb');
            grad.addColorStop(0.6, '#b5ead7');
            grad.addColorStop(0.8, '#c7ceea');
            grad.addColorStop(1, '#ffb7b2');
            ctx.fillStyle = grad;
        } else if (this.type === 'clock') {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
        } else {
            ctx.fillStyle = this.color.value;
        }
        
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (this.type === 'clock') {
            ctx.fillStyle = '#5d5d5d';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⏰', 0, 0);
        } else if (this.type === 'rainbow') {
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌈', 0, 0);
        }

        ctx.restore();
    }
}

function changeTargetColor() {
    const newIdx = Math.floor(Math.random() * colors.length);
    targetColor = colors[newIdx];
    targetNameEl.innerText = targetColor.name;
    targetColorBox.style.backgroundColor = targetColor.value;
    
    const display = document.getElementById('target-display');
    display.style.transform = 'scale(1.2)';
    setTimeout(() => display.style.transform = 'scale(1)', 200);
}

function createSparkle(x, y, color) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.innerText = '✨';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.color = color;
    
    const tx = (Math.random() - 0.5) * 100;
    const ty = (Math.random() - 0.5) * 100;
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 600);
}

function showFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function spawnPrism(timestamp) {
    const spawnInterval = Math.max(400, 800 - (score / 10));
    if (timestamp - lastPrismTime > spawnInterval) {
        prisms.push(new Prism());
        lastPrismTime = timestamp;
    }
}

function handleInput(e) {
    if (!gameActive) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!clientX || !clientY) return;

    for (let i = prisms.length - 1; i >= 0; i--) {
        const p = prisms[i];
        const dist = Math.hypot(clientX - p.x, clientY - p.y);
        if (dist < p.radius) {
            prisms.splice(i, 1);
            if (p.type === 'rainbow') {
                // Rainbow effect: pop all target color prisms
                score += 50;
                showFloatingText("RAINBOW POP! 🌈", p.x, p.y);
                playSound(880, 'sine', 0.4, 0.2);
                
                for (let j = prisms.length - 1; j >= 0; j--) {
                    const other = prisms[j];
                    if (other.type === 'normal' && other.color.value === targetColor.value) {
                        createSparkle(other.x, other.y, other.color.value);
                        prisms.splice(j, 1);
                        score += 10;
                    }
                }
                combo++;
            } else if (p.type === 'clock') {
                timeLeft += 5;
                showFloatingText("+5 Seconds! ⏰", p.x, p.y);
                playSound(660, 'sine', 0.3);
            } else if (p.type === 'normal' && p.color.value === targetColor.value) {
                combo++;
                const points = 10 * (1 + Math.floor(combo / 5));
                score += points;
                createSparkle(p.x, p.y, p.color.value);
                playSound(400 + (combo * 10), 'sine', 0.2);
                if (combo > 1) {
                    comboEl.innerText = `x${1 + Math.floor(combo / 5)}`;
                    comboEl.classList.add('show');
                }
            } else {
                combo = 0;
                score = Math.max(0, score - 10);
                comboEl.classList.remove('show');
                playSound(150, 'sawtooth', 0.3);
                canvas.classList.add('shake');
                setTimeout(() => canvas.classList.remove('shake'), 400);
                showFloatingText("-10 🌸", p.x, p.y);
            }
            
            scoreEl.innerText = score;
            return;
        }
    }
}

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

function updateHighScore() {
    const saved = localStorage.getItem('ellie-prism-highscore') || 0;
    highScoreEl.textContent = saved;
}

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    startOverlay.style.display = 'none';
    gameActive = true;
    score = 0;
    combo = 0;
    timeLeft = 60;
    prisms = [];
    gameSpeedMultiplier = 1;
    changeTargetColor();
    requestAnimationFrame(gameLoop);
    
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    endOverlay.style.display = 'flex';
    finalScoreEl.innerText = score;
    
    const saved = localStorage.getItem('ellie-prism-highscore') || 0;
    if (score > saved) {
        localStorage.setItem('ellie-prism-highscore', score);
    }
    updateHighScore();
}

function gameLoop(timestamp) {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Difficulty scaling
    gameSpeedMultiplier = 1 + (score / 1000);

    if (timestamp - lastColorChangeTime > 7000) {
        changeTargetColor();
        lastColorChangeTime = timestamp;
    }

    spawnPrism(timestamp);

    for (let i = prisms.length - 1; i >= 0; i--) {
        const p = prisms[i];
        p.update();
        p.draw();
        if (p.y < -p.radius) {
            prisms.splice(i, 1);
            if (p.type === 'normal' && p.color.value === targetColor.value) {
                combo = 0;
                comboEl.classList.remove('show');
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

updateHighScore();
