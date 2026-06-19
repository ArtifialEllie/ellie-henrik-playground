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

let particles = [];
let visualEffects = [];
let bgBubbles = [];

let keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function createPlatform(y, isFirst = false) {
    const type = Math.random() > 0.85 ? 'super' : 'normal';
    return {
        x: Math.random() * (canvas.width - platformWidth),
        y: y,
        width: platformWidth,
        height: platformHeight,
        type: type,
        color: type === 'super' ? '#ffff00' : `hsl(${Math.random() * 360}, 70%, 80%)`,
        isFirst: isFirst,
        squashed: false
    };
}

function createParticle(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 4 + 2,
            color: color,
            life: 1.0
        });
    }
}

function createVisualEffect(x, y, text) {
    visualEffects.push({
        x: x,
        y: y,
        text: text,
        life: 1.0,
        vy: -2
    });
}

function initBg() {
    bgBubbles = [];
    for (let i = 0; i < 20; i++) {
        bgBubbles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 20 + 5,
            speed: Math.random() * 1 + 0.5
        });
    }
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
    platforms[0].type = 'normal';
    platforms[0].color = `hsl(${Math.random() * 360}, 70%, 80%)`;
    
    scoreElement.innerText = `Score: ${score}`;
    particles = [];
    visualEffects = [];
    initBg();
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
                
                const strength = p.type === 'super' ? player.jumpStrength * 1.8 : player.jumpStrength;
                player.vy = strength;
                
                // Jelly effect
                p.squashed = true;
                setTimeout(() => p.squashed = false, 100);
                
                // Particles & FX
                createParticle(player.x, player.y + player.radius, p.color);
                createVisualEffect(player.x, player.y - 20, p.type === 'super' ? 'SUPER BOING! 🌟' : 'Boing! ✨');
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
            }
        });

        bgBubbles.forEach(b => {
            b.y += diff * 0.5; // Parallax
            if (b.y > canvas.height) {
                b.y = -b.r;
                b.x = Math.random() * canvas.width;
            }
        });
    }

    // Update particles
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    // Update visual effects
    visualEffects.forEach((fx, i) => {
        fx.y += fx.vy;
        fx.life -= 0.02;
        if (fx.life <= 0) visualEffects.splice(i, 1);
    });

    // Game Over
    if (player.y > canvas.height + 100) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    bgBubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

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
        
        // Special glow for super platforms
        if (p.type === 'super') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Glossy highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(p.x + 5, p.y + 2, p.width - 10, 4, 5);
        ctx.fill();
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw visual effects
    ctx.font = 'bold 20px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    visualEffects.forEach(fx => {
        ctx.globalAlpha = fx.life;
        ctx.fillStyle = '#ff1493';
        ctx.fillText(fx.text, fx.x, fx.y);
    });
    ctx.globalAlpha = 1.0;

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
