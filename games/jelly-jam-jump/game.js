const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

canvas.width = 400;
canvas.height = 600;

let score = 0;
let highScore = localStorage.getItem('jellyJamHighScore') || 0;
highScoreElement.innerText = `Best: ${highScore}`;

let gameState = 'START'; // START, PLAYING, GAMEOVER

let player = {
    x: 200,
    y: 500,
    radius: 15,
    vx: 0,
    vy: 0,
    color: '#ff69b4',
    jumpStrength: -10,
    gravity: 0.3
};

let platforms = [];
const platformCount = 7;
const platformWidth = 60;
const platformHeight = 15;

let keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function createPlatform(y, isFirst = false) {
    return {
        x: Math.random() * (canvas.width - platformWidth),
        y: y,
        width: platformWidth,
        height: platformHeight,
        color: `hsl(${Math.random() * 360}, 70%, 80%)`,
        isFirst: isFirst
    };
}

function initGame() {
    score = 0;
    player.x = 200;
    player.y = 500;
    player.vx = 0;
    player.vy = 0;
    
    platforms = [];
    for (let i = 0; i < platformCount; i++) {
        platforms.push(createPlatform(i * (canvas.height / platformCount), i === 0));
    }
    // Ensure first platform is under player
    platforms[0].x = 170;
    platforms[0].y = 550;
    platforms[0].isFirst = true;
    
    scoreElement.innerText = `Score: ${score}`;
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -5;
    else if (keys['ArrowRight'] || keys['KeyD']) player.vx = 5;
    else player.vx *= 0.9;

    player.x += player.vx;

    // Screen wrap
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;

    // Gravity and Jump
    player.vy += player.gravity;
    player.y += player.vy;

    // Platform collision (only when falling)
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x + player.radius > p.x && 
                player.x - player.radius < p.x + p.width &&
                player.y + player.radius > p.y && 
                player.y + player.radius < p.y + p.height + 10) {
                player.vy = player.jumpStrength;
                // Jelly effect: slightly squash the platform
                p.squashed = true;
                setTimeout(() => p.squashed = false, 100);
            }
        });
    }

    // Camera movement
    if (player.y < canvas.height / 2) {
        let diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        score += Math.floor(diff);
        scoreElement.innerText = `Score: ${score}`;
        
        platforms.forEach(p => {
            p.y += diff;
            if (p.y > canvas.height) {
                Object.assign(p, createPlatform(0));
                p.y = 0;
                // Re-randomize color for variety
                p.color = `hsl(${Math.random() * 360}, 70%, 80%)`;
            }
        });
    }

    // Game Over
    if (player.y > canvas.height + 100) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.squashed) {
            ctx.ellipse(p.x + p.width / 2, p.y + p.height, p.width * 1.1, p.height * 0.7, 0, 0, Math.PI * 2);
        } else {
            ctx.roundRect(p.x, p.y, p.width, p.height, 10);
        }
        ctx.fill();
        // Glossy highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(p.x + 5, p.y + 2, p.width - 10, 4, 5);
        ctx.fill();
    });

    // Draw player (Jelly Bean)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    // Squash and stretch based on velocity
    let stretch = Math.abs(player.vy) * 0.1;
    let w = player.radius * (1 - stretch * 0.5);
    let h = player.radius * (1 + stretch * 0.5);
    ctx.ellipse(player.x, player.y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 5, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 5, 1.5, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('jellyJamHighScore', highScore);
        highScoreElement.innerText = `Best: ${highScore}`;
    }
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.querySelector('h1').innerText = 'Oopsie! 🍮';
    overlay.querySelector('p').innerText = `You fell! Your score was ${score}.`;
    overlay.querySelector('button').innerText = 'Try Again! ✨';
}

function startGame() {
    initGame();
    gameState = 'PLAYING';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
}

startBtn.addEventListener('click', startGame);

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
