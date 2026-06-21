const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const brushStarBtn = document.getElementById('brush-star');
const brushLineBtn = document.getElementById('brush-line');
const brushGlowBtn = document.getElementById('brush-glow');

let currentBrush = 'star';
let isDrawing = false;
let stars = [];
let lines = [];
let lastStar = null;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
}

window.addEventListener('resize', resize);
resize();

function setBrush(brush, btn) {
    currentBrush = brush;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

brushStarBtn.onclick = () => setBrush('star', brushStarBtn);
brushLineBtn.onclick = () => setBrush('line', brushLineBtn);
brushGlowBtn.onclick = () => setBrush('glow', brushGlowBtn);

clearBtn.onclick = () => {
    stars = [];
    lines = [];
    redraw();
};

saveBtn.onclick = () => {
    const link = document.createElement('a');
    link.download = 'my-constellation.png';
    link.href = canvas.toDataURL();
    link.click();
};

function drawStar(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a little glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 4, 0, Math.PI * 2);
    ctx.fill();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background static stars (ambient)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 100; i++) {
        // Simple deterministic noise for background
        const x = (Math.sin(i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 1.1) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    lines.forEach(line => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);
        ctx.stroke();
    });

    stars.forEach(star => {
        drawStar(star.x, star.y, star.size, star.color);
    });
    
    ctx.setLineDash([]);
}

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const x = e.clientX;
    const y = e.clientY;

    if (currentBrush === 'star') {
        const size = Math.random() * 3 + 1;
        stars.push({ x, y, size, color: colorPicker.value });
        lastStar = { x, y };
    } else if (currentBrush === 'line') {
        // Find nearest star to start from
        let nearest = null;
        let minDist = Infinity;
        stars.forEach(s => {
            const d = Math.hypot(s.x - x, s.y - y);
            if (d < 20) {
                nearest = s;
                minDist = d;
            }
        });

        if (nearest) {
            lastStar = nearest;
        } else {
            // If no star nearby, create one
            const size = Math.random() * 3 + 1;
            stars.push({ x: x, y: y, size, color: colorPicker.value });
            lastStar = { x, y };
        }
    } else if (currentBrush === 'glow') {
        // Glow brush just adds a larger, softer star
        const size = Math.random() * 5 + 2;
        stars.push({ x, y, size, color: colorPicker.value });
    }

    redraw();
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || currentBrush !== 'line') return;
    
    const x = e.clientX;
    const y = e.clientY;

    if (lastStar) {
        // Only create line if we've moved enough
        const d = Math.hypot(lastStar.x - x, lastStar.y - y);
        if (d > 10) {
            // Check if we are near another star
            let nearest = null;
            let minDist = Infinity;
            stars.forEach(s => {
                const d2 = Math.hypot(s.x - x, s.y - y);
                if (d2 < 20) {
                    nearest = s;
                    minDist = d2;
                }
            });

            if (nearest) {
                lines.push({ start: lastStar, end: nearest, color: colorPicker.value });
                lastStar = nearest;
            }
        }
    }
    redraw();
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    lastStar = null;
});

// Initial draw
redraw();
