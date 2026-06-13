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
let isFrenzy = false;
let frenzyMultiplier = 1;

const petEmojis = ['🐶', '🐱', '🐰', '🐹', '🦊', '🐼', '🐨', '🐯', '🦁'];
const goldenPetEmoji = '⭐';

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
    const isGolden = Math.random() < 0.1; // 10% chance for a golden pet
    
    // During frenzy, pets appear and disappear much faster!
    const minT = isFrenzy ? 200 : (isGolden ? 300 : 600);
    const maxT = isFrenzy ? 500 : (isGolden ? 600 : 1200);
    const time = randomTime(minT, maxT);
    
    const hole = randomHole(holes);
    const pet = hole.querySelector('.pet');
    
    if (isGolden) {
        pet.textContent = goldenPetEmoji;
        pet.classList.add('golden');
    } else {
        pet.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)];
        pet.classList.remove('golden');
    }
    
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
        
        // Randomly trigger Frenzy Mode!
        if (!isFrenzy && Math.random() < 0.05 && timeLeft < 25) {
            triggerFrenzy();
        }

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

function triggerFrenzy() {
    isFrenzy = true;
    frenzyMultiplier = 2;
    document.body.classList.add('frenzy');
    createFloatingText(window.innerWidth/2, window.innerHeight/2, '🌈 FRENZY MODE! 🌈');
    
    setTimeout(() => {
        isFrenzy = false;
        frenzyMultiplier = 1;
        document.body.classList.remove('frenzy');
    }, 5000);
}

function createParticles(x, y, isGolden = false) {
    const colors = isGolden 
        ? ['#ffd700', '#fffacd', '#ffff00', '#ffef00', '#fdfd96'] 
        : ['#ffb7ce', '#b2e2f2', '#fdfd96', '#ffeb3b', '#e1bee7'];
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const tx = (Math.random() - 0.5) * 120 + 'px';
        const ty = (Math.random() - 0.5) * 120 + 'px';
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
    
    const isGolden = this.classList.contains('golden');
    const points = (isGolden ? 5 : 1) * frenzyMultiplier;
    
    score += points;
    this.classList.remove('up');
    scoreBoard.textContent = score;
    
    // Juice!
    createParticles(e.pageX, e.pageY, isGolden);
    
    const texts = isGolden 
        ? ['GOLDEN!', 'JACKPOT!', '✨ SUPER ✨', 'MAGIC!', 'WOW!'] 
        : (isFrenzy ? ['FRENZY!', 'FAST!', 'ZOOM!', 'WOW!'] : ['Yum!', 'So Cute!', '✨', 'Treat!', 'Yay!']);
        
    createFloatingText(e.pageX, e.pageY, texts[Math.floor(Math.random() * texts.length)]);
    
    // Slight screen shake
    document.body.style.transform = `translate(${(Math.random()-0.5)*5}px, ${(Math.random()-0.5)*5}px)`;
    setTimeout(() => document.body.style.transform = 'none', 50);
}

pets.forEach(pet => pet.addEventListener('click', bonk));
startBtn.addEventListener('click', startGame);
