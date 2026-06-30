const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const wand = document.getElementById('wand');
const scoreElement = document.getElementById('score');
const magicBar = document.getElementById('magic-bar');
const messageElement = document.getElementById('message');

let width, height;
let score = 0;
let magicLevel = 0;
let isDrawing = false;
let lastX = 0, lastY = 0;
let particles = [];
let wishes = [];
let ambientParticles = [];
let combo = 1;
let comboTimer = 0;
let wandVelocity = { x: 0, y: 0 };
let wandAngle = 0;

const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF0000', '#FFFFFF', '#FFB6C1', '#E6E6FA'];
const wishTypes = [
    { icon: '🌟', text: 'A shooting star!' },
    { icon: '🌈', text: 'A tiny rainbow!' },
    { icon: '🍦', text: 'Magic ice cream!' },
    { icon: '🦋', text: 'A glitter butterfly!' },
    { icon: '🍬', text: 'Cosmic candy!' },
    { icon: '🦄', text: 'A mini unicorn!' },
    { icon: '🌸', text: 'A floating flower!' },
    { icon: '🐱‍🚀', text: 'An astronaut kitty!' },
    { icon: '🍕', text: 'A floating pizza slice!' },
    { icon: '💎', text: 'A sparkling diamond!' },
    { icon: '🍄', text: 'A dancing mushroom!' },
    { icon: '🌙', text: 'A crescent moon slice!' },
    { icon: '🎈', text: 'A floating balloon!' },
    { icon: '🌙', text: 'A silver crescent!' }
];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function createParticle(x, y, color, isAmbient = false) {
    return {
        x, y,
        vx: isAmbient ? (Math.random() - 0.5) * 1 : (Math.random() - 0.5) * 5,
        vy: isAmbient ? (Math.random() - 0.5) * 1 : (Math.random() - 0.5) * 5,
        size: isAmbient ? Math.random() * 3 + 1 : Math.random() * 5 + 2,
        color,
        life: 1.0,
        decay: isAmbient ? Math.random() * 0.005 + 0.002 : Math.random() * 0.02 + 0.01
    };
}

function createWish(x, y) {
    const type = wishTypes[Math.floor(Math.random() * wishTypes.length)];
    return {
        x, y,
        icon: type.icon,
        text: type.text,
        size: 30,
        life: 1.0,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3
    };
}

function update() {
    ctx.clearRect(0, 0, width, height);

    // Handle Ambient Particles
    if (ambientParticles.length < 50) {
        ambientParticles.push(createParticle(Math.random() * width, Math.random() * height, colors[Math.floor(Math.random() * colors.length)], true));
    }

    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        const p = ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            ambientParticles.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = p.life * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Update and draw active particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Update and draw wishes
    for (let i = wishes.length - 1; i >= 0; i--) {
        const w = wishes[i];
        w.x += w.vx;
        w.y += w.vy;
        w.life -= 0.005;
        if (w.life <= 0) {
            wishes.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = w.life;
        ctx.font = `${w.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(w.icon, w.x, w.y);
    }

    ctx.globalAlpha = 1.0;
    
    // Combo timer decay
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            combo = 1;
        }
    }

    requestAnimationFrame(update);
}

function handleMove(e) {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!x || !y) return;

    // Calculate velocity for wand tilt
    const dx = x - lastX;
    const dy = y - lastY;
    wandVelocity = { x: dx, y: dy };
    
    // Calculate angle based on movement direction
    if (Math.hypot(dx, dy) > 1) {
        wandAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 45; // Offset by 45 deg for wand orientation
        wand.style.setProperty('--wand-angle', `${wandAngle}deg`);
        wand.style.transform = `rotate(${wandAngle}deg)`;
    }

    wand.style.left = `${x - 25}px`;
    wand.style.top = `${y - 25}px`;
    
    // Rotate wand based on movement (Double check for smoothness)
    if (lastX !== 0 && lastY !== 0) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        wand.style.transform = `rotate(${angle + 90}deg)`;
    }

    if (isDrawing) {
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(createParticle(x, y, color));
            if (dist > 15) particles.push(createParticle(x, y, color));
            
            // Combo System: waving fast increases combo
            if (dist > 20) {
                combo++;
                comboTimer = 60; // 1 second at 60fps
            }

            magicLevel += dist * 0.1 * combo;
            lastX = x;
            lastY = y;
        }
    } else {
        // Even when not drawing, leave a tiny trail of magic
        if (Math.random() > 0.8) {
            particles.push(createParticle(x, y, colors[Math.floor(Math.random() * colors.length)], true));
        }
        lastX = x;
        lastY = y;
    }
}

function handleStart(e) {
    isDrawing = true;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].sclientY); // Fixed potential typo from original
    lastX = x;
    lastY = y;
}

function handleEnd(e) {
    isDrawing = false;
    if (magicLevel >= 100) {
        grantWish();
    }
}

function grantWish() {
    // Chance for a "Super Wish"
    const isSuperWish = Math.random() > 0.8;
    const wishCount = isSuperWish ? 5 : 1;
    
    for (let i = 0; i < wishCount; i++) {
        const x = Math.random() * (width - 100) + 50;
        const y = Math.random() * (height - 100) + 50;
        const wish = createWish(x, y);
        wishes.push(wish);
        
        if (i === 0) {
            // Use the first wish to determine the message
            const msg = isSuperWish ? "SUPER WISH GRANTED! 🌈✨🌟" : `You granted a wish: ${wish.text}! ${wish.icon}`;
            messageElement.innerText = msg;
            if (isSuperWish) {
                messageElement.style.color = "gold";
                messageElement.style.fontSize = "24px";
            } else {
                messageElement.style.color = "#e0e0e0";
                messageElement.style.fontSize = "18px";
            }
        }
    }
    
    score += wishCount;
    scoreElement.innerText = score;
    magicLevel = 0;
    
    setTimeout(() => {
        messageElement.innerText = "Wave your wand more to gather magic! ✨";
        messageElement.style.color = "#e0e0e0";
        messageElement.style.fontSize = "18px";
    }, 2000);
}

window.addEventListener('mousemove', handleMove);
window.addEventListener('mousedown', handleStart);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchmove', handleMove);
window.addEventListener('touchstart', handleStart);
window.addEventListener('touchend', handleEnd);

// Update magic bar
setInterval(() => {
    magicBar.style.width = `${Math.min(magicLevel, 100)}%`;
    if (magicLevel >= 100) {
        magicBar.style.backgroundColor = 'gold';
        messageElement.innerText = "MAGIC FULL! Let go to grant a wish! 🌟";
        messageElement.style.color = "gold";
        wand.classList.add('wand-pulse');
    } else {
        magicBar.style.backgroundColor = '';
        wand.classList.remove('wand-pulse');
        if (combo > 1) {
            messageElement.innerText = `Magic Combo x${combo}! ⚡✨`;
        }
    }
}, 50);

update();
