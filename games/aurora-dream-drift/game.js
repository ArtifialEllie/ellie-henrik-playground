const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

let width, height;
let score = 0;
let gameActive = false;
let player = { x: 0, y: 0, radius: 8, color: '#fff', targetX: 0, targetY: 0 };
let particles = [];
let auroraCurtains = [];
let frameCount = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    player.x = width / 2;
    player.y = height / 2;
    player.targetX = player.x;
    player.targetY = player.y;
}

window.addEventListener('resize', resize);
resize();

// Input handling
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

window.addEventListener('mousemove', e => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchmove', e => {
    e.preventDefault();
    player.targetX = e.touches[0].clientX;
    player.targetY = e.touches[0].clientY;
}, { passive: false });

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.alpha = 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class AuroraCurtain {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = width + 100;
        this.width = Math.random() * 150 + 100;
        this.speed = Math.random() * 2 + 2;
        this.color = `hsla(${Math.random() * 60 + 120}, 100%, 60%, 0.4)`;
        this.points = [];
        this.segments = 10;
        for (let i = 0; i <= this.segments; i++) {
            this.points.push({ x: 0, y: Math.random() * 100 - 50 });
        }
    }
    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.reset();
        }
        
        // Wave motion for points
        this.points.forEach((p, i) => {
            p.y += Math.sin(frameCount * 0.05 + i) * 0.5;
        });
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        const topY = 0;
        const bottomY = height;
        
        ctx.moveTo(this.x, topY);
        for (let i = 0; i < this.points.length; i++) {
            const px = this.x + (i / this.segments) * this.width;
            const py = height / 2 + this.points[i].y;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(this.x + this.width, topY);
        ctx.lineTo(this.x + this.width, bottomY);
        for (let i = this.points.length - 1; i >= 0; i--) {
            const px = this.x + (i / this.segments) * this.width;
            const py = height / 2 + this.points[i].y;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(this.x, bottomY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function spawnAurora() {
    if (auroraCurtains.length < 5) {
        auroraCurtains.push(new AuroraCurtain());
    }
}

function updatePlayer() {
    if (keys['ArrowLeft']) player.targetX -= 10;
    if (keys['ArrowRight']) player.targetX += 10;
    if (keys['ArrowUp']) player.targetY -= 10;
    if (keys['ArrowDown']) player.targetY += 10;

    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;

    // Bounds
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));
}

function checkCollision(curtain) {
    // Simplified collision: if player is within the horizontal bounds of the curtain
    // and the vertical position is near the "wave" center
    if (player.x > curtain.x && player.x < curtain.x + curtain.width) {
        const relativeX = (player.x - curtain.x) / curtain.width;
        const segmentIdx = Math.floor(relativeX * curtain.segments);
        const point = curtain.points[Math.min(segmentIdx, curtain.segments - 1)];
        const waveY = height / 2 + point.y;
        
        if (Math.abs(player.y - waveY) < 60) {
            return true;
        }
    }
    return false;
}

function gameLoop() {
    frameCount++;
    ctx.clearRect(0, 0, width, height);

    // Background Stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const sx = (Math.sin(i * 123.456) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 789.101) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    if (gameActive) {
        updatePlayer();
        
        spawnAurora();

        auroraCurtains.forEach((curtain, index) => {
            curtain.update();
            curtain.draw();
            if (checkCollision(curtain)) {
                score++;
                scoreElement.innerText = score;
                
                // Visual feedback
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(player.x, player.y, curtain.color));
                }
                
                // Push curtain back to start to avoid multi-counting
                curtain.reset();
            }
        });
    } else {
        // Just draw curtains for background effect
        auroraCurtains.forEach(curtain => {
            curtain.update();
            curtain.draw();
        });
    }

    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    // Draw Player
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'white';
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, player.onmouseover = 'white', 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    scoreElement.innerText = score;
    gameActive = true;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);
    messageElement.innerText = "Collect the Aurora light! ✨";
}

startButton.addEventListener('click', startGame);

gameLoop();
