const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const rescuedElement = document.getElementById('rescued');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

canvas.width = 800;
canvas.height = 600;

let gameActive = false;
let score = 0;
let rescuedCount = 0;
let player = {
    x: 400,
    y: 300,
    radius: 20,
    speed: 5,
    color: '#ffeb3b',
    targetX: 400,
    targetY: 300
};

let friends = [];
let enemies = [];
let pearls = [];
let bubbles = [];
let particles = [];
let seaweeds = [];

const COLORS = ['#FF69B4', '#00FF7F', '#00BFFF', '#FFD700', '#FF4500', '#DA70D6'];

class Fish {
    constructor(isEnemy = false) {
        this.isEnemy = isEnemy;
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
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        } else {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            if (Math.random() < 0.01) {
                this.angle += (Math.random() - 0.5) * 0.5;
            }
        }

        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const direction = this.isEnemy ? Math.atan2(player.y - this.y, player.x - this.x) : this.angle;
        ctx.rotate(direction);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-this.radius * 1.2, 0);
        ctx.lineTo(-this.radius * 2, -this.radius);
        ctx.lineTo(-this.radius * 2, this.radius);
        ctx.closePath();
        ctx.fill();
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
        this.pulse = 0;
    }
    update() { this.pulse += 0.1; }
    draw() {
        const glow = 5 + Math.sin(this.pulse) * 3;
        ctx.save();
        ctx.shadowBlur = glow;
        ctx.shadowColor = 'white';
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
        ctx.restore();
    }
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function spawnEntities() {
    friends = [];
    enemies = [];
    pearls = [];
    bubbles = [];
    particles = [];
    seaweeds = [];
    for (let i = 0; i < 6; i++) friends.push(new Fish(false));
    for (let i = 0; i < 3; i++) enemies.push(new Fish(true));
    for (let i = 0; i < 15; i++) bubbles.push(new Bubble());
    for (let i = 0; i < 10; i++) seaweeds.push(new Seaweed());
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
    player.x += dx * 0.1;
    player.y += dy * 0.1;
}

function checkCollisions() {
    friends.forEach(friend => {
        const dx = player.x - friend.x;
        const dy = player.y - friend.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + friend.radius) {
            rescuedCount++;
            rescuedElement.innerText = `Friends Rescued: ${rescuedCount}`;
            createParticles(friend.x, friend.y, friend.color, 15);
            friend.reset();
            pearls.push(new Pearl());
        }
    });

    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + enemy.radius) gameOver();
    });

    pearls.forEach((pearl, index) => {
        const dx = player.x - pearl.x;
        const dy = player.y - pearl.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + pearl.radius) {
            score += 10;
            scoreElement.innerText = `Pearls: ${score}`;
            createParticles(pearl.x, pearl.y, 'white', 10);
            pearls.splice(index, 1);
        }
    });
}

function gameOver() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').innerText = 'Oops! A Grumpy Urchin Got You!';
    document.getElementById('message').innerText = `You rescued ${rescuedCount} friends and collected ${score} pearls!`;
    startBtn.innerText = 'Try Again! 🐠';
}

function start() {
    gameActive = true;
    score = 0;
    rescuedCount = 0;
    scoreElement.innerText = `Pearls: 0`;
    rescuedElement.innerText = `Friends Rescued: 0`;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    spawnEntities();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now();

    seaweeds.forEach(seaweed => seaweed.draw(time));
    bubbles.forEach(bubble => { bubble.update(); bubble.draw(); });
    pearls.forEach(pearl => { pearl.update(); pearl.draw(); });
    
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    friends.forEach(friend => { friend.update(); friend.draw(); });
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
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

    ctx.save();
    ctx.translate(player.x, player.y);
    const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
    ctx.rotate(angle);
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

    updatePlayer();
    checkCollisions();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', start);
handleInput();
