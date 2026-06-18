const donuts = ['🍩', '🧁', '🍪', '🍰', '🥞'];
const specials = {
    golden: { emoji: '🌟🍩', points: 5, chance: 0.1 },
    bad: { emoji: '🍋', points: -3, chance: 0.15 },
    rainbow: { emoji: '🌈🍩', points: 2, chance: 0.05 }
};
const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'];

let score = 0;
let combo = 0;
let timeLeft = 30;
let gameActive = false;
let sugarRushActive = false;
let spawnInterval;
let timerInterval;

const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
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
    } else if (rand < specials.golden.chance + specials.bad.chance + specials.rainbow.chance) {
        type = specials.rainbow.emoji;
        pointsValue = specials.rainbow.points;
        specialClass = 'rainbow-donut';
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
        
        // Combo logic
        combo++;
        const comboMultiplier = 1 + Math.floor(combo / 5) * 0.5;
        const finalPoints = Math.ceil(pointsValue * comboMultiplier);
        
        score += finalPoints;
        if (score < 0) score = 0;
        scoreElement.textContent = score;
        comboElement.textContent = combo;
        
        showFloatingText(e.clientX, e.clientY, finalPoints, combo >= 5 ? `Combo x${comboMultiplier}!` : null);
        createParticles(e.clientX, e.clientY, finalPoints > 0 ? 'pink' : 'yellow');
        
        if (specialClass === 'rainbow-donut') {
            activateSugarRush();
        }
        
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

function activateSugarRush() {
    if (sugarRushActive) return;
    sugarRushActive = true;
    
    document.body.style.animationDuration = '2s';
    
    const originalIntervalRate = 700;
    clearInterval(spawnInterval);
    spawnInterval = setInterval(createDonut, 300);
    
    setTimeout(() => {
        sugarRushActive = false;
        document.body.style.animationDuration = '15s';
        clearInterval(spawnInterval);
        spawnInterval = setInterval(createDonut, originalIntervalRate);
    }, 5000);
}

function showFloatingText(x, y, points, extraText = null) {
    const text = document.createElement('div');
    text.className = 'floating-text';
    text.textContent = points > 0 ? `+${points}` : points;
    text.style.left = `${x}px`;
    text.style.top = `${y}px`;
    text.style.color = points > 0 ? '#ff1493' : '#ff0000';
    
    if (extraText) {
        const extra = document.createElement('div');
        extra.textContent = extraText;
        extra.style.fontSize = '14px';
        extra.style.color = 'gold';
        text.appendChild(extra);
    }
    
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
    combo = 0;
    timeLeft = 30;
    gameActive = true;
    scoreElement.textContent = score;
    comboElement.textContent = combo;
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
