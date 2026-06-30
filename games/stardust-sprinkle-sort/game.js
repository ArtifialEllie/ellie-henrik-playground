const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-button');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let sprinkles = [];
let jars = [];
let draggedSprinkle = null;
let timerInterval = null;

const COLORS = [
    { name: 'Pink', color: '#ff69b4', glow: '#ff00ff' },
    { name: 'Blue', color: '#00bfff', glow: '#00ffff' },
    { name: 'Yellow', color: '#ffff00', glow: '#ffff00' },
    { name: 'Green', color: '#32cd32', glow: '#00ff00' },
    { name: 'Purple', color: '#9370db', glow: '#bf00ff' }
];

class Jar {
    constructor(x, y, colorObj) {
        this.x = x;
        this.y = y;
        this.radius = 60;
        this.colorObj = colorObj;
        this.pulse = 0;
    }

    draw() {
        this.pulse += 0.05;
        const pulseScale = 1 + Math.sin(this.pulse) * 0.05;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(pulseScale, pulseScale);

        // Glow
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.5);
        grad.addColorStop(0, this.colorObj.glow + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Jar Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Fill level (simulated)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, 0, Math.PI, false);
        ctx.fillStyle = this.colorObj.color + 'aa';
        ctx.fill();

        // Jar Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.colorObj.name, 0, 5);

        ctx.restore();
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }
}

class Sprinkle {
    constructor(x, y, colorObj) {
        this.x = x;
        this.y = y;
        this.colorObj = colorObj;
        this.radius = 8 + Math.random() * 4;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.isDragging = false;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.colorObj.glow;
        ctx.fillStyle = this.colorObj.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (!this.isDragging) {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initJars();
}

function initJars() {
    jars = [];
    const spacing = canvas.width / (COLORS.length + 1);
    for (let i = 0; i < COLORS.length; i++) {
        jars.push(new Jar(spacing * (i + 1), canvas.height - 120, COLORS[i]));
    }
}

function spawnSprinkle() {
    const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height / 2);
    sprinkles.push(new Sprinkle(x, y, colorObj));
}

function startGame() {
    score = 0;
    timeLeft = 60;
    sprinkles = [];
    gameActive = true;
    scoreEl.innerText = score;
    timeEl.innerText = timeLeft;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';

    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    for (let i = 0; i < 15; i++) {
        spawnSprinkle();
    }
    update();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlayTitle.innerText = 'Time Up! 🌟';
    overlayText.innerText = `You sorted ${score} magic sprinkles!`;
    startBtn.innerText = 'Try Again! 🌈';
}

function update() {
    if (!gameActive) return;

    sprinkles.forEach((s, index) => {
        s.update();
        if (s.isDragging) {
            // Handle dragging (handled by mouse events)
        }
    });

    // Spawn new sprinkles occasionally
    if (Math.random() < 0.02) {
        spawnSprinkle();
    }

    // Check collisions with jars
    sprinkles.forEach((s, index) => {
        if (s.isDragging) {
            jars.forEach(jar => {
                if (jar.contains(s.x, s.y)) {
                    if (s.colorObj.name === jar.colorObj.name) {
                        score++;
                        scoreEl.innerText = score;
                        sprinkles.splice(index, 1);
                        // Visual feedback could be added here
                    }
                }
            });
        }
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    jars.forEach(jar => jar.draw());
    sprinkles.forEach(s => s.draw());
}

// Input Handling
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    sprinkles.forEach(s => {
        if (Math.sqrt((mx - s.x)**2 + (my - s.y)**2) < s.radius * 2) {
            draggedSprinkle = s;
            s.isDragging = true;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (draggedSprinkle) {
        const rect = canvas.getBoundingClientRect();
        draggedSprinkle.x = e.clientX - rect.left;
        draggedSprinkle.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (draggedSprinkle) {
        draggedSprinkle.isDragging = false;
        draggedSprinkle = null;
    }
});

// Touch Support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = e.clientX - rect.left; // wait, e.clientX is not always on touch events
    // Correcting touch handling
}, { passive: false });

// Fixing touch handling in game.js
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;

    sprinkles.forEach(s => {
        if (Math.sqrt((mx - s.x)**2 + (my - s.y)**2) < s.radius * 2) {
            draggedSprinkle = s;
            s.isDragging = true;
        }
    });
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (draggedSprinkle) {
        draggedSprinkle.x = touch.clientX - rect.left;
        draggedSprinkle.y = touch.clientY - rect.top;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (draggedSprinkle) {
        draggedSprinkle.isDragging = false;
        draggedSprinkle = null;
    }
});

window.addEventListener('resize', resize);
startBtn.addEventListener('click', startGame);

resize();
draw();
// We need to call update() once to start the loop when startBtn is clicked.
// But let's wrap it in a start function.
