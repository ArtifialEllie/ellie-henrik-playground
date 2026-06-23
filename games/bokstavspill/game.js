const levelData = {
    1: {
        name: "Enkel",
        items: {
            'A': { name: 'Ape', emoji: '🐒' },
            'B': { name: 'Bjørn', emoji: '🐻' },
            'D': { name: 'Delfin', emoji: '🐬' },
            'E': { name: 'Elefant', emoji: '🐘' },
            'F': { name: 'Fisk', emoji: '🐟' },
            'G': { name: 'Giraff', emoji: '🦒' },
            'H': { name: 'Hund', emoji: '🐶' },
            'I': { name: 'Igle', emoji: '🐛' },
            'J': { name: 'Jaguar', emoji: '🐆' },
            'K': { name: 'Katt', emoji: '🐱' },
            'L': { name: 'Løve', emoji: '🦁' },
            'M': { name: 'Mus', emoji: '🐭' },
            'N': { name: 'Neshorn', emoji: '🦏' },
            'O': { name: 'Oter', emoji: '🦦' },
            'P': { name: 'Panda', emoji: '🐼' },
            'R': { name: 'Rødrev', emoji: '🦊' },
            'S': { name: 'Sel', emoji: '🦭' },
            'T': { name: 'Tiger', emoji: '🐯' },
            'U': { name: 'Ugle', emoji: '🦉' },
            'V': { name: 'Vannlilje', emoji: '🪷' },
            'Y': { name: 'Yak', emoji: '🐂' },
            'Z': { name: 'Zebra', emoji: '🦓' },
            'Æ': { name: 'Ærfugl', emoji: '🦆' },
            'Ø': { name: 'Ørn', emoji: '🦅' },
            'Å': { name: 'Ål', emoji: '🐍' },
        }
    },
    2: {
        name: "Lure Lyder",
        items: {
            'Kj': { name: 'Kjeks', emoji: '🍪', audioHint: 'lyden i starten av kjeks' },
            'Skj': { name: 'Skjorte', emoji: '👕', audioHint: 'lyden i starten av skjorte' },
            'Sj': { name: 'Sjø', emoji: '🌊', audioHint: 'lyden i starten av sjokolade' },
            'Ng': { name: 'Ring', emoji: '💍', audioHint: 'lyden i slutten av ring' },
            'Øy': { name: 'Øy', emoji: '🏝️', audioHint: 'lyden i starten av øy' },
            'Hj': { name: 'Hjerte', emoji: '❤️', audioHint: 'lyden i starten av hjerte' },
            'Kv': { name: 'Kveld', emoji: '🌙', audioHint: 'lyden i starten av kveld' },
            'Tj': { name: 'Tjære', emoji: '🪵', audioHint: 'lyden i starten av tjære' },
            'Gj': { name: 'Gjøk', emoji: '🐦', audioHint: 'lyden i starten av gjøk' },
        }
    },
    3: {
        name: "Ord-utfordring",
        items: {
            'Sol': { name: 'Sol', emoji: '☀️' },
            'Hus': { name: 'Hus', emoji: '🏠' },
            'Bil': { name: 'Bil', emoji: '🚗' },
            'Is': { name: 'Is', emoji: '🍦' },
            'Ball': { name: 'Ball', emoji: '⚽' },
            'Kake': { name: 'Kake', emoji: '🍰' },
            'Måne': { name: 'Måne', emoji: '🌙' },
            'Stjerne': { name: 'Stjerne', emoji: '⭐' },
            'Hjerte': { name: 'Hjerte', emoji: '❤️' },
            'Regnbue': { name: 'Regnbue', emoji: '🌈' },
            'Sky': { name: 'Sky', emoji: '☁️' },
        }
    }
};

let currentLevel = 1;
let streak = 0;
let currentItem = '';
let lastItem = '';
let isProcessing = false;

const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const letterGrid = document.getElementById('letter-grid');
const resultDiv = document.getElementById('result');
const nameDiv = document.getElementById('animal-name');
const levelText = document.getElementById('level-text');
const streakText = document.getElementById('streak-text');
const levelUpBanner = document.getElementById('level-up-banner');

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'no-NO';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

function speakPrompt() {
    const data = levelData[currentLevel].items[currentItem];
    let audioText = currentItem;
    
    if (data.audioHint) {
        audioText = `Hvilken lyd er dette? ${data.audioHint}`;
    } else {
        audioText = `Hvilken lyd eller bokstav er dette? ${currentItem}`;
    }
    
    speak(audioText);
}

function nextRound() {
    resultDiv.innerText = '';
    nameDiv.innerText = '';
    letterGrid.innerHTML = '';
    
    const pool = levelData[currentLevel].items;
    const keys = Object.keys(pool);
    
    let newItem = keys[0];
    if (keys.length > 1) {
        do {
            newItem = keys[Math.floor(Math.random() * keys.length)];
        } while (newItem === lastItem);
    }

    currentItem = newItem;
    lastItem = currentItem;
    
    let options = [currentItem];
    while(options.length < 3) {
        let randomK = keys[Math.floor(Math.random() * keys.length)];
        if(!options.includes(randomK)) options.push(randomK);
    }
    
    options.sort(() => Math.random() - 0.5);

    options.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.innerText = k;
        btn.onclick = () => checkAnswer(k, btn);
        letterGrid.appendChild(btn);
    });

    setTimeout(speakPrompt, 500);
}

function checkAnswer(letter, btn) {
    if (isProcessing) return;

    if(letter === currentItem) {
        btn.classList.add('correct');
        streak++;
        
        const item = levelData[currentLevel].items[currentItem];
        resultDiv.innerText = item.emoji;
        resultDiv.classList.add('pop-in');
        nameDiv.innerText = `${currentItem} er for ${item.name}!`;
        
        speak(`Riktig! ${currentItem} er for ${item.name}`);
        
        updateStatus();
        
        if(streak >= 5 && currentLevel < 3) {
            levelUp();
        }

        isProcessing = true;
        setTimeout(() => {
            resultDiv.classList.remove('pop-in');
            isProcessing = false;
            nextRound();
        }, 3000);
    } else {
        btn.classList.add('wrong');
        streak = 0;
        updateStatus();
        speak(`Nei, prøv igjen!`);
        setTimeout(() => btn.classList.remove('wrong'), 500);
    }
}

function updateStatus() {
    levelText.innerText = `Nivå: ${currentLevel} (${levelData[currentLevel].name})`;
    streakText.innerText = `Streak: ${streak} 🔥`;
}

function createBackgroundBubbles() {
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bg-bubble';
        const size = Math.random() * 60 + 20 + 'px';
        bubble.style.width = size;
        bubble.style.height = size;
        bubble.style.left = Math.random() * 100 + 'vw';
        bubble.style.animationDuration = Math.random() * 10 + 5 + 's';
        bubble.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(bubble);
    }
}

function spawnConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        confetti.style.animationDelay = Math.random() * 1 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

function levelUp() {
    currentLevel++;
    streak = 0;
    levelUpBanner.style.display = 'block';
    spawnConfetti();
    speak(`Wow! Du er superflink! Nå går vi opp til nivå ${currentLevel}!`);
    
    setTimeout(() => {
        levelUpBanner.style.display = 'none';
    }, 3000);
}

startBtn.onclick = () => {
    startScreen.style.display = 'none';
    createBackgroundBubbles();
    updateStatus();
    nextRound();
};
