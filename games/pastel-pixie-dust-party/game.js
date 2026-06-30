const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let animationId;
let timerInterval;

const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: '#ff69b4',
    trail: []
};

const dustParticles = [];
const clouds = [];
const colors = ['#FFB6C1', '#FFD700', '#B0E0E6', '#98FB98', '#E6E6FA', '#FFC0CB'];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function spawnDust() {
    dustParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: 0,
        pulseSpeed: Math.random() * 0.1 + 0.05
    });
}

function spawnCloud() {
    clouds.push({
        x: -100,
        y: Math.random() * canvas.height,
        width: 80 + Math.random() * 60,
        height: 50 + Math.random() * 30,
        speed: Math.random() * 2 + 1
    });
}

function update() {
    if (!gameActive) return;

    // Player trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 10) player.trail.shift();

    // Dust collection
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const d = dustParticles[i];
        d.pulse += d.pulseSpeed;
        
        const dist = Math.hypot(player.x - d.x, player.y - d.y);
        if (dist < player.radius + d.radius) {
            score++;
            scoreElement.innerText = score;
            dustParticles.splice(i, 1);
            spawnDust();
        }
    }

    // Cloud movement and collision
    for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.x += c.speed;
        if (c.x > canvas.width + 100) {
            clouds.splice(i, 1);
        } else {
            const distX = Math.max(c.x, Math.min(player.x, c.x + c.width));
            const distY = Math.max(c.y, Math.min(player.y, c.y + c.height));
            const dist = Math.hypot(player.x - distX, player.y - distY);
            
            if (dist < player.radius) {
                endGame();
            }
        }
    }

    // Maintain dust count
    while (dustParticles.length < 15) {
        spawnDust();
    }

    // Occasional cloud spawn
    if (Math.random() < 0.02) {
        spawnCloud();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 105, 180, 0.3)';
    ctx.lineWidth = player.radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < player.trail.length; i++) {
        ctx.lineTo(player.trail[i].x, player.trail[i].y);
    }
    ctx.stroke();

    // Draw dust
    dustParticles.forEach(d => {
        const pulseSize = d.radius + Math.sin(d.pulse) * 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = d.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw clouds
    clouds.forEach(c => {
        ctx.fillStyle = '#d3d3d3';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.height / 2, 0, Math.PI * 2);
        ctx.arc(c.x + c.width * 0.3, c.y - c.height * 0.2, c.height / 2, 0, Math.PI * 2);
        ctx.arc(c.x + c.width * 0.6, c.y, c.height / 2, 0, Math.PI * 2);
        ctx.arc(c.x + c.width * 0.8, c.y + c.height * 0.1, c.height / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player (The Pixie)
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff69b4';
    ctx.fill();
    
    // Pixie eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x - 7, player.y - 5, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 7, player.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x - 7, player.y - 4, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 7, player.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
}

// We'll use a separate loop for logic and rendering
function startAnimation() {
    function loop() {
        if (gameActive) {
            update();
        }
        draw();
        requestAnimationFrame(loop);
    }
    loop();
}

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    dustParticles.length = 0;
    clouds.length = 0;
    
    // Initial dust
    for (let i = 0; i < 15; i++) {
        spawnDust();
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

canvas.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
    player.y = e.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    player.x = e.touches[0].clientX;
    player.y = e.touches[0].clientY;
}, { passive: false });

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Start the render loop immediately, but update only when gameActive
startAnimation();
