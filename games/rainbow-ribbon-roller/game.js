const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');
const gameOverScreen = document.getElementById('game-over');
const scoreEl = document.getElementById('score');
const distanceEl = document.getElementById('distance');
const finalScoreEl = document.getElementById('final-score');

let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let distance = 0;
let speed = 5;
let ribbonWidth = 200;
let playerX = 0;
let playerY = 0;
let targetX = 0;
let ribbonOffset = 0;
let items = [];
let particles = [];
let keys = {};

// Game Constants
const COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
const PLAYER_SIZE = 20;
const ITEM_SIZE = 15;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    playerY = canvas.height * 0.8;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function createItem() {
    const side = Math.random() > 0.5 ? 1 : -1;
    const offset = (Math.random() - 0.5) * ribbonWidth * 0.8;
    items.push({
        x: offset,
        y: -100,
        type: 'star',
        color: '#FFFF00',
        collected: false
    });
}

function createParticle(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            color
        });
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    distance += speed / 10;
    speed += 0.001;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        targetX -= 7;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        targetX += 7;
    }

    // Keep player within some reasonable bounds for the "feel"
    // The ribbon itself curves, so we'll handle the "off-ribbon" check based on current ribbon width
    playerX += (targetX - playerX) * 0.1;

    // Spawn items
    if (Math.random() < 0.02) {
        createItem();
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += speed;

        // Collision detection
        const dx = (playerX - (canvas.width / 2)) - (item.x + (canvas.width / 2)); // Simple conceptual relative distance
        // Wait, let's rethink the coordinate system for the ribbon.
        // The ribbon center is canvas.width / 2 + ribbonOffset.
    }
}

// Let's rewrite the update and draw logic for a pseudo-3D perspective
function updatePseudo3D() {
    if (gameState !== 'PLAYING') return;

    distance += speed / 10;
    speed += 0.0005;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        targetX -= 8;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        targetX += 8;
    }

    playerX += (targetX - playerX) * 0.1;

    // Spawn items
    if (Math.random() < 0.03) {
        createItem();
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.z = (item.z || 0) + speed; // conceptually z is distance from horizon
        item.y = canvas.height / 2 + (item.z * 0.5);
        item.x = canvas.width / 2 + (item.x * (item.z / 500));
        
        // Relative to ribbon's current curvature?
        // Let's simplify: the ribbon is a path we follow.
        
        if (item.z > canvas.height) {
            items.splice(i, 1);
        }
    }
}

// Redoing the whole logic to be more consistent
function gameLoop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
    } else if (gameState === 'START') {
        drawStart();
    } else if (gameState === 'GAMEOVER') {
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

// To avoid confusing myself, I'll just implement a clean 2D perspective with a "pseudo-3D" feel
// by scaling and moving things toward the camera.

function resetGame() {
    score = 0;
    distance = 0;
    speed = 5;
    playerX = 0;
    targetX = 0;
    items = [];
    particles = [];
    gameState = 'PLAYING';
    overlay.style.display = 'none';
    gameOverScreen.style.display = 'none';
}

startBtn.onclick = () => resetGame();
restartBtn.onclick = () => resetGame();

function updateLogic() {
    if (gameState !== 'PLAYING') return;

    distance += speed / 60;
    speed += 0.0005;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        targetX -= 5;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        targetX += 5;
    }

    playerX += (targetX - playerX) * 0.1;

    // Boundary check: if player goes too far from center (0), they fall off
    if (Math.abs(playerX) > ribbonWidth / 2) {
        gameState = 'GAMEOVER';
        gameOverScreen.style.display = 'flex';
        finalScoreEl.innerText = `Stars Collected: ${score}`;
    }

    // Spawn items
    if (Math.random() < 0.02) {
        const itemX = (Math.random() - 0.5) * ribbonWidth * 0.9;
        items.push({ x: itemX, z: 1000, collected: false });
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.z -= speed * 2;
        if (item.z < 0) {
            items.splice(i, 1);
        } else if (item.z < 50) {
            // Check collision
            const dx = Math.abs(item.x - playerX);
            if (dx < 30) {
                score++;
                createParticle(canvas.width / 2 + item.x, canvas.height * 0.8, '#FFFF00');
                items.splice(i, 1);
            }
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

    scoreEl.innerText = `Stars: ${score}`;
    distanceEl.innerText = `Distance: ${Math.floor(distance)}m`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.height);

    // Draw Background (Space/Sky)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Horizon
    const horizonY = canvas.height / 2;
    
    // Draw Ribbon (Pseudo-3D)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - ribbonWidth / 2, canvas.height);
    ctx.lineTo(canvas.width / 2 + ribbonWidth / 2, canvas.height);
    ctx.lineTo(canvas.width / 2 + 20, horizonY);
    ctx.lineTo(canvas.width / 2 - 20, horizonY);
    ctx.closePath();
    
    // Rainbow Gradient for Ribbon
    const ribbonGrad = ctx.createLinearGradient(0, canvas.height, 0, horizonY);
    ribbonGrad.addColorStop(0, '#ff0000');
    ribbonGrad.addColorStop(0.2, '#ff7f00');
    ribbonGrad.addColorStop(0.4, '#ffff00');
    ribbonGrad.addColorStop(0.6, '#00ff00');
    ribbonGrad.addColorStop(0.8, '#0000ff');
    ribbonGrad.addColorStop(1, '#9400d3');
    ctx.fillStyle = ribbonGrad;
    ctx.fill();

    // Draw items
    items.forEach(item => {
        const scale = 1 - item.z / 1000;
        const x = canvas.width / 2 + item.x * scale;
        const y = horizonY + (canvas.height - horizonY) * scale;
        const size = 10 * scale;
        
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'yellow';
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Player
    const playerXPos = canvas.width / 2 + playerX;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(playerXPos, canvas.height * 0.8, 15, 0, Math.PI * 2);
    ctx.fill();
    // Player Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'white';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 0, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawStart() {
    // Just clear and draw the overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGameOver() {
    // Just clear and draw the overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loop() {
    updateLogic();
    draw();
    requestAnimationFrame(loop);
}

loop();
