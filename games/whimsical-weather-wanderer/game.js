const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let lives = 3;
let gameActive = false;
let items = [];
let particles = [];
let player = {
    x: 400,
    y: 500,
    width: 50,
    height: 50,
    speed: 7,
    color: '#fff'
};

const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

class WeatherItem {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2 + Math.random() * 3;
        
        const types = ['sun', 'cloud', 'rain', 'storm'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        this.setProperties();
    }

    setProperties() {
        switch(this.type) {
            case 'sun':
                this.color = '#ffd700';
                this.points = 10;
                this.isBad = false;
                this.emoji = '☀️';
                break;
            case 'cloud':
                this.color = '#ffffff';
                this.points = 5;
                this.isBad = false;
                this.emoji = '☁️';
                break;
            case 'rain':
                this.color = '#87ceeb';
                this.points = -5;
                this.isBad = true;
                this.emoji = '🌧️';
                break;
            case 'storm':
                this.color = '#708090';
                this.points = -20;
                this.isBad = true;
                this.emoji = '⚡';
                break;
        }
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x + this.width/2, this.y + this.height/2);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
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

function spawnItem() {
    if (Math.random() < 0.03) {
        items.push(new WeatherItem());
    }
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
}

function checkCollisions() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y
        ) {
            if (item.isBad) {
                lives--;
                createExplosion(item.x + item.width/2, item.y + item.height/2, '#ff0000');
            } else {
                score += item.points;
                createExplosion(item.x + item.width/2, item.y + item.height/2, item.color);
            }
            items.splice(i, 1);
            updateUI();
        } else if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateUI() {
    scoreElement.innerText = `Score: ${score}`;
    livesElement.innerText = `Lives: ${'❤️'.repeat(lives)}`;
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updatePlayer();
    spawnItem();
    
    items.forEach((item, index) => {
        item.update();
        item.draw();
    });

    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) particles.splice(index, 1);
        particle.draw();
    });

    checkCollisions();
    
    if (lives <= 0) {
        endGame();
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    items = [];
    particles = [];
    gameActive = true;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);
    updateUI();
    gameLoop();
}

function endGame() {
    gameActive = false;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlayTitle.innerText = 'Game Over! 🌪️';
    overlayText.innerText = `You wandered through the weather and scored ${score} points!`;
    startButton.innerText = 'Try Again! ✨';
}

startButton.addEventListener('click', startGame);
