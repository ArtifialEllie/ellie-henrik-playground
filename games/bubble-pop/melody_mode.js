function triggerMelodyMode() {
    const melodyAlert = document.getElementById('melody-alert');
    melodyAlert.style.display = 'block';
    melodyAlert.style.color = '#ffeb3b';
    melodyAlert.style.textShadow = '2px 2px #ff4081';
    
    const melodyInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(melodyInterval);
            return;
        }
        
        // In Melody Mode, popping bubbles creates a sequence of musical notes
        // We'll simulate this by adding a multiplier to the sound frequency
        const noteOffset = Math.floor(Date.now() / 200) % 8;
        const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        
        // This is a background "hum" that makes it feel musical
        if (Math.random() < 0.1) {
            playSound(frequencies[noteOffset], 'sine', 0.05, 0.2);
        }
    }, 200);
    
    setTimeout(() => {
        melodyAlert.style.display = 'none';
        clearInterval(melodyInterval);
    }, 7000);
}
