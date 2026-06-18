import * as THREE from 'three';

// --- Game State ---
let score = 0;
let combo = 0;
let comboTimer = 0;
const crystals = [];
const particles = [];
const shipTrail = [];
const spaceDust = [];
const nebulaClouds = [];
const crystalCount = 30;
const voidCrystalCount = 10;
let movementSpeed = 0.2;
const baseMovementSpeed = 0.2;
const turboSpeed = 0.5;
const rotationSpeed = 0.03;
let isTurbo = false;
let gameWon = false;
const winScore = 100;

// --- Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.FogExp2(0x050510, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff00ff, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const blueLight = new THREE.PointLight(0x00ffff, 2, 50);
blueLight.position.set(-5, -5, -5);
scene.add(blueLight);

// --- Player (The Sparkle-Ship) ---
const shipGroup = new THREE.Group();
const shipBodyGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
const shipMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff, 
    emissive: 0x00ffff, 
    shininess: 100 
});
const shipBody = new THREE.Mesh(shipBodyGeometry, shipMaterial);
shipBody.rotation.x = Math.PI / 2; 
shipGroup.add(shipBody);

const wingGeometry = new THREE.BoxGeometry(1, 0.1, 0.4);
const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x004444 });
const wings = new THREE.Mesh(wingGeometry, wingMaterial);
wings.position.y = -0.2;
shipGroup.add(wings);

scene.add(shipGroup);

// --- Nebula & Space Dust ---
function createNebula() {
    for (let i = 0; i < 8; i++) {
        const geo = new THREE.SphereGeometry(Math.random() * 10 + 5, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.5, 0.1), 
            transparent: true, 
            opacity: 0.05 
        });
        const cloud = new THREE.Mesh(geo, mat);
        cloud.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        scene.add(cloud);
        nebulaClouds.push(cloud);
    }
}
createNebula();

function createSpaceDust() {
    const geo = new THREE.BufferGeometry();
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 100;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 });
    const dust = new THREE.Points(geo, mat);
    scene.add(dust);
    spaceDust.push(dust);
}
createSpaceDust();

// --- Crystals (The Magic Treats) ---
const crystalGeometry = new THREE.OctahedronGeometry(0.4, 0);

function createCrystal(isGolden = false) {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ 
        color: isGolden ? 0xffd700 : 0xff00ff, 
        emissive: isGolden ? 0xaa8800 : 0x440044, 
        shininess: 100, 
        transparent: true, 
        opacity: 0.8 
    });
    const crystal = new THREE.Mesh(crystalGeometry, material);
    group.add(crystal);

    // Add a whimsical ring
    const ringGeo = new THREE.TorusGeometry(0.6, 0.02, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: isGolden ? 0xffffff : 0x00ffff, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
    );
    group.userData = { isGolden, points: isGolden ? 5 : 1, pulseSpeed: Math.random() * 0.05 };
    scene.add(group);
    return group;
}

for (let i = 0; i < crystalCount; i++) {
    crystals.push(createCrystal(Math.random() > 0.9));
}

// --- Void Crystals (The Grumpy Space-Rocks) ---
const voidCrystalGeometry = new THREE.IcosahedronGeometry(0.5, 0);
const voidCrystals = [];

function createVoidCrystal() {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x110022, 
        emissive: 0x000000, 
        shininess: 10, 
        transparent: true, 
        opacity: 0.9 
    });
    const crystal = new THREE.Mesh(voidCrystalGeometry, material);
    group.add(crystal);

    group.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
    );
    group.userData = { pulseSpeed: Math.random() * 0.03 };
    scene.add(group);
    return group;
}

for (let i = 0; i < voidCrystalCount; i++) {
    voidCrystals.push(createVoidCrystal());
}

// --- Starry Background ---
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const starVertices = [];
for (let i = 0; i < 3000; i++) {
    starVertices.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- Controls ---
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function updatePlayer() {
    isTurbo = keys['ShiftLeft'] || keys['ShiftRight'];
    movementSpeed = isTurbo ? turboSpeed : baseMovementSpeed;

    if (keys['KeyW'] || keys['ArrowUp']) shipGroup.translateZ(-movementSpeed);
    if (keys['KeyS'] || keys['ArrowDown']) shipGroup.translateZ(movementSpeed);
    if (keys['KeyA'] || keys['ArrowLeft']) shipGroup.rotation.y += rotationSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) shipGroup.rotation.y -= rotationSpeed;
    
    if (keys['KeyA'] || keys['ArrowLeft']) shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, 0.3, 0.1);
    else if (keys['KeyD'] || keys['ArrowRight']) shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, -0.3, 0.1);
    else shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, 0, 0.1);

    // Turbo effect: shrink ship slightly and increase trail frequency
    const scale = isTurbo ? 0.9 : 1.0;
    shipGroup.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

    const trailInterval = isTurbo ? 1 : 2;
    if (Math.floor(Date.now() / 16) % trailInterval === 0) {
        shipTrail.push({
            position: shipGroup.position.clone(),
            life: 1.0,
            mesh: createTrailParticle()
        });
    }
}

