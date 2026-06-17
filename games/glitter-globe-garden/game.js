/**
 * Glitter Globe Garden ✨🌸
 * A whimsical game where you plant sparkle seeds and attract stardust butterflies.
 */

class GlitterGlobeGarden {
    constructor() {
        this.sparkles = 0;
        this.butterfliesCount = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        this.wateringLevel = 0;
        this.maxWateringLevel = 5;

        this.initElements();
        this.initEventListeners();
        this.startTimer();
        this.spawnAmbientSparkles();
    }

    initElements() {
        this.sparkleDisplay = document.getElementById('sparkle-count');
        this.timerDisplay = document.getElementById('timer');
        this.gardenPlot = document.getElementById('garden-plot');
        this.butterflyLayer = document.getElementById('butterfly-layer');
        this.plantBtn = document.getElementById('plant-btn');
        this.waterBtn = document.getElementById('water-btn');
        this.globe = document.getElementById('glitter-globe');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalButterflies = document.getElementById('final-butterflies');
        this.finalSparkles = document.getElementById('final-sparkles');
        this.restartBtn = document.getElementById('restart-btn');
    }

    initEventListeners() {
        this.plantBtn.addEventListener('click', () => this.plantSeed());
        this.waterBtn.addEventListener('click', () => this.waterGarden());
        this.globe.addEventListener('click', (e) => this.handleGlobeClick(e));
        this.restartBtn.addEventListener('click', () => location.reload());
    }

    plantSeed() {
        if (this.isGameOver) return;

        // Cost to plant a seed: 5 sparkles (unless it's the first few)
        const cost = this.sparkles >= 5 ? 5 : 0;
        if (this.sparkles < cost) {
            this.createFloatingText('Not enough sparkles! ✨', 'red');
            return;
        }

        this.sparkles -= cost;
        this.updateUI();

        const flower = document.createElement('div');
        flower.className = 'flower';
        
        // Rare chance for a golden flower
        const isGolden = Math.random() < 0.1;
        if (isGolden) {
            flower.classList.add('golden-flower');
            this.createFloatingText('🌟 GOLDEN FLOWER! 🌟', 'var(--gold)');
        }
        
        // Create petals
        const colors = ['#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea', '#ff9aa2'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 5; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.backgroundColor = isGolden ? 'var(--gold)' : color;
            petal.style.transform = `rotate(${i * 72}deg)`;
            flower.appendChild(petal);
        }

        const center = document.createElement('div');
        center.className = 'flower-center';
        flower.appendChild(center);

        // Random position on the garden plot
        const x = Math.random() * 80 + 10;
        const y = Math.random() * 20 + 70; // Bottom 30% of the globe
        flower.style.left = `${x}%`;
        flower.style.top = `${y}%`;

        this.gardenPlot.appendChild(flower);
        if (!isGolden) {
            this.createFloatingText('🌱 Seed Planted!', 'var(--purple-dark)');
        }
        this.triggerGlobeShake();

        // Flowers now grow over time when watered!
        setTimeout(() => {
            if (this.wateringLevel > 0) {
                flower.classList.add('grown');
            }
        }, 2000);
    }

    waterGarden() {
        if (this.isGameOver) return;

        this.wateringLevel++;
        if (this.wateringLevel > this.maxWateringLevel) {
            this.wateringLevel = 0; // Reset or cycle
        }

        this.createFloatingText('💧 Dew Dropped!', 'blue');
        
        // Visual effect: blue sparkles raining down
        for (let i = 0; i < 10; i++) {
            this.createSparkle(Math.random() * 400, 0, '#add8e6');
        }
        
        this.triggerGlobeShake();
    }

    handleGlobeClick(e) {
        if (this.isGameOver) return;

        // Clicking the globe gives a small amount of sparkles
        this.sparkles += 1;
        this.updateUI();

        // Create sparkle at click position
        const rect = this.globe.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.createSparkle(x, y, 'var(--gold)');
    }

