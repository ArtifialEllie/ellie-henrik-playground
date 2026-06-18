const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a2a);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Space Background (Stars)
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const starVertices = [];
for (let i = 0; i < 10000; i++) {
    starVertices.push((Math.random() - 0.5) * 1000);
    starVertices.push((Math.random() - 0.5) * 1000);
    starVertices.push((Math.random() - 0.5) * 1000);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Cosmic Island
const islandGeometry = new THREE.CylinderGeometry(10, 12, 2, 32);
const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x4b0082, roughness: 0.8 });
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.position.y = -1;
scene.add(island);

// Floating particles around island
const particleGeometry = new THREE.BufferGeometry();
const particleMaterial = new THREE.PointsMaterial({ color: 0x00f2ff, size: 0.05 });
const particleVertices = [];
for (let i = 0; i < 200; i++) {
    particleVertices.push((Math.random() - 0.5) * 20);
    particleVertices.push((Math.random() - 0.5) * 5);
    particleVertices.push((Math.random() - 0.5) * 20);
}
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particleVertices, 3));
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

// Game State
let stardust = 0;
let flowers = 0;
let currentFlowerType = 'neon-tulip';

const flowerConfigs = {
    'neon-tulip': { color: 0xff00ff, scale: 1, points: 10 },
    'crystal-rose': { color: 0xadd8e6, scale: 1.2, points: 20 },
    'plasma-lily': { color: 0x00ff00, scale: 0.8, points: 15 },
    'void-orchid': { color: 0x4b0082, scale: 1.5, points: 25 }
};

const stardustEl = document.getElementById('stardust');
const flowerCountEl = document.getElementById('flower-count');
const tutorialEl = document.getElementById('tutorial');

// Input Handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousedown', (event) => {
    if (!gameActive) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(island);

    if (intersects.length > 0) {
        plantFlower(intersects[0].point);
    }
});

function plantFlower(position) {
    const config = flowerConfigs[currentFlowerType];
    
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(position.x, position.y + 1, position.z);
    scene.add(stem);

    // Flower Head
    const headGeo = new THREE.SphereGeometry(0.5 * config.scale, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ 
        color: config.color, 
        emissive: config.color, 
        emissiveIntensity: 0.5 
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(position.x, position.y + 2, position.z);
    scene.add(head);

    // Sparkles on plant
    const sparkGeo = new THREE.BufferGeometry();
    const sparkMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    const sparkVerts = [];
    for(let i=0; i<10; i++) {
        sparkVerts.push((Math.random()-0.5), (Math.random()-0.5)*2, (Math.random()-0.5));
    }
    sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkVerts, 3));
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.position.set(position.x, position.y + 2, position.z);
    scene.add(sparks);

    flowers++;
    stardust += config.points;
    flowerCountEl.innerText = flowers;
    stardustEl.innerText = stardust;
    
    if (flowers === 1) {
        tutorialEl.style.opacity = '0';
    }
}

// Flower Selector
document.querySelectorAll('.selector-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.selector-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        currentFlowerType = item.dataset.type;
    });
});

// Start Game
let gameActive = false;
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
    gameActive = true;
});

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate island slowly
    island.rotation.y += 0.002;
    particleSystem.rotation.y += 0.005;
    stars.rotation.y += 0.0001;
    
    // Subtle camera movement
    const time = Date.now() * 0.001;
    camera.position.x = Math.sin(time * 0.2) * 2;
    camera.position.z = 25 + Math.cos(time * 0.2) * 2;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
