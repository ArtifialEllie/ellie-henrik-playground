class Boss {
    constructor() {
        this.radius = 80;
        this.x = canvasWidth / 2;
        this.y = 150;
        this.vx = 3;
        this.pulse = 0;
        this.pulseDir = 1;
        this.emoji = '💨';
    }

    update() {
        this.x += this.vx;
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
        }
        this.pulse += 0.05 * this.pulseDir;
        if (this.pulse > 1 || this.pulse < 0) this.pulseDir *= -1;
    }

    draw() {
        const currentRadius = this.radius + this.pulse * 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius);
        grad.addColorStop(0, '#9e9e9e');
        grad.addColorStop(1, '#666');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
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