    createSparkle(x, y, color = 'var(--gold)') {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.backgroundColor = color;
        sparkle.style.boxShadow = `0 0 10px ${color}`;
        
        this.globe.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 2000);
    }

    createFloatingText(text, color) {
        const textEl = document.createElement('div');
        textEl.style.position = 'absolute';
        textEl.style.left = '50%';
        textEl.style.top = '50%';
        textEl.style.transform = 'translate(-50%, -50%)';
        textEl.style.color = color;
        textEl.style.fontFamily = 'Fredoka One', 'sans-serif';
        textEl.style.fontSize = '1.5rem';
        textEl.style.pointerEvents = 'none';
        textEl.style.zIndex = '100';
        textEl.style.transition = 'all 0.8s ease-out';
        textEl.style.opacity = '1';
        
        textEl.innerText = text;
        
        document.body.appendChild(textEl);
        
        // Animate upwards
        setTimeout(() => {
            textEl.style.top = '40%';
            textEl.style.opacity = '0';
        }, 10);
        
        setTimeout(() => textEl.remove(), 800);
    }

    triggerGlobeShake() {
        this.globe.style.transform = 'scale(0.98) rotate(2deg)';
        setTimeout(() => {
            this.globe.style.transform = 'scale(1) rotate(0deg)';
        }, 100);
    }

    spawnButterfly() {
        if (this.isGameOver) return;

        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        
        const wingL = document.createElement('div');
        wingL.className = 'butterfly-wing left';
        
        const wingR = document.createElement('div');
        wingR.className = 'butterfly-wing right';
        
        butterfly.appendChild(wingL);
        butterfly.appendChild(wingR);
        
        // Random starting position (outside the globe)
        let posX = Math.random() * 400;
        let posY = -20;
        
        butterfly.style.left = `${posX}px`;
        butterfly.style.top = `${posY}px`;
        
        this.butterflyLayer.appendChild(butterfly);
        
        // Simple butterfly movement using JS animation
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        
        const move = () => {
            if (this.isGameOver) {
                butterfly.remove();
                return;
            }
            
            posX += Math.cos(angle) * speed;
            posY += Math.sin(angle) * speed;
            
            // Bounce off walls
            if (posX < 0 || posX > 380) {
                // Reverse angle on X
                const currentAngle = parseFloat(butterfly.dataset.angle || angle);
                butterfly.dataset.angle = Math.PI - (parseFloat(butterfly.dataset.angle || angle));
            }
            
            if (posY < 0 || posY > 380) {
                // Reverse angle on Y
                const currentAngle = parseFloat(butterfly.dataset.angle || angle);
                butterfly.dataset.angle = Math.PI + (parseFloat(butterfly.dataset.angle || angle));
            }
            
            butterfly.style.left = `${posX}px`;
            butterfly.style.top = `${posY}px`;
            
            requestAnimationFrame(move);
        };
        
        // Fixing the butterfly move logic to be more robust
        const animateButterfly = () => {
            let x = posX;
            let y = posY;
            let currentAngle = angle;
            let currentSpeed = speed;

            const update = () => {
                if (this.isGameOver) return;
                
                x += Math.cos(currentAngle) * currentSpeed;
                y += Math.sin(currentAngle) * currentSpeed;
                
                if (x < 0 || x > 380) currentAngle = Math.PI - currentAngle;
                if (y < 0 || y > 380) currentAngle = Math.PI + currentAngle;
                
                butterfly.style.left = `${x}px`;
                butterfly.style.top = `${y}px`;
                
                requestAnimationFrame(update);
            };
            update();
        };

        animateButterfly();
        this.butterfliesCount++;
    }

    spawnAmbientSparkles() {
        setInterval(() => {
            if (this.isGameOver) return;
            this.createSparkle(
                Math.random() * 400, 
                Math.random() * 400, 
                'var(--gold)'
            );
        }, 1000);
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            if (this.isGameOver) return;
            
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                clearInterval(timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    updateUI() {
        this.sparkleDisplay.innerText = this.sparkles;
        this.timerDisplay.innerText = this.timeLeft;
    }

    endGame() {
        this.isGameOver = true;
        this.gameOverScreen.classList.remove('hidden');
        this.finalButterflies.innerText = this.butterfliesCount;
        this.finalSparkles.innerText = this.sparkles;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new GlitterGlobeGarden();
    
    // Logic to attract butterflies based on flowers and watering
    setInterval(() => {
        if (game.isGameOver) return;
        
        // Probability of attracting a butterfly increases with more flowers
        const flowerCount = game.gardenPlot.children.length;
        const chance = 0.05 + (flowerCount * 0.02);
        
        if (Math.random() < chance) {
            game.spawnButterfly();
        }
    }, 3000);
});
