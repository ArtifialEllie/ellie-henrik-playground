import * as THREE from 'three';

// --- Game State ---
let score = 0;
const crystals = [];
const particles = [];
const crystalCount = 20;
const movementSpeed = 0.2;
const rotationSpeed = 0.03;

// --- Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b1a);
scene.fog = new THREE.FogExp2(0x0b0b1a, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
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
const shipGeometry = new THREE.ConeGeometry(0.5, 1.2, 8);
const shipMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff, 
    emissive: 0x00ffff, 
    shininess: 100 
});
const ship = new THREE.Mesh(shipGeometry, shipMaterial);
ship.rotation.x = Math.PI / 2; // Point forward
scene.add(ship);

// --- Crystals (The Magic Treats) ---
const crystalGeometry = new THREE.OctahedronGeometry(0.4, 0);
const crystalMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff00ff, 
    emissive: 0x440044, 
    shininess: 100, 
    transparent: true, 
    opacity: 0.8 
});

for (let i = 0; i < crystalCount; i++) {
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
    );
    scene.add(crystal);
    crystals.push(crystal);
}

// --- Starry Background ---
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const starVertices = [];
for (let i = 0; i < 2000; i++) {
    starVertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- Controls ---
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = true; }); // Fixed to false in logic below but let's be careful
// Correction:
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function updatePlayer() {
    if (keys['KeyW'] || keys['ArrowUp']) ship.translateZ(-movementSpeed);
    if (keys['KeyS'] || keys['ArrowDown']) ship.translateZ(movementSpeed);
    if (keys['KeyA'] || keys['ArrowLeft']) ship.rotation.y += rotationSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) ship.rotation.y -= rotationSpeed;
    
    // Tilt ship based on rotation for a more "whimsical" feel
    if (keys['KeyA'] || keys['ArrowLeft']) ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, 0.3, 0.1);
    else if (keys['KeyD'] || keys['ArrowRight']) ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, -0.3, 0.1);
    else ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, 0, 0.1);
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    updatePlayer();
    
    // Camera follows ship
    const relativeCameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraOffset = relativeCameraOffset.applyMatrix4(ship.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(ship.position);
    
    // Rotate and pulse crystals
    crystals.forEach((crystal, index) => {
        crystal.rotation.y += 0.02;
        crystal.rotation.z += 0.01;
        
        // Simple distance check for collision
        const distance = ship.position.distanceTo(crystal.position);
        if (distance < 1) {
            // "Collect" the crystal
            score++;
            document.getElementById('score').innerText = `Crystals: ${score}`;
            
            // Move crystal to a new random position
            crystal.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );
            
            // Visual feedback (flash the ship)
            ship.material.emissive.setHex(0x00ff00);
            setTimeout(() => ship.material.emissive.setHex(0x00ffff), 100);
            spawnParticles(crystal.position);
        }
    });
    
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

function spawnParticles(position) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true });
    for (let i = 0; i < 10; i++) {
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
