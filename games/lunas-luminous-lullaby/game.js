const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

let score = 0;
let gameActive = false;
let stars = [];
let particles = [];
let moon = {
    x: 0,
    y: 0,
    radius: 30,
    color: '#ffffcc',
    targetX: 0
};

function resize() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    moon.y = canvas.height - 60;
    moon.x = canvas.width / 2;
    moon.targetX = moon.x;
}

window.addEventListener('resize', resize);
resize();

function createStar() {
    return {
        x: Math.random() * canvas.width,
        y: -20,
        radius: Math.random() * 5 + 3,
        speed: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 80%)`,
        angle: 0,
        spin: Math.random() * 0.05 - 0.025
    };
}

function createParticle(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            radius: Math.random() * 3,
            color: color,
            life: 1.0
        });
    }
}

function drawMoon() {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = moon.color;
    
    // Main moon body
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    ctx.fillStyle = moon.color;
    ctx.fill();
    
    // Moon crescent shadow
    ctx.beginPath();
    ctx.arc(moon.x + 10, moon.y - 5, moon.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a2e';
    ctx.fill();
    
    ctx.restore();
}

function drawStar(star) {
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(star.angle);
    ctx.shadowBlur = 15;
    ctx.shadowColor = star.color;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((i * 0.8 * Math.PI) - Math.PI/2) * star.radius, 
                   Math.sin((i * 0.8 * Math.PI) - Math.PI/2) * star.radius);
        ctx.lineTo(Math.cos((i * 0.8 * Math.PI + 0.4 * Math.PI) - Math.PI/2) * (star.radius * 0.5), 
                   Math.sin((i * 0.8 * Math.PI + 0.4 * Math.PI) - Math.PI/2) * (star.radius * 0.5));
    }
    ctx.closePath();
    ctx.fillStyle = star.color;
    ctx.fill();
    
    ctx.restore();
}

function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color === '#ffffcc' ? '255,255,204' : '150,200,255'}, ${p.life})`;
    ctx.fill();
}

function update() {
    if (!gameActive) return;

    // Smooth moon movement
    moon.x += (moon.targetX - moon.x) * 0.15;

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.y += star.speed;
        star.angle += star.spin;

        // Collision detection
        const dx = star.x - moon.x;
        const dy = star.y - moon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < moon.radius + star.radius) {
            score++;
            scoreElement.textContent = `Stars Collected: ${score}`;
            createParticle(star.x, star.y, star.color);
            stars.splice(i, 1);
            
            if (score % 10 === 0) {
                messageElement.textContent = "Sparkling! ✨";
                setTimeout(() => {
                    messageElement.textContent = "Catch the falling stars to play Luna's Lullaby!";
                }, 2000);
            }
        } else if (star.y > canvas.height + 20) {
            stars.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Spawn stars
    if (Math.random() < 0.03) {
        stars.push(createStar());
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background stars (static)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    stars.forEach(drawStar);
    particles.forEach(drawParticle);
    drawMoon();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Input handling
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    moon.targetX = e.clientX - rect.left;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    moon.targetX = touch.clientX - rect.left;
}, { passive: false });

startButton.addEventListener('click', () => {
    startScreen.style.opacity = '0';
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameActive = true;
    }, 500);
});

loop();
