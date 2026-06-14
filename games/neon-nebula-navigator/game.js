const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const messageDiv = document.getElementById('message');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let lives = 3;
let gameRunning = false;
let particles = [];
let items = [];
let enemies = [];
let player = {
    x: 400,
    y: 500,
    width: 30,
    height: 30,
    speed: 5,
    color: '#00f2ff'
};

const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = (Math.random() - 0.5) * 3;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
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

class SpaceItem {
    constructor(type) {
        this.type = type; // 'stardust' or 'debris'
        this.width = type === 'stardust' ? 15 : 25;
        this.height = this.width;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = Math.random() * 2 + 2 + (score / 100);
        this.color = type === 'stardust' ? '#ffeb3b' : '#ff4444';
        this.glow = type === 'stardust' ? '#fff176' : '#cf6679';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glow;
        ctx.fillStyle = this.color;
        if (this.type === 'stardust') {
            // Draw a star
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * this.width / 2 + this.x + this.width / 2,
                           Math.sin((18 + i * 72) / 180 * Math.PI) * this.width / 2 + this.y + this.height / 2);
                ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * this.width / 4 + this.x + this.width / 2,
                           Math.sin((54 + i * 72) / 180 * Math.PI) * this.width / 4 + this.y + this.height / 2);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw a rocky debris
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

function spawnItem() {
    if (!gameRunning) return;
    const type = Math.random() < 0.7 ? 'stardust' : 'debris';
    items.push(new SpaceItem(type));
    setTimeout(spawnItem, Math.max(300, 1000 - score * 2));
}

function updatePlayer() {
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawPlayer() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    
    // Draw a simple spaceship shape
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function checkCollisions() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            
            if (item.type === 'stardust') {
                score += 10;
                scoreElement.innerText = `Score: ${score}`;
                for (let i = 0; i < 8; i++) particles.push(new Particle(item.x + item.width/2, item.y + item.height/2, '#ffeb3b'));
            } else {
                lives--;
                livesElement.innerText = `Lives: ${'❤️'.repeat(lives)}`;
                for (let i = 0; i < 15; i++) particles.push(new Particle(player.x + player.width/2, player.y + player.height/2, '#ff4444'));
                if (lives <= 0) endGame();
            }
            items.splice(i, 1);
        }
    }
}

function endGame() {
    gameRunning = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    messageDiv.innerHTML = `
        <h1>Game Over!</h1>
        <p>You navigated the nebula and collected ${score} stardust!</p>
        <button id="restart-btn">Try Again ✨</button>
    `;
    document.getElementById('restart-btn').onclick = () => {
        resetGame();
        startGame();
    };
}

function resetGame() {
    score = 0;
    lives = 3;
    scoreElement.innerText = `Score: 0`;
    livesElement.innerText = `Lives: ❤️❤️❤️`;
    player.x = 400;
    player.y = 500;
    items = [];
    particles = [];
}

function startGame() {
    resetGame();
    gameRunning = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    spawnItem();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw some background stars for depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    updatePlayer();
    drawPlayer();

    items.forEach((item, index) => {
        item.update();
        if (item.y > canvas.height) items.splice(index, 1);
        item.draw();
    });

    particles.forEach((p, index) => {
        p.update();
        if (p.life <= 0) particles.splice(index, 1);
        p.draw();
    });

    checkCollisions();

    requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => {
    startGame();
};
