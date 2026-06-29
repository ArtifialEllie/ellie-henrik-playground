const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const rescuedElement = document.getElementById('rescued');
const levelElement = document.getElementById('level');
const highscoreElement = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const comboElement = document.getElementById('combo');
const comboContainer = document.getElementById('combo-container');
const startBtn = document.getElementById('start-btn');

canvas.width = 800;
canvas.height = 600;

let gameActive = false;
let isPaused = false;
let score = 0;
let highscore = parseInt(localStorage.getItem('rainbowReefHighscore')) || 0;
let difficultyMultiplier = 1;
let currentLevel = 1;
let playerStatus = { shield: 0, turbo: 0, invisibility: 0, magnet: 0 };
let frenzyTimer = 0; // Frenzy mode grants invincibility and speed
let combo = 0;
let comboTimer = 0;
let eventTimer = 0;
let currentEvent = 'NONE';
let tideX = 0;
let tideY = 0;
let lastBossTriggerCount = 0;
let bossActive = false;
let boss = null;

const ellieFeedback = {
    rescue: [
        "Yay! A friend is safe! 🐠",
        "You're a reef hero! ✨",
        "Keep saving them! 🌊",
        "So sweet! 💖",
        "Another one rescued! 🌟"
    ],
    levelUp: [
        "Level Up! You're getting better! 🚀",
        "Wow, look at you go! 🌈",
        "More friends to save! 🐠",
        "Super swimmer! ⚡"
    ]
};

let shakeAmount = 0;
function triggerShake(amount) {
    shakeAmount = amount;
}

