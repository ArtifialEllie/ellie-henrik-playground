/**
 * Nebula Nibble Nom! ✨
 * A whimsical snake-like game in space.
 * Nom is a cute space-blob who loves eating star-bits!
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const overlay = document.getElementById('message-overlay');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const GRID_SIZE = 20;
let tileCount;
let score = 0;
let dx = 0;
let dy = 0;
let nom = [];
let star = { x: 10, y: 10 };
let gameSpeed = 100;
let gameLoop;
let isPaused = false;

// Colors
const COLORS = {
    nomHead: '#ff85a2',
    nomBody: '#a285ff',
    star: '#ffd700',
    bg: '#0f0c29'
};

function init() {
    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;
    tileCount = canvas.width / GRID_SIZE;

    // Start position
    nom = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.innerText = score;
    overlay.classList.add('hidden');
    
    spawnStar();
    gameLoop = setInterval(update, gameSpeed);
}

function spawnStar() {
    star.x = Math.floor(Math.random() * tileCount);
    star.y = Math.floor(Math.random() * tileCount);
    
    // Make sure star doesn't spawn on Nom
    nom.forEach(part => {
        if (part.x === star.x && part.y === star.y) spawnStar();
    });
}

function update() {
    if (isPaused) return;

    // Move head
    const head = { x: nom[0].x + dx, y: nom[0].y + dy };

    // Only move if a direction is set
    if (dx !== 0 || dy !== 0) {
        nom.unshift(head);
        
        // Check if Nom ate a star
        if (head.x === star.x && head.y === star.y) {
            score++;
            scoreElement.innerText = score;
            spawnStar();
            // Slightly increase speed
            if (gameSpeed > 50) {
                clearInterval(gameLoop);
                gameSpeed -= 2;
                gameLoop = setInterval(update, gameSpeed);
            }
        } else {
            nom.pop();
        }

        // Collision: Walls
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
        }

        // Collision: Self
        for (let i = 1; i < nom.length; i++) {
            if (head.x === nom[i].x && head.y === nom[i].y) {
                gameOver();
            }
        }
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Stars Background (Static decor)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for(let i=0; i<50; i++) {
        const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 567.8) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Star (the food)
    ctx.fillStyle = COLORS.star;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.star;
    ctx.beginPath();
    ctx.arc(
        star.x * GRID_SIZE + GRID_SIZE / 2,
        star.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Nom
    nom.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? COLORS.nomHead : COLORS.nomBody;
        
        // Make Nom look bubbly
        const padding = 2;
        const radius = GRID_SIZE / 2 - padding;
        
        ctx.beginPath();
        ctx.arc(
            part.x * GRID_SIZE + GRID_SIZE / 2,
            part.y * GRID_SIZE + GRID_SIZE / 2,
            radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Eyes for the head
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + 6,
                part.y * GRID_SIZE + 6,
                3,
                0,
                Math.PI * 2
            );
            ctx.arc(
                part.x * GRID_SIZE + 14,
                part.y * GRID_SIZE + 6,
                3,
                0
                ,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + 6,
                part.y * GRID_SIZE + 6,
                1.5,
                0,
                Math.PI * 2
            );
            ctx.arc(
                part.x * GRID_SIZE + 14,
                part.y * GRID_SIZE + 6,
                1.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

restartBtn.addEventListener('click', () => {
    score = 0;
    gameSpeed = 100;
    init();
});

init();
