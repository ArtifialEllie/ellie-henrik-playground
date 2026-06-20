/**
 * Floating Flower Fantasy 3D ✨🌸
 * A whimsical 3D flower collecting game!
 */

let scene, camera, renderer, player, flowers = [], score = 0;
let keys = {};

const FLOWER_COUNT = 20;
const PLAYER_SPEED = 0.15;
const WORLD_SIZE = 20;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffb6c1); // Light pink background
    scene.fog = new THREE.FogExp2(0xffb6c1, 0.05);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Player - A cute floating sphere (representing a seed or a bubble)
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xffeeaa, emissive: 0xffeeaa, emissiveIntensity: 0.5 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0, 0);
    scene.add(player);

    // Create Flowers
    for (let i = 0; i < FLOWER_COUNT; i++) {
        createFlower();
    }

    // Input listeners
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function createFlower() {
    const group = new THREE.Group();
    
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
    const stemMat = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = -0.25;
    group.add(stem);

    // Petals
    const petalGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const petalMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`) });
    
    for (let i = 0; i < 5; i++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (i / 5) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2);
        petal.scale.set(1, 0.2, 1);
        group.add(petal);
    }

    // Center
    const centerGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const centerMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    group.add(center);

    group.position.set(
        (Math.random() - 0.5) * WORLD_SIZE * 2,
        (Math.random() - 0.5) * WORLD_SIZE,
        (Math.random() - 0.5) * WORLD_SIZE * 2
    );
    
    // Give it a little floating animation property
    group.userData = {
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.02 + Math.random() * 0.03
    };

    scene.add(group);
    flowers.push(group);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer() {
    if (keys['KeyW'] || keys['ArrowUp']) player.position.z -= PLAYER_SPEED;
    if (keys['KeyS'] || keys['ArrowDown']) player.position.z += PLAYER_SPEED;
    if (keys['KeyA'] || keys['ArrowLeft']) player.position.x -= PLAYER_SPEED;
    if (keys['KeyD'] || keys['ArrowRight']) player.position.x += PLAYER_SPEED;

    // Boundary checks
    player.position.x = Math.max(-WORLD_SIZE, Math.min(WORLD_SIZE, player.position.x));
    player.position.z = Math.max(-WORLD_SIZE, Math.min(WORLD_SIZE, player.position.z));
    player.position.y = Math.max(-WORLD_SIZE/2, Math.min(WORLD_SIZE/2, player.position.y));

    // Smooth camera follow
    const targetPosition = new THREE.Vector3(player.position.x, player.position.y + 5, player.position.z + 10);
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(player.position);
}

function animate() {
    requestAnimationFrame(animate);

    updatePlayer();

    // Animate Flowers
    flowers.forEach((flower, index) => {
        flower.position.y += Math.sin(Date.now() * 0.001 + flower.userData.floatOffset) * 0.01;
        flower.rotation.y += 0.01;

        // Collision detection
        const dist = player.position.distanceTo(flower.position);
        if (dist < 1) {
            // Collect flower!
            score++;
            document.getElementById('score').innerText = score;
            
            // Reset flower position
            flower.position.set(
                (Math.random() - 0.5) * WORLD_SIZE * 2,
                (Math.random() - 0.5) * WORLD_SIZE,
                (Math.random() - 0.5) * WORLD_SIZE * 2
            );
            
            // Flash player color briefly
            player.material.emissiveIntensity = 2;
            setTimeout(() => player.material.emissiveIntensity = 0.5, 200);
        }
    });

    renderer.render(scene, camera);
}

init();
