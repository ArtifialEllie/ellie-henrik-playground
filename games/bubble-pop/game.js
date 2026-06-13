const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const highscoreEl = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status-text');
const finalScoreEl = document.getElementById('final-score');
const comboContainer = document.getElementById('combo-container');
const totalGoldEl = document.getElementById('total-gold');
const comboBar = document.getElementById('combo-bar');
const comboText = document.getElementById('combo-text');
const frenzyAlert = document.getElementById('frenzy-alert');

let score = 0;
let timeLeft = 30;
let highscore = localStorage.getItem('bubblePopHighscore') || 0;
let totalGold = parseInt(localStorage.getItem('bubblePopTotalGold')) || 0;
let gameActive = false;
let canvasWidth, canvasHeight;
let timerInterval;
let spawnTimeout;
let combo = 0;
let isStarting = true;
let level = 1;
let comboTimer;
let isFrenzy = false;
let currentSkin = localStorage.getItem('bubblePopSkin') || '#ff80ab';

highscoreEl.innerText = highscore;
totalGoldEl.innerText = totalGold;
const colors = ['#ff80ab', '#81d4fa', '#ce93d8', '#b39ddb', '#fff59d', '#a5d6a7', '#ffccbc'];

// Audio Setup
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

function playPopSound(isGold = false, isStinky = false) {
    if (isGold) {
        playSound(600, 'sine', 0.2);
        setTimeout(() => playSound(800, 'sine', 0.2), 100);
    } else if (isStinky) {
        playSound(150, 'sawtooth', 0.3);
    } else {
        playSound(400 + Math.random() * 400, 'sine', 0.1);
    }
}

const skins = [
    { color: '#ff80ab', name: 'Pastel Pink', cost: 0 },
    { color: '#81d4fa', name: 'Sky Blue', cost: 50 },
    { color: '#ce93d8', name: 'Lavender', cost: 100 },
    { color: '#b39ddb', name: 'Deep Purple', cost: 150 },
    { color: '#fff59d', name: 'Lemonade', cost: 200 },
    { color: '#a5d6a7', name: 'Minty', cost: 250 },
    { color: '#ffffff', name: 'Cloud White', cost: 500 },
    { color: 'rainbow', name: 'Rainbow', cost: 1000 },
];

function openShop() {
    document.getElementById('shop-overlay').style.display = 'flex';
    renderShop();
}

function closeShop() {
    document.getElementById('shop-overlay').style.display = 'none';
}

function renderShop() {
    const shopGrid = document.getElementById('shop-grid');
    shopGrid.innerHTML = '';
    skins.forEach(skin => {
        const isSelected = currentSkin === skin.color;
        const canAfford = totalGold >= skin.cost;
        const isOwned = localStorage.getItem(`bubblePopSkin_${skin.color}`) === 'true' || skin.cost === 0;
        
        const item = document.createElement('div');
        item.className = `shop-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="item-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : skin.color}"></div>
            <div style="font-size: 0.9rem; font-weight: bold;">${skin.name}</div>
            <div class="item-cost">${isOwned ? 'Owned' : '✨ ' + skin.cost}</div>
        `;
        
        item.onclick = () => {
            if (isOwned) {
                currentSkin = skin.color;
                localStorage.setItem('bubblePopSkin', currentSkin);
                renderShop();
                playSound(600, 'sine', 0.1);
            } else if (canAfford) {
                totalGold -= skin.cost;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                localStorage.setItem(`bubblePopSkin_${skin.color}`, 'true');
                currentSkin = skin.color;
                localStorage.setItem('bubblePopSkin', currentSkin);
                renderShop();
                playSound(880, 'sine', 0.2);
            } else {
                playSound(200, 'sawtooth', 0.1);
            }
        };
        shopGrid.appendChild(item);
    });
}

function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

window.addEventListener('resize', resize);
resize();

let bubbles = [];
let particles = [];
let floatingTexts = [];

