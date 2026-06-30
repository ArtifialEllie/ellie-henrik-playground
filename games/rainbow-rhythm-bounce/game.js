const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

// Game Settings
const COLORS = {
    RED: { r: 255, g: 77, b: 77, hex: '#ff4d4d' },
    GREEN: { r: 77, g: 255, b: 77, hex: '#4dff4d' },
    BLUE: { r: 77, g: 77, b: 255, hex: '#4d4dff' },
    YELLOW: { r: 255, g: 255, b: 77, hex: '#ffff4d' }
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
let particles = [];
let floatingTexts = [];
let stars = [];
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
        this.trail = [];
        this.currentColor = { ...COLORS.RED };
        this.targetColor = COLORS.RED;
    }

    update() {
        this.dy += GRAVITY;
        this.y += this.dy;

        // Smooth color transition
        const lerpSpeed = 0.2;
        this.currentColor.r += (this.targetColor.r - this.currentColor.r) * lerpSpeed;
        this.currentColor.g += (this.targetColor.g - this.currentColor.g) * lerpSpeed;
        this.currentColor.b += (this.targetColor.b - this.currentColor.b) * lerpSpeed;
    }

    draw() {
        // Draw trail
        this.trail.forEach((pos, index) => {
            const alpha = index / this.trail.length * 0.5;
            const size = (index / this.trail.length) * this.radius;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.round(this.currentColor.r)}, ${Math.round(this.currentColor.g)}, ${Math.round(this.currentColor.b)}, ${alpha})`;
            ctx.fill();
        });

        const colorStr = `rgb(${Math.round(this.currentColor.r)}, ${Math.round(this.currentColor.g)}, ${Math.round(this.currentColor.b)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorStr;
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = colorStr;
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.velocity = Math.random() * 1 + 1;
    }

    update() {
        this.y -= this.velocity;
        this.life -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

class Star {
    constructor() {
        this.reset();
        this.y = Math.random() * 800;
    }

    reset() {
        this.x = Math.random() * 600;
        this.y = 810;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.y -= this.speed;
        if (this.y < -10) this.reset();
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.size, this.size);
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
        this.colorObj = Object.values(COLORS)[Math.floor(Math.random() * 4)];
        this.color = this.colorObj.hex;
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

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
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

function init() {
    canvas.width = 600;
    canvas.height = 800;
    ball = new Ball();
    platforms = [];
    particles = [];
    floatingTexts = [];
    stars = [];
    
    // Initial platforms
    for (let i = 0; i < 6; i++) {
        platforms.push(new Platform(200 + i * 150, PLATFORM_SPEED_START));
    }
    
    score = 0;
    multiplier = 1;

    // Create stars
    for(let i=0; i<100; i++) {
        stars.push(new Star());
    }
    
    scoreElement.innerText = `Score: ${score}`;
    multiplierElement.innerText = `x${multiplier}`;
}

function spawnPlatform() {
    const lastPlatformY = platforms.length > 0 ? platforms[platforms.length - 1].y : 200;
    const speed = Math.min(PLATFORM_SPEED_MAX, PLATFORM_SPEED_START + (score / 1000));
    platforms.push(new Platform(lastPlatformY + 150, speed));
}

function createBurst(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, color));
    }
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
    
    // Update trail
    ball.trail.push({x: ball.x, y: ball.y});
    if (ball.trail.length > 10) ball.trail.shift();
    
    // Draw background stars
    stars.forEach(s => {
        s.update();
        s.draw();
    });
    
    const cameraOffset = ball.y > 300 ? ball.y - 300 : 0;
    ctx.save();
    ctx.translate(0, -cameraOffset);

    platforms.forEach((p, index) => {
        p.update();
        p.draw();
        
        if (checkCollision(ball, p)) {
            if (ball.targetColor.hex === p.color) {
                ball.dy = BOUNCE_STRENGTH;
                score += 10 * multiplier;
                multiplier++;
                scoreElement.innerText = `Score: ${score}`;
                multiplierElement.innerText = `x${multiplier}`;
                
                createBurst(ball.x, ball.y + ball.radius, p.color);
                
                const text = multiplier > 1 ? `x${multiplier} COMBO!` : 'Bouncy!';
                floatingTexts.push(new FloatingText(ball.x, ball.y, text, p.color));
                
                // Reposition platform to maintain game flow
                p.y += 600; 
                p.x = Math.random() * (canvas.width - 100);
                // Re-sort platforms to keep spawning logic consistent
                platforms.sort((a, b) => a.y - b.y);
            } else {
                gameOver();
            }
        }
    });

    if (platforms[platforms.length - 1].y < cameraOffset + canvas.height) {
        spawnPlatform();
    }
    
    platforms = platforms.filter(p => p.y > cameraOffset - 200);

    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    floatingTexts.forEach((ft, i) => {
        ft.update();
        ft.draw();
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    });

    ball.draw();
    ctx.restore();

    if (ball.y > cameraOffset + canvas.height + 100) {
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
