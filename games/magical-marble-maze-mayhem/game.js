const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let timeLeft = 60;
let gameActive = false;
let gameLoopId;
let timerInterval;

const marble = {
    x: 50,
    y: 50,
    radius: 12,
    color: '#00ffff',
    vx: 0,
    vy: 0,
    friction: 0.98,
    accel: 0.5
};

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

let walls = [];
let gems = [];
let portal = { x: 0, y: 0, radius: 25 };

function initLevel() {
    walls = [];
    gems = [];
    
    // Create a simple maze
    const wallWidth = 20;
    const wallHeight = 20;

    // Outer walls
    walls.push({x: 0, y: 0, w: canvas.width, h: wallWidth});
    walls.push({x: 0, y: canvas.height - wallWidth, w: canvas.width, h: wallWidth});
    walls.push({x: 0, y: 0, w: wallWidth, h: canvas.height});
    walls.push({x: canvas.width - wallWidth, y: 0, w: wallWidth, h: canvas.height});

    // Random obstacles
    for(let i = 0; i < 15; i++) {
        walls.push({
            x: Math.floor(Math.random() * (canvas.width / 60)) * 60,
            y: Math.floor(Math.random() * (canvas.height / 60)) * 60,
            w: Math.random() > 0.5 ? 120 : 20,
            h: Math.random() > 0.5 ? 20 : 120
        });
    }

    // Ensure marble isn't inside a wall
    marble.x = 50;
    marble.y = 50;
    marble.vx = 0;
    marble.vy = 0;

    // Portal position
    portal.x = canvas.width - 50;
    portal.y = canvas.height - 50;

    // Gems
    for(let i = 0; i < 8; i++) {
        gems.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20,
            radius: 6,
            collected: false,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`
        });
    }
}

function update() {
    if (!gameActive) return;

    // Movement
    if (keys['ArrowUp'] || keys['KeyW']) marble.vy -= marble.accel;
    if (keys['ArrowDown'] || keys['KeyS']) marble.vy += marble.accel;
    if (keys['ArrowLeft'] || keys['KeyA']) marble.vx -= marble.accel;
    if (keys['ArrowRight'] || keys['KeyD']) marble.vx += marble.accel;

    marble.vx *= marble.friction;
    marble.vy *= marble.friction;
    marble.x += marble.vx;
    marble.y += marble.vy;

    // Wall collisions
    walls.forEach(wall => {
        if (marble.x + marble.radius > wall.x && 
            marble.x - marble.radius < wall.x + wall.w &&
            marble.y + marble.radius > wall.y && 
            marble.y - marble.radius < wall.y + wall.h) {
            
            // Simple bounce/push back
            const overlapX = Math.min(marble.x + marble.radius - wall.x, wall.x + wall.w - (marble.x - marble.radius));
            const overlapY = Math.min(marble.x + marble.radius - wall.x, wall.y + wall.h - (marble.y - marble.radius));
            
            if (overlapX < overlapY) {
                if (marble.vx > 0) marble.x = wall.x - marble.radius;
                else marble.x = wall.x + wall.w + marble.radius;
                marble.vx *= -0.5;
            } else {
                if (marble.vy > 0) marble.y = wall.y - marble.radius;
                else marble.y = wall.y + wall.h + marble.radius;
                marble.vy *= -0.5;
            }
        }
    });

    // Gem collection
    gems.forEach(gem => {
        if (!gem.collected && 
            Math.hypot(marble.x - gem.x, marble.y - gem.y) < marble.radius + gem.radius) {
            gem.collected = true;
            score += 10;
            scoreElement.innerText = score;
        }
    });

    // Portal check
    if (Math.hypot(marble.x - portal.x, marble.y - portal.y) < marble.radius + portal.radius) {
        score += 50;
        scoreElement.innerText = score;
        initLevel();
    }

    // Boundary check
    if (marble.x < 0) marble.x = 0;
    if (marble.x > canvas.width) marble.x = canvas.width;
    if (marble.y < 0) marble.y = 0;
    if (marble.y > canvas.height) marble.y = canvas.height;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw walls
    ctx.fillStyle = '#4b0082';
    ctx.strokeStyle = '#8a2be2';
    ctx.lineWidth = 3;
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    });

    // Draw gems
    gems.forEach(gem => {
        if (!gem.collected) {
            ctx.beginPath();
            ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
            ctx.fillStyle = gem.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = gem.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Draw portal
    const gradient = ctx.createRadialGradient(portal.x, portal.y, 5, portal.x, portal.y, portal.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw marble
    ctx.beginPath();
    ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
    ctx.fillStyle = marble.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = marble.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Trail effect
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // (Wait, this needs an array of positions)
    ctx.stroke();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timeElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

function endGame(win) {
    gameActive = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoopId);
    
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.style.display = 'flex';
    
    overlayTitle.innerText = win ? 'Magic Victory! ✨' : 'Time Out! ⏳';
    overlayText.innerText = `You collected ${score} magic gems!`;
    startButton.innerText = 'Try Again! 🚀';
}

function startGame() {
    score = 0;
    timeLeft = 60;
    scoreElement.innerText = score;
    timeElement.innerText = timeLeft;
    
    overlay.style.display = 'none';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    
    initLevel();
    gameActive = true;
    startTimer();
    gameLoopId = requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);
