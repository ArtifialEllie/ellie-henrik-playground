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
const questText = document.getElementById('quest-text');
const questFill = document.getElementById('quest-progress-fill');

let score = 0;
let totalPops = 0;
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
let isRibbonActive = false;
let ribbon = { x: 0, y: 0, vx: 0, vy: 0 };
let isMagnetic = false;
let bossActive = false;
let boss = null;
let bossHealth = 100;
let bossMaxHealth = 100;
let gameSpeed = 1;
let shieldActive = false;
let freezeMultiplier = 1;
let currentSkin = localStorage.getItem('bubblePopSkin') || '#ff80ab';
let currentAccessory = localStorage.getItem('bubblePopAccessory') || '';

highscoreEl.innerText = highscore;
totalGoldEl.innerText = totalGold;
const colors = COLORS;

// Quests System
let currentQuest = 0;
const quests = QUESTS;

function updateQuest() {
    const quest = quests[currentQuest];
    if (!quest) {
        questText.innerText = 'All Quests Complete! 🏆';
        questFill.style.width = '100%';
        return;
    }

    let progress = 0;
    if (quest.type === 'multiplier') {
        progress = (multiplier / quest.goal) * 100;
    } else if (quest.type === 'combo') {
        progress = (combo / quest.goal) * 100;
    } else if (quest.type === 'level') {
        progress = (level / quest.goal) * 100;
    } else if (quest.type === 'gold') {
        progress = (totalGold / quest.goal) * 100;
    } else {
        // Default: total pops (approximated by score/avg points, or we track pops specifically)
        // For simplicity, let's use score for "Pop X bubbles" or track it.
        // Since we don't have a popCount, let's add one.
        progress = (totalPops / quest.goal) * 100;
    }

    questText.innerText = `Quest: ${quest.text}`;
    questFill.style.width = `${Math.min(100, progress)}%`;

    if (progress >= 100) {
        completeQuest();
    }
}

function completeQuest() {
    const quest = quests[currentQuest];
    score += quest.reward;
    totalGold += quest.rewardGold;
    localStorage.setItem('bubblePopTotalGold', totalGold);
    totalGoldEl.innerText = totalGold;
    
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, `QUEST COMPLETE! +${quest.reward} 🌟`, 'gold'));
    playSound(880, 'sine', 0.3);
    
    currentQuest++;
    updateQuest();
}
function updateScore() {
    scoreEl.innerText = score;
    scoreEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
    }, 100);
}

