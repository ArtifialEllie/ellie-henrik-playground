import * as THREE from 'three';

// --- Game Configuration ---
const CONFIG = {
    playerSpeed: 0.2,
    rotationSpeed: 0.03,
    crystalCount: 20,
    spawnRange: 100,
    obstacleCount: 15,
    gameDuration: 60, // seconds
};

let scene, camera, renderer, player, crystals = [], obstacles = [];
let score = 0;
let gameActive = true;
let keys = {};

// --- Initialization ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.FogExp2(0x050010, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x00ffff, 2, 100);
    blueLight.position.set(-10, -10, -10);
    scene.add(blueLight);

    // Player (A cute neon spaceship)
    const shipGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const shipMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff, 
        emissive: 0x00ffff, 
        emissiveIntensity: 0.5,
        shininess: 100 
    });
    player = new THREE.Mesh(shipGeometry, shipMaterial);
    player.rotation.x = Math.PI / 2;
    scene.add(player);

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        starVertices.push((Math.random() - 0.5) * 1000);
        starVertices.push((Math.random() - 0.5) * 1000);
        starVertices.push((Math.random() - 0.5) * 1000);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Spawn Crystals
    spawnCrystals();
    // Spawn Obstacles
    spawnObstacles();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    animate();
}

function spawnCrystals() {
    const crystalGeometry = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMaterials = [
        new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.5 }),
        new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 }),
        new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5 }),
    ];

    for (let i = 0; i < CONFIG.crystalCount; i++) {
        const material = crystalMaterials[Math.floor(Math.random() * crystalMaterials.length)];
        const crystal = new THREE.Mesh(crystalGeometry, material);
        crystal.position.set(
            (Math.random() - 0.5) * CONFIG.spawnRange * 2,
            (Math.random() - 0.5) * CONFIG.spawnRange * 2,
            (Math.random() - 0.5) * CONFIG.spawnRange * 2
        );
        crystals.push(crystal);
        scene.add(crystal);
    }
}

function spawnObstacles() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
    const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x220022 });
    
    for (let i = 0; i < CONFIG.obstacleCount; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            (Math.random() - 0.5) * CONFIG.spawnRange * 2,
            (Math.random() - 0.5) * CONFIG.spawnRange * 2,
            (Math.random() - 0.5) * CONFIG.spawnRange * 2
        );
        // Avoid spawning too close to player
        if (obstacle.position.distanceTo(player.position) < 10) {
            obstacle.position.x += 20;
        }
        obstacles.push(obstacle);
        scene.add(obstacle);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer() {
    if (!gameActive) return;

    // Movement
    if (keys['KeyW'] || keys['ArrowUp']) {
        player.translateZ(-CONFIG.playerSpeed);
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        player.translateZ(CONFIG.playerSpeed);
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.translateX(-CONFIG.playerSpeed);
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.translateX(CONFIG.playerSpeed);
    }
    
    // Rotation (Simple tilt/steer)
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.rotation.y += CONFIG.rotationSpeed;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.rotation.y -= CONFIG.rotationSpeed;
    }

    // Camera follows player
    const relativeCameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraOffset = relativeCameraOffset.applyMatrix4(player.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(player.position);
}

function checkCollisions() {
    if (!gameActive) return;

    // Crystals
    crystals.forEach((crystal, index) => {
        if (player.position.distanceTo(crystal.position) < 1.5) {
            score++;
            document.getElementById('score').innerText = score;
            
            // Move crystal to new random position
            crystal.position.set(
                (Math.random() - 0.5) * CONFIG.spawnRange * 2,
                (Math.random() - 0.5) * CONFIG.spawnRange * 2,
                (Math.random() - 0.5) * CONFIG.spawnRange * 2
            );
            
            // Little "pop" effect could be added here
        }
    });

    // Obstacles
    obstacles.forEach(obstacle => {
        if (player.position.distanceTo(obstacle.position) < 2) {
            endGame();
        }
    });
}

function endGame() {
    gameActive = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('message').innerText = "💥 CRASHED!";
}

function restartGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('message').innerText = "Use WASD or Arrow Keys to Fly! 🌟";
    
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    player.rotation.x = Math.PI / 2;
    
    gameActive = true;
}

function animate() {
    if (gameActive) {
        updatePlayer();
        checkCollisions();
    }

    // Animate crystals (rotating them)
    crystals.forEach(crystal => {
        crystal.rotation.y += 0.02;
        crystal.rotation.x += 0.01;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start the game
init();

// Attach restart button
document.getElementById('restart-btn').addEventListener('click', restartGame);
