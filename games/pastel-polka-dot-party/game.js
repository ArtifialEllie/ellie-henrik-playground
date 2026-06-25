const CONFIG = {
    gameDuration: 30,
    spawnRate: 800,
    colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FF9AA2', '#FAD0C4', '#FEE1C7'],
    dotSizes: [40, 60, 80],
};

let score = 0;
let timeLeft = CONFIG.gameDuration;
let gameActive = false;
let spawnInterval = null;
let timerInterval = null;

const gameCanvas = document.getElementById('game-canvas');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const overlay = document.getElementById('overlay');
const finalScoreDisplay = document.getElementById('final-score');

function init() {
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
}

function startGame() {
    score = 0;
    timeLeft = CONFIG.gameDuration;
    gameActive = true;
    
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    overlay.classList.add('hidden');
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    
    gameCanvas.innerHTML = '';
    
    spawnInterval = setInterval(spawnDot, CONFIG.spawnRate);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        endGame();
    }
}

function spawnDot() {
    if (!gameActive) return;
    
    const dot = document.createElement('div');
    dot.className = 'dot';
    
    const size = CONFIG.dotSizes[Math.floor(Math.random() * CONFIG.dotSizes.length)];
    const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    
    const x = Math.random() * (gameCanvas.clientWidth - size);
    const y = Math.random() * (gameCanvas.clientHeight - size);
    
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.backgroundColor = color;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    
    dot.addEventListener('mousedown', (e) => {
        popDot(dot, e);
    });
    
    gameCanvas.appendChild(dot);
    
    // Dots disappear after a while if not popped
    setTimeout(() => {
        if (dot.parentNode) {
            createPopEffect(dot.offsetLeft, dot.offsetTop, size, color, false);
            dot.remove();
        }
    }, 2000 + Math.random() * 2000);
}

function popDot(dot, event) {
    if (!gameActive) return;
    
    score++;
    scoreDisplay.textContent = score;
    
    const size = parseInt(dot.style.width);
    const color = dot.style.backgroundColor;
    const x = dot.offsetLeft;
    const y = dot.offsetTop;
    
    createPopEffect(x, y, size, color, true);
    dot.remove();
}

function createPopEffect(x, y, size, color, isPopped) {
    const effect = document.createElement('div');
    effect.className = 'pop-effect';
    effect.style.width = `${size}px`;
    effect.style.height = `${size}px`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.backgroundColor = color;
    effect.style.border = `4px solid white`;
    
    if (isPopped) {
        effect.style.animationDuration = '0.3s';
    } else {
        effect.style.animationDuration = '0.8s';
        effect.style.opacity = '0.5';
    }
    
    gameCanvas.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 800);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    
    finalScoreDisplay.textContent = score;
    overlay.classList.remove('hidden');
    endScreen.classList.remove('hidden');
}

init();
