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
let totalPops = parseInt(localStorage.getItem('bubblePopTotalPops')) || 0;
let emotionPops = parseInt(localStorage.getItem('bubblePopEmotionPops')) || 0;
let timeLeft = 30; // Default time
let highscore = localStorage.getItem('bubblePopHighscore') || 0;
let totalGold = parseInt(localStorage.getItem('bubblePopTotalGold')) || 0;
let totalGoldEarned = parseInt(localStorage.getItem('bubblePopTotalGoldEarned')) || 0;
let isPaused = false;
let gameActive = false;
let canvasWidth, canvasHeight;
let timerInterval;
let spawnTimeout;
let combo = 0;
let multiplier = 1;

window.isGravityFlipped = false; // Initialise gravity flip state

let isGoldenRain = false;
let level = 1;
let comboTimer;
let isFrenzy = false;
let isVortex = false;
let isRibbonActive = false;
let ribbon = { x: 0, y: 0, vx: 0, vy: 0 };
let isMagnetic = false;
let isGlitterGala = false;
let glitterGalaTimer = 0;
let bossActive = false;
let boss = null;
let bossHealth = 100;
let bossMaxHealth = 100;
let gameSpeed = 1;
let magicDustPopsRemaining = 0;
let lastBossCheckpoint = 0;
let lastBossFightMilestone = 0;
let shieldActive = false;


function checkBossMilestones() {
    const milestone = BOSS_MILESTONES.find(m => score >= m.score && lastBossCheckpoint < m.score);
    if (milestone) {
        floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, milestone.text, 'orange'));
        lastBossCheckpoint = milestone.score;
    }
}

let currentSkin = localStorage.getItem('bubblePopSkin') || '#ff80ab';
let currentAccessory = localStorage.getItem('bubblePopAccessory') || '';

highscoreEl.innerText = highscore;
totalGoldEl.innerText = totalGold;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();


// Quests System
let currentQuest = parseInt(localStorage.getItem('bubblePopQuest')) || 0;
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
        progress = (totalGoldEarned / quest.goal) * 100;
    } else if (quest.type === 'emotion') {
        progress = (emotionPops / quest.goal) * 100;
    } else {
        progress = (totalPops / quest.goal) * 100;
    }

    questText.innerText = `Quest: ${quest.text}`;
    questFill.style.width = `${Math.min(100, progress)}%`;

    if (progress >= 100) {
        completeQuest();
    }
}

function updateTotalGold(amount) {
    totalGold += amount;
    localStorage.setItem('bubblePopTotalGold', totalGold);
    totalGoldEl.innerText = totalGold;
    if (amount > 0) {
        totalGoldEarned += amount;
        localStorage.setItem('bubblePopTotalGoldEarned', totalGoldEarned);
    }
}

function completeQuest() {
    const quest = quests[currentQuest];
    if (!quest) return;

    score += quest.reward;
    updateTotalGold(quest.rewardGold);
    
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, `QUEST COMPLETE! +${quest.reward} 🌟`, 'gold'));
    playSound(880, 'sine', 0.3);
    
    currentQuest++;
    localStorage.setItem('bubblePopQuest', currentQuest);
    updateQuest();
    updateScore();
}

