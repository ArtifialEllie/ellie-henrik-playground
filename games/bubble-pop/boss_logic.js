class Boss {
    constructor() {
        this.radius = 80;
        this.x = canvasWidth / 2;
        this.y = 150;
        this.vx = 3;
        this.pulse = 0;
        this.pulseDir = 1;
        this.emoji = '💨';
        this.isEnraged = false;
        this.enrageColor = '#ff4500';
        this.normalColor = '#9e9e9e';
    }

    update() {
        const speedMult = this.isEnraged ? 2 : 1;
        this.x += this.vx * speedMult;
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
        }
        this.pulse += (this.isEnraged ? 0.1 : 0.05) * this.pulseDir;
        if (this.pulse > 1 || this.pulse < 0) this.pulseDir *= -1;
    }

    draw() {
        const currentRadius = this.radius + this.pulse * (this.isEnraged ? 20 : 10);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius);
        const colorStart = this.isEnraged ? '#ff8c00' : '#9e9e9e';
        const colorEnd = this.isEnraged ? '#ff0000' : '#666';
        grad.addColorStop(0, colorStart);
        grad.addColorStop(1, colorEnd);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = this.isEnraged ? '#ffff00' : 'white';
        ctx.lineWidth = this.isEnraged ? 8 : 5;
        ctx.stroke();
        ctx.font = `${currentRadius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}

function triggerBossFight() {
    bossActive = true;
    bossHealth = 100;
    document.getElementById('boss-ui').style.display = 'block';
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, "OH NO! STINKY BEHEMOTH APPEARS! 💨", "orange"));
    playSound(100, 'sawtooth', 0.5);
    boss = new Boss();
    
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
    
    if (bossHealth <= 50 && !boss.isEnraged) {
        boss.isEnraged = true;
        boss.emoji = '😡';
        floatingTexts.push(new FloatingText(canvasWidth / 2, 100, "STINKY BEHEMOTH IS ENRAGED! 😡🔥", "red"));
        playSound(150, 'sawtooth', 0.5);
    }

    if (bossHealth <= 0) {
        bossActive = false;
        boss = null;
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
