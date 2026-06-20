const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const highscoreElement = document.getElementById('highscore');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');

let score = 0;
let highscore = localStorage.getItem('candyCloudHighscore') || 0;
let timeLeft = 60;
let gameActive = false;
let gameInterval;
let timerInterval;

highscoreElement.textContent = highscore;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Player {
    constructor() {
        this.width = 120;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.color = '#ffffff';
        this.bob = 0;
    }

    draw() {
        this.bob = Math.sin(Date.now() / 200) * 8;
        const drawY = this.y + this.bob;

        // Draw a fluffy cloud
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + 30, drawY + 30, 30, 0, Math.PI * 2);
        ctx.arc(this.x + 60, drawY + 20, 35, 0, Math.PI * 2);
        ctx.arc(this.x + 90, drawY + 30, 30, 0, Math.PI * 2);
        ctx.arc(this.x + 60, drawY + 40, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a little smiley face to the cloud
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 50, drawY + 25, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 70, drawY + 25, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 60, drawY + 35, 5, 0, Math.PI, false);
        ctx.stroke();
    }

    update(mouseX) {
        this.x = mouseX - this.width / 2;
        // Keep in bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
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

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.velocity = -2;
    }

    update() {
        this.y += this.velocity;
        this.life -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px cursive';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

class FallingItem {
    constructor() {
        this.radius = 15 + Math.random() * 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        
        // Speed increases slightly as score goes up
        const difficultyMultiplier = 1 + (score / 50);
        this.speed = (3 + Math.random() * 4) * difficultyMultiplier;
        
        const rand = Math.random();
        if (rand > 0.95) {
            this.type = 'rainbow';
            this.color = '#ff00ff';
            this.emoji = '🌈';
        } else if (rand > 0.9) {
            this.type = 'golden';
            this.color = '#ffd700';
            this.emoji = '🌟';
        } else if (rand > 0.2) {
            this.type = 'candy';
            this.color = `hsl(${Math.random() * 360}, 80%, 70%)`;
            this.emoji = '🍬';
        } else {
            this.type = 'lemon';
            this.color = '#fef08a';
            this.emoji = '🍋';
        }
    }

    draw() {
        ctx.font = `${this.radius * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
    }

    update() {
        this.y += this.speed;
    }
}

const player = new Player();
const items = [];
const particles = [];
const floatingTexts = [];

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push(new FloatingText(x, y, text, color));
}

function spawnItem() {
    if (!gameActive) return;
    items.push(new FallingItem());
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(mouseX);
    player.draw();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update and draw floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.update();
        ft.draw();
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.update();
        item.draw();

        // Collision detection
        if (
            item.y + item.radius > player.y &&
            item.y - item.radius < player.y + player.height &&
            item.x > player.x &&
            item.x < player.x + player.width
        ) {
            if (item.type === 'candy') {
                score++;
                createParticles(item.x, item.y, item.color);
                createFloatingText(item.x, item.y, '+1', item.color);
            } else if (item.type === 'golden') {
                score += 5;
                createParticles(item.x, item.y, '#ffd700', 20);
                createFloatingText(item.x, item.y, '+5', '#ffd700');
            } else if (item.type === 'rainbow') {
                score += 10;
                createParticles(item.x, item.y, '#ff00ff', 30);
                createFloatingText(item.x, item.y, '🌈 RAINBOW! +10', '#ff00ff');
            } else {
                score = Math.max(0, score - 5);
                createParticles(item.x, item.y, '#fef08a', 15);
                createFloatingText(item.x, item.y, '-5', '#ef4444');
                
                // Screen shake effect when hitting a lemon
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 500);
            }
            scoreElement.textContent = score;
            items.splice(i, 1);
        } else if (item.y > canvas.height + item.radius) {
            items.splice(i, 1);
        }
    }

    requestAnimationFrame(update);
}

let mouseX = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
});

window.addEventListener('touchmove', (e) => {
    mouseX = e.touches[0].clientX;
});

startBtn.addEventListener('click', () => {
    startOverlay.style.display = 'none';
    gameActive = true;
    score = 0;
    scoreElement.textContent = score;
    
    gameInterval = setInterval(spawnItem, 800);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    update();
});

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('candyCloudHighscore', highscore);
        highscoreElement.textContent = highscore;
    }
    
    overlay.style.display = 'flex';
    finalScoreElement.textContent = `Du fanget ${score} godterier!`;
}

function resetGame() {
    timeLeft = 60;
    timerElement.textContent = timeLeft;
    overlay.style.display = 'none';
    gameActive = true;
    
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    gameInterval = setInterval(spawnItem, 800);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    update();
}
