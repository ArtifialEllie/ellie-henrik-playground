const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const sporesEl = document.getElementById('spores');
const timerEl = document.getElementById('timer');
const comboText = document.getElementById('combo-text');
const comboBar = document.getElementById('combo-bar');
const overlay = document.getElementById('overlay');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const highscoreText = document.getElementById('highscore-text');
const shopOverlay = document.getElementById('shop-overlay');
const shopGrid = document.getElementById('shop-grid');

let score = 0;
let spores = parseInt(localStorage.getItem('mushroomSpores')) || 0;
let timeLeft = 60;
let highscore = localStorage.getItem('mushroomHighscore') || 0;
let gameActive = false;
let canvasWidth, canvasHeight;
let timerInterval;
let combo = 0;
let comboTimer;
let currentSkin = localStorage.getItem('mushroomSkin') || '#ff80ab';

sporesEl.innerText = spores;

const skins = [
    { color: '#ff80ab', name: 'Strawberry', cost: 0 },
    { color: '#81d4fa', name: 'Sky Blue', cost: 50 },
    { color: '#ce93d8', name: 'Lavender', cost: 100 },
    { color: '#a5d6a7', name: 'Minty', cost: 150 },
    { color: '#fff59d', name: 'Lemon', cost: 200 },
    { color: '#ffccbc', name: 'Peach', cost: 250 },
    { color: 'rainbow', name: 'Cosmic', cost: 500 },
];

function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}
window.addEventListener('resize', resize);
resize();

class Mushroom {
    constructor() {
        this.radius = Math.random() * 20 + 20;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvasHeight - this.radius * 2) + this.radius;
        this.growth = 0;
        this.maxGrowth = 1;
        this.growthSpeed = Math.random() * 0.01 + 0.005;
        this.life = 1.0;
        this.decay = Math.random() * 0.005 + 0.002;
        this.color = currentSkin === 'rainbow' ? `hsl(${Math.random() * 360}, 70%, 70%)` : currentSkin;
        this.type = Math.random() > 0.9 ? 'golden' : 'normal';
        if (this.type === 'golden') this.color = '#ffd700';
    }

    update() {
        if (this.growth < this.maxGrowth) {
            this.growth += this.growthSpeed;
        }
        this.life -= this.decay;
    }

    draw() {
        const currentRadius = this.radius * this.growth;
        if (currentRadius < 1) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Stem
        ctx.fillStyle = '#fffafa';
        ctx.beginPath();
        ctx.rect(-currentRadius * 0.3, 0, currentRadius * 0.6, currentRadius * 0.8);
        ctx.fill();

        // Cap
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, Math.PI, 0);
        ctx.fill();
        
        // Dots on cap
        ctx.fillStyle = 'white';
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.arc(-currentRadius * 0.5 + (i * currentRadius * 0.4), -currentRadius * 0.3, currentRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
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

let mushrooms = [];
let particles = [];
let floatingTexts = [];

function spawnMushroom() {
    if (!gameActive) return;
    mushrooms.push(new Mushroom());
    setTimeout(spawnMushroom, Math.max(400, 1000 - (score * 5)));
}

function handleInput(e) {
    if (!gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    for (let i = mushrooms.length - 1; i >= 0; i--) {
        const m = mushrooms[i];
        const dist = Math.hypot(mouseX - m.x, mouseY - (m.y - m.radius * m.growth));
        
        if (dist < m.radius * m.growth + 10) {
            popMushroom(i);
            break;
        }
    }
}

function popMushroom(index) {
    const m = mushrooms[index];
    
    // Visuals
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(m.x, m.y, m.color));
    }
    floatingTexts.push(new FloatingText(m.x, m.y, `+${combo + 1}`, m.color));
    
    // Logic
    combo++;
    if (m.type === 'golden') {
        const bonus = 10 + (combo * 2);
        score += bonus;
        spores += bonus;
        floatingTexts.push(new FloatingText(m.x, m.y - 20, `GOLDEN! ✨ +${bonus}`, '#ffd700'));
    } else {
        score += 1;
        spores += 1;
    }
    
    localStorage.setItem('mushroomSpores', spores);
    sporesEl.innerText = spores;
    scoreEl.innerText = score;
    
    updateCombo();
    mushrooms.splice(index, 1);
}

function updateCombo() {
    comboText.innerText = `Combo x${combo}`;
    comboText.style.opacity = '1';
    comboBar.style.width = '100%';
    
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        comboText.style.opacity = '0';
        comboBar.style.width = '0%';
    }, 1500);
}

function gameLoop() {
    if (!gameActive) {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background decoration (simple grass patches)
    ctx.fillStyle = '#c8e6c9';
    for(let i=0; i<10; i++) {
        ctx.beginPath();
        ctx.arc(i * 150, (i % 2) * 200 + 100, 50, 0, Math.PI * 2);
        ctx.fill();
    }

    mushrooms.forEach((m, i) => {
        m.update();
        m.draw();
        if (m.life <= 0) {
            mushrooms.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    floatingTexts.forEach((ft, i) => {
        ft.update();
        ft.draw();
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    });

    requestAnimationFrame(gameLoop);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) gameOver();
    }, 1000);
}

function gameOver() {
    gameActive = false;
    clearInterval(timerInterval);
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('mushroomHighscore', highscore);
    }
    
    finalScoreEl.innerText = `Du samlet ${score} magiske sopper!`;
    highscoreText.innerText = `Rekord: ${highscore}`;
    gameOverScreen.style.display = 'flex';
}

function resetGame() {
    score = 0;
    timeLeft = 60;
    combo = 0;
    mushrooms = [];
    particles = [];
    floatingTexts = [];
    gameActive = true;
    overlay.style.display = 'none';
    gameOverScreen.style.display = 'none';
    scoreEl.innerText = '0';
    timerEl.innerText = '60';
    
    startTimer();
    spawnMushroom();
}

// Shop Logic
function openShop() {
    shopOverlay.style.display = 'flex';
    renderShop();
}

function renderShop() {
    shopGrid.innerHTML = '';
    skins.forEach(skin => {
        const isOwned = localStorage.getItem(`mushroomSkin_${skin.color}`) === 'true' || skin.cost === 0;
        const isSelected = currentSkin === skin.color;
        
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
                localStorage.setItem('mushroomSkin', currentSkin);
                renderShop();
            } else if (spores >= skin.cost) {
                spores -= skin.cost;
                localStorage.setItem('mushroomSpores', spores);
                sporesEl.innerText = spores;
                localStorage.setItem(`mushroomSkin_${skin.color}`, 'true');
                currentSkin = skin.color;
                localStorage.setItem('mushroomSkin', currentSkin);
                renderShop();
            }
        };
        shopGrid.appendChild(item);
    });
}

function closeShop() {
    shopOverlay.style.display = 'none';
}

window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', handleInput, { passive: false });

document.getElementById('start-btn').addEventListener('click', resetGame);
document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('shop-btn').addEventListener('click', openShop);
document.getElementById('close-shop').addEventListener('click', closeShop);

gameLoop();
