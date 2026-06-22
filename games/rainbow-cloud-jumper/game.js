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

const player = {
    x: 300,
    y: 700,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    jumpStrength: -16,
    gravity: 0.4,
    color: '#ffeb3b',
    stretchY: 1,
    stretchX: 1
};

const clouds = [];
const cloudColors = ['#FFB6C1', '#ADD8E6', '#E6E6FA', '#FFFACD', '#F0FFF0'];
const particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.radius = Math.random() * 4 + 2;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx, cameraY) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function createCloud(y) {
    return {
        x: Math.random() * (canvas.width - 100),
        y: y,
        width: 100,
        height: 40,
        color: cloudColors[Math.floor(Math.random() * cloudColors.length)]
    };
}

function initGame() {
    score = 0;
    cameraY = 0;
    player.x = 300;
    player.y = 700;
    player.vx = 0;
    player.vy = 0;
    player.stretchY = 1;
    player.stretchX = 1;
    scoreEl.innerText = `Score: ${score}`;
    
    clouds.length = 0;
    particles.length = 0;

    // Starting cloud
    clouds.push({ x: 250, y: 750, width: 100, height: 40, color: '#ffffff' });
    
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

    // Gravity and Physics
    player.vy += player.gravity;
    player.y += player.vy;
    player.x += player.vx;

    // Squash and stretch animation
    if (player.vy < 0) {
        player.stretchY = 1.2;
        player.stretchX = 0.8;
    } else if (player.vy > 0) {
        player.stretchY = 0.9;
        player.stretchX = 1.1;
    } else {
        player.stretchY = 1;
        player.stretchX = 1;
    }
    // Smooth transition back to normal
    player.stretchY += (1 - player.stretchY) * 0.1;
    player.stretchX += (1 - player.stretchX) * 0.1;

    // Wrap around screen
    if (player.x > canvas.width) player.x = 0;
    if (player.x < 0) player.x = canvas.width;

    // Camera follows player
    if (player.y < canvas.height / 2 + cameraY) {
        cameraY = player.y - canvas.height / 2;
    }

    // Generate new clouds as player goes up
    const highestCloudY = clouds[clouds.length - 1].y;
    if (cameraY < highestCloudY + canvas.height) {
        clouds.push(createCloud(highestCloudY - 120));
    }

    // Remove off-screen clouds to save memory
    if (clouds.length > 20) {
        if (clouds[0].y > cameraY + canvas.height + 100) {
            clouds.shift();
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (player.vy <= 0) return; // Only collide when falling

    clouds.forEach(cloud => {
        if (player.x + player.width > cloud.x &&
                player.x < cloud.x + cloud.width &&
                player.y + player.height > cloud.y &&
                player.y + player.height < cloud.y + 20) {
            
            player.vy = player.jumpStrength;
            
            // Create magical particles on jump
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(player.x + player.width / 2, player.y + player.height, cloud.color));
            }
            
            // Add points
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
    // Dynamic background color based on height
    const hue = (Math.abs(cameraY) / 50) % 360;
    ctx.fillStyle = `hsl(${hue}, 60%, 80%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -cameraY);

    // Draw clouds
    clouds.forEach(cloud => {
        ctx.fillStyle = cloud.color;
        ctx.beginPath();
        ctx.arc(cloud.x + 20, cloud.y + 20, 20, 0, Math.PI * 2);
        ctx.arc(cloud.x + 50, cloud.y + 10, 25, 0, Math.PI * 2);
        ctx.arc(cloud.x + 80, cloud.y + 20, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a little highlight to clouds for fluffiness
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(cloud.x + 40, cloud.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw particles
    particles.forEach(p => p.draw(ctx, 0)); // cameraY is already applied by translate

    // Draw player with squash and stretch
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(player.stretchX, player.stretchY);
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -5, 3, 0, Math.PI * 2);
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

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
    if (e.code === 'ArrowLeft') player.vx = -6;
    if (e.code === 'ArrowRight') player.vx = 6;
});

window.addEventListener('keyup', (e) => {
    if (!gameActive) return;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') player.vx = 0;
});

startBtn.onclick = initGame;

gameLoop();
