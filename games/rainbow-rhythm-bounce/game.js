const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

// Game Settings
const COLORS = {
    RED: '#ff4d4d',
    GREEN: '#4dff4d',
    BLUE: '#4d4dff',
    YELLOW: '#ffff4d'
};
const COLOR_KEYS = {
    'a': COLORS.RED,
    's': COLORS.GREEN,
    'd': COLORS.BLUE,
    'f': COLORS.YELLOW
};
const GRAVITY = 0.25;
const BOUNCE_STRENGTH = -8;
const PLATFORM_SPEED_START = 3;
const PLATFORM_SPEED_MAX = 7;

let score = 0;
let multiplier = 1;
let gameActive = false;
let ball, platform;
let platforms = [];
let lastTime = 0;

class Ball {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = 100;
        this.radius = 15;
        this.dy = 0;
        this.color = COLORS.RED;
        this.targetColor = COLORS.RED;
    }

    update() {
        this.dy += GRAVITY;
        this.y += this.dy;

        // Simple lerp for color transition
        this.color = this.targetColor;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

class Platform {
    constructor(y, speed) {
        this.x = Math.random() * (canvas.width - 100);
        this.y = y;
        this.width = 100;
        this.height = 20;
        this.speed = speed;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.color = Object.values(COLORS)[Math.floor(Math.random() * 4)];
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= canvas.width) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

function init() {
    canvas.width = 600;
    canvas.height = 800;
    ball = new Ball();
    platforms = [];
    
    // Initial platforms
    for (let i = 0; i < 5; i++) {
        platforms.push(new Platform(200 + i * 120, PLATFORM_SPEED_START));
    }
    
    score = 0;
    multiplier = 1;
    scoreElement.innerText = `Score: ${score}`;
    multiplierElement.innerText = `x${multiplier}`;
}

function spawnPlatform() {
    const lastPlatformY = platforms[platforms.length - 1].y;
    platforms.push(new Platform(lastPlatformY + 120, PLATFORM_SPEED_START + (score / 1000)));
}

function checkCollision(ball, platform) {
    return ball.x + ball.radius > platform.x && 
           ball.x - ball.radius < platform.x + platform.width && 
           ball.y + ball.radius > platform.y && 
           ball.y - ball.radius < platform.y + platform.height && 
           ball.dy > 0;
}

function gameOver() {
    gameActive = false;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.getElementById('title').innerText = 'Oops! 🌈';
    document.getElementById('instruction').innerText = `Final Score: ${score}`;
    startBtn.innerText = 'Try Again! ✨';
}

function update(time) {
    if (!gameActive) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ball.update();
    
    // Camera follow (simple)
    const cameraOffset = ball.y > 300 ? ball.y - 300 : 0;
    ctx.save();
    ctx.translate(0, -cameraOffset);

    platforms.forEach((p, index) => {
        p.update();
        p.draw();
        
        if (checkCollision(ball, p)) {
            if (ball.color === p.color) {
                ball.dy = BOUNCE_STRENGTH;
                score += 10 * multiplier;
                multiplier++;
                scoreElement.innerText = `Score: ${score}`;
                multiplierElement.innerText = `x${multiplier}`;
                
                // Move platform down to keep them in loop
                p.y += 120; // This is simplistic, but just to maintain density
                // In a real "infinite" game, we'd shift everything
            } else {
                gameOver();
            }
        }
    });

    // The actual infinite logic: keep platforms spawning and moving
    // We need to handle the y-coordinate of platforms relative to the ball
    // Since we are moving the camera, we'll just spawn platforms below
    if (platforms.length < 10) {
        spawnPlatform();
    }
    
    // Remove off-screen platforms
    platforms = platforms.filter(p => p.y > cameraOffset - 100);

    ball.draw();
    ctx.restore();

    if (ball.y > cameraOffset + canvas.height) {
        gameOver();
    }

    requestAnimationFrame(update);
}

function gameLoop() {
    requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (COLOR_KEYS[key]) {
        ball.targetColor = COLOR_KEYS[key];
    }
});

startBtn.addEventListener('click', () => {
    init();
    gameActive = true;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    lastTime = performance.now();
    gameLoop();
});
