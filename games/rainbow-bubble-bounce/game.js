const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const heightEl = document.getElementById('height');
const gemsEl = document.getElementById('gems');
const overlay = document.getElementById('overlay');
const finalHeightEl = document.getElementById('final-height');
const finalGemsEl = document.getElementById('final-gems');
const restartBtn = document.getElementById('restart-btn');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('start-btn');

// Game settings
let gameActive = false;
let score = 0;
let gemsCollected = 0;
let cameraY = 0;
let superBounceTimer = 0;
let dashTimer = 0;
let combo = 0;
let comboTimer = 0;

const PLAYER_RADIUS = 20;
const GRAVITY = 0.25;
const BOUNCE_FORCE = -10;
const SUPER_BOUNCE_FORCE = -18;
const CLOUD_BOUNCE_FORCE = -22;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;
const CLOUD_WIDTH = 40;
const GEM_RADIUS = 8;
const POWERUP_RADIUS = 12;
const COMBO_TIMEOUT = 120; // 2 seconds at 60fps

let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: PLAYER_RADIUS,
    color: 'rgba(162, 210, 255, 0.7)',
    scaleX: 1,
    scaleY: 1
};

let platforms = [];
let gems = [];
let powerups = [];
let particles = [];
let bgBubbles = [];
let playerTrail = [];
let keys = {};

// Initialize canvas size
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
}

window.addEventListener('resize', resize);
resize();

// Input handling
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function spawnPlatform(y, isFirst = false) {
    const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
    const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const isCloud = Math.random() > 0.85; // 15% chance to be a fluffy cloud platform
    
    platforms.push({
        x: x,
        y: y,
        width: isCloud ? CLOUD_WIDTH : PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        color: isCloud ? '#ffffff' : color,
        type: isCloud ? 'cloud' : 'normal'
    });
}

function spawnGem(y) {
    if (Math.random() > 0.2) return; // 20% chance to spawn a gem
    const x = Math.random() * (canvas.width - GEM_RADIUS * 2);
    gems.push({
        x: x,
        y: y,
        radius: GEM_RADIUS,
        collected: false
    });
}

function spawnPowerup(y) {
    if (Math.random() > 0.1) return; // 10% chance to spawn a powerup
    const x = Math.random() * (canvas.width - POWERUP_RADIUS * 2);
    powerups.push({
        x: x,
        y: y,
        radius: POWERUP_RADIUS,
        collected: false,
        type: 'super-bounce'
    });
}

function initGame() {
    score = 0;
    gemsCollected = 0;
    cameraY = 0;
    superBounceTimer = 0;
    combo = 0;
    comboTimer = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.vx = 0;
    player.vy = 0;
    
    platforms = [];
    gems = [];
    powerups = [];
    particles = [];
    bgBubbles = [];
    playerTrail = [];
    
    // Start platform
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        width: PLATFORM_WIDTH * 2,
        height: PLATFORM_HEIGHT,
        color: '#ffc6ff'
    });
    
    // Initial set of platforms
    for (let i = 1; i < 15; i++) {
        spawnPlatform(canvas.height - i * 100);
        spawnGem(canvas.height - i * 100 - 50);
        spawnPowerup(canvas.height - i * 100 - 50);
    }

    // Initialize background bubbles
    for (let i = 0; i < 20; i++) {
        bgBubbles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 30 + 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
    
    gameActive = true;
    instructions.classList.add('hidden');
    overlay.classList.add('hidden');
}

