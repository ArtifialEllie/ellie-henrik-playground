const levelData = {
    1: {
        name: "Enkel",
        items: {
            'A': [{ name: 'Ape', emoji: '🐒' }, { name: 'Ananas', emoji: '🍍' }, { name: 'Appelsin', emoji: '🍊' }],
            'B': [{ name: 'Bjørn', emoji: '🐻' }, { name: 'Banan', emoji: '🍌' }, { name: 'Bil', emoji: '🚗' }, { name: 'Ball', emoji: '⚽' }],
            'C': [{ name: 'Cirkus', emoji: '🎪' }, { name: 'Cola', emoji: '🥤' }],
            'D': [{ name: 'Delfin', emoji: '🐬' }, { name: 'Drage', emoji: '🐉' }, { name: 'Dukke', emoji: '🪆' }],
            'E': [{ name: 'Elefant', emoji: '🐘' }, { name: 'Eple', emoji: '🍎' }, { name: 'Egg', emoji: '🥚' }],
            'F': [{ name: 'Fisk', emoji: '🐟' }, { name: 'Fugl', emoji: '🐦' }, { name: 'Frosk', emoji: '🐸' }],
            'G': [{ name: 'Giraff', emoji: '🦒' }, { name: 'Gresskar', emoji: '🎃' }, { name: 'Gule', emoji: '💛' }],
            'H': [{ name: 'Hund', emoji: '🐶' }, { name: 'Hest', emoji: '🐴' }, { name: 'Hatt', emoji: '🎩' }],
            'I': [{ name: 'Igle', emoji: '🐛' }, { name: 'Is', emoji: '🍦' }],
            'J': [{ name: 'Jaguar', emoji: '🐆' }, { name: 'Juletre', emoji: '🎄' }, { name: 'Jordbær', emoji: '🍓' }],
            'K': [{ name: 'Katt', emoji: '🐱' }, { name: 'Kake', emoji: '🍰' }, { name: 'Kanin', emoji: '🐰' }, { name: 'Ko', emoji: '🐮' }],
            'L': [{ name: 'Løve', emoji: '🦁' }, { name: 'Lam', emoji: '🐑' }, { name: 'Lilla', emoji: '💜' }],
            'M': [{ name: 'Mus', emoji: '🐭' }, { name: 'Melon', emoji: '🍈' }, { name: 'Måne', emoji: '🌙' }],
            'N': [{ name: 'Neshorn', emoji: '🦏' }, { name: 'Nisse', emoji: '🎅' }, { name: 'Nøtt', emoji: '🥜' }],
            'O': [{ name: 'Oter', emoji: '🦦' }, { name: 'Ost', emoji: '🧀' }, { name: 'Oransje', emoji: '🟠' }],
            'P': [{ name: 'Panda', emoji: '🐼' }, { name: 'Pære', emoji: '🍐' }, { name: 'Papegøye', emoji: '🦜' }],
            'R': [{ name: 'Rødrev', emoji: '🦊' }, { name: 'Robot', emoji: '🤖' }, { name: 'Regnbue', emoji: '🌈' }],
            'S': [{ name: 'Sel', emoji: '🦭' }, { name: 'Sol', emoji: '☀️' }, { name: 'Slange', emoji: '🐍' }, { name: 'Snegle', emoji: '🐌' }],
            'T': [{ name: 'Tiger', emoji: '🐯' }, { name: 'Tog', emoji: '🚂' }, { name: 'Traktor', emoji: '🚜' }],
            'U': [{ name: 'Ugle', emoji: '🦉' }, { name: 'Ur', emoji: '⌚' }, { name: 'Underbukse', emoji: '🩲' }],
            'V': [{ name: 'Vannlilje', emoji: '🪷' }, { name: 'Vaffel', emoji: '🧇' }, { name: 'Vinter', emoji: '❄️' }],
            'Y': [{ name: 'Yak', emoji: '🐂' }, { name: 'Ytterdør', emoji: '🚪' }],
            'Z': [{ name: 'Zebra', emoji: '🦓' }],
            'W': [{ name: 'Waffle', emoji: '🧇' }],
            'X': [{ name: 'Xylofon', emoji: '🎹' }],
            'Q': [{ name: 'Quiz', emoji: '❓' }],
            'Æ': [{ name: 'Ærfugl', emoji: '🦆' }],
            'Ø': [{ name: 'Ørn', emoji: '🦅' }, { name: 'Øks', emoji: '🪓' }],
            'Å': [{ name: 'Ål', emoji: '🐍' }, { name: 'Åker', emoji: '🌾' }],
        }
    },
    2: {
        name: "Lure Lyder",
        items: {
            'Kj': [{ name: 'Kjeks', emoji: '🍪', audioHint: 'lyden i starten av kjeks' }],
            'Skj': [{ name: 'Skjorte', emoji: '👕', audioHint: 'lyden i starten av skjorte' }],
            'Sj': [{ name: 'Sjø', emoji: '🌊', audioHint: 'lyden i starten av sjokolade' }],
            'Ng': [{ name: 'Ring', emoji: '💍', audioHint: 'lyden i slutten av ring' }],
            'Øy': [{ name: 'Øy', emoji: '🏝️', audioHint: 'lyden i starten av øy' }],
            'Hj': [{ name: 'Hjerte', emoji: '❤️', audioHint: 'lyden i starten av hjerte' }],
            'Kv': [{ name: 'Kveld', emoji: '🌙', audioHint: 'lyden i starten av kveld' }],
            'Tj': [{ name: 'Tjære', emoji: '🪵', audioHint: 'lyden i starten av tjære' }],
            'Hv': [{ name: 'Hva', emoji: '❓', audioHint: 'lyden i starten av hva' }],
            'Gj': [{ name: 'Gjøk', emoji: '🐦', audioHint: 'lyden i starten av gjøk' }],
            'Sk': [{ name: 'Skole', emoji: '🏫', audioHint: 'lyden i starten av skole' }],
            'St': [{ name: 'Stjerne', emoji: '⭐', audioHint: 'lyden i starten av stjerne' }],
            'Fl': [{ name: 'Flue', emoji: '🪰', audioHint: 'lyden i starten av flue' }],
            'Pr': [{ name: 'Prat', emoji: '🗣️', audioHint: 'lyden i starten av prat' }],
            'Tr': [{ name: 'Tre', emoji: '🌳', audioHint: 'lyden i starten av tre' }],
        }
    },
    3: {
        name: "Ord-utfordring",
        items: {
            'Sol': [{ name: 'Sol', emoji: '☀️' }],
            'Hus': [{ name: 'Hus', emoji: '🏠' }],
            'Bil': [{ name: 'Bil', emoji: '🚗' }],
            'Is': [{ name: 'Is', emoji: '🍦' }],
            'Ball': [{ name: 'Ball', emoji: '⚽' }],
            'Kake': [{ name: 'Kake', emoji: '🍰' }],
            'Måne': [{ name: 'Måne', emoji: '🌙' }],
            'Stjerne': [{ name: 'Stjerne', emoji: '⭐' }],
            'Hjerte': [{ name: 'Hjerte', emoji: '❤️' }],
            'Regnbue': [{ name: 'Regnbue', emoji: '🌈' }],
            'Sky': [{ name: 'Sky', emoji: '☁️' }],
            'Eple': [{ name: 'Eple', emoji: '🍎' }],
            'Katt': [{ name: 'Katt', emoji: '🐱' }],
            'Hund': [{ name: 'Hund', emoji: '🐶' }],
            'Sykkel': [{ name: 'Sykkel', emoji: '🚲' }],
            'Bok': [{ name: 'Bok', emoji: '📖' }],
        }
    }
};

    let currentLevel = parseInt(localStorage.getItem('bokstavspillLevel')) || 1;
    let streak = 0;
    let currentItem = '';
    let currentRoundItem = null;
    let totalStars = parseInt(localStorage.getItem('bokstavspillStars')) || 0;
    let lastItem = '';
    let isProcessing = false;
    let unlockedItems = JSON.parse(localStorage.getItem('bokstavspillUnlocked')) || [];
    let levelProgress = 0;
    
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const letterGrid = document.getElementById('letter-grid');
    const resultDiv = document.getElementById('result');
    const nameDiv = document.getElementById('animal-name');
    const levelText = document.getElementById('level-text');
    const streakText = document.getElementById('streak-text');
    const starsText = document.getElementById('stars-text');
    const levelUpBanner = document.getElementById('level-up-banner');
    const progressBar = document.getElementById('progress-bar');
    const collectionDiv = document.getElementById('collection');
    const hintBtn = document.getElementById('hint-btn');
    
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'no-NO';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }

    function playSfx(type) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
        } else {
            osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2); // A2
        }

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

   function playItemSound(key, item, level) {
       if (!item) return;
        
        let text = item.name;
        if (level === 2) {
            text = `Lyd: ${key}. ${item.name}`;
        } else if (level === 1) {
            text = `${key} er for ${item.name}`;
        } else {
            text = item.name;
        }
        speak(text);
   }

