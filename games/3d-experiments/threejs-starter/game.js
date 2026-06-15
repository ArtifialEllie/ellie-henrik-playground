import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, mouse;
let prisms = [];
let score = 0;
let goldenPrisms = [];
let combo = 0;
let lastClickTime = 0;
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const comboContainer = document.getElementById('combo-container');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f1a);
    scene.fog = new THREE.FogExp2(0x0f0f1a, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 100, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    scene.pointLight = pointLight; // Store reference for animation


    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];
    for (let i = 0; i < 2000; i++) {
        starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Create Prisms
    createPrisms();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);

    animate();
}

function createPrisms() {
    const geometry = new THREE.OctahedronGeometry(0.5, 0);
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff0000, 0x0000ff];
    
    for (let i = 0; i < 30; i++) {
        const material = new THREE.MeshPhongMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            shininess: 100,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        const prism = new THREE.Mesh(geometry, material);
        prism.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        scene.add(prism);
        prisms.push(prism);
    }

    // Initial golden prism
    spawnGoldenPrism();
    
    // Periodically spawn golden prisms
    setInterval(spawnGoldenPrism, 5000);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(prisms);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Check if it's a golden prism
        if (goldenPrisms.includes(object)) {
            score += 50 * combo;
            removeGoldenPrism(object);
        }

        // Combo logic
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 1000) {
            combo++;
        } else {
            combo = 1;
        }
        lastClickTime = currentTime;

        score += combo;
        scoreElement.innerText = score;
        
        if (combo > 1) {
            comboElement.innerText = combo;
            comboContainer.style.display = 'block';
            // Re-trigger animation
            comboContainer.style.animation = 'none';
            comboContainer.offsetHeight; // trigger reflow
            comboContainer.style.animation = 'pop 0.3s ease-out';
        }

        // Effect: pop and change color
        object.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => object.scale.set(1, 1, 1), 100);
        object.material.color.setHex(Math.random() * 0xffffff);
        
        // Spawn a little spark
        spawnSpark(object.position);
    }
}

function spawnSpark(position) {
    const particleCount = 15;
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff0000, 0x0000ff];
    
    for (let i = 0; i < particleCount; i++) {
        const sparkGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const sparkMat = new THREE.MeshBasicMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 1 
        });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.copy(position);
        scene.add(spark);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        const startTime = Date.now();
        const duration = 600 + Math.random() * 400;

        function updateSpark() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            if (progress >= 1) {
                scene.remove(spark);
                return;
            }
            spark.position.add(velocity);
            spark.material.opacity = 1 - progress;
            spark.scale.set(1 - progress, 1 - progress, 1 - progress);
            requestAnimationFrame(updateSpark);
        }
        updateSpark();
    }
}

function spawnGoldenPrism() {
    const geometry = new THREE.IcosahedronGeometry(0.6, 0);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });
    const prism = new THREE.Mesh(geometry, material);
    prism.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
    );
    scene.add(prism);
    goldenPrisms.push(prism);
    
    // Golden prisms vanish after 4 seconds if not clicked
    setTimeout(() => {
        if (goldenPrisms.includes(prism)) {
            removeGoldenPrism(prism);
        }
    }, 4000);
}

function removeGoldenPrism(prism) {
    scene.remove(prism);
    goldenPrisms = goldenPrisms.filter(p => p !== prism);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;

    // Move light for dynamic shadows
    if (scene.pointLight) {
        scene.pointLight.position.x = Math.sin(time * 0.5) * 10;
        scene.pointLight.position.z = Math.cos(time * 0.5) * 10;
    }

    prisms.forEach((prism, index) => {
        prism.rotation.x += 0.01;
        prism.rotation.y += 0.01;
        prism.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
        
        // Subtle pulse effect
        const pulse = 1 + Math.sin(time * 2 + index) * 0.05;
        prism.scale.set(pulse, pulse, pulse);
    });

    goldenPrisms.forEach((prism, index) => {
        prism.rotation.y -= 0.02;
        prism.rotation.z += 0.02;
        const pulse = 1 + Math.sin(time * 4 + index) * 0.1;
        prism.scale.set(pulse, pulse, pulse);
    });

    controls.update();
    renderer.render(scene, camera);
}

init();