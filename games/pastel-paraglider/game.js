    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('score');
        const highscoreEl = document.getElementById('highscore');
        const livesEl = document.getElementById('lives');
        const comboUi = document.getElementById('combo-ui');
        const comboValEl = document.getElementById('combo-val');
        const totalGledeEl = document.getElementById('total-glede');
        const shopOverlay = document.getElementById('shop-overlay');
        const shopGrid = document.getElementById('shop-grid');
        const overlay = document.getElementById('overlay');
        const statusText = document.getElementById('status-text');
        const finalScoreEl = document.getElementById('final-score');
    
        let score = 0;
        let totalGlede = parseInt(localStorage.getItem('paragliderTotalGlede')) || 0;
        let combo = 0;
        let comboTimer = 0;
        let lives = 3;
        let highscore = localStorage.getItem('paragliderHighscore') || 0;
        let gameActive = false;
        let canvasWidth, canvasHeight;
        let isPressing = false;
        let isFeverMode = false;
        let feverTimer = 0;
        let currentThemeIndex = 0;
        let screenShake = 0;
        let currentSkin = localStorage.getItem('paragliderSkin') || '#ff80ab';
        let frameCount = 0;
    
        highscoreEl.innerText = highscore;
        totalGledeEl.innerText = totalGlede;
    
        // Audio Setup
        const AudioCtx = window.AudioContext || window.webkitAudioContext;

        const audioCtx = new AudioCtx();
        function playSound(freq, type, duration, vol = 0.1) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        }

        function resize() {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Player {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = 100;
                this.y = canvasHeight / 2;
                this.color = currentSkin;
                this.radius = 20;
                this.velocity = 0;
                this.gravity = 0.25;
                this.lift = -0.6;
                this.angle = 0;
                this.trail = [];
                this.invincible = 0;
            }
            update() {
                if (isPressing) {
                    this.velocity += this.lift;
                } else {
                    this.velocity += this.gravity;
                }
                
                this.velocity *= 0.98;
                this.y += this.velocity;
                this.angle = this.velocity * 0.05;

                if (this.invincible > 0) this.invincible--;

                // Trail logic
                this.trail.push({x: this.x, y: this.y});
                if (this.trail.length > 20) this.trail.shift();

                if (this.y < 0) {
                    this.y = 0;
                    this.velocity = 0;
                }
                if (this.y > canvasHeight) {
                    gameOver();
                }
            }
            draw() {
        // Draw trail
        ctx.beginPath();
        ctx.moveTo(this.trail[0]?.x, this.trail[0]?.y);
        for(let i=1; i<this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color + '66'; // Semi-transparent version of current skin
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();

                ctx.save();
                if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                    ctx.globalAlpha = 0.5;
                }
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                // Canopy
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 1.5, Math.PI, 0);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Lines
                ctx.beginPath();
                ctx.moveTo(-this.radius * 1.5, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(this.radius * 1.5, 0);
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.stroke();
                
                // Ellie
                ctx.beginPath();
                ctx.arc(0, this.radius, 10, 0, Math.PI * 2);
                ctx.fillStyle = this.color === '#ffffff' ? '#f0f0f0' : '#fff';
                ctx.fill();
                ctx.strokeStyle = currentSkin;
                ctx.stroke();
                
                // Blushing cheeks
                ctx.beginPath();
                ctx.arc(-4, this.radius + 2, 2, 0, Math.PI * 2);
                ctx.arc(4, this.radius + 2, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffc1e3';
                ctx.fill();
                
                ctx.restore();
            }
        }

        class Obstacle {
            constructor(type) {
                this.type = type; 
                this.x = canvasWidth + 100;
                this.y = Math.random() * (canvasHeight - 100) + 50;
                this.radius = type === 'cloud' ? Math.random() * 40 + 30 : 15;
                this.speed = (Math.random() * 2 + 3) * (1 + score * 0.001);
                this.color = type === 'cloud' ? '#bdbdbd' : '#fff59d';
                this.emoji = type === 'cloud' ? '☁️' : '✨';
                if (type === 'heart') this.emoji = '❤️';
            }
            update() {
                this.x -= this.speed;
            }
            draw() {
                ctx.font = `${this.radius * 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.emoji, this.x, this.y);
            }
        }

        class BackgroundElement {
            constructor(layer) {
                this.layer = layer; // 1 = far, 2 = mid, 3 = near
                this.reset();
                this.x = Math.random() * canvasWidth;
            }
            reset() {
                this.x = canvasWidth + 100;
                this.y = Math.random() * canvasHeight;
                this.size = (Math.random() * 20 + 10) * (this.layer * 0.5);
                this.speed = (Math.random() * 1 + 0.5) * (this.layer * 0.3);
                this.emoji = ['🌸', '⭐', '☁️', '💖'][Math.floor(Math.random() * 4)];
                this.opacity = (Math.random() * 0.5 + 0.2) / this.layer;
            }
            update() {
                this.x -= this.speed;
                if (this.x < -100) this.reset();
            }
        }

        class WindCurrent {
            constructor() {
                this.reset();
                this.x = Math.random() * canvasWidth;
            }
            reset() {
                this.x = canvasWidth + 100;
                this.y = Math.random() * (canvasHeight - 200) + 100;
                this.width = 60;
                this.height = 150;
                this.strength = (Math.random() * 0.5 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
                this.speed = Math.random() * 2 + 2;
            }
            update() {
                this.x -= this.speed;
                if (this.x < -100) this.reset();
            }
            draw() {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.setLineDash([10, 10]);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2, this.y);
                ctx.lineTo(this.x + this.width/2, this.y + this.height);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        class Ring {
            constructor() {
                this.x = canvasWidth + 100;
                this.y = Math.random() * (canvasHeight - 150) + 75;
                this.radius = 40;
                this.speed = (Math.random() * 2 + 3) * (1 + score * 0.001);
                this.color = `hsl(${Math.random() * 360}, 80%, 80%)`;
                this.collected = false;
            }
            update() {
                this.x -= this.speed;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 8;
                ctx.stroke();
                // Inner glow
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius - 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
   
        const player = new Player();
        let obstacles = [];
        let backgroundElements = [];
        let particles = [];
        
        // Initialize parallax layers
        for(let i=0; i<20; i++) backgroundElements.push(new BackgroundElement(1));
        for(let i=0; i<15; i++) backgroundElements.push(new BackgroundElement(2));
        for(let i=0; i<10; i++) backgroundElements.push(new BackgroundElement(3));


        function spawnObstacle() {
            let type = 'cloud';
            if (isFeverMode) {
                const rand = Math.random();
                if (rand > 0.8) type = 'heart';
                else type = 'sparkle';
            } else {
                const rand = Math.random();
                if (rand > 0.9) type = 'heart';
                else if (rand > 0.6) type = 'sparkle';
            }
            obstacles.push(new Obstacle(type));
        }

        function createExplosion(x, y, color) {
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        function showFloatingText(text, x, y) {
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.innerText = text;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }

        function takeDamage() {
            if (player.invincible > 0) return;
            
            lives--;
            livesEl.innerText = lives;
            screenShake = 20;
            playSound(150, 'sawtooth', 0.5);
            createExplosion(player.x, player.y, '#ff80ab');
            
            if (lives <= 0) {
                gameOver();
            } else {
                player.invincible = 120; // 2 seconds at 60fps
                player.velocity = -5; // Bounce up
            }
        }

        function update() {
            if (!gameActive) return;

            // Theme Management
            const themes = [
                { top: '#e0f7fa', bottom: '#b2ebf2' },
                { top: '#ff7e5f', bottom: '#feb47b' },
                { top: '#6a11cb', bottom: '#2575fc' },
                { top: '#0f0c29', bottom: '#302b63' }
            ];
            const themeIndex = Math.min(themes.length - 1, Math.floor(score / 1000));
            if (themeIndex !== currentThemeIndex) {
                currentThemeIndex = themeIndex;
                document.documentElement.style.setProperty('--bg-sky', themes[themeIndex].top);
                document.documentElement.style.setProperty('--sky-bottom', themes[themeIndex].bottom);
            }

            // Fever Mode Logic
            if (isFeverMode) {
                feverTimer--;
                if (feverTimer <= 0) isFeverMode = false;
            }

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            frameCount++;

            if (screenShake > 0) {
                ctx.save();
                ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
                screenShake *= 0.9;
                if (screenShake < 0.1) screenShake = 0;
            }

            backgroundElements.forEach(be => {
                be.update();
                be.draw();
            });

            if (frameCount % 60 === 0) {
                spawnObstacle();
            }

            player.update();
            player.draw();

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.update();
                obs.draw();

                const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
                if (dist < player.radius + obs.radius * 0.7) {
                    if (obs.type === 'cloud') {
                        takeDamage();
                        obstacles.splice(i, 1);
                    } else if (obs.type === 'sparkle') {
                        combo++;
                        comboTimer = 60;
                        const points = 1 + Math.floor(combo / 5);
                        score += points;
                        totalGlede += points;
                        localStorage.setItem('paragliderTotalGlede', totalGlede);
                        totalGledeEl.innerText = totalGlede;
                        scoreEl.innerText = score;
                        
                        playSound(440 + combo * 20, 'sine', 0.1);
                        createExplosion(obs.x, obs.y, '#fff59d');
                        showFloatingText(`+${points} ✨`, obs.x, obs.y);
                        
                        if (combo > 1) {
                            comboUi.classList.add('show');
                            comboValEl.innerText = combo;
                        }
                        
                        if (combo >= 15 && !isFeverMode) {
                            isFeverMode = true;
                            feverTimer = 300; 
                            playSound(880, 'sine', 0.3);
                            setTimeout(() => playSound(1100, 'sine', 0.3), 100);
                            showFloatingText("FEVER MODE! ✨", canvasWidth / 2, canvasHeight / 2);
                        }
                        
                        obstacles.splice(i, 1);
                    } else if (obs.type === 'heart') {
                        lives = Math.min(5, lives + 1);
                        livesEl.innerText = lives;
                        playSound(600, 'sine', 0.3);
                        createExplosion(obs.x, obs.y, '#ff5252');
                        showFloatingText("+1 ❤️", obs.x, obs.y);
                        obstacles.splice(i, 1);
                    }
                }

                if (obs.x < -100) {
                    obstacles.splice(i, 1);
                }
            }

            if (comboTimer > 0) {
                comboTimer--;
                if (comboTimer <= 0) {
                    combo = 0;
                    comboUi.classList.remove('show');
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }

            if (screenShake > 0) ctx.restore();
            requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            playSound(150, 'sawtooth', 0.5);
            createExplosion(player.x, player.y, '#ff80ab');
            
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('paragliderHighscore', highscore);
                highscoreEl.innerText = highscore;
                statusText.innerText = "NY REKORD! 🎉";
            } else {
                statusText.innerText = "Oi da! 🌸";
            }
            
            finalScoreEl.innerText = `Du samlet ${score} gledesgnister!`;
            overlay.style.display = 'block';
        }

        function resetGame() {
            score = 0;
            combo = 0;
            comboTimer = 0;
            lives = 3;
            scoreEl.innerText = '0';
            livesEl.innerText = '3';
            comboUi.classList.remove('show');
            obstacles = [];
            particles = [];
            frameCount = 0;
            player.reset();
            gameActive = true;
            overlay.style.display = 'none';
            update();
        }
        
        // Add a button to the overlay to open the shop
        function setupOverlay() {
            const shopBtn = document.createElement('button');
            shopBtn.className = 'btn';
            shopBtn.innerText = 'Skin Shop! 🎀';
            shopBtn.style.marginLeft = '10px';
            shopBtn.style.backgroundColor = 'var(--primary-purple)';
            shopBtn.style.boxShadow = '0 6px 0 #9b7bc4';
            shopBtn.onclick = openShop;
            overlay.appendChild(shopBtn);
        }
        setupOverlay();

        function openShop() {
            shopOverlay.style.display = 'flex';
        }

        function closeShop() {
            shopOverlay.style.display = 'none';
        }

        const skins = [
            { color: '#ff80ab', name: 'Classic Pink', cost: 0 },
            { color: '#b2ebf2', name: 'Sky Blue', cost: 200 },
            { color: '#ce93d8', name: 'Lavender', cost: 500 },
            { color: '#fff59d', name: 'Sunshine', cost: 1000 },
            { color: '#ff7e5f', name: 'Sunset', cost: 2000 },
            { color: '#6a11cb', name: 'Midnight', cost: 5000 },
            { color: '#ffffff', name: 'Pure Cloud', cost: 10000 },
            { color: 'rainbow', name: 'Rainbow', cost: 25000 },
            { color: 'diamond', name: 'Diamond', cost: 50000 },
        ];
        
        function renderShop() {
            shopGrid.innerHTML = '';
            skins.forEach(skin => {
                const isSelected = currentSkin === skin.color;
                const canAfford = totalGlede >= skin.cost;
                const isOwned = localStorage.getItem(`paragliderSkin_${skin.color}`) === 'true' || skin.cost === 0;
                
                const item = document.createElement('div');
                item.className = `shop-item ${isSelected ? 'selected' : ''}`;
                item.innerHTML = `
                    <div class="item-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : (skin.color === 'diamond' ? '#b9f2ff' : skin.color)}"></div>
                    <div style="font-size: 0.9rem; font-weight: bold;">${skin.name}</div>
                    <div class="item-cost">${isOwned ? 'Owned' : '✨ ' + skin.cost}</div>
                `;
                
                item.onclick = () => {
                    if (isOwned) {
                        currentSkin = skin.color;
                        localStorage.setItem('paragliderSkin', currentSkin);
                        renderShop();
                        playSound(600, 'sine', 0.1);
                    } else if (canAfford) {
                        totalGlede -= skin.cost;
                        localStorage.setItem('paragliderTotalGlede', totalGlede);
                        totalGledeEl.innerText = totalGlede;
                        localStorage.setItem(`paragliderSkin_${skin.color}`, 'true');
                        currentSkin = skin.color;
                        localStorage.setItem('paragliderSkin', currentSkin);
                        renderShop();
                        playSound(880, 'sine', 0.2);
                    } else {
                        playSound(200, 'sawtooth', 0.1);
                    }
                };
                shopGrid.appendChild(item);
            });
        }

        function getSkinColor() {
            if (currentSkin === 'rainbow') {
                return `hsl(${Date.now() / 10 % 360}, 70%, 70%)`;
            }
            if (currentSkin === 'diamond') {
                return Math.random() > 0.9 ? '#fff' : '#b9f2ff';
            }
            return currentSkin;
        }

        // Modify Player.draw to use getSkinColor()
        const originalDraw = Player.prototype.draw;
        Player.prototype.draw = function() {
            const activeColor = getSkinColor();
            
            // Draw trail
            ctx.beginPath();
            ctx.moveTo(this.trail[0]?.x, this.trail[0]?.y);
            for(let i=1; i<this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = activeColor + '66';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.save();
            if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            // Canopy
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.5, Math.PI, 0);
            ctx.fillStyle = activeColor;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Lines
            ctx.beginPath();
            ctx.moveTo(-this.radius * 1.5, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(this.radius * 1.5, 0);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.stroke();
            
                // Ellie
                ctx.beginPath();
                ctx.arc(0, this.radius, 10, 0, Math.PI * 2);
                ctx.fillStyle = activeColor === '#ffffff' ? '#f0f0f0' : '#fff';
                ctx.fill();
                ctx.strokeStyle = activeColor;
                ctx.stroke();
            
            // Blushing cheeks
            ctx.beginPath();
            ctx.arc(-4, this.radius + 2, 2, 0, Math.PI * 2);
            ctx.arc(4, this.radius + 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffc1e3';
            ctx.fill();
            
            ctx.restore();
        };

        renderShop();
        openShop(); // Initial view if needed or just keep hidden
        shopOverlay.style.display = 'none';
        const handleStart = (e) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (!gameActive && overlay.style.display === 'none') {
                gameActive = true;
                update();
            }
            isPressing = true;
            e.preventDefault();
        };
        const handleEnd = () => {
            isPressing = false;
        };

        window.addEventListener('mousedown', handleStart);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchend', handleEnd);

        overlay.style.display = 'block';
        statusText.innerText = "Ellie's Pastel Paraglider 🪂";
        finalScoreEl.innerText = "Klar for en magisk flytur?";
    </script>
</body>
</html>
