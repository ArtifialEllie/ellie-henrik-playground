const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

canvas.width = 800;
canvas.height = 600;

let gameState = 'START'; // START, PLAYING, WIN, GAMEOVER
let score = 0;
let level = 1;
let star = { x: 50, y: 500, radius: 15, vx: 0, vy: 0 };
let goal = { x: 700, y: 100, radius: 30 };
let drawing = false;
let currentPath = [];
let platforms = []; // Static platforms
let userBridges = []; // Bridges drawn by player
let particles = []; // For glitter and explosions

const GRAVITY = 0.2;
const FRICTION = 0.98;
const BOUNCE = 0.5;

function initLevel() {
    star.x = 100;
    star.y = 500;
    star.vx = 0;
    star.vy = 0;
    
    goal.x = 600 + Math.random() * 150;
    goal.y = 100 + Math.random() * 200;
    
    userBridges = [];
    platforms = [
        { x: 50, y: 520, w: 100, h: 20 }, // Start platform
        { x: goal.x - 30, y: goal.y + 30, w: 60, h: 20 } // Goal platform
    ];
    
    // Add some random floating obstacles/platforms for level design
    if (level > 1) {
        for (let i = 0; i < level; i++) {
            platforms.push({
                x: 200 + Math.random() * 400,
                y: 200 + Math.random() * 300,
                w: 50 + Math.random() * 50,
                h: 15
            });
        }
    }
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function start() {
    gameState = 'PLAYING';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);
    initLevel();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', start);

window.addEventListener('mousedown', (e) => {
    if (gameState !== 'PLAYING') return;
    drawing = true;
    currentPath = [];
    const rect = canvas.getBoundingClientRect();
    currentPath.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
});

window.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    currentPath.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
});

window.addEventListener('mouseup', () => {
    if (!drawing) return;
    drawing = false;
    if (currentPath.length > 2) {
        userBridges.push([...currentPath]);
        createParticles(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y, 'white', 15);
    }
});

function checkCollision(px, py, radius, platform) {
    const closestX = Math.max(platform.x, Math.min(px, platform.x + platform.w));
    const closestY = Math.max(platform.y, Math.min(py, platform.y + platform.h));
    const distanceX = px - closestX;
    const distanceY = py - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    return distanceSquared < radius * radius;
}

function resolveCollision(px, py, radius, platform) {
    // Simplified AABB collision response
    if (px + radius > platform.x && px - radius < platform.x + platform.w) {
        if (py + radius > platform.y && py - radius < platform.y + platform.h) {
            // Determine which side we hit
            const overlapX = Math.min(px + radius - platform.x, platform.x + platform.w - (px - radius));
            const overlapY = Math.min(py + radius - platform.y, platform.y + platform.h - (py - radius));
            
            if (overlapX > overlapY) {
                if (py < platform.y + platform.h / 2) {
                    return { nx: 0, ny: -1, overlap: overlapY };
                } else {
                    return { nx: 0, ny: 1, overlap: overlapY };
                }
            } else {
                if (px < platform.x + platform.w / 2) {
                    return { nx: -1, ny: 0, overlap: overlapX };
                } else {
                    return { nx: 1, ny: 0, overlap: overlapX };
                }
            }
        }
    }
    return null;
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Physics
    star.vx *= FRICTION;
    star.vy += GRAVITY;
    star.x += star.vx;
    star.y += star.vy;

    // Screen boundaries
    if (star.x < 0) { star.x = 0; star.vx *= -BOUNCE; }
    if (star.x > canvas.width) { star.x = canvas.width; star.vx *= -BOUNCE; }
    if (star.y < 0) { star.y = 0; star.vy *= -BOUNCE; }
    if (star.y > canvas.height) { 
        gameState = 'GAMEOVER';
        showOverlay('Uff da! Stjernen falt ned i drømme-tåken! ☁️', 'Prøv igjen!');
    }

    // Collision with static platforms
    platforms.forEach(p => {
        const col = resolveCollision(star.x, star.y, star.radius, p);
        if (col) {
            if (col.ny === -1) {
                star.y -= col.overlap;
                star.vy *= -BOUNCE;
            } else if (col.ny === 1) {
                star.y += col.overlap;
                star.vy *= -BOUNCE;
            } else if (col.nx === -1) {
                star.x -= col.overlap;
                star.vx *= -BOUNCE;
            } else if (col.nx === 1) {
                star.x += col.overlap;
                star.vx *= -BOUNCE;
            }
        }
    });

    // Collision with drawn bridges (treated as a series of line segments)
    userBridges.forEach(bridge => {
        for (let i = 0; i < bridge.length - 1; i++) {
            const p1 = bridge[i];
            const p2 = bridge[i+1];
            
            // Find closest point on segment p1-p2 to star
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSq = dx * dx + dy * dy;
            if (lengthSq === 0) continue;
            
            let t = ((star.x - p1.x) * dx + (star.y - p1.y) * dy) / lengthSq;
            t = Math.max(0, Math.min(1, t));
            
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            
            const dist = Math.hypot(star.x - closestX, star.y - closestY);
            if (dist < star.radius + 5) {
                const nx = (star.x - closestX) / dist;
                const ny = (star.y - closestY) / dist;
                
                // Push star out of the line
                star.x += nx * (star.radius + 5 - dist);
                star.y += ny * (star.radius + 5 - dist);
                
                // Reflect velocity
                const dot = star.vx * nx + star.vy * ny;
                star.vx -= 2 * dot * nx;
                star.vy -= 2 * dot * ny;
                
                // Add a little bounce
                star.vx *= 0.8;
                star.vy *= 0.8;
            }
        }
    });

    // Goal check
    const distToGoal = Math.hypot(star.x - goal.x, star.y - goal.y);
    if (distToGoal < goal.radius + star.radius) {
        createParticles(star.x, star.y, '#fff700', 30);
        score += 100;
        level++;
        scoreEl.innerText = `Stjerner: ${score}`;
        levelEl.innerText = `Drømmenivå: ${level}`;
        setTimeout(() => {
            initLevel();
        }, 300);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Particles
    particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Goal (Cloud)
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'white';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Goal embellishments
    ctx.beginPath();
    ctx.arc(goal.x - 20, goal.y + 10, 20, 0, Math.PI * 2);
    ctx.arc(goal.x + 20, goal.y + 10, 20, 0, Math.PI * 2);
    ctx.arc(goal.x, goal.y - 10, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Static Platforms
    ctx.fillStyle = '#ffb6c1';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // User Bridges (Rainbow colored)
    userBridges.forEach((bridge, idx) => {
        const hue = (idx * 40) % 360;
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.stroke();
        
        // Draw the actual path
        ctx.beginPath();
        ctx.moveTo(bridge[0].x, bridge[0].y);
        for (let i = 1; i < bridge.length; i++) {
            ctx.lineTo(bridge[i].x, bridge[i].y);
        }
        ctx.stroke();
    });

    // Current drawing path
    if (drawing) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
    }

    // Star (Player)
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(Date.now() * 0.002);
    ctx.beginPath();
    ctx.fillStyle = '#fff700';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'yellow';
    
    // Simple star shape
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * star.radius * 2,
                   Math.sin((18 + i * 72) * Math.PI / 180) * star.radius * 2);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * star.radius,
                   Math.sin((54 + i * 72) * Math.PI / 180) * star.radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
}

function showOverlay(title, btnText) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.style.display = 'flex';
    }, 10);
    document.getElementById('title').innerText = title;
    document.getElementById('description').innerText = '';
    startBtn.innerText = btnText;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial draw to show start screen
draw();
