function triggerMelodyMode() {
    const melodyAlert = document.getElementById('melody-alert') || createAlert('melody-alert', 'MELODY MODE! 🎵');
    melodyAlert.style.display = 'block';
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let noteIndex = 0;
    
    const melodyInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(melodyInterval);
            return;
        }
        playSound(notes[noteIndex], 'sine', 0.1);
        noteIndex = (noteIndex + 1) % notes.length;
    }, 200);
    
    setTimeout(() => {
        melodyAlert.style.display = 'none';
        clearInterval(melodyInterval);
    }, 5000);
}

function triggerGiggleStorm() {
    const giggleAlert = document.getElementById('giggle-alert') || createAlert('giggle-alert', 'GIGGLE STORM! 🤭');
    giggleAlert.style.display = 'block';
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            if (!gameActive) return;
            const b = new Bubble(false);
            b.type = 'normal';
            b.color = '#ffc0cb';
            b.vx = (Math.random() - 0.5) * 10;
            b.vy = (Math.random() - 0.5) * 10;
            bubbles.push(b);
        }, i * 100);
    }
    
    setTimeout(() => {
        giggleAlert.style.display = 'none';
    }, 5000);
}

function triggerGravityFlip() {
    window.isGravityFlipped = !window.isGravityFlipped;
    const flipAlert = document.getElementById('gravity-flip-alert') || createAlert('gravity-flip-alert', 'GRAVITY FLIP! 🙃');
    flipAlert.style.display = 'block';
    
    floatingTexts.push(new FloatingText(canvasWidth / 2, canvasHeight / 2, 'UPSIDE DOWN!', 'magenta'));
    
    setTimeout(() => {
        flipAlert.style.display = 'none';
    }, 3000);
}

function triggerGlitterStorm() {
    const stormAlert = document.getElementById('glitter-storm-alert') || createAlert('glitter-storm-alert', 'GLITTER STORM! ✨');
    stormAlert.style.display = 'block';
    
    const stormInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(stormInterval);
            return;
        }
        for (let i = 0; i < 5; i++) {
            const p = new Particle(Math.random() * canvasWidth, Math.random() * canvasHeight, 'white');
            p.vx *= 0.5;
            p.vy *= 0.5;
            particles.push(p);
        }
    }, 100);
    
    setTimeout(() => {
        stormAlert.style.display = 'none';
        clearInterval(stormInterval);
    }, 5000);
}

function triggerCosmicBloom() {
    const bloomAlert = document.getElementById('bloom-alert') || createAlert('bloom-alert', 'COSMIC BLOOM! 🌸');
    bloomAlert.style.display = 'block';
    
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const bloom = new Bubble(false);
        bloom.x = canvasWidth / 2;
        bloom.y = canvasHeight / 2;
        bloom.vx = Math.cos(angle) * 5;
        bloom.vy = Math.sin(angle) * 5;
        bloom.color = 'rainbow';
        bloom.type = 'rainbow-burst';
        bubbles.push(bloom);
    }
    
    setTimeout(() => {
        bloomAlert.style.display = 'none';
    }, 5000);
}

function createAlert(id, text) {
    const alert = document.createElement('div');
    alert.id = id;
    alert.className = 'alert-text';
    alert.innerText = text;
    alert.style.display = 'none';
    alert.style.position = 'absolute';
    alert.style.top = '20%';
    alert.style.left = '50%';
    alert.style.transform = 'translate(-50%, -50%)';
    alert.style.fontSize = '2rem';
    alert.style.fontWeight = 'bold';
    alert.style.zIndex = '1000';
    alert.style.pointerEvents = 'none';
    document.body.appendChild(alert);
    return alert;
}
