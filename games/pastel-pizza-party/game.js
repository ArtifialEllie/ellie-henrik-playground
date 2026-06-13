const ingredients = [
    { emoji: '🌸', name: 'Pink Pepperoni' },
    { emoji: '🍄', name: 'Blue Mushroom' },
    { emoji: '🍍', name: 'Yellow Pineapple' },
    { emoji: '🌿', name: 'Minty Basil' },
    { emoji: '🍅', name: 'Ruby Tomato' },
    { emoji: '🧀', name: 'Golden Cheese' },
    { emoji: '🍬', name: 'Candy Cane' },
    { emoji: '🌈', name: 'Rainbow Sprinkle' },
    { emoji: '🧁', name: 'Cupcake Crumbs' },
    { emoji: '🍓', name: 'Strawberry Slice' },
    { emoji: '✨', name: 'Magic Sparkle', bonus: true },
    { emoji: '❄️', name: 'Frosty Pepperoni', powerup: 'slow' },
    { emoji: '🔥', name: 'Spicy Chili', powerup: 'double' },
    { emoji: '🍭', name: 'Lolly Pop', powerup: 'clear' }
];

let score = 0;
let timeLeft = 60;
let currentRequest = null;
let requestQuantity = 1;
let gameActive = false;
let spawnTimer = null;
let countdownTimer = null;
let combo = 0;
let toppingsCount = 0;
const TOPPINGS_PER_PIZZA = 6;
let isRainbowMode = false;
let activePowerups = { slow: 0, double: 0 };

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const requestEl = document.getElementById('request-box');
const gameContainer = document.getElementById('game-container');
const pizzaArea = document.getElementById('pizza-area');
const toppingsLayer = document.getElementById('toppings-layer');
const comboEl = document.getElementById('combo-counter');

// Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playCorrectSound() { playSound(500 + Math.random() * 200, 'sine', 0.2); }
function playWrongSound() { playSound(150, 'sawtooth', 0.3); }
function playPizzaCompleteSound() {
    playSound(600, 'sine', 0.1);
    setTimeout(() => playSound(800, 'sine', 0.1), 100);
    setTimeout(() => playSound(1000, 'sine', 0.3), 200);
}

function getRandomIngredient() {
    return ingredients[Math.floor(Math.random() * ingredients.length)];
}

function setRequest() {
    let filtered = ingredients.filter(i => !i.bonus && !i.powerup);
    currentRequest = filtered[Math.floor(Math.random() * filtered.length)];
    requestQuantity = Math.floor(Math.random() * 3) + 1;
    requestEl.innerText = `Need: ${requestQuantity}x ${currentRequest.emoji} ${currentRequest.name}!`;
    requestEl.style.borderColor = 'var(--primary)';
}

function createIngredient() {
    if (!gameActive) return;

    const ing = getRandomIngredient();
    const el = document.createElement('div');
    el.className = 'ingredient';
    el.innerText = ing.emoji;
    
    const startX = Math.random() * (window.innerWidth - 100);
    const startY = window.innerHeight + 100;
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';

    let duration = 3000 + Math.random() * 3000 - (score / 10);
    if (activePowerups.slow > Date.now()) duration *= 2;
    const drift = (Math.random() - 0.5) * 200;

    gameContainer.appendChild(el);

    const animation = el.animate([
        { top: startY + 'px', left: startX + 'px' },
        { top: '-100px', left: (startX + drift) + 'px' }
    ], {
        duration: Math.max(1500, duration),
        easing: 'linear'
    });

    animation.onfinish = () => el.remove();

    el.onclick = () => {
        if (!gameActive) return;
        
        if (isRainbowMode || ing.emoji === currentRequest.emoji || ing.bonus || ing.powerup) {
            handleCorrect(ing, el);
        } else {
            handleWrong(el);
        }
    };
}

function handleCorrect(ing, el) {
    playCorrectSound();
    
    if (ing.powerup) {
        handlePowerup(ing, el);
    } else if (ing.bonus) {
        showPop('MAGIC! 🌟', el.offsetLeft, el.offsetTop, 'gold');
        completePizza();
    } else {
        if (!isRainbowMode) {
            requestQuantity--;
            if (requestQuantity <= 0) {
                setRequest();
            }
        }
        combo++;
        let points = 10 + (combo * 2);
        if (activePowerups.double > Date.now()) points *= 2;
        score += points;
        showPop(`+${points}! ✨`, el.offsetLeft, el.offsetTop, 'var(--primary)');
        addToPizza(ing.emoji);
        updateComboUI();
    }
    
    scoreEl.innerText = score;
    el.remove();
}