function createTrailParticle() {
    const geo = new THREE.SphereGeometry(0.06, 4, 4);
    const hue = (Date.now() * 0.001) % 1;
    const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
    const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(shipGroup.position);
    scene.add(mesh);
    return mesh;
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    updatePlayer();
    
    // --- Turbo Warp Effect ---
    const targetFov = isTurbo ? 90 : 75;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
    camera.updateProjectionMatrix();

    const relativeCameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraOffset = relativeCameraOffset.applyMatrix4(shipGroup.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(shipGroup.position);
    
    if (comboTimer > 0) {
        comboTimer -= 0.016; 
        if (comboTimer <= 0) {
            combo = 0;
            updateUI();
        }
    }
    
    nebulaClouds.forEach(cloud => {
        cloud.rotation.y += 0.001;
    });

    crystals.forEach((group) => {
        group.rotation.y += 0.02;
        group.rotation.z += 0.01;
        
        const s = 1 + Math.sin(Date.now() * group.userData.pulseSpeed) * 0.2;
        group.scale.set(s, s, s);
        
        const distance = shipGroup.position.distanceTo(group.position);
        if (distance < 1.2) {
            combo++;
            comboTimer = 2.0;
            const pointsGained = group.userData.points * (1 + Math.floor(combo / 5) * 0.1);
            score += pointsGained;
            
            updateUI();
            
            group.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
            
            shipBody.material.emissive.setHex(group.userData.isGolden ? 0xffd700 : 0x00ff00);
            setTimeout(() => shipBody.material.emissive.setHex(0x00ffff), 100);
            spawnParticles(group.position, group.userData.isGolden ? 0xffd700 : 0xff00ff);
        }
    });
    
    for (let i = shipTrail.length - 1; i >= 0; i--) {
    // --- Void Crystal Logic ---
    voidCrystals.forEach((group) => {
        group.rotation.x += 0.01;
        group.rotation.z += 0.01;
        
        const s = 1 + Math.sin(Date.now() * group.userData.pulseSpeed) * 0.1;
        group.scale.set(s, s, s);

        const distance = shipGroup.position.distanceTo(group.position);
        if (distance < 1.5) {
            combo = 0;
            score = Math.max(0, score - 2);
            updateUI();
            
            group.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            );
            
            shipBody.material.emissive.setHex(0xff0000);
            setTimeout(() => shipBody.material.emissive.setHex(0x00ffff), 200);
            spawnParticles(group.position, 0x440044);
        }
    });

    for (let i = shipTrail.length - 1; i >= 0; i--) {
        const t = shipTrail[i];
        t.life -= 0.03;
        t.mesh.material.opacity = t.life;
        t.mesh.scale.setScalar(t.life);
        if (t.life <= 0) {
            scene.remove(t.mesh);
            shipTrail.splice(i, 1);
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.velocity);
        p.velocity.multiplyScalar(0.98);
        p.life -= 0.02;
        p.mesh.material.opacity = p.life;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }
    
    if (score >= winScore && !gameWon) {
        gameWon = true;
        triggerWinCelebration();
    }
    
    renderer.render(scene, camera);
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    scoreEl.innerText = `Crystals: ${Math.floor(score)} / ${winScore}`;
    
    // Add a little "pop" effect to score
    scoreEl.style.transform = 'scale(1.2)';
    setTimeout(() => scoreEl.style.transform = 'scale(1)', 100);

    const comboEl = document.getElementById('combo');
    if (combo > 1) {
        comboEl.innerText = `COMBO x${combo}! ✨`;
        comboEl.style.display = 'block';
        comboEl.style.animation = 'bounce 0.5s infinite';
    } else {
        comboEl.style.display = 'none';
    }
}

function triggerWinCelebration() {
    const instructions = document.getElementById('instructions');
    instructions.innerText = "YOU ARE A COSMIC MASTER! 🌟✨🌈";
    instructions.style.fontSize = "30px";
    instructions.style.color = "#ffff00";
    instructions.style.textShadow = "0 0 20px #ffff00";

    // Burst of particles
    for (let i = 0; i < 100; i++) {
        spawnParticles(shipGroup.position, new THREE.Color().setHSL(Math.random(), 1, 0.5));
    }
}

function spawnParticles(position, color) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true });
    for (let i = 0; i < 15; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
        scene.add(particle);
        particles.push({ mesh: particle, velocity: velocity, life: 1.0 });
    }
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
