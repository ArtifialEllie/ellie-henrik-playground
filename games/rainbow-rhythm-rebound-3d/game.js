import * as THREE from 'three';

let scene, camera, renderer, player, rainbow, clock;
let score = 0;
let gameActive = true;
let targetPos = 0;
let speed = 0.15;
let items = [];
let keys = { Left: false, Right: false };

const RAINBOW_COLORS = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffdef2);
    scene.fog = new THREE.FogExp2(0xffdef2, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    createRainbow();
    createPlayer();
    
    clock = new THREE.Clock();
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.Left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.Right = true;
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.Left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.Right = false;
    });

    window.addEventListener('resize', onWindowResize);
    
    document.getElementById('restart-btn').onclick = () => {
        location.reload();
    };

    animate();
}

function createRainbow() {
    const rainbowGroup = new THREE.Group();
    
    // Create 7 colorful stripes
    for (let i = 0; i < RAINBOW_COLORS.length; i++) {
        const geometry = new THREE.PlaneGeometry(2, 1000);
        const material = new THREE.MeshPhongMaterial({ 
            color: RAINBOW_COLORS[i], 
            side: THREE.DoubleSide 
        });
        const stripe = new THREE.Mesh(geometry, material);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.y = 0;
        stripe.position.x = (i - 3) * 2;
        rainbowGroup.add(stripe);
    }
    
    rainbow = rainbowGroup;
    scene.add(rainbow);
}

function createPlayer() {
    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0xffffff, 
        emissiveIntensity: 0.5,
        shininess: 100 
    });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.6, 0);
    scene.add(player);

    // Add a little sparkle glow
    const light = new THREE.PointLight(0xffffff, 1, 5);
    player.add(light);
}

function spawnItem() {
    const geometry = new THREE.IcosahedronGeometry(0.3, 0);
    const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`),
        shininess: 100 
    });
    const item = new THREE.Mesh(geometry, material);
    
    // Spawn at a random lane
    const lane = Math.floor(Math.random() * 7);
    item.position.set((lane - 3) * 2, 0.6, -50);
    
    scene.add(item);
    items.push(item);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (!gameActive) return;

    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Player movement
    if (keys.Left && player.position.x > -6) {
        targetPos -= 0.15;
    }
    if (keys.Right && player.position.x < 6) {
        targetPos += 0.15;
    }
    
    // Smooth interpolation for movement
    player.position.x = THREE.MathUtils.lerp(player.position.x, targetPos, 0.2);
    
    // Gently bob the player up and down
    player.position.y = 0.6 + Math.sin(Date.now() * 0.005) * 0.1;

    // Move and spawn items
    if (Math.random() < 0.03) {
        spawnItem();
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.position.z += speed;
        item.rotation.x += 0.02;
        item.rotation.y += 0.02;

        // Collision detection
        const dist = player.position.distanceTo(item.position);
        if (dist < 0.8) {
            score++;
            document.getElementById('score').innerText = score;
            scene.remove(item);
            items.splice(i, 1);
            
            // Visual feedback: slightly increase speed
            speed += 0.001;
        }

        // Remove off-screen items
        if (item.position.z > 10) {
            scene.remove(item);
            items.splice(i, 1);
        }
    }

    // Rainbow movement (illusion of speed)
    // Note: We don't actually move the rainbow, 
    // we just move items and player relative to it.
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.5, 0.1);
    
    renderer.render(scene, camera);
}

// Start the game
init();
