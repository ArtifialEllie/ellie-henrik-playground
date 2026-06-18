const donuts = ['🍩', '🧁', '🍪', '🍰', '🥞'];
const specials = {
    golden: { emoji: '🌟🍩', points: 5, chance: 0.1 },
    bad: { emoji: '🍋', points: -3, chance: 0.15 }
};
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
    let type = '';
    let pointsValue = 1;
    let specialClass = '';

    const rand = Math.random();
    if (rand < specials.golden.chance) {
        type = specials.golden.emoji;
        pointsValue = specials.golden.points;
        specialClass = 'golden-donut';
    } else if (rand < specials.golden.chance + specials.bad.chance) {
        type = specials.bad.emoji;
        pointsValue = specials.bad.points;
        specialClass = 'bad-donut';
    } else {
        type = donuts[Math.floor(Math.random() * donuts.length)];
        pointsValue = 1;
    }
    
    donut.className = `donut ${specialClass}`;
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
        
        score += pointsValue;
        if (score < 0) score = 0; // Don't go below 0
        scoreElement.textContent = score;
        
        showFloatingText(e.clientX, e.clientY, pointsValue);
        createParticles(e.clientX, e.clientY, pointsValue > 0 ? 'pink' : 'yellow');
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

function showFloatingText(x, y, points) {
    const text = document.createElement('div');
    text.className = 'floating-text';
    text.textContent = points > 0 ? `+${points}` : points;
    text.style.left = `${x}px`;
    text.style.top = `${y}px`;
    text.style.color = points > 0 ? '#ff1493' : '#ff0000';
    
    gameArea.appendChild(text);
    setTimeout(() => text.remove(), 800);
}

function createParticles(x, y, colorType) {
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
        p.style.background = colorType === 'pink' ? colors[Math.floor(Math.random() * colors.length)] : '#ffff00';
        
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
