const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

let score = 0;
let gameActive = false;
let chimes = [];
let particles = [];
let width, height;

// Audio context for generating synthesized chime sounds
let audioCtx;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playChimeSound(frequency) {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.5);
}

class Chime {
    constructor(x) {
        this.x = x;
        this.y = -50;
        this.targetY = 100 + Math.random() * 200;
        this.width = 15 + Math.random() * 20;
        this.height = 100 + Math.random() * 150;
        this.color = `hsl(${Math.random() * 360}, 70%, 80%)`;
        this.frequency = 200 + Math.random() * 800;
        this.angle = 0;
        this.angularVelocity = 0;
        this.isSwinging = false;
        this.length = this.height;
    }

    update() {
        if (!this.isSwinging) {
            this.y = this.targetY;
        } else {
            this.angle += this.angularVelocity;
            this.angularVelocity *= 0.98; // Damping
            if (Math.abs(this.angularVelocity) < 0.01) {
                this.isSwinging = false;
                this.angularVelocity = 0;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, 0);
        if (this.isSwinging) {
            ctx.rotate(this.angle);
        }
        
        // Draw the string/wire
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.length);
        ctx.stroke();
        
        // Draw the chime body
        const gradient = ctx.createLinearGradient(0, this.length, 0, this.length + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'white');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect( -this.width/2, this.length, this.width, this.height, 5);
        ctx.fill();
        
        // Glossy highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(-this.width/4, this.length + 10, this.width/5, this.height - 20, 5);
        ctx.fill();
        
        ctx.restore();
    }

    hitTest(mx, my) {
        // Simple approximate hit test for the chime body
        const bodyTop = this.isSwinging ? 
            this.length * Math.cos(this.angle) : this.length;
        const bodyLeft = this.isSwinging ? 
            this.x + this.length * Math.sin(this.angle) : this.x;
        
        // For simplicity in this "whimsical" game, we'll use a slightly generous hit area
        return mx > this.x - 30 && mx < this.x + 30 && my > this.length && my < this.length + this.height;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
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

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function spawnChime() {
    if (chimes.length < 8) {
        const x = 50 + Math.random() * (width - 100);
        chimes.push(new Chime(x));
    }
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, width, height);
    
    // Draw wind effect (gentle floating particles)
    ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
        const wx = (Date.now() * 0.05 + i * 100) % width;
        const wy = (Math.sin(Date.now() * 0.001 + i) * 50) + (height * (i / 20));
        ctx.beginPath();
        ctx.arc(wx, wy, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    chimes.forEach((chime, index) => {
        chime.update();
        chime.draw();
    });

    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    requestAnimationFrame(update);
}

function handleInput(e) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX || e.touches[0].clientX) - rect.left;
    const my = (e.clientY || e.touches[0].clientY) - rect.top;

    chimes.forEach(chime => {
        if (chime.hitTest(mx, my)) {
            chime.isSwinging = true;
            chime.angularVelocity = (Math.random() - 0.5) * 0.2;
            playChimeSound(chime.frequency);
            
            score += 10;
            scoreElement.innerText = `Melody Points: ${score}`;
            
            // Burst of particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(mx, my, chime.color));
            }
            
            // Change message based on score
            if (score === 100) messageElement.innerText = "You're creating a song! ✨";
            if (score === 200) messageElement.innerText = "The wind is dancing with you! 🌈";
            if (score === 500) messageElement.innerText = "A true Maestro of the Wind! 🎶";
        }
    });
}

function start() {
    initAudio();
    gameActive = true;
    startScreen.style.opacity = '0';
    setTimeout(() => {
        startScreen.style.display = 'none';
    }, 500);
    
    resize();
    // Initial chimes
    for (let i = 0; i < 8; i++) {
        spawnChime();
    }
    
    update();
}

window.addEventListener('resize', resize);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });
startButton.addEventListener('click', start);
