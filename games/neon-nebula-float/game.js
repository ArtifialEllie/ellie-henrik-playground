const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

let score = 0;
let highScore = localStorage.getItem('neonNebulaHighScore') || 0;
let gameActive = false;
let animationId;

// Game Settings
const PLAYER_SIZE = 20;
const CRYSTAL_SIZE = 10;
const VOID_SIZE = 15;
const SPAWN_RATE = 0.02;
const PLAYER_SPEED = 5;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

highScoreElement.innerText = `Best: ${highScore}`;

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = PLAYER_SIZE;
        this.color = '#00ffff';
        this.targetX = this.x;
        this.targetY = this.y;
        this.tentacles = [];
        for (let i = 0; i < 5; i++) {
            this.tentacles.push({
                angle: (i / 5) * Math.PI * 2,
                length: 15,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    draw() {
        // Draw tentacles (jellyfish feel)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        this.tentacles.forEach(t => {
            const wave = Math.sin(Date.now() * 0.005 + t.phase) * 5;
            const tx = this.x + Math.cos(t.angle) * (this.radius + wave);
            const ty = this.y + Math.sin(t.angle) * (this.radius + wave);
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.quadraticCurveTo(
                this.x + Math.cos(t.angle) * 10, 
                this.y + Math.sin(t.angle) * 10, 
                tx, ty
            );
            ctx.stroke();
        });

        // Draw head
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        // Smooth movement towards target
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
    }
}

class Entity {
    constructor(type) {
        this.type = type; // 'crystal' or 'void'
        this.radius = type === 'crystal' ? CRYSTAL_SIZE : VOID_SIZE;
        this.color = type === 'crystal' ? '#ffff00' : '#ff4444';
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -this.radius;
        this.speed = 2 + Math.random() * 3;
        this.angle = Math.random() * Math.PI * 2;
        this.drift = (Math.random() - 0.5) * 2;
    }

    update() {
        this.y += this.speed;
        this.x += Math.sin(Date.now() * 0.002 + this.angle) * 0.5 + this.drift;
        
        if (this.y > canvas.height + this.radius) {
            this.reset();
        }
    }

    draw() {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        if (this.type === 'crystal') {
            // Draw a diamond/crystal shape
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y);
            ctx.lineTo(this.x, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y);
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw a void bubble
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // Inner void
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

const player = new Player();
const entities = [];

function spawnEntity() {
    if (Math.random() < SPAWN_RATE) {
        const type = Math.random() < 0.7 ? 'crystal' : 'void';
        entities.push(new Entity(type));
    }
}

function checkCollision(p, e) {
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < p.radius + e.radius;
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonNebulaHighScore', highScore);
        highScoreElement.innerText = `Best: ${highScore}`;
    }
    
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.querySelector('h1').innerText = '🌌 Nebula Collapse!';
    overlay.querySelector('p').innerText = `You collected ${score} stardust crystals.`;
    overlay.querySelector('button').innerText = 'Try Again 🌈';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background stars
    ctx.fillStyle = 'white';
    for(let i=0; i<50; i++) {
        const x = (Math.sin(i) * 0.5 + 0.5) * canvas.width;
        const y = (Date.now() * 0.1 + i * 100) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    if (gameActive) {
        player.update();
        player.draw();
        
        spawnEntity();
        
        entities.forEach((e, index) => {
            e.update();
            e.update(); // Speed up slightly
            e.draw();
            
            if (checkCollision(player, e)) {
                if (e.type === 'crystal') {
                    score++;
                    scoreElement.innerText = `Stardust: ${score}`;
                    entities.splice(index, 1);
                } else {
                    gameOver();
                }
            }
        });
    } else {
        player.draw();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Control
window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchstart', (e) => {
    player.targetX = e.clientX; // This is slightly wrong for touch, but basic
    player.targetY = e.clientY;
}, {passive: false});

// Fix touch support
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    player.targetX = touch.clientX;
    player.targetY = touch.clientY;
}, {passive: false});

startButton.addEventListener('click', () => {
    score = 0;
    scoreElement.innerText = `Stardust: 0`;
    entities.length = 0;
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    gameLoop();
});

// Initialize loop without starting game
gameLoop();