function playSound(freq, type, vol, duration = 0.1) {
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

function playPopSound(isGold = false, isStinky = false, popColor = null) {
    if (isGold) {
        playSound(600, 'sine', 0.2);
        setTimeout(() => playSound(800, 'sine', 0.2), 100);
    } else if (isStinky) {
        playSound(150, 'sawtooth', 0.3);
    } else {
        // Use the color-coded notes for a more musical experience! 🎵
        const freq = COLOR_NOTES[popColor] || (400 + Math.random() * 400);
        playSound(freq, 'sine', 0.1);
    }
}

const skins = SKINS;

const accessories = ACCESSORIES;

let ownedAccessories = JSON.parse(localStorage.getItem('bubblePopAccessories')) || [];

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

    const accGrid = document.getElementById('accessory-grid');
    accGrid.innerHTML = '';
    accessories.forEach(acc => {
        const isOwned = ownedAccessories.includes(acc.name);
        const canAfford = totalGold >= acc.cost;
        
        const item = document.createElement('div');
        item.className = `shop-item ${currentAccessory === acc.emoji ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="item-preview" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; background: none; border: 2px dashed #ccc; border-radius: 50%;">
                ${acc.emoji}
            </div>
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
                ownedAccessories.push(acc.name);
                localStorage.setItem('bubblePopAccessories', JSON.stringify(ownedAccessories));
                currentAccessory = acc.emoji;
                localStorage.setItem('bubblePopAccessory', currentAccessory);
                renderShop();
                playSound(880, 'sine', 0.2);
            } else {
                playSound(200, 'sawtooth', 0.1);
            }
        };
        accGrid.appendChild(item);
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
let magicFlowers = [];
let clouds = [];
let lastMouseX = canvasWidth / 2;
let lastMouseY = canvasHeight / 2;
let petClones = [];
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
        this.isSneezing = false;
        this.sneezeTimer = 0;
        this.sneezeOffset = { x: 0, y: 0 };
        
        this.type = 'normal';
        const rand = Math.random();
        if (rand > 0.998) {
            this.type = 'ellie-wish';
            this.color = '#ff00ff';
            this.radius = 40;
            this.hits = 1;
        } else if (rand > 0.995) {
            this.type = 'mystery-box';
            this.color = '#ffeb3b';
            this.radius = 35;
        } else if (rand > 0.992) {
            this.type = 'golden-ticket';
            this.color = '#FFD700';
        } else if (rand > 0.987) {
            this.type = 'magic-mirror';
            this.color = '#e0f7fa';
            this.radius = 35;
        } else if (rand > 0.977) {
            this.type = 'magic-wand';
            this.color = '#da70d6';
        } else if (rand > 0.967) {
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
            this.type = 'magic-burst';
            this.color = '#b3e5fc';
        } else if (rand > 0.527) {
            this.type = 'hammer';
            this.color = '#a1887f';
        } else if (rand > 0.477) {
            this.type = 'giant';
            this.radius = Math.random() * 40 + 70;
            this.hits = 3;
            this.color = '#ffeb3b';
        } else if (rand > 0.427) {
            this.type = 'shield';
            this.color = '#b2dfdb';
        } else if (rand > 0.417) {
            this.type = 'mega-pop';
            this.color = '#ff00ff';
            this.radius = 60;
        } else if (rand > 0.377) {
            this.type = 'magic-dust';
            this.color = '#ffffff';
            this.radius = 25;
        } else if (rand > 0.327) {
            this.type = 'lucky-clover';
            this.color = '#81c784';
        } else if (rand > 0.307 && rand < 0.327) {
            if (rand < 0.317) {
                this.type = 'rainbow-spiral';
                this.color = '#ff00ff';
                this.radius = 30;
            } else {
                this.type = 'burst-bubble';
                this.color = '#ffeb3b';
                this.radius = 35;
            }
        } else if (rand > 0.327 && rand < 0.347) {
            this.type = 'confetti';
            this.color = '#ff69b4';
            this.radius = 30;
        } else if (rand > 0.277 && rand < 0.307) {
            this.type = 'pet-treat';
            this.color = '#ffca28';
        } else if (rand > 0.257 && rand < 0.267) {
            this.type = 'pet-snack';
            this.color = '#ffcc80';
        } else if (rand > 0.267 && rand < 0.277) {
            this.type = 'candy-cloud';
            this.color = '#f8bbd0';
            this.radius = 35;
            this.hits = 1;
        } else if (rand > 0.227 && rand < 0.257) {
            this.type = 'magnetic-bubble';
            this.color = '#9c27b0';
        } else if (rand > 0.13 && rand < 0.16) {
            this.type = 'emotion';
            const emotions = ['😊', '😢', '😡', '😱', '🥳'];
            this.emoji = emotions[Math.floor(Math.random() * emotions.length)];
            this.color = '#ffccbc';
        } else if (rand > 0.207 && rand < 0.237) {
            this.type = 'magic-mushroom';
            this.color = '#ff69b4';
        } else if (rand > 0.247 && rand < 0.277) {
            this.type = 'rainbow-portal';
            this.color = '#ff00ff';
            this.radius = 45;
        } else if (rand > 0.10 && rand < 0.13) {
            this.type = 'sneeze';
            this.color = '#ffeb3b';
            this.radius = 30;
        } else if (rand < 0.05) {
            this.type = 'stinky';
            this.color = '#9e9e9e';
        } else if (rand >= 0.05 && rand < 0.10) {
            this.type = 'bomb';
            this.color = '#424242';
        }

    }
    update() {
        this.y -= this.speed * gameSpeed;
        this.x += this.vx * gameSpeed;
        
        if (this.isSneezing) {
            this.sneezeTimer--;
            if (this.sneezeTimer <= 0) {
                this.isSneezing = false;
            }
        }
        
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
        }

        this.pulse += 0.05 * this.pulseDir;
        if (this.pulse > 1 || this.pulse < 0) this.pulseDir *= -1;
    }

    draw() {
        const currentRadius = this.radius + this.pulse * 2;
        let drawX = this.x;
        let drawY = this.y;
        if (this.isSneezing) {
            drawX += this.sneezeOffset.x * (this.sneezeTimer / 30);
            drawY += this.sneezeOffset.y * (this.sneezeTimer / 30);
        }
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
        
        let grad = ctx.createRadialGradient(
            drawX - currentRadius * 0.3, drawY - currentRadius * 0.3, currentRadius * 0.1,
            drawX, drawY, currentRadius
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
        } else if (currentSkin === 'holographic') {
            this.color = `hsl(${Date.now() / 15 % 360}, 100%, 80%)`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
        } else if (currentSkin === 'supernova') {
            this.color = `hsl(${Date.now() / 5 % 360}, 100%, 80%)`;
            ctx.shadowBlur = 25;
            ctx.shadowColor = 'white';
            ctx.strokeStyle = `hsl(${Date.now() / 5 % 360}, 100%, 50%)`;
            ctx.lineWidth = 3;
        } else if (currentSkin === 'rainbow-glitter') {
            this.color = `hsl(${Date.now() / 10 % 360}, 100%, 70%)`;
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            // Add some tiny white sparkles inside the bubble
            if (Math.random() > 0.8) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(this.x + (Math.random() - 0.5) * this.radius, this.y + (Math.random() - 0.5) * this.radius, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (currentSkin === 'diamond') {
            this.color = '#e0f7fa';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'cyan';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            // Diamond refraction effect
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius * 0.5, this.y);
            ctx.lineTo(this.x, this.y - this.radius * 0.5);
            ctx.lineTo(this.x + this.radius * 0.5, this.y);
            ctx.lineTo(this.x, this.y + this.radius * 0.5);
            ctx.closePath();
            ctx.stroke();
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
            ctx.fillText('🌟', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magic-mirror') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🪞', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magic-wand') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🪄', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magic-mushroom') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🍄', drawX, drawY + currentRadius/3);
        } else if (this.type === 'hammer') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🔨', drawX, drawY + currentRadius/3);
        } else if (this.type === 'gold') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('✨', drawX, drawY + currentRadius/3);
        } else if (this.type === 'freeze') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❄️', drawX, drawY + currentRadius/3);
        } else if (this.type === 'shield') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🛡️', drawX, drawY + currentRadius/3);
        } else if (this.type === 'stinky') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💨', drawX, drawY + currentRadius/3);
        } else if (this.type === 'heart') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❤️', drawX, drawY + currentRadius/3);
        } else if (this.type === 'lucky-star') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌟', drawX, drawY + currentRadius/3);
        } else if (this.type === 'bomb') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💣', drawX, drawY + currentRadius/3);
        } else if (this.type === 'rainbow-burst') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌈', drawX, drawY + currentRadius/3);
        } else if (this.type === 'super-pop') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💥', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magnetic-bubble') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🧲', drawX, drawY + currentRadius/3);
        } else if (this.type === 'rainbow-spiral') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🌀', drawX, drawY + currentRadius/3);
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'magenta';
        } else if (this.type === 'magic-burst') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🎆', drawX, drawY + currentRadius/3);
        } else if (this.type === 'mystery-box') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🎁', drawX, drawY + currentRadius/3);
        } else if (this.type === 'golden-ticket') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🎫', drawX, drawY + currentRadius/3);
        } else if (this.type === 'cupcake') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🧁', drawX, drawY + currentRadius/3);
        } else if (this.type === 'prism') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💎', drawX, drawY + currentRadius/3);
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
        } else if (this.type === 'confetti') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🎊', drawX, drawY + currentRadius/3);
        } else if (this.type === 'sneeze') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🤧', drawX, drawY + currentRadius/3);
        } else if (this.type === 'pet-treat') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🦴', drawX, drawY + currentRadius/3);
        } else if (this.type === 'lucky-clover') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🍀', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magic-dust') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('✨', drawX, drawY + currentRadius/3);
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'white';
        }
    }
    ctx.shadowBlur = 0;
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
        ctx.closePath();
    }
}

class MagicFlower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 0;
        this.maxSize = Math.random() * 20 + 20;
        this.growthSpeed = 0.5;
        this.life = 1.0;
        this.decay = 0.005;
        this.color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        this.angle = Math.random() * Math.PI * 2;
        this.pulseTimer = 0;
        this.pulseInterval = 180 + Math.random() * 120;
        this.pulseRadius = 0;
        this.isPulsing = false;
    }
    update() {
        if (this.size < this.maxSize) this.size += this.growthSpeed;
        this.life -= this.decay;
        this.angle += 0.02;

        this.pulseTimer++;
        if (this.pulseTimer >= this.pulseInterval) {
            this.pulseTimer = 0;
            this.isPulsing = true;
            this.pulseRadius = 0;
            
            bubbles.forEach(b => {
                const dist = Math.hypot(this.x - b.x, this.y - b.y);
                if (dist < 100) {
                    createPopEffect(b.x, b.y, b.color);
                    score += 10;
                    scoreEl.innerText = score;
                    playPopSound();
                    b.popped = true;
                }
            });
        }
        if (this.isPulsing) {
            this.pulseRadius += 5;
            if (this.pulseRadius > 100) this.isPulsing = false;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(0, this.size / 2, this.size / 4, this.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.rotate((Math.PI * 2) / 5);
        }
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1.0;

        if (this.isPulsing) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1 - (this.pulseRadius / 100);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.closePath();
        }
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
        this.autoPopTimer = 8000;
        this.popInterval = 8000;
        this.popRange = 150;
        this.sugarRushTimer = 0;
        this.isSugarRush = false;
        this.shieldTimer = 0;
        this.shieldRadius = 80;
        this.mood = 'Happy';
        this.moodTimer = 0;
        this.friendship = 0;
        this.friendshipLevel = 1;
        this.friendshipExp = 0;
        this.energy = 0;
        this.maxEnergy = 100;
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

        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        }

        // Friendship Level 5: Occasionally spawn a gold bubble!
        if (this.friendshipLevel >= 5 && Math.random() < 0.002) {
            const goldBubble = new Bubble(false);
            goldBubble.type = 'gold';
            goldBubble.x = this.x + (Math.random() - 0.5) * 100;
            goldBubble.y = this.y + (Math.random() - 0.5) * 100;
            goldBubble.speed = 2;
            bubbles.push(goldBubble);
            floatingTexts.push(new FloatingText(this.x, this.y, 'PET GIFT! ✨', 'gold'));
        }

        // Mood Logic
        if (this.moodTimer > 0) {
            this.moodTimer--;
        } else {
            if (this.mood === 'Love' || this.mood === 'Hyper') {
                this.mood = 'Happy';
            } else if (this.mood === 'Happy' && Math.random() < 0.001) {
                this.mood = 'Hungry';
            } else if (this.mood === 'Hungry' && Math.random() < 0.005) {
                this.mood = 'Happy';
            }
        }

        // Auto-pop timer
        this.autoPopTimer--;
        if (this.autoPopTimer <= 0) {
            this.tryAutoPop();
            this.autoPopTimer = this.popInterval;
        }

        // Friendship Level Up Logic
        if (this.friendshipExp >= 100) {
            this.friendshipExp -= 100;
            this.friendshipLevel++;
            floatingTexts.push(new FloatingText(this.x, this.y, `FRIENDSHIP LVL ${this.friendshipLevel}! ❤️`, '#ff4081'));
            playSound(600, 'sine', 0.2);
            setTimeout(() => playSound(800, 'sine', 0.2), 100);
        }

    // Pet Evolution Logic
    let nextLevel = 1;
    let nextEmoji = '🐱';
    let nextInterval = 8000;
    let nextRange = 150;

    if (score >= 10000) { nextLevel = 6; nextEmoji = '👑🐱'; nextInterval = 2000; nextRange = 400; }
    else if (score >= 5000) { nextLevel = 5; nextEmoji = '✨🌈'; nextInterval = 3000; nextRange = 300; }
    else if (score >= 3000) { nextLevel = 4; nextEmoji = '🐉'; nextInterval = 4000; nextRange = 250; }
    else if (score >= 1500) { nextLevel = 3; nextEmoji = '🦄'; nextInterval = 5000; nextRange = 200; }
    else if (score >= 500) { nextLevel = 2; nextEmoji = '🦊'; nextInterval = 6000; nextRange = 175; }

    // Apply Accessory Bonuses
    if (currentAccessory === '🦋') {
        nextRange += 50;
    }
    if (currentAccessory === '🎩') {
        nextInterval *= 0.8;
    }
    // Friendship bonuses
    if (this.friendshipLevel >= 3) {
        nextRange *= 1.2;
    }
    if (this.friendshipLevel >= 4) {
        nextInterval *= 0.9;
    }

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
        this.mood = 'Hyper';
        this.moodTimer = 600;
        floatingTexts.push(new FloatingText(this.x, this.y, `SUGAR RUSH! ⚡️`, 'gold'));
        playSound(1000, 'sine', 0.2);
        playSound(1200, 'sine', 0.2);
    }
 
    tryAutoPop() {
        if (bubbles.length === 0) return;
        
        // Find nearest bubble within range
        let nearest = null;
        let rangeMult = 1;
        if (this.mood === 'Love') rangeMult = 1.2;
        if (this.mood === 'Hungry') rangeMult = 0.8;
        
        const currentRange = (this.isSugarRush ? this.popRange * 2 : this.popRange) * rangeMult;
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

    gainEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    gainFriendship(amount) {
        this.friendshipExp += amount;
        this.friendship += amount; // Keep old property for compatibility
    }

    triggerSuperPop() {
        this.energy = 0;
        floatingTexts.push(new FloatingText(this.x, this.y, 'SUPER POP! 🌟💥', 'gold'));
        playSound(800, 'sine', 0.3);
        setTimeout(() => playSound(1200, 'sine', 0.3), 100);
        
        createBigExplosion(this.x, this.y);
        
        const superPopRadius = 300;
        bubbles.forEach(b => {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < superPopRadius) {
                createPopEffect(b.x, b.y, b.color);
                score += 10;
                b.hits = 0; 
            }
        });
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x, this.y + this.floatOffset);
        if (currentAccessory) {
            ctx.font = `${this.size * 0.7}px Arial`;
            ctx.fillText(currentAccessory, this.x + this.size * 0.3, this.y + this.floatOffset - this.size * 0.2);
        }

        if (this.energy >= this.maxEnergy) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'gold';
        }

        // Draw Mood Emoji
        const moodEmojis = { 'Happy': '🌸', 'Love': '❤️', 'Hungry': '🍪', 'Hyper': '⚡' };
        ctx.font = `${this.size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(moodEmojis[this.mood] || '✨', this.x, this.y + this.floatOffset - this.size);

        // Draw Pet Level badge! 🌟
        ctx.font = `bold ${this.size * 0.3}px Arial`;
        
        // Draw Energy Bar! ⚡
        const barWidth = this.size;
        const barHeight = 6;
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - barWidth / 2, this.y + this.floatOffset + this.size / 2, barWidth, barHeight);
        ctx.fillStyle = this.energy >= this.maxEnergy ? 'gold' : '#ffeb3b';
        ctx.fillRect(this.x - barWidth / 2, this.y + this.floatOffset + this.size / 2, (this.energy / this.maxEnergy) * barWidth, barHeight);
 
        // Friendship Bar! ❤️
        const fBarHeight = 4;
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - barWidth / 2, this.y + this.floatOffset + this.size / 2 + 8, barWidth, fBarHeight);
        ctx.fillStyle = '#ff4081';
        ctx.fillRect(this.x - barWidth / 2, this.y + this.floatOffset + this.size / 2 + 8, (this.friendshipExp / 100) * barWidth, fBarHeight);
 
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillText(`Lv.${this.level}`, this.x - this.size * 0.5, this.y + this.floatOffset - this.size * 1.2);
        ctx.shadowBlur = 0;

        if (this.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y + this.floatOffset, this.shieldRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(179, 235, 242, 0.6)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.closePath();
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

function triggerCupcakeRain() {
    const cupcakeAlert = document.getElementById('cupcake-alert');
    cupcakeAlert.style.display = 'block';
    cupcakeAlert.style.color = '#ffb6c1';
    cupcakeAlert.style.textShadow = '4px 4px #ffffff';

    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const cupcake = new Bubble(false);
            cupcake.type = 'normal';
            cupcake.color = '#ffb6c1';
            cupcake.radius = 35;
            cupcake.y = -cupcake.radius;
            
            // Add a little cupcake emoji to the center (by monkey-patching the draw method slightly or just relying on type)
            // Since Bubble.draw uses type, let's give it a custom type
            cupcake.type = 'cupcake'; 
            bubbles.push(cupcake);
        }, i * 150);
    }

    setTimeout(() => {
        cupcakeAlert.style.display = 'none';
    }, 6000);
}

