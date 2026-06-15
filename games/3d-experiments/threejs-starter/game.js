import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, mouse;
let prisms = [];
let score = 0;
const scoreElement = document.getElementById('score');

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
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

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
        score++;
        scoreElement.innerText = score;
        
        // Effect: pop and change color
        object.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => object.scale.set(1, 1, 1), 100);
        object.material.color.setHex(Math.random() * 0xffffff);
        
        // Spawn a little spark
        spawnSpark(object.position);
    }
}

function spawnSpark(position) {
    const sparkGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.copy(position);
    scene.add(spark);

    const animation = { size: 0.05, opacity: 1 };
    const startTime = Date.now();
    const duration = 500;

    function updateSpark() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        if (progress >= 1) {
            scene.remove(spark);
            return;
        }
        spark.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
        spark.material.opacity = 1 - progress;
        requestAnimationFrame(updateSpark);
    }
    updateSpark();
}

function animate() {
    requestAnimationFrame(animate);
    
    prisms.forEach((prism, index) => {
        prism.rotation.x += 0.01;
        prism.rotation.y += 0.01;
        prism.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}

init();