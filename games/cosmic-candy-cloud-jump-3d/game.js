import * as THREE from 'three';

// --- Game Constants ---
const CLOUD_COUNT = 15;
const CLOUD_SPACING = 6;
const JUMP_FORCE = 0.2;
const GRAVITY = 0.008;
const MOVE_SPEED = 0.15;
const COLORS = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xff69b4];

let scene, camera, renderer, player, clock;
let clouds = [];
let particles = [];
let starField;
let score = 0;
let isGameOver = false;
let velocityY = 0;
let keys = {};

// Initialization
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0033);
    scene.fog = new THREE.FogExp2(0x1a0033, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    createPlayer();
    createStarField();
    createInitialClouds();

    clock = new THREE.Clock();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    animate();
}

function createPlayer() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0xff69b4, 
        shininess: 100 
    });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 2, 0);
    scene.add(player);
}

function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

function createCloud(x, y, z) {
    const cloudGroup = new THREE.Group();
    
    // Make a fluffy cloud using multiple spheres
    const sphereCount = 5;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    for (let i = 0; i < sphereCount; i++) {
        const size = 0.4 + Math.random() * 0.6;
        const geo = new THREE.SphereGeometry(size, 16, 16);
        const mat = new THREE.MeshPhongMaterial({ color: color });
        const sphere = new THREE.Mesh(geo, mat);
        
        sphere.position.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 1.5
        );
        cloudGroup.add(sphere);
    }
    
    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);
    
    return {
        mesh: cloudGroup,
        radius: 1.5,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 0.5 + Math.random() * 0.5
    };
}

function createInitialClouds() {
    for (let i = 0; i < CLOUD_COUNT; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = -i * CLOUD_SPACING;
        const z = (Math.random() - 0.5) * 10;
        clouds.push(createCloud(x, y, z));
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function restartGame() {
    // Clean up
    clouds.forEach(c => scene.remove(c.mesh));
    clouds = [];
    particles.forEach(p => scene.remove(p.mesh));
    particles = [];
    score = 0;
    velocityY = 0;
    isGameOver = false;
    player.position.set(0, 2, 0);
    player.scale.set(1, 1, 1);
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('score').innerText = `Clouds Jumped: ${score}`;
    
    createInitialClouds();
}

function createJumpParticles(position, color) {
    for (let i = 0; i < 12; i++) {
        const geo = new THREE.SphereGeometry(0.1, 4, 4);
        const mat = new THREE.MeshPhongMaterial({ color: color, emissive: color });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        
        particles.push({ mesh: p, velocity: velocity, life: 1.0 });
        scene.add(p);
    }
}

function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Player movement
    if (keys['ArrowUp'] || keys['KeyW']) player.position.z -= MOVE_SPEED;
    if (keys['ArrowDown'] || keys['KeyS']) player.position.z += MOVE_SPEED;
    if (keys['ArrowLeft'] || keys['KeyA']) player.position.x -= MOVE_SPEED;
    if (keys['ArrowRight'] || keys['KeyD']) player.position.x += MOVE_SPEED;

    // Gravity and jump
    velocityY -= GRAVITY;
    player.position.y += velocityY;

    // Collision detection with clouds
    clouds.forEach((cloud, index) => {
        const dist = player.position.distanceTo(cloud.mesh.position);
        if (velocityY < 0 && dist < cloud.radius) {
            velocityY = JUMP_FORCE;
            
            // Sparkle effect!
            const cloudColor = clouds[index].mesh.children[0].material.color;
            createJumpParticles(player.position, cloudColor);
            
            // Squash and stretch effect
            player.scale.set(1.3, 0.7, 1.3);
        }
    });

    // Score tracking based on highest point reached
    const currentCloudIndex = Math.floor(Math.abs(player.position.y) / CLOUD_SPACING);
    if (currentCloudIndex > score) {
        score = currentCloudIndex;
        document.getElementById('score').innerText = `Clouds Jumped: ${score}`;
    }

    // Player scale recovery
    player.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

    // Camera follows player
    camera.position.y = player.position.y + 5;
    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position);

    // Bob clouds and handle particles
    clouds.forEach(cloud => {
        cloud.mesh.position.y += Math.sin(time * cloud.bobSpeed + cloud.bobOffset) * 0.005;
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.velocity);
        p.life -= 0.02;
        p.mesh.scale.setScalar(p.life);
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }

    // Recycle clouds
    clouds.forEach((cloud, index) => {
        if (cloud.mesh.position.y > camera.position.y + 2) {
            const highestCloudY = Math.min(...clouds.map(c => c.mesh.position.y));
            const lowestCloudY = Math.max(...clouds.map(c => c.mesh.position.y));
            
            // Move cloud to below the current lowest cloud
            cloud.mesh.position.y = lowestCloudY - CLOUD_SPACING;
            cloud.mesh.position.x = (Math.random() - 0.5) * 10;
            cloud.mesh.position.z = (Math.random() - 0.5) * 10;
        }
    });

    // Fall off
    if (player.position.y < camera.position.y - 15) {
        isGameOver = true;
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').innerText = `Score: ${score}`;
    }

    renderer.render(scene, camera);
}

// Start the game
init();
