const COLORS = {
    pink: '#ff69b4',
    blue: '#00bfff',
    yellow: '#ffff00',
    green: '#7cfc00'
};

let score = 0;
let timeLeft = 60;
let gameActive = false;
let spawnTimer = null;
let countdownTimer = null;
let activeCupcakes = [];

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const gameWorld = document.getElementById('game-world');
const belt = document.getElementById('conveyor-belt');

function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
}

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    activeCupcakes = [];
    
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Clear any existing cupcakes
    document.querySelectorAll('.cupcake').forEach(c => c.remove());
    
    spawnTimer = setInterval(spawnCupcake, 1500);
    countdownTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function spawnCupcake() {
    if (!gameActive) return;

    const colors = Object.keys(COLORS);
    const colorKey = colors[Math.floor(Math.random() * colors.length)];
    const colorValue = COLORS[colorKey];

    const cupcake = document.createElement('div');
    cupcake.className = 'cupcake';
    cupcake.dataset.color = colorKey;
    
    // Create cupcake parts
    const base = document.createElement('div');
    base.className = 'cupcake-base';
    
    const frosting = document.createElement('div');
    frosting.className = 'cupcake-frosting';
    frosting.style.backgroundColor = colorValue;
    
    const cherry = document.createElement('div');
    cherry.className = 'cherry';
    
    cupcake.appendChild(base);
    cupcake.appendChild(frosting);
    cupcake.appendChild(cherry);
    
    // Initial position
    cupcake.style.left = '-80px';
    cupcake.style.bottom = '160px';
    
    gameWorld.appendChild(cupcake);
    
    makeDraggable(cupcake);
    
    // Animation loop for movement on belt
    const moveInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(moveInterval);
            return;
        }
        
        const currentLeft = parseInt(cupcake.style.left);
        if (cupcake.dataset.dragging === 'true') {
            // Don't move automatically while dragging
        } else {
            cupcake.style.left = (currentLeft + 2) + 'px';
        }
        
        if (currentLeft > window.innerWidth) {
            cupcake.remove();
            activeCupcakes = activeCupcakes.filter(c => c !== cupcake);
            clearInterval(moveInterval);
        }
    }, 20);
    
    activeCupcakes.push(cupcake);
}

function makeDraggable(el) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    el.addEventListener('mousedown', (e) => {
        isDragging = true;
        el.dataset.dragging = 'true';
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.zIndex = 1000;
        el.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top = (e.clientY - offsetY) + 'px';
        // We remove the bottom property since we're now using top
        el.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.dataset.dragging = 'false';
        el.style.zIndex = 5;
        el.style.cursor = 'grab';
        
        // Check if dropped in a portal
        checkPortalCollision(el, e.clientX, e.clientY);
    });
}

function checkPortalCollision(cupcake, x, y) {
    const portals = document.querySelectorAll('.portal');
    let matched = false;

    portals.forEach(portal => {
        const rect = portal.getBoundingClientRect();
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            if (portal.dataset.color === cupcake.dataset.color) {
                score++;
                scoreEl.textContent = score;
                createParticles(x, y, COLORS[cupcake.dataset.color]);
                cupcake.remove();
                matched = true;
            } else {
                score = Math.max(0, score - 1);
                scoreEl.textContent = score;
                createParticles(x, y, '#ff0000');
                cupcake.remove();
                matched = true;
            }
        }
    });

    if (!matched) {
        // Return to belt if missed
        cupcake.style.bottom = '160px';
        cupcake.style.top = 'auto';
        cupcake.dataset.dragging = 'false';
        // Resume moving on belt
        // (The moveInterval is already handling it, but since we didn't 
        //  specifically clear it, it will just continue moving from its current left position)
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        
        p.classList.add('particle');
        
        const anim = p.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 20}px, ${dy * 20}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });
        
        gameWorld.appendChild(p);
        anim.onfinish = () => p.remove();
    }
}

init();