function triggerDiscoParty() {
    const discoAlert = document.getElementById('disco-alert');
    discoAlert.style.display = 'block';
    discoAlert.style.color = '#ff00ff';
    discoAlert.style.textShadow = '4px 4px #00ffff';
    
    // Disco effect: bubbles dance and change color rapidly
    const discoInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(discoInterval);
            return;
        }
        bubbles.forEach(b => {
            b.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            b.vx += (Math.random() - 0.5) * 2;
            b.vy += (Math.random() - 0.5) * 2;
        });
    }, 100);
    
    setTimeout(() => {
        discoAlert.style.display = 'none';
        clearInterval(discoInterval);
    }, 5000);
}

function triggerSneezeEffect() {
    bubbles.forEach(b => {
        b.isSneezing = true;
        b.sneezeTimer = 30;
        b.sneezeOffset = { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30 };
    });
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'ACHOO! 🤧✨', 'yellow'));
    playSound(200, 'square', 0.1);
    setTimeout(() => playSound(400, 'square', 0.1), 100);
}

function triggerSlowMo() {
    const slowMoAlert = document.getElementById('slow-mo-alert');
    slowMoAlert.style.display = 'block';
    slowMoAlert.style.color = '#81d4fa';
    slowMoAlert.style.textShadow = '2px 2px #ffffff';
    
    gameSpeed = 0.3;
    
    setTimeout(() => {
        gameSpeed = 1;
        slowMoAlert.style.display = 'none';
    }, 5000);
}