// Audio setup
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
highscoreElement.innerText = `Best: ${highscore}`;
function playSound(freq, type, duration, volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

let rescuedCount = 0;
let player = {
    x: 400,
    y: 300,
    radius: 20,
    speed: 6,
    baseSpeed: 6,
    color: '#ffeb3b',
    targetX: 400,
    targetY: 300,
    angle: 0
};

let friends = [];
let enemies = [];
let pearls = [];
let bubbles = [];
let powerups = [];
let particles = [];
let plankton = [];
let seaweeds = [];
let companion = null;

const COLORS = ['#FF69B4', '#00FF7F', '#00BFFF', '#FFD700', '#FF4500', '#DA70D6'];

class Fish {
    constructor(isEnemy = false) {
        this.isEnemy = isEnemy;
        this.behavior = isEnemy ? (Math.random() > 0.7 ? 'patrol' : 'track') : 'wander';
        if (isEnemy && Math.random() > 0.8) this.behavior = 'fast';
        this.radius = isEnemy ? 15 : 12;
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { this.x = -this.radius; this.y = Math.random() * canvas.height; }
        else if (side === 1) { this.x = canvas.width + this.radius; this.y = Math.random() * canvas.height; }
        else if (side === 2) { this.x = Math.random() * canvas.width; this.y = -this.radius; }
        else { this.x = Math.random() * canvas.width; this.y = canvas.height + this.radius; }

        this.speed = this.isEnemy ? (2 + Math.random() * 2) : (1 + Math.random() * 1.5);
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.color = this.isEnemy ? '#4B0082' : COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
    if (this.isEnemy) {
        if (this.behavior === 'fast') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * (this.speed * 1.8 * difficultyMultiplier);
            this.y += Math.sin(angle) * (this.speed * 1.8 * difficultyMultiplier);
        } else if (this.behavior === 'track') {
            // Enemies track player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed * difficultyMultiplier;
            this.y += Math.sin(angle) * this.speed * difficultyMultiplier;
        } else {
            // Patrol behavior: move in a wavy pattern
            this.angle += 0.02 * difficultyMultiplier;
            this.x += Math.cos(this.angle) * this.speed * difficultyMultiplier;
            this.y += Math.sin(this.angle * 0.5) * this.speed * difficultyMultiplier;
        }
    } else {
            // Friends wander
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            if (Math.random() < 0.01) {
                this.angle += (Math.random() - 0.5) * 0.5;
            }
        }


        // Wrap around or reset
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const direction = this.isEnemy ? 
            Math.atan2(player.y - this.y, player.x - this.x) : 
            this.angle;
            
        ctx.rotate(direction);

        // Body
        ctx.fillStyle = this.color;
        if (this.behavior === 'fast') ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-this.radius * 1.2, 0);
        ctx.lineTo(-this.radius * 2, -this.radius);
        ctx.lineTo(-this.radius * 2, this.radius);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, -this.radius * 0.3, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Pearl {
    constructor() {
        this.radius = 6;
        this.x = Math.random() * (canvas.width - 20) + 10;
        this.y = Math.random() * (canvas.height - 20) + 10;
        this.isGolden = Math.random() < 0.1;
        this.pulse = 0;
        this.life = 600;
    }

    update() {
        this.pulse += 0.1;
        this.life--;
    }

    draw() {
        const glow = 5 + Math.sin(this.pulse) * 3;
        ctx.save();
        ctx.shadowBlur = glow;
        ctx.shadowColor = this.isGolden ? 'yellow' : 'white';
        ctx.fillStyle = '#fdfdfd';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Bubble {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.radius = 2 + Math.random() * 5;
        this.speed = 1 + Math.random() * 2;
        this.drift = (Math.random() - 0.5) * 1;
    }
 
    update() {
        this.y -= this.speed;
        this.x += this.drift;
        if (this.y < -10) {
            this.y = canvas.height + 10;
            this.x = Math.random() * canvas.width;
        }
    }
 
    draw() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
 
class Plankton {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.y -= this.speed;
        if (this.y < -10) this.reset();
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Companion {
    constructor() {
        this.radius = 8;
        this.x = player.x;
        this.y = player.y;
        this.color = '#ff69b4';
        this.angle = 0;
        this.speed = 0.1; // Following speed
        this.helpTimer = 0;
    }

    update() {
        // Follow player with some lag
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        this.angle = Math.atan2(dy, dx);

        this.helpTimer++;
        if (this.helpTimer > 300) { // Every ~5 seconds
            this.triggerHelp();
            this.helpTimer = 0;
        }
    }

    triggerHelp() {
        // Help: Attract nearest pearl
        if (pearls.length > 0) {
            const nearest = pearls[0];
            nearest.x = this.x;
            nearest.y = this.y;
            showFloatingText("Companion Help! ✨", this.x, this.y - 20);
            playSound(880, 'sine', 0.1);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function showFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.getElementById('game-container').appendChild(el);
    setTimeout(() => el.remove(), 800);
}

class PowerUp {
    constructor() {
        const types = ['SHIELD', 'TURBO', 'INVISIBILITY', 'MAGNET'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        const emojiMap = { 
            'SHIELD': '🛡️', 
            'TURBO': '⚡', 
            'INVISIBILITY': '👻', 
            'MAGNET': '🧲' 
        };
        this.emoji = emojiMap[this.type];
        this.radius = 15;
        this.x = Math.random() * (canvas.width - 40) + 20;
        this.y = Math.random() * (canvas.height - 40) + 20;
        this.life = 600; // disappear after some time
        this.pulse = 0;
    }
 
    update() {
        this.life--;
        this.pulse += 0.1;
    }
 
    draw() {
        ctx.save();
        const scale = 1 + Math.sin(this.pulse) * 0.2;
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

class Seaweed {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.height = 50 + Math.random() * 100;
        this.offset = Math.random() * Math.PI * 2;
        this.width = 10 + Math.random() * 10;
        this.color = `hsl(${120 + Math.random() * 40}, 70%, ${30 + Math.random() * 20}%)`;
    }

    draw(time) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, canvas.height);
        
        const sway = Math.sin(time * 0.002 + this.offset) * 20;
        ctx.bezierCurveTo(
            this.x + sway / 2, canvas.height - this.height / 2,
            this.x - sway / 2, canvas.height - this.height / 2,
            this.x + sway, canvas.height - this.height
        );
        ctx.stroke();
    }
}

function spawnEntities(isInitial = false) {
    friends = [];
    enemies = [];
    pearls = [];
    bubbles = [];
    particles = [];
    seaweeds = [];
    
    for (let i = 0; i < 6; i++) friends.push(new Fish(false));
    for (let i = 0; i < 3 + Math.floor((score / 50) * 2); i++) enemies.push(new Fish(true));
    for (let i = 0; i < 15; i++) bubbles.push(new Bubble());
    for (let i = 0; i < 10; i++) seaweeds.push(new Seaweed());
    for (let i = 0; i < 50; i++) plankton.push(new Plankton());
}

function handleInput() {
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        player.targetX = e.clientX - rect.left;
        player.targetY = e.clientY - rect.top;
    });
}

function updatePlayer() {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
        const moveDist = Math.min(dist, player.speed);
        player.x += (dx / dist) * moveDist;
        player.y += (dy / dist) * moveDist;
    }
    
    // Apply current tide effect
    player.x += tideX;
    player.y += tideY;
}

function checkCollisions() {
    // Check magnet effect
    if (playerStatus.magnet > 0) {
        pearls.forEach(pearl => {
            const dx = player.x - pearl.x;
            const dy = player.y - pearl.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 150) {
                pearl.x += (dx / dist) * 3;
                pearl.y += (dy / dist) * 3;
            }
        });
    }

    // Check friend rescue
    friends.forEach((friend, index) => {
        const dist = Math.hypot(player.x - friend.x, player.y - friend.y);
        if (dist < player.radius + friend.radius) {
            rescuedCount++;
            rescuedElement.innerText = `Friends Rescued: ${rescuedCount}`;

            const feedback = ellieFeedback.rescue[Math.floor(Math.random() * ellieFeedback.rescue.length)];
            showFloatingText(feedback, friend.x, friend.y - 40);

            // Level Up Logic
            if (rescuedCount > 0 && rescuedCount % 5 === 0) {
                currentLevel++;
                difficultyMultiplier += 0.2;
                levelElement.innerText = `Level: ${currentLevel}`;
                const luFeedback = ellieFeedback.levelUp[Math.floor(Math.random() * ellieFeedback.levelUp.length)];
                showFloatingText(`${luFeedback} (Lvl ${currentLevel})`, player.x, player.y - 60);
                playSound(880, 'sine', 0.3);
                createParticles(player.x, player.y, 'gold', 20);
            }

            // Add sparkle particles
            for(let i=0; i<10; i++) {
                particles.push(new Particle(friend.x, friend.y, friend.color));
            }
            
            playSound(523.25, 'sine', 0.2);
            
            // Combo logic
            combo++;
            comboTimer = 120; // 2 seconds approx
            if (combo > 1) {
                comboContainer.style.display = 'block';
                comboElement.innerText = `Combo: x${combo}`;
                showFloatingText(`x${combo}!`, player.x, player.y - 20);
                playSound(600 + combo * 20, 'sine', 0.1);
            }

            // Trigger Frenzy Mode every 10 rescues
            if (rescuedCount > 0 && rescuedCount % 10 === 0) {
                combo += 5;
                frenzyTimer = 300; // 5 seconds approx
                playSound(880, 'sine', 0.5); 
                createParticles(player.x, player.y, 'gold', 30);
                showFloatingText("FRENZY MODE! 🌟⚡", player.x, player.y);
            }

            friend.reset();
            // Add a pearl as a reward
            if (Math.random() < 0.3) {
            pearls.push(new Pearl());
            }
        }
    });

    // Check boss collision
    if (bossActive && boss) {
        const bossDist = Math.hypot(player.x - boss.x, player.y - boss.y);
        if (bossDist < boss.radius + player.radius) {
            damageBoss(10);
            showFloatingText("-10", boss.x, boss.y);
            playSound(200, 'sine', 0.2);
        }
    }

    // Check enemy collision
    enemies.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.radius + enemy.radius) {
                if (frenzyTimer > 0) {
                    enemy.reset();
                    createParticles(enemy.x, enemy.y, 'white', 10);
                    playSound(600, 'sine', 0.1);
                } else if (playerStatus.invisibility > 0) {
                    // Do nothing, player is invisible
                } else if (playerStatus.shield > 0) {
                playerStatus.shield = 0; // Use up shield
                createParticles(enemy.x, enemy.y, 'white', 15);
                playSound(300, 'sine', 0.2);
                enemy.reset();
            } else {
                gameOver();
            }
            if (frenzyTimer <= 0 && playerStatus.shield <= 0 && playerStatus.invisibility <= 0) triggerShake(5);
        }
    });

    // Check pearl collection
    for (let i = pearls.length - 1; i >= 0; i--) {
        const pearl = pearls[i];
        const dist = Math.hypot(player.x - pearl.x, player.y - pearl.y);
        if (dist < player.radius + pearl.radius) {
            if (pearl.isGolden) {
                score += 50;
                showFloatingText("+50 GOLDEN PEARL! ✨", pearl.x, pearl.y - 20);
                playSound(1046, 'sine', 0.3);
                createParticles(pearl.x, pearl.y, 'yellow', 20);
                playerStatus.turbo = 300;
            } else {
                const pearlValue = 10 * (combo > 0 ? combo : 1);
                score += pearlValue;
            }
            scoreElement.innerText = `Pearls: ${score}`;
            createParticles(pearl.x, pearl.y, 'white', 10);
            playSound(880, 'sine', 0.1);
            pearls.splice(i, 1);
        }
    }
 
    // Check powerup collection
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        const dist = Math.hypot(player.x - pu.x, player.y - pu.y);
        if (dist < player.radius + pu.radius) {
            if (pu.type === 'SHIELD') {
                playerStatus.shield = 300; // 5 seconds approx
                playSound(600, 'sine', 0.2);
            } else if (pu.type === 'TURBO') {
                playerStatus.turbo = 300;
                playSound(800, 'sine', 0.2);
            } else if (pu.type === 'INVISIBILITY') {
                playerStatus.invisibility = 300;
                playSound(700, 'sine', 0.2);
            } else if (pu.type === 'MAGNET') {
                playerStatus.magnet = 300;
                playSound(650, 'sine', 0.2);
            }
            createParticles(pu.x, pu.y, 'yellow', 10);
            powerups.splice(i, 1);
        }
    }
}

