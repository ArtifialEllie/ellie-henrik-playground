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
let targetX = 0;
let items = [];
let particles = [];
let backgroundStars = [];
let playerTrail = [];
let keys = {};
let combo = 0;
let comboTimer = 0;

// Game Constants
const COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
const PLAYER_SIZE = 15;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function initBackground() {
    backgroundStars = [];
    for (let i = 0; i < 100; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            size: Math.random() * 2,
            opacity: Math.random(),
            speed: Math.random() * 0.02
        });
    }
}

function createItem() {
    const rand = Math.random();
    let type = 'star';
    let color = '#FFFF00';
    let value = 1;

    if (rand > 0.9) {
        type = 'gem';
        color = '#00FFFF';
        value = 5;
    }

    const itemX = (Math.random() - 0.5) * ribbonWidth * 0.9;
    items.push({ x: itemX, z: 1000, type, color, value, collected: false });
}

function createParticle(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color
        });
    }
}

function resetGame() {
    score = 0;
    distance = 0;
    speed = 5;
    playerX = 0;
    targetX = 0;
    items = [];
    particles = [];
    playerTrail = [];
    combo = 0;
    comboTimer = 0;
    gameState = 'PLAYING';
    overlay.style.display = 'none';
    gameOverScreen.style.display = 'none';
    initBackground();
}

startBtn.onclick = () => resetGame();
restartBtn.onclick = () => resetGame();

function updateLogic() {
    if (gameState !== 'PLAYING') return;

    distance += speed / 60;
    speed += 0.0005;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        targetX -= 6;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        targetX += 6;
    }

    playerX += (targetX - playerX) * 0.15;

    // Boundary check
    if (Math.abs(playerX) > ribbonWidth / 2) {
        gameState = 'GAMEOVER';
        gameOverScreen.style.display = 'flex';
        finalScoreEl.innerText = `Stars Collected: ${score}`;
    }

    // Combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) combo = 0;
    }

    // Spawn items
    if (Math.random() < 0.03) {
        createItem();
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.z -= speed * 2;
        if (item.z < 0) {
            items.splice(i, 1);
        } else if (item.z < 50) {
            const dx = Math.abs(item.x - playerX);
            if (dx < 30) {
                combo++;
                comboTimer = 60; // 1 second at 60fps
                const points = item.value * (1 + Math.floor(combo / 5));
                score += points;
                
                createParticle(canvas.width / 2 + item.x, canvas.height * 0.8, item.color);
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

    // Update player trail
    playerTrail.push({ x: canvas.width / 2 + playerX, y: canvas.height * 0.8 });
    if (playerTrail.length > 20) playerTrail.shift();

    // Update background stars
    backgroundStars.forEach(s => {
        s.opacity += s.speed;
        if (s.opacity > 1 || s.opacity < 0) s.speed *= -1;
    });

    scoreEl.innerText = `Stars: ${score}${combo >= 5 ? ' 🔥' : ''}`;
    distanceEl.innerText = `Distance: ${Math.floor(distance)}m`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background (Space/Sky)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Twinkling Stars
    backgroundStars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });

    const horizonY = canvas.height / 2;
    
    // Draw Ribbon (Pseudo-3D)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - ribbonWidth / 2, canvas.height);
    ctx.lineTo(canvas.width / 2 + ribbonWidth / 2, canvas.height);
    ctx.lineTo(canvas.width / 2 + 20, horizonY);
    ctx.lineTo(canvas.width / 2 - 20, horizonY);
    ctx.closePath();
    
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
        const size = (item.type === 'gem' ? 15 : 10) * scale;
        
        ctx.fillStyle = item.color;
        ctx.beginPath();
        if (item.type === 'gem') {
            // Draw a diamond shape for gems
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
        } else {
            ctx.arc(x, y, size, 0, Math.PI * 2);
        }
        ctx.fill();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Player Trail
    if (playerTrail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.moveTo(playerTrail[0].x, playerTrail[0].y);
        for (let i = 1; i < playerTrail.length; i++) {
            ctx.lineTo(playerTrail[i].x, playerTrail[i].y);
        }
        ctx.stroke();
    }

    // Draw Player
    const playerXPos = canvas.width / 2 + playerX;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(playerXPos, canvas.height * 0.8, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'white';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function loop() {
    updateLogic();
    draw();
    requestAnimationFrame(loop);
}

initBackground();
loop();
