const player = document.getElementById('player');
const gameCanvas = document.getElementById('game-canvas');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let lives = 3;
let gameActive = false;
let spawnInterval;

const treats = ['🧁', '🍰', '🍩', '🍪', '🍬', '🍭'];

function init() {
    score = 0;
    lives = 3;
    gameActive = true;
    updateUI();
    overlay.classList.add('hidden');
    
    // Player movement
    window.addEventListener('mousemove', (e) => {
        if (!gameActive) return;
        const rect = gameCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Keep player in bounds
        x = Math.max(0, Math.min(x, rect.width - 50));
        y = Math.max(0, Math.min(y, rect.height - 50));
        
        player.style.left = x + 'px';
        player.style.top = y + 'px';
    });

    spawnTreats();
}

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${'❤️'.repeat(lives)}`;
}

function spawnTreats() {
    if (!gameActive) return;

    const treatType = treats[Math.floor(Math.random() * treats.length)];
    const treat = document.createElement('div');
    treat.className = 'cupcake';
    treat.textContent = treatType;
    
    const rect = gameCanvas.getBoundingClientRect();
    treat.style.left = Math.random() * (rect.width - 40) + 'px';
    
    // Random fall duration between 2 and 4 seconds
    const duration = 2 + Math.random() * 2;
    treat.style.animationDuration = duration + 's';
    
    gameCanvas.appendChild(treat);

    // Check for collision
    const checkCollision = setInterval(() => {
        if (!gameActive) {
            clearInterval(checkCollision);
            treat.remove();
            return;
        }

        const pRect = player.getBoundingClientRect();
        const tRect = treat.getBoundingClientRect();

        if (
            pRect.left < tRect.right &&
            pRect.right > tRect.left &&
            pRect.top < tRect.bottom &&
            pRect.bottom > tRect.top
        ) {
            score++;
            updateUI();
            createSparkles(tRect.left, tRect.top);
            treat.remove();
            clearInterval(checkCollision);
        }
    }, 50);

    // Remove treat when animation ends
    treat.addEventListener('animationend', () => {
        if (treat.parentElement) {
            lives--;
            updateUI();
            if (lives <= 0) {
                endGame();
            }
            treat.remove();
        }
    });

    // Adjust spawning speed over time
    const nextSpawn = Math.max(500, 1500 - (score * 10));
    setTimeout(spawnTreats, nextSpawn);
}

function createSparkles(x, y) {
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = '✨';
        sparkle.style.position = 'absolute';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.fontSize = '20px';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '1000';
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        
        sparkle.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        });
        
        gameCanvas.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 600);
    }
}

function endGame() {
    gameActive = false;
    finalScoreElement.textContent = score;
    overlay.classList.remove('hidden');
}

restartBtn.addEventListener('click', () => {
    // Clean up any existing treats
    document.querySelectorAll('.cupcake').forEach(el => el.remove());
    init();
});

// Start the game
init();
