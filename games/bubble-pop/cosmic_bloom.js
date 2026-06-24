function triggerCosmicBloom() {
    const bloomAlert = document.getElementById('cosmic-bloom-alert');
    if (bloomAlert) bloomAlert.style.display = 'block';
    
    const duration = 6000;
    const end = Date.now() + duration;
    
    const bloomInterval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(bloomInterval);
            if (bloomAlert) bloomAlert.style.display = 'none';
            return;
        }
        
        // Cosmic Bloom: Spawn magic flowers that pop nearby bubbles
        if (Math.random() < 0.15) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            magicFlowers.push(new MagicFlower(x, y));
        }
    }, 100);
}
