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
const rareTreats = ['🌟', '👑', '💎'];
const bombTreats = ['💣', '💥', '🔥'];
let slowMoActive = false;

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

    // Randomly choose between common and rare treats
    const isRare = Math.random() < 0.1;
    const isBomb = Math.random() < 0.05;
    const treatType = isBomb
        ? bombTreats[Math.floor(Math.random() * bombTreats.length)]
        : isRare 
            ? rareTreats[Math.floor(Math.random() * rareTreats.length)]
            : treats[Math.floor(Math.random() * treats.length)];
    
    const treat = document.createElement('div');
    treat.className = isBomb ? 'cupcake bomb' : (isRare ? 'cupcake rare' : 'cupcake');
    treat.textContent = treatType;
    
    const rect = gameCanvas.getBoundingClientRect();
    treat.style.left = Math.random() * (rect.width - 40) + 'px';
    
    // Rare treats fall slower and are worth more
    const duration = isRare ? 5 + Math.random() * 2 : 2 + Math.random() * 2;
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
            if (isBomb) {
                score = Math.max(0, score - 10);
                lives--;
                updateUI();
                createSparkles(tRect.left, tRect.top, '#ff4500');
                treat.remove();
                clearInterval(checkCollision);
                if (lives <= 0) endGame();
                return;
            }
            const points = isRare ? 5 : 1;
            score += points;
            updateUI();
            createSparkles(tRect.left, tRect.top, isRare ? '#ffd700' : '#ffffff');
            treat.remove();
            clearInterval(checkCollision);

            // Rare treat bonus: Slow motion!
            if (isRare) {
                activateSlowMo();
            }
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

function createSparkles(x, y, color = '#ffffff') {
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = '✨';
        sparkle.style.position = 'absolute';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.color = color;
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

function activateSlowMo() {
    slowMoActive = true;
    gameCanvas.style.filter = 'hue-rotate(45deg) saturate(1.5)';
    gameCanvas.style.transition = 'filter 0.5s ease';
    
    const treats = document.querySelectorAll('.cupcake');
    treats.forEach(t => {
        t.style.animationPlayState = 'paused';
    });

    setTimeout(() => {
        slowMoActive = false;
        gameCanvas.style.filter = 'none';
        document.querySelectorAll('.cupcake').forEach(t => {
            t.style.animationPlayState = 'running';
        });
    }, 3000);
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
