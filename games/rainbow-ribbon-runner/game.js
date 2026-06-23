const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let score = 0;
let highScore = localStorage.getItem('rrr_highscore') || 0;
highScoreEl.innerText = `Best: ${highScore}`;
let shakeAmount = 0;

let fever = 0;
let feverActive = false;
let feverTimer = 0;
const FEVER_MAX = 100;

let gameActive = false;
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    color: 'white',
    speed: 5,
    trail: []
};

let stars = [];
let obstacles = [];
let particles = [];
let frameCount = 0;

let vortex = null;
let vortexTimer = 0;

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
function playSound(freq, type, duration, volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

function createStar() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: 0
    };
}

function createObstacle() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 2 + 1;
    } else if (side === 1) { // Right
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -(Math.random() * 2 + 1);
        vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 2 + 1);
    } else { // Left
        x = -50;
        y = Math.random() * canvas.height;
        vx = Math.random() * 2 + 1;
        vy = (Math.random() - 0.5) * 2;
    }
    
    return { x, y, vx, vy, size: 30 + Math.random() * 20, color: '#7f8c8d' };
}

function createParticle(x, y, color) {
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

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
    if (!gameActive) return;

    // Player movement
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();

    // Spawn stars
    if (stars.length < 5) {
        stars.push(createStar());
    }

    // Spawn obstacles
    frameCount++;
    if (frameCount % 120 === 0) {
        obstacles.push(createObstacle());
    }

    // Vortex Logic
    if (vortex) {
        vortexTimer--;
        if (vortexTimer <= 0) vortex = null;
    } else if (frameCount % 600 === 0) {
        vortex = { x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: 0, maxRadius: 150, timer: 300 };
        vortexTimer = 300;
    }
    if (vortex && vortex.radius < vortex.maxRadius) vortex.radius += 2;

    if (vortex) {
        stars.forEach(star => {
            const dist = Math.hypot(vortex.x - star.x, vortex.y - star.y);
            if (dist < vortex.maxRadius * 2) {
                const angle = Math.atan2(vortex.y - star.y, vortex.x - star.x);
                star.x += Math.cos(angle) * 3;
                star.y += Math.sin(angle) * 3;
            }
        });
    }

    // Update obstacles
    obstacles.forEach((obs, index) => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        if (obs.x < -100 || obs.x > canvas.width + 100 || obs.y < -100 || obs.y > canvas.height + 100) {
            obstacles.splice(index, 1);
        }
    });

    // Update particles
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(index, 1);
    });

    // Fever Logic
    if (fever >= FEVER_MAX && !feverActive) {
        activateFever();
    }

    if (feverActive) {
        feverTimer--;
        if (feverTimer <= 0) {
            deactivateFever();
        }
    }

    // Collision check: Player & Stars
    stars.forEach((star, index) => {
        const dist = Math.hypot(player.x - star.x, player.y - star.y);
        if (dist < player.radius + star.radius) {
            score++;
            scoreEl.innerText = `Stars: ${score}`;
            shakeAmount = 5;
            playSound(440 + Math.random() * 440, 'sine', 0.1);
            createParticle(star.x, star.y, star.color);
            stars.splice(index, 1);
            stars.push(createStar());

            // Increase fever
            if (!feverActive) {
                fever = Math.min(FEVER_MAX, fever + 10);
                updateFeverUI();
            }
        }
    });

    // Collision check: Player & Obstacles
    obstacles.forEach(obs => {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < player.radius + obs.size/2) {
            shakeAmount = 20;
            playSound(150, 'sawtooth', 0.3);
            gameOver();
        }
    });
}

function draw() {
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
        shakeAmount *= 0.9;
        if (shakeAmount < 0.1) shakeAmount = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Trail
    if (player.trail.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < player.trail.length; i++) {
            const pos = player.trail[i];
            const colorIdx = Math.floor((i / player.trail.length) * colors.length);
            ctx.strokeStyle = colors[colorIdx];
            ctx.beginPath();
            ctx.moveTo(player.trail[i-1]?.x || pos.x, player.trail[i-1]?.y || pos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    }

    // Draw Stars
    stars.forEach(star => {
        star.pulse += 0.1;
        const r = star.radius + Math.sin(star.pulse) * 2;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Star Glow
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 3);
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(obs.x - obs.size/2, obs.y - obs.size/2, obs.size, obs.size, 8);
        ctx.fill();
    });

    // Draw Vortex
    if (vortex) {
        const grad = ctx.createRadialGradient(vortex.x, vortex.y, 0, vortex.x, vortex.y, vortex.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.5, 'rgba(200, 150, 255, 0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(vortex.x, vortex.y, vortex.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();
    requestAnimationFrame(draw);
}

function activateFever() {
    feverActive = true;
    feverTimer = 300; // 5 seconds at 60fps
    player.speed = 8;
    player.color = '#ffff00';
    playSound(523.25, 'sine', 0.3);
    document.getElementById('fever-text').innerText = '🌈 FEVER MODE! 🌈';
    document.getElementById('fever-text').style.color = '#ffea00';
    
    // Special effect: spawn a burst of stars
    for (let i = 0; i < 10; i++) {
        stars.push(createStar());
    }
}

function deactivateFever() {
    feverActive = false;
    fever = 0;
    player.speed = 5;
    player.color = 'white';
    updateFeverUI();
    document.getElementById('fever-text').innerText = 'FEVER: 0%';
    document.getElementById('fever-text').style.color = 'white';
}

function updateFeverUI() {
    const fill = document.getElementById('fever-fill');
    const text = document.getElementById('fever-text');
    if (fill && text) {
        fill.style.width = `${fever}%`;
        text.innerText = `FEVER: ${Math.floor(fever)}%`;
    }
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('rrr_highscore', highScore);
        highScoreEl.innerText = `Best: ${highScore}`;
    }
    overlay.style.display = 'flex';
    overlay.querySelector('h1').innerText = 'Oh Noes! 🌸';
    overlay.querySelector('p').innerText = `You collected ${score} stars!`;
    startBtn.innerText = 'Try Again! ✨';
}

function startGame() {
    score = 0;
    scoreEl.innerText = `Stars: ${score}`;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.trail = [];
    stars = [];
    obstacles = [];
    particles = [];
    frameCount = 0;
    fever = 0;
    feverActive = false;
    updateFeverUI();
    
    for (let i = 0; i < 5; i++) {
        stars.push(createStar());
    }
    audioCtx.resume();
    
    gameActive = true;
    overlay.style.display = 'none';
}

startBtn.addEventListener('click', startGame);

// Animation loop
updateLoop();
function updateLoop() {
    update();
    requestAnimationFrame(updateLoop);
}

// Draw loop
draw();
