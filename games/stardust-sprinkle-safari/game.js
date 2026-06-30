const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');
const messageElement = document.getElementById('message');

let score = 0;
let gameActive = true;
let particles = [];
let sprinkles = [];
let gameTimer = 0;
const GAME_DURATION = 30; // seconds

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
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

class Sprinkle {
    constructor() {
        this.radius = Math.random() * 10 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speedY = -(Math.random() * 3 + 2);
        this.speedX = (Math.random() - 0.5) * 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.glow = 0;
        this.pulse = 0;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.pulse += 0.1;
        this.glow = Math.sin(this.pulse) * 5;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15 + this.glow;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a little sparkle star on top
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - this.radius*0.3, this.y - this.radius*0.3, this.radius*0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnSprinkle() {
    if (gameActive) {
        sprinkles.push(new Sprinkle());
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollision(s) {
    // This game uses mouse/touch position as the "catcher"
    // We'll just check if the sprinkle is close to the mouse
    // But to make it better, let's track the mouse position
}

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener('touchstart', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

function update() {
    if (!gameActive) return;

    gameTimer += 1/60;
    if (gameTimer >= GAME_DURATION) {
        endGame();
    }

    // Update sprinkles
    for (let i = sprinkles.length - 1; i >= 0; i--) {
        const s = sprinkles[i];
        s.update();

        // Collision detection
        const dx = s.x - mouse.x;
        const dy = s.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < s.radius + 30) {
            score++;
            scoreElement.innerText = score;
            createExplosion(s.x, s.y, s.color);
            sprinkles.splice(i, 1);
            
            if (score === 10) messageElement.innerText = "You're a natural! ✨";
            if (score === 25) messageElement.innerText = "Stardust Master! 🌟";
            if (score === 50) messageElement.innerText = "Galactic Legend! 🌌";
        } else if (s.y < -s.radius) {
            sprinkles.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mouse "collector" aura
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    sprinkles.forEach(s => s.draw());
    particles.forEach(p => p.draw());

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    update();
    draw();
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = score;
    overlay.classList.remove('hidden');
}

function startGame() {
    score = 0;
    gameTimer = 0;
    sprinkles = [];
    particles = [];
    gameActive = true;
    scoreElement.innerText = '0';
    messageElement.innerText = "Catch the stardust! ✨";
    overlay.classList.add('hidden');
    
    // Start spawning sprinkles
    if (window.spawnInterval) clearInterval(window.spawnInterval);
    window.spawnInterval = setInterval(spawnSprinkle, 600);
}

restartBtn.addEventListener('click', () => {
    startGame();
});

// Start the first game
startGame();
gameLoop();