function triggerWindGust() {
    const windAlert = document.getElementById('wind-alert');
    windAlert.style.display = 'block';
    windAlert.style.color = '#e0f7fa';
    windAlert.style.textShadow = '2px 2px #006064';
    
    const windForce = 5;
    const windDirection = Math.random() > 0.5 ? 1 : -1;
    
    const windInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(windInterval);
            return;
        }
        bubbles.forEach(b => {
            b.vx += windDirection * 0.5;
        });
    }, 20);
    
    setTimeout(() => {
        windAlert.style.display = 'none';
        clearInterval(windInterval);
    }, 4000);
}

function triggerRainbowCascade() {
    const cascadeAlert = document.getElementById('cascade-alert');
    cascadeAlert.style.display = 'block';
    cascadeAlert.style.color = '#ff00ff';
    cascadeAlert.style.textShadow = '4px 4px #00ffff';

    // Create a cascade of rainbow bubbles falling from the top
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            if (!gameActive) return;
            const rb = new Bubble(false);
            rb.type = 'rainbow-burst';
            rb.color = 'rainbow';
            rb.x = Math.random() * canvasWidth;
            rb.y = -rb.radius;
            rb.speed = Math.random() * 3 + 2;
            bubbles.push(rb);
        }, i * 80);
    }

    setTimeout(() => {
        cascadeAlert.style.display = 'none';
    }, 6000);
}

function triggerMirrorRealm() {
    const mirrorAlert = document.getElementById('mirror-realm-alert');
    mirrorAlert.style.display = 'block';
    mirrorAlert.style.color = '#e0f7fa';
    mirrorAlert.style.textShadow = '2px 2px #006064';
    
    const mirrorDuration = 6000;
    const startTime = Date.now();
    
    const mirrorInterval = setInterval(() => {
        if (!gameActive || Date.now() - startTime > mirrorDuration) {
            clearInterval(mirrorInterval);
            mirrorAlert.style.display = 'none';
            return;
        }
        
        // Mirror Realm effect: Every bubble gets a twin on the opposite side of the screen
        // To avoid infinite spawning, we only do this occasionally or for a few bubbles
        if (Math.random() < 0.05) {
            const sourceBubble = bubbles[Math.floor(Math.random() * bubbles.length)];
            if (sourceBubble) {
                const twin = new Bubble(false);
                twin.radius = sourceBubble.radius;
                twin.color = sourceBubble.color;
                twin.type = sourceBubble.type;
                twin.x = canvasWidth - sourceBubble.x;
                twin.y = sourceBubble.y;
                twin.speed = sourceBubble.speed;
                twin.vx = -sourceBubble.vx;
                bubbles.push(twin);
                floatingTexts.push(new FloatingText(twin.x, twin.y, 'TWIN! 👯‍♀️', twin.color));
            }
        }
    }, 100);
}

