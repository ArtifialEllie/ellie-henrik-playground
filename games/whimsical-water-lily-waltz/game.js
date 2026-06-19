const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start-button');

// Game constants
const LILY_RADIUS = 40;
const FROG_RADIUS = 20;
const JUMP_FORCE = 15;
const GRAVITY = 0.6;
const SPEED_X = 8;

let score = 0;
let highScore = localStorage.getItem('lilyWaltzHighScore') || 0;
highScoreElement.textContent = `Best: ${highScore}`;

let gameActive = false;
let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: FROG_RADIUS,
    color: '#4caf50'
};

let lilies = [];
let particles = [];

function initCanvas() {
    canvas.width = 800;
    canvas.height = 600;
}

class Lily {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = LILY_RADIUS;
        this.type = type; // 'normal' or 'grumpy'
        this.pulse = 0;
    }

    draw() {
        this.pulse += 0.05;
        const scale = 1 + Math.sin(this.pulse) * 0.05;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        // Lily pad base
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 1.8);
        ctx.lineTo(0, 0);
        ctx.closePath();
        
        ctx.fillStyle = this.type === 'normal' ? '#8bc34a' : '#4a5d23';
        ctx.fill();
        ctx.strokeStyle = '#558b2f';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Veins
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        for(let i=0; i<8; i++) {
            ctx.moveTo(0,0);
            ctx.lineTo(Math.cos(i * Math.PI/4) * this.radius, Math.sin(i * Math.PI/4) * this.radius);
        }
        ctx.stroke();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnLily(x, y, type = 'normal') {
    lilies.push(new Lily(x, y, type));
}

function setupGame() {
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    player.x = 100;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    
    lilies = [];
    particles = [];
    
    // Starting lily
    spawnLily(100, 300);
    // Initial batch of lilies
    for (let i = 1; i < 5; i++) {
        addNextLily();
    }
}

function addNextLily() {
    const lastLily = lilies[lilies.length - 1];
    const minX = lastLily.x + 120;
    const maxX = lastLily.x + 250;
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (canvas.height - 200) + 100;
    const type = Math.random() < 0.2 ? 'grumpy' : 'normal';
    spawnLily(x, y, type);
}

function jump() {
    if (!gameActive) return;
    
    // Check if player is on a lily
    let onLily = false;
    lilies.forEach(lily => {
        const dist = Math.hypot(player.x - lily.x, player.y - lily.y);
        if (dist < LILY_RADIUS + FROG_RADIUS) {
            onLily = true;
        }
    });

    if (onLily) {
        player.vy = -JUMP_FORCE;
        player.vx = SPEED_X;
        
        // Splash effect
        for(let i=0; i<10; i++) {
            particles.push(new Particle(player.x, player.y, '#81d4fa'));
        }
    }
}

function update() {
    if (!gameActive) return;

    // Gravity
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Camera shift (simulated by moving everything else)
    if (player.x > 400) {
        const diff = player.x - 400;
        player.x = 400;
        lilies.forEach(lily => lily.x -= diff);
        particles.forEach(p => p.x -= diff);
        // Move score separately? No, it's UI.
    }

    // Collision with lilies
    let landed = false;
    lilies.forEach(lily => {
        if (player.vy > 0 && 
            player.x + FROG_RADIUS > lily.x - LILY_RADIUS && 
            player.x - FROG_RADIUS < lily.x + LILY_RADIUS &&
            player.y + FROG_RADIUS > lily.y - LILY_RADIUS && 
            player.y - FROG_RADIUS < lily.y + LILY_RADIUS) {
            
            if (lily.type === 'grumpy') {
                gameOver();
            } else {
                player.vy = 0;
                player.y = lily.y - FROG_RADIUS;
                player.vx = 0;
                landed = true;
                
                // If we just landed on a new lily, increase score
                const isNewLily = lilies.some(l => l !== lily && Math.hypot(player.x - l.x, player.y - l.y) < 5); 
                // This simple logic is a bit flawed, but for now:
                // Let's track which lily the player is on.
            }
        }
    });

    // More robust score tracking
    // We'll check if we passed a lily
    const currentLilyIndex = lilies.findIndex(l => Math.hypot(player.x - l.x, player.y - l.y) < LILY_RADIUS + FROG_RADIUS);
    if (currentLilyIndex !== -1 && currentLilyIndex > score) {
        score = currentLilyIndex;
        scoreElement.textContent = `Score: ${score}`;
    }

    // Water collision
    if (player.y > canvas.height) {
        gameOver();
    }

    // Update particles
    particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    });

    // Add more lilies as we go
    if (lilies.length < score + 10) {
        addNextLily();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background water ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.arc(0, 50 + i*100, 100, 0, Math.PI*2);
        ctx.stroke();
    }

    lilies.forEach(lily => lily.draw());
    particles.forEach(p => p.draw());

    // Draw Frog
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-8, -12, 5, 0, Math.PI * 2);
    ctx.arc(8, -12, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, -12, 3, 0, Math.PI * 2);
    ctx.arc(8, -12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('lilyWaltzHighScore', highScore);
        highScoreElement.textContent = `Best: ${highScore}`;
    }
    
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').textContent = 'Splish Splash! 🐸';
    document.getElementById('message').innerHTML = 'Oops! You fell in the water or hit a grumpy lily!<br>Try again? ✨';
    document.getElementById('start-button').textContent = 'Waltz Again! 🌸';
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initCanvas();
setupGame();

startButton.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setupGame();
    gameActive = true;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    }
});

window.addEventListener('mousedown', () => {
    jump();
});
