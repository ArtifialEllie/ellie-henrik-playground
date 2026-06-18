import * as THREE from 'three';

// Game State
const state = {
    score: 0,
    stars: [],
    playerPos: { x: 0, y: 0 },
    speed: 0.2,
    spawnRate: 1000, // ms
    lastSpawn: 0,
    colors: [0xff00ff, 0x00ffff, 0xffff00, 0xff00ff, 0x00ff00, 0xffa500],
};

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Player (The "Magic Wand" / Collector)
const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const playerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff, 
    emissive: 0x00ffff, 
    emissiveIntensity: 1 
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Background Stars
const bgStarsGeometry = new THREE.BufferGeometry();
const bgStarsCount = 1000;
const bgStarsPositions = new Float32Array(bgStarsCount * 3);
for (let i = 0; i < bgStarsCount * 3; i++) {
    bgStarsPositions[i] = (Math.random() - 0.5) * 100;
}
bgStarsGeometry.setAttribute('position', new THREE.BufferAttribute(bgStarsPositions, 3));
const bgStarsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const bgStarsPoints = new THREE.Points(bgStarsGeometry, bgStarsMaterial);
scene.add(bgStarsPoints);

camera.position.z = 10;

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function spawnStar() {
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    const material = new THREE.MeshPhongMaterial({ 
        color: state.colors[Math.floor(Math.random() * state.colors.length)],
        emissive: 0x222222
    });
    const star = new THREE.Mesh(geometry, material);
    
    star.position.set(
        (Math.random() - 0.5) * 15,
        10,
        (Math.random() - 0.5) * 5
    );
    
    scene.add(star);
    state.stars.push(star);
}

function update(time) {
    // Player Movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.position.x -= state.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.position.x += state.speed;
    if (keys['ArrowUp'] || keys['KeyW']) player.position.y += state.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.position.y -= state.speed;

    // Boundary check
    player.position.x = Math.max(-8, Math.min(8, player.position.x));
    player.position.y = Math.max(-5, Math.min(5, player.position.y));

    // Spawn stars
    if (time - state.lastSpawn > state.spawnRate) {
        spawnStar();
        state.lastSpawn = time;
    }

    // Update stars
    for (let i = state.stars.length - 1; i >= 0; i--) {
        const star = state.stars[i];
        star.position.y -= 0.05;
        star.rotation.x += 0.02;
        star.rotation.y += 0.02;

        // Collision detection
        const dist = player.position.distanceTo(star.position);
        if (dist < 0.8) {
            state.score++;
            document.getElementById('score').innerText = state.score;
            
            // Simple "Symphony" effect - change player color momentarily
            player.material.emissive.setHex(star.material.color);
            setTimeout(() => player.material.emissive.setHex(0x00ffff), 200);
            
            scene.remove(star);
            state.stars.splice(i, 1);
        }

        // Remove off-screen stars
        if (star.position.y < -6) {
            scene.remove(star);
            state.stars.splice(i, 1);
        }
    }

    // Gently move the camera to follow the player a bit
    camera.position.x += (player.position.x * 0.2 - camera.position.x) * 0.05;
    camera.position.y += (player.position.y * 0.2 - camera.position.y) * 0.05;
}

function animate(time) {
    requestAnimationFrame(animate);
    update(time);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
