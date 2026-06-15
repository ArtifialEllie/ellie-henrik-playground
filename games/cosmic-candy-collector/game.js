const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let score = 0;
let lives = 3;
let gameActive = false;
let candies = [];
let hazards = [];
let particles = [];
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: '#ffccff'
};

const candyTypes = [
    { color: '#ff00ff', value: 10, symbol: '🍬' },
    { color: '#00ffff', value: 20, symbol: '🍭' },
    { color: '#ffff00', value: 50, symbol: '⭐' },
];

const hazardTypes = [
    { color: '#555555', symbol: '☁️' },
    { color: '#ff0000', symbol: '⚡' },
];

function spawnCandy() {
    const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
    candies.push({
        x: Math.random() * canvas.width,
        y: -50,
        radius: 15,
        speed: 2 + Math.random() * 3,
        ...type
    });
}

function spawnHazard() {
    const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
    hazards.push({
        x: Math.random() * canvas.width,
        y: -50,
        radius: 20,
        speed: 3 + Math.random() * 4,
        ...type
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 5,
            color: color,
            life: 1.0
        });
    }
}

function update() {
    if (!gameActive) return;

    // Player movement
    player.x = canvas.width / 2; // Centered horizontally for simplicity in this version
    // Use mouse/touch position for Y axis
    // Note: In a real game, we'd want to track mouse position.
}

// We need mouse tracking
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateLogic() {
    if (!gameActive) return;

    player.x = mouseX;
    player.y = mouseY;

    candies.forEach((candy, index) => {
        candy.y += candy.speed;
        if (candy.y > canvas.height + 50) {
            candies.splice(index, 1);
        }
        
        const dist = Math.hypot(player.x - candy.x, player.y - candy.y);
        if (dist < player.radius + candy.radius) {
            score += candy.value;
            scoreElement.innerText = `Poeng: ${score}`;
            createParticles(candy.x, candy.y, candy.color);
            candies.splice(index, 1);
        }
    });

    hazards.forEach((hazard, index) => {
        hazard.y += hazard.speed;
        if (hazard.y > canvas.height + 50) {
            hazards.splice(index, 1);
        }

        const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
        if (dist < player.radius + hazard.radius) {
            lives--;
            livesElement.innerText = `Liv: ${'❤️'.repeat(lives)}`;
            createParticles(hazard.x, hazard.y, '#ff0000');
            hazards.splice(index, 1);
            if (lives <= 0) {
                endGame();
            }
        }
    });

    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });

    if (Math.random() < 0.02) spawnCandy();
    if (Math.random() < 0.01) spawnHazard();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.closePath();

    // Draw Candies
    candies.forEach(candy => {
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(candy.symbol, candy.x, candy.y);
    });

    // Draw Hazards
    hazards.forEach(hazard => {
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hazard.symbol, hazard.x, hazard.y);
    });

    // Draw Particles
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${parseInt(particle.color.slice(1, 3), 16)*255/255}, 
                                 ${parseInt(particle.color.slice(3, 5), 16)*255/255}, 
                                 ${parseInt(particle.color.slice(5, 7), 16)*255/255}, 
                                 ${particle.life})`;
        // Simple hex to rgba conversion for transparency
        ctx.fill();
        ctx.closePath();
    });
    
    // Fixing particle color logic
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1.0;
}

function gameLoop() {
    updateLogic();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    scoreElement.innerText = `Poeng: 0`;
    livesElement.innerText = `Liv: ❤️❤️❤️`;
    candies = [];
    hazards = [];
    particles = [];
    gameActive = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = `Du samlet ${score} kosmiske godbiter!`;
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
