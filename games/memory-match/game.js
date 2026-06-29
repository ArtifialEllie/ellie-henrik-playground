const levelConfigs = [
    {
        name: "Søte Godterier 🍭",
        grid: 2,
        emojis: ['🍭', '🧁', '🍩', '🍦'],
        bg: '#fffafa',
        accent: '#ffb6c1'
    },
    {
        name: "Magisk Skog 🍄",
        grid: 4,
        emojis: ['🌸', '🦄', '🍄', '🧚', '🦋', '🌟', '🌙', '🌿'],
        bg: '#f0fff0',
        accent: '#98fb98'
    },
    {
        name: "Kosmisk Drøm 🌌",
        grid: 6,
        emojis: ['🚀', '🪐', '🌌', '☀️', '☄️', '🛸', '🔭', '🛰️', '🌍', '🌓', '🌟', '🌑', '🌠', '🌀', '💎', '🔮', '🌈', '🎆'],
        bg: '#f0faff',
        accent: '#add8e6'
    },
    {
        name: "Undervanns Verden 🐠",
        grid: 4,
        emojis: ['🐠', '🐡', '🐙', '🐚', '🦀', '🦐', '🐋', '🐬', '🦈', '🦑', '🌊', '🪸'],
        bg: '#e0ffff',
        accent: '#40e0d0'
    },
    {
        name: "Drømme Slott 🏰",
        grid: 6,
        emojis: ['🏰', '👑', '💎', '🗝️', '🛡️', '⚔️', '🐉', '🦄', '🪄', '📜', '🕯️', '🌙', '☀️', '☁️', '🌟', '🎇', '🎐', '🔮', '🧿', '💠', '🔱', '🚩', '🏮'],
        bg: '#fff0f5',
        accent: '#da70d6'
    },
    {
        name: "Sukkerspinns-Sky ☁️",
        grid: 4,
        emojis: ['☁️', '🍭', '🍬', '🧁', '🎀', '💖', '🌸', '🎈'],
        bg: '#fff0f5',
        accent: '#ffc0cb'
    },
    {
        name: "Krystall-Hulen 💎",
        grid: 4,
        emojis: ['💎', '🔮', '✨', '❄️', '🧊', '💠', '🧿', '🌌'],
        bg: '#f0f8ff',
        accent: '#b0c4de'
    },
    {
        name: "Stjerne-Symphoni 🌟",
        grid: 6,
        emojis: ['⭐', '🌟', '🌙', '🎵', '🎶', '🎹', '🎻', '🎺', '🎼', '🎤', '🎷', '🎸'],
        bg: '#2e0854',
        accent: '#ffd700'
    }
];

let currentLevelIdx = 0;
let gameMode = 'classic';
let cards = [];
let flippedCards = [];
let moves = 0;
let matches = 0;
    let isLockBoard = false;
    let isPaused = false;
    let peeksLeft = 1;
    let hintsLeft = 1;
    let shufflesLeft = 1;
    let freezesLeft = 1;
    let warpsLeft = 1;
    let moveLimit = 0;

    let particleInterval;
    let combo = 0;
    let timerInterval;
    let secondsElapsed = 0;

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

function setGameMode(mode) {
    gameMode = mode;
    initGame();
}

function initGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    renderLevelSelector();
    
    const config = levelConfigs[currentLevelIdx];
    document.body.style.backgroundColor = config.bg;
    document.documentElement.style.setProperty('--accent', config.accent);
    document.getElementById('game-title').innerText = config.name;
    document.getElementById('level').textContent = currentLevelIdx + 1;
    
    resetTimer();
    
    startThemeParticles();
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const cols = config.grid;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    cards = [...config.emojis, ...config.emojis];
    shuffle(cards);
    
    moves = 0;
    matches = 0;
    combo = 0;
    flippedCards = [];
    isLockBoard = false;
    peeksLeft = 1;
    hintsLeft = 1;
   shufflesLeft = 1;
   freezesLeft = 1;
   warpsLeft = 1;
   
   if (gameMode === 'zen') {
        document.getElementById('timer-container').style.visibility = 'hidden';
    } else {
        if (gameMode === 'challenge') {
            const limit = config.emojis.length * 2; // Strict limit: 2x number of pairs
            moveLimit = limit;
            document.getElementById('move-limit-container').style.display = 'block';
            document.getElementById('move-limit').textContent = limit;
        } else {
            document.getElementById('move-limit-container').style.display = 'none';
            moveLimit = 0;
        }

        if (gameMode === 'timed') {
            // Start with 60 seconds for timed mode
            secondsElapsed = 60; 
        }
        document.getElementById('timer-container').style.visibility = 'visible';
    }

    updatePeekButton();
    updateHintButton();
    updateShuffleButton();
    updateFreezeButton();
    updateWarpButton();
    
    document.getElementById('total-pairs').textContent = config.emojis.length;
    updateStats();

    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-face card-front">✨</div>
            <div class="card-face card-back">${emoji}</div>
        `;
        
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function startGame(mode) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gameMode = mode;
    document.getElementById('main-menu').classList.add('hidden');
    
    // Update radio buttons
    const radio = document.querySelector(`input[value="${mode}"]`);
    if (radio) radio.checked = true;
    
    initGame();
}
window.startGame = startGame;

function renderLevelSelector() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';
    levelConfigs.forEach((config, idx) => {
        const btn = document.createElement('button');
        const isUnlocked = idx === 0 || localStorage.getItem(`memoryMatchUnlocked_${idx}`) === 'true';
        btn.className = `level-btn ${idx === currentLevelIdx ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        
        const medalKey = `memoryMatchMedal_${idx}`;
        const bestMedal = localStorage.getItem(medalKey) || '';
        
        btn.innerText = isUnlocked 
            ? `${idx + 1}. ${config.name} ${bestMedal}` 
            : `${idx + 1}. 🔒 Låst`;
        
        btn.onclick = () => {
            if (!isUnlocked) return;
            currentLevelIdx = idx;
            // Update selected state
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            initGame();
        };
        grid.appendChild(btn);
    });
}
function stopThemeParticles() {
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    document.getElementById('timer').textContent = '0';
    
    if (gameMode === 'timed') {
        secondsElapsed = 60;
    }

    timerInterval = setInterval(() => {
        if (!isPaused) {
            if (gameMode === 'timed') {
                secondsElapsed--;
                if (secondsElapsed <= 0) {
                    clearInterval(timerInterval);
                    showGameOver();
                }
            } else {
                secondsElapsed++;
            }
            document.getElementById('timer').textContent = secondsElapsed;
        }
    }, 1000);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startThemeParticles() {
    stopThemeParticles();
    const config = levelConfigs[currentLevelIdx];
    const themeParticles = {
        0: ['🍭', '🧁', '🍩', '🍦'],
        1: ['🌸', '🍃', '🍄', '🧚'],
        2: ['⭐', '🌙', '🌌', '☄️'],
        3: ['🫧', '🐠', '🐚', '🌊'],
        4: ['💎', '✨', '👑', '🏰'],
        5: ['☁️', '💖', '🎀', '🍭'],
        6: ['❄️', '💎', '🔮', '💠'],
        7: ['🎵', '🎶', '🎹', '🎻']
    };
    
    const emojis = themeParticles[currentLevelIdx] || ['✨'];
    
    particleInterval = setInterval(() => {
        if (isPaused) return;
        const p = document.createElement('div');
        p.className = 'bg-particle';
        p.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.fontSize = Math.random() * 20 + 10 + 'px';
        p.style.animationDuration = Math.random() * 5 + 5 + 's';
        p.style.opacity = Math.random() * 0.5 + 0.2;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 10000);
    }, 600);
}

function flipCard() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isLockBoard || isPaused) return;
    if (this === flippedCards[0]) return;
    if (this.classList.contains('matched')) return;

    playSound(440, 'sine', 0.1);
    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    isLockBoard = true;
    moves++;
    updateStats();

    if (gameMode === 'challenge' && moves > moveLimit) {
        clearInterval(timerInterval);
        showGameOver();
        return;
    }

    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        handleMatch();
        disableCards();
    } else {
        combo = 0;
        unflipCards();
        
        // Small penalty for wrong match: shake the cards
        flippedCards.forEach(card => {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 400);
        });
    }
}

