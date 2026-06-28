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
let lives = 3;
let combo = 0;
let comboTimer = 0;
let feverMode = false;
let feverTimer = 0;
let highscore = localStorage.getItem('starCatcherHighscore') || 0;
let gameActive = false;
let canvasWidth, canvasHeight;
let spawnTimer;
let shakeAmount = 0;
let playerScale = 1;
let magnetActive = false;
let magnetTimer = 0;
let rainbowActive = false;
let rainbowTimer = 0;

highscoreEl.innerText = highscore;

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
    skin: '🐱'
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


let objects = [];
const objectTypes = {
    STAR: { emoji: '🌟', points: 1, speed: 2, color: 'gold' },
    CLOUD: { emoji: '☁️', points: -1, speed: 3, color: 'grey' },
    MAGNET: { emoji: '🧲', points: 0, speed: 2.5, color: 'red' },
    RAINBOW: { emoji: '🌈', points: 5, speed: 4, color: 'rainbow' }
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
    player.x = e.clientX - player.width / 2;
});

window.addEventListener('touchmove', (e) => {
    player.x = e.touches[0].clientX - player.width / 2;
    e.preventDefault();
}, { passive: false });

function spawnObject() {
    if (!gameActive) return;
    
    const rand = Math.random();
    let type;
    if (rand > 0.98) type = objectTypes.RAINBOW;
    else if (rand > 0.94) type = objectTypes.MAGNET;
    else if (rand > 0.30) type = objectTypes.STAR;
    else type = objectTypes.CLOUD;
    
    objects.push({
        x: Math.random() * (canvasWidth - 50),
        y: -60,
        width: 50,
        height: 50,
        type: type,
        speed: type.speed + (score * 0.05),
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.1
    });
    
    spawnTimer = setTimeout(spawnObject, Math.max(300, 1000 - (score * 5)));
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
            playSound(600, 'sine', 0.1);
        };
        selector.appendChild(btn);
    });
}


function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
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

        obj.y += obj.speed;
        obj.rotation += obj.vr;

        ctx.save();
        ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
        ctx.rotate(obj.rotation);
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
                let gain = mult;
                if (feverMode) gain *= 2;
                score += gain;
                
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
                if (!rainbowActive) {
                    loseLife();
                    playSound(150, 'sawtooth', 0.3);
                    shakeAmount = 20;
                } else {
                    score += 1;
                    showFloatingText("+1 🌈", obj.x + 20, obj.y + 20);
                    playSound(600, 'sine', 0.1);
                }
                createParticles(player.x + 35, player.y + 35, 'grey');
                playerScale = 0.8;
            } else if (obj.type === objectTypes.MAGNET) {
                activateMagnet();
                playSound(523, 'square', 0.2);
                createParticles(obj.x + 25, obj.y + 25, 'red');
            } else if (obj.type === objectTypes.RAINBOW) {
                activateRainbow();
                score += 5;
                showFloatingText("+5 ✨", obj.x + 20, obj.y + 20);
                playSound(880, 'sine', 0.3);
                createParticles(obj.x + 25, obj.y + 25, 'rainbow');
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
    drawParticles();
    if (shakeAmount > 0) ctx.restore();
    playerScale += (1 - playerScale) * 0.2;
    requestAnimationFrame(update);
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
    magnetAlert.style.display = 'none';
    rainbowAlert.style.display = 'none';
    feverAlert.style.display = 'none';
    renderSkinSelector();
    spawnObject();
    requestAnimationFrame(update);
}


document.getElementById('start-btn').addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    resetGame();
});