function update() {
    if (!gameActive) return;
    
    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= 0.8;
    if (keys['ArrowRight'] || keys['KeyD']) player.vx += 0.8;
    player.vx *= 0.9; // Friction
    
    player.x += player.vx;
    
    // Screen wrap
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    
    player.vy += GRAVITY;
    player.y += player.vy;

    // Squish and stretch effect
    player.scaleX = 1 + Math.abs(player.vx) * 0.02;
    player.scaleY = 1 - Math.abs(player.vx) * 0.02 + (player.vy < 0 ? -player.vy * 0.01 : 0);
    if (player.scaleY < 0.7) player.scaleY = 0.7;
    if (player.scaleY > 1.3) player.scaleY = 1.3;

    // Update player trail
    playerTrail.push({x: player.x, y: player.y, life: 1.0});
    if (playerTrail.length > 15) playerTrail.shift();
    playerTrail.forEach(t => t.life -= 0.05);
    
    // Background bubble movement
    bgBubbles.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.radius) b.x = canvas.width + b.radius;
        if (b.x > canvas.width + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = canvas.height + b.radius;
        if (b.y > canvas.height + b.radius) b.y = -b.radius;
    });
    
    // Camera follow (only moves up)
    if (player.y < canvas.height / 2 + cameraY) {
        const diff = (canvas.height / 2 + cameraY) - player.y;
        cameraY -= diff;
        score += Math.floor(diff);
    }
    
    // Platform collision
    if (player.vy > 0) {
        platforms.forEach(plat => {
            if (player.x + player.radius > plat.x && 
                player.x - player.radius < plat.x + plat.width &&
                player.y + player.radius > plat.y && 
                player.y + player.radius < plat.y + plat.height + player.vy) {
                
                let bounceForce = BOUNCE_FORCE;
                if (plat.type === 'cloud') {
                    bounceForce = CLOUD_BOUNCE_FORCE;
                    createSparkles(player.x, player.y + player.radius, '#ffffff', 12);
                } else if (superBounceTimer > 0) {
                    bounceForce = SUPER_BOUNCE_FORCE;
                }
                
                player.vy = bounceForce;
                
                // Combo system
                combo++;
                comboTimer = COMBO_TIMEOUT;
                
                // Extra bounce for high combos
                if (combo > 10) {
                    player.vy -= 1; // Slightly higher bounce every 10 combos
                }

                // Add a little sparkle effect on bounce
                createSparkles(player.x, player.y + player.radius, plat.color, 8);
            }
        });
    }
    
    // Gem collection
    gems.forEach(gem => {
        if (!gem.collected && 
            Math.hypot(player.x - gem.x, player.y - gem.y) < player.radius + gem.radius) {
            gem.collected = true;
            gemsCollected++;
            createSparkles(gem.x, gem.y, '#ffd700');
        }
    });
    
    // Powerup collection
    powerups.forEach(pu => {
        if (!pu.collected && 
            Math.hypot(player.x - pu.x, player.y - pu.y) < player.radius + pu.radius) {
            pu.collected = true;
            if (pu.type === 'super-bounce') {
                superBounceTimer = 300; // Approx 5 seconds at 60fps
                createSparkles(pu.x, pu.y, '#ff00ff', 20);
            }
        }
    });
    
    // Game over condition
    if (player.y > canvas.height / 2 + cameraY + canvas.height / 2) {
        gameOver();
    }
    
    // Infinite platform generation
    while (platforms[platforms.length - 1].y > cameraY - 100) {
        spawnPlatform(platforms[platforms.length - 1].y - 100);
        spawnGem(platforms[platforms.length - 1].y - 100 - 50);
        spawnPowerup(platforms[platforms.length - 1].y - 100 - 50);
    }
    
    // Clean up old platforms/gems
    platforms = platforms.filter(p => p.y > cameraY - 200);
    gems = gems.filter(g => g.y > cameraY - 200);
    powerups = powerups.filter(pu => pu.y > cameraY - 200);
    
    // Update particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
    
    if (superBounceTimer > 0) superBounceTimer--;
    
    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
    }
    
    particles = particles.filter(p => p.life > 0);
    
    heightEl.textContent = Math.floor(score / 10);
    gemsEl.textContent = gemsCollected;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(0, -cameraY);
    
    // Draw Background Bubbles
    bgBubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
        ctx.fill();
        ctx.closePath();
    });

    // Draw Gems
    gems.forEach(gem => {
        if (!gem.collected) {
            ctx.beginPath();
            ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
            
            // Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffd700';
        }
    });
    
    ctx.shadowBlur = 0; // Reset shadow for other elements

    // Draw Powerups
    powerups.forEach(pu => {
        if (!pu.collected) {
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff00ff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff00ff';
            
            // Tiny star in the middle
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.shadowBlur = 0; // Reset shadow
    
    // Draw Platforms
    platforms.forEach(plat => {
        ctx.beginPath();
        if (plat.type === 'cloud') {
            // Draw a fluffy cloud shape
            const cx = plat.x + plat.width / 2;
            const cy = plat.y + plat.height / 2;
            const r = plat.width / 4;
            ctx.arc(cx - r, cy, r, Math.PI * 0.5, Math.PI * 1.5);
            ctx.arc(cx, cy - r, r, Math.PI, Math.PI * 2);
            ctx.arc(cx + r, cy, r, Math.PI * 1.5, Math.PI * 0.5);
            ctx.lineTo(plat.x, plat.y + plat.height);
            ctx.lineTo(plat.x + plat.width, plat.y + plat.height);
        } else {
            ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 10);
        }
        ctx.fillStyle = plat.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
    
    // Draw Player Trail
    playerTrail.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.radius * t.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(162, 210, 255, ${t.life * 0.4})`;
        ctx.fill();
        ctx.closePath();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1.0;
    
    // Draw Player Bubble
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.scaleX, player.scaleY);
    
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        -5, -5, 2,
        0, 0, player.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(162, 210, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(162, 210, 255, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
    
    // Draw Combo Text
    if (combo > 1) {
        ctx.fillStyle = '#ff85a2';
        ctx.font = 'bold 20px Fredoka One';
        ctx.textAlign = 'center';
        ctx.fillText(`${combo}x Combo! ✨`, player.x + 40, player.y);
        
        // Small floating heart for combos
        ctx.font = '12px Arial';
        ctx.fillText('❤️', player.x + 60, player.y - 10);
    }
    
    ctx.restore();
}

function createSparkles(x, y, color = '#fff', count = 6) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color,
            size: Math.random() * 5 + 2
        });
    }
}

function gameOver() {
    gameActive = false;
    finalHeightEl.textContent = Math.floor(score / 10);
    finalGemsEl.textContent = gemsCollected;
    overlay.classList.remove('hidden');
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
    initGame();
    instructions.classList.add('hidden');
});

restartBtn.addEventListener('click', () => {
    initGame();
});

// Show instructions initially
instructions.classList.remove('hidden');
gameLoop();