function handleMatch() {
    combo++;
    createComboText();
    if (combo >= 3) activateFeverMode();
    // Every 3 matches, you get a peek! ✨
    if (matches % 3 === 0 && matches !== 0) {
        peeksLeft++;
        updatePeekButton();
    }
    // Every 5 matches, you get a hint! 💡
    if (matches % 5 === 0 && matches !== 0) {
        hintsLeft++;
        updateHintButton();
    }
    if (matches % 7 === 0 && matches !== 0) {
        freezesLeft++;
        updateFreezeButton();
    }
    if (matches % 12 === 0 && matches !== 0) {
        warpsLeft++;
        updateWarpButton();
    }
    // Every 10 matches, you get a shuffle! 🌀
    if (matches % 10 === 0 && matches !== 0) {
        shufflesLeft++;
        updateShuffleButton();
    }
}

function showGameOver() {
    const winMessage = document.getElementById('win-message');
    document.getElementById('win-title').innerText = "Tiden rant ut! ⏰";
    document.getElementById('star-rating').innerText = "☁️";
    document.getElementById('best-score').innerText = "Prøv igjen for å vinne!";
    document.getElementById('final-stats').innerText = `Du fant ${matches} par før tiden gikk ut.`;
    document.getElementById('next-btn').innerText = "Prøv igjen! 🌸";
    
    if (gameMode === 'challenge') {
        document.getElementById('win-title').innerText = "Grensen nådd! 🏆";
        document.getElementById('final-stats').innerText = `Du brukte opp alle trekkene dine! Du fant ${matches} par.`;
    }

    winMessage.classList.add('show');
    
    // Sad sound
    playSound(220, 'sine', 0.5);
}

function disableCards() {
    playSound(660, 'sine', 0.2);
    setTimeout(() => playSound(880, 'sine', 0.2), 100);
    
    flippedCards.forEach(card => {
        card.classList.add('matched');
        createSparkles(card);
    });
    matches++;
    updateStats();
    resetBoard();
    
    if (matches === levelConfigs[currentLevelIdx].emojis.length) {
        clearInterval(timerInterval);
        showWinMessage();
    }
}

function unflipCards() {
    setTimeout(() => {
        playSound(220, 'sine', 0.2);
        flippedCards.forEach(card => {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 400);
            card.classList.remove('flipped');
        });
        resetBoard();
    }, 1000);
}

function resetBoard() {
    flippedCards = [];
    isLockBoard = false;
}

function activateFeverMode() {
    const container = document.querySelector('.palace-container');
    if (container) {
        container.classList.add('fever-mode');
        setTimeout(() => {
            container.classList.remove('fever-mode');
        }, 5000);
    }

    // Fever Mode Power: Briefly reveal 4 random unmatched cards! ✨
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    if (unmatched.length >= 4) {
        for (let i = 0; i < 4; i++) {
            const randomCard = unmatched[Math.floor(Math.random() * unmatched.length)];
            randomCard.classList.add('flipped');
            setTimeout(() => {
                if (!flippedCards.includes(randomCard) && !randomCard.classList.contains('matched')) {
                    randomCard.classList.remove('flipped');
                }
            }, 1200);
        }
    }
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            p.innerText = ['✨', '⭐', '💖', '🌈'][Math.floor(Math.random() * 4)];
            p.style.left = Math.random() * 100 + 'vw';
            p.style.fontSize = Math.random() * 20 + 10 + 'px';
            p.style.animationDuration = Math.random() * 3 + 2 + 's';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 5000);
        }, i * 100);
    }
}

function updateStats() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('matches').textContent = matches;
    document.getElementById('combo').textContent = combo;
}

function createSparkles(card) {
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = '✨';
        sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
        sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    }
}

function createComboText() {
    const text = document.createElement('div');
    text.className = 'combo-text';
    text.innerText = `COMBO x${combo}! ✨`;
    
    const rect = flippedCards[0].getBoundingClientRect();
    text.style.left = (rect.left + rect.width/2) + 'px';
    text.style.top = (rect.top) + 'px';
    
    document.body.appendChild(text);
    
    setTimeout(() => {
        text.remove();
    }, 1000);
}

