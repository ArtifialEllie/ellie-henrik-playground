function levelUp() {
    const banner = document.getElementById('level-up-banner');
    if (banner) {
        banner.style.display = 'block';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 3000);
    }
    currentLevel++;
    localStorage.setItem('bokstavspillLevel', currentLevel);
    updateStatus();
    nextRound();
}

function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const pool = levelData[currentLevel].items;
    const totalItems = Object.values(pool).flat().length;
    const unlockedCount = unlockedItems.length; 
    // This is a simple approximation. A better one would count only items in the current level.
    const levelUnlocked = Object.keys(pool).filter(k => {
        return pool[k].some(item => unlockedItems.includes(`${k}_${item.name}`));
    }).length;
    const totalKeys = Object.keys(pool).length;
    bar.style.width = `${(levelUnlocked / totalKeys) * 100}%`;
}

function triggerBonusRound() {
    const banner = document.getElementById('bonus-banner');
    if (banner) {
        banner.style.display = 'block';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 2000);
    }
    totalStars += 5;
    localStorage.setItem('bokstavspillStars', totalStars);
    updateStatus();
    playSfx('correct');
}

function spawnConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.position = 'absolute';
        confetti.style.zIndex = '1000';
        confetti.style.pointerEvents = 'none';
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

function renderCollection() {
    const container = document.getElementById('collection');
    if (!container) return;
    container.innerHTML = '<div style="width:100%; text-align:center; font-weight:bold; margin-bottom:20px; color:#ff69b4; font-size:1.5rem;">Min Samling 🦄</div>';
    
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
    grid.style.gap = '15px';
    grid.style.padding = '20px';

    unlockedItems.forEach(id => {
        const [letter, name] = id.split('_');
        const itemEl = document.createElement('div');
        itemEl.className = 'collection-item';
        
        let emoji = '❓';
        for (const level of Object.values(levelData)) {
            const item = level.items[letter]?.find(i => i.name === name);
            if (item) {
                emoji = item.emoji;
                break;
            }
        }
        
        itemEl.innerHTML = `<div style="font-size:2rem;">${emoji}</div><div style="font-size:0.8rem;">${name}</div>`;
        grid.appendChild(itemEl);
    });
    container.appendChild(grid);
}
