const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const highscoreEl = document.getElementById('highscore');
const comboUi = document.getElementById('combo-ui');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status-text');
const finalScoreEl = document.getElementById('final-score');
const startOverlay = document.getElementById('start-overlay');
const magnetAlert = document.getElementById('magnet-alert');
const rainbowAlert = document.getElementById('rainbow-alert');
const feverAlert = document.getElementById('fever-alert');

let score = 0;
let stardust = parseInt(localStorage.getItem('starCatcherStardust')) || 0;
let lives = 3;
let combo = 0;
let comboTimer = 0;
let feverMode = false;
let feverTimer = 0;
let highscore = localStorage.getItem('starCatcherHighscore') || 0;
let stardustEl = document.getElementById('stardust');
let gameActive = false;
let canvasWidth, canvasHeight;
let spawnTimer;
let shakeAmount = 0;
let playerScale = 1;
let magnetActive = false;
let magnetTimer = 0;
let rainbowActive = false;
let rainbowTimer = 0;
let shieldActive = false;
let shieldTimer = 0;

highscoreEl.innerText = highscore;
stardustEl.innerText = stardust;

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

const player = {
    x: 0,
    y: 0,
    width: 70,
    height: 70,
    emoji: '🐱',
    skin: localStorage.getItem('starCatcherSkin') || '🐱'
};

const playerSkins = [
    { emoji: '🐱', name: 'Katt' },
    { emoji: '🐰', name: 'Kanin' },
    { emoji: '🦊', name: 'Rev' },
    { emoji: '🐼', name: 'Panda' },
    { emoji: '🐨', name: 'Koala' },
    { emoji: '🦄', name: 'Enhjørning' },
    { emoji: '🐲', name: 'Drage' },
    { emoji: '🧚', name: 'Fe' }
];

player.emoji = player.skin;


let objects = [];
const objectTypes = {
    STAR: { emoji: '🌟', points: 1, speed: 2, color: 'gold' },
    CLOUD: { emoji: '☁️', points: -1, speed: 3, color: 'grey' },
    MAGNET: { emoji: '🧲', points: 0, speed: 2.5, color: 'red' },
    RAINBOW: { emoji: '🌈', points: 5, speed: 4, color: 'rainbow' },
    SHIELD: { emoji: '🛡️', points: 0, speed: 3, color: 'blue' },
    GOLDEN_STAR: { emoji: '✨', points: 10, speed: 5, color: 'yellow' },
    BOMB: { emoji: '💣', points: -5, speed: 4, color: 'black' },
    SUPER_STAR: { emoji: '🌠', points: 25, speed: 6, color: 'purple' }
};

function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    player.y = canvasHeight - 100;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    let x = e.clientX - player.width / 2;
    player.x = Math.max(0, Math.min(x, canvasWidth - player.width));
});

window.addEventListener('touchmove', (e) => {
    let x = e.touches[0].clientX - player.width / 2;
    player.x = Math.max(0, Math.min(x, canvasWidth - player.width));
    e.preventDefault();
}, { passive: false });

function spawnObject() {
    if (!gameActive) return;
    
    const rand = Math.random();
    let type;
    if (rand > 0.99) type = objectTypes.SUPER_STAR;
    else if (rand > 0.98) type = objectTypes.RAINBOW;
    else if (rand > 0.96) type = objectTypes.GOLDEN_STAR;
    else if (rand > 0.94) type = objectTypes.MAGNET;
    else if (rand > 0.92) type = objectTypes.SHIELD;
    else if (rand > 0.30) type = objectTypes.STAR;
    else if (rand > 0.10) type = objectTypes.CLOUD;
    else type = objectTypes.BOMB;
    
    objects.push({
        x: Math.random() * (canvasWidth - 50),
        y: -60,
        width: 50,
        height: 50,
        type: type,
        speed: type.speed + (score * 0.05),
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.1,
        scale: 1.0
    });
    
    spawnTimer = setTimeout(spawnObject, Math.max(300, 1000 - (score * 5)));
}

function getRainbowEffect() {
    return `hsl(${Date.now() % 360}, 100%, 70%)`;
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

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(playerScale, playerScale);
    
    if (shieldActive) {
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#81d4fa';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(129, 212, 250, 0.3)';
        ctx.fill();
    }

    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, 0, 0);
    ctx.restore();
}

function renderSkinSelector() {
    const selector = document.getElementById('skin-selector');
    if (!selector) return;
    selector.innerHTML = '';
    playerSkins.forEach(skin => {
        const btn = document.createElement('button');
        btn.className = 'skin-btn';
        btn.innerText = skin.emoji;
        btn.onclick = () => {
            player.emoji = skin.emoji;
            player.skin = skin.emoji;
            localStorage.setItem('starCatcherSkin', skin.emoji);
            playSound(600, 'sine', 0.1);
        };
        selector.appendChild(btn);
    });
}


