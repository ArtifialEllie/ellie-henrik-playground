function triggerGravityFlip() {
    const gravityAlert = document.getElementById('gravity-flip-alert');
    if (gravityAlert) gravityAlert.style.display = 'block';
    
    // Flip the vertical speed of all existing bubbles
    bubbles.forEach(b => {
        b.speed *= -1;
    });

    // Also invert the spawn logic for the duration of the flip
    const originalSpawn = spawnBubble;
    // We can't easily redefine spawnBubble if it's in the same scope, 
    // but we can set a global flag.
    window.isGravityFlipped = true;
    
    setTimeout(() => {
        window.isGravityFlipped = false;
        if (gravityAlert) gravityAlert.style.display = 'none';
        
        // Flip them back!
        bubbles.forEach(b => {
            b.speed *= -1;
        });
    }, 6000);
}
