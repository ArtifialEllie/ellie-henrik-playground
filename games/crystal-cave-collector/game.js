const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let timeLeft = 60;
let gameActive = false;
let player = {
    x: 400,
    y: 300,
    size: 30,
    speed: 5,
    color: '#00ffff'
};

let crystals = [];
let particles = [];
let keys = {};

const CRYSTAL_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff8000'];

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function spawnCrystal() {
    const size = 15 + Math.random() * 10;
    crystals.push({
        x: Math.random() * (canvas.width - size),
        y: Math.random() * (canvas.height - size),
        size: size,
        color: CRYSTAL_COLORS[Math.floor(Math.random() * CRYSTAL_COLORS.length)],
        pulse: 0
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

    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

    // Boundary checks
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Update crystals
    crystals.forEach((crystal, index) => {
        crystal.pulse += 0.1;
        
        // Collision detection
        if (player.x < crystal.x + crystal.size &&
            player.x + player.size > crystal.x &&
            player.y < crystal.y + crystal.size &&
            player.y + player.size > crystal.y) {
            
            score += 10;
            scoreElement.innerText = `Krystaller: ${score}`;
            createParticles(crystal.x + crystal.size/2, crystal.y + crystal.size/2, crystal.color);
            crystals.splice(index, 1);
            spawnCrystal();
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player (glittery sphere)
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.closePath();

    // Draw crystals (diamond shape)
    crystals.forEach(crystal => {
        const pulseSize = crystal.size * (1 + Math.sin(crystal.pulse) * 0.1);
        ctx.beginPath();
        ctx.moveTo(crystal.x + pulseSize/2, crystal.y);
        ctx.lineTo(crystal.x + pulseSize, crystal.y + pulseSize/2);
        ctx.lineTo(crystal.x + pulseSize/2, crystal.y + pulseSize);
        ctx.lineTo(crystal.x, crystal.y + pulseSize/2);
        ctx.closePath();
        ctx.fillStyle = crystal.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = crystal.color;
        ctx.fill();
    });

    // Draw particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.life})`;
        ctx.fill();
    });

    ctx.shadowBlur = 0;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        timerElement.innerText = `Tid: ${timeLeft}`;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('message').innerHTML = `
        <h1>Tiden er ute! 💎</h1>
        <p>Du samlet ${score} magiske krystaller!</p>
        <button id="restart-btn" onclick="location.reload()">Prøv igjen! ✨</button>
    `;
}

startBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    gameActive = true;
    score = 0;
    timeLeft = 60;
    
    // Spawn initial crystals
    crystals = [];
    for (let i = 0; i < 5; i++) {
        spawnCrystal();
    }
    
    startTimer();
    gameLoop();
});
