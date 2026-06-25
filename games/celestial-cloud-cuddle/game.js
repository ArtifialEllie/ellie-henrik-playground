const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameActive = true;
let particles = [];
let stars = [];
let clouds = [];
let player = {
    x: 0,
    y: 0,
    radius: 20,
    color: '#fff',
    targetX: 0,
    targetY: 0
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    player.targetX = e.touches[0].clientX;
    player.targetY = e.touches[0].clientY;
});

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
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

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 10 + 5;
        this.color = `hsl(${Math.random() * 60 + 180}, 100%, 80%)`;
        this.pulse = 0;
    }

    update() {
        this.pulse += 0.05;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < player.radius + this.radius) {
            score++;
            scoreElement.innerText = `Stars Cuddled: ${score}`;
            createExplosion(this.x, this.y, this.color);
            this.reset();
            if (score % 10 === 0) {
                messageElement.innerText = "You're so sparkly! ✨";
                setTimeout(() => {
                    messageElement.innerText = "Cuddle the stars! Avoid the grumpy clouds! 💖";
                }, 2000);
            }
        }
    }

    draw() {
        const s = this.radius + Math.sin(this.pulse) * 2;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Cloud {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() < 0.5 ? -100 : canvas.width + 100;
        this.y = Math.random() * canvas.height;
        this.vx = (this.x < 0) ? Math.random() * 2 + 1 : - (Math.random() * 2 + 1);
        this.radius = Math.random() * 30 + 30;
        this.color = '#aaa';
    }

    update() {
        this.x += this.vx;
        if (this.x < -200 || this.x > canvas.width + 200) {
            this.reset();
        }

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < player.radius + this.radius) {
            gameActive = false;
            overlay.classList.remove('hidden');
            finalScoreElement.innerText = `You cuddled ${score} stars!`;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.arc(this.x + this.radius * 0.5, this.y - this.radius * 0.2, this.radius * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x - this.radius * 0.5, this.y - this.radius * 0.2, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function update() {
    if (!gameActive) return;

    player.x += (player.targetX - player.x) * 0.1;
    player.y += (player.targetY - player.y) * 0.1;

    stars.forEach(star => star.update());
    clouds.forEach(cloud => cloud.update());
    particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    stars.forEach(star => star.draw());
    
    // Draw clouds
    clouds.forEach(cloud => cloud.draw());

    // Draw player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'white';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(p => p.draw());

    requestAnimationFrame(update);
}

function init() {
    score = 0;
    gameActive = true;
    particles = [];
    stars = [];
    clouds = [];
    scoreElement.innerText = `Stars Cuddled: ${score}`;
    messageElement.innerText = "Cuddle the stars! Avoid the grumpy clouds! 💖";
    overlay.classList.add('hidden');

    for (let i = 0; i < 5; i++) {
        stars.push(new Star());
    }
    for (let i = 0; i < 3; i++) {
        clouds.push(new Cloud());
    }

    requestAnimationFrame(update);
}

restartBtn.addEventListener('click', () => {
    init();
});

init();
