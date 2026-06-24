const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const restartBtn = document.getElementById('restart-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let score = 0;
let gameActive = true;
let frames = 0;

const player = {
    x: 100,
    y: canvas.height / 2,
    radius: 20,
    velocity: 0,
    gravity: 0.4,
    lift: -8,
    color: '#ffccff'
};

const stars = [];
const particles = [];
const clouds = [];

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = canvas.width + 50;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 2;
        this.speed = Math.random() * 3 + 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
        this.x -= this.speed;
        this.pulse += 0.1;
        if (this.x < -50) this.reset();
    }

    draw() {
        const pulseSize = this.size + Math.sin(this.pulse) * 2;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Cloud {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = canvas.width + 200;
        this.y = Math.random() * canvas.height;
        this.width = Math.random() * 100 + 100;
        this.height = this.width * 0.6;
        this.speed = Math.random() * 1 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.2;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -250) this.reset();
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.height/2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.3, this.y - this.height * 0.2, this.height/2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.6, this.y, this.height/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function spawnStar() {
    if (frames % 60 === 0) {
        stars.push(new Star());
    }
}

function spawnCloud() {
    if (frames % 150 === 0) {
        clouds.push(new Cloud());
    }
}

function handleInput() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (gameActive) {
                player.velocity = player.lift;
                createParticles(player.x, player.y, '#ffccff');
            } else if (messageOverlay.classList.contains('hidden')) {
                // To prevent immediate jump on restart
            }
        }
    });

    canvas.addEventListener('mousedown', () => {
        if (gameActive) {
            player.velocity = player.lift;
            createParticles(player.x, player.y, '#ffccff');
        }
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function update() {
    if (!gameActive) return;

    frames++;
    player.velocity += player.gravity;
    player.y += player.velocity;

    if (player.y + player.radius > canvas.height) {
        player.y = canvas.height - player.radius;
        player.velocity = 0;
        // Touching bottom doesn't kill you, but it slows you down
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius;
        player.velocity = 0;
    }

    stars.forEach((star, index) => {
        star.update();
        if (player.x + player.radius > star.x - star.size && 
            player.x - player.radius < star.x + star.size && 
            player.y + player.radius > star.y - star.size && 
            player.y - player.radius < star.y + star.size) {
            
            score++;
            scoreElement.textContent = score;
            star.reset();
            createParticles(star.x, star.y, star.color);
        }
    });

    clouds.forEach(cloud => cloud.update());

    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) particles.splice(index, 1);
    });

    spawnStar();
    spawnCloud();

    // Increase difficulty
    if (frames % 1000 === 0) {
        player.gravity += 0.05;
        player.lift = Math.max(-12, player.lift - 0.5);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    clouds.forEach(cloud => cloud.draw());
    stars.forEach(star => star.draw());
    particles.forEach(particle => particle.draw());

    // Draw Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.velocity * 0.05);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffccff';
    ctx.fillStyle = player.color;
    
    // Draw a cute wing-like shape
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a little eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    messageTitle.textContent = "Dreamy Drift!";
    messageText.textContent = `You collected ${score} stardust particles! ✨`;
    messageOverlay.classList.remove('hidden');
}

function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    player.y = canvas.height / 2;
    player.velocity = 0;
    player.gravity = 0.4;
    player.lift = -8;
    gameActive = true;
    stars.length = 0;
    clouds.length = 0;
    particles.length = 0;
    frames = 0;
    messageOverlay.classList.add('hidden');
}

restartBtn.addEventListener('click', () => {
    resetGame();
});

handleInput();
gameLoop();
