const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const shardsEl = document.getElementById('shards');
const energyBar = document.getElementById('energy-bar');
const overlay = document.getElementById('overlay');
const finalDistanceEl = document.getElementById('final-distance');
const finalShardsEl = document.getElementById('final-shards');
const restartBtn = document.getElementById('restart-btn');

let width, height;
let gameActive = false;
let distance = 0;
let shards = 0;
let energy = 100;
let playerX = 0;
let targetX = 0;
let speed = 5;
let obstacles = [];
let collectibles = [];
let particles = [];
let frameCount = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    playerX = width / 2;
    targetX = width / 2;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
});

window.addEventListener('touchmove', (e) => {
    targetX = e.touches[0].clientX;
    e.preventDefault();
}, { passive: false });

class Obstacle {
    constructor() {
        this.width = 40 + Math.random() * 60;
        this.height = 20 + Math.random() * 100;
        this.x = Math.random() * width;
        this.y = -this.height;
        this.color = `hsl(${280 + Math.random() * 60}, 100%, 50%)`;
        this.speed = speed + Math.random() * 2;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Collectible {
    constructor() {
        this.size = 15;
        this.x = Math.random() * width;
        this.y = -this.size;
        this.color = '#00ffff';
        this.speed = speed;
    }

    update() {
        this.y += this.speed;
        this.x += Math.sin(frameCount * 0.05) * 2;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
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
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function spawnEntities() {
    if (frameCount % 60 === 0) {
        obstacles.push(new Obstacle());
    }
    if (frameCount % 100 === 0) {
        collectibles.push(new Collectible());
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameOver() {
    gameActive = false;
    finalDistanceEl.innerText = Math.floor(distance);
    finalShardsEl.innerText = shards;
    overlay.classList.remove('hidden');
}

function resetGame() {
    distance = 0;
    shards = 0;
    energy = 100;
    obstacles = [];
    collectibles = [];
    particles = [];
    frameCount = 0;
    gameActive = true;
    overlay.classList.add('hidden');
}

function update() {
    if (!gameActive) return;

    frameCount++;
    distance += 0.1;
    speed = 5 + (distance * 0.01);

    // Smooth player movement
    playerX += (targetX - playerX) * 0.15;

    // Energy decay
    energy -= 0.02;
    if (energy <= 0) {
        gameOver();
    }

    distanceEl.innerText = Math.floor(distance);
    shardsEl.innerText = shards;
    energyBar.style.width = energy + '%';

    spawnEntities();

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update();
        obs.draw();

        // Collision check
        const playerRect = { x: playerX - 20, y: height - 80, width: 40, height: 40 };
        if (checkCollision(playerRect, obs)) {
            // Create explosion particles
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(playerX, height - 60, '#ff00ff'));
            }
            gameOver();
        }

        if (obs.y > height) {
            obstacles.splice(i, 1);
        }
    }

    // Update and draw collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const coll = collectibles[i];
        coll.update();
        coll.draw();

        const playerRect = { x: playerX - 20, y: height - 80, width: 40, height: 40 };
        if (checkCollision({ x: coll.x - coll.size, y: coll.y - coll.size, width: coll.size * 2, height: coll.size * 2 }, playerRect)) {
            shards += 1;
            energy = Math.min(100, energy + 15);
            collectibles.splice(i, 1);
            
            // Sparkle effect
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(coll.x, coll.y, '#00ffff'));
            }
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Draw Player
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(playerX, height - 100);
    ctx.lineTo(playerX - 20, height - 60);
    ctx.lineTo(playerX + 20, height - 60);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw background nebula effect
    ctx.fillStyle = 'rgba(5, 0, 16, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Simple starfield
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
}

function loop() {
    ctx.clearRect(0, 0, width, height);
    // Background "trail" effect by not fully clearing
    // We just need to draw a background fill first
    ctx.fillStyle = '#050010';
    ctx.fillRect(0, 0, width, height);
    
    update();
    requestAnimationFrame(loop);
}

function start() {
    resetGame();
    loop();
}

restartBtn.addEventListener('click', start);
start();
