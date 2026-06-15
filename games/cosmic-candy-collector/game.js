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
let combo = 0;
let comboTimer = 0;
let difficultyMultiplier = 1;
let startTime = 0;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: '#ffccff',
    trail: [],
    shielded: false,
    shieldTimer: 0
};

const candyTypes = [
    { color: '#ff00ff', value: 10, symbol: '🍬', weight: 0.6 },
    { color: '#00ffff', value: 20, symbol: '🍭', weight: 0.3 },
    { color: '#ffff00', value: 50, symbol: '⭐', weight: 0.1 },
    { color: '#ffffff', value: 0, symbol: '🛡️', weight: 0.05, isPowerUp: true },
];

const hazardTypes = [
    { color: '#555555', symbol: '☁️' },
    { color: '#ff0000', symbol: '⚡' },
];

function spawnCandy() {
    const rand = Math.random();
    let cumulativeWeight = 0;
    let type = candyTypes[0];

    for (const t of candyTypes) {
        cumulativeWeight += t.weight || 0.1;
        if (rand < cumulativeWeight) {
            type = t;
            break;
        }
    }

    candies.push({
        x: Math.random() * canvas.width,
        y: -50,
        radius: 15,
        speed: (2 + Math.random() * 3) * difficultyMultiplier,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        ...type
    });
}

function spawnHazard() {
    const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
    hazards.push({
        x: Math.random() * canvas.width,
        y: -50,
        radius: 20,
        speed: (3 + Math.random() * 4) * difficultyMultiplier,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        ...type
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            radius: Math.random() * 4,
            color: color,
            life: 1.0
        });
    }
}

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateLogic() {
    if (!gameActive) return;

    const currentTime = Date.now();
    const elapsed = (currentTime - startTime) / 1000;
    difficultyMultiplier = 1 + elapsed * 0.05;

    player.x = mouseX;
    player.y = mouseY;

    // Update trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 15) player.trail.shift();

    if (player.shieldTimer > 0) {
        player.shieldTimer--;
        if (player.shieldTimer <= 0) player.shielded = false;
    }

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            combo = 0;
        }
    }

    candies.forEach((candy, index) => {
        candy.y += candy.speed;
        candy.rotation += candy.rotationSpeed;
        if (candy.y > canvas.height + 50) {
            candies.splice(index, 1);
        }
        
        const dist = Math.hypot(player.x - candy.x, player.y - candy.y);
        if (dist < player.radius + candy.radius) {
            if (candy.isPowerUp) {
                player.shielded = true;
                player.shieldTimer = 300; // ~5 seconds at 60fps
                createParticles(candy.x, candy.y, '#ffffff');
            } else {
                combo++;
                comboTimer = 60;
                const comboBonus = Math.floor(combo / 5) * 5;
                score += candy.value + comboBonus;
                createParticles(candy.x, candy.y, candy.color);
            }
            scoreElement.innerText = `Poeng: ${score}${combo > 1 ? ` (Combo x${combo}!)` : ''}`;
            candies.splice(index, 1);
        }
    });

    hazards.forEach((hazard, index) => {
        hazard.y += hazard.speed;
        hazard.rotation += hazard.rotationSpeed;
        if (hazard.y > canvas.height + 50) {
            hazards.splice(index, 1);
        }

        const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
        if (dist < player.radius + hazard.radius) {
            if (player.shielded) {
                player.shielded = false;
                player.shieldTimer = 0;
                createParticles(hazard.x, hazard.y, '#ffffff');
                hazards.splice(index, 1);
                combo = 0;
            } else {
                lives--;
                livesElement.innerText = `Liv: ${'❤️'.repeat(lives)}`;
                createParticles(hazard.x, hazard.y, '#ff0000');
                hazards.splice(index, 1);
                combo = 0;
                if (lives <= 0) {
                    endGame();
                }
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

    if (Math.random() < 0.03 * difficultyMultiplier) spawnCandy();
    if (Math.random() < 0.015 * difficultyMultiplier) spawnHazard();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player Trail
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = player.color;
    for (let i = 0; i < player.trail.length; i++) {
        const pos = player.trail[i];
        const alpha = i / player.trail.length;
        ctx.globalAlpha = alpha;
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.globalAlpha = 1.0;

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.closePath();

    if (player.shielded) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
    }

    // Draw Candies
    candies.forEach(candy => {
        ctx.save();
        ctx.translate(candy.x, candy.y);
        ctx.rotate(candy.rotation);
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(candy.symbol, 0, 0);
        ctx.restore();
    });

    // Draw Hazards
    hazards.forEach(hazard => {
        ctx.save();
        ctx.translate(hazard.x, hazard.y);
        ctx.rotate(hazard.rotation);
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hazard.symbol, 0, 0);
        ctx.restore();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

function gameLoop() {
    updateLogic();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    combo = 0;
    difficultyMultiplier = 1;
    startTime = Date.now();
    scoreElement.innerText = `Poeng: 0`;
    livesElement.innerText = `Liv: ❤️❤️❤️`;
    candies = [];
    hazards = [];
    particles = [];
    player.trail = [];
    player.shielded = false;
    player.shieldTimer = 0;
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
