const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let score = 0;
let highScore = localStorage.getItem('rrr_highscore') || 0;
highScoreEl.innerText = `Best: ${highScore}`;

let gameActive = false;
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    color: 'white',
    speed: 5,
    trail: []
};

let stars = [];
let obstacles = [];
let particles = [];
let frameCount = 0;

const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

function createStar() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: 0
    };
}

function createObstacle() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 2 + 1;
    } else if (side === 1) { // Right
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -(Math.random() * 2 + 1);
        vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 2 + 1);
    } else { // Left
        x = -50;
        y = Math.random() * canvas.height;
        vx = Math.random() * 2 + 1;
        vy = (Math.random() - 0.5) * 2;
    }
    
    return { x, y, vx, vy, size: 30 + Math.random() * 20, color: '#7f8c8d' };
}

function createParticle(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            color
        });
    }
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
    if (!gameActive) return;

    // Player movement
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();

    // Spawn stars
    if (stars.length < 5) {
        stars.push(createStar());
    }

    // Spawn obstacles
    frameCount++;
    if (frameCount % 120 === 0) {
        obstacles.push(createObstacle());
    }

    // Update obstacles
    obstacles.forEach((obs, index) => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        if (obs.x < -100 || obs.x > canvas.width + 100 || obs.y < -100 || obs.y > canvas.height + 100) {
            obstacles.splice(index, 1);
        }
    });

    // Update particles
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(index, 1);
    });

    // Collision check: Player & Stars
    stars.forEach((star, index) => {
        const dist = Math.hypot(player.x - star.x, player.y - star.y);
        if (dist < player.radius + star.radius) {
            score++;
            scoreEl.innerText = `Stars: ${score}`;
            createParticle(star.x, star.y, star.color);
            stars.splice(index, 1);
            stars.push(createStar());
        }
    });

    // Collision check: Player & Obstacles
    obstacles.forEach(obs => {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < player.radius + obs.size/2) {
            gameOver();
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Trail
    if (player.trail.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < player.trail.length; i++) {
            const pos = player.trail[i];
            const colorIdx = Math.floor((i / player.trail.length) * colors.length);
            ctx.strokeStyle = colors[colorIdx];
            ctx.beginPath();
            ctx.moveTo(player.trail[i-1]?.x || pos.x, player.trail[i-1]?.y || pos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    }

    // Draw Stars
    stars.forEach(star => {
        star.pulse += 0.1;
        const r = star.radius + Math.sin(star.pulse) * 2;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Star Glow
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 3);
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(obs.x - obs.size/2, obs.y - obs.size/2, obs.size, obs.size, 8);
        ctx.fill();
    });

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    requestAnimationFrame(draw);
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('rrr_highscore', highScore);
        highScoreEl.innerText = `Best: ${highScore}`;
    }
    overlay.style.display = 'flex';
    overlay.querySelector('h1').innerText = 'Oh Noes! 🌸';
    overlay.querySelector('p').innerText = `You collected ${score} stars!`;
    startBtn.innerText = 'Try Again! ✨';
}

function startGame() {
    score = 0;
    scoreEl.innerText = `Stars: ${score}`;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.trail = [];
    stars = [];
    obstacles = [];
    particles = [];
    frameCount = 0;
    
    for (let i = 0; i < 5; i++) {
        stars.push(createStar());
    }
    
    gameActive = true;
    overlay.style.display = 'none';
}

startBtn.addEventListener('click', startGame);

// Animation loop
updateLoop();
function updateLoop() {
    update();
    requestAnimationFrame(updateLoop);
}

// Draw loop
draw();
