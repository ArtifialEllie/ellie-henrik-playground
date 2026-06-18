const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('message-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startButton = document.getElementById('start-button');
const powerUpFill = document.getElementById('power-up-fill');
const powerUpText = document.getElementById('power-up-text');

let score = 0;
let highScore = localStorage.getItem('cosmicCandyHighScore') || 0;
highScoreElement.innerText = highScore;

let gameActive = false;
let candies = [];
let particles = [];
let stars = [];
let powerUpEnergy = 0;
let gameSpeed = 1;
let spawnRate = 1500;
let lastSpawnTime = 0;

const CANDY_TYPES = [
    { color: '#FF69B4', points: 10, size: 15, label: '🍭' },
    { color: '#00FFFF', points: 20, size: 12, label: '🍬' },
    { color: '#FFFF00', points: 50, size: 10, label: '🌟' },
    { color: '#FFD700', points: 100, size: 8, label: '💎' },
    { color: '#FF00FF', points: 5, size: 20, label: '🍩' },
];

const PLAYER_SIZE = 40;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            opacity: Math.random(),
            speed: Math.random() * 0.05
        });
    }
}

class Candy {
    constructor() {
        const type = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
        this.type = type;
        this.radius = type.size;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = (Math.random() * 2 + 2) * gameSpeed;
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.y += this.speed;
        this.angle += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.font = `${this.radius * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.label, 0, 0);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
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
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let playerX = canvas.width / 2;
let playerY = canvas.height - 80;
let targetX = playerX;

function drawPlayer() {
    ctx.save();
    
    // Glowing effect
    const gradient = ctx.createRadialGradient(playerX, playerY, 5, playerX, playerY, PLAYER_SIZE * 1.5);
    gradient.addColorStop(0, '#ff69b4');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(playerX, playerY, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Player body (Ellie's basket/magic bowl)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(playerX, playerY, PLAYER_SIZE/2, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    
    // Bowl rim
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(playerX - PLAYER_SIZE/2, playerY);
    ctx.lineTo(playerX + PLAYER_SIZE/2, playerY);
    ctx.stroke();

    // Ellie emoji
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎀', playerX, playerY - 10);
    
    ctx.restore();
}

function spawnCandy() {
    const now = Date.now();
    if (now - lastSpawnTime > spawnRate) {
        candies.push(new Candy());
        lastSpawnTime = now;
    }
}

function handleCollisions() {
    for (let i = candies.length - 1; i >= 0; i--) {
        const c = candies[i];
        const dx = c.x - playerX;
        const dy = c.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PLAYER_SIZE/2 + c.radius) {
            // Collect candy
            score += c.type.points;
            powerUpEnergy = Math.min(100, powerUpEnergy + c.type.points / 2);
            
            // Particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(c.x, c.y, c.type.color));
            }
            
            candies.splice(i, 1);
            scoreElement.innerText = score;
            
            // Increase difficulty
            if (score % 200 === 0) {
                gameSpeed += 0.1;
                spawnRate = Math.max(500, spawnRate - 50);
            }
        } else if (c.y > canvas.height + c.radius) {
            // Candy missed
            candies.splice(i, 1);
        }
    }
}

function triggerMagicBurst() {
    if (powerUpEnergy >= 100) {
        powerUpEnergy = 0;
        // Clear all candies on screen
        candies.forEach(c => {
            score += c.type.points;
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(c.x, c.y, c.type.color));
            }
        });
        scoreElement.innerText = score;
        candies = [];
        
        // Huge explosion of particles
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(playerX, playerY, '#ffffff'));
        }
        
        powerUpFill.style.width = '0%';
        powerUpText.innerText = 'Magi: 0%';
    }
}

function updatePowerUpBar() {
    powerUpFill.style.width = `${powerUpEnergy}%`;
    powerUpText.innerText = `Magi: ${Math.floor(powerUpEnergy)}%`;
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.save();
    stars.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.opacity -= s.speed;
        if (s.opacity <= 0) s.opacity = 1;
    });
    ctx.restore();

    // Candies
    spawnCandy();
    candies.forEach(c => {
        c.update();
        c.draw();
    });

    // Particles
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) p.life = 0;
    });
    particles = particles.filter(p => p.life > 0);

    // Player
    playerX += (targetX - playerX) * 0.15;
    drawPlayer();

    handleCollisions();
    updatePowerUpBar();

    if (powerUpEnergy >= 100) {
        // Trigger magic burst automatically if full
        triggerMagicBurst();
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameActive = true;
    score = 0;
    powerUpEnergy = 0;
    gameSpeed = 1;
    spawnRate = 1500;
    candies = [];
    particles = [];
    scoreElement.innerText = '0';
    overlay.classList.add('hidden');
    gameLoop();
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cosmicCandyHighScore', highScore);
        highScoreElement.innerText = highScore;
    }
    
    overlayTitle.innerText = '✨ Magic Over! ✨';
    overlayText.innerText = `You caught ${score} points of cosmic candy!`;
    startButton.innerText = 'Try Again! 🍭';
    overlay.classList.remove('hidden');
}

// Input
window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
});

window.addEventListener('touchmove', (e) => {
    targetX = e.clientX;
    e.preventDefault();
}, { passive: false });

window.addEventListener('resize', resize);
startButton.addEventListener('click', startGame);

// Initialize
resize();
overlay.classList.remove('hidden');