function updateScore() {
    scoreEl.innerText = score;
    scoreEl.style.transform = 'scale(1.2)';
    checkBossMilestones();
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
                updateTotalGold(-skin.cost);
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

    const treatGrid = document.getElementById('treat-grid') || document.createElement('div');
    if (!treatGrid.id) {
        treatGrid.id = 'treat-grid';
        treatGrid.className = 'shop-grid';
        treatGrid.style.marginTop = '20px';
        document.getElementById('shop-overlay').appendChild(treatGrid);
    }
    treatGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">Pet Treats 🍪</div>';
    
    TREATS.forEach(treat => {
        const canAfford = totalGold >= treat.cost;
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <div class="item-preview" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; background: none; border: 2px dashed #ccc; border-radius: 50%;">
                ${treat.emoji}
            </div>
            <div style="font-size: 0.9rem; font-weight: bold;">${treat.name}</div>
            <div class="item-cost">✨ ${treat.cost}</div>
        `;
        item.onclick = () => {
            if (canAfford) {
                updateTotalGold(-treat.cost);
                pet.gainFriendship(treat.friendship);
                pet.gainEnergy(treat.energy);
                renderShop();
                playSound(880, 'sine', 0.2);
                floatingTexts.push(new FloatingText(canvasWidth/2, canvasHeight/2, `${treat.name} given to pet! ❤️`, 'magenta'));
            } else {
                playSound(200, 'sawtooth', 0.1);
            }
        };
        treatGrid.appendChild(item);
    });
    
    // treatGrid is already appended if it was created


    const accGrid = document.getElementById('accessory-grid');
    accGrid.innerHTML = '';
    accessories.forEach(acc => {
        const isOwned = ownedAccessories.includes(acc.name);
        const canAfford = totalGold >= acc.cost;
        
        const item = document.createElement('div');
        item.className = `shop-item ${currentAccessory === acc.name ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="item-preview" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; background: none; border: 2px dashed #ccc; border-radius: 50%;">
                ${acc.emoji}
            </div>
            <div style="font-size: 0.9rem; font-weight: bold;">${acc.name}</div>
            <div class="item-cost">${isOwned ? 'Owned' : '✨ ' + acc.cost}</div>
        `;
        
        item.onclick = () => {
            if (isOwned) {
                currentAccessory = acc.name;
                localStorage.setItem('bubblePopAccessory', currentAccessory);
                renderShop();
                playSound(600, 'sine', 0.1);
            } else if (canAfford) {
                updateTotalGold(-acc.cost);
                ownedAccessories.push(acc.name);
                localStorage.setItem('bubblePopAccessories', JSON.stringify(ownedAccessories));
                currentAccessory = acc.name;
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
let singularities = [];
let shockwaves = [];
let lastMouseX = canvasWidth / 2;
let lastMouseY = canvasHeight / 2;
let petClones = [];
let pet = new MagicalPet();

class Bubble {
    constructor(frenzy = false) {
        this.radius = Math.random() * 30 + 20;
        this.hits = 1;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = window.isGravityFlipped ? -this.radius : canvasHeight + this.radius;
        this.speed = (Math.random() * 2 + 1) * (frenzy ? 1.5 : 1) * (window.isGravityFlipped ? -1 : 1);
        this.color = currentSkin === 'rainbow' ? `hsl(${Math.random() * 360}, 70%, 70%)` : currentSkin;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
        this.pulse = 0;
        this.pulseDir = 1;
        this.isSneezing = false;
        this.sneezeTimer = 0;
        this.sneezeOffset = { x: 0, y: 0 };
        
       this.type = 'normal';
       const rand = Math.random();
       if (rand > 0.9995) { this.type = 'cosmic-singularity'; this.color = '#000033'; this.radius = 30; this.hits = 1; }
       else if (rand > 0.9990) { this.type = 'rainbow-vortex'; this.color = '#ff00ff'; this.radius = 45; this.hits = 1; }
       else if (rand > 0.9985) { this.type = 'prism'; this.color = '#e0f7fa'; this.radius = 30; this.hits = 1; }
       else if (rand > 0.9980) { this.type = 'cosmic-candy'; this.color = '#ff69b4'; this.radius = 30; this.hits = 1; }
       else if (rand > 0.9970) { this.type = 'ellie-wish'; this.color = '#ff00ff'; this.radius = 40; this.hits = 1; }
       else if (rand > 0.9950) { this.type = 'mystery-box'; this.color = '#ffeb3b'; this.radius = 35; }
       else if (rand > 0.9930) { this.type = 'golden-ticket'; this.color = '#ffd700'; this.radius = 30; this.hits = 1; }
       else if (rand > 0.9920) { this.type = 'gold'; this.color = '#FFD700'; }
       else if (rand > 0.9800) { this.type = 'magic-mirror'; this.color = '#e0f7fa'; this.radius = 35; }
       else if (rand > 0.9750) { this.type = 'magic-wand'; this.color = '#da70d6'; }
       else if (rand > 0.9500) { this.type = 'super-pop'; this.color = '#ff4500'; }
       else if (rand > 0.9400) { this.type = 'rainbow-burst'; this.color = 'rainbow'; }
       else if (rand > 0.9200) { this.type = 'shimmer-shell'; this.color = '#ffd700'; }
       else if (rand > 0.8700) { this.type = 'heart'; this.color = '#ff4081'; }
       else if (rand > 0.8200) { this.type = 'cluster'; this.color = '#ffcc80'; }
       else if (rand > 0.7700) { this.type = 'magic-star'; this.color = '#ffff00'; }
       else if (rand > 0.7500) { this.type = 'sparkle-blast'; this.color = '#00ffff'; this.radius = 35; this.hits = 1; }
       else if (rand > 0.7000) { this.type = 'lucky-star'; this.color = '#ffeb3b'; }
       else if (rand > 0.6500) { this.type = 'freeze'; this.color = '#b2ebf2'; }
       else if (rand > 0.6000) { this.type = 'time-warp'; this.color = '#e1bee7'; }
       else if (rand > 0.5500) { this.type = 'magic-burst'; this.color = '#b3e5fc'; }
       else if (rand > 0.5000) { this.type = 'hammer'; this.color = '#a1887f'; }
       else if (rand > 0.4500) { this.type = 'giant'; this.radius = Math.random() * 40 + 70; this.hits = 3; this.color = '#ffeb3b'; }
       else if (rand > 0.4000) { this.type = 'shield'; this.color = '#b2dfdb'; }
       else if (rand > 0.3800) { this.type = 'mega-pop'; this.color = '#ff00ff'; this.radius = 60; }
       else if (rand > 0.3300) { this.type = 'magic-dust'; this.color = '#ffffff'; this.radius = 25; }
       else if (rand > 0.2800) { this.type = 'lucky-clover'; this.color = '#81c784'; }
       else if (rand > 0.2600) {
           if (Math.random() < 0.5) { this.type = 'rainbow-spiral'; this.color = '#ff00ff'; this.radius = 30; }
           else { this.type = 'burst-bubble'; this.color = '#ffeb3b'; this.radius = 35; }
       } else if (rand > 0.2400) { this.type = 'confetti'; this.color = '#ff69b4'; this.radius = 30; }
       else if (rand > 0.2100) { this.type = 'pet-treat'; this.color = '#ffca28'; }
       else if (rand > 0.2000) { this.type = 'pet-snack'; this.color = '#ffcc80'; }
       else if (rand > 0.1900) { this.type = 'candy-cloud'; this.color = '#f8bbd0'; this.radius = 35; this.hits = 1; }
       else if (rand > 0.1600) { this.type = 'magnetic-bubble'; this.color = '#9c27b0'; }
       else if (rand > 0.1300) {
           this.type = 'emotion';
           const emotions = ['😊', '😢', '😡', '😱', '🥳'];
           this.emoji = emotions[Math.floor(Math.random() * emotions.length)];
           this.color = '#ffccbc';
       } else if (rand > 0.1000) { this.type = 'magic-mushroom'; this.color = '#ff69b4'; }
       else if (rand > 0.0700) { this.type = 'rainbow-portal'; this.color = '#ff00ff'; this.radius = 45; }
       else if (rand > 0.0600) { this.type = 'sneeze'; this.color = '#ffeb3b'; this.radius = 30; }
       else if (rand > 0.0500) { this.type = 'bomb'; this.color = '#424242'; }
       else { this.type = 'stinky'; this.color = '#9e9e9e'; }

    }
   update() {
       if (isPaused) return;
       if (this.type === 'rainbow-vortex') {
           bubbles.forEach(b => {
               if (b === this) return;
               const dx = this.x - b.x;
               const dy = this.y - b.y;
               const dist = Math.hypot(dx, dy);
               if (dist < 200) {
                   b.vx += dx / dist * 0.15;
                   b.vy += dy / dist * 0.15;
               }
           });
       }
       if (this.type === 'cosmic-singularity') {
           bubbles.forEach(b => {
               if (b === this) return;
               const dx = this.x - b.x;
               const dy = this.y - b.y;
               const dist = Math.hypot(dx, dy);
               if (dist < 150) {
                   b.vx += dx / dist * 0.3;
                   b.vy += dy / dist * 0.3;
                   if (dist < 30) {
                       b.popped = true;
                       createPopEffect(b.x, b.y, b.color);
                       score += 5;
                   }
               }
           });
       }
       this.y -= this.speed * gameSpeed;
       this.y += this.vy * gameSpeed;
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
       ctx.shadowBlur = 0;
       if (this.isSneezing) {
           drawX += this.sneezeOffset.x * (this.sneezeTimer / 30);
           drawY += this.sneezeOffset.y * (this.sneezeTimer / 30);
       }
       if (this.type === 'cosmic-singularity') {
           ctx.shadowBlur = 20;
           ctx.shadowColor = '#000033';
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
            ctx.moveTo(drawX - this.radius * 0.5, drawY);
            ctx.lineTo(drawX, drawY - this.radius * 0.5);
            ctx.lineTo(drawX + this.radius * 0.5, drawY);
            ctx.lineTo(drawX, drawY + this.radius * 0.5);
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
            ctx.textAlign = 'center';
            ctx.fillText('✨', drawX, drawY + currentRadius/3);
        }
        if (this.type === 'magic-mirror') {
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
       } else if (this.type === 'rainbow-vortex') {
           ctx.font = `${currentRadius}px Arial`;
           ctx.textAlign = 'center';
           ctx.fillText('🌀', drawX, drawY + currentRadius/3);
           ctx.shadowBlur = 20;
           ctx.shadowColor = `hsl(${Date.now() / 5 % 360}, 100%, 50%)`;
        } else if (this.type === 'prism') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💎', drawX, drawY + currentRadius/3);
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
        } else if (this.type === 'cosmic-candy') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🍭', drawX, drawY + currentRadius/3);
        } else if (this.type === 'confetti') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🎊', drawX, drawY + currentRadius/3);
        } else if (this.type === 'sneeze') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🤧', drawX, drawY + currentRadius/3);
        } else if (this.type === 'magic-dust') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('✨', drawX, drawY + currentRadius/3);
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'white';
        }
        if (this.type === 'cupcake') {
            ctx.font = `${currentRadius}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🧁', drawX, drawY + currentRadius/3);
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
        this.vx = (Math.random() - 0.5) * 1;
    }
    update() {
        this.x += this.vx;
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
                    updateScore();
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

        // Add sparkle trail ✨
        if (Math.random() < 0.3) {
            trail.push(new TrailParticle(this.x, this.y));
        }

        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        }

        if (this.isClone) {
            // Clones don't update the main energy bar
        } else {
            const energyFill = document.getElementById('pet-energy-fill');
            if (energyFill) {
                energyFill.style.width = `${(this.energy / this.maxEnergy) * 100}%`;
            }
        }
   // Friendship Level 5: Occasionally spawn a gold bubble!
   if ((this.friendshipLevel >= 5 || currentAccessory === 'Starry Halo') && Math.random() < (currentAccessory === 'Starry Halo' ? 0.005 : 0.002)) {
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

    if (score >= 15000) { nextLevel = 7; nextEmoji = '🌌🐱'; nextInterval = 1500; nextRange = 500; }
    else if (score >= 10000) { nextLevel = 6; nextEmoji = '👑🐱'; nextInterval = 2000; nextRange = 400; }
    else if (score >= 5000) { nextLevel = 5; nextEmoji = '✨🌈'; nextInterval = 3000; nextRange = 300; }
    else if (score >= 3000) { nextLevel = 4; nextEmoji = '🐉'; nextInterval = 4000; nextRange = 250; }
    else if (score >= 1500) { nextLevel = 3; nextEmoji = '🦄'; nextInterval = 5000; nextRange = 200; }
    else if (score >= 500) { nextLevel = 2; nextEmoji = '🦊'; nextInterval = 6000; nextRange = 175; }

   // Apply Accessory Bonuses
   if (currentAccessory === 'Sparkle Wings') {
       nextRange += 50;
   }
   if (currentAccessory === 'Magic Hat') {
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
            x: nearest.x,
            y: nearest.y
        };
        handlePop(mockEvent, true);
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
        
        // Extra reward for super pop!
        score += 100;
        updateScore();
        playSound(1200, 'sine', 0.3);

        playSound(800, 'sine', 0.3);
        setTimeout(() => playSound(1200, 'sine', 0.3), 100);
        
        createBigExplosion(this.x, this.y);
        
        const superPopRadius = 300;
        bubbles.forEach(b => {
               const dist = Math.hypot(this.x - b.x, this.y - b.y);
               if (dist < superPopRadius) {
                    createPopEffect(b.x, b.y, b.color);
                    score += 10;
                    b.popped = true;
                    updateScore();
               }
           });
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x, this.y + this.floatOffset);
        const accessoryObj = accessories.find(a => a.name === currentAccessory);
        if (accessoryObj) {
            ctx.font = `${this.size * 0.7}px Arial`;
            ctx.fillText(accessoryObj.emoji, this.x + this.size * 0.3, this.y + this.floatOffset - this.size * 0.2);
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
    
    if (isPaused) {
        spawnTimeout = setTimeout(spawnBubble, 100);
        return;
    }

    bubbles.push(new Bubble(isFrenzy));
    
    let nextSpawn = Math.max(150, 600 - (score * 2) - (level * 20));
    if (isFrenzy) nextSpawn /= 3;
    
    spawnTimeout = setTimeout(spawnBubble, nextSpawn);
}

function triggerFrenzy() {
    if (!isFrenzy) {
        isFrenzy = true;
        frenzyAlert.style.display = 'block';
        document.body.classList.add('frenzy-bg');
    }
    
    clearTimeout(window.frenzyTimer);
    window.frenzyTimer = setTimeout(() => {
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
            goldBubble.speed = -goldBubble.speed;
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
            cupcake.speed = -cupcake.speed;
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

function triggerGlitterSneeze() {
    triggerSneezeEffect();
    // Also spawn some gold bubbles when sneezing for a "lucky sneeze"! ✨
    for (let i = 0; i < 5; i++) {
        const gb = new Bubble();
        gb.type = 'gold';
        gb.x = Math.random() * canvasWidth;
        gb.y = Math.random() * canvasHeight;
        bubbles.push(gb);
    }
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'LUCKY SNEEZE! 🤧✨💰', 'gold'));
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
            rb.speed = -(Math.random() * 3 + 2);
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
function triggerRibbon() {
    const ribbonAlert = document.getElementById('ribbon-alert');
    if (ribbonAlert) ribbonAlert.style.display = 'block';
    isRibbonActive = true;
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
            if (ribbonAlert) ribbonAlert.style.display = 'none';
            clearInterval(ribbonInterval);
        }
        
        // Ribbon pops nearby bubbles
        bubbles.forEach(b => {
            const dist = Math.hypot(ribbon.x - b.x, ribbon.y - b.y);
            if (dist < 60) {
                b.popped = true; // Mark for removal
                createPopEffect(b.x, b.y, 'pink');
                score += 5;
            }
        });
    }, 20);
}

function triggerStarfall() {
    const starfallAlert = document.getElementById('starfall-alert');
    if (starfallAlert) starfallAlert.style.display = 'block';
    
    const duration = 5000;
    const end = Date.now() + duration;
    
    const spawnInterval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(spawnInterval);
            if (starfallAlert) starfallAlert.style.display = 'none';
            return;
        }
        
        const star = new Bubble(false);
        star.type = 'lucky-star';
        star.radius = Math.random() * 15 + 10;
        star.x = Math.random() * canvasWidth;
        star.y = -star.radius;
        star.speed = Math.random() * 5 + 3;
        star.vx = (Math.random() - 0.5) * 2;
        bubbles.push(star);
    }, 100);
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
                b.vx += (dx / (dist || 1)) * 0.8;
                b.vy += (dy / (dist || 1)) * 0.8;
            }
        });
    }, 20);
}

