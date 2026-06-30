const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const messageDiv = document.getElementById('message');

let score = 0;
let highScore = localStorage.getItem('dewdrop-high-score') || 0;
let gameActive = false;
let animationId;

// Game settings
const PLAYER_RADIUS = 20;
const DEWDROP_RADIUS = 10;
const CLOUD_RADIUS = 25;
const BASE_SPAWN_RATE = 0.02; 
const BASE_CLOUD_SPAWN_RATE = 0.01;

let player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    color: '#ff69b4',
    trail: []
};

let entities = [];
let particles = [];

highScoreElement.innerText = `Best: ${highScore}`;

function resize() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.targetX = player.x;
    player.targetY = player.y;
}

window.addEventListener('resize', resize);
resize();

// Input handling
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.targetY = e.clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.targetX = touch.clientX - rect.left;
    player.targetY = touch.clientY - rect.top;
}, { passive: false });

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            color: color,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.02
        });
    }
}

function spawnEntity() {
    const type = Math.random() < 0.7 ? 'dewdrop' : 'cloud';
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    // Speed increases with score
    const speedMult = 1 + (score * 0.02);

    if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -30;
        vx = (Math.random() - 0.5) * 2 * speedMult;
        vy = (Math.random() * 2 + 1) * speedMult;
    } else if (side === 1) { // Right
        x = canvas.width + 30;
        y = Math.random() * canvas.height;
        vx = -(Math.random() * 2 + 1) * speedMult;
        vy = (Math.random() - 0.5) * 2 * speedMult;
    } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 30;
        vx = (Math.random() - 0.5) * 2 * speedMult;
        vy = -(Math.random() * 2 + 1) * speedMult;
    } else { // Left
        x = -30;
        y = Math.random() * canvas.height;
        vx = (Math.random() * 2 + 1) * speedMult;
        vy = (Math.random() - 0.5) * 2 * speedMult;
    }

    entities.push({
        type,
        x, y, vx, vy,
        radius: type === 'dewdrop' ? DEWDROP_RADIUS : CLOUD_RADIUS,
        color: type === 'dewdrop' ? `hsl(${Math.random() * 360}, 100%, 80%)` : '#ddd',
        pulse: 0,
        pulseSpeed: Math.random() * 0.1 + 0.05
    });
}

function drawPlayer() {
    // Draw trail
    ctx.save();
    player.trail.forEach((pos, i) => {
        const opacity = i / player.trail.length;
        const size = PLAYER_RADIUS * opacity;
        ctx.fillStyle = player.color;
        ctx.globalAlpha = opacity * 0.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, PLAYER_RADIUS);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.4, player.color);
    gradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawEntity(e) {
    ctx.save();
    if (e.type === 'dewdrop') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, e.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + Math.sin(e.pulse) * 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.arc(e.x - e.radius * 0.6, e.y, e.radius * 0.8, 0, Math.PI * 2);
        ctx.arc(e.x + e.radius * 0.6, e.y, e.radius * 0.8, 0, Math.PI * 2);
        ctx.arc(e.x, e.y - e.radius * 0.5, e.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(e.x - 5, e.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(e.x + 5, e.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function update() {
    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;
    
    // Update trail
    player.trail.push({x: player.x, y: player.y});
    if (player.trail.length > 10) player.trail.shift();

    const currentSpawnRate = BASE_SPAWN_RATE * (1 + score * 0.01);
    const currentCloudRate = BASE_CLOUD_SPAWN_RATE * (1 + score * 0.01);

    if (Math.random() < currentSpawnRate) spawnEntity();
    if (Math.random() < currentCloudRate) spawnEntity();

    entities.forEach((e, index) => {
        e.x += e.vx;
        e.y += e.vy;
        e.pulse += e.pulseSpeed;

        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < e.radius + PLAYER_RADIUS) {
            if (e.type === 'dewdrop') {
                score++;
                scoreElement.innerText = `Score: ${score}`;
                createParticles(e.x, e.y, e.color);
                entities.splice(index, 1);
                scoreElement.style.transform = 'scale(1.2)';
                setTimeout(() => scoreElement.style.transform = 'scale(1)', 100);
            } else {
                gameOver();
            }
        }

        if (e.x < -100 || e.x > canvas.width + 100 || e.y < -100 || e.y > canvas.height + 100) {
            entities.splice(index, 1);
        }
    });

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(index, 1);
    });
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dewdrop-high-score', highScore);
        highScoreElement.innerText = `Best: ${highScore}`;
    }
    
    messageDiv.innerHTML = `
        <h1>Oopsie! ☁️</h1>
        <p>You hit a grumpy cloud!<br>Your score was ${score} ✨</p>
        <button id="start-btn-restart" class="start-btn">Start Magic! 🌈</button>
    `;
    
    const restartBtn = document.getElementById('start-btn-restart');
    restartBtn.onclick = () => {
        startGame();
    };
    
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    overlay.style.display = 'flex';
}

function startGame() {
    score = 0;
    scoreElement.innerText = `Score: ${score}`;
    entities = [];
    particles = [];
    player.trail = [];
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    
    resize();
    gameLoop();
}

function gameLoop() {
    if (!gameActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    update();
    drawParticles();
    drawPlayer();
    entities.forEach(drawEntity);
    
    animationId = requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => {
    startGame();
}
