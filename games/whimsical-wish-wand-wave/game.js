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

const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF0000', '#FFFFFF'];
const wishTypes = [
    { icon: '🌟', text: 'A shooting star!' },
    { icon: '🌈', text: 'A tiny rainbow!' },
    { icon: '🍦', text: 'Magic ice cream!' },
    { icon: '🦋', text: 'A glitter butterfly!' },
    { icon: '🍬', text: 'Cosmic candy!' },
    { icon: '🦄', text: 'A mini unicorn!' },
    { icon: '🌸', text: 'A floating flower!' }
];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function createParticle(x, y, color) {
    return {
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 5 + 2,
        color,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01
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
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
    };
}

function update() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
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
    requestAnimationFrame(update);
}

function handleMove(e) {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!x || !y) return;

    wand.style.left = `${x - 25}px`;
    wand.style.top = `${y - 25}px`;

    if (isDrawing) {
        const dist = Math.hypot(x - lastX, y - lastY);
        if (dist > 5) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(createParticle(x, y, color));
            particles.push(createParticle(x, y, color));
            
            magicLevel += dist * 0.1;
            lastX = x;
            lastY = y;
        }
    }
}

function handleStart(e) {
    isDrawing = true;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
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
    const x = Math.random() * (width - 100) + 50;
    const y = Math.random() * (height - 100) + 50;
    
    wishes.push(createWish(x, y));
    score++;
    scoreElement.innerText = score;
    magicLevel = 0;
    
    messageElement.innerText = "You granted a wish! ✨";
    setTimeout(() => {
        messageElement.innerText = "Wave your wand more to gather magic! ✨";
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
    } else {
        magicBar.style.backgroundColor = '';
    }
}, 50);

update();
