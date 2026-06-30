const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('score');
        const highscoreEl = document.getElementById('highscore');
        const comboEl = document.getElementById('combo-ui');
        const comboValEl = document.getElementById('combo-val');
        const overlay = document.getElementById('overlay');
    const statusText = document.getElementById('status-text');
    const finalScoreEl = document.getElementById('final-score');
    const perfectText = document.getElementById('perfect-text');
    const feverText = document.getElementById('fever-text');
    const windIndicator = document.getElementById('wind-indicator');

        let score = 0;
        let combo = 0;
        let highscore = localStorage.getItem('pancakeFlipHighscore') || 0;
        let gameActive = false;
    let isPaused = false;
        let canvasWidth, canvasHeight;
        let shakeAmount = 0;
        let currentWind = 0;
    let scoreMult = 1;
    let scoreMultTimer = 0;
    let slideSpeedMult = 1;
    let slideSpeedMultTimer = 0;
        
        highscoreEl.innerText = highscore;

        const pancakeColors = {
            normal: ['#ffc1e3', '#b3e5fc', '#e1bee7', '#c8e6c9', '#fff59d', '#ffccbc'],
            gold: ['#ffd700', '#ffecb3', '#fff176'],
            rainbow: ['#ff80ab', '#80d8ff', '#ccff90', '#ffff8d', '#cfd8dc'],
            glitter: ['#f3e5f5', '#e1bee7', '#ce93d8', '#f8bbd0']
        };
        const toppings = ['🍓', '🫐', '🍯', '🧈', '✨', '🌸', '🥞'];

        // Audio Context for "Juice"
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
        function playSound(freq, type, duration, volume = 0.1) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
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

        let stack = [];
        let activePancake = null;
        let particles = [];
    let slideDirection = 1;
    let slideSpeed = 3;
    let windChangeTimer = 0;
    let currentTotalLean = 0;

        class Pancake {
            constructor(x, y, color, topping = null, width = 120) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = 20;
                this.color = color;
                this.topping = topping;
                this.vy = 0;
                this.isSyrupy = false;
                this.vx = 0;
                this.rotation = 0;
                this.vr = 0;
                this.isFlipping = false;
                this.bounceCount = 0;
                this.scaleY = 1; 
                this.targetScaleY = 1;
                this.tiltOffset = 0;
                this.butterMelt = 0;
            }

            update() {
                if (this.isFlipping) {
                    this.y += this.vy;
                    this.x += this.vx;
                    this.vy += 0.4;
                    if (this.bounceCount > 0 && this.vy > 0 && this.y >= canvasHeight - 100) {
                        this.vy *= -0.6;
                        this.bounceCount--;
                        playSound(300, 'sine', 0.1);
                    }
                    this.rotation += this.vr;
                    this.x += currentWind;
                } else if (this.y > canvasHeight - 100 && !stack.includes(this)) {
                    this.x += slideSpeed * slideDirection;
                    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
                        slideDirection *= -1;
                    }
                }
                this.scaleY += (this.targetScaleY - this.scaleY) * 0.2;
                if (Math.abs(this.scaleY - this.targetScaleY) < 0.01) {
                    this.scaleY = this.targetScaleY;
                }
                this.butterMelt += 0.02;
            }

            draw(cumulativeTilt, index) {
                ctx.save();
                const leanShift = stack.length > 1 ? (index / (stack.length - 1)) * currentTotalLean : 0;
                ctx.translate(this.x + this.width/2 + leanShift, this.y + this.height/2);
                ctx.rotate(cumulativeTilt + this.rotation);
                ctx.scale(1, this.scaleY);

                // Better pancake look with gradient
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width/2);
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, this.darkenColor(this.color, 20));
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
                ctx.fill();

                if (this.isSyrupy) {
                    ctx.strokeStyle = '#fbc02d';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                }
                ctx.lineWidth = 2;
                ctx.stroke();

                if (this.topping) {
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.topping, 0, -this.height/2 + 5);
                }

                if (this.topping === '🧈' && this.butterMelt < 1) {
                    ctx.fillStyle = '#fff176';
                    ctx.beginPath();
                    ctx.arc(0, -this.height/2, 8 * (1 - this.butterMelt), 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            darkenColor(color, percent) {
                const num = parseInt(color.replace('#', ''), 16),
                    amt = Math.round(2.55 * percent),
                    R = (num >> 16) - amt,
                    G = (num >> 8 & 0x00FF) - amt,
                    B = (num & 0x0000FF) - amt;
                return '#' + (0x1000000 + (R<0?0:R)*0x10000 + (G<0?0:G)*0x100 + (B<0?0:B)).toString(16).slice(1);
            }
        }

        class Particle {
            constructor(x, y, color, isSyrup = false) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.isSyrup = isSyrup;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.life = 1.0;
                this.radius = isSyrup ? Math.random() * 4 + 2 : Math.random() * 3 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.isSyrup ? 0.1 : 0;
                this.life -= 0.02;
            }
            draw() {
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        function initStack() {
            stack = [];
            currentTotalLean = 0;
            const startY = canvasHeight - 50;
            const startX = canvasWidth / 2 - 60;
            stack.push(new Pancake(startX, startY, pancakeColors.normal[0]));
            spawnActivePancake();
        }

        function spawnActivePancake() {
            const rand = Math.random();
            let colorSet;
            let isSpecial = false;
            let isBouncy = false;
            let isSticky = false;
            let isGiant = false;
            let specialType = '';

            if (rand > 0.97) {
                colorSet = pancakeColors.glitter;
                specialType = 'glitter';
                isSpecial = true;
            } else if (rand > 0.95) {
                colorSet = ['#ff00ff', '#ff00ff']; // Neon Purple for Power-up
                specialType = 'powerup';
                isSpecial = true;
            } else if (rand > 0.94) {
                colorSet = pancakeColors.gold;
                specialType = 'gold';
                isSpecial = true;
            } else if (rand > 0.92) {
                colorSet = pancakeColors.rainbow;
                specialType = 'rainbow';
                isSpecial = true;
            } else if (rand > 0.88) {
                colorSet = ['#e1f5fe', '#b3e5fc'];
                specialType = 'bouncy';
                isSpecial = true;
                isBouncy = true;
            } else if (rand > 0.84) {
                colorSet = ['#fff9c4', '#fff176'];
                specialType = 'sticky';
                isSpecial = true;
                isSticky = true;
            } else if (rand > 0.80) {
                colorSet = ['#ffeb3b', '#fdd835'];
                specialType = 'tiny';
                isSpecial = true;
            } else if (rand > 0.76) {
                colorSet = ['#ce93d8', '#ba68c8'];
                specialType = 'wobbly';
                isSpecial = true;
            } else if (rand > 0.72) {
                colorSet = pancakeColors.normal;
                specialType = 'giant';
                isSpecial = true;
                isGiant = true;
            } else if (rand > 0.68) {
                colorSet = ['#ffccbc', '#ffab91'];
                specialType = 'slippery';
                isSpecial = true;
            } else if (rand > 0.64) {
                colorSet = ['#9e9e9e', '#757575'];
                specialType = 'heavy';
                isSpecial = true;
            } else {
                colorSet = pancakeColors.normal;
            }

            const color = colorSet[Math.floor(Math.random() * colorSet.length)];
            const topping = toppings[Math.floor(Math.random() * toppings.length)];
            const sizeReduction = Math.min(40, stack.length * 2);
            
            let currentWidth = 120 - sizeReduction;
            if (specialType === 'giant') currentWidth = 180 - sizeReduction;
            if (specialType === 'tiny') currentWidth = (60 - sizeReduction) / 2; 
            
            const last = stack[stack.length - 1];
            activePancake = new Pancake(last.x, last.y - 20, color, topping, currentWidth);
            activePancake.isFlipping = false;
            activePancake.isSpecial = isSpecial;
            activePancake.specialType = specialType;
            activePancake.isSyrupy = Math.random() < 0.15;
            if (isBouncy) activePancake.bounceCount = 1;
        }

        function flipPancake() {
            if (!gameActive || activePancake.isFlipping) return;
            activePancake.isFlipping = true;
            activePancake.vy = -12 - Math.random() * 4;
            activePancake.vx = (Math.random() - 0.5) * 2;
            activePancake.vr = (Math.random() - 0.5) * 0.2;
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

        function checkLanding() {
                if (!gameActive || !activePancake || !activePancake.isFlipping) return;
        
            const last = stack[stack.length - 1];
            const visualLastX = last.x + currentTotalLean;
            
            if (activePancake.vy > 0 && activePancake.y >= last.y - 20) {
                const overlap = Math.min(activePancake.x + activePancake.width, visualLastX + last.width) - 
                                Math.max(activePancake.x, visualLastX);
                
                if (overlap > Math.min(activePancake.width, last.width) * 0.2) {
                    activePancake.isFlipping = false;
                    activePancake.vy = 0;
                    activePancake.vx = 0;
                    activePancake.rotation = 0;
                    
                    const centerDiff = (activePancake.x + activePancake.width/2) - (visualLastX + last.width/2);
                    currentTotalLean += centerDiff * 0.1;
                    activePancake.tiltOffset = centerDiff * 0.002;
                    
                    if (activePancake.isSyrupy) {
                        currentTotalLean *= 0.95; // Syrup stabilizes the stack!
                        showFloatingText("SYRUPY! 🍯 Stability!", activePancake.x + activePancake.width/2, activePancake.y - 40);
                        playSound(500, 'sine', 0.2);
                    }

                    if (activePancake.topping === '🧈') {
                        currentTotalLean *= 0.8; // Butter makes it slide less!
                        showFloatingText("BUTTERY! 🧈 Smooth!", activePancake.x + activePancake.width/2, activePancake.y - 40);
                        playSound(400, 'triangle', 0.2);
                    }

                    if (Math.abs(centerDiff) < 10) {
                        if (Math.abs(centerDiff) < 5) {
                            showPerfect();
                            combo += 2;
                            const comboBonus = 1 + (combo * 0.1);
                            score += Math.round(5 * scoreMult * comboBonus);
                            showFloatingText("SUPER PERFECT! 🌈✨", activePancake.x + activePancake.width/2, activePancake.y);
                            playSound(880, 'sine', 0.1);
                        } else {
                            showPerfect();
                            combo++;
                            const comboBonus = 1 + (combo * 0.1);
                            score += Math.round(2 * scoreMult * comboBonus);
                            showFloatingText("PERFECT! ✨", activePancake.x + activePancake.width/2, activePancake.y);
                            playSound(660, 'sine', 0.1);
                        }
                        shakeAmount = 5; 
                        if (combo > 1) {
                            comboEl.classList.add('show');
                            comboValEl.innerText = combo;
                        }
                        if (combo >= 10) {
                            document.body.classList.add('fever-mode');
                            feverText.classList.add('show');
                            
                            // Fever bonuses: more points, automatic stabilization
                            score += 1; 
                            currentTotalLean *= 0.99;
                            
                            if (combo > 20) {
                                feverText.innerText = "ULTRA FEVER!!! 🌈🥞";
                            } else {
                                feverText.innerText = "FEVER TIME! 🔥🥞";
                            }
                        } else {
                            document.body.classList.remove('fever-mode');
                            feverText.classList.remove('show');
                        }
                    } else {
                        combo = 0;
                        comboEl.classList.remove('show');
                        score += 1;
                        playSound(440, 'sine', 0.1);
                    }

                    // Ellie's Sneeze! 🤧
                    if (Math.random() < 0.05) {
                        const sneezeForce = (Math.random() - 0.5) * 10;
                        currentTotalLean += sneezeForce;
                        showFloatingText("ACHOO! 🤧", activePancake.x + activePancake.width/2, activePancake.y - 50);
                        playSound(200, 'sawtooth', 0.2);
                        shakeAmount = 10;
                    }

                    // Special Pancake Bonuses
                    if (activePancake.isSpecial) {
                        if (activePancake.specialType === 'gold') {
                            score += 5;
                            showFloatingText("GOLDEN! 🏆 +5", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(880, 'square', 0.2);
                        } else if (activePancake.specialType === 'rainbow') {
                            score += 3;
                            showFloatingText("RAINBOW! 🌈 +3", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(523.25, 'triangle', 0.2);
                        } else if (activePancake.specialType === 'glitter') {
                            score += 2;
                            currentTotalLean *= 0.5; // Glitter magic clears the lean!
                            showFloatingText("GLITTER! ✨ Magic Balance!", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(1000, 'sine', 0.1);
                            for(let i=0; i<20; i++) particles.push(new Particle(activePancake.x + activePancake.width/2, activePancake.y, '#ffffff'));
                        } else if (activePancake.specialType === 'powerup') {
                            const powerUpType = Math.random() < 0.5 ? 'SCORE' : 'SPEED';
                            if (powerUpType === 'SCORE') {
                                scoreMult = 3;
                                scoreMultTimer = 300;
                                showFloatingText("SCORE BOOST! x3 🚀", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            } else {
                                slideSpeedMult = 0.5;
                                slideSpeedMultTimer = 300;
                                showFloatingText("SLOW-MO! ⏳ Stability!", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            }
                            playSound(1200, 'sine', 0.2);
                        } else if (activePancake.specialType === 'bouncy') {
                            score += 2;
                            showFloatingText("BOUNCY! 🏀", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(400, 'sine', 0.1);
                        } else if (activePancake.specialType === 'sticky') {
                            currentTotalLean *= 0.3;
                            showFloatingText("STICKY! 🍯 Super Stable!", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(400, 'sine', 0.1);
                        } else if (activePancake.specialType === 'slippery') {
                            currentTotalLean += (Math.random() - 0.5) * 2;
                            L_S_T_B = 'SLIPPERY! ⛸️';
                            showFloatingText(L_S_T_B, activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(400, 'sine', 0.1);
                            shakeAmount = 5;
                        } else if (activePancake.specialType === 'heavy') {
                            currentTotalLean *= 0.5; // Heavy pancakes stabilize!
                            showFloatingText("HEAVY! ⚓ Stable!", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(200, 'sine', 0.2);
                        } else if (activePancake.specialType === 'tiny') {
                            score += 10;
                            showFloatingText("TINY! 🤏 +10", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(1200, 'sine', 0.1);
                        } else if (activePancake.specialType === 'wobbly') {
                            currentTotalLean += (Math.random() - 0.5) * 5;
                            showFloatingText("WOBBLY! 😵", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(300, 'sawtooth', 0.2);
                        } else if (activePancake.specialType === 'slippery') {
                            currentTotalLean += (Math.random() - 0.5) * 2;
                            showFloatingText("SLIPPERY! ⛸️", activePancake.x + activePancake.width/2, activePancake.y - 30);
                            playSound(400, 'sine', 0.1);
                            shakeAmount = 5;
                        }
                    }
                    activePancake.targetScaleY = 0.7;
                    setTimeout(() => activePancake.targetScaleY = 1, 100);
        
        }
        function showPerfect() {
        function showPerfect() {
            perfectText.style.opacity = '1';
            perfectText.style.transform = 'translate(-50%, -50%) scale(1.2)';
            setTimeout(() => {
                perfectText.style.opacity = '0';
                perfectText.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 600);
        }

        function createPopEffect(x, y, color) {
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(x, y, color));
            }
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(x, y, '#fbc02d', true));
            }
        }

        function gameOver() {
            gameActive = false;
            shakeAmount = 20;
            playSound(150, 'sawtooth', 0.5, 0.2);
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('pancakeFlipHighscore', highscore);
                highscoreEl.innerText = highscore;
                statusText.innerText = "NY REKORD! 🎉";
                playSound(523.25, 'sine', 0.5);
            } else {
                statusText.innerText = "Oi! Det falt! 🌸";
            }
            finalScoreEl.innerText = `Du stablet ${score} pannekaker!`;
            overlay.style.display = 'block';
            
            // Tip the tower over
            stack.forEach(p => {
                p.isFlipping = true;
                p.vy = 2;
                p.vx = currentTotalLean > 0 ? 2 : -2;
                p.vr = (Math.random() - 0.5) * 0.2;
            });
        }

        function resetGame() {
            score = 0;
            combo = 0;
            slideSpeed = 3;
            scoreEl.innerText = '0';
            comboEl.classList.remove('show');
            gameActive = true;
            overlay.style.display = 'none';
            particles = [];
            initStack();
            resumeAudio();
        }

        function update() {
            if (isPaused) return;
            
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            slideSpeed = 3 + (score * 0.1); // Increase speed as score goes up
            
            // Handle timers for power-ups
            if (scoreMultTimer > 0) {
                scoreMultTimer--;
                if (scoreMultTimer <= 0) scoreMult = 1;
            }
            if (slideSpeedMultTimer > 0) {
                slideSpeedMultTimer--;
                if (slideSpeedMultTimer <= 0) slideSpeedMult = 1;
            }
            slideSpeed *= slideSpeedMult;
            
            // Syrup Rain logic
            if (Math.random() < 0.001) {
                const syrupAlert = document.getElementById('syrup-alert');
                if (syrupAlert) {
                    syrupAlert.classList.add('show');
                    setTimeout(() => syrupAlert.classList.remove('show'), 3000);
                }
                // Make all current pancakes in stack syrupy for 5 seconds
                stack.forEach(p => p.isSyrupy = true);
                setTimeout(() => {
                    stack.forEach(p => p.isSyrupy = false);
                }, 5000);
            }
            
            // Wind logic
            if (windChangeTimer <= 0) {
                currentWind = (Math.random() - 0.5) * 1.5;
                windChangeTimer = 120 + Math.random() * 120;
            }
            windChangeTimer--;
            
            if (windIndicator) {
                const windOffset = currentWind * 50;
                windIndicator.style.transform = `translateX(calc(-50% + ${windOffset}px))`;
            }
            
            // Background Sparkles ✨
            if (Math.random() < 0.1) {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                const size = Math.random() * 5 + 2;
                sparkle.style.width = `${size}px`;
                sparkle.style.height = `${size}px`;
                sparkle.style.left = `${Math.random() * 100}vw`;
                sparkle.style.top = `${Math.random() * 100}vh`;
                sparkle.style.animationDuration = `${Math.random() * 3 + 2}s`;
                sparkle.style.opacity = Math.random() * 0.5 + 0.3;
                document.body.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 5000);
            }
            
            if (shakeAmount > 0) {
                ctx.save();
                ctx.translate((Math.random()-0.5)*shakeAmount, (Math.random()-0.5)*shakeAmount);
                shakeAmount *= 0.9;
                if (shakeAmount < 0.1) shakeAmount = 0;
            }
            
            let currentTilt = 0;
            stack.forEach((p, index) => {
                p.update();
                currentTilt += p.tiltOffset;
                p.draw(currentTilt, index);
            });
            
            if (activePancake) {
                activePancake.update();
                let topTilt = 0;
                stack.forEach(p => topTilt += p.tiltOffset);
                activePancake.draw(topTilt, stack.length - 1);
                checkLanding();
            }
            
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) particles.splice(i, 1);
            }
            
            if (shakeAmount > 0) ctx.restore();
            requestAnimationFrame(update);
        }

        window.addEventListener('mousedown', flipPancake);
        window.addEventListener('touchstart', (e) => {
            flipPancake();
            e.preventDefault();
        });
        initStack();
        update();

        function startGame() {
            document.getElementById('how-to-play').style.display = 'none';
        gameActive = true;
        resumeAudio();
    }

