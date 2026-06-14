
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('score');
        const highscoreEl = document.getElementById('highscore');
        const overlay = document.getElementById('overlay');
        const statusText = document.getElementById('status-text');
        const finalScoreEl = document.getElementById('final-score');
        const magnetAlert = document.getElementById('magnet-alert');
        const shieldAlert = document.getElementById('shield-alert');
        const superBowlAlert = document.getElementById('superbowl-alert');
        const comboContainer = document.getElementById('combo-container');
        const comboBar = document.getElementById('combo-bar');
        const comboText = document.getElementById('combo-text');

        let score = 0;
        let combo = 0;
        let comboTimer = 0;
        let highscore = localStorage.getItem('cosmicCupcakeHighscore') || 0;
        let gameActive = false;
        let canvasWidth, canvasHeight;
        let magnetActive = false;
        let magnetTimer = 0;
        let shieldActive = false;
        let slowMoActive = false;
        let slowMoTimer = 0;
        let screenShake = 0;
        let playerScale = 1;
        let superBowlActive = false;
        let superBowlTimer = 0;

        highscoreEl.innerText = highscore;

        const cupcakeColors = ['#ffb7ce', '#b2e2f2', '#d1b3ff', '#fff9b1', '#a5d6a7', '#ffccf9'];
        const starColors = ['#ffffff', '#ffd700', '#ff69b4', '#b2e2f2'];

        function resize() {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        let player = {
            x: canvasWidth / 2,
            y: canvasHeight - 80,
            width: 100,
            height: 60,
            color: '#ff69b4'
        };

let items = [];
let particles = [];
let stars = [];
let nebulae = [];

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
        function playSound(freq, type, duration) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        }

        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                size: Math.random() * 2,
                opacity: Math.random(),
                blinkSpeed: 0.01 + Math.random() * 0.02
            });
        }

        for (let i = 0; i < 5; i++) {
            nebulae.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                radius: 200 + Math.random() * 300,
                color: Math.random() > 0.5 ? 'rgba(90, 50, 168, 0.2)' : 'rgba(178, 226, 242, 0.1)',
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
            });
        }

        class Item {
            constructor() {
                this.radius = 20;
                this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
                this.y = -this.radius;
                this.baseSpeed = 2 + Math.random() * 3 + (score / 50);
                this.speed = this.baseSpeed;
                
                const rand = Math.random();
                if (rand > 0.95) {
                    this.type = 'gold';
                    this.color = '#ffd700';
                    this.emoji = '🌟';
                } else if (rand > 0.90) {
                    this.type = 'shield';
                    this.color = '#a2ffdf';
                    this.emoji = '🛡️';
                } else if (rand > 0.85) {
                    this.type = 'slowmo';
                    this.color = '#b2e2f2';
                    this.emoji = '❄️';
                } else if (rand < 0.15) {
                    this.type = 'rock';
                    this.color = '#888';
                    this.emoji = '🌑';
                } else {
                    this.type = 'normal';
                    this.color = cupcakeColors[Math.floor(Math.random() * cupcakeColors.length)];
                    this.emoji = '🧁';
                }
            }

            update() {
                if (magnetActive) {
                    const dx = player.x - this.x;
                    this.x += dx * 0.05;
                }
                this.speed = slowMoActive ? this.baseSpeed * 0.4 : this.baseSpeed;
                this.y += this.speed;
            }

            draw() {
                ctx.save();
                ctx.font = `${this.radius * 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (this.type === 'gold') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'gold';
                }
                ctx.fillText(this.emoji, this.x, this.y);
                ctx.restore();
            }
        }

        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.radius = Math.random() * 3 + 1;
                this.life = 1.0;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.02;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life;
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.closePath();
            }
        }

        function spawnItem() {
            if (!gameActive) return;
            items.push(new Item());
            setTimeout(spawnItem, Math.max(400, 1000 - (score * 5)));
        }

        function createBurst(x, y, color) {
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        function handleMove(e) {
            const mouseX = (e.clientX || (e.touches && e.touches[0].clientX));
            if (mouseX) {
                player.x = mouseX;
            }
        }

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });

        function update() {
            if (!gameActive) return;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            if (screenShake > 0) {
                ctx.save();
                ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
                screenShake *= 0.9;
                if (screenShake < 0.1) screenShake = 0;
            }

            nebulae.forEach(n => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < -n.radius) n.x = canvasWidth + n.radius;
                if (n.x > canvasWidth + n.radius) n.x = -n.radius;
                if (n.y < -n.radius) n.y = canvasHeight + n.radius;
                if (n.y > canvasHeight + n.radius) n.y = -n.radius;
                
                let grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
                grad.addColorStop(0, n.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            stars.forEach(s => {
                s.opacity += s.blinkSpeed;
                if (s.opacity > 1 || s.opacity < 0) s.blinkSpeed *= -1;
                ctx.globalAlpha = Math.abs(s.opacity);
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            if (magnetActive) {
                magnetTimer--;
                if (magnetTimer <= 0) {
                    magnetActive = false;
                    magnetAlert.style.display = 'none';
                }
            }

            if (comboTimer > 0) {
                comboTimer--;
                if (comboTimer <= 0) {
                    combo = 0;
                    comboText.innerText = '';
                    comboBar.style.width = '0%';
                }
            }

            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.scale(playerScale, playerScale);
            
            const playerGrad = ctx.createLinearGradient(0, 0, 0, player.height);
            playerGrad.addColorStop(0, player.color);
            playerGrad.addColorStop(1, '#c2185b');
            ctx.fillStyle = playerGrad;

            // Draw a cute bow on the bowl! 🎀
            ctx.fillStyle = '#ffb7ce';
            ctx.beginPath();
            ctx.arc(-player.width/2, 0, 8, 0, Math.PI * 2);
            ctx.arc(player.width/2, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 0, player.width/2, 0, Math.PI, false);
            ctx.fill();
            
            ctx.strokeStyle = superBowlActive ? 'gold' : 'white';
            ctx.lineWidth = 4;
            if (superBowlActive) {
                ctx.lineWidth = 8;
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'gold';
            }
            ctx.beginPath();
            ctx.ellipse(0, 0, player.width/2, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-15, 5, 8, 0, Math.PI * 2);
            ctx.arc(15, 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.arc(0, 5, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();

            if (screenShake > 0) ctx.restore();

            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                item.update();
                item.draw();

                const dx = item.x - player.x;
                const dy = item.y - player.y;
                const dist = Math.hypot(dx, dy);

                const catchRadius = superBowlActive ? 100 : 50;
                if (dist < catchRadius) {
                    if (item.type === 'normal') {
                        combo++;
                        comboTimer = 60;
                        const multiplier = Math.floor(combo / 5) + 1;
                        score += multiplier;
                        
                        comboText.innerText = `COMBO x${multiplier}! ✨`;
                        if (multiplier > 2) {
                            const crit = document.createElement('div');
                            crit.className = 'crit-text';
                            crit.innerText = `+${multiplier} ✨`;
                            crit.style.left = item.x + 'px';
                            crit.style.top = item.y + 'px';
                            document.body.appendChild(crit);
                            setTimeout(() => crit.remove(), 600);
                        }
                        const progress = Math.min(100, (combo % 5) * 20);
                        comboBar.style.width = `${progress}%`;
                        
                        playSound(440 + (combo * 20), 'sine', 0.1);
                        createBurst(item.x, item.y, item.color);
                        playerScale = 1.2;
                        if (combo % 10 === 0 && combo > 0) {
                            activateSuperBowl();
                        }
                    } else if (item.type === 'gold') {
                        score += 5;
                        activateMagnet();
                        playSound(880, 'square', 0.2);
                        createBurst(item.x, item.y, 'gold');
                        playerScale = 1.3;
                    } else if (item.type === 'shield') {
                        shieldActive = true;
                        shieldAlert.style.display = 'block';
                        playSound(600, 'triangle', 0.3);
                        createBurst(item.x, item.y, item.color);
                        playerScale = 1.2;
                    } else if (item.type === 'slowmo') {
                        activateSlowMo();
                        playSound(300, 'sine', 0.4);
                        createBurst(item.x, item.y, item.color);
                        playerScale = 1.2;
                    } else if (item.type === 'rock') {
                        if (shieldActive) {
                            shieldActive = false;
                            shieldAlert.style.display = 'none';
                            playSound(200, 'sine', 0.2);
                            createBurst(item.x, item.y, 'white');
                            playerScale = 1.2;
                        } else {
                            screenShake = 20;
                            playSound(100, 'sawtooth', 0.5);
                            gameOver();
                        }
                    }
                    scoreEl.innerText = score;
                    items.splice(i, 1);
                    continue;
                }

                if (item.y > canvasHeight + item.radius) {
                    items.splice(i, 1);
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }

            playerScale += (1 - playerScale) * 0.2;
            if (superBowlActive) {
                superBowlTimer--;
                if (superBowlTimer <= 0) {
                    superBowlActive = false;
                    superBowlAlert.style.display = 'none';
                }
            }

            requestAnimationFrame(update);
        }

        function activateMagnet() {
            magnetActive = true;
            magnetTimer = 300;
            magnetAlert.style.display = 'block';
        }

        function activateSlowMo() {
            slowMoActive = true;
            slowMoTimer = 300; 
            setTimeout(() => { slowMoActive = false; }, 5000);
        }

        function activateSuperBowl() {
            superBowlActive = true;
            superBowlTimer = 300; 
            superBowlAlert.style.display = 'block';
            playSound(1000, 'sine', 0.5);
            createBurst(player.x, player.y, 'white');
        }

        function gameOver() {
            gameActive = false;
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('cosmicCupcakeHighscore', highscore);
                highscoreEl.innerText = highscore;
                statusText.innerText = "NY REKORD! 🎉";
            } else {
                statusText.innerText = "Kosmisk Kaos! 🌌";
            }
            finalScoreEl.innerText = `Du fanget ${score} kaker!`;
            overlay.style.display = 'block';
        }

        function resetGame() {
            score = 0;
            combo = 0;
            comboTimer = 0;
            comboText.innerText = '';
            comboBar.style.width = '0%';
            scoreEl.innerText = '0';
            items = [];
            particles = [];
            gameActive = false;
            overlay.style.display = 'none';
            document.getElementById('start-overlay').style.display = 'flex';
        }

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('start-overlay').style.display = 'none';
            gameActive = true;
            spawnItem();
        });

        requestAnimationFrame(update);