function triggerGlitterGala() {
    const galaAlert = document.getElementById('glitter-gala-alert');
    galaAlert.style.display = 'block';
    isGlitterGala = true;
    glitterGalaTimer = 600;
    
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'GLITTER GALA! ✨💎', 'gold'));
    playSound(800, 'sine', 0.2);
    setTimeout(() => playSound(1000, 'sine', 0.2), 100);
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
                b.vx += (dx / (dist || 1)) * 0.5;
                b.vy += (dy / (dist || 1)) * 0.5;
        });
    }, 20);
    
    setTimeout(() => {
        isVortex = false;
        vortexAlert.style.display = 'none';
    }, 5000);
}



function updateCombo() {
    comboContainer.style.display = combo > 0 ? 'block' : 'none';
    comboText.innerText = `Combo: x${combo}`;
    comboBar.style.width = `${Math.min(100, (combo / 20) * 100)}%`;

    if (combo > 1) {
        // Combo Milestones! ✨
        if (combo === 10) {
            floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'UNSTOPPABLE! 🔥', 'orange'));
            playSound(600, 'sine', 0.2);
        } else if (combo === 25) {
            floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'BUBBLE MASTER! 🌟', 'gold'));
            playSound(800, 'sine', 0.2);
        } else if (combo === 50) {
            floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'LEGENDARY! 👑', 'magenta'));
            playSound(1000, 'sine', 0.3);
            triggerFrenzy();
        }
    }
    
    // Oppdater multiplikator basert på combo og tilbehør
    let accessoryMultiplier = 1;
    if (currentAccessory === 'Diamond Bow') accessoryMultiplier = 1.2;

    multiplier = (1 + Math.floor(combo / 5)) * accessoryMultiplier;
    multiplierEl.innerText = `x${multiplier}`;
    
    if (combo > 0) {
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            combo = 0;
            updateCombo();
        }, 1500);
    }
}

