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
    jumpStrength: -15,
    gravity: 0.4,
    color: '#ffeb3b'
};

const clouds = [];
const cloudColors = ['#FFB6C1', '#ADD8E6', '#E6E6FA', '#FFFACD', '#F0FFF0'];

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
    scoreEl.innerText = `Score: ${score}`;
    
    clouds.length = 0;
    // Starting cloud
    clouds.push({ x: 250, y: 750, width: 100, height: 40, color: '#ffffff' });
    
    // Initial clouds
    for (let i = 1; i < 10; i++) {
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

    // Collision with clouds
    if (player.vy > 0) {
        clouds.forEach(cloud => {
            if (player.x + player.width > cloud.x &&
                player.x < cloud.x + cloud.width &&
                player.y + player.height > cloud.y &&
                player.y + player.height < cloud.y + cloud.vy + 20) { // simplified collision
                
                // Actually need a more robust collision check for falling
                // Since clouds don't have vy, I'll just use the cloud's y
            }
        });
    }
}

// Fix the collision logic in a separate function for clarity
function checkCollisions() {
    if (player.vy <= 0) return; // Only collide when falling

    clouds.forEach(cloud => {
        if (player.x + player.width > cloud.x &&
                player.x < cloud.x + cloud.width &&
                player.y + player.height > cloud.y &&
                player.y + player.height < cloud.y + 20) {
            player.vy = player.jumpStrength;
            
            // Add points based on how high the cloud is relative to the start
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background shift (fake parallax or just a gradient)
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
    });

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
    if (e.code === 'ArrowLeft') player.vx = 0;
    if (e.code === 'ArrowRight') player.vx = 0;
});

startBtn.onclick = initGame;

gameLoop();
