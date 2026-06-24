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
let gps = 0; // Glitter per second (passive income)

const flowerEmojis = ['🌸', '🌼', '🌻', '🌹', '🌷', '🌺', '🍀', '🍄'];

const upgrades = {
    butterfly: { cost: 50, power: 1, elementId: 'upgrade-butterfly', label: '🦋 Glitter-sommerfugl' },
    can: { cost: 200, power: 5, elementId: 'upgrade-can', label: '🚿 Magisk Vannkanne' },
    soil: { cost: 1000, power: 25, elementId: 'upgrade-soil', label: '🌈 Regnbue-jord' }
};

function updateUI() {
    glitterCountEl.textContent = glitter;
    flowerCountEl.textContent = flowers;
    levelCountEl.textContent = level;
    document.getElementById('gps').textContent = gps;
    
    // Update upgrade buttons availability
    for (const key in upgrades) {
        const up = upgrades[key];
        const btn = document.getElementById(up.elementId);
        if (btn) {
            btn.disabled = glitter < up.cost;
        }
    }
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

function spawnGoldenBee() {
    const bee = document.createElement('div');
    bee.className = 'golden-bee';
    bee.textContent = '🐝';
    gardenArea.appendChild(bee);

    bee.onclick = (e) => {
        const bonus = level * 50;
        glitter += bonus;
        messageEl.textContent = `OMG! Du fanget den gylne bien! 🐝 Du fikk ${bonus} glitter-støv! ✨`;
        
        // Burst of glitter
        for(let i=0; i<20; i++) {
            createGlitterParticle(e.clientX, e.clientY);
        }
        
        updateUI();
        bee.remove();
    };

    // Bee flies away if not clicked after 8 seconds
    setTimeout(() => {
        if (bee.parentNode) {
            bee.remove();
        }
    }, 8000);
}

function triggerRainbowRain() {
    messageEl.textContent = "Se! Det regner regnbue-glitter! 🌈✨";
    const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
    
    for(let i=0; i<30; i++) {
        setTimeout(() => {
            const drop = document.createElement('div');
            drop.className = 'rainbow-drop';
            drop.style.left = Math.random() * gardenArea.clientWidth + 'px';
            drop.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            gardenArea.appendChild(drop);
            
            setTimeout(() => drop.remove(), 2000);
        }, i * 100);
    }

    // Bonus glitter for everyone!
    const rainBonus = level * 20;
    glitter += rainBonus;
    updateUI();
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
    
    // Rare flower chance! (10% chance)
    const isRare = Math.random() < 0.1;
    if (isRare) {
        flower.className = 'flower rare-flower';
        messageEl.textContent = "OII! Du plantet en SELDEN magisk blomst! 🌟";
    } else {
        messageEl.textContent = "Du plantet en magisk blomst! 🌸";
    }

    flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    
    const x = Math.random() * (gardenArea.clientWidth - 50);
    const y = Math.random() * (gardenArea.clientHeight - 50);
    
    flower.style.left = x + 'px';
    flower.style.top = y + 'px';
    
    flower.onclick = (e) => {
        createGlitterParticle(e.clientX, e.clientY);
        const reward = isRare ? glitterPerClick * 5 : glitterPerClick;
        glitter += reward;
        updateUI();
        messageEl.textContent = isRare ? `Den sjeldne blomsten ga deg masse glitter! ✨ (${reward})` : "En blomst ga deg litt glitter! ✨";
        
        // Check for level up!
        if (flowers >= level * 5) {
            levelUp();
        }
    };
    
    gardenArea.appendChild(flower);
    updateUI();
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

// Handle upgrades
function setupUpgrades() {
    for (const key in upgrades) {
        const up = upgrades[key];
        const btn = document.getElementById(up.elementId);
        if (btn) {
            btn.onclick = () => {
                if (glitter >= up.cost) {
                    glitter -= up.cost;
                    gps += up.power;
                    updateUI();
                    messageEl.textContent = `Du kjøpte ${up.label}! Nå får du mer glitter automatisk! ✨`;
                    
                    // Visual effect
                    const rect = btn.getBoundingClientRect();
                    for(let i=0; i<10; i++) {
                        createGlitterParticle(rect.left + rect.width/2, rect.top + rect.height/2);
                    }
                }
            };
        }
    }
}

// Passive income loop
setInterval(() => {
    if (gps > 0) {
        glitter += gps;
        updateUI();
    }
    
    // Random Events!
    if (Math.random() < 0.05) { // 5% chance every second
        spawnGoldenBee();
    }
    if (Math.random() < 0.02) { // 2% chance every second
        triggerRainbowRain();
    }
}, 1000);

plantBtn.addEventListener('click', plantFlower);
collectBtn.addEventListener('click', collectGlitter);

// Initialize
setupUpgrades();
updateUI();
