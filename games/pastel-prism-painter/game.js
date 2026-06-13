const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const currentColorDisplay = document.getElementById('currentColor');

let painting = false;
let hue = 0;

// Setup canvas size
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = 500;
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

    // Handle touch or mouse
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineWidth = brushSizeInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Rainbow effect: hue cycles as you draw
    ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    hue += 2;
    if (hue >= 360) hue = 0;
}

// Event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startPosition(e.touches[0]);
}, { passive: false });

canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e.touches[0]);
}, { passive: false });

// Brush size update
brushSizeInput.addEventListener('input', () => {
    sizeVal.textContent = brushSizeInput.value;
});

// Clear canvas
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Save canvas
saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my-pastel-masterpiece.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Sparkle effect periodically
setInterval(() => {
    if (painting) {
        // We could add sparkles here, but keep it simple for now
    }
}, 100);
