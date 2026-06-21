const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let timeLeft = 60;
let gameActive = false;
let bubbles = [];
let bottles = [];
let particles = [];
let sparkles = [];
let floatingTexts = [];

const COLORS = {
    pink: { main: '#ffb3d9', light: '#ffeef8', dark: '#ff85b2' },
    blue: { main: '#b3e5fc', light: '#e1f5fe', dark: '#81d4fa' },
    green: { main: '#c8e6c9', light: '#f1f8e9', dark: '#a5d6a7' },
    purple: { main: '#e1bee7', light: '#f3e5f5', dark: '#ce93d8' }
};
const COLOR_KEYS = Object.keys(COLORS);

let combo = 0;
let lastColorKey = null;

class Bubble {
    constructor() {
        this.reset();
    }

    reset() {
        this.radius = 15 + Math.random() * 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = 1 + Math.random() * 3;
        this.type = Math.random() > 0.95 ? 'rainbow' : 'normal';
        this.colorKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
        this.color = COLORS[this.colorKey];
        this.vx = (Math.random() - 0.5) * 1;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.05 + Math.random() * 0.05;
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        if (this.y < -this.radius) {
            this.reset();
        }
        this.wobbleOffset += this.wobbleSpeed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.type === 'rainbow') {
            ctx.fillStyle = `hsl(${Date.now() / 5 % 360}, 80%, 70%)`;
        } else {
            ctx.fillStyle = this.color.main;
        }
        ctx.fill();

        const wobbleX = Math.sin(this.wobbleOffset) * 3;
        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        ctx.strokeStyle = this.color.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

class Bottle {
    constructor(x, colorKey) {
        this.x = x;
        this.y = canvas.height - 80;
        this.width = 60;
        this.height = 80;
        this.colorKey = colorKey;
        this.color = COLORS[colorKey];
        this.fillLevel = 0;
        this.targetFillLevel = 0;
        this.shake = 0;
    }

    update() {
        if (this.fillLevel < this.targetFillLevel) {
            this.fillLevel += 0.05;
        } else if (this.fillLevel > this.targetFillLevel) {
            this.fillLevel -= 0.05;
        }
        if (this.shake > 0) {
            this.shake--;
        }
    }

    draw() {
        const centerX = this.x + this.width / 2;
        const offsetX = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
        const currentX = this.x + offsetX;

        // Bottle Body
        ctx.strokeStyle = '#5d5d5d';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(currentX, this.y + 20);
        ctx.lineTo(currentX, this.y + this.height);
        ctx.lineTo(currentX + this.width, this.y + this.height);
        ctx.lineTo(currentX + this.width, this.y + 20);
        ctx.lineTo(currentX + this.width * 0.7, this.y + 20);
        ctx.lineTo(currentX + this.width * 0.7, this.y);
        ctx.lineTo(currentX + this.width * 0.3, this.y);
        ctx.lineTo(currentX + this.width * 0.3, this.y + 20);
        ctx.closePath();
        ctx.stroke();
        
        // Potion Fill
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(currentX + 2, this.y + 22);
        ctx.lineTo(currentX + 2, this.y + this.height - 2);
        ctx.lineTo(currentX + this.width - 2, this.y + this.height - 2);
        ctx.lineTo(currentX + this.width - 2, this.y + 22);
        ctx.clip();
        
        const fillHeight = this.fillLevel * (this.height - 24);
        ctx.fillStyle = this.color.main;
        ctx.fillRect(currentX, this.y + this.height - 22 - fillHeight, this.width, fillHeight);
        ctx.restore();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.fillRect(currentX + 5, this.y + 40, this.width - 10, 20);
        ctx.fillStyle = '#5d5d5d';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.colorKey.toUpperCase(), centerX + offsetX, this.y + 53);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
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
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Sparkle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3;
        this.speed = 0.2 + Math.random() * 0.5;
        this.alpha = 0.1 + Math.random() * 0.5;
        this.fadeSpeed = 0.005 + Math.random() * 0.01;
    }

