const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let highScore = localStorage.getItem('galaxyGumballHighScore') || 0;
let gameActive = true;
let gumballs = [];
let particles = [];
let player = {
    x: 0,
    y: 0,
    radius: 30,
    color: '#00ffff'
};

highScoreElement.innerText = highScore;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

// Input handling
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

class Gumball {
    constructor() {
        this.radius = 10 + Math.random() * 15;
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { // Top
            this.x = Math.random() * canvas.width;
            this.y = -this.radius;
        } else if (side === 1) { // Right
            this.x = canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else if (side === 2) { // Bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.radius;
        } else { // Left
            this.x = -this.radius;
            this.y = Math.random() * canvas.height;
        }

        const targetX = canvas.width / 2 + (Math.random() - 0.5) * 200;
        const targetY = canvas.height / 2 + (Math.random() - 0.5) * 200;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const speed = 2 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.glow = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls slightly
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Collision with player
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + player.radius) {
            collectGumball(this);
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function collectGumball(gumball) {
    score++;
    scoreElement.innerText = score;
    
    // Create explosion particles
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(gumball.x, gumball.y, gumball.color));
    }

    gumball.reset();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('galaxyGumballHighScore', highScore);
        highScoreElement.innerText = highScore;
    }
}

function spawnGumballs() {
    if (gumballs.length < 15) {
        gumballs.push(new Gumball());
    }
}

function updatePlayer() {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    player.x += dx * 0.15;
    player.y += dy * 0.15;
}

function drawPlayer() {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    
    // Draw player "magnet"
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.4, player.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5 + Math.sin(Date.now() * 0.005) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 123.456) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 678.910) * 0.5 + 0.5) * canvas.height;
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    updatePlayer();
    drawPlayer();

    gumballs.forEach(gumball => {
        gumball.update();
        gumball.draw();
    });

    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) {
            particles.splice(index, 1);
        } else {
            particle.draw();
        }
    });

    spawnGumballs();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = score;
    overlay.classList.remove('hidden');
}

restartBtn.addEventListener('click', () => {
    score = 0;
    scoreElement.innerText = score;
    gumballs = [];
    particles = [];
    gameActive = true;
    overlay.classList.add('hidden');
    gameLoop();
});

// Start the game
gameLoop();
