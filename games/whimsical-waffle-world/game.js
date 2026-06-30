const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('time');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');

let score = 0;
let gameActive = false;
let timeLeft = 60;
let gameInterval;
let spawnInterval;

const items = [];
const player = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    emoji: '🍽️'
};

const ITEM_TYPES = [
    { emoji: '🧇', score: 10, type: 'good' },
    { emoji: '🍓', score: 20, type: 'good' },
    { emoji: '🍯', score: 30, type: 'good' },
    { emoji: '🫐', score: 15, type: 'good' },
    { emoji: '🥒', score: -50, type: 'bad' },
];

function resize() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    player.y = canvas.height - 100;
}

window.addEventListener('resize', resize);
resize();

function spawnItem() {
    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    items.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 40,
        emoji: type.emoji,
        score: type.score,
        type: type.type,
        speed: 2 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
    });
}

function update() {
    if (!gameActive) return;

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;
        item.rotation += item.rotSpeed;

        // Collision detection
        if (
            item.x < player.x + player.width &&
            item.x + item.width > player.x &&
            item.y < player.y + player.height &&
            item.y + item.height > player.y
        ) {
            score += item.score;
            scoreElement.innerText = score;
            items.splice(i, 1);
            
            // Little "pop" effect could be added here
            createParticles(item.x + 20, item.y + 20, item.emoji);
        } else if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }

    // Bound player
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x + player.width/2, player.y + player.height/2);

    // Draw items
    ctx.font = '40px Arial';
    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.width/2, item.y + item.height/2);
        ctx.rotate(item.rotation);
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();
    });

    // Draw particles
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(index, 1);
    });
}

const particles = [];
function createParticles(x, y, emoji) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(x, y, emoji));
    }
}

class Particle {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.size = 20;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life -= 0.02;
        this.size *= 0.95;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Mouse/Touch control
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width/2;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    player.x = e.touches[0].clientX - rect.left - player.width/2;
}, { passive: false });

function startGame() {
    score = 0;
    timeLeft = 60;
    items.length = 0;
    particles.length = 0;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    
    overlay.classList.add('hidden');
    gameActive = true;
    
    gameInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
    
    spawnInterval = setInterval(spawnItem, 800);
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    
    finalScoreElement.innerText = score;
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

gameLoop();
