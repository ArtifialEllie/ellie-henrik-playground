function triggerGiggleStorm() {
    const giggleAlert = document.getElementById('giggle-alert');
    if (giggleAlert) giggleAlert.style.display = 'block';
    
    const duration = 6000;
    const end = Date.now() + duration;
    
    // Giggle Storm: Bubbles start to "giggle" (shake and jump)
    // and occasionally split into two smaller bubbles!
    const giggleInterval = setInterval(() => {
        if (Date.now() > end || !gameActive) {
            clearInterval(giggleInterval);
            if (giggleAlert) giggleAlert.style.display = 'none';
            return;
        }
        
        if (Math.random() < 0.15) {
            const b = bubbles[Math.floor(Math.random() * bubbles.length)];
            if (b && b.type !== 'stinky') {
                // Make it jump!
                b.vy -= 5; 
                
                // Chance to split!
                if (Math.random() < 0.3) {
                    const mini = new Bubble(false);
                    mini.radius = b.radius * 0.6;
                    mini.color = b.color;
                    mini.x = b.x + (Math.random() - 0.5) * 20;
                    mini.y = b.y;
                    mini.vx = (Math.random() - 0.5) * 10;
                    mini.vy = (Math.random() - 0.5) * 10 - 2;
                    bubbles.push(mini);
                    floatingTexts.push(new FloatingText(b.x, b.y, '🤭 Heehee!', b.color));
                }
            }
        }
    }, 100);
}
