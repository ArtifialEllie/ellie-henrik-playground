class Boss {
    constructor() {
        this.radius = 60;
        this.x = canvas.width / 2;
        this.y = 100;
        this.vx = 3;
        this.health = 100;
        this.maxHealth = 100;
        this.emoji = '🐡';
        this.isEnraged = false;
    }

    update() {
        const speedMult = this.isEnraged ? 2 : 1;
        this.x += this.vx * speedMult;
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isEnraged ? '#ff4500' : '#8b4513';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}

function triggerBossFight() {
    bossActive = true;
    boss = new Boss();
    document.getElementById('boss-ui').style.display = 'block';
    showFloatingText("OH NO! GIGANTIC GRUMPY GULPER APPEARS! 🐡", canvas.width/2, canvas.height/2);
    playSound(100, 'sawtooth', 0.5);
    
    const bossInterval = setInterval(() => {
        if (!bossActive || !gameActive) {
            clearInterval(bossInterval);
            return;
        }
        const b = new Fish(true);
        b.speed = 4;
        enemies.push(b);
    }, 1000);
}

function damageBoss(amount) {
    boss.health -= amount;
    const fill = document.getElementById('boss-health-fill');
    if (fill) fill.style.width = `${Math.max(0, (boss.health / boss.maxHealth) * 100)}%`;
    
    if (boss.health <= 50 && !boss.isEnraged) {
        boss.isEnraged = true;
        showFloatingText("BOSS IS ENRAGED! 😡🔥", canvas.width/2, 100);
        playSound(150, 'sawtooth', 0.5);
    }
    
    if (boss.health <= 0) {
        bossActive = false;
        boss = null;
        document.getElementById('boss-ui').style.display = 'none';
        showFloatingText("BOSS DEFEATED! 🏆", canvas.width/2, canvas.height/2);
        score += 1000;
        scoreElement.innerText = `Pearls: ${score}`;
        createParticles(canvas.width/2, 100, 'gold', 50);
        frenzyTimer = 600;
        playSound(880, 'sine', 0.5);
    }
}
