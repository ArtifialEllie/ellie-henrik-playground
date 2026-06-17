const donuts = ['🍩', '🧁', '🍪', '🍰', '🥞'];
const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'];

let score = 0;
let timeLeft = 30;
let gameActive = false;
let spawnInterval;
let timerInterval;

const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

function createDonut() {
    if (!gameActive) return;

    const donut = document.createElement('div');
    const type = donuts[Math.floor(Math.random() * donuts.length)];
    
    donut.className = 'donut';
    donut.textContent = type;
    
    // Random position
    const x = Math.random() * (window.innerWidth - 60);
    const y = Math.random() * (window.innerHeight - 60);
    donut.style.left = `${x}px`;
    donut.style.top = `${y}px`;
    
    // Random size
    const size = 40 + Math.random() * 40;
    donut.style.fontSize = `${size}px`;
    
    // Random animation speed
    donut.style.animationDuration = (2 + Math.random() * 3) + 's';

    donut.onclick = (e) => {
        if (!gameActive) return;
        
        score++;
        scoreElement.textContent = score;
        
        createParticles(e.clientX, e.clientY);
        donut.remove();
    };

    gameArea.appendChild(donut);

    // Donut vanishes after a while
    setTimeout(() => {
        if (donut.parentNode) {
            donut.remove();
        }
    }, 2000 + Math.random() * 2000);
}

function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const dx = (Math.random() - 0.5) * 100;
        const dy = (Math.random() - 0.5) * 100;
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        gameArea.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    overlay.classList.add('hidden');
    gameArea.innerHTML = '';

    spawnInterval = setInterval(createDonut, 700);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    finalScoreElement.textContent = score;
    overlay.classList.remove('hidden');
}

restartBtn.onclick = startGame;

// Start the game for the first time
startGame();
