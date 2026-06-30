const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const seedElements = document.querySelectorAll('.seed');

let score = 0;
let activeSeedType = 'pink';
let activeColor = '#ffccff';
let stars = [];
let particles = [];

// Resize canvas to fill screen
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Seed selection
seedElements.forEach(seed => {
    seed.addEventListener('click', () => {
        seedElements.forEach(s => s.classList.remove('active'));
        seed.classList.add('active');
        activeSeedType = seed.dataset.type;
        activeColor = seed.dataset.color;
    });
});

class StarFlower {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.size = 0;
        this.maxSize = 15 + Math.random() * 20;
        this.growthRate = type === 'pink' ? 0.5 : (type === 'blue' ? 0.2 : 0.1);
        this.value = type === 'blue' ? 10 : (type === 'gold' ? 50 : 5);
        this.isHarvested = false;
        this.pulse = 0;
        this.growthStage = 0; // 0: seed, 1: sprouting, 2: blooming
    }

    update() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
            if (this.size > this.maxSize * 0.4) this.growthStage = 1;
            if (this.size > this.maxSize * 0.8) this.growthStage = 2;
        }
        this.pulse += 0.05;
    }

    draw() {
        const pulseSize = Math.sin(this.pulse) * 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        if (this.growthStage === 0) {
            // Seed
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5 + 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.growthStage === 1) {
            // Sprout
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y - this.size);
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        } else {
            // Bloom - Star shape
            this.drawStar(this.x, this.y, 5, this.size + pulseSize, this.size / 2);
        }
        ctx.shadowBlur = 0;
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
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
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

canvas.addEventListener('mousedown', (e) => {
    stars.push(new StarFlower(e.clientX, e.clientY, activeSeedType, activeColor));
    
    // Initial plant effect
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(e.clientX, e.clientY, activeColor));
    }
});

canvas.addEventListener('mouseup', (e) => {
    // Check for harvesting
    stars.forEach((star, index) => {
        const dist = Math.hypot(star.x - e.clientX, star.y - e.clientY);
        if (dist < star.size * 1.5 && star.growthStage === 2) {
            score += star.value;
            scoreElement.innerText = score;
            
            // Harvest effect
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(star.x, star.y, star.color));
            }
            stars.splice(index, 1);
        }
    });
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background "dust"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(Date.now() * 0.001 + i * 1.1) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    stars.forEach((star, starIdx) => {
        star.update();
        star.draw();
    });

    particles.forEach((particle, particleIdx) => {
        particle.update();
        particle.draw();
        if (particle.life <= 0) particles.splice(particleIdx, 1);
    });

    requestAnimationFrame(animate);
}

animate();
