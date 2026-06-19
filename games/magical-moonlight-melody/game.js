const gameContainer = document.getElementById('game-container');
const scoreBoard = document.getElementById('score');
const multiplierBoard = document.getElementById('multiplier');
const messageDisplay = document.getElementById('message');
const hitZone = document.getElementById('hit-zone');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

let score = 0;
let multiplier = 1;
let gameActive = false;
let notes = [];
let lastNoteTime = 0;
let noteInterval = 2000;
let gameSpeed = 2;
let spawnX = 0;

function init() {
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
}

function startGame() {
    score = 0;
    multiplier = 1;
    gameActive = true;
    notes = [];
    noteInterval = 2000;
    gameSpeed = 2;
    
    scoreBoard.textContent = score;
    multiplierBoard.textContent = multiplier;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    requestAnimationFrame(gameLoop);
}

function spawnNote() {
    const note = document.createElement('div');
    note.className = 'note';
    
    // Random X position
    const padding = 50;
    spawnX = Math.random() * (window.innerWidth - padding * 2) + padding;
    note.style.left = `${spawnX}px`;
    note.style.top = `-60px`;
    
    gameContainer.appendChild(note);
    notes.push({
        element: note,
        y: -60,
        speed: gameSpeed + Math.random() * 1,
        id: Date.now()
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.backgroundColor = color;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        gameContainer.appendChild(p);
        
        const animation = p.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx * 50}px, ${vy * 50}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => p.remove();
    }
}

function handleHit(noteObj) {
    const rect = noteObj.element.getBoundingClientRect();
    const hitZoneRect = hitZone.getBoundingClientRect();
    
    // Calculate distance to hit zone center
    const dx = rect.left + rect.width / 2 - (hitZoneRect.left + hitZoneRect.width / 2);
    const dy = rect.top + rect.height / 2 - (hitZoneRect.top + hitZoneRect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 60) {
        // HIT!
        score += 10 * multiplier;
        multiplier++;
        
        showFeedback('PERFECT!', '#fff');
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ffd700');
        
        noteObj.element.remove();
        notes = notes.filter(n => n.id !== noteObj.id);
        
        scoreBoard.textContent = score;
        multiplierBoard.textContent = multiplier;
        
        // Speed up slightly
        gameSpeed += 0.02;
        noteInterval = Math.max(800, noteInterval - 10);
    } else {
        // MISS (if clicked)
        multiplier = 1;
        multiplierBoard.textContent = multiplier;
        showFeedback('MISS!', '#ff4444');
    }
}

function showFeedback(text, color) {
    messageDisplay.textContent = text;
    messageDisplay.style.color = color;
    messageDisplay.style.opacity = 1;
    
    setTimeout(() => {
        messageDisplay.style.opacity = 0;
    }, 500);
}

function gameLoop(timestamp) {
    if (!gameActive) return;
    
    if (timestamp - lastNoteTime > noteInterval) {
        spawnNote();
        lastNoteTime = timestamp;
    }
    
    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        note.y += note.speed;
        note.element.style.top = `${note.y}px`;
        
        // Check if it went off screen
        if (note.y > window.innerHeight) {
            multiplier = 1;
            multiplierBoard.textContent = multiplier;
            showFeedback('LOST MELODY!', '#ff4444');
            note.element.remove();
            notes.splice(i, 1);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('mousedown', (e) => {
    if (!gameActive) return;
    
    // Find the closest note to the click
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const rect = note.element.getBoundingClientRect();
        
        if (clickX >= rect.left && clickX <= rect.left + rect.width &&
            clickY >= rect.top && clickY <= rect.top + rect.height) {
            handleHit(note);
            break;
        }
    }
});

init();