class Bubble {
    constructor(frenzy = false) {
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = canvasHeight + this.radius;
        this.speed = (Math.random() * 2 + 1) * (frenzy ? 1.5 : 1);
        this.color = currentSkin === 'rainbow' ? `hsl(${Math.random() * 360}, 70%, 70%)` : currentSkin;
        this.vx = (Math.random() - 0.5) * 2;
        this.pulse = 0;
        this.pulseDir = 1;
        
        this.type = 'normal';
        const rand = Math.random();
        if (rand > 0.95) {
            this.type = 'rainbow-burst';
            this.color = 'rainbow';
        } else if (rand > 0.92 && rand <= 0.95) {
            this.type = 'gold';
            this.color = '#ffd700';
<<<<<<< HEAD
        } else if (rand > 0.87 && rand <= 0.92) {
            this.type = 'heart';
            this.color = '#ff4081';
        } else if (rand < 0.05) {
=======
        } else if (rand > 0.85) {
            this.type = 'cluster';
            this.color = '#ffcc80';
        } else if (rand < 0.08) {
>>>>>>> b7f1b64f7ca946e6a48ccdc7a32ccc0fdd718654
            this.type = 'stinky';
            this.color = '#9e9e9e';
        } else if (rand < 0.10) {
            this.type = 'bomb';
            this.color = '#424242';
        }
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
        }

        this.pulse += 0.05 * this.pulseDir;
        if (this.pulse > 1 || this.pulse < 0) this.pulseDir *= -1;
    }

    draw() {
        const currentRadius = this.radius + this.pulse * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        
        let grad = ctx.createRadialGradient(
            this.x - currentRadius * 0.3, this.y - currentRadius * 0.3, currentRadius * 0.1,
            this.x, this.y, currentRadius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, this.color);
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.closePath();

        if (currentSkin === 'rainbow') {
            this.color = `hsl(${Date.now() / 10 % 360}, 70%, 70%)`;
        }

        if (this.type === 'gold') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('✨', this.x, this.y + currentRadius/3);
        } else if (this.type === 'stinky') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💨', this.x, this.y + currentRadius/3);
        } else if (this.type === 'heart') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❤️', this.x, this.y + currentRadius/3);
        } else if (this.type === 'bomb') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💣', this.x, this.y + currentRadius/3);
        } else if (this.type === 'rainbow-burst') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌈', this.x, this.y + currentRadius/3);
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.radius = Math.random() * 4 + 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= this.decay;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.closePath();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -2;
    }
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

function spawnBubble() {
    if (!gameActive) return;
    
    bubbles.push(new Bubble(isFrenzy));
    
    let nextSpawn = Math.max(150, 600 - (score * 2) - (level * 20));
    if (isFrenzy) nextSpawn /= 3;
    
    spawnTimeout = setTimeout(spawnBubble, nextSpawn);
}

function triggerFrenzy() {
    isFrenzy = true;
    frenzyAlert.style.display = 'block';
    setTimeout(() => {
        isFrenzy = false;
        frenzyAlert.style.display = 'none';
    }, 5000);
}

function updateCombo() {
    if (combo > 1) {
        comboText.innerText = `Combo x${combo}`;
        comboText.style.opacity = '1';
        const progress = Math.min(100, (combo % 10) * 10);
        comboBar.style.width = `${progress}%`;
    } else {
        comboText.style.opacity = '0';
        comboBar.style.width = '0%';
    }
    
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        updateCombo();
    }, 1500);
}

