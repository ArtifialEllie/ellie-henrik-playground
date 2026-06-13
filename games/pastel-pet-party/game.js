    <script>
        const holes = document.querySelectorAll('.hole');
        const pets = document.querySelectorAll('.pet');
        const scoreBoard = document.querySelector('#score');
        const timerBoard = document.querySelector('#timer');
        const startBtn = document.querySelector('#start-btn');
        const overlay = document.querySelector('#overlay');
        const finalScoreBoard = document.querySelector('#final-score');

        let score = 0;
        let lastHole;
        let timeUp = false;
        let timeLeft = 30;
        let timerInterval;

        const petEmojis = ['🐶', '🐱', '🐰', '🐹', '🦊', '🐼', '🐨', '🐯', '🦁'];

        function randomTime(min, max) {
            return Math.round(Math.random() * (max - min) + min);
        }

        function randomHole(holes) {
            const idx = Math.floor(Math.random() * holes.length);
            const hole = holes[idx];
            if (hole === lastHole) {
                return randomHole(holes);
            }
            lastHole = hole;
            return hole;
        }

        function peep() {
            const time = randomTime(600, 1200);
            const hole = randomHole(holes);
            const pet = hole.querySelector('.pet');
            
            // Randomize the pet emoji for extra cuteness
            pet.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)];
            
            pet.classList.add('up');
            
            setTimeout(() => {
                pet.classList.remove('up');
                if (!timeUp) peep();
            }, time);
        }

        function startGame() {
            score = 0;
            timeLeft = 30;
            scoreBoard.textContent = 0;
            timerBoard.textContent = timeLeft;
            timeUp = false;
            startBtn.style.display = 'none';
            
            peep();
            
            timerInterval = setInterval(() => {
                timeLeft--;
                timerBoard.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timeUp = true;
                    showGameOver();
                }
            }, 1000);
        }

        function showGameOver() {
            finalScoreBoard.textContent = score;
            overlay.classList.add('show');
        }

        function createParticles(x, y) {
            const colors = ['#ffb7ce', '#b2e2f2', '#fdfd96', '#ffeb3b', '#e1bee7'];
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                const tx = (Math.random() - 0.5) * 100 + 'px';
                const ty = (Math.random() - 0.5) * 100 + 'px';
                particle.style.setProperty('--tx', tx);
                particle.style.setProperty('--ty', ty);
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
            }
        }

        function createFloatingText(x, y, text) {
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.textContent = text;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }

        function bonk(e) {
            if (!e.isTrusted) return; // Cheating!
            if (!this.classList.contains('up')) return;
            
            score++;
            this.classList.remove('up');
            scoreBoard.textContent = score;
            
            // Juice!
            createParticles(e.pageX, e.pageY);
            const texts = ['Yum!', 'So Cute!', '✨', 'Treat!', 'Yay!'];
            createFloatingText(e.pageX, e.pageY, texts[Math.floor(Math.random() * texts.length)]);
            
            // Slight screen shake
            document.body.style.transform = `translate(${(Math.random()-0.5)*5}px, ${(Math.random()-0.5)*5}px)`;
            setTimeout(() => document.body.style.transform = 'none', 50);
        }

        pets.forEach(pet => pet.addEventListener('click', bonk));
        startBtn.addEventListener('click', startGame);

    </script>
</body>
</html>