function showWinMessage() {
    const config = levelConfigs[currentLevelIdx];
    const pairs = config.emojis.length;
    let medal = "";
    let medalName = "";

    if (moves <= pairs) {
        medal = "💎";
        medalName = "Platinum!";
    } else if (moves <= pairs * 1.3) {
        medal = "🥇";
        medalName = "Gull!";
    } else if (moves <= pairs * 1.7) {
        medal = "🥈";
        medalName = "Sølv!";
    } else if (moves <= pairs * 2.2) {
        medal = "🥉";
        medalName = "Bronse!";
    } else {
        medal = "⭐";
        medalName = "Fullført!";
    }

    const bestScoreKey = `memoryMatchBest_${currentLevelIdx}`;
    const bestScore = localStorage.getItem(bestScoreKey);
    let bestScoreText = "";
    if (bestScore) {
        bestScoreText = `Tidligere beste: ${bestScore} trekk 🏆`;
    }
    if (moves < parseInt(bestScore) || !bestScore) {
        localStorage.setItem(bestScoreKey, moves);
        bestScoreText = `Ny rekord! 🌈`;
    }

    const medalKey = `memoryMatchMedal_${currentLevelIdx}`;
    const currentMedalRank = { '💎': 4, '🥇': 3, '🥈': 2, '🥉': 1, '⭐': 0 }[medal];
    const savedMedalRank = { '💎': 4, '🥇': 3, '🥈': 2, '🥉': 1, '⭐': 0 }[localStorage.getItem(medalKey) || ''];
    if (currentMedalRank > savedMedalRank) {
        localStorage.setItem(medalKey, medal);
    }

    document.getElementById('best-score').innerText = bestScoreText;

    setTimeout(() => {
        document.getElementById('star-rating').innerText = `${medal} ${medalName}`;
        
        let finalStatsText = `Du fant alle parene på ${moves} trekk`;
        if (gameMode === 'classic') {
            finalStatsText += ` og ${secondsElapsed} sekunder!`;
        }
        finalStatsText += ` Din høyeste combo var ${combo}! 🌟`;
        
        document.getElementById('final-stats').innerText = finalStatsText;
        document.getElementById('win-message').classList.add('show');
        startConfetti();
        
        // Unlock next level
        if (currentLevelIdx < levelConfigs.length - 1) {
            localStorage.setItem(`memoryMatchUnlocked_${currentLevelIdx + 1}`, 'true');
        }

        // Victory fanfare
        const melody = [
            { f: 523.25, d: 0.2 }, { f: 659.25, d: 0.2 }, 
            { f: 783.99, d: 0.2 }, { f: 1046.50, d: 0.4 }
        ];
        melody.forEach((note, i) => {
            setTimeout(() => playSound(note.f, 'sine', note.d), i * 200);
        });
        
        if (currentLevelIdx === levelConfigs.length - 1) {
            document.getElementById('win-title').innerText = "Mester av Palasset! 🏰";
            document.getElementById('next-btn').innerText = "Spill igjen! 🦄";
        } else {
            document.getElementById('win-title').innerText = "Nivå Fullført! 🌟";
            document.getElementById('next-btn').innerText = "Neste Nivå! 🦄";
        }
    }, 500);
}

function nextLevel() {
    document.getElementById('win-message').classList.remove('show');
    if (currentLevelIdx < levelConfigs.length - 1) {
        currentLevelIdx++;
    } else {
        currentLevelIdx = 0;
    }
    initGame();
}

function startConfetti() {
    for (let i = 0; i < 120; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = ['#ffb6c1', '#add8e6', '#e6e6fa', '#ffd700', '#98fb98', '#ffc0cb'][Math.floor(Math.random() * 6)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            const animation = confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${Math.random() * 100 - 50}px, 105vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 3000 + 2000,
                easing: 'linear'
            });
            
            document.body.appendChild(confetti);
            animation.onfinish = () => confetti.remove();
        }, i * 15);
    }
}

function magicPeek() {
    if (peeksLeft <= 0 || isLockBoard) return;
    
    peeksLeft--;
    moves += 3;
    updateStats();
    updatePeekButton();
    
    playSound(880, 'triangle', 0.3);
    
    const allCards = document.querySelectorAll('.card:not(.matched)');
    allCards.forEach(card => card.classList.add('flipped'));
    
    setTimeout(() => {
        allCards.forEach(card => {
            if (!flippedCards.includes(card)) {
                card.classList.remove('flipped');
            }
        });
    }, 600);
}

