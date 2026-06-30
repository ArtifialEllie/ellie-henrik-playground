const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');
const rhythmRing = document.getElementById('rhythm-ring');

let score = 0;
let multiplier = 1;
let gameActive = false;
let stars = [];
let particles = [];
let backgroundStars = [];
let lastStarTime = 0;
let starSpawnRate = 1500; 
let gameTimer = 0;
const GAME_DURATION = 60000; // 60 seconds

const STAR_TYPES = {
    NORMAL: { points: 1, speedMult: 1, colorFunc: () => `hsl(${Math.random() * 360}, 100%, 70%)` },
    GOLDEN: { points: 3, speedMult: 1.5, color: '#ffd700' },
    VOID: { points: -5, speedMult: 0.7, color: '#4b0082' }
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rhythmRing.style.width = '100px';
    rhythmRing.style.height = '100px';
    initBackground();
}

function initBackground() {
    backgroundStars = [];
    for (let i = 0; i < 150; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            opacity: Math.random(),
            speed: Math.random() * 0.05
        });
    }
}

window.addEventListener('resize', resize);
resize();

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        const rand = Math.random();
        if (rand > 0.9) {
            this.type = 'GOLDEN';
        } else if (rand > 0.75) {
            this.type = 'VOID';
        } else {
            this.type = 'NORMAL';
        }

        const typeCfg = STAR_TYPES[this.type];
        const side = Math.floor(Math.random() * 4);
        const size = 10 + Math.random() * 20;
        this.size = size;
        
        this.color = typeCfg.color || typeCfg.colorFunc();
        
        const speedMult = typeCfg.speedMult;

        if (side === 0) { // Top
            this.x = Math.random() * canvas.width;
            this.y = -this.size;
            this.vx = (canvas.width / 2 - this.x) * 0.01;
            this.vy = (Math.random() * 2 + 2) * speedMult;
        } else if (side === 1) { // Right
            this.x = canvas.width + this.size;
            this.y = Math.random() * canvas.height;
            this.vx = -(Math.random() * 2 + 2) * speedMult;
            this.vy = (canvas.height / 2 - this.y) * 0.01;
        } else if (side === 2) { // Bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.size;
            this.vx = (canvas.width / 2 - this.x) * 0.01;
            this.vy = -(Math.random() * 2 + 2) * speedMult;
        } else { // Left
            this.x = -this.size;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() * 2 + 2) * speedMult;
            this.vy = (canvas.height / 2 - this.y) * 0.01;
        }
        
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.type === 'GOLDEN' ? 25 : 15;
        ctx.shadowColor = this.color;
        
        if (this.type === 'VOID') {
            // Draw void as a pulsing circle with a ring
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size,
                               Math.sin((18 + i * 72) * Math.PI / 180) * this.size);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.size/2),
                               Math.sin((54 + i * 72) * Math.PI / 180) * (this.size/2));
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
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
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createHitText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'hit-text';
    el.innerText = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function checkHit(x, y) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    // Precision windows
    if (dist < 30) return 'PERFECT';
    if (dist < 60) return 'GREAT';
    if (dist < 90) return 'GOOD';
    return 'MISS';
}

function handleInteraction(e) {
    if (!gameActive) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    let hitSomething = false;
    
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const dist = Math.sqrt((star.x - clientX) ** 2 + (star.y - clientY) ** 2);
        
        if (dist < star.size * 2) {
            const hitQuality = checkHit(star.x, star.y);
            
            if (star.type === 'VOID') {
                createHitText(star.x, star.y, 'VOID TOUCH!', '#ff0000');
                score = Math.max(0, score - 500);
                multiplier = 1;
                
                // Explosion of dark particles
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(star.x, star.y, '#4b0082'));
                }
                
                star.active = false;
                hitSomething = true;
            } else if (hitQuality !== 'MISS') {
                const points = { 'PERFECT': 100, 'GREAT': 50, 'GOOD': 20 };
                const typeMult = STAR_TYPES[star.type].points;
                score += points[hitQuality] * multiplier * typeMult;
                multiplier++;
                
                createHitText(star.x, star.y, hitQuality, '#fff');
                
                // Explosion of particles
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(star.x, star.y, star.color));
                }
                
                star.active = false;
                hitSomething = true;
            } else {
                // Clicked a star but it was too far from the ring
                createHitText(star.x, star.y, 'TOO EARLY!', '#ff4444');
                multiplier = 1;
            }
            break;
        }
    }
    
    if (!hitSomething) {
        multiplier = 1;
        // Shake the ring a bit
        rhythmRing.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            rhythmRing.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
    }
}

window.addEventListener('mousedown', handleInteraction);
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInteraction(e);
}, { passive: false });

function update() {
    if (!gameActive) return;
    
    gameTimer += 16.67; // approx 60fps
    
    if (gameTimer >= GAME_DURATION) {
        endGame();
        return;
    }
    
    const now = Date.now();
    if (now - lastStarTime > starSpawnRate) {
        stars.push(new Star());
        lastStarTime = Date.now();
        // Gradually increase difficulty
        starSpawnRate = Math.max(600, 1500 - (gameTimer / 100));
    }
    
    stars.forEach(star => {
        star.update();
        if (star.x < -100 || star.x > canvas.width + 100 || star.y < -100 || star.y > canvas.height + 100) {
            star.active = false;
        }
    });
    
    stars = stars.filter(star => star.active);
    
    particles.forEach(particle => {
        particle.update();
    });
    
    particles = particles.filter(particle => particle.life > 0);
    
    scoreElement.innerText = score;
    multiplierElement.innerText = `x${multiplier}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background stars
    backgroundStars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Twinkle effect
        star.opacity += (Math.random() - 0.5) * 0.02;
        if (star.opacity < 0.1) star.opacity = 0.1;
        if (star.opacity > 1) star.opacity = 1;
    });
    
    stars.forEach(star => star.draw());
    particles.forEach(particle => particle.draw());
    
    // Rhythm ring visual feedback (pulsing)
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.05;
    rhythmRing.style.width = (100 * pulse) + 'px';
    rhythmRing.style.height = (100 * pulse) + 'px';
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    multiplier = 1;
    gameTimer = 0;
    stars = [];
    particles = [];
    gameActive = true;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Reset spawn rate
    starSpawnRate = 1500;
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

gameLoop();
