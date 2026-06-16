const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const multiplierEl = document.getElementById('multiplier');
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
let multiplier = 1;
let isStarting = true;
let isGoldenRain = false;
let level = 1;
let comboTimer;
let isFrenzy = false;
let isVortex = false;
let shieldActive = false;
let freezeMultiplier = 1;
let currentSkin = localStorage.getItem('bubblePopSkin') || '#ff80ab';
let currentAccessory = localStorage.getItem('bubblePopAccessory') || '';

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
    { color: '#ffccbc', name: 'Peach Puff', cost: 1200 },
    { color: '#b2dfdb', name: 'Seafoam', cost: 1500 },
    { color: '#f8bbd0', name: 'Cherry Blossom', cost: 2000 },
    { color: 'cosmic', name: 'Cosmic Glitter', cost: 3000 },
    { color: '#c0c0c0', name: 'Starlight Silver', cost: 4000 },
];

const accessories = [
    { emoji: '🎀', name: 'Pink Bow', cost: 100 },
    { emoji: '👑', name: 'Royal Crown', cost: 500 },
    { emoji: '🕶️', name: 'Cool Shades', cost: 300 },
    { emoji: '🪄', name: 'Magic Wand', cost: 700 },
    { emoji: '🎓', name: 'Smart Hat', cost: 400 },
    { emoji: '🌸', name: 'Flower Crown', cost: 200 },
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
    shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">Bubble Skins ✨</div>';
    
    skins.forEach(skin => {
        const isSelected = currentSkin === skin.color;
        const canAfford = totalGold >= skin.cost;
        const isOwned = localStorage.getItem(`bubblePopSkin_${skin.color}`) === 'true' || skin.cost === 0;
        
        const item = document.createElement('div');
        item.className = `shop-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="item-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : (skin.color === 'cosmic' ? 'linear-gradient(45deg, #ff00ff, #00ffff)' : skin.color)}"></div>
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

    shopGrid.innerHTML += '<div style="grid-column: 1/-1; text-align: center; font-weight: bold; font-size: 1.2rem; margin: 20px 0 10px 0;">Pet Accessories 🎀</div>';

    accessories.forEach(acc => {
        const isSelected = currentAccessory === acc.emoji;
        const canAfford = totalGold >= acc.cost;
        const isOwned = localStorage.getItem(`bubblePopAcc_${acc.emoji}`) === 'true' || acc.cost === 0;
        
        const item = document.createElement('div');
        item.className = `shop-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 5px;">${acc.emoji}</div>
            <div style="font-size: 0.9rem; font-weight: bold;">${acc.name}</div>
            <div class="item-cost">${isOwned ? 'Owned' : '✨ ' + acc.cost}</div>
        `;
        
        item.onclick = () => {
            if (isOwned) {
                currentAccessory = acc.emoji;
                localStorage.setItem('bubblePopAccessory', currentAccessory);
                renderShop();
                playSound(600, 'sine', 0.1);
            } else if (canAfford) {
                totalGold -= acc.cost;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                localStorage.setItem(`bubblePopAcc_${acc.emoji}`, 'true');
                currentAccessory = acc.emoji;
                localStorage.setItem('bubblePopAccessory', currentAccessory);
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
let trail = [];
let floatingTexts = [];
let lastMouseX = canvasWidth / 2;
let lastMouseY = canvasHeight / 2;
let pet = new MagicalPet();

class Bubble {
    constructor(frenzy = false) {
        this.radius = Math.random() * 30 + 20;
        this.hits = 1;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = canvasHeight + this.radius;
        this.speed = (Math.random() * 2 + 1) * (frenzy ? 1.5 : 1);
        this.color = currentSkin === 'rainbow' ? `hsl(${Math.random() * 360}, 70%, 70%)` : currentSkin;
        this.vx = (Math.random() - 0.5) * 2;
        this.pulse = 0;
        this.pulseDir = 1;
        
        this.type = 'normal';
        const rand = Math.random();
        if (rand > 0.998) {
            this.type = 'ellie-wish';
            this.color = '#ff00ff';
            this.radius = 40;
            this.hits = 1;
        } else if (rand > 0.995) {
            this.type = 'golden-ticket';
            this.color = '#FFD700';
        } else if (rand > 0.992) {
            this.type = 'magic-mirror';
            this.color = '#e0f7fa';
        } else if (rand > 0.987) {
            this.type = 'magic-wand';
            this.color = '#da70d6';
        } else if (rand > 0.977) {
            this.type = 'super-pop';
            this.color = '#ff4500';
        } else if (rand > 0.957) {
            this.type = 'rainbow-burst';
            this.color = 'rainbow';
        } else if (rand > 0.927) {
            this.type = 'gold';
            this.color = '#ffd700';
        } else if (rand > 0.877) {
            this.type = 'heart';
            this.color = '#ff4081';
        } else if (rand > 0.827) {
            this.type = 'cluster';
            this.color = '#ffcc80';
        } else if (rand > 0.777) {
            this.type = 'magic-star';
            this.color = '#ffff00';
        } else if (rand > 0.727) {
            this.type = 'lucky-star';
            this.color = '#ffeb3b';
        } else if (rand > 0.677) {
            this.type = 'freeze';
            this.color = '#b2ebf2';
        } else if (rand > 0.627) {
            this.type = 'time-warp';
            this.color = '#e1bee7';
        } else if (rand > 0.577) {
            this.type = 'hammer';
            this.color = '#a1887f';
        } else if (rand > 0.527) {
            this.type = 'giant';
            this.radius = Math.random() * 40 + 70;
            this.hits = 3;
            this.color = '#ffeb3b';
        } else if (rand > 0.477) {
            this.type = 'shield';
            this.color = '#b2dfdb';
        } else if (rand > 0.457) {
            this.type = 'magic-dust';
            this.color = '#ffffff';
            this.radius = 25;
        } else if (rand > 0.427) {
            this.type = 'lucky-clover';
            this.color = '#81c784';
        } else if (rand > 0.327 && rand < 0.357) {
            this.type = 'pet-treat';
            this.color = '#ffca28';
        } else if (rand < 0.05) {
            this.type = 'stinky';
            this.color = '#9e9e9e';
        } else if (rand >= 0.05 && rand < 0.10) {
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
        } else if (currentSkin === 'cosmic') {
            this.color = `hsl(${Date.now() / 20 % 360}, 80%, 60%)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        
        if (this.type === 'giant') {
            ctx.strokeStyle = 'white';
            ctx.shadowBlur = 0;
        }
        if (this.type === 'ellie-wish') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.font = `${currentRadius}px Arial`;
            ctx.stroke();
        }
        if (this.type === 'golden-ticket') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌟', this.x, this.y + currentRadius/3);
        } else if (this.type === 'magic-mirror') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🪞', this.x, this.y + currentRadius/3);
        } else if (this.type === 'magic-wand') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🪄', this.x, this.y + currentRadius/3);
        } else if (this.type === 'hammer') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🔨', this.x, this.y + currentRadius/3);
        } else if (this.type === 'gold') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('✨', this.x, this.y + currentRadius/3);
        } else if (this.type === 'freeze') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❄️', this.x, this.y + currentRadius/3);
        } else if (this.type === 'shield') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🛡️', this.x, this.y + currentRadius/3);
        } else if (this.type === 'stinky') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💨', this.x, this.y + currentRadius/3);
        } else if (this.type === 'heart') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❤️', this.x, this.y + currentRadius/3);
        } else if (this.type === 'lucky-star') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌟', this.x, this.y + currentRadius/3);
        } else if (this.type === 'bomb') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💣', this.x, this.y + currentRadius/3);
        } else if (this.type === 'rainbow-burst') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌈', this.x, this.y + currentRadius/3);
        } else if (this.type === 'super-pop') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💥', this.x, this.y + currentRadius/3);
        } else if (this.type === 'giant') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌟', this.x, this.y + currentRadius/3);
            // Draw health bar
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x - 20, this.y - currentRadius - 10, 40 * (this.hits/3), 5);
        } else if (this.type === 'pet-treat') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🦴', this.x, this.y + currentRadius/3);
        }
        ctx.shadowBlur = 0;
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

class TrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.color = `hsl(${Date.now() / 5 % 360}, 80%, 70%)`;
        this.life = 1.0;
        this.decay = 0.03;
    }
    update() {
        this.life -= this.decay;
        this.size *= 0.95;
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

class MagicalPet {
    constructor() {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.size = 40;
        this.level = 1;
        this.emoji = '🐱'; 
        this.floatOffset = 0;
        this.floatDir = 1;
        this.autoPopTimer = 0;
        this.popInterval = 8000;
        this.popRange = 150;
        this.sugarRushTimer = 0;
        this.isSugarRush = false;
    }

    update(mouseX, mouseY) {
        this.targetX = mouseX;
        this.targetY = mouseY;

        // Smoothly follow mouse
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;

        // Floating animation
        this.floatOffset += 0.05 * this.floatDir;
        if (this.floatOffset > 10 || this.floatOffset < -10) this.floatDir *= -1;

        // Pet Evolution Logic
        let nextLevel = 1;
        let nextEmoji = '🐱';
        let nextInterval = 8000;
        let nextRange = 150;

        if (score >= 5000) { nextLevel = 5; nextEmoji = '✨🌈'; nextInterval = 3000; nextRange = 300; }
        else if (score >= 3000) { nextLevel = 4; nextEmoji = '🐉'; nextInterval = 4000; nextRange = 250; }
        else if (score >= 1500) { nextLevel = 3; nextEmoji = '🦄'; nextInterval = 5000; nextRange = 200; }
        else if (score >= 500) { nextLevel = 2; nextEmoji = '🦊'; nextInterval = 6000; nextRange = 175; }

        if (nextLevel > this.level) {
            this.level = nextLevel;
            this.emoji = nextEmoji;
            this.popInterval = nextInterval;
            this.popRange = nextRange;
            floatingTexts.push(new FloatingText(this.x, this.y, `PET EVOLVED! ${this.emoji}`, 'gold'));
            playSound(800, 'sine', 0.3);
        }
 
        // Sugar Rush Logic
        if (this.sugarRushTimer > 0) {
            this.sugarRushTimer--;
            this.isSugarRush = true;
        } else {
            this.isSugarRush = false;
        }
    }
 
    triggerSugarRush() {
        this.sugarRushTimer = 600; // Approx 10 seconds at 60fps
        floatingTexts.push(new FloatingText(this.x, this.y, `SUGAR RUSH! ⚡️`, 'gold'));
        playSound(1000, 'sine', 0.2);
        playSound(1200, 'sine', 0.2);
    }
 
    tryAutoPop() {
        if (bubbles.length === 0) return;
        
        // Find nearest bubble within range
        let nearest = null;
        const currentRange = this.isSugarRush ? this.popRange * 2 : this.popRange;
        let minDist = currentRange;

        bubbles.forEach(b => {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = b;
            }
        });

        if (nearest) {
            // Simulate a pop at the bubble's location
            const mockEvent = {
                clientX: nearest.x + canvas.getBoundingClientRect().left,
                clientY: nearest.y + canvas.getBoundingClientRect().top
            };
            handlePop(mockEvent);
            floatingTexts.push(new FloatingText(nearest.x, nearest.y, 'PET POP! 🐱✨', 'gold'));
        }
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x, this.y + this.floatOffset);
        if (currentAccessory) {
            ctx.font = `${this.size * 0.7}px Arial`;
            ctx.fillText(currentAccessory, this.x + this.size * 0.3, this.y + this.floatOffset - this.size * 0.2);
        }
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
    document.body.classList.add('frenzy-bg');
    setTimeout(() => {
        isFrenzy = false;
        frenzyAlert.style.display = 'none';
        document.body.classList.remove('frenzy-bg');
    }, 5000);
}

