const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const sparkleCanvas = document.getElementById('sparkleCanvas');
const sCtx = sparkleCanvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const currentColorDisplay = document.getElementById('currentColor');

let painting = false;
let hue = 0;
let sparkles = [];
let currentTool = 'brush';

class Sparkle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size/2, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size/2, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = 500;
    sparkleCanvas.width = wrapper.clientWidth;
    sparkleCanvas.height = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startPosition(e) {
    painting = true;
    draw(e);
}

function finishedPosition() {
    painting = false;
    ctx.beginPath();
}

function draw(e) {
    if (!painting) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineWidth = brushSizeInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const color = `hsl(${hue}, 100%, 75%)`;

    if (currentTool === 'brush') {
        ctx.strokeStyle = color;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        if (Math.random() > 0.5) {
            sparkles.push(new Sparkle(x, y, color));
        }
        hue += 2;
        if (hue >= 360) hue = 0;
        currentColorDisplay.textContent = '✨ Rainbow ✨';
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        currentColorDisplay.textContent = '🧹 Magic Eraser';
    } else if (currentTool === 'star') {
        drawStamp('⭐', x, y, color);
    } else if (currentTool === 'heart') {
        drawStamp('❤️', x, y, color);
    } else if (currentTool === 'cloud') {
        drawStamp('☁️', x, y, color);
    }

    if (Math.random() > 0.8) {
        sparkles.push(new Sparkle(x, y, color));
    }
}

function drawStamp(emoji, x, y, color) {
    ctx.font = `${brushSizeInput.value * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    // For stamps, we use the emoji but can apply a slight glow/color
    ctx.fillText(emoji, x, y);
    
    // Also add a burst of sparkles
    for(let i=0; i<5; i++) {
        sparkles.push(new Sparkle(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20, color));
    }
}

function animateSparkles() {
    sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].update();
        sparkles[i].draw(sCtx);
        if (sparkles[i].life <= 0) {
            sparkles.splice(i, 1);
        }
    }
    requestAnimationFrame(animateSparkles);
}

animateSparkles();

// Tool Selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        playSound(440, 'sine', 0.1);
    });
});

function playSound(freq, type, duration) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startPosition(e.touches[0]);
}, { passive: false });

canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e.touches[0]);
}, { passive: false });

brushSizeInput.addEventListener('input', () => {
    sizeVal.textContent = brushSizeInput.value;
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparkles = [];
});

saveBtn.addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.drawImage(sparkleCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'my-pastel-masterpiece.png';
    link.href = tempCanvas.toDataURL();
    link.click();
});