function handlePop(e, isAutoPop = false) {
    if (!gameActive) return;
    if (isPaused) return;

    let mouseX, mouseY;
    if (isAutoPop) {
        mouseX = e.x;
        mouseY = e.y;
    } else {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        mouseY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const petDist = Math.hypot(mouseX - pet.x, mouseY - (pet.y + pet.floatOffset));

    // First check if we hit the boss (Direct Hit)
    if (!isAutoPop && bossActive && boss) {
        const bossDist = Math.hypot(mouseX - boss.x, mouseY - boss.y);
        if (bossDist < boss.radius + 20) {
            damageBoss(20);
            floatingTexts.push(new FloatingText(boss.x, boss.y, 'DIRECT HIT! -20', 'white'));
            playSound(200, 'sine', 0.3);
            return; // Don't pop bubbles or pet the pet if we hit the boss
        }
    }




    let didPop = false;
   for (let i = bubbles.length - 1; i >= 0; i--) {
       const b = bubbles[i];
       
       if (!b) continue;
       if (b.popped) continue;
       // Fix: Account for Sneeze offset in hit detection
       let hitX = b.x;
       let hitY = b.y;
        if (b.isSneezing) {
            hitX += b.sneezeOffset.x * (b.sneezeTimer / 30);
            hitY += b.sneezeOffset.y * (b.sneezeTimer / 30);
        }
        const dist = Math.hypot(mouseX - hitX, mouseY - hitY);
        
        if (dist < b.radius + 10) {
            if (bossActive && b.type === 'stinky') {
                damageBoss(10);
                floatingTexts.push(new FloatingText(b.x, b.y, 'BOSS DAMAGE! -10', 'white'));
                b.popped = true;
                totalPops++;
                updateQuest();
                didPop = true;
                continue;
            }

            if (b.hits > 1) {
                b.hits--;
                createPopEffect(b.x, b.y, b.color);
                playSound(300, 'sine', 0.1);
                floatingTexts.push(new FloatingText(b.x, b.y, 'HIT!', b.color));
                didPop = true;
                continue;
                } else {
                    createPopEffect(b.x, b.y, b.color);
                    didPop = true;
                    b.popped = true;
                    // Normal bubbles and most other bubbles give score
                    // and use the multiplier!
                    let poppedSpecial = false;
                    // Check for special types that handle their own scoring first
                    // (These will set poppedSpecial = true)
                    if (magicDustPopsRemaining > 0) {
                    score += 5 * multiplier;
                    magicDustPopsRemaining--;
                    floatingTexts.push(new FloatingText(b.x, b.y, `+${5 * multiplier} ✨`, 'white'));
                    }
                    if (b.type === 'sparkle-blast') {
                        triggerShockwave(b.x, b.y, b.color);
                    floatingTexts.push(new FloatingText(b.x, b.y, 'SPARKLE BLAST! ✨', b.color));
                       poppedSpecial = true;
                   }
                   
                   if (b.type !== 'stinky' && b.type !== 'bomb') {
                       pet.gainEnergy(1);
                   }
                   const popColor = b.color;
                   playPopSound(b.type === 'gold', b.type === 'stinky', popColor);
                   
                if (b.type === 'mystery-box') {
                    playPopSound(true, false);
                    const mysteryOutcomes = [
                        { text: 'JACKPOT! 💰', action: () => { updateTotalGold(1000); }, bonus: 2000, color: 'gold', energy: 20 },
                        { text: 'TIME WARP! ⏰', action: () => { timeLeft += 20; }, bonus: 500, color: '#81d4fa', energy: 10 },
                        { text: 'PARTY TIME! 🥳', action: () => triggerParty(), bonus: 1000, color: '#ff4081', energy: 30 },
                        { text: 'GOLDEN RAIN! ✨', action: () => triggerGoldenRain(), bonus: 1000, color: '#ffd700', energy: 20 },
                        { text: 'DISCO FEVER! 💃', action: () => triggerDiscoParty(), bonus: 1500, color: '#ff00ff', energy: 50 },
                        { text: 'MELODY MODE! 🎵', action: () => triggerMelodyMode(), bonus: 1200, color: '#ffeb3b', energy: 25 },
                        { text: 'LUCKY SNEEZE! 🤧✨', action: () => triggerGlitterSneeze(), bonus: 500, color: '#ffeb3b', energy: 10 },
                    ];
                    const outcome = mysteryOutcomes[Math.floor(Math.random() * mysteryOutcomes.length)];
                    score += outcome.bonus;
                    if (outcome.energy) pet.gainEnergy(outcome.energy);
                    floatingTexts.push(new FloatingText(b.x, b.y, `MYSTERY BOX: ${outcome.text}`, outcome.color));
                    outcome.action();
                    createBigExplosion(b.x, b.y);
                    createPopEffect(b.x, b.y, outcome.color);
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'golden-ticket') {
                    playPopSound(true, false);
                    const ticketBonus = 1000;
                    score += ticketBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `GOLDEN TICKET! 🎫 +${ticketBonus}`, 'gold'));
                    createPopEffect(b.x, b.y, 'gold');
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'rainbow-vortex') {
                    playPopSound(true, false);
                    triggerRainbowCascade();
                    score += 500;
                    floatingTexts.push(new FloatingText(b.x, b.y, 'VORTEX POP! 🌈🌀', 'magenta'));
                    createBigExplosion(b.x, b.y);
                    poppedSpecial = true;
                } else if (b.type === 'ellie-wish') {
                    playPopSound(true, false);
                    const wishes = [
                        { text: 'GOLD RAIN! ✨', action: () => triggerGoldenRain(), bonus: 0 },
                        { text: 'TIME GIFT! ⏰', action: () => { timeLeft += 15; }, bonus: 0 },
                        { text: 'JACKPOT! 💰', action: () => { updateTotalGold(500); }, bonus: 5000 },
                    ];
                    const wish = wishes[Math.floor(Math.random() * wishes.length)];
                    score += wish.bonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `ELLIE'S WISH: ${wish.text}`, 'magenta'));
                    wish.action();
                    createBigExplosion(b.x, b.y);
                    createPopEffect(b.x, b.y, 'magenta');
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'magic-wand') {
                    playPopSound(true, false);
                    const wandBonus = 250;
                    score += wandBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC WAND! 🪄 +${wandBonus}`, '#da70d6'));
                    createPopEffect(b.x, b.y, '#da70d6');
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'magic-mirror') {
                    playPopSound(true, false);
                    const mirrorBonus = 500;
                    score += mirrorBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC MIRROR! 🪞 +${mirrorBonus}`, '#e0f7fa'));
                    createPopEffect(b.x, b.y, '#e0f7fa');
                    triggerMirrorRealm();
                    const clone = new MagicalPet();
                    clone.emoji = '💎' + pet.emoji;
                    clone.isClone = true;
                    petClones.push(clone);
                    floatingTexts.push(new FloatingText(b.x, b.y, `CRYSTAL CLONE! 💎✨`, 'gold'));
                    setTimeout(() => {
                        petClones = petClones.filter(c => c !== clone);
                    }, 10000);
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'magic-burst') {
                    playPopSound(true, false);
                    const burstBonus = 150;
                    score += burstBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC BURST! 🎆 +${burstBonus}`, '#b3e5fc'));
                    createPopEffect(b.x, b.y, '#b3e5fc');
                    const currentColor = b.color;
                    bubbles.forEach(bub => {
                        if (bub !== b && bub.color === currentColor) {
                            createPopEffect(bub.x, bub.y, bub.color);
                            score += 10;
                            floatingTexts.push(new FloatingText(bub.x, bub.y, `+10`, bub.color));
                            bub.popped = true;
                        }
                    });
                    triggerFrenzy();
                    poppedSpecial = true;
                } else if (b.type === 'rainbow-portal') {
                    playPopSound(true, false);
                    poppedSpecial = true;
                    const portalBonus = 300;
                    score += portalBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW PORTAL! 🌈🌀 +${portalBonus}`, '#ff00ff'));
                    createPopEffect(b.x, b.y, '#ff00ff');
                    for (let j = 0; j < 10; j++) {
                        const special = new Bubble(true);
                        special.type = ['gold', 'heart', 'lucky-star', 'magic-star', 'lucky-clover'][Math.floor(Math.random() * 5)];
                        special.x = Math.random() * (canvasWidth - 40) + 20;
                        special.y = Math.random() * (canvasHeight - 40) + 20;
                        special.speed = Math.random() * 2 + 1;
                        bubbles.push(special);
                    }
                    triggerFrenzy();
                }
                
                if (b.type !== 'stinky' && b.type !== 'bomb') {
                    combo++;
                }
            }
            if (b.type === 'cosmic-candy') {
                poppedSpecial = true;
                    playPopSound(true, false);
                    const candyBonus = 100;
                    score += candyBonus;
                    floatingTexts.push(new FloatingText(b.x, b.y, `COSMIC CANDY! 🍭 +${candyBonus}`, '#ff69b4'));
                    createPopEffect(b.x, b.y, '#ff69b4');
                    for (let j = 0; j < 3; j++) {
                    const mini = new Bubble(false);
                    mini.type = 'normal';
                    mini.color = '#ff69b4';
                    mini.radius = 15;
                    mini.x = b.x;
                    mini.y = b.y;
                    mini.vx = (Math.random() - 0.5) * 15;
                    mini.vy = (Math.random() - 0.5) * 15 - 5;
                    mini.speed = Math.random() * 2 + 1;
                    bubbles.push(mini);
                }
            } else if (b.type === 'shimmer-shell') {
                poppedSpecial = true;
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
                poppedSpecial = true;
                if (currentAccessory === 'Heart Glasses') {
                    score += 100;
                    floatingTexts.push(new FloatingText(b.x, b.y, 'HEART VISION! +100 ❤️', '#ff4081'));
                }
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
                    poppedSpecial = true;
                    
                    const goldBasePoints = 25;
                    const goldComboBonus = combo * 5;
                    let goldScore = (goldBasePoints * multiplier) + goldComboBonus;
                    if (currentAccessory === 'Magic Bubble Wand') goldScore *= 1.2;
                    
                    score += Math.floor(goldScore);
                    
                    let goldGain = goldBasePoints + (combo * 2);
                    if (currentAccessory === 'Golden Collar') goldGain = Math.floor(goldGain * 1.5);
                    const friendshipMult = 1 + (Math.min(pet.friendshipLevel - 1, 4) * 0.1);
                    goldGain = Math.floor(goldGain * friendshipMult);
                    
                    updateTotalGold(goldGain);
                    timeLeft += 2;
                    floatingTexts.push(new FloatingText(b.x, b.y, `+${goldGain} GOLD! ✨`, 'gold'));
                    floatingTexts.push(new FloatingText(b.x, b.y, `+${Math.floor(goldScore)}`, 'gold'));
                } else if (b.type === 'rainbow-burst') {
              playPopSound(true, false);
              const rainbowBonus = 100;
              if (currentAccessory === 'Rainbow Tutu') {
                  score += 50;
                  floatingTexts.push(new FloatingText(b.x, b.y, 'TUTU BONUS! +50 👗', 'magenta'));
              }
              poppedSpecial = true;
              score += rainbowBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `RAINBOW BURST! 🌈 +${rainbowBonus}`, 'magenta'));
              
                // Rainbow Burst effect: pops ALL bubbles on screen! 🌈✨
                bubbles.forEach(bub => {
                    if (bub !== b) {
                        createPopEffect(bub.x, bub.y, bub.color);
                        score += 5;
                        floatingTexts.push(new FloatingText(bub.x, bub.y, `+5`, bub.color));
                                bub.popped = true; // Mark for removal
                        totalPops++;
                        updateQuest();
                    }
                });
               
               triggerFrenzy();
               createPopEffect(b.x, b.y, 'rainbow');
           } else if (b.type === 'time-warp') {
              playPopSound(true, false);
              const timeBonus = 3;
              poppedSpecial = true;
              timeLeft += timeBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `TIME WARP! ⏳ +${timeBonus}s`, '#e1bee7'));
              createPopEffect(b.x, b.y, '#e1bee7');
               } else if (b.type === 'sneeze') {
                   playPopSound(true, false);
                   const sneezeBonus = 200;
                   poppedSpecial = true;
                   score += sneezeBonus;
                   floatingTexts.push(new FloatingText(b.x, b.y, `SNEEZE! 🤧 +${sneezeBonus}`, '#ffeb3b'));
                   createPopEffect(b.x, b.y, '#ffeb3b');
                    triggerSneezeEffect();
                } else if (b.type === 'magic-dust') {
              playPopSound(true, false);
              const dustBonus = 30;
              score += dustBonus;
              poppedSpecial = true;
              floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC DUST! ✨ +${dustBonus}`, 'white'));
              createPopEffect(b.x, b.y, 'white');
              
               // Magic Dust effect: slightly increases the score of the next 5 pops
               let popsCount = 0;
               magicDustPopsRemaining = 5;
               // playSound(true, false); // Removed redundant call
               const goldBonus = Math.floor(Math.random() * 20) + 10;
               updateTotalGold(goldBonus);
               floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC DUST! ✨ +${goldBonus} GOLD`, 'white'));
               createPopEffect(b.x, b.y, 'white');
               } else if (b.type === 'candy-cloud') {
               playPopSound(true, false);
               score += 150;
               poppedSpecial = true;
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
               poppedSpecial = true;
               createPopEffect(b.x, b.y, '#b2ebf2');
               bubbles.forEach(bub => bub.speed = 0);
               setTimeout(() => {
                    bubbles.forEach(bub => {
                        bub.speed = (Math.random() * 2 + 1) * (isFrenzy ? 1.5 : 1) * (window.isGravityFlipped ? -1 : 1);
                    });
                }, 3000);
            } else if (b.type === 'shield') {
               playPopSound();
               shieldActive = true;
               poppedSpecial = true;
               floatingTexts.push(new FloatingText(b.x, b.y, 'SHIELD ACTIVE! 🛡️', '#b2dfdb'));
               createPopEffect(b.x, b.y, '#b2dfdb');
               
                // Give the pet a shield too!
                pet.shieldTimer = 300; 
                floatingTexts.push(new FloatingText(pet.x, pet.y, 'PET SHIELD! 🛡️✨', '#b2dfdb'));

               setTimeout(() => {
                   shieldActive = false;
               }, 7000);
            } else if (b.type === 'magic-star') {
              playPopSound(true, false);
              const magicBonus = 60;
              score += magicBonus;
              poppedSpecial = true;
              floatingTexts.push(new FloatingText(b.x, b.y, `MAGIC STAR! ✨ +${magicBonus}`, '#ffff00'));
              createPopEffect(b.x, b.y, '#ffff00');
           } else if (b.type === 'hammer') {
              playPopSound(true, false);
              const hammerBonus = 80;
              score += hammerBonus;
              poppedSpecial = true;
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
                    createPopEffect(target.x, target.y, target.color);
                    score += 10;
                    floatingTexts.push(new FloatingText(target.x, target.y, `+10`, target.color));
                    target.popped = true;
                    totalPops++;
                    updateQuest();
                    potentialTargets.splice(targetIndex, 1);
                    popped++;
                }
           } else if (b.type === 'pet-treat') {
              playPopSound(true, false);
              pet.triggerSugarRush();
              poppedSpecial = true;
              pet.gainFriendship(20);
               const treatBonus = 30;
               score += treatBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `YUMMY! 🦴 +${treatBonus}`, '#ffca28'));
              createPopEffect(b.x, b.y, '#ffca28');
           } else if (b.type === 'pet-snack') {
               playPopSound(true, false); poppedSpecial = true;
               pet.gainEnergy(20);
               pet.mood = 'Happy';
              pet.moodTimer = 600;
                const snackBonus = 50;
               score += snackBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `YUM! 🍪 +${snackBonus}`, '#ffcc80'));
              createPopEffect(b.x, b.y, '#ffcc80');
           } else if (b.type === 'emotion') {
               poppedSpecial = true;
              score += 50;
             emotionPops++;
             localStorage.setItem('bubblePopEmotionPops', emotionPops);
             floatingTexts.push(new FloatingText(b.x, b.y, `EMOTION POP! ${b.emoji} +50`, b.color));
               createPopEffect(b.x, b.y, b.color);
            } else if (b.type === 'bomb') {
                playSound(100, 'square', 0.5);
                bubbles.forEach(bub => bub.popped = true);
                poppedSpecial = true;
                    floatingTexts.push(new FloatingText(b.x, b.y, 'BOOM! 💣', 'orange'));
                    poppedSpecial = true;
                } else if (b.type === 'stinky') {
                    if (shieldActive) {
                        playPopSound(true, false);
                   poppedSpecial = true;
                   floatingTexts.push(new FloatingText(b.x, b.y, 'SHIELDED! 🛡️', '#b2dfdb'));
                                createPopEffect(b.x, b.y, '#b2dfdb');
                                shieldActive = false;
                            } else {
                                playPopSound(false, true);
                                poppedSpecial = true;
                                score = Math.max(0, score - 5);
                                combo = 0;
                                comboBar.style.width = '0%';
                    comboText.innerText = '';
                    floatingTexts.push(new FloatingText(b.x, b.y, `-5 💨`, '#666'));
                    document.body.classList.add('shake');
                    setTimeout(() =>                   document.body.classList.remove('shake'), 400);
                }
           } else if (b.type === 'super-pop') {
              playSuperPopSound();
              floatingTexts.push(new FloatingText(b.x, b.y, 'SUPER POP! 💥', 'orange'));
              poppedSpecial = true;
              
               const allBubbles = [...bubbles];
               bubbles = [];
                allBubbles.forEach(otherBubble => {
                    if (otherBubble !== b) {
                        if (otherBubble.type !== 'bomb' && otherBubble.type !== 'stinky') {
                            createPopEffect(otherBubble.x, otherBubble.y, otherBubble.color);
                            score += 10;
                            totalPops++;
                            updateQuest();
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
              poppedSpecial = true;
              score += magBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `MAGNETIC! 🧲 +${magBonus}`, '#9c27b0'));
              createPopEffect(b.x, b.y, '#9c27b0');
               triggerMagnetism();
           } else if (b.type === 'magic-mushroom') {
              playPopSound(true, false);
              const mushBonus = 80;
              poppedSpecial = true;
              score += mushBonus;
              floatingTexts.push(new FloatingText(b.x, b.y, `MUSHROOM POP! 🍄 +${mushBonus}`, '#ff69b4'));
              createPopEffect(b.x, b.y, '#ffb6c1');
               
                // Spawn a cluster of "spore" bubbles
                for (let j = 0; j < 8; j++) {
                    const spore = new Bubble(false);
                    spore.radius = 15;
                    spore.x = b.x + (Math.random() - 0.5) * 100;
                    spore.y = b.y + (Math.random() - 0.5) * 100;
                    spore.speed = Math.random() * 2 + 1;
                    spore.type = 'normal';
                    spore.color = '#ffb6c1';
               bubbles.push(spore);
                }
           } else if (b.type === 'burst-bubble') {
              playPopSound(true, false);
              const burstBonus = 150;
              poppedSpecial = true;
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
                target.popped = true; // Mark for removal
            });
        } else if (b.type === 'rainbow-spiral') {
            playPopSound(true, false);
              const spiralBonus = 200;
              poppedSpecial = true;
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
              poppedSpecial = true;
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
            }
            
            // Every bubble (except bombs and stinky ones) gives a base score multiplied by the combo multiplier!
            if (b.type !== 'stinky' && b.type !== 'bomb' && !poppedSpecial) {
                const basePoints = b.type === 'giant' ? 50 : 10;
                const totalPoints = basePoints * multiplier;
                score += totalPoints;
                floatingTexts.push(new FloatingText(b.x, b.y, `+${totalPoints}`, b.color));
            }
            
            b.popped = true;
            totalPops++;
            localStorage.setItem('bubblePopTotalPops', totalPops);
            updateQuest();
            didPop = true;
        }
    }
    if (didPop) {
        if (Math.random() < (currentAccessory === 'Cosmic Cape' ? 0.06 : 0.03)) triggerFrenzy();
        if (Math.random() < 0.01) triggerParty();
        if (Math.random() < 0.005) triggerGoldenRain();
        if (Math.random() < 0.008) triggerVortex();
        if (Math.random() < 0.004) triggerCupcakeRain();
        if (Math.random() < 0.003) triggerDiscoParty();
        if (Math.random() < 0.004) triggerSlowMo();
        if (Math.random() < 0.005) triggerWindGust();
        if (Math.random() < 0.002) triggerRainbowCascade();
        if (Math.random() < 0.003) triggerRainbowBridge();
        if (Math.random() < 0.002) triggerGiggleStorm();
        if (Math.random() < 0.001) triggerCelestialSparkle();
        if (Math.random() < 0.002) triggerGravityFlip();
        if (Math.random() < 0.002) triggerGlitterStorm();
        if (Math.random() < 0.003) triggerRibbon();
        if (Math.random() < 0.002) triggerCosmicBloom();
        if (Math.random() < 0.001) triggerGlitterGala();
        if (Math.random() < 0.002) triggerStarfall();
        updateCombo();
    }

    const currentMilestone = Math.floor(score / 500);
    const nextBossMilestone = BOSS_MILESTONES.find(m => score >= m.score && lastBossCheckpoint < m.score);
    if (nextBossMilestone && !bossActive) {
        triggerBossFight();
        lastBossCheckpoint = nextBossMilestone.score;
    }
    
    updateScore();
    level = Math.floor(score / 200) + 1;

    if (!isAutoPop && petDist < pet.size) {
        if (pet.energy >= pet.maxEnergy) {
            pet.triggerSuperPop();
        } else {
            // Petting rewards
            pet.mood = 'Love';
            pet.gainEnergy(5);
            // Reward for petting! ✨
            score += 10;
            updateScore();
            for (let j = 0; j < 5; j++) {
                particles.push(new Particle(pet.x, pet.y, '#ff4081'));
            }
            // Feature: Love Burst! ❤️✨
            if (pet.friendshipLevel >= 3 && Math.random() < 0.3) {
                floatingTexts.push(new FloatingText(pet.x, pet.y, 'LOVE BURST! ❤️✨', '#ff4081'));
                for (let i = 0; i < 10; i++) {
                    const hb = new Bubble(false);
                    hb.type = 'heart';
                    hb.x = pet.x + (Math.random() - 0.5) * 100;
                    hb.y = pet.y + (Math.random() - 0.5) * 100;
                    hb.vx = (Math.random() - 0.5) * 10;
                    hb.vy = (Math.random() - 0.5) * 10 - 5;
                    bubbles.push(hb);
                }
                playSound(880, 'sine', 0.2);
            }
            // NEW: Pet-specific Accessory Bonus for petting!
            if (currentAccessory === 'Heart Glasses') {
                const heartBonus = 20 * (1 + (pet.friendshipLevel * 0.1));
                score += heartBonus;
                updateScore();
                floatingTexts.push(new FloatingText(pet.x, pet.y, `HEART BONUS! +${Math.floor(heartBonus)} ❤️`, '#ff4081'));
            }
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

class Shockwave {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = 150;
        this.alpha = 1;
        this.done = false;
    }
    update() {
        this.radius += 10;
        this.alpha -= 0.03;
        if (this.alpha <= 0 || this.radius >= this.maxRadius) {
            this.done = true;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.closePath();
    }
}

function triggerShockwave(x, y, color = '#00ffff') {
    shockwaves.push(new Shockwave(x, y, color));
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(x - b.x, y - b.y) < 150) {
            createPopEffect(b.x, b.y, b.color);
            playPopSound(b.type === 'gold', b.type === 'stinky', b.color);
                b.popped = true;
                score += 10; // Small bonus for shockwave pop
        }
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

class Singularity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 150;
        this.life = 120;
        this.done = false;
    }
    update() {
        this.life--;
        this.radius += 1.25;
        if (this.life <= 0) {
            this.done = true;
            this.explode();
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 0, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();
    }
    explode() {
        bubbles.forEach(b => {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < this.maxRadius) {
                    createPopEffect(b.x, b.y, b.color);
                    score += 10;
                    b.popped = true;
                    updateScore();
            }
        });
        createBigExplosion(this.x, this.y);
        playSound(100, 'sine', 0.5, 0.4);
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

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!isPaused) {
        pet.update(lastMouseX, lastMouseY);
    }
    pet.draw();
    
    if (isGlitterGala) {
        glitterGalaTimer--;
        if (glitterGalaTimer <= 0) {
            isGlitterGala = false;
            document.getElementById('glitter-gala-alert').style.display = 'none';
        }
        // During Glitter Gala, spawn tiny diamond sparkles everywhere!
        if (Math.random() < 0.3) {
            const sparkle = new Particle(Math.random() * canvasWidth, Math.random() * canvasHeight, 'white');
            sparkle.vx *= 0.2;
            sparkle.vy *= 0.2;
            particles.push(sparkle);
        }
    }

    clouds.forEach(c => {
        c.update();
        c.draw();
    });

    if (bossActive && boss) {
        boss.update();
        boss.draw();
    }

    petClones.forEach(clone => {
        clone.update(lastMouseX, lastMouseY);
        clone.draw();
        if (Math.random() < 0.02) clone.tryAutoPop();
    });

    for (let i = singularities.length - 1; i >= 0; i--) {
        const s = singularities[i];
        s.update();
        s.draw();
        bubbles.forEach(b => {
            const dx = s.x - b.x;
            const dy = s.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < s.maxRadius * 2) {
                b.vx += dx / dist * 0.5;
                b.vy += dy / dist * 0.5;
            }
        });
        if (s.done) singularities.splice(i, 1);
    }

 
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
        if (bubbles[i].y < -bubbles[i].radius || bubbles[i].y > canvasHeight + bubbles[i].radius || bubbles[i].popped) {
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

    for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].update();
        shockwaves[i].draw();
        if (shockwaves[i].done) shockwaves.splice(i, 1);
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
        if (!isPaused) {
            timeLeft--;
            if (timerEl) timerEl.innerText = timeLeft;
        }
        if (timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

function gameOver() {
    gameActive = false;
    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);
    
    if (!document.getElementById('zen-mode').checked && score > highscore) {
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
    singularities = [];
    shockwaves = [];
    magicFlowers = [];
    bossActive = false;
    boss = null;
    bossHealth = 100;
    bossMaxHealth = 100;
    gameSpeed = 1;
    magicDustPopsRemaining = 0;
    lastBossCheckpoint = 0;
    lastBossFightMilestone = 0;
    shieldActive = false;
    gameActive = true;
    level = 1;
    // currentQuest is now persistent, no longer reset on game start
    updateQuest();
    overlay.style.display = 'none';
    comboText.style.opacity = '0';

    clouds = [];
    for (let i = 0; i < 6; i++) {
        clouds.push(new Cloud());
    }

    clearInterval(timerInterval);
    clearTimeout(spawnTimeout);

    if (!document.getElementById('zen-mode').checked) {
        startTimer();
    } else {
        timerEl.style.visibility = 'hidden';
    }
    spawnBubble();
}

function checkDailyReward() {
    const lastClaim = localStorage.getItem('bubblePopLastClaim');
    const now = new Date().toDateString();
    
    if (lastClaim !== now) {
        const rewardIdx = Math.min(parseInt(localStorage.getItem('bubblePopDailyStreak')) || 0, DAILY_REWARDS.length - 1);
        const reward = DAILY_REWARDS[rewardIdx];
        
        const overlay = document.getElementById('daily-reward-overlay');
        const textEl = document.getElementById('daily-reward-text');
        const amountEl = document.getElementById('daily-reward-amount');
        const btn = document.getElementById('claim-reward-btn');
        
        textEl.innerText = reward.rewardText;
        amountEl.innerText = `✨ ${reward.rewardGold} Gold`;
        
        btn.onclick = () => {
            updateTotalGold(reward.rewardGold);
            localStorage.setItem('bubblePopLastClaim', now);
            const streak = parseInt(localStorage.getItem('bubblePopDailyStreak')) || 0;
            localStorage.setItem('bubblePopDailyStreak', streak + 1);
            overlay.style.display = 'none';
            playSound(880, 'sine', 0.2);
        };
        
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.flexDirection = 'column';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(255, 255, 255, 0.95)';
        overlay.style.zIndex = '100';
    }
}

window.addEventListener('load', checkDailyReward);

window.addEventListener('mousedown', handlePop);
window.addEventListener('touchstart', (e) => {
    if (isPaused) return;
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
            isPaused = false;
            resetGame();
        }
    }, 1000);
});

requestAnimationFrame(update);

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    if (btn) btn.innerText = isPaused ? 'Resume ▶️' : 'Pause ⏸️';
    playSound(isPaused ? 330 : 440, 'sine', 0.2);
}
