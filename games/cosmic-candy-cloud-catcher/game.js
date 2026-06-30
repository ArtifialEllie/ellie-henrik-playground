const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let lives = 3;
let gameActive = false;
let candies = [];
let particles = [];
let cloud = {
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    targetX: 0
};

const CANDY_TYPES = [
    { color: '#ff79c6', points: 10, name: 'Strawberry Sparkle', radius: 15 },
    { color: '#8be9fd', points: 20, name: 'Blueberry Bliss', radius: 12 },
    { color: '#50fa7b', points: 30, name: 'Lime Lustre', radius: 10 },
    { color: '#ffb86c', points: 50, name: 'Golden Glow', radius: 8 },
    { color: '#bd93f9', points: 100, name: 'Mystic Mint', radius: 6 },
];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cloud.y = canvas.height - 80;
    cloud.x = canvas.width / 2 - cloud.width / 2;
}

window.addEventListener('resize', resize);
resize();

function spawnCandy() {
    if (!gameActive) return;
    const type = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
    candies.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -30,
        type: type,
        speed: 2 + Math.random() * 3 + (score / 500),
        angle: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
    
    setTimeout(spawnCandy, Math.max(300, 1000 - (score / 10)));
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function update() {
    if (!gameActive) return;

    // Smooth cloud movement
    cloud.x += (cloud.targetX - cloud.x) * 0.15;

    // Update candies
    for (let i = candies.length - 1; i >= 0; i--) {
        const candy = candies[i];
        candy.y += candy.speed;
        candy.angle += candy.rotationSpeed;

        // Collision detection
        if (candy.y + candy.type.radius > cloud.y && 
            candy.y < cloud.y + cloud.height &&
            candy.x > cloud.x && 
            candy.x < cloud.x + cloud.width) {
            
            score += candy.type.points;
            scoreElement.innerText = `Score: ${score}`;
            createParticles(candy.x, candy.y, candy.type.color);
            candies.splice(i, 1);
            continue;
        }

        // Missed candy
        if (candy.y > canvas.height) {
            lives--;
            livesElement.innerText = `Lives: ${'❤️'.repeat(Math.max(0, lives))}`;
            candies.splice(i, 1);
            if (lives <= 0) endGame();
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 1.1) * 0.5 + 0.5) * canvas.height;
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Draw Cloud
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cloud.x + 30, cloud.y + 30, 30, 0, Math.PI * 2);
    ctx.arc(cloud.x + 60, cloud.y + 20, 35, 0, Math.PI * 2);
    ctx.arc(cloud.x + 90, cloud.y + 30, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw Candies
    candies.forEach(candy => {
        ctx.save();
        ctx.translate(candy.x, candy.y);
        ctx.rotate(candy.angle);
        
        ctx.fillStyle = candy.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, candy.type.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Candy shine
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-candy.type.radius * 0.3, -candy.type.radius * 0.3, candy.type.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(draw);
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function startGame() {
    score = 0;
    lives = 3;
    candies = [];
    particles = [];
    scoreElement.innerText = `Score: 0`;
    livesElement.innerText = `Lives: ❤️❤️❤️`;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameActive = true;
    spawnCandy();
    // loop doesn't start here because draw() is called initially
}

// Input handling
window.addEventListener('mousemove', (e) => {
    cloud.targetX = e.clientX - cloud.width / 2;
});

window.addEventListener('touchmove', (e) => {
    cloud.targetX = e.touches[0].clientX - cloud.width / 2;
    e.preventDefault();
}, { passive: false });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start loop
resize();
draw();
updateLoop();

function updateLoop() {
    update();
    setTimeout(updateLoop, 1000 / 60);
}
