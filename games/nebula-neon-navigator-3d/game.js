
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050005);
scene.fog = new THREE.FogExp2(0x050005, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff00ff, 2, 50);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Player (The Neon Ship)
const shipGroup = new THREE.Group();
const shipBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 2, 8),
    new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
);
shipBody.rotation.x = Math.PI / 2;
shipGroup.add(shipBody);

const shipWingL = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff })
);
shipWingL.position.set(-0.5, 0, 0);
shipGroup.add(shipWingL);

const shipWingR = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff })
);
shipWingR.position.set(0.5, 0, 0);
shipGroup.add(shipWingR);

scene.add(shipGroup);

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 2000; i++) {
    starVertices.push((Math.random() - 0.5) * 100);
    starVertices.push((Math.random() - 0.5) * 100);
    starVertices.push((Math.random() - 0.5) * 100);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Collectibles (Neon Shards)
const shards = [];
const shardGeometry = new THREE.OctahedronGeometry(0.4);
const shardMaterials = [
    new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0xff00ff }),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00 }),
    new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffff00 })
];

function createShard() {
    const material = shardMaterials[Math.floor(Math.random() * shardMaterials.length)];
    const shard = new THREE.Mesh(shardGeometry, material);
    shard.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        -Math.random() * 50 - 10
    );
    scene.add(shard);
    shards.push(shard);
}

for (let i = 0; i < 20; i++) {
    createShard();
}

// Obstacles (Neon Walls/Pillars)
const obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x220022 });

function createObstacle() {
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        -Math.random() * 100 - 20
    );
    obstacle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

for (let i = 0; i < 15; i++) {
    createObstacle();
}

// Controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

let score = 0;
let gameOver = false;
let gameSpeed = 0.2;

function resetGame() {
    score = 0;
    gameOver = false;
    gameSpeed = 0.2;
    shipGroup.position.set(0, 0, 0);
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('score').innerText = `Shards: ${score}`;
    
    // Reset shards and obstacles
    shards.forEach(s => scene.remove(s));
    obstacles.forEach(o => scene.remove(o));
    shards.length = 0;
    obstacles.length = 0;
    for (let i = 0; i < 20; i++) createShard();
    for (let i = 0; i < 15; i++) createObstacle();
}

function update() {
    if (gameOver) return;

    // Movement
    if (keys['ArrowUp'] || keys['KeyW']) shipGroup.position.y += 0.1;
    if (keys['ArrowDown'] || keys['KeyS']) shipGroup.position.y -= 0.1;
    if (keys['ArrowLeft'] || keys['KeyA']) shipGroup.position.x -= 0.1;
    if (keys['ArrowRight'] || keys['KeyD']) shipGroup.position.x += 0.1;

    // Boundaries
    shipGroup.position.x = Math.max(-10, Math.min(10, shipGroup.position.x));
    shipGroup.position.y = Math.max(-10, Math.min(10, shipGroup.position.y));

    // Move world towards player
    shards.forEach(shard => {
        shard.position.z += gameSpeed;
        if (shard.position.z > 5) {
            shard.position.z = -60;
            shard.position.x = (Math.random() - 0.5) * 20;
            shard.position.y = (Math.random() - 0.5) * 20;
        }
    });

    obstacles.forEach(obstacle => {
        obstacle.position.z += gameSpeed;
        if (obstacle.position.z > 5) {
            obstacle.position.z = -100;
            obstacle.position.x = (Math.random() - 0.5) * 20;
            obstacle.position.y = (Math.random() - 0.5) * 20;
        }
    });

    // Collision detection
    const shipBox = new THREE.Box3().setFromObject(shipGroup);
    
    shards.forEach((shard, index) => {
        const shardBox = new THREE.Box3().setFromObject(shard);
        if (shipBox.intersectsBox(shardBox)) {
            score++;
            document.getElementById('score').innerText = `Shards: ${score}`;
            shard.position.z = -60;
            shard.position.x = (Math.random() - 0.5) * 20;
            shard.position.y = (Math.random() - 0.5) * 20;
            gameSpeed += 0.002;
        }
    });

    obstacles.forEach(obstacle => {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (shipBox.intersectsBox(obstacleBox)) {
            gameOver = true;
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('final-score').innerText = `You collected ${score} shards!`;
        }
    });

    // Ship Tilt
    shipGroup.rotation.z = - (shipGroup.position.x * 0.05);
    shipGroup.rotation.x = (shipGroup.position.y * 0.05);

    camera.position.z = 5;
    camera.position.x = shipGroup.position.x * 0.5;
    camera.position.y = shipGroup.position.y * 0.5;
    camera.lookAt(shipGroup.position);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

document.getElementById('restart-btn').addEventListener('click', resetGame);

animate();
