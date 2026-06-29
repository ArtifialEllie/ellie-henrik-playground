const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');

let score = 0;
let highScore = localStorage.getItem('cosmicCandyHighScore') || 0;
let gameActive = false;
let lives = 3;
let candies = [];
let debris = [];
let particles = [];
let player = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    color: '#ff69b4'
};

highScoreElement.innerText = highScore;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 100;
    player.x = canvas.width / 2 - player.width / 2;
}

window.addEventListener('resize', resize);
resize();

// Mouse/Touch control
window.addEventListener('mousemove', (e) => {
    if (gameActive) {
        player.x = e.clientX - player.width / 2;
    }
});

window.addEventListener('touchmove', (e) => {
    if (gameActive) {
        player.x = e.touches[0].clientX - player.width / 2;
        e.preventDefault();
    }
}, { passive: false });

class Candy {
    constructor() {
        this.radius = Math.random() * 15 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = Math.random() * 2 + 2 + (score / 100); // Speed increases with score
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.type = Math.random() > 0.9 ? 'golden' : 'normal';
        if (this.type === 'golden') {
            this.color = '#ffd700';
            this.speed *= 1.5;
        }
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add a little shine to the candy
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        ctx.closePath();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.closePath();
    }
}

function spawnCandy() {
    if (!gameActive) return;
    candies.push(new Candy());
    
    // Spawn more candies as score increases
    let spawnRate = Math.max(300, 1000 - (score * 2));
    setTimeout(spawnCandy, spawnRate);
}

function spawnDebris() {
    if (!gameActive) return;
    debris.push(new Debris());
    
    let spawnRate = Math.max(1000, 3000 - (score * 2));
    setTimeout(spawnDebris, spawnRate);
}

class Debris {
    constructor() {
        this.radius = Math.random() * 10 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = Math.random() * 3 + 3 + (score / 200);
        this.color = '#888';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollision(candy) {
    // Simplified bounding box check (since player is a rectangle and candy is a circle)
    if (candy.x > player.x && candy.x < player.x + player.width &&
        candy.y + candy.radius > player.y && candy.y - candy.radius < player.y + player.height) {
        return true;
    }
    return false;
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw space background (stars)
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 1.2) * 0.5 + 0.5) * canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Draw Player (Ellie's Basket/Bucket)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 15);
    ctx.fill();
    
    // Add decoration to the basket
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x + 10, player.y + 10, player.width - 20, player.height - 20);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎀', player.x + player.width / 2, player.y + player.height / 2 + 10);

    // Update and draw debris
    for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.update();
        d.draw();
        if (checkCollision(d)) {
            lives--;
            document.getElementById('lives').innerText = lives;
            createExplosion(d.x, d.y, '#ff0000');
            debris.splice(i, 1);
            if (lives <= 0) endGame();
        } else if (d.y - d.radius > canvas.height) {
            debris.splice(i, 1);
        }
    }

    // Update and draw candies
    for (let i = candies.length - 1; i >= 0; i--) {
        const candy = candies[i];
        candy.update();
        candy.draw();

        if (checkCollision(candy)) {
            if (candy.type === 'golden') {
                score += 50;
                createExplosion(candy.x, candy.y, '#ffd700');
            } else {
                score += 10;
                createExplosion(candy.x, candy.y, candy.color);
            }
            scoreElement.innerText = score;
            candies.splice(i, 1);
        } else if (candy.y - candy.radius > canvas.height) {
            candies.splice(i, 1);
            if (candy.type === 'golden') {
                lives--;
                document.getElementById('lives').innerText = lives;
                createExplosion(candy.x, canvas.height, '#ff0000');
                if (lives <= 0) {
                    endGame();
                }
            } else {
                // Normal candy missed: minor penalty or just ignore
                // Let's make it a small life penalty every 5 missed normal candies
                // For simplicity, let's just lose a life if it's a golden one.
                // But to make it a bit harder, let's occasionally lose a life for normal ones too
                if (Math.random() > 0.9) {
                    lives--;
                    document.getElementById('lives').innerText = lives;
                    if (lives <= 0) endGame();
                }
            }
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cosmicCandyHighScore', highScore);
    }
    highScoreElement.innerText = highScore;
    finalScoreElement.innerText = `Poeng: ${score}`;
    gameOverScreen.style.display = 'flex';
}

function startGame() {
    score = 0;
    scoreElement.innerText = score;
    lives = 3;
    document.getElementById('lives').innerText = lives;
    candies = [];
    debris = [];
    particles = [];
    gameActive = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    spawnCandy();
    spawnDebris();
    update();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
