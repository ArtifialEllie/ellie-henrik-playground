const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const distanceElement = document.getElementById('distance');
const overlay = document.getElementById('overlay');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalDistanceElement = document.getElementById('final-distance');
const finalScoreElement = document.getElementById('final-score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let gameActive = false;
let score = 0;
let distance = 0;
let player;
let crystals = [];
let asteroids = [];
let stars = [];
let animationId;

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2;
        this.y = canvas.height * 0.8;
        this.targetX = this.x;
        this.speed = 0.15;
        this.color = '#ffccff';
        this.glow = '#ff00ff';
    }

    update() {
        this.x += (this.targetX - this.x) * this.speed;
    }

    draw() {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.glow;
        ctx.fillStyle = this.color;
        
        // Draw a little sparkly spaceship/slider
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x - 20, this.y + 20);
        ctx.lineTo(this.x + 20, this.y + 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

class Crystal {
    constructor() {
        this.size = 15 + Math.random() * 15;
        this.x = Math.random() * canvas.width;
        this.y = -this.size;
        this.speed = 3 + Math.random() * 4;
        this.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size/2);
        ctx.lineTo(this.x + this.size/2, this.y);
        ctx.lineTo(this.x, this.y + this.size/2);
        ctx.lineTo(this.x - this.size/2, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

class Asteroid {
    constructor() {
        this.size = 20 + Math.random() * 40;
        this.x = Math.random() * canvas.width;
        this.y = -this.size;
        this.speed = 4 + Math.random() * 5;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Draw a jagged asteroid
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = this.size/2 + (Math.random() * 5);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = 0.5 + Math.random() * 2;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function spawnObjects() {
    if (Math.random() < 0.03) {
        crystals.push(new Crystal());
    }
    if (Math.random() < 0.02) {
        asteroids.push(new Asteroid());
    }
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.width/2 || obj1.size/2) + (obj2.width/2 || obj2.size/2);
}

function update() {
    if (!gameActive) return;

    distance += 0.1;
    distanceElement.innerText = Math.floor(distance);

    player.update();
    
    spawnObjects();

    crystals.forEach((crystal, index) => {
        crystal.update();
        if (crystal.y > canvas.height) {
            crystals.splice(index, 1);
        }
        if (checkCollision(player, crystal)) {
            score += 1;
            scoreElement.innerText = score;
            crystals.splice(index, 1);
        }
    });

    asteroids.forEach((asteroid, index) => {
        asteroid.update();
        if (asteroid.y > canvas.height) {
            asteroids.splice(index, 1);
        }
        if (checkCollision(player, asteroid)) {
            endGame();
        }
    });

    stars.forEach(star => star.update());

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => star.draw());
    crystals.forEach(crystal => crystal.draw());
    asteroids.forEach(asteroid => asteroid.draw());
    player.draw();

    animationId = requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    finalDistanceElement.innerText = Math.floor(distance);
    finalScoreElement.innerText = score;
    gameOverScreen.style.display = 'flex';
}

function startGame() {
    score = 0;
    distance = 0;
    crystals = [];
    asteroids = [];
    stars = [];
    
    scoreElement.innerText = '0';
    distanceElement.innerText = '0';
    
    player = new Player();
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
    
    overlay.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameActive = true;
    update();
}

// Input handling
window.addEventListener('mousemove', (e) => {
    if (gameActive) {
        player.targetX = e.clientX;
    }
});

window.addEventListener('touchmove', (e) => {
    if (gameActive) {
        player.targetX = e.touches[0].clientX;
    }
});

startButton.addEventListener('click', () => startGame());
restartButton.addEventListener('click', () => startGame());
