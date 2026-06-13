    <script>
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
            }
        ];

        let currentLevelIdx = 0;
        let cards = [];
        let flippedCards = [];
        let moves = 0;
        let matches = 0;
        let isLockBoard = false;

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

        function initGame() {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const config = levelConfigs[currentLevelIdx];
            document.body.style.backgroundColor = config.bg;
            document.documentElement.style.setProperty('--accent', config.accent);
            document.getElementById('game-title').innerText = config.name;
            document.getElementById('level').textContent = currentLevelIdx + 1;
            
            const grid = document.getElementById('grid');
            grid.innerHTML = '';
            grid.style.gridTemplateColumns = `repeat(${config.grid}, 1fr)`;
            
            cards = [...config.emojis, ...config.emojis];
            shuffle(cards);
            
            moves = 0;
            matches = 0;
            flippedCards = [];
            isLockBoard = false;
            
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

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function flipCard() {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (isLockBoard) return;
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

            const [card1, card2] = flippedCards;
            const isMatch = card1.dataset.emoji === card2.dataset.emoji;

            if (isMatch) {
                disableCards();
            } else {
                unflipCards();
            }
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
                showWinMessage();
            }
        }

        function unflipCards() {
            setTimeout(() => {
                playSound(220, 'sine', 0.2);
                flippedCards.forEach(card => card.classList.remove('flipped'));
                resetBoard();
            }, 1000);
        }

        function resetBoard() {
            flippedCards = [];
            isLockBoard = false;
        }

        function updateStats() {
            document.getElementById('moves').textContent = moves;
            document.getElementById('matches').textContent = matches;
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

        function showWinMessage() {
            const config = levelConfigs[currentLevelIdx];
            const maxMoves = config.emojis.length * 2.5;
            let stars = "⭐";
            if (moves <= config.emojis.length) stars = "⭐⭐⭐";
            else if (moves <= maxMoves) stars = "⭐⭐";

            setTimeout(() => {
                document.getElementById('star-rating').innerText = stars;
                document.getElementById('final-stats').innerText = `Du fant alle parene på ${moves} trekk! 🌟`;
                document.getElementById('win-message').classList.add('show');
                startConfetti();
                playSound(523.25, 'sine', 0.5);
                setTimeout(() => playSound(659.25, 'sine', 0.5), 150);
                setTimeout(() => playSound(783.99, 'sine', 0.5), 300);
                
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

        initGame();
    </script>
</body>
</html>
