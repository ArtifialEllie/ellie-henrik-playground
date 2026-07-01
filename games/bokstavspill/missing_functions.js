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

    // Collect all unique items across all levels to show a complete "sticker book"
    const allItems = [];
    const seenIds = new Set();

    Object.entries(levelData).forEach(([levelId, levelObj]) => {
        Object.entries(levelObj.items).forEach(([letter, items]) => {
            items.forEach(item => {
                const id = `${letter}_${item.name}`;
                if (!seenIds.has(id)) {
                    allItems.push({ id, letter, name: item.name, emoji: item.emoji });
                    seenIds.add(id);
                }
            });
        });
    });

    // Sort items by letter for better organization
    allItems.sort((a, b) => a.letter.localeCompare(b.letter));

    allItems.forEach(item => {
        const itemEl = document.createElement('div');
        const isUnlocked = unlockedItems.includes(item.id);
        itemEl.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
        
        itemEl.innerHTML = `
            <div style="font-size:2rem;">${isUnlocked ? item.emoji : '❓'}</div>
            <div style="font-size:0.8rem;">${isUnlocked ? item.name : '???'}</div>
        `;
        grid.appendChild(itemEl);
    });
    container.appendChild(grid);
}