function handlePowerup(ing, el) {
    const type = ing.powerup;
    showPop(`POWERUP: ${ing.name}! 🌟`, el.offsetLeft, el.offsetTop, 'gold');
    
    if (type === 'slow') {
        activePowerups.slow = Date.now() + 5000;
        showPop('TIME SLOWED! ❄️', window.innerWidth/2 - 50, 100, 'var(--secondary)');
    } else if (type === 'double') {
        activePowerups.double = Date.now() + 5000;
        showPop('DOUBLE POINTS! 🔥', window.innerWidth/2 - 50, 100, 'red');
    } else if (type === 'clear') {
        const allIngs = document.querySelectorAll('.ingredient');
        allIngs.forEach(i => {
            if (i !== el) {
                createSparkleEffect(i.offsetLeft, i.offsetTop);
                i.remove();
            }
        });
        showPop('SCREEN CLEARED! 🍭', window.innerWidth/2 - 50, 100, 'var(--primary)');
    }
    el.remove();
}

function createSparkleEffect(x, y) {
    for(let i=0; i<5; i++) {
        showPop('✨', x + (Math.random()-0.5)*40, y + (Math.random()-0.5)*40, 'white');
    }
}

function handleWrong(el) {
    playWrongSound();
    combo = 0;
    updateComboUI();
    score = Math.max(0, score - 5);
    scoreEl.innerText = score;
    showPop('Oops! ☁️', el.offsetLeft, el.offsetTop, 'var(--text)');
    
    gameContainer.classList.add('shake');
    setTimeout(() => gameContainer.classList.remove('shake'), 400);
    
    el.remove();
}

function addToPizza(emoji) {
    toppingsCount++;
    const topping = document.createElement('div');
    topping.className = 'pizza-topping';
    topping.innerText = emoji;
    
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 110;
    const x = 150 + Math.cos(angle) * dist - 20;
    const y = 150 + Math.sin(angle) * dist - 20;
    
    topping.style.left = x + 'px';
    topping.style.top = y + 'px';
    
    toppingsLayer.appendChild(topping);
    
    for(let i=0; i<3; i++) {
        showPop('✨', x + (Math.random()-0.5)*40, y + (Math.random()-0.5)*40, 'white');
    }
    
    pizzaArea.style.transform = 'translate(-50%, -50%) scale(1)';
    setTimeout(() => pizzaArea.style.transform = 'translate(-50%, -50%) scale(1)', 100);
    if (toppingsCount >= TOPPINGS_PER_PIZZA) {
        completePizza();
    }
}

function completePizza() {
    playPizzaCompleteSound();
    score += 100;
    scoreEl.innerText = score;
    showPop('PIZZA SERVED! 🍕🎉', window.innerWidth/2 - 100, window.innerHeight/2 - 100, 'var(--primary)');
    
    pizzaArea.style.transition = 'all 0.5s ease-in';
    pizzaArea.style.transform = 'translate(-50%, -200%) scale(0) rotate(360deg)';
    
    if (Math.random() < 0.2) {
        triggerRainbowMode();
    }
    
    setTimeout(() => {
        toppingsLayer.innerHTML = '';
        toppingsCount = 0;
        pizzaArea.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        pizzaArea.style.transform = 'translate(-50%, -50%) scale(0)';
        setTimeout(() => {
            pizzaArea.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    }, 500);
}

function triggerRainbowMode() {
    isRainbowMode = true;
    requestEl.innerText = "🌈 RAINBOW FRENZY! 🌈";
    requestEl.style.borderColor = 'var(--accent)';
    requestEl.style.backgroundColor = 'var(--accent)';
    
    setTimeout(() => {
        isRainbowMode = false;
        setRequest();
    }, 5000);
}

function updateComboUI() {
    if (combo > 1) {
        comboEl.innerText = `Combo x${combo}!`;
        comboEl.style.opacity = '1';
        comboEl.classList.remove('combo-pop');
        void comboEl.offsetWidth;
        comboEl.classList.add('combo-pop');
    } else {
        comboEl.style.opacity = '0';
    }
}

function showPop(text, x, y, color) {
    const pop = document.createElement('div');
    pop.className = 'pop-text';
    pop.innerText = text;
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
    pop.style.color = color;
    gameContainer.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    document.getElementById('start-screen').classList.add('hidden');
    gameActive = true;
    score = 0;
    timeLeft = 60;
    combo = 0;
    toppingsCount = 0;
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    
    setRequest();
    
    spawnTimer = setInterval(createIngredient, 800);
    countdownTimer = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnTimer);
    clearInterval(countdownTimer);
    document.getElementById('end-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}
