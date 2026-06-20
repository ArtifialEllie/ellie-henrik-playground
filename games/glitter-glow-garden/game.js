const gardenArea = document.getElementById('garden-area');
const glitterCountEl = document.getElementById('glitter-count');
const flowerCountEl = document.getElementById('flower-count');
const levelCountEl = document.getElementById('level-count');
const plantBtn = document.getElementById('plant-btn');
const collectBtn = document.getElementById('collect-btn');
const messageEl = document.getElementById('message');

let glitter = 20; // Start with some glitter!
let flowers = 0;
let level = 1;
let glitterPerClick = 1;

const flowerEmojis = ['🌸', '🌼', '🌻', '🌹', '🌷', '🌺', '🍀', '🍄'];

function updateUI() {
    glitterCountEl.textContent = glitter;
    flowerCountEl.textContent = flowers;
    levelCountEl.textContent = level;
}

function createGlitterParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'glitter-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    const tx = (Math.random() - 0.5) * 100;
    const ty = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
}

function plantFlower() {
    if (glitter < 10) {
        messageEl.textContent = "Du trenger mer glitter-støv for å plante! ✨";
        return;
    }
    
    glitter -= 10;
    flowers++;
    
    const flower = document.createElement('div');
    flower.className = 'flower';
    flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    
    const x = Math.random() * (gardenArea.clientWidth - 50);
    const y = Math.random() * (gardenArea.clientHeight - 50);
    
    flower.style.left = x + 'px';
    flower.style.top = y + 'px';
    
    flower.onclick = (e) => {
        createGlitterParticle(e.clientX, e.clientY);
        glitter += glitterPerClick;
        updateUI();
        messageEl.textContent = "En blomst ga deg litt glitter! ✨";
        
        // Check for level up!
        if (flowers >= level * 5) {
            levelUp();
        }
    };
    
    gardenArea.appendChild(flower);
    updateUI();
    messageEl.textContent = "Du plantet en magisk blomst! 🌸";
}

function collectGlitter() {
    const amount = Math.floor(Math.random() * 5) + 1;
    glitter += amount;
    
    // Visual effect when collecting
    const rect = collectBtn.getBoundingClientRect();
    for(let i=0; i<5; i++) {
        createGlitterParticle(rect.left + rect.width/2, rect.top + rect.height/2);
    }
    
    updateUI();
    messageEl.textContent = `Du fant ${amount} glitter-støv i luften! ✨`;
}

function levelUp() {
    level++;
    glitterPerClick++;
    messageEl.textContent = `🌟 NIVÅ OPP! Du er nå nivå ${level}! Blomstene dine er mer magiske! ✨`;
    
    // Big celebration!
    const rect = gardenArea.getBoundingClientRect();
    for(let i=0; i<30; i++) {
        createGlitterParticle(
            rect.left + Math.random() * rect.width, 
            rect.top + Math.random() * rect.height
        );
    }
    updateUI();
}

plantBtn.addEventListener('click', plantFlower);
collectBtn.addEventListener('click', collectGlitter);

// Initialize
updateUI();
