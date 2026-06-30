const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');
const messageElement = document.getElementById('message');

let score = 0;
let gameActive = false;
let animationId;
let particles = [];
let notes = [];
let obstacles = [];
let frameCount = 0;

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const SURF_SPEED = 5;
const NOTE_SPAWN_RATE = 80;
const OBSTACLE_SPAWN_RATE = 120;

// Player Object
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    vy: 0,
    rotation: 0,
    color: '#ff00ff'
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

function createParticle(x, y, color) {
    return {
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2,
        color,
        life: 1.0
    };
}

function createNote() {
    const y = Math.random() * (canvas.height - 100) + 50;
    return {
        x: canvas.width,
        y,
        width: 30,
        height: 30,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        collected: false
    };
}

function createObstacle() {
    const height = Math.random() * 200 + 100;
    const isTop = Math.random() > 0.5;
    return {
        x: canvas.width,
        y: isTop ? 0 : canvas.height - height,
        width: 50,
        height: height,
        color: '#444'
    };
}

function jump() {
    if (!gameActive) {
        gameActive = true;
        messageElement.classList.add('hidden');
        return;
    }
    player.vy = JUMP_FORCE;
    
    // Visual juice: jump particles
    for (let i = 0; i < 10; i++) {
        particles.push(createParticle(player.x, player.y + player.height/2, '#00ffff'));
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});
window.addEventListener('touchstart', jump);
restartBtn.addEventListener('click', () => {
    resetGame();
    overlay.classList.add('hidden');
});

function resetGame() {
    score = 0;
    scoreElement.innerText = score;
    gameActive = false;
    player.y = canvas.height / 2;
    player.vy = 0;
    player.rotation = 0;
    particles = [];
    notes = [];
    obstacles = [];
    frameCount = 0;
    messageElement.classList.remove('hidden');
}

function update() {
    if (!gameActive) {
        // Float player gently
        player.vy += 0.05;
        player.y += player.vy;
        if (player.y > canvas.height - 100 || player.y < 100) player.vy *= -1;
        
        // Rotation effect when idling
        player.rotation += 0.02;
    } else {
        player.vy += GRAVITY;
        player.y += player.vy;
        player.rotation = player.vy * 0.05;

        // Boundary checks
        if (player.y + player.height > canvas.height || player.y < 0) {
            gameOver();
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Spawn things
    frameCount++;
    if (gameActive) {
        if (frameCount % NOTE_SPAWN_RATE === 0) notes.push(createNote());
        if (frameCount % OBSTACLE_SPAWN_RATE === 0) obstacles.push(createObstacle());
    }

    // Update notes
    for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.x -= SURF_SPEED;
        if (n.x + n.width < 0) notes.splice(i, 1);
        
        // Collision with player
        if (!n.collected && 
            player.x < n.x + n.width &&
            player.x + player.width > n.x &&
            player.y < n.y + n.height &&
            player.y + player.height > n.y) {
            
            n.collected = true;
            score++;
            scoreElement.innerText = score;
            for (let i = 0; i < 15; i++) {
                particles.push(createParticle(n.x, n.y, n.color));
            }
            notes.splice(i, 1);
        }
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= SURF_SPEED;
        if (o.x + o.width < 0) obstacles.splice(i, 1);
        
        if (player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y) {
            gameOver();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * canvas.height;
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0);
        ctx.fill();
    }

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Player (Sleek Surfboard)
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.rotation);
    
    // Board
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw Notes
    notes.forEach(n => {
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = n.color;
        ctx.beginPath();
        ctx.arc(n.x + n.width/2, n.y + n.height/2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Obstacles
    obstacles.forEach(o => {
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.rect(o.x, o.y, o.width, o.height);
        ctx.fill();
        
        // Neon edge
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.width, o.height);
    });
}

function gameOver() {
    gameActive = false;
    finalScoreElement.innerText = score;
    overlay.classList.remove('hidden');
}

function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}

resetGame();
loop();
