const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const overlay = document.getElementById('overlay');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let particles = [];
let stars = [];
let timerInterval;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.color = color;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 15 + 10;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.pulse = 0;
        this.pulseSpeed = Math.random() * 0.05 + 0.02;
        this.hidden = true;
        this.revealTimer = 0;
    }

    update() {
        this.pulse += this.pulseSpeed;
        if (this.hidden) {
            this.revealTimer++;
            if (this.revealTimer > 100) {
                this.hidden = false;
            }
        }
    }

    draw() {
        if (this.hidden) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        const pulseSize = this.size + Math.sin(this.pulse) * 3;
        
        // Draw a star shape
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * pulseSize, 
                       Math.sin((18 + i * 72) * Math.PI / 180) * pulseSize);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * pulseSize / 2, 
                       Math.sin((54 + i * 72) * Math.PI / 180) * pulseSize / 2);
        }
        ctx.closePath();
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();
        
        ctx.restore();
    }

    isClicked(mx, my) {
        const dx = mx - this.x;
        const dy = my - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size + 10;
    }
}

function createDustCloud() {
    const dust = [];
    for (let i = 0; i < 100; i++) {
        dust.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: `hsla(${260 + Math.random() * 40}, 100%, 70%, 0.3)`
        });
    }
    return dust;
}

let dustCloud = createDustCloud();

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw and update dust
    dustCloud.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Update and draw stars
    stars.forEach((star, index) => {
        star.update();
        star.draw();
    });

    // Update and draw particles
    particles.forEach((p, javaScriptIndex) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(javaScriptIndex, 1);
    });

    requestAnimationFrame(update);
}

function spawnStar() {
    if (stars.length < 5) {
        stars.push(new Star());
    }
}

function handleInput(e) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hit = false;
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        if (!star.hidden && star.isClicked(mx, my)) {
            score++;
            scoreElement.innerText = score;
            
            // Burst of particles
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(star.x, star.y, star.color));
            }
            
            stars.splice(i, 1);
            hit = true;
            break;
        }
    }
}

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    stars = [];
    particles = [];
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    overlay.classList.add('hidden');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // Initial stars
    for (let i = 0; i < 5; i++) {
        spawnStar();
    }
    
    update();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = score;
}

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    startGame();
});

restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame();
});

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e.touches[0]);
}, { passive: false });

// Periodically spawn stars
setInterval(() => {
    if (gameActive) {
        spawnStar();
    }
}, 1500);