function speakPrompt() {
    const data = currentRoundItem;
    let audioText = currentItem;
    
    if (currentLevel === 1) {
        audioText = `Hvilken bokstav er dette? ${currentItem}`;
    } else if (currentLevel === 2) {
        audioText = data.audioHint ? `Hvilken lyd er dette? ${data.audioHint}` : `Hvilken lyd er dette? ${currentItem}`;
    } else {
        audioText = `Hvilket ord er dette? ${currentItem}`;
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

    // Pick a random item for this key
    const itemOptions = pool[currentItem];
    currentRoundItem = itemOptions[Math.floor(Math.random() * itemOptions.length)];
    
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
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9FF3', '#A29BFE', '#55E6C1'];
        btn.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        btn.style.boxShadow = `0 8px 0 ${colors[Math.floor(Math.random() * colors.length)]}`;

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
            playSfx('correct');
           
           totalStars++;
        localStorage.setItem('bokstavspillStars', totalStars);
        const item = currentRoundItem;
        resultDiv.innerText = item.emoji;

            const unlockId = `${currentItem}_${item.name}`;
            if (!unlockedItems.includes(unlockId)) {
                unlockedItems.push(unlockId);
                localStorage.setItem('bokstavspillUnlocked', JSON.stringify(unlockedItems));
            }
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
        playSfx('wrong');
       const container = document.getElementById('game-container');
       container.classList.add('shake');
       setTimeout(() => container.classList.remove('shake'), 500);
        
        streak = 0;
        updateStatus();
        speak(`Nei, prøv igjen!`);
        setTimeout(() => btn.classList.remove('wrong'), 500);
    }
}

    function updateStatus() {
        levelText.innerText = `Nivå: ${currentLevel} (${levelData[currentLevel].name})`;
        streakText.innerText = `Streak: ${streak} 🔥`;
        starsText.innerText = `Stjerner: ${totalStars} ⭐`;
        updateProgressBar();
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
    localStorage.setItem('bokstavspillLevel', currentLevel);
    streak = 0;
    levelUpBanner.style.display = 'block';
    spawnConfetti();
    speak(`Wow! Du er superflink! Nå går vi opp til nivå ${currentLevel}!`);
    
    setTimeout(() => {
        levelUpBanner.style.display = 'none';
    }, 3000);
}

