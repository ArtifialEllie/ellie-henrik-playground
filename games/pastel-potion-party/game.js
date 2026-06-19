const COLORS = {
    red: { r: 255, g: 179, b: 186, name: 'Ruby Red' },
    blue: { r: 174, g: 225, b: 255, name: 'Sapphire Blue' },
    yellow: { r: 255, g: 255, b: 186, name: 'Sunshine Yellow' },
    green: { r: 186, g: 250, b: 201, name: 'Emerald Envy' },
    purple: { r: 225, g: 186, b: 255, name: 'Amethyst Aura' },
    orange: { r: 255, g: 200, b: 150, name: 'Apricot Glow' },
    pink: { r: 255, g: 180, b: 210, name: 'Bubblegum Blush' },
    cyan: { r: 180, g: 255, b: 255, name: 'Electric Ether' },
    void: { r: 50, g: 50, b: 80, name: 'Void Ink' },
    sun: { r: 255, g: 255, b: 255, name: 'Pure Sunbeam' },
    sparkle: { r: 255, g: 255, b: 255, name: '✨ Stardust' },
};

const CUSTOMERS = [
    { emoji: '🐰', name: 'Bunny' },
    { emoji: '🦊', name: 'Fox' },
    { emoji: '🐱', name: 'Cat' },
    { emoji: '🐻', name: 'Bear' },
    { emoji: '🐼', name: 'Panda' },
    { emoji: '🦄', name: 'Unicorn' },
    { emoji: '🐨', name: 'Koala' },
    { emoji: '🦁', name: 'Lion' },
];

let currentTarget = null;
let currentMix = { r: 255, g: 255, b: 255 };
let isSparkly = false;
let score = 0;

const scoreEl = document.getElementById('score');
const targetColorNameEl = document.getElementById('target-color-name');
const targetLiquidEl = document.getElementById('target-liquid');
const mainLiquidEl = document.getElementById('main-liquid');
const mixRgbEl = document.getElementById('mix-rgb');
const brewButton = document.getElementById('brew-button');
const resetButton = document.getElementById('reset-button');
const feedback = document.getElementById('feedback');
const feedbackText = document.getElementById('feedback-text');
const nextCustomerButton = document.getElementById('next-customer');
const customerEmojiEl = document.getElementById('customer');

function getRandomCustomer() {
    return CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
}

function getRandomColor() {
    // Generate a random target color by mixing the primary pastel colors
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // To keep it "pastel", we bias towards higher values
    const pastelR = Math.floor(127 + Math.random() * 129);
    const pastelG = Math.floor(127 + Math.random() * 129);
    const pastelB = Math.floor(127 + Math.random() * 129);
    
    return { r: pastelR, g: pastelG, b: pastelB };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function updateLiquidColors() {
    targetLiquidEl.style.backgroundColor = `rgb(${currentTarget.r}, ${currentTarget.g}, ${currentTarget.b})`;
    mainLiquidEl.style.backgroundColor = `rgb(${currentMix.r}, ${currentMix.g}, ${currentMix.b})`;
    if (isSparkly) {
        mainLiquidEl.classList.add('sparkle-liquid');
    } else {
        mainLiquidEl.classList.remove('sparkle-liquid');
    }
    mixRgbEl.textContent = `rgb(${currentMix.r}, ${currentMix.g}, ${currentMix.b})`;
}

function createBubbles() {
    const bubblesContainer = document.querySelector('.bubbles');
    bubblesContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.width = bubble.style.height = `${Math.random() * 10 + 5}px`;
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        bubble.style.animationDuration = `${1.5 + Math.random() * 1}s`;
        bubblesContainer.appendChild(bubble);
    }
}

function spawnNewCustomer() {
    const customer = getRandomCustomer();
    currentTarget = getRandomColor();
    
    customerEmojiEl.textContent = customer.emoji;
    
    // Try to find a color name that matches the target color closely
    const closestColor = Object.values(COLORS).reduce((prev, curr) => {
        return (Math.abs(curr.r - currentTarget.r) + Math.abs(curr.g - currentTarget.g) + Math.abs(curr.b - currentTarget.b)) < 
               (Math.abs(prev.r - currentTarget.r) + Math.abs(prev.g - currentTarget.g) + Math.abs(prev.b - currentTarget.b)) ? curr : prev;
    });
    targetColorNameEl.textContent = closestColor.name;
    
    updateLiquidColors();
}

function addIngredient(colorKey) {
    const color = COLORS[colorKey];
    
    // Simplified mixing logic: average of current and ingredient
    // In a real potion game, we'd maybe use additive blending
    const newR = Math.floor((currentMix.r + color.r) / 2);
    const newG = Math.floor((currentMix.g + color.g) / 2);
    const newB = Math.floor((currentMix.b + color.b) / 2);
    
    currentMix = { r: newR, g: newG, b: newB };
    
    if (colorKey === 'sparkle') {
        isSparkly = true;
    }

    updateLiquidColors();
    
    // Play a little bubble effect
    createBubbles();
}

function resetMix() {
    currentMix = { r: 255, g: 255, b: 255 };
    isSparkly = false;
    updateLiquidColors();
}

function brewPotion() {
    const distance = Math.sqrt(
        Math.pow(currentTarget.r - currentMix.r, 2) +
        Math.pow(currentTarget.g - currentMix.g, 2) +
        Math.pow(currentTarget.b - currentMix.b, 2)
    );
    
    const threshold = 40; // Allow some margin of error
    const perfectThreshold = 10;
    const goodThreshold = 25;
    
    let stars = '⭐';
    if (distance < perfectThreshold) stars = '⭐⭐⭐⭐⭐';
    else if (distance < goodThreshold) stars = '⭐⭐⭐⭐';
    else if (distance < threshold) stars = '⭐⭐⭐';
    else if (distance < threshold * 2) stars = '⭐⭐';
    else stars = '⭐';

    const ratingText = `Rating: ${stars}`;

    if (distance < threshold) {
        score++;
        scoreEl.textContent = score;
        feedbackText.textContent = `Yummy! ${ratingText} ✨🌟`;
        feedback.classList.remove('hidden');
    } else {
        feedbackText.textContent = `Hmm, not quite... ${ratingText} 🌸`;
        feedback.classList.remove('hidden');
    }
}

function startNextRound() {
    feedback.classList.add('hidden');
    resetMix();
    spawnNewCustomer();
}

// Event Listeners
document.querySelectorAll('.ingredient').forEach(item => {
    item.addEventListener('click', () => {
        addIngredient(item.getAttribute('data-color'));
    });
});

brewButton.addEventListener('click', brewPotion);
resetButton.addEventListener('click', resetMix);
nextCustomerButton.addEventListener('click', startNextRound);

// Init
spawnNewCustomer();
createBubbles();
updateLiquidColors();
