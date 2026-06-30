const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const clearButton = document.getElementById('clear-garden');

let score = 0;
let level = 1;
let stars = [];
const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FFD700', '#FF69B4', '#7B68EE', '#00FA9A'];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
        this.growth = Math.random() * 0.1 + 0.05;
        this.currentSize = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Draw a star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * this.currentSize,
                       Math.sin((18 + i * 72) / 180 * Math.PI) * this.currentSize);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (this.currentSize / 2),
                       Math.sin((54 + i * 72) / 180 * Math.PI) * (this.currentSize / 2));
        }
        ctx.closePath();
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.restore();
    }

    update() {
        if (this.currentSize < this.size * 3) {
            this.currentSize += this.growth;
        }
        this.rotation += this.rotationSpeed;
        // Slowly fade out after reaching full size
        if (this.currentSize >= this.size * 3) {
            this.alpha -= 0.002;
        }
    }
}

function createStar(e) {
    const x = e.clientX;
    const y = e.clientY;
    stars.push(new Star(x, y));
    score++;
    scoreElement.innerText = score;
    
    // Level up logic: Every 10 stars, level up and add some bonus sparkles
    if (score % 10 === 0) {
        level++;
        levelElement.innerText = level;
        
        // Celebration sparkles
        for (let i = 0; i < 30; i++) {
            sparkles.push(new Sparkle(x, y, true));
        }
    }
    
    // Add some "sparkle" particles around the new star
    for (let i = 0; i < 8; i++) {
        sparkles.push(new Sparkle(x, y));
    }
}

class Sparkle {
    constructor(x, y, isCelebration = false) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * (isCelebration ? 8 : 4);
        this.vy = (Math.random() - 0.5) * (isCelebration ? 8 : 4);
        this.size = Math.random() * 3 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
}

let sparkles = [];

function animate() {
    // Use a semi-transparent rectangle for a trailing effect
    ctx.fillStyle = 'rgba(15, 15, 26, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star, index) => {
        star.update();
        star.draw();
        if (star.alpha <= 0) {
            stars.splice(index, 1);
        }
    });

    sparkles.forEach((sparkle, index) => {
        sparkle.update();
        sparkle.draw();
        if (sparkle.life <= 0) {
            sparkles.splice(index, 1);
        }
    });

    requestAnimationFrame(animate);
}

canvas.addEventListener('mousedown', createStar);
clearButton.addEventListener('click', () => {
    stars = [];
    sparkles = [];
    score = 0;
    level = 1;
    scoreElement.innerText = score;
    levelElement.innerText = level;
});

animate();