function magicHint() {
    if (hintsLeft <= 0 || isLockBoard) return;
    
    hintsLeft--;
    moves += 5;
    updateStats();
    updateHintButton();
    
    playSound(880, 'triangle', 0.3);
    
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    if (unmatched.length < 2) return;
    
    // Find a random pair
    const firstCard = unmatched[Math.floor(Math.random() * unmatched.length)];
    const emoji = firstCard.dataset.emoji;
    const partner = unmatched.find(card => card !== firstCard && card.dataset.emoji === emoji);
    
    if (partner) {
        [firstCard, partner].forEach(card => {
            card.classList.add('flipped');
            setTimeout(() => {
                if (!flippedCards.includes(card)) {
                    card.classList.remove('flipped');
                }
            }, 1200);
        });
    } else {
        // Fallback to the original behavior if no partner found (shouldn't happen)
        firstCard.classList.add('flipped');
        setTimeout(() => {
            if (!flippedCards.includes(firstCard)) {
                firstCard.classList.remove('flipped');
            }
        }, 800);
    }
}

function magicShuffle() {
    if (shufflesLeft <= 0 || isLockBoard) return;

    shufflesLeft--;
    moves += 10;
    updateStats();
    updateShuffleButton();

    playSound(660, 'triangle', 0.3);

    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    const emojis = unmatched.map(card => card.dataset.emoji);
    shuffle(emojis);

    unmatched.forEach((card, i) => {
        card.dataset.emoji = emojis[i];
        card.querySelector('.card-back').innerText = emojis[i];
    });
}

function magicFreeze() {
    if (freezesLeft <= 0 || isLockBoard) return;
    
    freezesLeft--;
    moves += 7;
    updateStats();
    updateFreezeButton();
    
    playSound(300, 'sine', 0.5);
    
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    unmatched.forEach(card => {
        card.classList.add('flipped');
        setTimeout(() => {
            if (!flippedCards.includes(card) && !card.classList.contains('matched')) {
                card.classList.remove('flipped');
            }
        }, 1000);
    });
}

function updateHintButton() {
    const btn = document.getElementById('hint-btn');
    if (btn) {
        btn.innerText = hintsLeft > 0 ? `Magic Hint 💡 (${hintsLeft})` : `Magic Hint 💡 (Tom!)`;
        btn.disabled = hintsLeft <= 0;
    }
}

function updatePeekButton() {
    const btn = document.getElementById('peek-btn');
    if (btn) {
        btn.innerText = peeksLeft > 0 ? `Magic Peek ✨ (${peeksLeft})` : `Magic Peek ✨ (Tom!)`;
        btn.disabled = peeksLeft <= 0;
    }
}

function updateShuffleButton() {
    const btn = document.getElementById('shuffle-btn');
    if (btn) {
        btn.innerText = shufflesLeft > 0 ? `Magic Shuffle 🌀 (${shufflesLeft})` : `Magic Shuffle 🌀 (Tom!)`;
        btn.disabled = shufflesLeft <= 0;
    }
}

function magicTimeWarp() {
    if (warpsLeft <= 0 || isLockBoard) return;
    
    warpsLeft--;
    moves += 15;
    updateStats();
    updateWarpButton();
    
    playSound(440, 'triangle', 0.5);
    
    // Time Warp: Rewind the last 2 moves (if possible) 
    // Since we don't have a full history, we'll simulate it by 
    // unmatching the last matched pair.
    const matchedCards = Array.from(document.querySelectorAll('.card.matched'));
    if (matchedCards.length >= 2) {
        const lastTwo = matchedCards.slice(-2);
       lastTwo.forEach(card => {
           card.classList.remove('matched');
           card.classList.remove('flipped');
           card.querySelector('.card-back').style.backgroundColor = 'white';
           card.querySelector('.card-back').style.boxShadow = 'none';
           card.querySelector('.card-back').style.border = '4px solid white';
        });
        matches--;
        updateStats();
    }
}

function updateWarpButton() {
    const btn = document.getElementById('warp-btn');
    if (btn) {
        btn.innerText = warpsLeft > 0 ? `Time Warp ⏳ (${warpsLeft})` : `Time Warp ⏳ (Tom!)`;
        btn.disabled = warpsLeft <= 0;
    }
}

initGame();

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.innerText = isPaused ? 'Resume ▶️' : 'Pause ⏸️';
    playSound(isPaused ? 330 : 440, 'sine', 0.2);
}
