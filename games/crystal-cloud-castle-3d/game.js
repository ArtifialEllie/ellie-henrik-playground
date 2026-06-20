import * as THREE from 'three';

// Game State
const state = {
    score: 0,
    totalCrystals: 10,
    crystals: [],
    keys: {},
    player: {
        pos: new THREE.Vector3(0, 2, 10),
        vel: new THREE.Vector3(0, 0, 0),
        speed: 0.15,
        friction: 0.92
    }
};

// Setup Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa1c4fd);
scene.fog = new THREE.Fog(0xa1c4fd, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Player (A cute sparkly orb)
const playerGeo = new THREE.SphereGeometry(0.5, 32, 32);
const playerMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5,
    shininess: 100
});
const playerMesh = new THREE.Mesh(playerGeo, playerMat);
scene.add(playerMesh);

// Floor / Cloud Base
const cloudGeo = new THREE.PlaneGeometry(100, 100);
const cloudMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6
});
const cloudFloor = new THREE.Mesh(cloudGeo, cloudMat);
cloudFloor.rotation.x = -Math.PI / 2;
scene.add(cloudFloor);

// Decorative Clouds (Random fluffies)
function createCloud() {
    const group = new THREE.Group();
    const count = 3 + Math.floor(Math.random() * 4);
    const size = 1 + Math.random() * 2;
    for (let i = 0; i < count; i++) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(size, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
        );
        sphere.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        group.add(sphere);
    }
    return group;
}

for (let i = 0; i < 40; i++) {
    const cloud = createCloud();
    cloud.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() * 5),
        (Math.random() - 0.5) * 60
    );
    scene.add(cloud);
}

// Crystals
const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xffa500];

function spawnCrystal() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(crystalGeo, mat);
    mesh.position.set(
        (Math.random() - 0.5) * 30,
        1,
        (Math.random() - 0.5) * 30
    );
    return mesh;
}

for (let i = 0; i < state.totalCrystals; i++) {
    const crystal = spawnCrystal();
    scene.add(crystal);
    state.crystals.push(crystal);
}

// Input
window.addEventListener('keydown', (e) => state.keys[e.code] = true);
window.addEventListener('keyup', (e) => state.keys[e.code] = false);

// Game Loop
function update() {
    // Movement
    if (state.keys['KeyW'] || state.keys['ArrowUp']) state.player.vel.z -= state.player.speed;
    if (state.keys['KeyS'] || state.keys['ArrowDown']) state.player.vel.z += state.player.speed;
    if (state.keys['KeyA'] || state.keys['ArrowLeft']) state.player.vel.x -= state.player.speed;
    if (state.keys['KeyD'] || state.keys['ArrowRight']) state.player.vel.x += state.player.speed;

    state.player.vel.multiplyScalar(state.player.friction);
    state.player.pos.add(state.player.vel);
    
    playerMesh.position.copy(state.player.pos);

    // Camera follow
    camera.position.lerp(new THREE.Vector3(
        state.player.pos.x,
        state.player.pos.y + 5,
        state.player.pos.z + 10
    ), 0.1);
    camera.lookAt(state.player.pos);

    // Crystals rotation and collection
    state.crystals.forEach((crystal, index) => {
        crystal.rotation.y += 0.02;
        crystal.rotation.z += 0.01;

        const dist = state.player.pos.distanceTo(crystal.position);
        if (dist < 1.0) {
            scene.remove(crystal);
            state.crystals.splice(index, 1);
            state.score++;
            document.getElementById('score').innerText = state.score;
            
            if (state.score === state.totalCrystals) {
                document.getElementById('msg').innerText = "YAY! You collected all the crystals! ✨🌈";
                document.getElementById('msg').style.color = "#ffeb3b";
                document.getElementById('msg').style.fontSize = "24px";
                document.getElementById('msg').style.fontWeight = "bold";
            }
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

update();
