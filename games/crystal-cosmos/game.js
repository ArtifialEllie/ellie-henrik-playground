import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, mouse;
let crystals = [];
let score = 0;
const scoreElement = document.getElementById('score');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.03);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 100, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x00ffff, 50, 20);
    blueLight.position.set(-10, 5, -10);
    scene.add(blueLight);

    const pinkLight = new THREE.PointLight(0xff00ff, 50, 20);
    pinkLight.position.set(10, -5, 10);
    scene.add(pinkLight);

    // Starfield
    createStarfield();

    // Create Crystals
    createCrystals();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);

    animate();
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.1,
        transparent: true,
        opacity: 0.8 
    });
    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
        starVertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createCrystals() {
    const geometry = new THREE.IcosahedronGeometry(0.6, 0);
    const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xff00ff, 0x8800ff];
    
    for (let i = 0; i < 40; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100,
            transparent: true,
            opacity: 0.7,
            flatShading: true,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const crystal = new THREE.Mesh(geometry, material);
        crystal.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        );
        
        // Random initial rotation
        crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        scene.add(crystal);
        crystals.push(crystal);
    }
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
    const intersects = raycaster.intersectObjects(crystals);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        score++;
        scoreElement.innerText = score;
        
        // Visual effect
        object.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => object.scale.set(1, 1, 1), 150);
        
        // Change to a random glowing color
        const newColor = new THREE.Color(Math.random() * 0xffffff);
        object.material.color.set(newColor);
        object.material.emissive.set(newColor);
        
        spawnExplosion(object.position, newColor);
    }
}

function spawnExplosion(position, color) {
    const particleCount = 12;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMat = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        particle.position.copy(position);
        scene.add(particle);
        particles.push(particle);
    }

    const startTime = Date.now();
    const duration = 600;

    function updateParticles() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            particles.forEach(p => scene.remove(p));
            return;
        }

        particles.forEach((p, index) => {
            const angle = (index / particleCount) * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.1;
            const dist = progress * 2;
            
            p.position.x += Math.cos(angle) * speed;
            p.position.y += Math.sin(angle) * speed;
            p.position.z += (Math.random() - 0.5) * speed;
            
            p.scale.set(1 - progress, 1 - progress, 1 - progress);
            p.material.opacity = 1 - progress;
        });
        
        requestAnimationFrame(updateParticles);
    }
    updateParticles();
}

function animate() {
    requestAnimationFrame(animate);
    
    crystals.forEach((crystal, index) => {
        crystal.rotation.x += 0.005 + (index * 0.0001);
        crystal.rotation.y += 0.005 + (index * 0.0001);
        
        // Gentle floating motion
        crystal.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
        crystal.position.x += Math.cos(Date.now() * 0.001 + index) * 0.002;
    });

    controls.update();
    renderer.render(scene, camera);
}

init();