function triggerRainbowBridge() {
    const bridgeAlert = document.getElementById('bridge-alert');
    bridgeAlert.style.display = 'block';
    
    const bridgeY = canvasHeight * 0.7;
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            if (!gameActive) return;
            const b = new Bubble(false);
            b.type = 'rainbow-burst';
            b.color = 'rainbow';
            b.x = -b.radius;
            b.y = bridgeY + (Math.random() - 0.5) * 50;
            b.vx = Math.random() * 5 + 5;
            b.vy = (Math.random() - 0.5) * 2;
            bubbles.push(b);
        }, i * 100);
    }
    setTimeout(() => { bridgeAlert.style.display = 'none'; }, 6000);
}

function triggerCelestialSparkle() {
    const celestialSparkleAlert = document.getElementById('celestial-sparkle-alert');
    celestialSparkleAlert.style.display = 'block';
    celestialSparkleAlert.style.color = '#fff9c4';
    celestialSparkleAlert.style.textShadow = '0 0 10px #fbc02d, 0 0 20px #fbc02d';
    
    const duration = 5000;
    const end = Date.now() + duration;
    
    // Spawn a flurry of tiny, sparkling star-bubbles
    const spawnInterval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(spawnInterval);
            celestialSparkleAlert.style.display = 'none';
            return;
        }
        
        const bubble = new Bubble();
        bubble.radius = Math.random() * 10 + 5;
        bubble.color = '#fff';
        bubble.type = 'magic-star';
        bubble.speed = Math.random() * 3 + 2;
        bubble.vx = (Math.random() - 0.5) * 4;
        bubbles.push(bubble);
    }, 50);
}
    ribbon.x = -50;
    ribbon.y = canvasHeight / 2;
    ribbon.vx = 8;
    ribbon.vy = 2;
    
    const ribbonInterval = setInterval(() => {
        if (!isRibbonActive || !gameActive) {
            clearInterval(ribbonInterval);
            return;
        }
        ribbon.x += ribbon.vx;
        ribbon.y += ribbon.vy;
        if (ribbon.y < 0 || ribbon.y > canvasHeight) ribbon.vy *= -1;
        if (ribbon.x > canvasWidth + 100) {
            isRibbonActive = false;
            ribbonAlert.style.display = 'none';
            clearInterval(ribbonInterval);
        }
        
        // Ribbon pops nearby bubbles
        bubbles.forEach(b => {
            const dist = Math.hypot(ribbon.x - b.x, ribbon.y - b.y);
            if (dist < 60) {
                b.hits = 0; // Mark for removal
                createPopEffect(b.x, b.y, 'pink');
                score += 5;
            }
        });
    }, 20);
}

