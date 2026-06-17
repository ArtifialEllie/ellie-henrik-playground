const COLORS = {
    red: { r: 255, g: 179, b: 186, name: 'Ruby Red' },
    blue: { r: 174, g: 225, b: 255, name: 'Sapphire Blue' },
    yellow: { r: 255, g: 255, b: 186, name: 'Sunshine Yellow' },
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
    targetColorNameEl.textContent = "a magical pastel color";
    
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
    updateLiquidColors();
    
    // Play a little bubble effect
    createBubbles();
}

function resetMix() {
    currentMix = { r: 255, g: 255, b: 255 };
    updateLiquidColors();
}

function brewPotion() {
    const distance = Math.sqrt(
        Math.pow(currentTarget.r - currentMix.r, 2) +
        Math.pow(currentTarget.g - currentMix.g, 2) +
        Math.pow(currentTarget.b - currentMix.b, 2)
    );
    
    const threshold = 40; // Allow some margin of error
    
    if (distance < threshold) {
        score++;
        scoreEl.textContent = score;
        feedbackText.textContent = "Yummy! That's perfect! ✨🌟";
        feedback.classList.remove('hidden');
    } else {
        feedbackText.textContent = "Hmm, not quite the color I wanted... 🌸";
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
