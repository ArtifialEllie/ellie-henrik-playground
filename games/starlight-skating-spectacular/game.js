const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameActive = true;
let animationFrameId;

// Game Settings
const PLAYER_SIZE = 40;
const STAR_SIZE = 20;
const ICE_COLOR = 'rgba(200, 230, 255, 0.3)';
const PLAYER_COLOR = '#ff00ff';

// Game State
let player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    radius: PLAYER_SIZE / 2,
    trail: []
};

let stars = [];
let obstacles = [];
let particles = [];

function init() {
    resize();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.targetX = player.x;
    player.targetY = player.y;
    score = 0;
    gameActive = true;
    stars = [];
    obstacles = [];
    particles = [];
    
    scoreElement.innerText = `Stars: ${score}`;
    messageElement.innerText = 'Skate through the stars! ✨';
    overlay.classList.add('hidden');
    
    spawnStar();
    spawnObstacle();
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

// Input
window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    player.targetX = e.touches[0].clientX;
    player.targetY = e.touches[0].clientY;
}, { passive: false });

function spawnStar() {
    stars.push({
        x: Math.random() * (canvas.width - STAR_SIZE),
        y: Math.random() * (canvas.height - STAR_SIZE),
        size: STAR_SIZE + Math.random() * 10,
        pulse: 0,
        pulseDir: 1
    });
}

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 20 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function update() {
    if (!gameActive) return;

    // Smooth player movement
    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;

    // Trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();

    // Update stars
    stars.forEach((star, index) => {
        star.pulse += 0.1 * star.pulseDir;
        if (star.pulse > 1 || star.pulse < 0) star.pulseDir *= -1;

        const dx = player.x - star.x;
        const dy = player.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + star.size / 2) {
            score++;
            scoreElement.innerText = `Stars: ${score}`;
            createParticles(star.x, star.y, '#fff');
            stars.splice(index, 1);
            spawnStar();
            
            if (score % 10 === 0) {
                spawnObstacle();
                messageElement.innerText = 'Whoa! More obstacles! ⛸️';
                setTimeout(() => {
                    messageElement.innerText = 'Keep skating! ✨';
                }, 2000);
            }
        }
    });

    // Update obstacles
    obstacles.forEach((obs, index) => {
        obs.x += obs.vx;
        obs.y += obs.vy;

        if (obs.x < 0 || obs.x > canvas.width) obs.vx *= -1;
        if (obs.y < 0 || obs.y > canvas.height) obs.vy *= -1;

        const dx = player.x - obs.x;
        const dy = player.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + obs.radius) {
            gameOver();
        }
    });

    // Update particles
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(index, 1);
    });
}

function draw() {
    // Clear screen with a faint trail effect
    ctx.fillStyle = 'rgba(15, 12, 41, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw "ice" sparkles
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(Date.now() * 0.001 + i * 1.2) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(player.trail[0]?.x || player.x, player.trail[0]?.y || player.y);
    player.trail.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Draw Player (Skater)
    ctx.shadowBlur = 15;
    ctx.shadowColor = PLAYER_COLOR;
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Stars
    stars.forEach(star => {
        const s = star.size + Math.sin(star.pulse * Math.PI) * 5;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10 + star.pulse * 10;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, s / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = `You collected ${score} stars!`;
    overlay.classList.remove('hidden');
}

function gameLoop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', () => {
    init();
});

init();
