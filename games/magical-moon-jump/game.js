const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;
const STAR_RADIUS = 8;

let bgOffset = 0;
let canvasWidth, canvasHeight;
let score = 0;
let gameActive = true;
let platforms = [];
let stars = [];
let particles = [];
let shake = 0; // Screen shake intensity

const player = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    color: '#ff69b4'
};

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    // Input handling
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    
    restartBtn.addEventListener('click', restartGame);
    
    restartGame();
}

function resize() {
    canvasWidth = window.innerWidth > 600 ? 600 : window.innerWidth;
    canvasHeight = window.innerHeight > 800 ? 800 : window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

function handleKeyDown(e) {
    if (e.code === 'ArrowLeft') player.vx = -5;
    if (e.code === 'ArrowRight') player.vx = 5;
}

function handleTouchStart(e) {
    const touchX = e.touches[0].clientX;
    if (touchX < window.innerWidth / 2) {
        player.vx = -5;
    } else {
        player.vx = 5;
    }
}

function spawnPlatform(y, isFirst = false) {
    const x = Math.random() * (canvasWidth - PLATFORM_WIDTH);
    const type = Math.random() > 0.85 ? 'bouncy' : (Math.random() > 0.7 ? 'vanishing' : 'normal');
    platforms.push({ x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type, timer: 60 });
}

function spawnStar() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    if (platform) {
        stars.push({
            x: platform.x + PLATFORM_WIDTH / 2,
            y: platform.y - 20,
            radius: STAR_RADIUS,
            collected: false
        });
    }
}

function createParticles(x, y, color) {
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
    if (!gameActive) return;

    // Player movement
    player.vy += GRAVITY;
    player.y += player.vy;
    player.x += player.vx;

    // Horizontal wrap
    if (player.x < 0) player.x = canvasWidth;
    if (player.x > canvasWidth) player.x = 0;

    // Slow down horizontal movement
    player.vx *= 0.9;

    // Platform collision (only when falling)
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x + player.width > p.x && 
                player.x < p.x + p.width && 
                player.y + player.height > p.y && 
                player.y + player.height < p.y + p.height + player.vy) {
                
                if (p.type === 'vanishing') {
                    p.timer = 30; // Start vanishing timer
                }

                if (p.type === 'bouncy') {
                    player.vy = JUMP_FORCE * 1.5;
                    createParticles(player.x + player.width/2, player.y + player.height, '#fff');
                    shake = 10; // Add some juice!
                } else {
                    player.vy = JUMP_FORCE;
                }
            }
        });
    }

    // Star collection
    stars.forEach(s => {
        if (!s.collected && 
            Math.hypot(player.x + player.width/2 - s.x, player.y + player.height/2 - s.y) < 25) {
            s.collected = true;
            score++;
            scoreElement.innerText = `Stjerner: ${score}`;
            createParticles(s.x, s.y, '#ffff00');
        }
    });

    // Camera follow (scrolling)
    if (player.y < canvasHeight / 2) {
        const diff = canvasHeight / 2 - player.y;
        player.y += diff;
        platforms.forEach(p => p.y += diff);
        stars.forEach(s => s.y += diff);
        particles.forEach(p => p.y += diff);
    }

    // Game over
    if (player.y > canvasHeight) {
        gameOver();
    }

    // Spawn new platforms
    while (platforms.length < 10) {
        const lowestPlatformY = platforms.length === 0 ? canvasHeight - 50 : Math.min(...platforms.map(p => p.y));
        spawnPlatform(lowestPlatformY - 150);
    }

    // Remove off-screen platforms
    platforms = platforms.filter(p => p.y < canvasHeight + 100);
    stars = stars.filter(s => s.y < canvasHeight + 100);
    particles = particles.filter(p => p.y < canvasHeight + 100);

    // Update vanishing platforms
    platforms.forEach(p => {
        if (p.type === 'vanishing' && p.timer < 60) {
            p.timer--;
        }
    });
    platforms = platforms.filter(p => p.type !== 'vanishing' || p.timer > 0);

    // Periodic star spawn
    if (Math.random() < 0.01) spawnStar();

    // Update particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
    particles = particles.filter(p => p.life > 0);
}

function draw() {
    if (shake > 0) {
        ctx.save();
        ctx.translate(Math.random() * shake - shake/2, Math.random() * shake - shake/2);
        shake *= 0.9; // Decay shake
        if (shake < 1) shake = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw scrolling starry background
    bgOffset += 0.2;
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvasWidth;
        const y = (i * 243.1 + bgOffset) % canvasHeight;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw platforms
    platforms.forEach(p => {
        if (p.type === 'bouncy') ctx.fillStyle = '#00f2ff';
        else if (p.type === 'vanishing') {
            const opacity = p.timer < 60 ? p.timer / 30 : 1;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        }
        else ctx.fillStyle = '#ffb6c1';

        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 10);
        ctx.fill();
        
        if (p.type === 'bouncy') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Draw stars (collectible)
    stars.forEach(s => {
        if (!s.collected) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'yellow';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    });

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 10);
    ctx.fill();
    
    // Eyes for player
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 22, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    if (shake > 0) ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = `Du samlet ${score} stjerner!`;
    overlay.classList.remove('hidden');
}

function restartGame() {
    score = 0;
    gameActive = true;
    platforms = [];
    stars = [];
    particles = [];
    player.x = canvasWidth / 2 - player.width / 2;
    player.y = canvasHeight - 100;
    player.vx = 0;
    player.vy = 0;
    scoreElement.innerText = `Stjerner: 0`;
    overlay.classList.add('hidden');
    
    // Initial platforms
    for (let i = 0; i < 8; i++) {
        spawnPlatform(canvasHeight - (i * 120));
    }
    
    // Ensure first platform is always under player
    platforms[0].x = player.x - 20;
    platforms[0].width = 100;
}

init();
