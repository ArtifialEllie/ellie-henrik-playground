const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

const lanes = document.querySelectorAll('.lane');
const keys = ['S', 'D', 'F', 'J', 'K', 'L'];
const laneMap = {};
keys.forEach((key, index) => {
    laneMap[key] = index;
});

let score = 0;
let combo = 0;
let gameActive = false;
let stars = [];
let spawnTimer = 0;
let spawnRate = 1500; // ms
let gameSpeed = 3; // px per frame
let gameTimer = 0;

function createStar() {
    const laneIndex = Math.floor(Math.random() * keys.length);
    const star = document.createElement('div');
    star.className = 'star';
    
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    star.style.backgroundColor = color;
    star.style.boxShadow = `0 0 20px ${color}`;
    star.style.filter = `drop-shadow(0 0 10px ${color})`;

    // Calculate center of lane
    const laneWidth = gameBoard.offsetWidth / keys.length;
    star.style.left = `${laneIndex * laneWidth + (laneWidth / 2) - 20}px`;
    star.style.top = '-50px';
    
    gameBoard.appendChild(star);
    
    return {
        element: star,
        lane: laneIndex,
        top: -50,
        hit: false
    };
}

function update() {
    if (!gameActive) return;

    spawnTimer += 16.67;
    if (spawnTimer >= spawnRate) {
        stars.push(createStar());
        spawnTimer = 0;
        spawnRate = Math.max(600, spawnRate * 0.995);
        gameSpeed = Math.min(8, gameSpeed + 0.001);
    }

    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.top += gameSpeed;
        star.element.style.top = star.top + 'px';

        if (star.top > window.innerHeight) {
            if (!star.hit) {
                combo = 0;
                comboElement.innerText = `Combo: ${combo}`;
            }
            if (star.element.parentNode) {
                gameBoard.removeChild(star.element);
            }
            stars.splice(i, 1);
        }
    }

    gameTimer += 16.67;
    if (gameTimer >= 60000) {
        endGame();
    }

    requestAnimationFrame(update);
}

function handleInput(e) {
    const key = e.key.toUpperCase();
    if (keys.includes(key)) {
        const laneIndex = laneMap[key];
        
        const lane = lanes[laneIndex];
        lane.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        setTimeout(() => {
            if (lane) lane.style.backgroundColor = 'transparent';
        }, 100);

        let hitSomething = false;
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (star.lane === laneIndex && !star.hit) {
                const targetY = window.innerHeight - 100;
                const distance = Math.abs(star.top - targetY);

                if (distance < 60) {
                    hitSomething = true;
                    star.hit = true;
                    star.element.classList.add('hit');
                    
                    if (distance < 20) {
                        score += 100;
                        combo += 1;
                        createHitEffect('Perfect! ✨');
                    } else if (distance < 40) {
                        score += 50;
                        combo += 1;
                        createHitEffect('Great! 🌟');
                    } else {
                        score += 20;
                        combo += 1;
                        createHitEffect('Good! 🌈');
                    }

                    scoreElement.innerText = `Score: ${score}`;
                    comboElement.innerText = `Combo: ${combo}`;
                    
                    setTimeout(() => {
                        if (star.element.parentNode) {
                            gameBoard.removeChild(star.element);
                        }
                        stars = stars.filter(s => s !== star);
                    }, 300);
                    break;
                }
            }
        }
    }
}

function createHitEffect(text) {
    const effect = document.createElement('div');
    effect.className = 'hit-flash';
    effect.style.position = 'absolute';
    effect.style.bottom = '100px';
    effect.style.left = '0';
    effect.style.width = '100%';
    effect.style.textAlign = 'center';
    effect.style.color = 'white';
    effect.style.fontSize = '24px';
    effect.style.fontWeight = 'bold';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '10';
    effect.innerText = text;
    
    gameBoard.appendChild(effect);
    
    effect.style.transition = 'all 0.5s ease-out';
    setTimeout(() => {
        effect.style.top = '-50px';
        effect.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
        if (effect.parentNode) {
            gameBoard.removeChild(effect);
        }
    }, 500);
}

function startGame() {
    score = 0;
    combo = 0;
    spawnRate = 1500;
    gameSpeed = 3;
    stars = [];
    gameTimer = 0;
    
    scoreElement.innerText = `Score: 0`;
    comboElement.innerText = `Combo: 0`;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameActive = true;
    
    window.addEventListener('keydown', handleInput);
    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = `Your score: ${score}`;
    window.removeEventListener('keydown', handleInput);
}

startButton.onclick = startGame;
restartButton.onclick = startGame;