function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Dynamic Background based on score
    const hue = (score * 2) % 360;
    canvas.style.background = `linear-gradient(to bottom, hsl(${hue}, 80%, 90%), #fce4ec)`;
    
    if (shakeAmount > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
        shakeAmount *= 0.9;
        if (shakeAmount < 0.1) shakeAmount = 0;
    }

    drawPlayer();

    if (magnetActive) {
        magnetTimer--;
        if (magnetTimer <= 0) {
            magnetActive = false;
            magnetAlert.style.display = 'none';
        }
    }

    if (shieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) {
            shieldActive = false;
        }
    }

    if (rainbowActive) {
        rainbowTimer--;
        if (rainbowTimer <= 0) {
            rainbowActive = false;
            rainbowAlert.style.display = 'none';
        }
    }

    if (feverMode) {
        feverTimer--;
        if (feverTimer <= 0) {
            feverMode = false;
            feverAlert.style.display = 'none';
            canvas.style.animation = '';
        } else {
            // Pulsating effect during Fever Mode
            const pulse = 0.9 + Math.sin(Date.now() * 0.01) * 0.1;
            canvas.style.filter = `brightness(${pulse * 1.2}) saturate(1.5)`;
        }
    }

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            combo = 0;
            comboUi.classList.remove('show');
        }
    }

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        
        if (magnetActive && (obj.type === objectTypes.STAR || obj.type === objectTypes.RAINBOW)) {
            const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
            obj.x += dx * 0.05;
        }
        if (rainbowActive) { obj.x += (Math.random() - 0.5) * 2; }
        
        // Added juice: objects pulse slightly
        obj.scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;

        obj.y += obj.speed;
        obj.rotation += obj.vr;

    ctx.save();
    ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
    ctx.rotate(obj.rotation);
    ctx.scale(obj.scale, obj.scale);
    ctx.font = '45px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obj.type.emoji, 0, 0);
    ctx.restore();

        // Collision check
        if (obj.y + 40 > player.y && 
            obj.y < player.y + player.height &&
            obj.x + 40 > player.x && 
            obj.x < player.x + player.width) {
            
            if (obj.type === objectTypes.STAR) {
                combo++;
                comboTimer = 60;
                const mult = Math.floor(combo / 5) + 1;
                let stardustGain = Math.ceil(mult * 0.2);
                let gain = mult;
                if (feverMode) gain *= 2;
                score += gain;
                
                stardust += stardustGain;
                localStorage.setItem('starCatcherStardust', stardust);
                stardustEl.innerText = stardust;
                if (combo > 1) {
                    comboUi.innerText = `COMBO x${mult}${feverMode ? ' 🔥' : ''} ✨`;
                    comboUi.classList.add('show');
                }
                
                showFloatingText(`+${gain}`, obj.x + 20, obj.y + 20);
                playSound(440 + (combo * 20), 'sine', 0.1);
                createParticles(obj.x + 25, obj.y + 25, 'gold');
                playerScale = 1.2;

                if (combo >= 15 && !feverMode) {
                    activateFever();
                }
            } else if (obj.type === objectTypes.CLOUD) {
                if (rainbowActive) {
                    score += 1;
                    showFloatingText("+1 🌈", obj.x + 20, obj.y + 20);
                    playSound(600, 'sine', 0.1);
                } else if (shieldActive) {
                    activateShieldOff();
                    showFloatingText("Shield Blocked! 🛡️", obj.x + 20, obj.y + 20);
                    playSound(300, 'square', 0.2);
                } else {
                    loseLife();
                    playSound(150, 'sawtooth', 0.3);
                    shakeAmount = 20;
                }
                createParticles(player.x + 35, player.y + 35, 'grey');
                playerScale = 0.8;
            } else if (obj.type === objectTypes.BOMB) {
                score += obj.type.points;
                scoreEl.innerText = score;
                showFloatingText(`-${Math.abs(obj.type.points)} 💣`, obj.x + 20, obj.y + 20);
                playSound(100, 'sawtooth', 0.4);
                shakeAmount = 40;
                createParticles(player.x + 35, player.y + 35, 'black');
                playerScale = 0.7;
            } else if (obj.type === objectTypes.MAGNET) {
                activateMagnet();
                playSound(523, 'square', 0.2);
                createParticles(obj.x + 25, obj.y + 25, 'red');
            } else if (obj.type === objectTypes.SHIELD) {
                activateShield();
                playSound(400, 'sine', 0.3);
                createParticles(obj.x + 25, obj.y + 25, 'blue');
            } else if (obj.type === objectTypes.RAINBOW) {
                activateRainbow();
                score += 5;
                showFloatingText("+5 ✨", obj.x + 20, obj.y + 20);
                playSound(880, 'sine', 0.3);
                createParticles(obj.x + 25, obj.y + 25, 'rainbow');
            } else if (obj.type === objectTypes.GOLDEN_STAR) {
                score += 10;
                showFloatingText("+10 GOLDEN! ✨", obj.x + 20, obj.y + 20);
                playSound(1046, 'sine', 0.3);
                createParticles(obj.x + 25, obj.y + 25, 'yellow');
                activateRainbow();
            } else if (obj.type === objectTypes.SUPER_STAR) {
                score += 25;
                stardust += 5;
                localStorage.setItem('starCatcherStardust', stardust);
                stardustEl.innerText = stardust;
                showFloatingText(`+25 SUPER! 🌠`, obj.x + 20, obj.y + 20);
                playSound(1200, 'sine', 0.4);
                createParticles(obj.x + 25, obj.y + 25, 'purple');
                triggerStarShower();
            }
            
            scoreEl.innerText = score;
            objects.splice(i, 1);
            continue;
        }

        if (obj.y > canvasHeight) {
            if (obj.type === objectTypes.STAR) {
                if (!rainbowActive) {
                    loseLife();
                    createParticles(obj.x + 20, canvasHeight - 10, 'grey');
                }
            }
            objects.splice(i, 1);
        }
    }
    if (rainbowActive) {
        ctx.fillStyle = getRainbowEffect();
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🌈 RAINBOW POWER! 🌈', canvasWidth / 2, 50);
    }
    drawParticles();
    if (shakeAmount > 0) ctx.restore();
    playerScale += (1 - playerScale) * 0.2;
    requestAnimationFrame(update);
}

