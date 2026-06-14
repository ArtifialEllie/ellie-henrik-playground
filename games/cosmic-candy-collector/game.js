const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

let score = 0;
let timeLeft = 30;
let gameActive = false;
let candies = [];
let obstacles = [];
let particles = [];
let player = {
    x: 0,
    y: 0,
    radius: 20,
    color: '#ffeb3b',
    targetX: 0,
    targetY: 0,
    speed: 0.15
};

const CANDY_COLORS = ['#ff69b4', '#00ffff', '#ffeb3b', '#7fff00', '#ff4500', '#da70d6'];
const OBSTACLE_COLOR = '#8b4513';

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.targetX = player.x;
    player.targetY = player.y;
}

window.addEventListener('resize', resize);
resize();

// Input handling
window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    player.targetX = e.touches[0].clientX;
    player.targetY = e.touches[0].clientY;
}, { passive: false });

function spawnCandy() {
    const radius = 10 + Math.random() * 10;
    candies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: radius,
        color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
        pulse: 0
    });
}

function spawnObstacle() {
    const radius = 15 + Math.random() * 15;
    obstacles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: radius,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3,
            color: color,
            life: 1.0
        });
    }
}

function update() {
    if (!gameActive) return;

    // Move player smoothly towards target
    player.x += (player.targetX - player.x) * player.speed;
    player.y += (player.targetY - player.y) * player.speed;

    // Update candies
    candies.forEach((candy, index) => {
        candy.pulse += 0.05;
        
        const dx = player.x - candy.x;
        const dy = player.y - candy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + candy.radius) {
            score++;
            scoreElement.textContent = score;
            createParticles(candy.x, candy.y, candy.color);
            candies.splice(index, 1);
            spawnCandy();
        }
    });

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x += obstacle.vx;
        obstacle.y += obstacle.vy;

        if (obstacle.x < 0 || obstacle.x > canvas.width) obstacle.vx *= -1;
        if (obstacle.y < 0 || obstacle.y > canvas.height) obstacle.vy *= -1;

        const dx = player.x - obstacle.x;
        const dy = player.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + obstacle.radius) {
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

    // Timer
    timeLeft -= 1/60;
    timerElement.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 0) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw candies
    candies.forEach(candy => {
        const pulseSize = candy.radius + Math.sin(candy.pulse) * 3;
        ctx.fillStyle = candy.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = candy.color;
        ctx.beginPath();
        ctx.arc(candy.x, candy.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw obstacles
    obstacles.forEach(obstacle => {
        ctx.fillStyle = OBSTACLE_COLOR;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        // Add some crater detail
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(obstacle.x - 5, obstacle.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player eyes
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x - 7, player.y - 5, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 7, player.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
}

function gameOver() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').textContent = "Time's Up! 🍭";
    document.getElementById('description').textContent = `You collected ${score} candies in the cosmic void! ✨`;
    startButton.textContent = 'Try Again! 🌈';
}

function startGame() {
    score = 0;
    timeLeft = 30;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    candies = [];
    obstacles = [];
    particles = [];
    
    for (let i = 0; i < 5; i++) spawnCandy();
    for (let i = 0; i < 3; i++) spawnObstacle();
    
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameActive) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

startButton.addEventListener('click', startGame);