function triggerMagnetism() {
    isMagnetic = true;
    const magnetAlert = document.createElement('div');
    magnetAlert.id = 'magnet-alert';
    magnetAlert.className = 'alert-text';
    magnetAlert.innerText = 'MAGNETIC PULL! 🧲';
    document.body.appendChild(magnetAlert);
    
    setTimeout(() => {
        magnetAlert.remove();
        isMagnetic = false;
    }, 5000);

    const magnetInterval = setInterval(() => {
        if (!isMagnetic) {
            clearInterval(magnetInterval);
            return;
        }
        bubbles.forEach(b => {
            const dx = lastMouseX - b.x;
            const dy = lastMouseY - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 300) {
                b.vx += dx / dist * 0.8;
                b.vy += dy / dist * 0.8;
            }
        });
    }, 20);
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
                // Also check if the pet was clicked!
               const petDist = Math.hypot(mouseX - pet.x, mouseY - pet.y);
               if (petDist < pet.size) {
                        if (pet.energy >= pet.maxEnergy) {
                            pet.triggerSuperPop();
                        } else {
                            pet.mood = 'Love';
                            pet.moodTimer = 300;
                            pet.gainFriendship(10);
                            floatingTexts.push(new FloatingText(pet.x, pet.y, '❤️ Pat!', '#ff4081'));
                            playSound(600, 'sine', 0.1);
                        }
               }

               if (bossActive && b.type === 'stinky') {
                    damageBoss(10);
                    floatingTexts.push(new FloatingText(b.x, b.y, 'BOSS DAMAGE! -10', 'white'));
                }
                if (b.hits > 1) {
                b.hits--;
                createPopEffect(b.x, b.y, b.color);
                playSound(300, 'sine', 0.1);
                floatingTexts.push(new FloatingText(b.x, b.y, 'HIT!', b.color));
                continue; 
            }
            createPopEffect(b.x, b.y, b.color);
            
            // Pass the bubble's color to the sound function for musical pops! 🎵
            pet.gainEnergy(1);
            const popColor = b.color;
            bubbles.splice(i, 1); // Remove bubble first so it's not found in playPopSound's find()
            playPopSound(b.type === 'gold', b.type === 'stinky', popColor);
            if (b.type === 'mystery-box') {
                playPopSound(true, false);
                const mysteryOutcomes = [
                    { text: 'JACKPOT! 💰', action: () => { totalGold += 1000; localStorage.setItem('bubblePopTotalGold', totalGold); totalGoldEl.innerText = totalGold; }, bonus: 2000, color: 'gold' },
                    { text: 'TIME WARP! ⏰', action: () => { timeLeft += 20; }, bonus: 500, color: '#81d4fa' },
                    { text: 'PARTY TIME! 🥳', action: () => triggerParty(), bonus: 1000, color: '#ff4081' },
                    { text: 'GOLDEN RAIN! ✨', action: () => triggerGoldenRain(), bonus: 1000, color: '#ffd700' },
                    { text: 'DISCO FEVER! 💃', action: () => triggerDiscoParty(), bonus: 1500, color: '#ff00ff' },
                    { text: 'MELODY MODE! 🎵', action: () => triggerMelodyMode(), bonus: 1200, color: '#ffeb3b' },
                    { text: 'OOPS! PRANKED! 😜', action: () => { score = Math.max(0, score - 500); }, bonus: -500, color: '#9e9e9e' },
                ];
                const outcome = mysteryOutcomes[Math.floor(Math.random() * mysteryOutcomes.length)];
                score += outcome.bonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MYSTERY BOX: ${outcome.text}`, outcome.color));
                outcome.action();
                createBigExplosion(b.x, b.y);
                createPopEffect(b.x, b.y, outcome.color);
                triggerFrenzy();
            } else if (b.type === 'golden-ticket') {
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
            } else if (b.type === 'magic-wand') {
                playPopSound(true, false);
                const wandBonus = 250;
                score += wandBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC WAND! 🪄 +${wandBonus}`, '#da70d6'));
                createPopEffect(b.x, b.y, '#da70d6');
                triggerFrenzy();
            } else                if (b.type === 'magic-mirror') {
                    playPopSound(true, false);
                    const mirrorBonus = 500;
                    score += mirrorBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC MIRROR! 🪞 +${mirrorBonus}`, '#e0f7fa'));
                    createPopEffect(b.x, b.y, '#e0f7fa');
                    
                    // Trigger the Mirror Realm event!
                    triggerMirrorRealm();
                    
                    // Create a Crystal Clone of the pet!
                    const clone = new MagicalPet();
                    clone.emoji = '💎' + pet.emoji;
                    clone.isClone = true;
                    petClones.push(clone);
                    floatingTexts.push(new FloatingText(b.x, b.y, `CRYSTAL CLONE! 💎✨`, 'gold'));
                    
                    setTimeout(() => {
                        petClones = petClones.filter(c => c !== clone);
                    }, 10000);
                    
                    triggerFrenzy();
                } else if (b.type === 'magic-burst') {
                playPopSound(true, false);
                const burstBonus = 150;
                score += burstBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC BURST! 🎆 +${burstBonus}`, '#b3e5fc'));
                createPopEffect(b.x, b.y, '#b3e5fc');
                
                // Magic Burst effect: pops all bubbles of the same color
                const currentColor = b.color;
                bubbles.forEach(bub => {
                    if (bub !== b && bub.color === currentColor) {
                        createPopEffect(bub.x, bub.y, bub.color);
                        score += 10;
                        floatingTexts.push(new FloatingText(bub.x, bub.y, `+10`, bub.color));
                        bub.hits = 0; // Mark for removal
                    }
                });
            }
            if (b.type === 'rainbow-portal') {
                playPopSound(true, false);
                const portalBonus = 300;
                score += portalBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW PORTAL! 🌈🌀 +${portalBonus}`, '#ff00ff'));
                createPopEffect(b.x, b.y, '#ff00ff');
                
                // Portal effect: spawns 10 random special bubbles instantly
                for (let j = 0; j < 10; j++) {
                    const special = new Bubble(true);
                    special.type = ['gold', 'heart', 'lucky-star', 'magic-star', 'lucky-clover'][Math.floor(Math.random() * 5)];
                    special.x = Math.random() * (canvasWidth - 40) + 20;
                    special.y = Math.random() * (canvasHeight - 40) + 20;
                    special.speed = Math.random() * 2 + 1;
                    bubbles.push(special);
                }
                triggerFrenzy();
            } else if (b.type === 'shimmer-shell') {
                playPopSound(true, false);
                const shellBonus = 150;
                score += shellBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `SHIMMER SHELL! 🐚 +${shellBonus}`, '#e0f7fa'));
                createPopEffect(b.x, b.y, '#e0f7fa');
                for (let j = 0; j < 3; j++) {
                    const pearl = new Bubble(false);
                    pearl.type = 'normal';
                    pearl.color = 'white';
                    pearl.radius = 15;
                    pearl.x = b.x + (Math.random() - 0.5) * 50;
                    pearl.y = b.y + (Math.random() - 0.5) * 50;
                    pearl.vx = (Math.random() - 0.5) * 10;
                    pearl.vy = (Math.random() - 0.5) * 10 - 2;
                    pearl.speed = Math.random() * 2 + 1;
                    bubbles.push(pearl);
                }
            } else if (b.type === 'heart') {
                playPopSound();
                const heartBonus = 50;
                score += heartBonus;
                pet.gainFriendship(5);
                floatingTexts.push(new FloatingText(b.x, b.y, `+${heartBonus} LOVE! ❤️`, '#ff4081'));
                createHeartEffect(b.x, b.y);
                magicFlowers.push(new MagicFlower(b.x, b.y));
            } else if (b.type === 'lucky-star') {
                bubbles.forEach(bub => {
                    if (bub !== b) {
                        const dx = bub.x - b.x;
                        const dy = bub.y - b.y;
                        const dist = Math.hypot(dx, dy);
                        const force = 20;
                        bub.vx += (dx / dist) * force;
                        bub.vy += (dy / dist) * force;
                    }
                });
                
                triggerFrenzy();
                createBigExplosion(b.x, b.y);
                document.getElementById('mega-pop-alert').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('mega-pop-alert').style.display = 'none';
                }, 3000);
            } else if (b.type === 'gold') {
                playPopSound(true, false);
                const bonus = 5 + (combo * 2);
                let goldGain = bonus;
                if (ownedAccessories.includes('Golden Collar')) {
                    goldGain = Math.floor(goldGain * 1.5);
                }
                // Friendship bonus: +10% gold per level above 1 (up to level 5)
                const friendshipMult = 1 + (Math.min(pet.friendshipLevel - 1, 4) * 0.1);
                goldGain = Math.floor(goldGain * friendshipMult);
                score += bonus;
                totalGold += goldGain;
                localStorage.setItem('bubblePopTotalGold', totalGold);
                totalGoldEl.innerText = totalGold;
                timeLeft += 2;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${goldGain} GOLD! ✨`, 'gold'));
            } else if (b.type === 'rainbow-burst') {
                playPopSound(true, false);
                const rainbowBonus = 100;
                score += rainbowBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW BURST! 🌈 +${rainbowBonus}`, 'magenta'));
                
                // Rainbow Burst effect: pops ALL bubbles on screen! 🌈✨
                bubbles.forEach(bub => {
                    if (bub !== b) {
                        createPopEffect(bub.x, bub.y, bub.color);
                        score += 5;
                        floatingTexts.push(new FloatingText(bub.x, bub.y, `+5`, bub.color));
                        bub.hits = 0; // Mark for removal
                    }
                });
                
                triggerFrenzy();
                createPopEffect(b.x, b.y, 'rainbow');
            } else if (b.type === 'heart') {
                playPopSound();
                const heartBonus = 50;
                score += heartBonus;
                pet.gainFriendship(5);
                floatingTexts.push(new FloatingText(b.x, b.y, `+${heartBonus} LOVE! ❤️`, '#ff4081'));
                createHeartEffect(b.x, b.y);
                magicFlowers.push(new MagicFlower(b.x, b.y));
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
            } else if (b.type === 'sneeze') {
                playPopSound(true, false);
                const sneezeBonus = 200;
                score += sneezeBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `SNEEZE! 🤧 +${sneezeBonus}`, '#ffeb3b'));
                createPopEffect(b.x, b.y, '#ffeb3b');
                triggerSneezeEffect();
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
            } else if (b.type === 'candy-cloud') {
                playPopSound(true, false);
                score += 150;
                floatingTexts.push(new FloatingText(b.x, b.y, `CANDY CLOUD! ☁️🍭 +150`, '#f8bbd0'));
                createPopEffect(b.x, b.y, '#f8bbd0');
                for (let j = 0; j < 5; j++) {
                    const candy = new Bubble(false);
                    candy.radius = 10;
                    candy.x = b.x + (Math.random() - 0.5) * 40;
                    candy.y = b.y + (Math.random() - 0.5) * 40;
                    candy.color = '#ff80ab';
                    candy.type = 'normal';
                    bubbles.push(candy);
                }
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
                
                // Give the pet a shield too!
                pet.shieldTimer = 300; 
                floatingTexts.push(new FloatingText(pet.x, pet.y, 'PET SHIELD! 🛡️✨', '#b2dfdb'));

                setTimeout(() => {
                    shieldActive = false;
                }, 7000);
            } else if (b.type === 'heart') {
                playPopSound();
                const heartBonus = 50;
                score += heartBonus;
                pet.gainFriendship(5);
                floatingTexts.push(new FloatingText(b.x, b.y, `+${heartBonus} LOVE! ❤️`, '#ff4081'));
                createHeartEffect(b.x, b.y);
                magicFlowers.push(new MagicFlower(b.x, b.y));
            } else if (b.type === 'lucky-star') {
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
                pet.gainFriendship(20);
                const treatBonus = 30;
                score += treatBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `YUMMY! 🦴 +${treatBonus}`, '#ffca28'));
                createPopEffect(b.x, b.y, '#ffca28');
            } else if (b.type === 'pet-snack') {
                playPopSound(true, false);
                pet.gainEnergy(20);
                pet.mood = 'Happy';
                pet.moodTimer = 600;
                const snackBonus = 50;
                score += snackBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `YUM! 🍪 +${snackBonus}`, '#ffcc80'));
                createPopEffect(b.x, b.y, '#ffcc80');
            } else if (b.type === 'bomb') {
                playSound(100, 'square', 0.5);
                bubbles = [];
                combo = 0;
                floatingTexts.push(new FloatingText(b.x, b.y, 'BOOM! 💣', 'orange'));
            } else if (b.type === 'bomb-burst') {
                playPopSound(true, false);
                floatingTexts.push(new FloatingText(b.x, b.y, 'BURST BOOM! 💥', '#ff5722'));
                const burstRadius = 200;
                let burstPops = 0;
                bubbles.forEach(bub => {
                    if (bub !== b && Math.hypot(bub.x - b.x, bub.y - b.y) < burstRadius) {
                        createPopEffect(bub.x, bub.y, bub.color);
                        score += 5;
                        burstPops++;
                        bub.hits = 0;
                    }
                });
                score += burstPops * 2;
                createBigExplosion(b.x, b.y);
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
            } else if (b.type === 'magnetic-bubble') {
                playPopSound(true, false);
                const magBonus = 150;
                score += magBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MAGNETIC! 🧲 +${magBonus}`, '#9c27b0'));
                createPopEffect(b.x, b.y, '#9c27b0');
                triggerMagnetism();
            } else if (b.type === 'magic-mushroom') {
                playPopSound(true, false);
                const mushBonus = 80;
                score += mushBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `MUSHROOM POP! 🍄 +${mushBonus}`, '#ff69b4'));
                createPopEffect(b.x, b.y, '#ff69b4');
                
                // Spawn a cluster of "spore" bubbles
                for (let j = 0; j < 8; j++) {
                    const spore = new Bubble(false);
                    spore.radius = 15;
                    spore.x = b.x + (Math.random() - 0.5) * 100;
                    spore.y = b.y + (Math.random() - 0.5) * 100;
                    spore.speed = Math.random() * 2 + 1;
                    spore.type = 'normal';
                    spore.color = '#ffb6c1';
                    // We can't easily change the point value for just these, 
                    // but they provide more targets for the player.
                    bubbles.push(spore);
                }
            } else if (b.type === 'burst-bubble') {
                playPopSound(true, false);
                const burstBonus = 150;
                score += burstBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `BURST BUBBLE! 💥 +${burstBonus}`, '#ffeb3b'));
                createPopEffect(b.x, b.y, '#ffeb3b');
                
                // Burst effect: pops 3 random nearby bubbles
                const nearby = bubbles.filter(bub => bub !== b && Math.hypot(bub.x - b.x, bub.y - b.y) < 200);
                const targets = nearby.sort(() => 0.5 - Math.random()).slice(0, 3);
                
            targets.forEach(target => {
                createPopEffect(target.x, target.y, target.color);
                score += 10;
                floatingTexts.push(new FloatingText(target.x, target.y, `+10`, target.color));
                target.hits = 0; // Mark for removal
            });
        } else if (b.type === 'prism') {
            playPopSound(true, false);
            const prismBonus = 100;
            score += prismBonus;
            floatingTexts.push(new FloatingText(b.x, b.y, `PRISM POP! 💎 +${prismBonus}`, '#e0f7fa'));
            createPopEffect(b.x, b.y, '#e0f7fa');
            for (let j = 0; j < 6; j++) {
                const shard = new Bubble(false);
                shard.radius = 15;
                shard.x = b.x;
                shard.y = b.y;
                shard.vx = (Math.random() - 0.5) * 10;
                shard.vy = (Math.random() - 0.5) * 10 - b.speed;
                shard.color = COLORS[j % COLORS.length];
                shard.type = 'normal';
                bubbles.push(shard);
            }
            } else if (b.type === 'rainbow-spiral') {
                playPopSound(true, false);
                const spiralBonus = 200;
                score += spiralBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW SPIRAL! 🌀 +${spiralBonus}`, 'magenta'));
                createPopEffect(b.x, b.y, 'magenta');
                
                for (let i = 0; i < 20; i++) {
                    const angle = 0.5 * i;
                    const r = 5 * i;
                    const spiralBubble = new Bubble(false);
                    spiralBubble.x = b.x + r * Math.cos(angle);
                    spiralBubble.y = b.y + r * Math.sin(angle);
                    spiralBubble.vx = Math.cos(angle) * 2;
                    spiralBubble.vy = Math.sin(angle) * 2;
                    spiralBubble.radius = 15;
                    bubbles.push(spiralBubble);
                }
                triggerFrenzy();
            } else if (b.type === 'confetti') {
                playPopSound(true, false);
                const confettiBonus = 120;
                score += confettiBonus;
                floatingTexts.push(new FloatingText(b.x, b.y, `CONFETTI POP! 🎊 +${confettiBonus}`, '#ff69b4'));
                createPopEffect(b.x, b.y, '#ff69b4');
                
                // Confetti effect: spawn many tiny colorful particles and some small bubbles
                for (let i = 0; i < 30; i++) {
                    const p = new Particle(b.x, b.y, `hsl(${Math.random() * 360}, 100%, 70%)`);
                    p.vx *= 2;
                    p.vy *= 2;
                    particles.push(p);
                }
                for (let i = 0; i < 5; i++) {
                    const mini = new Bubble(false);
                    mini.radius = 10;
                    mini.x = b.x + (Math.random() - 0.5) * 40;
                    mini.y = b.y + (Math.random() - 0.5) * 40;
                    mini.speed = Math.random() * 2 + 1;
                    mini.type = 'normal';
                    mini.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
                    bubbles.push(mini);
                }
            } else if (b.type === 'heart') {
                playPopSound();
                const heartBonus = 50;
                score += heartBonus;
                pet.gainFriendship(5);
                floatingTexts.push(new FloatingText(b.x, b.y, `+${heartBonus} LOVE! ❤️`, '#ff4081'));
                createHeartEffect(b.x, b.y);
                magicFlowers.push(new MagicFlower(b.x, b.y));
            } else if (b.type === 'lucky-star') {
                combo++;
                const points = (Math.ceil(60 / b.radius * 2) + (combo > 5 ? 5 : 0)) * multiplier;
                if (currentAccessory === '🪄') {
                    score += 5; // Bonus from Magic Bubble Wand
                }
                if (currentAccessory === '💎') {
                    score += points * 0.2; // Diamond Bow: 20% bonus points
                }
                if (currentAccessory === '👗' && (b.type === 'rainbow-burst' || b.color === 'rainbow')) {
                    score += 20; // Rainbow Tutu: Bonus for rainbow bubbles
                }
                score += points;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${points}`, b.color));
            }
            
            totalPops++;
            updateQuest();
    if (Math.random() < (currentAccessory === '🌌' ? 0.06 : 0.03)) triggerFrenzy();
    if (Math.random() < 0.01) triggerParty();
    if (Math.random() < 0.005) triggerGoldenRain();
    if (Math.random() < 0.008) triggerVortex();
    if (Math.random() < 0.004) triggerCupcakeRain();
    if (Math.random() < 0.003) triggerDiscoParty();
    if (Math.random() < 0.004) triggerSlowMo();
    if (Math.random() < 0.005) triggerWindGust();
    if (Math.random() < 0.002) triggerRainbowCascade();
    if (Math.random() < 0.003) triggerRainbowBridge();
    if (Math.random() < 0.002) triggerGlitterStorm();
    if (Math.random() < 0.003) triggerRibbon();
    if (score > 0 && score % 500 === 0 && !bossActive) triggerBossFight();
    
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