function triggerStarShower() {
    playSound(880, 'sine', 0.1);
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            if (!gameActive) return;
            objects.push({
                x: Math.random() * (canvasWidth - 50),
                y: -60,
                width: 50,
                height: 50,
                type: objectTypes.STAR,
                speed: 3 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.1,
                scale: 1.0
            });
        }, i * 100);
    }
}

let particles = [];
function createParticles(x, y, color) {
    const colors = color === 'rainbow' ? ['#ff80ab', '#ffd700', '#b2e2f2', '#d1b3ff', '#a5d6a7'] : [color];
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y, 
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function activateMagnet() {
    magnetActive = true;
    magnetTimer = 300;
    magnetAlert.style.display = 'block';
}

function activateShield() {
    shieldActive = true;
    shieldTimer = 600;
}

function activateShieldOff() {
    shieldActive = false;
    shieldTimer = 0;
}

function activateRainbow() {
    rainbowActive = true;
    rainbowTimer = 400;
    rainbowAlert.style.display = 'block';
}

function activateFever() {
    feverMode = true;
    feverTimer = 600;
    feverAlert.style.display = 'block';
    playSound(880, 'square', 0.4);
    createParticles(canvasWidth / 2, canvasHeight / 2, 'rainbow');
}

function loseLife() {
    lives--;
    livesEl.innerText = lives;
    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameActive = false;
    clearTimeout(spawnTimer);
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('starCatcherHighscore', highscore);
        highscoreEl.innerText = highscore;
        stardustEl.innerText = stardust;
        statusText.innerText = "NY REKORD! 🎉";
    } else {
        statusText.innerText = "Spillet er over! 🌸";
    }
    
    finalScoreEl.innerText = `Du fanget ${score} stjerner!`;
    overlay.style.display = 'block';
}

function resetGame() {
    clearTimeout(spawnTimer);
    score = 0;
    lives = 3;
    combo = 0;
    scoreEl.innerText = '0';
    livesEl.innerText = '3';
    comboUi.classList.remove('show');
    objects = [];
    particles = [];
    gameActive = true;
    overlay.style.display = 'none';
    startOverlay.style.display = 'none';
    magnetActive = false;
    rainbowActive = false;
    feverMode = false;
    shieldActive = false;
    magnetAlert.style.display = 'none';
    rainbowAlert.style.display = 'none';
}

window.addEventListener('load', () => {
    renderSkinSelector();
});

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    let count = 3;
    countdownEl.style.display = 'block';
    countdownEl.innerText = count;
    
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.innerText = count;
        } else {
            clearInterval(timer);
            startOverlay.style.display = 'none';
            gameActive = true;

            resetGame();
        }
    }, 1000);
});

requestAnimationFrame(update);
