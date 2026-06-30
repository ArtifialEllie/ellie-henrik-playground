const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

let score = 0;
let highScore = localStorage.getItem('neon-nebula-high-score') || 0;
let gameActive = false;
let player;
let stars = [];
let crystals = [];
let obstacles = [];
let animationId;

highScoreElement.innerText = `Best: ${highScore}`;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Player {
    constructor() {
        this.width = 40;
        this.height = 30;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.speed = 0.6;
        this.friction = 0.92;
        this.color = '#00f2ff';
    }

    update(input) {
        if (input.left) this.vx -= this.speed;
        if (input.right) this.vx += this.speed;
        
        this.vx *= this.friction;
        this.x += this.vx;

        if (this.x < this.width / 2) {
            this.x = this.width / 2;
            this.vx = 0;
        }
        if (this.x > canvas.width - this.width / 2) {
            this.x = canvas.width - this.width / 2;
            this.vx = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Ship body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Neon glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();
        
        // Engine flame
        if (Math.abs(this.vx) > 0.1) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(-5, this.height / 2);
            ctx.lineTo(0, this.height / 2 + Math.random() * 10);
            ctx.lineTo(5, this.height / 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 3 + 1;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Crystal {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * (canvas.width - 20);
        this.y = -20;
        this.size = 15;
        this.speed = Math.random() * 2 + 3;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Obstacle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * (canvas.width - 40);
        this.y = -100;
        this.width = 40 + Math.random() * 60;
        this.height = 20 + Math.random() * 30;
        this.speed = Math.random() * 2 + 4;
        this.color = '#ff3366';
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

const input = { left: false, right: false };

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = true;
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = false;
});

// Touch controls for mobile
window.addEventListener('touchstart', e => {
    const touchX = e.touches[0].clientX;
    if (touchX < window.innerWidth / 2) input.left = true;
    else input.right = true;
});

window.addEventListener('touchend', e => {
    input.left = false;
    input.right = false;
});

function spawnCrystals() {
    crystals = [];
    for (let i = 0; i < 5; i++) {
        crystals.push(new Crystal());
    }
}

function spawnObstacles() {
    obstacles = [];
    for (let i = 0; i < 3; i++) {
        obstacles.push(new Obstacle());
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCollisionCircle(circle1, circle2) {
    return Math.hypot(circle1.x - circle2.x, circle1.y - circle2.y) < (circle1.r + circle2.r);
}

function gameOver() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').innerText = 'Nebula Crash! 💥';
    document.getElementById('subtitle').innerText = `You collected ${score} crystals!`;
    startBtn.innerText = 'Try Again! 🚀';
}

function initGame() {
    score = 0;
    scoreElement.innerText = `Crystals: ${score}`;
    player = new Player();
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
    spawnCrystals();
    spawnObstacles();
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    animationId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    // Update and draw player
    player.update(input);
    player.draw();

    // Update and draw crystals
    crystals.forEach(crystal => {
        crystal.update();
        crystal.draw();
        
        if (Math.hypot(player.x - crystal.x, player.y - crystal.y) < 30) {
            score++;
            scoreElement.innerText = `Crystals: ${score}`;
            crystal.reset();
            
            // Add a little "pop" effect would be nice
        }
    });

    // Update and draw obstacles
    obstacles.forEach(obstacle => {
        obstacle.update();
        obstacle.draw();
        
        if (checkCollision(
            { x: player.x - player.width / 2, y: player.y - player.height / 2, width: player.width, height: player.height },
            { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }
        )) {
            gameOver();
        }
    });

    animationId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
    initGame();
});

// Save high score
window.addEventListener('beforeunload', () => {
    if (score > highScore) {
        localStorage.setItem('neon-nebula-high-score', score);
    }
});
