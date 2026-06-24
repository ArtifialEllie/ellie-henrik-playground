
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
pointLight2.position.set(-10, -10, -10);
scene.add(pointLight2);

// Player
const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const playerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff, 
    emissive: 0x00ffff, 
    shininess: 100 
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Background Stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const starVertices = [];
for (let i = 0; i < 1000; i++) {
    starVertices.push((Math.random() - 0.5) * 100);
    starVertices.push((Math.random() - 0.5) * 100);
    starVertices.push((Math.random() - 0.5) * 100);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Notes
const notes = [];
const noteGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100);
const noteColors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff0000];

function spawnNote() {
    const material = new THREE.MeshPhongMaterial({ 
        color: noteColors[Math.floor(Math.random() * noteColors.length)],
        emissive: noteColors[Math.floor(Math.random() * noteColors.length)],
        shininess: 100 
    });
    const note = new THREE.Mesh(noteGeometry, material);
    note.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
    );
    scene.add(note);
    notes.push(note);
}

for (let i = 0; i < 10; i++) {
    spawnNote();
}

// Input
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Game State
let score = 0;
let timeLeft = 60;
let gameActive = true;

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

function updateUI() {
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
}

function endGame() {
    gameActive = false;
    gameOverEl.classList.remove('hidden');
    finalScoreEl.innerText = score;
}

restartBtn.addEventListener('click', () => {
    location.reload();
});

// Main Loop
function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);

    // Player Movement
    const speed = 0.15;
    if (keys['ArrowUp'] || keys['KeyW']) player.position.y += speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.position.y -= speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.position.x -= speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.position.x += speed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) player.position.z -= speed;
    if (keys['ControlLeft'] || keys['ControlRight']) player.position.z += speed;

    // Camera follow
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 2;
    camera.position.z = player.position.z + 5;
    camera.lookAt(player.position);

    // Notes rotation and collision
    notes.forEach((note, index) => {
        note.rotation.x += 0.02;
        note.rotation.y += 0.02;

        const dist = player.position.distanceTo(note.position);
        if (dist < 1) {
            scene.remove(note);
            notes.splice(index, 1);
            score++;
            updateUI();
            spawnNote();
            
            // Subtle "pop" effect (visual only)
            player.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => player.scale.set(1, 1, 1), 100);
        }
    });

    // Timer
    // We'll use a simple frame-based timer for now, or setInterval
    renderer.render(scene, camera);
}

// Timer interval
setInterval(() => {
    if (gameActive) {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            endGame();
        }
    }
}, 1000);

animate();
renderer.render(scene, camera);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
});
