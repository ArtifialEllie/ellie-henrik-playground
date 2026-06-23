function triggerGlitterStorm() {
    const glitterAlert = document.getElementById('glitter-storm-alert');
    if (!glitterAlert) return;
    glitterAlert.style.display = 'block';
    glitterAlert.style.color = '#fff';
    glitterAlert.style.textShadow = '0 0 10px #ff00ff, 0 0 20px #00ffff';
    
    const stormInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(stormInterval);
            return;
        }
        for (let i = 0; i < 5; i++) {
            const p = new Particle(Math.random() * canvasWidth, Math.random() * canvasHeight, `hsl(${Math.random() * 360}, 100%, 80%)`);
            p.vx *= 0.5;
            p.vy *= 0.5;
            p.decay = 0.01;
            particles.push(p);
        }
    }, 50);
    
    setTimeout(() => {
        glitterAlert.style.display = 'none';
        clearInterval(stormInterval);
    }, 5000);
}
