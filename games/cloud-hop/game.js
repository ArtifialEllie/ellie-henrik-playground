const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');
        const highscoreElement = document.getElementById('highscore');
        const goldElement = document.getElementById('gold-display');
        const comboElement = document.getElementById('combo-ui');
        const overlay = document.getElementById('overlay');
        const windIndicator = document.getElementById('wind-indicator');
        const startBtn = document.getElementById('start-btn');
        const shopBtn = document.getElementById('shop-btn');
        const closeShopBtn = document.getElementById('close-shop-btn');
        const shopOverlay = document.getElementById('shop-overlay');
        const shopGrid = document.getElementById('shop-grid');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayText = document.getElementById('overlay-text');

        canvas.width = 400;
        canvas.height = 600;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
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

        const GRAVITY = 0.4;
        const JUMP_FORCE = -12;
        const SPRING_JUMP_FORCE = -20;
        const SUPER_JUMP_FORCE = -30;
        const CLOUD_WIDTH = 70;
        const CLOUD_HEIGHT = 30;
        const PLAYER_SIZE = 35;
        const STAR_SIZE = 20;
        const STORM_CLOUD_WIDTH = 80;

        let currentSkin = localStorage.getItem('cloudHopSkin') || '#ff69b4';
        let player = {
            x: canvas.width / 2 - PLAYER_SIZE / 2,
            y: canvas.height - 100,
            vx: 0,
            vy: 0,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            skin: currentSkin,
            rotation: 0,
            scaleY: 1,
            hasShield: false
        };

        let clouds = [];
        let particles = [];
        let windParticles = [];
        let backgroundDecor = [];
        let stars = [];
        let score = 0;
        let gold = 0;
        let highscore = parseInt(localStorage.getItem('cloudHopHighscore')) || 0;
            let combo = 0;
            let comboTimer = 0;
            let gameActive = false;
            let isFeverMode = false;
            let feverTimer = 0;
            let cameraY = 0;
            let currentTheme = 0;
            let keys = {};
            let windForce = 0;
            let windTimer = 0;
        let screenShake = 0;
            let isMirrorWorld = false;
            let mirrorWorldTimer = 0;
            
        highscoreElement.innerText = `Beste: ${highscore} 🏆`;

        window.addEventListener('keydown', e => keys[e.code] = true);
        window.addEventListener('keyup', e => keys[e.code] = false);

        function init() {
            player.x = canvas.width / 2 - PLAYER_SIZE / 2;
            player.y = canvas.height - 100;
            player.vx = 0;
            player.vy = JUMP_FORCE;
            player.skin = currentSkin;
            player.trail = [];
            player.rotation = 0;
            player.hasShield = false;
            score = 0;
            gold = parseInt(localStorage.getItem('cloudHopGold')) || 0;
            combo = 0;
            comboTimer = 0;
            cameraY = 0;
            isFeverMode = false;
            feverTimer = 0;
            currentTheme = 0;
            clouds = [];
            particles = [];
            screenShake = 0;
            isMirrorWorld = false;
            stars = [];
            
            player.trail = [];
            backgroundDecor = [];
            for(let i=0; i<20; i++) {
                backgroundDecor.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 5 + 2,
                    type: Math.random() > 0.5 ? '⭐' : '🌸',
                    speed: Math.random() * 0.5 + 0.2
                });
            }
        
            clouds.push({
                x: canvas.width / 2 - CLOUD_WIDTH / 2,
                y: canvas.height - 50,
                width: CLOUD_WIDTH,
                height: CLOUD_HEIGHT,
                type: 'normal',
                color: '#ffffff',
                pulse: 0
            });
        
            for (let i = 0; i < 15; i++) {
                spawnCloud(canvas.height - i * 80);
            }
            
            scoreElement.innerText = score;
            goldElement.innerText = `✨ ${gold}`;
            comboElement.classList.remove('show');
        }

        function spawnCloud(y) {
            const types = ['normal', 'normal', 'normal', 'spring', 'gold', 'storm', 'moving', 'fragile', 'rainbow', 'shield', 'vortex'];
            const type = types[Math.floor(Math.random() * types.length)];
            let color;
            let vx = 0;
            let isFragile = false;
            
            switch(type) {
                case 'spring': color = '#ffb7ce'; break;
                case 'gold': color = '#ffd700'; break;
                case 'storm': color = '#a9a9a9'; break;
                case 'moving': 
                    color = '#b2e2f2'; 
                    vx = (Math.random() - 0.5) * 3; 
                    break;
                case 'fragile': 
                    color = '#fdfd96'; 
                    isFragile = true; 
                    break;
                case 'rainbow':
                    color = 'rainbow';
                    break;
                case 'shield':
                    color = '#b2e2f2';
                    break;
                default: 
                    if (type === 'vortex') {
                        color = '#d1b3ff'; 
                    } else {
                    const normColors = ['#ffffff', '#f0fff0', '#e6e6fa', '#fff0f5'];
                    color = normColors[Math.floor(Math.random() * normColors.length)];
                    }
   
            clouds.push({
                x: Math.random() * (canvas.width - CLOUD_WIDTH),
                y: y,
                width: CLOUD_WIDTH,
                height: CLOUD_HEIGHT,
                type: type,
                color: color,
                pulse: Math.random() * Math.PI * 2,
                vx: vx,
                isFragile: isFragile,
                life: 1.0
            });
        }

        function spawnStar(y) {
            stars.push({
                x: Math.random() * (canvas.width - STAR_SIZE),
                y: y,
                size: STAR_SIZE,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.1
            });
        }

        function createParticles(x, y, color) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 1.0,
                    color: color,
                    size: Math.random() * 4 + 2
                });
            }
        }

        function showFloatingText(text, x, y) {
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.innerText = text;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            document.getElementById('game-container').appendChild(el);
            setTimeout(() => el.remove(), 800);
        }

        function update() {
            if (!gameActive) return;
    
            // Wind logic
            const currentThemeColors = [
                ['var(--bg-top)', 'var(--bg-bottom)'],
                ['var(--bg-sunset-top)', 'var(--bg-sunset-bottom)'],
                ['var(--bg-twilight-top)', 'var(--bg-twilight-bottom)'],
                ['var(--bg-space-top)', 'var(--bg-space-bottom)']
            ];
            const colors = currentThemeColors[currentTheme];
            const direction = isMirrorWorld ? 'to top' : 'to bottom';
            const dynamicBg = `linear-gradient(${direction}, ${colors[0]}, ${colors[1]})`;
            document.documentElement.style.setProperty('--current-bg', dynamicBg);
            document.getElementById('game-container').style.setProperty('--game-bg', dynamicBg);

            if (mirrorWorldTimer > 0) {
                mirrorWorldTimer--;
                if (mirrorWorldTimer <= 0) {
                    isMirrorWorld = false;
                    screenShake = 15;
                    showFloatingText("Mirror World Over! ✨", canvas.width/2, canvas.height/2);
                }
            } else if (Math.random() < 0.0005 && score > 500) {
                isMirrorWorld = true;
                mirrorWorldTimer = 600;
                screenShake = 20;
                playSound(600, 'sine', 0.5);
                showFloatingText("MIRROR WORLD! 🪞✨", canvas.width/2, canvas.height/2);
            }

            const currentVxMultiplier = isMirrorWorld ? -1 : 1;

            if (windTimer > 0) {
                windTimer--;
                player.vx += windForce * currentVxMultiplier;
                if (Math.random() < 0.3) {
                    windParticles.push({
                        x: windForce > 0 ? -20 : canvas.width + 20,
                        y: Math.random() * canvas.height + cameraY,
                        vx: windForce * 50 + (Math.random() * 2),
                        vy: (Math.random() - 0.5) * 1,
                        life: 1.0,
                        size: Math.random() * 5 + 2
                    });
                }
            }

            if (windTimer > 0) {
                windIndicator.style.opacity = 1;
                windIndicator.innerText = windForce > 0 ? '💨 Wind blowing Right! ➡️' : '💨 Wind blowing Left! ⬅️';
            } else if (Math.random() < 0.002) {
                windForce = (Math.random() - 0.5) * 0.2;
                windTimer = 200 + Math.random() * 300;
                if (Math.abs(windForce) < 0.05) windForce = 0;
            } else {
                windIndicator.style.opacity = 0;
            }

            // Theme update logic
            const themeIndex = Math.min(3, Math.floor(Math.abs(cameraY) / 3000));
            if (themeIndex !== currentTheme) {
                currentTheme = themeIndex;
            }
  
            if (keys['ArrowLeft'] || keys['KeyA']) {
                player.vx = -6 * currentVxMultiplier;
                player.rotation *= 0.8;
            }
            if (keys['ArrowRight'] || keys['KeyD']) {
                player.vx = 6 * currentVxMultiplier;
                player.rotation *= 0.8;
            }

            // Update trail
            player.trail.push({ x: player.x + player.width/2, y: player.y + player.height/2 });
            if (player.trail.length > 10) player.trail.shift();
            player.vx *= 0.9;

            player.x += player.vx;
            player.vy += GRAVITY;
            player.y += player.vy;

            if (player.x + player.width < 0) player.x = canvas.width;
            if (player.x > canvas.width) player.x = -player.width;

            if (player.y < canvas.height / 2 + cameraY) {
                cameraY = player.y - canvas.height / 2;
            }

            if (comboTimer > 0) {
                comboTimer--;
                if (comboTimer <= 0) {
                    combo = 0;
                    comboElement.classList.remove('show');
                }
            }

            if (player.vy > 0) {
                clouds.forEach(cloud => {
                    if (player.x + player.width > cloud.x && 
                        player.x < cloud.x + cloud.width && 
                        player.y + player.height > cloud.y && 
                        player.y + player.height < cloud.y + cloud.height + player.vy) {
                        
                        // Perfect Jump Logic
                        const cloudCenterX = cloud.x + cloud.width / 2;
                        const playerCenterX = player.x + player.width / 2;
                        const distFromCenter = Math.abs(cloudCenterX - playerCenterX);
                        const isPerfect = distFromCenter < 15;

                        if (cloud.type === 'spring') {
                            player.vy = isPerfect ? SUPER_JUMP_FORCE : SPRING_JUMP_FORCE;
                            playSound(isPerfect ? 800 : 600, 'sine', 0.2);
                            showFloatingText(isPerfect ? "PERFECT SPRING! 🚀✨" : "SPRING! 🚀", player.x + player.width/2, player.y);
                        } else if (cloud.type === 'rainbow') {
                            player.vy = isPerfect ? SUPER_JUMP_FORCE * 1.2 : SUPER_JUMP_FORCE;
                            const rainbowBonus = isPerfect ? 400 : 200;
                            gold += rainbowBonus;
                            playSound(880, 'sine', 0.3);
                            showFloatingText(isPerfect ? `PERFECT RAINBOW! 🌈✨ +${rainbowBonus}` : `RAINBOW BOOST! 🌈✨ +${rainbowBonus}`, player.x + player.width/2, player.y);
                            goldElement.innerText = `✨ ${gold}`;
                            localStorage.setItem('cloudHopGold', gold);
                        } else if (cloud.type === 'shield') {
                            player.hasShield = true;
                            playSound(600, 'sine', 0.3);
                           showFloatingText("SHIELD ACTIVATED! 🛡️✨", player.x + player.width/2, player.y);
                           createParticles(player.x + player.width/2, player.y + player.height, '#b2e2f2');
                       } else if (cloud.type === 'vortex') {
                            player.rotation += 2.0;
                            player.vx += (Math.random() - 0.5) * 10;
                            playSound(400, 'sine', 0.1);
                            createParticles(player.x + player.width/2, player.y + player.height, '#d1b3ff');
                            showFloatingText("VORTEX! 🌪️✨", player.x + player.width/2, player.y);
                            player.vy = JUMP_FORCE * 0.8;
                        if (cloud.type === 'storm') {
                           if (player.hasShield) {
                               player.hasShield = false;
                               playSound(300, 'square', 0.3);
                                showFloatingText("SHIELD BROKE! 🛡️💥", player.x + player.width/2, player.y);
                                player.vy = JUMP_FORCE;
                            } else {
                                player.vy = JUMP_FORCE * 0.5;
                                screenShake = 10;
                                playSound(150, 'sawtooth', 0.2);
                                showFloatingText("OUCH! ⚡", player.x + player.width/2, player.y);
                                combo = 0;
                                comboElement.classList.remove('show');
                                if (Math.random() < 0.3) {
                                    showFloatingText("SNEEZED! 🤧", player.x + player.width/2, player.y);
                                    player.vx += (Math.random() - 0.5) * 10;
                                }
                            }
                            }
                        } else if (cloud.type === 'fragile') {
                            player.vy = isPerfect ? JUMP_FORCE * 1.2 : JUMP_FORCE;
                            playSound(400, 'sine', 0.1);
                            cloud.life = 0.5; // Start disappearing
                            showFloatingText(isPerfect ? "PERFECT CRACK! ❄️✨" : "CRACK! ❄️", player.x + player.width/2, player.y);
                        } else {
                            player.vy = isPerfect ? JUMP_FORCE * 1.2 : JUMP_FORCE;
                            playSound(isPerfect ? 600 : 400 + Math.random() * 200, 'sine', 0.1);
                        if (isPerfect) {
                            showFloatingText("PERFECT! ✨", player.x + player.width/2, player.y);
                            gold += 10;
                            goldElement.innerText = `✨ ${gold}`;
                            localStorage.setItem('cloudHopGold', gold);
                            
                            const flash = document.getElementById('perfect-flash');
                            flash.style.animation = 'none';
                            flash.offsetHeight; // trigger reflow
                            flash.style.animation = 'flash-anim 0.3s ease-out';
                        }
                        }

                        if (cloud.type === 'gold') {
                            const goldGain = isPerfect ? 100 : 50;
                            gold += goldGain;
                            playSound(880, 'square', 0.2);
                            showFloatingText(isPerfect ? `PERFECT GOLD! ✨ +${goldGain}` : `+${goldGain} GOLD! ✨`, player.x + player.width/2, player.y);
                            goldElement.innerText = `✨ ${gold}`;
                            localStorage.setItem('cloudHopGold', gold);
                        }

                        screenShake = isPerfect ? 5 : 2;
                        const particleColor = isPerfect ? '#ffd700' : cloud.color;
                        createParticles(player.x + player.width/2, player.y + player.height, particleColor);
                        if (isPerfect) {
                            for(let i=0; i<5; i++) {
                                particles.push({
                                    x: player.x + player.width/2,
                                    y: player.y + player.height,
                                    vx: (Math.random() - 0.5) * 10,
                                    vy: (Math.random() - 0.5) * 10,
                                    life: 1.0,
                                    color: '#fff',
                                    size: Math.random() * 6 + 2
                                });
                            }
                        }
                        
                        combo++;
                        comboTimer = 60;
                        if (combo > 1) {
                            comboElement.classList.add('show');
                            comboElement.innerText = `Combo x${combo} ✨`;
                        }

                        if (combo >= 10 && !isFeverMode) {
                            activateFeverMode();
                        }

                        let currentHeight = Math.floor(Math.abs(player.y - (canvas.height - 100)) / 10);
                        if (currentHeight > score) {
                            score = currentHeight;
                            scoreElement.innerText = score;
                        }

                        // Achievement Unlocks
                        if (score >= 1000 && !localStorage.getItem('cloudHopSkin_#ffffff')) {
                            localStorage.setItem('cloudHopSkin_#ffffff', 'true');
                            showFloatingText("ACHIEVEMENT: Pure Cloud Unlocked! ☁️", player.x, player.y);
                        }
                        if (score >= 2000 && !localStorage.getItem('cloudHopSkin_diamond')) {
                            localStorage.setItem('cloudHopSkin_diamond', 'true');
                            showFloatingText("ACHIEVEMENT: Diamond Unlocked! 💎", player.x, player.y);
                        }
                    }
                });
            }

            clouds.forEach(cloud => {
                if (cloud.vx) {
                    cloud.x += cloud.vx;
                    if (cloud.x < 0 || cloud.x + cloud.width > canvas.width) {
                        cloud.vx *= -1;
                    }
                }
                if (cloud.life < 1.0) {
                    cloud.life -= 0.02;
                }
            });

            // Star collision
            for (let i = stars.length - 1; i >= 0; i--) {
                const star = stars[i];
                if (player.x < star.x + star.size && 
                    player.x + player.width > star.x && 
                    player.y < star.y + star.size && 
                    player.y + player.height > star.y) {
                    player.vy = SUPER_JUMP_FORCE;
                    playSound(880, 'sine', 0.3);
                    showFloatingText("SUPER JUMP! 🌟", player.x + player.width/2, player.y);
                    createParticles(star.x + star.size/2, star.y + star.size/2, '#ffd700');
                    stars.splice(i, 1);
                }
            }

            clouds = clouds.filter(cloud => cloud.y < cameraY + canvas.height + 100 && cloud.life > 0);
            while (clouds.length < 20) {
                const highestCloudY = Math.min(...clouds.map(c => c.y));
                spawnCloud(highestCloudY - 80);
            }

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
            });
            particles = particles.filter(p => p.life > 0);

            // Spawn stars occasionally
            if (Math.random() < 0.005) {
                spawnStar(cameraY - 100);
            }

            if (screenShake > 0) screenShake *= 0.9;
            
            if (player.y > cameraY + canvas.height) {
                gameOver();
            }

            windParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
            });
            windParticles = windParticles.filter(p => p.life > 0);

            if (isFeverMode) {
                feverTimer--;
                if (feverTimer <= 0) {
                    isFeverMode = false;
                    document.getElementById('fever-msg')?.remove();
                }
            }
        }

        function activateFeverMode() {
            isFeverMode = true;
            feverTimer = 300;
            const msg = document.createElement('div');
            msg.id = 'fever-msg';
            msg.className = 'fever-text';
            msg.innerText = 'FEVER MODE! ✨';
            document.getElementById('game-container').appendChild(msg);
            playSound(880, 'sine', 0.3);
            setTimeout(() => playSound(1100, 'sine', 0.3), 100);
        }

        function gameOver() {
            gameActive = false;
            playSound(100, 'sawtooth', 0.5);
            
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('cloudHopHighscore', highscore);
                highscoreElement.innerText = `Beste: ${highscore} 🏆`;
            }
            
            overlay.classList.remove('hidden');
            overlayTitle.innerText = "Oh No! 🌸";
            overlayText.innerText = `You hopped ${score} meters high and collected ${gold} gold! ✨`;
            startBtn.innerText = "Try Again! ✨";
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            
            if (screenShake > 0) {
                ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
            }
            
            ctx.translate(0, -cameraY);
            
            backgroundDecor.forEach(dec => {
                ctx.globalAlpha = 0.4;
                ctx.font = `${dec.size * 2}px Arial`;
                ctx.fillText(dec.type, dec.x, dec.y - cameraY);
                dec.y += dec.speed;
                if (dec.y - cameraY > canvas.height) {
                    dec.y = cameraY - 20;
                    dec.x = Math.random() * canvas.width;
                }
                ctx.globalAlpha = 1.0;
            });
            
            // Shield Aura Effect
            if (player.hasShield) {
                const shieldX = player.x + player.width/2;
                const shieldY = player.y + player.height/2 - cameraY;
                const size = player.width * 1.5;
                
                ctx.beginPath();
                ctx.arc(shieldX, shieldY, size/2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(178, 226, 242, 0.8)';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(shieldX, shieldY, size/2 + Math.sin(Date.now()/200)*5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(178, 226, 242, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            windParticles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
            
            clouds.forEach(cloud => {
                cloud.pulse += 0.05;
                const pulseOffset = Math.sin(cloud.pulse) * 3;
                
                ctx.globalAlpha = cloud.life !== undefined ? cloud.life : 1.0;
                ctx.fillStyle = cloud.color;
                
                ctx.beginPath();
                ctx.arc(cloud.x + 10, cloud.y + 18 + pulseOffset, 15, 0, Math.PI * 2);
                ctx.arc(cloud.x + 25, cloud.y + 10 + pulseOffset, 18, 0, Math.PI * 2);
                ctx.arc(cloud.x + 40, cloud.y + 8 + pulseOffset, 20, 0, Math.PI * 2);
                ctx.arc(cloud.x + 55, cloud.y + 10 + pulseOffset, 18, 0, Math.PI * 2);
                ctx.arc(cloud.x + 70, cloud.y + 18 + pulseOffset, 15, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(player.rotation);
            
            if (isFeverMode) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'gold';
            }
            
            let stretch = 1 + Math.abs(player.vy) * 0.02;
            if (player.vy > 0) stretch = 1 - Math.abs(player.vy) * 0.01;
            
            ctx.scale(1/stretch, stretch);
            ctx.fillStyle = getPlayerColor();
            
            // Ellie Body
            ctx.beginPath();
            ctx.arc(0, 0, player.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Blush
            ctx.fillStyle = '#ffc1e3';
            ctx.beginPath();
            ctx.arc(-10, 2, 4, 0, Math.PI * 2);
            ctx.arc(10, 2, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-6, -4, 5, 0, Math.PI * 2);
            ctx.arc(6, -4, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(-6 + (player.vx * 0.5), -4, 2, 0, Math.PI * 2);
            ctx.arc(6 + (player.vx * 0.5), -4, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Draw trail
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 183, 206, 0.5)';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            player.trail.forEach((p, i) => {
                const tx = p.x;
                const ty = p.y - cameraY;
                if (i === 0) ctx.moveTo(tx, ty);
                else ctx.lineTo(tx, ty);
            });
            ctx.stroke();
            
            // Draw stars
            stars.forEach(star => {
                star.rotation += star.rotSpeed;
                ctx.save();
                ctx.translate(star.x + star.size/2, star.y - cameraY + star.size/2);
                ctx.rotate(star.rotation);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                for(let i=0; i<5; i++) {
                    ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*star.size/2, Math.sin((18+i*72)*Math.PI/180)*star.size/2);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });
            
            requestAnimationFrame(gameLoop);
        }

        function gameLoop() {
            update();
            draw();
        }

        const skins = [
            { color: '#ff69b4', name: 'Classic Pink', cost: 0 },
            { color: '#b2e2f2', name: 'Sky Blue', cost: 500 },
            { color: '#d1b3ff', name: 'Lavender', cost: 1000 },
            { color: '#fff9b1', name: 'Sunshine', cost: 2000 },
            { color: '#ff7e5f', name: 'Sunset', cost: 5000 },
            { color: '#6a11cb', name: 'Midnight', cost: 10000 },
            { color: '#ffffff', name: 'Pure Cloud', cost: 20000 },
            { color: 'rainbow', name: 'Rainbow', cost: 50000 },
            { color: 'diamond', name: 'Diamond', cost: 100000 },
        ];
        
        function renderShop() {
            shopGrid.innerHTML = '';
            skins.forEach(skin => {
                const isSelected = player.skin === skin.color;
                const canAfford = gold >= skin.cost;
                const isOwned = localStorage.getItem(`cloudHopSkin_${skin.color}`) === 'true' || skin.cost === 0;
                
                const item = document.createElement('div');
                item.className = `skin-item ${isSelected ? 'selected' : ''}`;
                item.innerHTML = `
                    <div class="skin-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : (skin.color === 'diamond' ? 'linear-gradient(135deg, #b9f2ff, #ffffff)' : skin.color)}"></div>
                    <div style="font-size: 0.9rem; font-weight: bold;">${skin.name}</div>
                    <div class="skin-cost">${isOwned ? 'Owned' : '✨ ' + skin.cost}</div>
                `;
                
                item.onclick = () => {
                    if (isOwned) {
                        player.skin = skin.color;
                        currentSkin = player.skin;
                        localStorage.setItem('cloudHopSkin', currentSkin);
                        renderShop();
                        playSound(600, 'sine', 0.1);
                    } else if (canAfford) {
                        gold -= skin.cost;
                        localStorage.setItem('cloudHopGold', gold);
                        goldElement.innerText = `✨ ${gold}`;
                        localStorage.setItem(`cloudHopSkin_${skin.color}`, 'true');
                        player.skin = skin.color;
                        currentSkin = player.skin;
                        localStorage.setItem('cloudHopSkin', currentSkin);
                        renderShop();
                        playSound(880, 'sine', 0.2);
                    } else {
                        playSound(200, 'sawtooth', 0.1);
                    }
                };
                shopGrid.appendChild(item);
            });
        }

        // Handle Special Skins
        function getPlayerColor() {
            if (player.skin === 'rainbow') {
                return `hsl(${Date.now() / 10 % 360}, 70%, 70%)`;
            }
            if (player.skin === 'diamond') {
                const sparkles = Math.random() > 0.9 ? '#fff' : '#b9f2ff';
                return sparkles;
            }
            return player.skin;
        }
        
        
        shopBtn.onclick = () => {
            gold = parseInt(localStorage.getItem('cloudHopGold')) || 0;
            goldElement.innerText = `✨ ${gold}`;
            renderShop();
            shopOverlay.classList.remove('hidden');
        };
        
        closeShopBtn.onclick = () => {
            shopOverlay.classList.add('hidden');
        };
        
        startBtn.addEventListener('click', () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            overlay.classList.add('hidden');
            init();
            gameActive = true;
        });

        draw();
    </script>
</body>
