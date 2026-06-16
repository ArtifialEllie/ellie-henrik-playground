const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start-button');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');

let score = 0;
let lives = 3;
let gameActive = false;
let particles = [];
let collectibles = [];
let obstacles = [];

const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: '#ff85c1',
    targetX: 0,
    targetY: 0,
    ease: 0.15
};

function resize() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.9;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.targetX = player.x;
    player.targetY = player.y;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.targetY = e.clientY - rect.top;
});

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Collectible {
    constructor() {
        this.radius = Math.random() * 10 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
        this.pulse = 0;
    }

    update() {
        this.pulse += 0.1;
    }

    draw() {
        const pulseSize = this.radius + Math.sin(this.pulse) * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Sparkle highlight
        ctx.beginPath();
        ctx.arc(this.x - pulseSize * 0.3, this.y - pulseSize * 0.3, pulseSize * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
}

class Obstacle {
    constructor() {
        this.radius = Math.random() * 15 + 15;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = '#a64dff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius) this.vx *= -1;
        if (this.x > canvas.width - this.radius) this.vx *= -1;
        if (this.y < this.radius) this.vy *= -1;
        if (this.y > canvas.height - this.radius) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Sticky glue detail
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function spawnCollectible() {
    collectibles.push(new Collectible());
}

function spawnObstacle() {
    obstacles.push(new Obstacle());
}

function initGame() {
    score = 0;
    lives = 3;
    collectibles = [];
    obstacles = [];
    particles = [];
    
    scoreElement.innerText = `Sugar Sparkles: ${score}`;
    livesElement.innerText = `Bubbles: ${'❤️'.repeat(lives)}`;
    
    spawnCollectible();
    spawnCollectible();
    spawnCollectible();
    for(let i=0; i<5; i++) spawnObstacle();
}

function gameOver() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    overlayTitle.innerText = 'Pop! 💥';
    overlayText.innerText = `You collected ${score} Sugar Sparkles before popping!`;
    startButton.innerText = 'Try Again! ✨';
}

function startGame() {
    initGame();
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
}

startButton.addEventListener('click', startGame);

function update() {
    if (!gameActive) return;

    // Move player
    player.x += (player.targetX - player.x) * player.ease;
    player.y += (player.targetY - player.y) * player.ease;

    // Check collisions with collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const dist = Math.hypot(player.x - collectibles[i].x, player.y - collectibles[i].y);
        if (dist < player.radius + collectibles[i].radius) {
            score += 10;
            scoreElement.innerText = `Sugar Sparkles: ${score}`;
            
            // Particle explosion
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(collectibles[i].x, collectibles[i].y, collectibles[i].color));
            }
            
            collectibles.splice(i, 1);
            spawnCollectible();
            
            // Occasionally add more obstacles to increase difficulty
            if (score % 50 === 0) {
                spawnObstacle();
            }
        }
    }

    // Check collisions with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const dist = Math.hypot(player.x - obstacles[i].x, player.y - obstacles[i].y);
        if (dist < player.radius + obstacles[i].radius) {
            lives--;
            livesElement.innerText = `Bubbles: ${'❤️'.repeat(lives)}`;
            
            // Knockback and particles
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(player.x, player.y, 'red'));
            }
            
            // Reset player position slightly
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            
            if (lives <= 0) {
                gameOver();
            }
            
            // Push away the obstacle that hit us
            obstacles[i].vx *= -1.2;
            obstacles[i].vy *= -1.2;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update obstacles
    obstacles.forEach(obj => obj.update());

    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    // Bubble sheen
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    // Draw collectibles
    collectibles.forEach(obj => obj.draw());

    // Draw obstacles
    obstacles.forEach(obj => obj.draw());

    // Draw particles
    particles.forEach(obj => obj.draw());

    requestAnimationFrame(draw);
}

// Start loops
requestAnimationFrame(update);
requestAnimationFrame(draw);