    update() {
        this.y -= this.speed;
        this.alpha -= this.fadeSpeed;
        if (this.alpha <= 0 || this.y < 0) this.reset();
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = 'white';
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
        this.vy = -2;
    }
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

function initGame() {
    score = 0;
    timeLeft = 60;
    bubbles = [];
    bottles = [];
    particles = [];
    floatingTexts = [];
    
    const spacing = canvas.width / 4;
    for (let i = 0; i < 4; i++) {
        bottles.push(new Bottle(spacing * i + spacing / 2 - 30, COLOR_KEYS[i]));
    }
    
    for (let i = 0; i < 5; i++) {
        bubbles.push(new Bubble());
    }

    sparkles = [];
    for (let i = 0; i < 30; i++) {
        sparkles.push(new Sparkle());
    }
    
    scoreElement.innerText = `Score: ${score}`;
    timerElement.innerText = `Time: ${timeLeft}s`;
}

function spawnBubble() {
    if (bubbles.length < 10) {
        bubbles.push(new Bubble());
    }
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw sparkles
    sparkles.forEach(s => {
        s.update();
        s.draw();
    });

    // Update and draw bottles
    bottles.forEach(bottle => {
        bottle.update();
        bottle.draw();
    });

    // Update and draw bubbles
    bubbles.forEach((bubble, index) => {
        bubble.update();
        bubble.draw();

        // Collision check with bottles
        bottles.forEach(bottle => {
            if (bubble.y + bubble.radius > bottle.y && 
                bubble.y - bubble.radius < bottle.y + bottle.height &&
                bubble.x + bubble.radius > bottle.x &&
                bubble.x - bubble.radius < bottle.x + bottle.width) {
                
                if (bubble.colorKey === bottle.colorKey) {
                    if (bubble.colorKey === lastColorKey || bubble.type === 'rainbow') {
                        combo++;
                    } else {
                        combo = 1;
                    }
                    lastColorKey = bubble.colorKey;

                    const points = 10 * combo;
                    score += points;
                    scoreElement.innerText = `Score: ${score}`;
                    if (combo > 1) {
                        floatingTexts.push(new FloatingText(bubble.x, bubble.y, `x${combo} COMBO! ✨`, '#ffeb3b'));
                    }
                    bottle.targetFillLevel = Math.min(1, bottle.targetFillLevel + 0.1);
                    
                    // Particle effect
                    for (let i = 0; i < 10; i++) {
                        particles.push(new Particle(bubble.x, bubble.y, bubble.color.main));
                    }
                    
                    bubbles.splice(index, 1);
                    spawnBubble();
                } else {
                    if (bubble.type === 'rainbow') {
                        combo++;
                        const points = 20 * combo;
                        score += points;
                        scoreElement.innerText = `Score: ${score}`;
                        floatingTexts.push(new FloatingText(bubble.x, bubble.y, `RAINBOW POP! 🌈`, '#ff00ff'));
                        bottle.targetFillLevel = Math.min(1, bottle.targetFillLevel + 0.1);
                        for (let i = 0; i < 15; i++) {
                            particles.push(new Particle(bubble.x, bubble.y, '#ffffff'));
                        }
                        bubbles.splice(index, 1);
                        spawnBubble();
                    } else {
                        combo = 0;
                        lastColorKey = null;
                        score = Math.max(0, score - 5);
                        scoreElement.innerText = `Score: ${score}`;
                        bottle.shake = 10;
                        bubbles.splice(index, 1);
                        spawnBubble();
                    }
                }
            }
        });
    });

    // Update and draw particles
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

    timeLeft -= 1/60;
    timerElement.innerText = `Time: ${Math.floor(timeLeft)}s`;

    if (timeLeft <= 0) {
        endGame();
    }

    requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    overlay.classList.remove('hidden');
    document.getElementById('overlay-title').innerText = "Time's Up!";
    document.getElementById('overlay-text').innerText = `You brewed ${score} points worth of magical potions! ✨`;
    startButton.innerText = 'Try Again! ✨';
}

startButton.addEventListener('click', () => {
    overlay.classList.add('hidden');
    initGame();
    gameActive = true;
    update();
});
