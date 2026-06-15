const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let timeLeft = 60;
let gameActive = false;
let cupcakes = [];
let particles = [];
let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 80,
    height: 80,
    color: '#ff69b4'
};

const cupcakeTypes = [
    { color: '#ff69b4', points: 1, label: '🌸' },
    { color: '#ffdf00', points: 2, label: '🌟' },
    { color: '#00ffff', points: 5, label: '💎' },
    { color: '#ff4500', points: -3, label: '💣' },
];

function spawnCupcake() {
    const type = cupcakeTypes[Math.floor(Math.random() * cupcakeTypes.length)];
    cupcakes.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        size: 30,
        speed: 2 + Math.random() * 3,
        type: type,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.1
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function update() {
    if (!gameActive) return;

    // Move player
    // Simplified mouse/touch movement
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        player.x = e.clientX - rect.left - player.width / 2;
    };

    // Update cupcakes
    for (let i = cupcakes.length - 1; i >= 0; i--) {
        const c = cupcakes[i];
        c.y += c.speed;
        c.rotation += c.rotSpeed;

        // Collision detection
        if (
            c.x < player.x + player.width &&
            c.x + c.size > player.x &&
            c.y < player.y + player.height &&
            c.y + c.size > player.y
        ) {
            score += c.type.points;
            createParticles(c.x + c.size/2, c.y + c.size/2, c.type.color);
            cupcakes.splice(i, 1);
            scoreElement.innerText = `Cupcakes: ${score}`;
        } else if (c.y > canvas.height) {
            cupcakes.splice(i, 1);
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
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player (A cute basket/cloud)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height / 2, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.fillText('✨', player.x + 20, player.y + 30);

    // Draw Cupcakes
    cupcakes.forEach(c => {
        ctx.save();
        ctx.translate(c.x + c.size/2, c.y + c.size/2);
        ctx.rotate(c.rotation);
        ctx.font = '30px Arial';
        ctx.fillText(c.type.label, -15, 15);
        ctx.restore();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        timerElement.innerText = `Time: ${timeLeft}`;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.querySelector('h1').innerText = 'Time Up! 🧁';
    overlay.querySelector('p').innerText = `You collected ${score} cosmic cupcakes!`;
    overlay.querySelector('button').innerText = 'Play Again! ✨';
}

startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    cupcakes = [];
    particles = [];
    scoreElement.innerText = `Cupcakes: 0`;
    timerElement.innerText = `Time: 60`;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    
    startTimer();
    // Start spawning cupcakes
    const spawnInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(spawnInterval);
            return;
        }
        spawnCupcake();
    }, 800);
    
    // We need to call gameLoop once, but we only start it once per page load
});

// Start the loop
gameLoop();
