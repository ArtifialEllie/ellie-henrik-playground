import * as THREE from 'three';

// --- Game State ---
let score = 0;
let combo = 0;
let comboTimer = 0;
const crystals = [];
const particles = [];
const shipTrail = [];
const crystalCount = 25;
const movementSpeed = 0.2;
const rotationSpeed = 0.03;

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

// Add some "wings" to the ship for more whimsy
const wingGeometry = new THREE.BoxGeometry(1, 0.1, 0.4);
const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x004444 });
const wings = new THREE.Mesh(wingGeometry, wingMaterial);
wings.position.y = -0.2;
shipGroup.add(wings);

scene.add(shipGroup);

// --- Crystals (The Magic Treats) ---
const crystalGeometry = new THREE.OctahedronGeometry(0.4, 0);

function createCrystal(isGolden = false) {
    const material = new THREE.MeshPhongMaterial({ 
        color: isGolden ? 0xffd700 : 0xff00ff, 
        emissive: isGolden ? 0xaa8800 : 0x440044, 
        shininess: 100, 
        transparent: true, 
        opacity: 0.8 
    });
    const crystal = new THREE.Mesh(crystalGeometry, material);
    crystal.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
    );
    crystal.userData = { isGolden, points: isGolden ? 5 : 1, pulseSpeed: Math.random() * 0.05 };
    scene.add(crystal);
    return crystal;
}

for (let i = 0; i < crystalCount; i++) {
    crystals.push(createCrystal(Math.random() > 0.9));
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
    if (keys['KeyW'] || keys['ArrowUp']) shipGroup.translateZ(-movementSpeed);
    if (keys['KeyS'] || keys['ArrowDown']) shipGroup.translateZ(movementSpeed);
    if (keys['KeyA'] || keys['ArrowLeft']) shipGroup.rotation.y += rotationSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) shipGroup.rotation.y -= rotationSpeed;
    
    // Tilt ship for a "whimsical" feel
    if (keys['KeyA'] || keys['ArrowLeft']) shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, 0.3, 0.1);
    else if (keys['KeyD'] || keys['ArrowRight']) shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, -0.3, 0.1);
    else shipGroup.rotation.z = THREE.MathUtils.lerp(shipGroup.rotation.z, 0, 0.1);

    // Add to trail
    shipTrail.push({
        position: shipGroup.position.clone(),
        life: 1.0,
        mesh: createTrailParticle()
    });
}

function createTrailParticle() {
    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(shipGroup.position);
    scene.add(mesh);
    return mesh;
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    updatePlayer();
    
    // Camera follows ship
    const relativeCameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraOffset = relativeCameraOffset.applyMatrix4(shipGroup.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(shipGroup.position);
    
    // Combo Timer
    if (comboTimer > 0) {
        comboTimer -= 0.016; // approx 60fps
        if (comboTimer <= 0) {
            combo = 0;
            updateUI();
        }
    }
    
    // Rotate and pulse crystals
    crystals.forEach((crystal) => {
        crystal.rotation.y += 0.02;
        crystal.rotation.z += 0.01;
        
        // Pulsing effect
        const s = 1 + Math.sin(Date.now() * crystal.userData.pulseSpeed) * 0.2;
        crystal.scale.set(s, s, s);
        
        const distance = shipGroup.position.distanceTo(crystal.position);
        if (distance < 1) {
            // Collection
            combo++;
            comboTimer = 2.0; // 2 seconds to maintain combo
            const pointsGained = crystal.userData.points * (1 + Math.floor(combo / 5) * 0.1);
            score += pointsGained;
            
            updateUI();
            
            // Reposition crystal
            crystal.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
            
            // Visual feedback
            shipBody.material.emissive.setHex(crystal.userData.isGolden ? 0xffd700 : 0x00ff00);
            setTimeout(() => shipBody.material.emissive.setHex(0x00ffff), 100);
            spawnParticles(crystal.position, crystal.userData.isGolden ? 0xffd700 : 0xff00ff);
        }
    });
    
    // Update trail
    for (let i = shipTrail.length - 1; i >= 0; i--) {
        const t = shipTrail[i];
        t.life -= 0.02;
        t.mesh.material.opacity = t.life;
        t.mesh.scale.setScalar(t.life);
        if (t.life <= 0) {
            scene.remove(t.mesh);
            shipTrail.splice(i, 1);
        }
    }
    
    // Update particles
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
    
    renderer.render(scene, camera);
}

function updateUI() {
    document.getElementById('score').innerText = `Crystals: ${Math.floor(score)}`;
    const comboEl = document.getElementById('combo');
    if (combo > 1) {
        comboEl.innerText = `COMBO x${combo}! ✨`;
        comboEl.style.display = 'block';
    } else {
        comboEl.style.display = 'none';
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

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