function updateProgressBar() {
    const pool = levelData[currentLevel].items;
    const total = Object.keys(pool).length;
    const unlockedInLevel = Object.keys(pool).filter(k => {
        return pool[k].some(item => unlockedItems.includes(`${k}_${item.name}`));
    }).length;
    const progress = (unlockedInLevel / total) * 100;
    progressBar.style.width = `${progress}%`;
}

function renderCollection() {
    collectionDiv.innerHTML = '<div style="width:100%; text-align:center; font-weight:bold; margin-bottom:10px; color:#ff69b4;">Min Samling 🦄</div>';
    
    Object.entries(levelData).forEach(([levelStr, levelObj]) => {
        const level = parseInt(levelStr);
        Object.entries(levelObj.items).forEach(([key, items]) => {
            items.forEach(item => {
                const unlockId = `${key}_${item.name}`;
                const div = document.createElement('div');
                div.className = `collection-item ${unlockedItems.includes(unlockId) ? 'unlocked' : ''}`;
                div.innerText = item.emoji;
                div.title = item.name;
                
                if (unlockedItems.includes(unlockId)) {
                    div.style.cursor = 'pointer';
                    div.onclick = () => playItemSound(key, item, level);
                }
                
                collectionDiv.appendChild(div);
            });
        });
    });
}

startBtn.onclick = () => {
    startScreen.style.display = 'none';
    createBackgroundBubbles();
    updateStatus();
    renderCollection();
    nextRound();
};

hintBtn.onclick = () => {
    const data = currentRoundItem;
    if (currentLevel === 1) {
        speak(`Det begynner på ${currentItem}`);
    } else if (currentLevel === 2) {
        speak(`Hør etter: ${data.audioHint || currentItem}`);
    } else {
        speak(`Ordet har ${currentItem.length} bokstaver`);
    }
};
