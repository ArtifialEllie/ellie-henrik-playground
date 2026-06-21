function triggerBossFight() {
    bossActive = true;
    bossHealth = 100;
    document.getElementById('boss-ui').style.display = 'block';
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, "OH NO! STINKY BEHEMOTH APPEARS! 💨", "orange"));
    playSound(100, 'sawtooth', 0.5);
    
    // Boss spawns a lot of stinky bubbles
    const bossInterval = setInterval(() => {
        if (!bossActive || !gameActive) {
            clearInterval(bossInterval);
            return;
        }
        const b = new Bubble(false);
        b.type = 'stinky';
        b.radius = 40;
        b.speed = 2;
        bubbles.push(b);
    }, 800);

    // Boss moves across the top
    const bossMove = setInterval(() => {
        if (!bossActive || !gameActive) {
            clearInterval(bossMove);
            return;
        }
    }, 100);

    // We'll handle damage in handlePop
}

function damageBoss(amount) {
    bossHealth -= amount;
    const fill = document.getElementById('boss-health-fill');
    if (fill) fill.style.width = `${Math.max(0, (bossHealth / bossMaxHealth) * 100)}%`;
    
    if (bossHealth <= 0) {
        bossActive = false;
        document.getElementById('boss-ui').style.display = 'none';
        floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, "STINKY BEHEMOTH DEFEATED! 🏆", "gold"));
        score += 1000;
        totalGold += 500;
        localStorage.setItem('bubblePopTotalGold', totalGold);
        totalGoldEl.innerText = totalGold;
        createBigExplosion(canvasWidth / 2, 100);
        triggerFrenzy();
        playSound(880, 'sine', 0.5);
    }
}