class Cloud {
    constructor() {
        this.reset();
        this.x = Math.random() * canvasWidth;
    }
    reset() {
        this.width = Math.random() * 100 + 100;
        this.height = this.width * 0.4;
        this.x = -this.width;
        this.y = Math.random() * (canvasHeight * 0.4);
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.3 + 0.4;
    }
    update() {
        this.x += this.speed;
        if (this.x > canvasWidth + this.width) this.reset();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.height * 0.6, this.y - this.height * 0.2, this.height * 0.7, 0, Math.PI * 2);
        ctx.arc(this.x + this.height * 1.2, this.y, this.height / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    clouds.forEach(c => {
        c.update();
        c.draw();
    });

    if (bossActive && boss) {

        boss.draw();
    }

    petClones.forEach(clone => {
        clone.update(lastMouseX, lastMouseY);
        clone.draw();
        if (Math.random() < 0.02) clone.tryAutoPop(); // Clones pop occasionally
    });

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
        if (bubbles[i].y < -bubbles[i].radius || bubbles[i].popped) {
            bubbles.splice(i, 1);
        }
    }
    if (isRibbonActive) {
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'pink';
        ctx.lineCap = 'round';
        
        // Draw a whimsical wavy ribbon instead of a straight line! ✨
        ctx.moveTo(ribbon.x - 20, ribbon.y);
        for (let i = -20; i <= 20; i += 2) {
            const wave = Math.sin(Date.now() / 200 + i / 10) * 5;
            ctx.lineTo(ribbon.x + i, ribbon.y + wave);
        }
        
        ctx.stroke();
        ctx.closePath();
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

    for (let i = magicFlowers.length - 1; i >= 0; i--) {
        magicFlowers[i].update();
        magicFlowers[i].draw();
        if (magicFlowers[i].life <= 0) {
            magicFlowers.splice(i, 1);
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
    totalPops = 0;
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
    currentQuest = 0;
    updateQuest();
    overlay.style.display = 'none';
    comboText.style.opacity = '0';

    clouds = [];
    for (let i = 0; i < 6; i++) {
        clouds.push(new Cloud());
    }

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