function triggerParty() {
    const partyAlert = document.getElementById('party-alert');
    partyAlert.style.display = 'block';
    
    // Party effect: spawn a bunch of bubbles immediately
    for (let i = 0; i < 15; i++) {
        bubbles.push(new Bubble(true));
    }
    
    setTimeout(() => {
        partyAlert.style.display = 'none';
    }, 3000);
}

function triggerGoldenRain() {
    isGoldenRain = true;
    const rainAlert = document.getElementById('golden-rain-alert');
    rainAlert.style.display = 'block';
    
    // Rain of gold bubbles!
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const goldBubble = new Bubble(false);
            goldBubble.type = 'gold';
            goldBubble.color = '#ffd700';
            goldBubble.y = -goldBubble.radius;
            bubbles.push(goldBubble);
        }, i * 100);
    }
    
    setTimeout(() => {
        isGoldenRain = false;
        rainAlert.style.display = 'none';
    }, 7000);
}

function triggerVortex() {
    isVortex = true;
    const vortexAlert = document.getElementById('vortex-alert');
    vortexAlert.style.display = 'block';
    
    // Vortex effect: pull all bubbles toward the center
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const vortexInterval = setInterval(() => {
        if (!isVortex) {
            clearInterval(vortexInterval);
            return;
        }
        bubbles.forEach(b => {
            const dx = centerX - b.x;
            const dy = centerY - b.y;
            const dist = Math.hypot(dx, dy);
            b.vx += dx / dist * 0.5;
            b.vy = (dy / dist * 0.5) - b.speed; // counteract vertical speed slightly
        });
    }, 20);

    setTimeout(() => {
        isVortex = false;
        vortexAlert.style.display = 'none';
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
    
    // Oppdater multiplikator basert på combo
    multiplier = 1 + Math.floor(combo / 5);
    multiplierEl.innerText = `x${multiplier}`;
    
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
            if (b.hits > 1) {
                b.hits--;
                createPopEffect(b.x, b.y, b.color);
                playSound(300, 'sine', 0.1);
                floatingTexts.push(new FloatingText(b.x, b.y, 'HIT!', b.color));
                continue; 
            }
            createPopEffect(b.x, b.y, b.color);
            
            if (b.type === 'golden-ticket') {
                playPopSound(true, false);
                const ticketBonus = 1000;
                score += ticketBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `GOLDEN TICKET! 🎫 +${ticketBonus}`, 'gold'));
                createPopEffect(b.x, b.y, 'gold');
                triggerFrenzy();
            } else if (b.type === 'ellie-wish') {
                playPopSound(true, false);
                const wishes = [
                    { text: 'GOLD RAIN! ✨', action: () => triggerGoldenRain(), bonus: 0 },
                    { text: 'TIME GIFT! ⏰', action: () => { timeLeft += 15; }, bonus: 0 },
                    { text: 'JACKPOT! 💰', action: () => { totalGold += 500; localStorage.setItem('bubblePopTotalGold', totalGold); totalGoldEl.innerText = totalGold; }, bonus: 5000 },
                ];
                const wish = wishes[Math.floor(Math.random() * wishes.length)];
                score += wish.bonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `ELLIE'S WISH: ${wish.text}`, 'magenta'));
                wish.action();
                createBigExplosion(b.x, b.y);
                createPopEffect(b.x, b.y, 'magenta');
                triggerFrenzy();
            } else if (b.type === 'golden-ticket') {
            } else if (b.type === 'magic-wand') {
                playPopSound(true, false);
                const wandBonus = 250;
                score += wandBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC WAND! 🪄 +${wandBonus}`, '#da70d6'));
                createPopEffect(b.x, b.y, '#da70d6');
                triggerFrenzy();
            } else if (b.type === 'magic-mirror') {
                playPopSound(true, false);
                const mirrorBonus = 500;
                score += mirrorBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC MIRROR! 🪞 +${mirrorBonus}`, '#e0f7fa'));
                createPopEffect(b.x, b.y, '#e0f7fa');
                triggerFrenzy();
            } else if (b.type === 'gold') {
                playPopSound(true, false);
                const bonus = 5 + (combo * 2);
                score += bonus;
                totalGold += bonus;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                timeLeft += 2;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${bonus} TIME! ✨`, 'gold'));
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
            } else if (b.type === 'lucky-star') {
                playPopSound(true, false);
                const starBonus = 40;
                score += starBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `LUCKY STAR! 🌟 +${starBonus}`, '#ffeb3b'));
                createPopEffect(b.x, b.y, '#ffeb3b');
            } else if (b.type === 'time-warp') {
                playPopSound(true, false);
                const timeBonus = 3;
                timeLeft += timeBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `TIME WARP! ⏳ +${timeBonus}s`, '#e1bee7'));
                createPopEffect(b.x, b.y, '#e1bee7');
            } else if (b.type === 'magic-dust') {
                playPopSound(true, false);
                const dustBonus = 30;
                score += dustBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC DUST! ✨ +${dustBonus}`, 'white'));
                createPopEffect(b.x, b.y, 'white');
                
                // Magic Dust effect: slightly increases the score of the next 5 pops
                let popsCount = 0;
                const originalHandlePop = handlePop;
                handlePop = function(e) {
                    const result = originalHandlePop(e);
                    popsCount++;
                    if (popsCount <= 5) {
                        score += 5;
                        scoreEl.innerText = score;
                    }
                    if (popsCount > 5) handlePop = originalHandlePop;
                    return result;
                };
            } else if (b.type === 'lucky-clover') {
                playPopSound(true, false);
                const goldBonus = Math.floor(Math.random() * 20) + 10;
                totalGold += goldBonus;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                floatingTexts.push(new FloatingText(b.x, b.y, `LUCKY CLOVER! 🍀 +${goldBonus} ✨`, '#81c784'));
                createPopEffect(b.x, b.y, '#81c784');
            } else if (b.type === 'freeze') {
                playPopSound();
                floatingTexts.push(new FloatingText(b.x, b.y, 'FREEZE! ❄️', '#b2ebf2'));
                createPopEffect(b.x, b.y, '#b2ebf2');
                bubbles.forEach(bub => bub.speed = 0);
                setTimeout(() => {
                    bubbles.forEach(bub => {
                        bub.speed = (Math.random() * 2 + 1) * (isFrenzy ? 1.5 : 1);
                    });
                }, 3000);
            } else if (b.type === 'shield') {
                playPopSound();
                shieldActive = true;
                floatingTexts.push(new FloatingText(b.x, b.y, 'SHIELD ACTIVE! 🛡️', '#b2dfdb'));
                createPopEffect(b.x, b.y, '#b2dfdb');
                setTimeout(() => {
                    shieldActive = false;
                }, 7000);
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
            } else if (b.type === 'magic-star') {
                playPopSound(true, false);
                const magicBonus = 60;
                score += magicBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC STAR! ✨ +${magicBonus}`, '#ffff00'));
                createPopEffect(b.x, b.y, '#ffff00');
            } else if (b.type === 'hammer') {
                playPopSound(true, false);
                const hammerBonus = 80;
                score += hammerBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `HAMMER TIME! 🔨 +${hammerBonus}`, '#a1887f'));
                createPopEffect(b.x, b.y, '#a1887f');
                
                // Hammer effect: pop several random bubbles
                const popCount = 5;
                let popped = 0;
                const potentialTargets = bubbles.filter(bub => bub !== b && bub.type !== 'bomb');
                
                while (popped < popCount && potentialTargets.length > 0) {
                    const targetIndex = Math.floor(Math.random() * potentialTargets.length);
                    const target = potentialTargets[targetIndex];
                    
                    createPopEffect(target.x, target.y, target.color);
                    score += 10;
                    floatingTexts.push(new FloatingText(target.x, target.y, `+10`, target.color));
                    
                    // Remove the target from the main bubbles array
                    const mainIndex = bubbles.indexOf(target);
                    if (mainIndex > -1) {
                        bubbles.splice(mainIndex, 1);
                    }
                    
                    potentialTargets.splice(targetIndex, 1);
                    popped++;
                }
            } else if (b.type === 'pet-treat') {
                playPopSound(true, false);
                pet.triggerSugarRush();
                const treatBonus = 30;
                score += treatBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `YUMMY! 🦴 +${treatBonus}`, '#ffca28'));
                createPopEffect(b.x, b.y, '#ffca28');
            } else if (b.type === 'bomb') {
                playSound(100, 'square', 0.5);
                bubbles = [];
                combo = 0;
                floatingTexts.push(new FloatingText(b.x, b.y, 'BOOM! 💣', 'orange'));
            } else if (b.type === 'stinky') {
                if (shieldActive) {
                    playPopSound(true, false);
                    floatingTexts.push(new FloatingText(b.x, b.y, 'SHIELDED! 🛡️', '#b2dfdb'));
                    createPopEffect(b.x, b.y, '#b2dfdb');
                    shieldActive = false;
                } else {
                    playPopSound(false, true);
                    score = Math.max(0, score - 5);
                    combo = 0;
                    comboBar.style.width = '0%';
                    comboText.innerText = '';
                    floatingTexts.push(new FloatingText(b.x, b.y, `-5 💨`, '#666'));
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 400);
                }
            } else if (b.type === 'super-pop') {
                playSuperPopSound();
                floatingTexts.push(new FloatingText(b.x, b.y, 'SUPER POP! 💥', 'orange'));
                
                const allBubbles = [...bubbles];
                bubbles = [];
                allBubbles.forEach(otherBubble => {
                    if (otherBubble !== b) {
                        if (otherBubble.type !== 'bomb' && otherBubble.type !== 'stinky') {
                            createPopEffect(otherBubble.x, otherBubble.y, otherBubble.color);
                            score += 10;
                        } else {
                            createPopEffect(otherBubble.x, otherBubble.y, '#444');
                        }
                    }
                });
                score += 100;
                createBigExplosion(b.x, b.y);
            } else if (b.type === 'giant') {
                playSuperPopSound();
                const giantBonus = 200;
                score += giantBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `GIANT POP! 🌟 +${giantBonus}`, 'gold'));
                createBigExplosion(b.x, b.y);
            } else {
                playPopSound();
                combo++;
                const points = (Math.ceil(60 / b.radius * 2) + (combo > 5 ? 5 : 0)) * multiplier;
                score += points;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${points}`, b.color));
            }
            
            if (Math.random() < 0.03) triggerFrenzy();
            if (Math.random() < 0.01) triggerParty();
            if (Math.random() < 0.005) triggerGoldenRain();
            if (Math.random() < 0.008) triggerVortex();
            
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

function playSuperPopSound() {
    playSound(200, 'sine', 0.5, 0.2);
    playSound(100, 'sine', 0.5, 0.2);
    setTimeout(() => playSound(50, 'sine', 0.5, 0.2), 100);
}

function createBigExplosion(x, y) {
    for (let i = 0; i < 50; i++) {
        const p = new Particle(x, y, 'orange');
        p.vx *= 2;
        p.vy *= 2;
        particles.push(p);
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

    pet.update(lastMouseX, lastMouseY);
    pet.draw();

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
 
    for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].update();
        trail[i].draw();
        if (trail[i].life <= 0) {
            trail.splice(i, 1);
        }
    }
 
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
    multiplier = 1;
    comboBar.style.width = '0%';
    comboText.innerText = '';
    multiplierEl.innerText = 'x1';
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
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    lastMouseX = x;
    lastMouseY = y;
    
    for (let i = 0; i < 2; i++) {
        trail.push(new TrailParticle(x, y));
    }
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', (e) => {
    handleMouseMove(e);
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
