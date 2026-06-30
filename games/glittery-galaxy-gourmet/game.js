const ingredientsList = [
    { emoji: '🍓', name: 'Star Berry' },
    { emoji: '🌙', name: 'Moon Mallow' },
    { emoji: '✨', name: 'Glitter Grain' },
    { emoji: '🍭', name: 'Cosmic Candy' },
    { emoji: '🍍', name: 'Nebula Nectarine' },
    { emoji: '🥑', name: 'Asteroid Avocado' },
    { emoji: '🍄', name: 'Void Veggie' },
    { emoji: '🧁', name: 'Galaxy Ganache' }
];

const recipes = [
    { name: 'Cosmic Cake', requirements: ['🍓', '🌙', '✨'] },
    { name: 'Nebula Noodles', requirements: ['🍭', '🍍', '🍄'] },
    { name: 'Starry Soup', requirements: ['🍓', '✨', '🥑'] },
    { name: 'Galaxy Glaze', requirements: ['🌙', '🍭', '🧁'] },
    { name: 'Void Vanilla', requirements: ['🍄', '🥑', '✨'] },
    { name: 'Prism Pastry', requirements: ['🍓', '🍍', '🧁'] }
];

let score = 0;
let currentRecipeIndex = 0;
let collectedIngredients = [];
let gameActive = true;

const scoreEl = document.getElementById('score');
const recipeEl = document.getElementById('current-recipe');
const plateEl = document.getElementById('chef-plate');
const overlayEl = document.getElementById('message-overlay');
const messageTitleEl = document.getElementById('message-title');
const messageTextEl = document.getElementById('message-text');
const nextBtn = document.getElementById('next-level-btn');

function init() {
    updateRecipe();
    createStars();
    spawnIngredient();
    setInterval(spawnIngredient, 1500);
    
    plateEl.addEventListener('click', mixIngredients);
    nextBtn.addEventListener('click', nextRecipe);
}

function createStars() {
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.opacity = Math.random();
        document.body.appendChild(star);
    }
}

function updateRecipe() {
    const recipe = recipes[currentRecipeIndex];
    const recipeNames = recipe.requirements.map(req => {
        const ing = ingredientsList.find(i => i.emoji === req);
        return ing ? ing.name : req;
    }).join(', ');
    recipeEl.textContent = `${recipe.name}: ${recipeNames}`;
}

function spawnIngredient() {
    if (!gameActive) return;

    const ingData = ingredientsList[Math.floor(Math.random() * ingredientsList.length)];
    const ing = document.createElement('div');
    ing.className = 'ingredient';
    ing.textContent = ingData.emoji;
    
    const startX = Math.random() * (window.innerWidth - 50);
    const startY = -50;
    ing.style.left = `${startX}px`;
    ing.style.top = `${startY}px`;
    
    document.body.appendChild(ing);
    
    let currentY = startY;
    const fallSpeed = 2 + Math.random() * 3;
    
    const fallInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(fallInterval);
            ing.remove();
            return;
        }
        
        currentY += fallSpeed;
        ing.style.top = `${currentY}px`;
        
        if (currentY > window.innerHeight) {
            clearInterval(fallInterval);
            ing.remove();
        }
    }, 20);
    
    ing.addEventListener('mousedown', () => {
        collectedIngredients.push(ingData.emoji);
        ing.remove();
        clearInterval(fallInterval);
        
        // Simple juice effect
        const juice = document.createElement('div');
        juice.className = 'ingredient';
        juice.textContent = '✨';
        juice.style.left = ing.style.left;
        juice.style.top = ing.style.top;
        juice.style.position = 'absolute';
        document.body.appendChild(juice);
        setTimeout(() => juice.remove(), 500);
    });
}

function mixIngredients() {
    if (!gameActive) return;
    
    const recipe = recipes[currentRecipeIndex];
    const hasAll = recipe.requirements.every(req => collectedIngredients.includes(req));
    
    if (hasAll) {
        gameActive = false;
        score += 100;
        scoreEl.textContent = score;
        
        messageTitleEl.textContent = 'Yummy!';
        messageTextEl.textContent = `You made a ${recipe.name}! ✨`;
        overlayEl.classList.remove('hidden');
    } else {
        // Shake plate effect
        plateEl.style.transform = 'translateX(-50%) rotate(10deg)';
        setTimeout(() => plateEl.style.transform = 'translateX(-50%) rotate(-10deg)', 100);
        setTimeout(() => plateEl.style.transform = 'translateX(-50%) rotate(0deg)', 200);
        
        // Clear collected ingredients on fail
        collectedIngredients = [];
    }
}

function nextRecipe() {
    collectedIngredients = [];
    currentRecipeIndex = (currentRecipeIndex + 1) % recipes.length;
    updateRecipe();
    overlayEl.classList.add('hidden');
    gameActive = true;
}

init();
