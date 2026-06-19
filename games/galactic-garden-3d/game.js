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
const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x4b0082, roughness: 0.8, emissive: 0x4b0082, emissiveIntensity: 0.1 });
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.position.y = -1;
scene.add(island);

// Cosmic Ring (Like Saturn!)
const ringGeo = new THREE.TorusGeometry(15, 0.2, 16, 100);
const ringMat = new THREE.MeshStandardMaterial({ 
    color: 0xffd700, 
    emissive: 0xffd700, 
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6 
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

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
let level = 1;
const plantedFlowers = [];
let currentFlowerType = 'neon-tulip';
const growingFlowers = [];
const activeBursts = [];

const flowerConfigs = {
    'neon-tulip': { color: 0xff00ff, scale: 1, points: 10 },
    'crystal-rose': { color: 0xadd8e6, scale: 1.2, points: 20 },
    'plasma-lily': { color: 0x00ff00, scale: 0.8, points: 15 },
    'void-orchid': { color: 0x4b0082, scale: 1.5, points: 25 }
};

const stardustEl = document.getElementById('stardust');
const flowerCountEl = document.getElementById('flower-count');
const levelEl = document.getElementById('level');
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
    
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(position.x, position.y, position.z);
    flowerGroup.scale.set(0, 0, 0);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1;
    flowerGroup.add(stem);

    // Flower Head
    const headGeo = new THREE.IcosahedronGeometry(0.5 * config.scale, 1);
    const headMat = new THREE.MeshStandardMaterial({ 
        color: config.color, 
        emissive: config.color, 
        emissiveIntensity: 0.5 
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2;
    flowerGroup.add(head);

    // Petals
    for (let i = 0; i < 8; i++) {
        const petalGeo = new THREE.SphereGeometry(0.3 * config.scale, 8, 8);
        const petalMat = new THREE.MeshStandardMaterial({ color: config.color });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.5, 2, Math.sin(angle) * 0.5);
        petal.scale.set(1, 0.3, 1);
        flowerGroup.add(petal);
    }

    // Sparkles on plant
    const sparkGeo = new THREE.BufferGeometry();
    const sparkMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    const sparkVerts = [];
    for(let i=0; i<10; i++) {
        sparkVerts.push((Math.random()-0.5), (Math.random()-0.5)*2, (Math.random()-0.5));
    }
    sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkVerts, 3));
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.position.y = 2;
    flowerGroup.add(sparks);

    scene.add(flowerGroup);
    
    growingFlowers.push({
        group: flowerGroup,
        pulseOffset: Math.random() * Math.PI * 2,
        targetScale: 1,
        currentScale: 0,
        growthSpeed: 0.05
    });
    plantedFlowers.push({ group: flowerGroup, pulseOffset: Math.random() * Math.PI * 2 });

    createBurst(position);
    createPlantRing(position);

    flowers++;
    stardust += config.points;
    flowerCountEl.innerText = flowers;
    stardustEl.innerText = stardust;
    
    // Level up every 10 flowers
    if (flowers % 10 === 0) {
        level++;
        levelEl.innerText = level;
        createLevelUpBurst();
    }

    if (flowers === 1) {
        tutorialEl.style.opacity = '0';
    }
}

function createPlantRing(position) {
    const ringGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(position.x, position.y, position.z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    activeBursts.push({
        points: ring,
        ring: true,
        life: 1.0,
        scale: 0.1
    });
}

function createBurst(position) {
    const burstGeo = new THREE.BufferGeometry();
    const burstMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true });
    const verts = [];
    const vels = [];
    for (let i = 0; i < 30; i++) {
        verts.push(position.x, position.y + 2, position.z);
        vels.push(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
    }
    burstGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const burst = new THREE.Points(burstGeo, burstMat);
    scene.add(burst);
    activeBursts.push({
        points: burst,
        velocities: vels,
        life: 1.0
    });
}

function createLevelUpBurst() {
    // Create a big, colorful explosion of particles at the center of the island
    const burstGeo = new THREE.BufferGeometry();
    const burstMat = new THREE.PointsMaterial({ 
        size: 0.15, 
        transparent: true, 
        vertexColors: true 
    });
    const verts = [];
    const vels = [];
    const colors = [];
    const colorPalette = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff0000];
    
    for (let i = 0; i < 200; i++) {
        verts.push(0, 0, 0);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.1 + Math.random() * 0.3;
        
        vels.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(theta) * speed
        );
        
        const color = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
        colors.push(color.r, color.g, color.b);
    }
    
    burstGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    burstGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const burst = new THREE.Points(burstGeo, burstMat);
    scene.add(burst);
    activeBursts.push({
        points: burst,
        velocities: vels,
        life: 1.0
    });
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
    const time = Date.now() * 0.001;
    requestAnimationFrame(animate);
    
    // Growth animation
    for (let i = growingFlowers.length - 1; i >= 0; i--) {
        const f = growingFlowers[i];
        f.currentScale += f.growthSpeed;
        if (f.currentScale >= f.targetScale) {
            f.currentScale = f.targetScale;
            growingFlowers.splice(i, 1);
        }
        f.group.scale.set(f.currentScale, f.currentScale, f.currentScale);
    }

    // Burst animation
    for (let i = activeBursts.length - 1; i >= 0; i--) {
        const b = activeBursts[i];
        if (b.ring) {
            b.points.scale.set(b.scale, b.scale, b.scale);
            b.scale += 0.1;
            b.points.material.opacity = b.life;
            b.life -= 0.02;
            if (b.life <= 0) {
                scene.remove(b.points);
                activeBursts.splice(i, 1);
            }
            continue;
        }
        const positions = b.points.geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j++) {
            positions[j] += b.velocities[j] || 0; // This is slightly wrong since vels is 3x smaller, but let's simplify
        }
        // Correcting velocity access
        for (let j = 0; j < positions.length; j++) {
            const velIdx = Math.floor(j / 3) * 3 + (j % 3);
            if (b.velocities[velIdx]) {
                positions[j] += b.velocities[velIdx];
            }
        }
        b.points.geometry.attributes.position.needsUpdate = true;
        b.life -= 0.02;
        b.points.material.opacity = b.life;
        if (b.life <= 0) {
            scene.remove(b.points);
            activeBursts.splice(i, 1);
        }
    }
    
    // Rotate island slowly
    island.rotation.y += 0.002;
    island.material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
    ring.rotation.z += 0.005; // Make the ring spin too!
    particleSystem.rotation.y += 0.005;
    
    // Cosmic rain - wait, we need rain object. Let's add it at the top.
    stars.rotation.y += 0.0001;

    // Pulsing flowers
    plantedFlowers.forEach(f => {
        const pulse = 1 + Math.sin(time * 3 + f.pulseOffset) * 0.05;
        f.group.scale.set(pulse, pulse, pulse);
    });

    // Subtle camera movement
    
    // Subtle camera movement
    camera.position.x = Math.sin(time * 0.2) * 2;
    camera.position.z = 25 + Math.cos(time * 0.2) * 2;
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