function gameOver() {
    gameActive = false;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('rainbowReefHighscore', highscore);
        highscoreElement.innerText = `Best: ${highscore}`;
    }
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').innerText = 'Oops! A Grumpy Urchin Got You!';
    playSound(150, 'sawtooth', 0.5, 0.2);
    document.getElementById('message').innerText = `You rescued ${rescuedCount} friends and collected ${score} pearls!`;
    startBtn.innerText = 'Try Again! 🐠';
}

function start() {
    gameActive = true;
    score = 0;
    currentLevel = 1;
    difficultyMultiplier = 1;
    levelElement.innerText = `Level: 1`;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    rescuedCount = 0;
    combo = 0;
    scoreElement.innerText = `Pearls: 0`;
    rescuedElement.innerText = `Friends Rescued: 0`;
    playerStatus.shield = 0;
    playerStatus.turbo = 0;
    playerStatus.invisibility = 0;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    companion = new Companion();
    spawnEntities(true);
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive || isPaused) return;
    if (frenzyTimer > 0) frenzyTimer--;

    // Event System
    if (eventTimer > 0) {
        eventTimer--;
    } else if (rescuedCount > 0 && rescuedCount % 20 === 0 && rescuedCount !== lastBossTriggerCount && !bossActive) {
        triggerBossFight();
        lastBossTriggerCount = rescuedCount;
        eventTimer = 1; // Prevent immediate re-trigger
        return;
    } else if (Math.random() < 0.001) { // Rare event trigger
        
        const events = ['PEARL_STORM', 'STRONG_TIDE'];
        currentEvent = events[Math.floor(Math.random() * events.length)];
        eventTimer = 300; // ~5 seconds
        
        if (currentEvent === 'STRONG_TIDE') {
            tideX = (Math.random() - 0.5) * 4;
            tideY = (Math.random() - 0.5) * 4;
            showFloatingText("STRONG TIDE! 🌊", canvas.width/2, canvas.height/2);
        } else if (currentEvent === 'PEARL_STORM') {
            showFloatingText("PEARL STORM! 🌟✨", canvas.width/2, canvas.height/2, 'gold');
        }
        playSound(440, 'sine', 0.3);
    }

    if (eventTimer <= 0) {
        currentEvent = 'NONE';
        tideX = 0;
        tideY = 0;
    }

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
        comboContainer.style.display = 'none';
    }

    // Update Powerup HUD
    const hud = document.getElementById('powerup-hud');
    hud.innerHTML = '';
    const activePowerups = [
        { id: 'SHIELD', emoji: '🛡️', active: playerStatus.shield > 0 },
        { id: 'TURBO', emoji: '⚡', active: playerStatus.turbo > 0 },
        { id: 'INVISIBILITY', emoji: '👻', active: playerStatus.invisibility > 0 },
        { id: 'MAGNET', emoji: '🧲', active: playerStatus.magnet > 0 },
    ];
    activePowerups.forEach(pu => {
        const div = document.createElement('div');
        div.className = `powerup-icon ${pu.active ? 'active' : ''}`;
        div.innerText = pu.emoji;
        hud.appendChild(div);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now();

    // Draw background seaweeds
    seaweeds.forEach(seaweed => {
        seaweed.draw(time);
    });

    // Draw background bubbles
    bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw();
    });

    plankton.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw pearls
    pearls = pearls.filter(p => p.life > 0);
    pearls.forEach(pearl => {
        pearl.update();
        pearl.draw();
    });

    if (companion) {
        companion.update();
        companion.draw();
    }

    // Draw power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();
        powerups[i].draw();
        if (powerups[i].life <= 0) powerups.splice(i, 1);
    }

    // Pearl Storm Effect
    if (currentEvent === 'PEARL_STORM' && Math.random() < 0.1) {
        pearls.push(new Pearl());
    }

    // Spawn power-ups occasionally
    if (Math.random() < 0.002) {
        powerups.push(new PowerUp());
    }
 
    // Draw particles
    // Particles handled below

    // Draw friends
    friends.forEach(friend => {
        friend.update();
        friend.draw();
    });

    if (bossActive && boss) {
        boss.update();
        boss.draw();
    }

    // Draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
        // Add spikes to urchins
        ctx.save();
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + Math.cos(ang) * 20, enemy.y + Math.sin(ang) * 20);
            ctx.stroke();
        }
        ctx.restore();
    });

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw player
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate(Math.random() * shakeAmount - shakeAmount / 2, Math.random() * shakeAmount - shakeAmount / 2);
        shakeAmount *= 0.9;
        if (shakeAmount < 0.1) shakeAmount = 0;
    }

    ctx.translate(player.x, player.y);
    const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
    ctx.rotate(angle);
    
    // Visual feedback for shield
    if (playerStatus.shield > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Pulse effect
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
    }

    // Visual feedback for invisibility
    if (playerStatus.invisibility > 0) {
        ctx.globalAlpha = 0.5;
    }
    if (frenzyTimer > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'gold';
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
    }
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.radius * 1.5, player.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.radius * 0.8, -player.radius * 0.3, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.radius * 0.8, -player.radius * 0.3, player.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    player.angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
    
    // Apply turbo speed
    let speedMult = playerStatus.turbo > 0 ? 1.8 : 1;
    if (frenzyTimer > 0) speedMult *= 1.5;
    player.speed = player.baseSpeed * speedMult;

    updatePlayer();
    checkCollisions();

    // Update player status timers
    if (playerStatus.shield > 0) playerStatus.shield--;
    if (playerStatus.turbo > 0) playerStatus.turbo--;
    if (playerStatus.magnet > 0) playerStatus.magnet--;
    if (frenzyTimer > 0) playerStatus.magnet = Math.max(playerStatus.magnet, frenzyTimer);
    if (playerStatus.invisibility > 0) playerStatus.invisibility--;
 
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', start);
handleInput();

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    if (btn) btn.innerText = isPaused ? 'Resume ▶️' : 'Pause ⏸️';
    playSound(isPaused ? 330 : 440, 'sine', 0.2);
}
