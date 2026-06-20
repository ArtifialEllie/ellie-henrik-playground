const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');

let width, height, player, stardusts, voids, particles, gameActive, score;

class Player {
    constructor() {
        this.radius = 20;
        this.x = width / 2;
        this.y = height * 0.8;
        this.targetX = this.x;
        this.targetY = this.y;
        this.color = '#ffccff';
        this.trail = [];
    }

    update() {
        this.x += (this.targetX - this.x) * 0.15;
        this.y += (this.targetY - this.y) * 0.15;

        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 20) this.trail.shift();
        this.trail.forEach(p => p.alpha -= 0.05);
    }

    draw() {
        ctx.beginPath();
        this.trail.forEach((p, i) => {
            ctx.globalAlpha = p.alpha;
            ctx.strokeStyle = `hsl(${280 + i * 2}, 100%, 70%)`;
            ctx.lineWidth = (i / this.trail.length) * 15;
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Stardust {
    constructor() {
        this.radius = Math.random() * 6 + 4;
        this.x = Math.random() * width;
        this.y = -this.radius;
        this.speed = Math.random() * 2 + 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 80%)`;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.05 - 0.025;
    }

    update() {
        this.y += this.speed;
        this.x += Math.sin(this.y * 0.01) * 1;
        this.angle += this.spin;
    }

    draw() {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? this.radius : this.radius * 0.5;
            const angle = (Math.PI * 2 / 10) * i;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

class Void {
    constructor() {
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * width;
        this.y = -this.radius * 2;
        this.speed = Math.random() * 2 + 1;
        this.pulse = 0;
    }

    update() {
        this.y += this.speed;
        this.pulse += 0.05;
    }

    draw() {
        const currentRadius = this.radius + Math.sin(this.pulse) * 5;
        
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius);
        grad.addColorStop(0, '#000');
        grad.addColorStop(0.7, '#1a0033');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.life = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
        this.life -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    player = new Player();
    stardusts = [];
    voids = [];
    particles = [];
    score = 0;
    gameActive = true;
    overlay.classList.add('hidden');
    scoreElement.textContent = score;
}

function spawnEntities() {
    if (!gameActive) return;
    
    if (Math.random() < 0.05) stardusts.push(new Stardust());
    if (Math.random() < 0.01) voids.push(new Void());
}

function handleCollisions() {
    // Stardust collection
    for (let i = stardusts.length - 1; i >= 0; i--) {
        const s = stardusts[i];
        const dist = Math.hypot(player.x - s.x, player.y - s.y);
        if (dist < player.radius + s.radius) {
            score++;
            scoreElement.textContent = score;
            for (let j = 0; j < 12; j++) particles.push(new Particle(s.x, s.y, s.color));
            stardusts.splice(i, 1);
        }
    }
    
    // Void collision
    for (let i = 0; i < voids.length; i++) {
        const v = voids[i];
        const dist = Math.hypot(player.x - v.x, player.y - v.y);
        if (dist < player.radius + v.radius * 0.8) {
            endGame();
        }
    }
}

function update() {
    if (!gameActive) return;

    spawnEntities();
    player.update();
    
    stardusts.forEach((s, i) => {
        s.update();
        if (s.y > height + s.radius) stardusts.splice(i, 1);
    });
    
    voids.forEach((v, i) => {
        v.update();
        if (v.y > height + v.radius * 2) voids.splice(i, 1);
    });
    
    particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    });

    handleCollisions();
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 567.8) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    player.draw();
    stardusts.forEach(s => s.draw());
    voids.forEach(v => v.draw());
    particles.forEach(p => p.draw());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    player.targetX = e.touches[0].clientX;
    player.targetY = e.touches[0].clientY;
}, { passive: false });

restartBtn.addEventListener('click', init);

function endGame() {
    gameActive = false;
    finalScoreElement.textContent = score;
    overlay.classList.remove('hidden');
}

init();
gameLoop();
