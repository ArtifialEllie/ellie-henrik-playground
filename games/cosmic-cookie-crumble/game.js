const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

let score = 0;
let health = 100;
let gameRunning = false;
let particles = [];
let crumbs = [];
let sprinkles = [];
let animationId;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle {
    constructor(x, y, color, size, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
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

class Cookie {
    constructor() {
        this.radius = Math.min(canvas.width, canvas.height) * 0.2;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.color = '#d2b48c';
        this.border = '#8b4513';
        this.rotation = 0;
        this.rotationSpeed = 0.005;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Main cookie body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.border;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chocolate chips
        const chipPositions = [
            {x: -this.radius*0.5, y: -this.radius*0.3, r: this.radius*0.1},
            {x: this.radius*0.4, y: -this.radius*0.2, r: this.radius*0.08},
            {x: this.radius*0.2, y: this.radius*0.4, r: this.radius*0.12},
            {x: -this.radius*0.3, y: this.radius*0.5, r: this.radius*0.09},
            {x: 0, y: 0, r: this.radius*0.11},
            {x: -this.radius*0.6, y: this.radius*0.1, r: this.radius*0.07},
            {x: this.radius*0.5, y: this.radius*0.6, r: this.radius*0.08},
        ];

        ctx.fillStyle = '#4b2c20';
        chipPositions.forEach(chip => {
            ctx.beginPath();
            ctx.arc(chip.x, chip.y, chip.r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
        this.rotation += this.rotationSpeed;
    }
}

class Crumble {
    constructor() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.min(canvas.width, canvas.height) * 0.2;
        this.x = canvas.width / 2 + Math.cos(angle) * dist;
        this.y = canvas.height / 2 + Math.sin(angle) * dist;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.cos(angle) * (Math.random() * 2 + 1);
        this.speedY = Math.sin(angle) * (Math.random() * 2 + 1);
        this.color = '#d2b48c';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Sprinkle {
    constructor() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.min(canvas.width, canvas.height) * 0.5;
        this.x = canvas.width / 2 + Math.cos(angle) * dist;
        this.y = canvas.height / 2 + Math.sin(angle) * dist;
        this.size = 4;
        this.length = Math.random() * 10 + 5;
        this.angle = Math.random() * Math.PI * 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(-this.length/2, -this.size/2, this.length, this.size);
        ctx.fill();
        ctx.restore();
    }
}

const cookie = new Cookie();

function spawnCrumble() {
    if (Math.random() < 0.05) {
        crumbs.push(new Crumble());
    }
}

function spawnSprinkle() {
    if (Math.random() < 0.03) {
        sprinkles.push(new Sprinkle());
    }
}

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX || e.touches[0].clientX) - rect.left;
    const mouseY = (e.clientY || e.touches[0].clientY) - rect.top;

    const dist = Math.hypot(mouseX - cookie.x, mouseY - cookie.y);
    
    if (dist < cookie.radius) {
        // Clicked inside cookie
        score += 1;
        scoreElement.innerText = score;
        
        // Create impact particles
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                mouseX, mouseY, 
                '#ffccaa', 
                Math.random() * 3 + 1, 
                (Math.random() - 0.5) * 5, 
                (Math.random() - 0.5) * 5
            ));
        }
    } else {
        // Missed the cookie
        health -= 2;
        healthElement.innerText = Math.max(0, health);
        
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                mouseX, mouseY, 
                '#ff4444', 
                Math.random() * 3 + 1, 
                (Math.random() - 0.5) * 5, 
                (Math.random() - 0.5) * 5
            ));
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1, 0, Math.PI * 2);
        ctx.fill();
    }

    spawnCrumble();
    spawnSprinkle();

    sprinkles.forEach((s, index) => {
        s.update();
        s.draw();
    });

    crumbs.forEach((c, index) => {
        c.update();
        c.draw();
        // If a crumble reaches the edge of the screen, cookie loses integrity
        if (c.x < 0 || c.x > canvas.width || c.y < 0 || c.y > canvas.height) {
            crumbs.splice(index, 1);
            health -= 1;
            healthElement.innerText = Math.max(0, health);
        }
    });

    cookie.draw();
    
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(index, 1);
    });

    if (health <= 0) {
        gameOver();
    }

    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameRunning = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').innerText = 'Cookie Crumpled! 🍪💥';
    document.getElementById('message').innerText = `You collected ${score} sprinkles of joy!`;
    startButton.innerText = 'Try Again! 🍪';
}

function startGame() {
    score = 0;
    health = 100;
    scoreElement.innerText = score;
    healthElement.innerText = health;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    gameRunning = true;
    
    crumbs = [];
    sprinkles = [];
    particles = [];
    
    gameLoop();
}

startButton.addEventListener('click', () => {
    startGame();
});

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, {passive: false});
