const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

let score = 0;
let highScore = localStorage.getItem('neon-nebula-highscore') || 0;
highScoreElement.innerText = `Best: ${highScore}`;

let gameActive = false;
let animationId;

// Player settings
const player = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    color: '#00f2ff',
    speed: 7,
    vx: 0,
    vy: 0,
    friction: 0.95
};

const keys = {};
const obstacles = [];
const particles = [];
const stars = [];

// Setup stars for background
function initStars() {
    stars.length = 0;
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function spawnObstacle() {
    const size = Math.random() * 40 + 20;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;

    if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -size;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 2 + 1;
    } else if (side === 1) { // Right
        x = canvas.width + size;
        y = Math.random() * canvas.height;
        vx = -(Math.random() * 2 + 1);
        vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + size;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 2 + 1);
    } else { // Left
        x = -size;
        y = Math.random() * canvas.height;
        vx = Math.random() * 2 + 1;
        vy = (Math.random() - 0.5) * 2;
    }

    obstacles.push({
        x, y, size,
        vx, vy,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.02,
            color
        });
    }
}

function update() {
    if (!gameActive) return;

    // Player movement (with slight drift/momentum)
    if (keys['ArrowUp'] || keys['KeyW']) player.vy -= player.speed * 0.1;
    if (keys['ArrowDown'] || keys['KeyS']) player.vy += player.speed * 0.1;
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= player.speed * 0.1;
    if (keys['ArrowRight'] || keys['KeyD']) player.vx += player.speed * 0.1;

    player.vx *= player.friction;
    player.vy *= player.friction;
    player.x += player.vx;
    player.y += player.vy;

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

    // Obstacles
    if (Math.random() < 0.03) spawnObstacle();

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x += obs.vx;
        obs.y += obs.vy;
        obs.rotation += obs.rotationSpeed;

        // Collision detection
        if (
            player.x < obs.x + obs.size &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.size &&
            player.y + player.height > obs.y
        ) {
            gameOver();
        }

        // Remove off-screen obstacles
        if (obs.x < -100 || obs.x > canvas.width + 100 || obs.y < -100 || obs.y > canvas.height + 100) {
            obstacles.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    score += 1;
    scoreElement.innerText = `Score: ${Math.floor(score / 10)}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;

    // Player (Neon Triangle)
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Rotation based on velocity
    const angle = Math.atan2(player.vy, player.vx);
    ctx.rotate(angle + Math.PI / 4);
    
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Obstacles (Neon Boxes)
    obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x + obs.size / 2, obs.y + obs.size / 2);
        ctx.rotate(obs.rotation);
        ctx.strokeStyle = obs.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obs.color;
        ctx.strokeRect(-obs.size / 2, -obs.size / 2, obs.size, obs.size);
        ctx.restore();
    });

    if (gameActive) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function gameLoop() {
    update();
    draw();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    const finalScore = Math.floor(score / 10);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('neon-nebula-highscore', highScore);
        highScoreElement.innerText = `Best: ${highScore}`;
    }

    createExplosion(player.x + player.width / 2, player.y + player.height / 2, player.color);
    
    // Brief delay before showing overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        overlay.querySelector('h1').innerText = 'Nebula Crash! 💥';
        overlay.querySelector('p').innerText = `Your drift score: ${finalScore}`;
        overlay.querySelector('button').innerText = 'Try Again! ✨';
    }, 500);
}

function startGame() {
    score = 0;
    obstacles.length = 0;
    particles.length = 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
    player.vx = 0;
    player.vy = 0;
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    gameLoop();
}

startBtn.addEventListener('click', startGame);
