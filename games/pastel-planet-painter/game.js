const canvas = document.getElementById('planet-canvas');
const ctx = canvas.getContext('2d');
const palette = document.getElementById('palette');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');

let painting = false;
let currentColor = '#FFB7B2';
let planetRadius = 250;

// Initialize canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawBasePlanet();
}

window.addEventListener('resize', resizeCanvas);

function drawBasePlanet() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Space background (handled by CSS, but let's add some stars)
    ctx.fillStyle = 'white';
    for(let i=0; i<100; i++) {
        ctx.beginPath();
        ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*1.5, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw the basic planet circle
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    
    // Planet glow
    const glow = ctx.createRadialGradient(0, 0, planetRadius * 0.8, 0, 0, planetRadius * 1.2);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Base planet color (light greyish pastel)
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Basic shading for 3D effect
    const grad = ctx.createRadialGradient(-planetRadius/3, -planetRadius/3, planetRadius/10, 0, 0, planetRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate distance from planet center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dist = Math.sqrt((x - centerX)**2 + (y - centerY)**2);

    // Only paint if inside the planet
    if (dist <= planetRadius) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 20;
        
        // Simple brush effect
        ctx.beginPath();
        ctx.moveTo(x, y); // This is actually a bit flawed for lines, but works for dots
        ctx.lineTo(x, y); 
        ctx.stroke();
    }
}

// Better line drawing
function handleMouseMove(e) {
    if (!painting) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dist = Math.sqrt((x - centerX)**2 + (y - centerY)**2);
    
    if (dist <= planetRadius) {
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    lastX = x;
    lastY = y;
}

let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    startPosition(e);
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', handleMouseMove);

// Color selection
palette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-swatch')) {
        document.querySelector('.color-swatch.active').classList.remove('active');
        e.target.classList.add('active');
        currentColor = e.target.dataset.color;
    }
});

clearBtn.addEventListener('click', () => {
    if(confirm("Are you sure you want to wipe your magical planet? ✨")) {
        resizeCanvas();
    }
});

saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my-pastel-planet.png';
    link.href = canvas.toDataURL();
    link.click();
});

resizeCanvas();