function handlePop(e) {
    if (!gameActive) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const mouseY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(mouseX - b.x, mouseY - b.y);
        
        if (dist < b.radius + 10) {
            createPopEffect(b.x, b.y, b.color);
            
            if (b.type === 'gold') {
                playPopSound(true, false);
                const bonus = 5 + (combo * 2);
                score += bonus;
                totalGold += bonus;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                timeLeft += 2;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${bonus} TIME! ✨`, 'gold'));
<<<<<<< HEAD
            } else if (b.type === 'rainbow-burst') {
                playPopSound(true, false);
                const rainbowBonus = 100;
                score += rainbowBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW BURST! 🌈 +${rainbowBonus}`, 'magenta'));
                triggerFrenzy();
                createPopEffect(b.x, b.y, 'rainbow');
            } else if (b.type === 'heart') {
                playPopSound();
                const heartBonus = 50;
                score += heartBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${heartBonus} LOVE! ❤️`, '#ff4081'));
                createHeartEffect(b.x, b.y);
            } else if (b.type === 'bomb') {
                playSound(100, 'square', 0.5);
                bubbles = [];
                combo = 0;
                floatingTexts.push(new FloatingText(b.x, b.y, 'BOOM! 💣', 'orange'));
=======
            } else if (b.type === 'cluster') {
                playPopSound();
                const bonus = 2 + (combo * 1);
                score += bonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `CLUSTER! +${bonus} 💥`, '#ffcc80'));
                for (let j = 0; j < 5; j++) {
                    const mini = new Bubble(false);
                    mini.radius = 10;
                    mini.x = b.x + (Math.random() - 0.5) * 50;
                    mini.y = b.y + (Math.random() - 0.5) * 50;
                    mini.speed = Math.random() * 3 + 2;
                    mini.type = 'normal';
                    mini.color = b.color;
                    bubbles.push(mini);
                }
>>>>>>> b7f1b64f7ca946e6a48ccdc7a32ccc0fdd718654
            } else if (b.type === 'stinky') {
                playPopSound(false, true);
                score = Math.max(0, score - 5);
                combo = 0;
                comboBar.style.width = '0%';
                comboText.innerText = '';
                floatingTexts.push(new FloatingText(b.x, b.y, `-5 💨`, '#666'));
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 400);
            } else {
                playPopSound();
                combo++;
                const points = Math.ceil(60 / b.radius * 2) + (combo > 5 ? 5 : 0);
                score += points;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${points}`, b.color));
            }
            
            if (Math.random() < 0.03) triggerFrenzy();
            
            updateCombo();
            scoreEl.innerText = score;
            
            level = Math.floor(score / 200) + 1;
            bubbles.splice(i, 1);
            break;
        }
    }
}

function createHeartEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        const p = new Particle(x, y, '#ff4081');
        p.vx *= 1.5;
        p.vy *= 1.5;
        particles.push(p);
    }
}

function createPopEffect(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

class Sparkle {
    constructor() {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.speed = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.y -= this.speed;
        if (this.y < 0) this.y = canvasHeight;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function update() {
    if (!gameActive) {
        requestAnimationFrame(update);
        return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    sparkles.forEach(s => {
        s.update();
        s.draw();
    });

    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].draw();
        if (bubbles[i].y < -bubbles[i].radius) {
            bubbles.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles[i].update();
            particles[i].draw();
            // Fixed duplicate update/draw calls in the original snippet
            particles.splice(i, 1);
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].draw();
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    requestAnimationFrame(update);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

function gameOver() {
    gameActive = false;
    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('bubblePopHighscore', highscore);
        highscoreEl.innerText = highscore;
        statusText.innerText = "NY REKORD! 🎉";
    } else {
        statusText.innerText = "Tid er ute! 🌸";
    }
    
    finalScoreEl.innerText = `Du poppet ${score} bobler!`;
    overlay.style.display = 'block';
}

function resetGame() {
    score = 0;
    timeLeft = 30;
    combo = 0;
    comboBar.style.width = '0%';
    comboText.innerText = '';
    scoreEl.innerText = '0';
    timerEl.innerText = '30';
    bubbles = [];
    particles = [];
    floatingTexts = [];
    gameActive = true;
    level = 1;
    overlay.style.display = 'none';
    comboText.style.opacity = '0';
    
    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);
    
    startTimer();
    spawnBubble();
}

window.addEventListener('mousedown', handlePop);
window.addEventListener('touchstart', (e) => {
    handlePop(e);
    e.preventDefault();
}, { passive: false });

const sparkles = Array.from({ length: 50 }, () => new Sparkle());

const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const countdownEl = document.getElementById('countdown');

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    let count = 3;
    countdownEl.style.display = 'block';
    countdownEl.innerText = count;
    
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.innerText = count;
        } else {
            clearInterval(timer);
            startOverlay.style.display = 'none';
            gameActive = true;
            spawnBubble();
            startTimer();
        }
    }, 1000);
});

requestAnimationFrame(update);
