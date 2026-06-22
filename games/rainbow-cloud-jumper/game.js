const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

canvas.width = 600;
canvas.height = 800;

let score = 0;
let highScore = localStorage.getItem('rainbow-jumper-highscore') || 0;
highScoreEl.innerText = `Best: ${highScore}`;

let gameActive = false;
let cameraY = 0;
let particles = [];

const player = {
    x: 300,
    y: 700,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    jumpStrength: -15,
    gravity: 0.4,
    color: '#ffeb3b'
};

const clouds = [];
const cloudColors = {
    normal: ['#FFB6C1', '#ADD8E6', '#E6E6FA', '#FFFACD', '#F0FFF0'],
    moving: ['#B39DDB', '#9575CD'],
    spring: ['#FFD54F', '#FFB300'],
    disappearing: ['#CFD8DC', '#B0BEC5']
};

function createCloud(y, type = 'normal') {
    const types = ['normal', 'normal', 'normal', 'moving', 'spring', 'disappearing'];
    const actualType = type === 'normal' ? types[Math.floor(Math.random() * types.length)] : type;
    
    const colorList = cloudColors[actualType];
    return {
        x: Math.random() * (canvas.width - 100),
        y: y,
        width: 100,
        height: 40,
        color: colorList[Math.floor(Math.random() * colorList.length)],
        type: actualType,
        vx: actualType === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
        active: true
    };
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
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

function initGame() {
    score = 0;
    cameraY = 0;
    player.x = 300;
    player.y = 700;
    player.vx = 0;
    player.vy = 0;
    scoreEl.innerText = `Score: ${score}`;
    
    clouds.length = 0;
    particles.length = 0;
    
    // Starting cloud
    clouds.push({ x: 250, y: 750, width: 100, height: 40, color: '#ffffff', type: 'normal', vx: 0, active: true });
    
    // Initial clouds
    for (let i = 1; i < 15; i++) {
        clouds.push(createCloud(750 - i * 120));
    }
    
    gameActive = true;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);
}

function update() {
    if (!gameActive) return;

    // Gravity
    player.vy += player.gravity;
    player.y += player.vy;
    player.x += player.vx;

    // Wrap around screen
    if (player.x > canvas.width) player.x = 0;
    if (player.x < 0) player.x = canvas.width;

    // Camera follows player
    if (player.y < canvas.height / 2 + cameraY) {
        cameraY = player.y - canvas.height / 2;
    }

    // Update Clouds
    clouds.forEach(cloud => {
        if (cloud.type === 'moving') {
            cloud.x += cloud.vx;
            if (cloud.x <= 0 || cloud.x + cloud.width >= canvas.width) {
                cloud.vx *= -1;
            }
        }
    });

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Spawn new clouds as player goes up
    const highestCloudY = clouds[clouds.length - 1].y;
    if (player.y < highestCloudY + 800) {
        clouds.push(createCloud(highestCloudY - 120));
    }
    
    // Clean up old clouds
    if (clouds.length > 30) {
        clouds.shift();
    }
}

function checkCollisions() {
    if (player.vy <= 0) return; // Only collide when falling

    clouds.forEach(cloud => {
        if (!cloud.active) return;

        if (player.x + player.width > cloud.x &&
                player.x < cloud.x + cloud.width &&
                player.y + player.height > cloud.y &&
                player.y + player.height < cloud.y + 25) {
            
            let jump = player.jumpStrength;
            if (cloud.type === 'spring') jump = -25;
            
            player.vy = jump;
            createParticles(player.x + player.width/2, player.y + player.height, cloud.color);

            if (cloud.type === 'disappearing') {
                cloud.active = false;
            }
            
            const cloudHeight = 750 - cloud.y;
            const currentScore = Math.floor(cloudHeight / 10);
            if (currentScore > score) {
                score = currentScore;
                scoreEl.innerText = `Score: ${score}`;
            }
        }
    });
}

function draw() {
    // Dynamic Background Gradient
    const hue = (Date.now() / 50) % 360;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `hsl(${hue}, 70%, 80%)`);
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 95%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -cameraY);

    // Draw clouds
    clouds.forEach(cloud => {
        if (!cloud.active) return;

        ctx.fillStyle = cloud.color;
        
        // Add a slight glow to special clouds
        if (cloud.type === 'spring') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'gold';
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(cloud.x + 20, cloud.y + 20, 20, 0, Math.PI * 2);
        ctx.arc(cloud.x + 50, cloud.y + 10, 25, 0, Math.PI * 2);
        ctx.arc(cloud.x + 80, cloud.y + 20, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Cloud type labels/icons
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        if (cloud.type === 'spring') ctx.fillText('🚀', cloud.x + 50, cloud.y + 25);
        if (cloud.type === 'moving') ctx.fillText('↔️', cloud.x + 50, cloud.y + 25);
        if (cloud.type === 'disappearing') ctx.fillText('☁️', cloud.x + 50, cloud.y + 25);
        
        ctx.shadowBlur = 0;
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 15, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y + 15, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (player.y - cameraY > canvas.height) {
        gameOver();
    }
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('rainbow-jumper-highscore', highScore);
        highScoreEl.innerText = `Best: ${highScore}`;
    }
    
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.innerHTML = `
        <h1>Game Over! 🌈</h1>
        <p>You fell from the rainbow clouds!</p>
        <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Score: ${score}</p>
        <button id="restart-btn" style="padding: 15px 30px; font-size: 24px; background: #ffeb3b; border: none; border-radius: 50px; cursor: pointer; color: #f44336; font-weight: bold;">Restart Magic! ✨</button>
    `;
    
    document.getElementById('restart-btn').onclick = () => {
        overlay.innerHTML = `
            <h1>Rainbow Cloud Jumper</h1>
            <p>Jump on the clouds to reach the stars!</p>
            <button id="start-btn">Start Magic! ✨</button>
        `;
        document.getElementById('start-btn').onclick = initGame;
    };
}

function gameLoop() {
    update();
    checkCollisions();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (e.code === 'ArrowLeft') player.vx = -5;
    if (e.code === 'ArrowRight') player.vx = 5;
});

window.addEventListener('keyup', (e) => {
    if (!gameActive) return;
    if (e.code === 'ArrowLeft' && player.vx === -5) player.vx = 0;
    if (e.code === 'ArrowRight' && player.vx === 5) player.vx = 0;
});

startBtn.onclick = initGame;

gameLoop();
