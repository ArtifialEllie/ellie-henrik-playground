const POTIONS = {
    'pink': {
        name: 'Cherry Blossom Bliss',
        desc: 'Makes you feel like a spring breeze! 🌸',
        recipe: ['pink']
    },
    'blue': {
        name: 'Azure Serenity',
        desc: 'Calms the mind and makes you float slightly. 💎',
        recipe: ['blue']
    },
    'yellow': {
        name: 'Sunbeam Sparkle',
        desc: 'Gives you a burst of energy and a glowing aura! ⭐',
        recipe: ['yellow']
    },
    'green': {
        name: 'Minty Magic',
        desc: 'Tastes like fresh mint and makes you super fast! 🌿',
        recipe: ['green']
    },
    'purple': {
        name: 'Void Velvet',
        desc: 'Allows you to see hidden secrets in the shadows. 🔮',
        recipe: ['purple']
    },
    'orange': {
        name: 'Sunset Sorbet',
        desc: 'A warm, cozy potion that smells like oranges. 🍊',
        recipe: ['pink', 'yellow']
    },
    'cyan': {
        name: 'Oceanic Orbit',
        desc: 'Lets you breathe underwater and talk to fish! 🐟',
        recipe: ['blue', 'green']
    },
    'lime': {
        name: 'Spring Sprout',
        desc: 'Makes everything around you grow instantly! 🌱',
        recipe: ['yellow', 'green']
    },
    'magenta': {
        name: 'Cosmic Candy',
        desc: 'Tastes like a thousand strawberries! 🍓',
        recipe: ['pink', 'purple']
    },
    'indigo': {
        name: 'Midnight Mystique',
        desc: 'A deep, mysterious potion of absolute focus. 🌌',
        recipe: ['blue', 'purple']
    },
    'white': {
        name: 'Pure Light',
        desc: 'The ultimate potion! Everything becomes magical! ✨',
        recipe: ['pink', 'blue', 'yellow', 'green', 'purple']
    }
};

const COLOR_MAP = {
    'pink': '#ffcce0',
    'blue': '#cce0ff',
    'yellow': '#ffffcc',
    'green': '#ccffcc',
    'purple': '#e0ccff',
    'orange': '#ffe0b3',
    'cyan': '#ccffff',
    'lime': '#e0ffb3',
    'magenta': '#ffccff',
    'indigo': '#ccccff',
    'white': '#ffffff'
};

let currentIngredients = [];
let unlockedPotions = new Set();

const cauldron = document.getElementById('cauldron');
const liquid = document.getElementById('potion-liquid');
const bubblesContainer = document.getElementById('bubbles');
const messageOverlay = document.getElementById('message-overlay');
const potionNameDisplay = document.getElementById('potion-name');
const potionDescDisplay = document.getElementById('potion-desc');
const recipeList = document.getElementById('recipe-list');
const clearBtn = document.getElementById('clear-btn');

function init() {
    setupDragAndDrop();
    setupRecipes();
    
    clearBtn.addEventListener('click', () => {
        emptyCauldron();
    });

    document.getElementById('close-msg').addEventListener('click', () => {
        messageOverlay.classList.add('hidden');
    });
}

function setupDragAndDrop() {
    const ingredients = document.querySelectorAll('.ingredient');
    
    ingredients.forEach(ing => {
        ing.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('color', ing.dataset.color);
            ing.classList.add('dragging');
        });
        
        ing.addEventListener('dragend', () => {
            ing.classList.remove('dragging');
        });
    });

    cauldron.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    cauldron.addEventListener('drop', (e) => {
        e.preventDefault();
        const color = e.dataTransfer.getData('color');
        addIngredient(color);
    });
}

function addIngredient(color) {
    currentIngredients.push(color);
    
    // Update liquid height
    const height = Math.min(currentIngredients.length * 20, 100);
    liquid.style.height = height + '%';
    
    // Update liquid color
    const mixedColor = mixColors(currentIngredients);
    liquid.style.backgroundColor = mixedColor;
    
    // Add a bubble effect
    createBubble();
    
    // Check for potion match
    if (currentIngredients.length >= 1) {
        checkPotion();
    }
}

function mixColors(ingredients) {
    if (ingredients.length === 0) return '#fff';
    
    // Simple average of colors
    const colors = ingredients.map(c => COLOR_MAP[c]);
    
    // Since we are using simple hex colors, we'll just use the last one
    // or a simple blend for a few. For a "magical" feel, 
    // we'll use the most recent color as base and blend slightly.
    return ingredients[ingredients.length - 1] === 'white' ? '#fff' : COLOR_MAP[ingredients[ingredients.length - 1]];
}

function checkPotion() {
    // Sort ingredients to make recipe matching order-independent
    const sorted = [...currentIngredients].sort();
    
    for (const [id, potion] of Object.entries(POTIONS)) {
        if (potion.recipe.length === currentIngredients.length) {
            if (potion.recipe.every((val, index) => {
                const sortedRecipe = [...potion.recipe].sort();
                return sortedRecipe[index] === sorted[index];
            })) {
                unlockPotion(id, potion);
                return;
            }
        }
    }
}

function unlockPotion(id, potion) {
    unlockedPotions.add(id);
    
    // Update recipe book
    const recipeEl = document.getElementById(`recipe-${id}`) || createRecipeElement(id);
    if (recipeEl) {
        recipeEl.classList.add('unlocked');
        recipeEl.innerHTML = `<strong>${potion.name}</strong>: ${potion.recipe.join(' + ')}`;
    }

    // Show success message
    potionNameDisplay.innerText = potion.name;
    potionDescDisplay.innerText = potion.desc;
    messageOverlay.classList.remove('hidden');
    
    // Empty cauldron automatically after a bit? 
    // No, let the user decide or clear it manually.
}

function createRecipeElement(id) {
    const el = document.getElementById(`recipe-${id}`);
    if (!el) {
        const li = document.createElement('li');
        li.id = `recipe-${id}`;
        li.className = 'recipe';
        li.innerHTML = `Recipe: ? ? ?`;
        recipeList.appendChild(li);
        return li;
    }
    return el;
}

function emptyCauldron() {
    currentIngredients = [];
    liquid.style.height = '0%';
    liquid.style.backgroundColor = '#fff';
    
    // Clear bubbles
    bubblesContainer.innerHTML = '';
}

function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 20 + 10;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    
    // Vary bubble speed
    const duration = Math.random() * 2 + 1;
    bubble.style.animationDuration = duration + 's';
    
    bubblesContainer.appendChild(bubble);
    
    // Remove bubble after animation
    setTimeout(() => {
        bubble.remove();
    }, duration * 1000);
}

init();
