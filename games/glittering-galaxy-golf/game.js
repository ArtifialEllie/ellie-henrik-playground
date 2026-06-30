const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const stats = {
    stars: document.getElementById('stars'),
    holes: document.getElementById('holes'),
    attempts: document.getElementById('attempts')
};

const messageEl = document.getElementById('message');

let width, height;
let ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 12, dragging: false, startX: 0, startY: 0 };
let hole = { x: 0, y: 0, radius: 20 };
let obstacles = [];
let particles = [];
let starsCollected = 0;
let holesCompleted = 0;
let attempts = 0;
let currentLevel = 1;
const MAX_HOLES = 5;

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    
    canvas.addEventListener('touchstart', e => startDrag(e.touches[0]));
    canvas.addEventListener('touchmove', e => drag(e.touches[0]));
    canvas.addEventListener('touchend', e => endDrag());

    setupLevel();
    animate();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (ball.x === 0) {
        ball.x = width / 4;
        ball.y = height / 2;
    }
}

function setupLevel() {
    ball.vx = 0;
    ball.vy = 0;
    ball.x = 100 + Math.random() * 100;
    ball.y = height / 2 + (Math.random() - 0.5) * 200;

    hole.x = width - 100 - Math.random() * 100;
    hole.y = height / 2 + (Math.random() - 0.5) * 200;

    obstacles = [];
    const obstacleCount = 2 + currentLevel;
    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
            x: width / 4 + Math.random() * (width / 2),
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 20 + Math.random() * 30,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
    }

    // Add some stars to collect
    particles = [];
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 5,
            collected: false,
            color: '#ffff00'
        });
    }
}

function startDrag(e) {
    if (Math.hypot(e.clientX - ball.x, e.clientY - ball.y) < ball.radius * 2) {
        ball.dragging = true;
        ball.startX = e.clientX;
        ball.startY = e.clientY;
    }
}

function drag(e) {
    if (!ball.dragging) return;
    ball.startX = e.clientX;
    ball.startY = e.clientY;
}

function endDrag(e) {
    if (!ball.dragging) return;
    ball.dragging = false;
    
    // Calculate shot strength
    const dx = ball.x - ball.startX;
    const dy = ball.y - ball.startY;
    
    ball.vx = dx * 0.15;
    ball.vy = dy * 0.15;
    attempts++;
    stats.attempts.innerText = attempts;
}

function update() {
    // Ball physics
    if (!ball.dragging) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.98;
        ball.vy *= 0.98;

        // Wall bounce
        if (ball.x < ball.radius || ball.x > width - ball.radius) {
            ball.vx *= -0.8;
            ball.x = ball.x < ball.radius ? ball.radius : width - ball.radius;
        }
        if (ball.y < ball.radius || ball.y > height - ball.radius) {
            ball.vy *= -0.8;
            ball.y = ball.y < ball.radius ? ball.radius : height - ball.radius;
        }
    }

    // Obstacle collisions
    obstacles.forEach(obs => {
        obs.x += obs.vx;
        obs.y += obs.vy;

        if (obs.x < obs.radius || obs.x > width - obs.radius) obs.vx *= -1;
        if (obs.y < obs.radius || obs.y > height - obs.radius) obs.vy *= -1;

        const dist = Math.hypot(ball.x - obs.x, ball.y - obs.y);
        if (dist < ball.radius + obs.radius) {
            const nx = (ball.x - obs.x) / dist;
            const ny = (ball.y - obs.y) / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
            ball.vx *= 0.8;
            ball.vy *= 0.8;
            
            // Push ball out of obstacle
            const overlap = (ball.radius + obs.radius) - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;
        }
    });

    // Star collection
    particles.forEach(p => {
        if (!p.collected && Math.hypot(ball.x - p.x, ball.y - p.y) < ball.radius + p.radius) {
            p.collected = true;
            starsCollected++;
            stats.stars.innerText = starsCollected;
            createExplosion(p.x, p.y, '#ffff00');
        }
    });

    // Hole detection
    if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius) {
        if (Math.abs(ball.vx) < 5 && Math.abs(ball.vy) < 5) {
            nextLevel();
        }
    }
}

function nextLevel() {
    holesCompleted++;
    stats.holes.innerText = holesCompleted;
    createExplosion(hole.x, hole.y, '#00ffff');
    
    messageEl.innerText = "Mål nådd! 🌟";
    messageEl.classList.remove('hidden');
    
    setTimeout(() => {
        messageEl.classList.add('hidden');
        currentLevel++;
        if (currentLevel > MAX_HOLES) {
            alert("Gratulerer! Du har fullført den kosmiske golf-reisen! ✨⛳");
            currentLevel = 1;
            holesCompleted = 0;
            starsCollected = 0;
            attempts = 0;
            stats.holes.innerText = "0";
            stats.stars.innerText = "0";
            stats.attempts.innerText = "0";
        }
        setupLevel();
    }, 1500);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            color: color,
            isExplosion: true
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Hole
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, obs.radius);
        grad.addColorStop(0, obs.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();
    });

    // Draw Stars
    particles.forEach(p => {
        if (!p.collected && !p.isExplosion) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.closePath();
        } else if (p.isExplosion) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.closePath();
            ctx.globalAlpha = 1.0;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        }
    });

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // Draw Drag Line
    if (ball.dragging) {
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.startX, ball.startY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);
    }
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

// Remove dead explosion particles
setInterval(() => {
    particles = particles.filter(p => p.life !== undefined && p.life > 0 || !p.isExplosion);
}, 100);

init();
