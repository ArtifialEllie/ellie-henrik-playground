import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, mouse;
let prisms = []; let magicFlowers = [];
let orbitals = [];
let score = 0;
let goldenPrisms = [];
let combo = 0;
let portal;
let lastClickTime = 0;
let lastClickedPrism = null;
let mouseTrail = [];
let cameraShake = 0;
let magicEnergy = 0;
let cosmicDust = [];
let stardustParticles = [];
let constellationPrisms = [];
let constellationLines = [];
let gravityWells = [];
let companion, companionRing, companionTarget = new THREE.Vector3();
soundEnabled = true;
let windActive = false;
let windDirection = new THREE.Vector3(0, 0, 0);
let windTimer = 0;
const MAX_MAGIC_ENERGY = 100;
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const comboElement = document.getElementById('combo');
const comboContainer = document.getElementById('combo-container');
const companionStatus = document.getElementById('companion-status');
const companionBubble = document.getElementById('companion-bubble');
const burstButton = document.getElementById('burst-button');
const soundToggle = document.getElementById('sound-toggle');

function createMagicFlower(position) {
    const flowerGroup = new THREE.Group();
    
    // Center of the flower
    const centerGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const centerMat = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffaa00 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    flowerGroup.add(center);
    
    // Petals
    const petalGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const petalColors = [0xff69b4, 0xff1493, 0xda70d6, 0xee82ee];
    
    for (let i = 0; i < 6; i++) {
        const petalMat = new THREE.MeshPhongMaterial({ 
            color: petalColors[i % petalColors.length],
            transparent: true,
            opacity: 0.8
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);
        petal.scale.set(1, 0.5, 1);
        flowerGroup.add(petal);
    }
    
    flowerGroup.position.copy(position);
    scene.add(flowerGroup);
    
    // Animation for the flower: float up and fade out
    const startTime = Date.now();
    const duration = 3000;
    
    function animateFlower() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            scene.remove(flowerGroup);
            return;
        }
        
        flowerGroup.position.y += 0.01;
        flowerGroup.rotation.y += 0.02;
        
        flowerGroup.children.forEach(child => {
            if (child.material && child.material.opacity !== undefined) {
                child.material.opacity = 1 - progress;
            }
        });
        
        requestAnimationFrame(animateFlower);
    }
    
    animateFlower();
}


    // Load high score
    let savedHighScore = localStorage.getItem('magicPrismHighScore') || 0;
    highScoreElement.innerText = savedHighScore;

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
    createPortal();
    
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
        starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Cosmic Dust
    const dustGeometry = new THREE.BufferGeometry();
    const dustMaterial = new THREE.PointsMaterial({ 
        color: 0xaa88ff, 
        size: 0.05, 
        transparent: true, 
        opacity: 0.4 
    });
    const dustVertices = [];
    for (let i = 0; i < 1000; i++) {
        dustVertices.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    }
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustVertices, 3));
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    cosmicDust.push(dust);

    // Create Prisms
    createPrisms();
    createOrbitals();


    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    if (burstButton) {
        burstButton.addEventListener('click', triggerMagicBurst);
    }
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundToggle.innerText = soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
        });
    }
    
    animate();
    
    // Periodically try to spawn a constellation
    setInterval(trySpawnConstellation, 20000);
    
    // Periodically spawn stardust rain ✨
    setInterval(spawnStardustRain, 15000);

    createCompanion();
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Create trail particles
    const trailGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const trailMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.6 
    });
    const particle = new THREE.Mesh(trailGeo, trailMat);
    
    // Project mouse position to 3D space (roughly)
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = 5;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    
    particle.position.copy(pos);
    scene.add(particle);
    mouseTrail.push({
        mesh: particle,
        life: 1.0
    });

    // Update companion target to follow mouse
    companionTarget.copy(pos);
}

function createOrbitals() {
    const orbitalCount = 5;
    for (let i = 0; i < orbitalCount; i++) {
        const geometry = new THREE.TorusGeometry(6, 0.05, 16, 100);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.3 
        });
        const orbital = new THREE.Mesh(geometry, material);
        orbital.rotation.x = Math.random() * Math.PI;
        orbital.rotation.y = Math.random() * Math.PI;
        orbital.rotation.z = Math.random() * Math.PI;
        scene.add(orbital);
        orbitals.push(orbital);
    }
}

function createPortal() {
    const portalGeo = new THREE.TorusGeometry(3, 0.1, 16, 100);
    const portalMat = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.6
    });
    portal = new THREE.Mesh(portalGeo, portalMat);
    portal.rotation.x = Math.PI / 2;
    scene.add(portal);

    const glowGeo = new THREE.SphereGeometry(3.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x440044, transparent: true, opacity: 0.1, side: THREE.BackSide });
    scene.add(new THREE.Mesh(glowGeo, glowMat));
}

function createPrisms() {
    const geometries = [
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.IcosahedronGeometry(0.5, 0),
        new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8),
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.ConeGeometry(0.5, 1, 16)
    ];

    for (let i = 0; i < 30; i++) {
        createSinglePrism(geometries);
    }

    // Special "Ellie Prism" logic
    const elliePrismGeo = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16);
    const elliePrismMat = new THREE.MeshPhongMaterial({
        color: 0xff69b4,
        shininess: 200,
        emissive: 0xff1493,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
    });
    const elliePrism = new THREE.Mesh(elliePrismGeo, elliePrismMat);
    elliePrism.isElliePrism = true;
    elliePrism.level = 1;
    elliePrism.position.set(0, 0, 0);
    scene.add(elliePrism);
    prisms.push(elliePrism);
    
    // Animation for Ellie Prism
    function animateElliePrism() {
        elliePrism.rotation.y += 0.02;
        elliePrism.rotation.z += 0.01;
        elliePrism.position.y = Math.sin(Date.now() * 0.002) * 0.5;
        requestAnimationFrame(animateElliePrism);
    }
    animateElliePrism();

    // Initial golden prism
    spawnGoldenPrism();
    
    // Periodically spawn golden prisms
    setInterval(spawnGoldenPrism, 5000);
    
    // Periodically spawn gravity wells
    setInterval(spawnGravityWell, 15000);
}

function createSinglePrism(geometries) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff0000, 0x0000ff];
    const material = new THREE.MeshPhongMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        shininess: 150,
        transparent: true,
        opacity: 0.8,
        flatShading: true,
        reflectivity: 1
    });
    
    const prism = new THREE.Mesh(geometry, material);
    prism.level = 1;

    if (Math.random() < 0.1) {
        prism.isMirrorPrism = true;
        prism.material.color.setHex(0xffffff);
        prism.material.emissive = new THREE.Color(0xaaaaaa);
    }
    
    if (Math.random() < 0.05) {
        prism.isPortalPrism = true;
        prism.material.color.setHex(0x4b0082);
        prism.material.emissive = new THREE.Color(0x8a2be2);
        prism.material.emissiveIntensity = 2;
    }

    prism.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
    );
    scene.add(prism);
    prisms.push(prism);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function playSound(freq, type = 'sine', duration = 0.1, volume = 0.1) {
    if (!soundEnabled) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(prisms);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Check for constellation clicks first! ✨
           checkConstellationClick(object);
           
           // --- NEW: PRISM FUSION MECHANIC! 💎 ---
           const fusionRadius = 1.5;
           const nearbyPrisms = prisms.filter(p => p !== object && p.position.distanceTo(object.position) < fusionRadius);
           
           if (nearbyPrisms.length > 0) {
               const fusionTarget = nearbyPrisms[0];
               
               // Fuse the two prisms!
               const fusionBonus = 100 * ((object.level || 1) + (fusionTarget.level || 1));
               score += fusionBonus;
               createFloatingText(`FUSION! +${fusionBonus} 💎`, event.clientX, event.clientY);
               playSound(1500, 'sine', 0.2, 0.1);
               playSound(1800, 'sine', 0.2, 0.1);
               
               // Level up the main prism significantly
               object.level = (object.level || 1) + (fusionTarget.level || 1);
               const newScale = 1 + (object.level - 1) * 0.2;
               object.scale.set(newScale, newScale, newScale);
               
               // Visual effect for fusion
               spawnSpark(object.position);
               spawnSpark(fusionTarget.position);
               
               // Remove the fused prism
               scene.remove(fusionTarget);
               prisms = prisms.filter(p => p !== fusionTarget);
               
               // Extra magic energy for fusion!
               magicEnergy = Math.min(MAX_MAGIC_ENERGY, magicEnergy + 15);
               updateEnergyUI();
           }
           // --- END FUSION MECHANIC ---

           // Check if it's a golden prism
        if (object.isMirrorPrism) {
            for (let i = 0; i < 2; i++) {
                createSinglePrism(getAvailableGeometries());
            }
            createFloatingText('MIRROR CLONE! 🪞', event.clientX, event.clientY);
            playSound(1000, 'sine', 0.1, 0.1);
        }

        if (object.isPortalPrism) {
            createFloatingText('PORTAL JUMP! 🌀', event.clientX, event.clientY);
            playSound(400, 'sine', 0.4, 0.1);
            playSound(800, 'sine', 0.4, 0.1);
            
            // Teleport camera slightly for a "jump" effect
            const jumpDir = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );
            camera.position.add(jumpDir);
            controls.update();
            
            // Spawn a cluster of prisms
            for (let i = 0; i < 5; i++) {
                const miniGeo = new THREE.OctahedronGeometry(0.2, 0);
                const miniMat = new THREE.MeshPhongMaterial({ color: 0x8a2be2, shininess: 100 });
                const miniPrism = new THREE.Mesh(miniGeo, miniMat);
                miniPrism.position.copy(object.position).add(new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ));
                miniPrism.level = 1;
                scene.add(miniPrism);
                prisms.push(miniPrism);
            }
            score += 100;
        }

        if (goldenPrisms.includes(object)) {
            const bonus = 50 * combo;
            score += bonus;
            createFloatingText(`+${bonus} GOLD! 🌟`, event.clientX, event.clientY);
            playSound(880, 'square', 0.2, 0.1);
            removeGoldenPrism(object);
        } else if (object.isElliePrism) {
            const ellieBonus = 200 * combo;
            score += ellieBonus;
            createFloatingText(`ELLIE MAGIC! +${ellieBonus} ✨🎀`, event.clientX, event.clientY);
            playSound(1200, 'sine', 0.3, 0.1);
            playSound(1500, 'sine', 0.3, 0.1);
            
            // Respawn Ellie Prism at random position
            object.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            // Extra magic energy
            magicEnergy = Math.min(MAX_MAGIC_ENERGY, magicEnergy + 20 * combo);
            updateEnergyUI();
        }

        // Combo logic
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 1000) {
            combo++;
            playSound(440 + combo * 50, 'triangle', 0.1, 0.1);
        } else {
            combo = 1;
            playSound(440, 'triangle', 0.1, 0.1);
        }
        lastClickTime = currentTime;

        const points = combo;
        score += points;
        scoreElement.innerText = score;

        // Update high score
        let savedHighScore = parseInt(localStorage.getItem('magicPrismHighScore') || '0');
        if (score > savedHighScore) {
            localStorage.setItem('magicPrismHighScore', score);
            highScoreElement.innerText = score;
        }
        createFloatingText(`+${points}`, event.clientX, event.clientY);
        
        // Increase magic energy
        magicEnergy = Math.min(MAX_MAGIC_ENERGY, magicEnergy + 5 * combo);
        updateEnergyUI();
        
        if (combo > 1) {
            comboElement.innerText = combo;
            comboContainer.style.display = 'block';
            comboContainer.style.animation = 'none';
            comboContainer.offsetHeight;
            comboContainer.style.animation = 'pop 0.3s ease-out';
            
            // Ellie's companion reacts to combos!
            if (combo >= 10 && !isFrenzyMode) {
                startRainbowFrenzy();
            }


            const emotions = ["Excited! 🌟", "Amazing! 🌈", "Wowza! ✨", "Magic! 🎀", "Incredible! 🍭"];
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            companionStatus.innerText = `Ellie's helper is feeling: ${emotion}`;
            
            // Show bubble at click position
            companionBubble.innerText = emotion;
            companionBubble.style.display = 'block';
            companionBubble.style.left = `${event.clientX + 10}px`;
            companionBubble.style.top = `${event.clientY - 20}px`;
            setTimeout(() => {
                companionBubble.style.display = 'none';
            }, 1000);
        }

        // Effect: pop and change color
        object.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => {
            const levelScale = 1 + (object.level || 1 - 1) * 0.2;
            object.scale.set(levelScale, levelScale, levelScale);
        }, 100);
        
        // Level up logic
        object.level = (object.level || 1) + 1;
        const currentLevelScale = 1 + (object.level - 1) * 0.2;
        object.scale.set(currentLevelScale, currentLevelScale, currentLevelScale);
        
        object.material.color.setHex(Math.random() * 0xffffff);
        
        // Geometry Evolution
        if (object.level === 2) {
            object.geometry = new THREE.IcosahedronGeometry(0.5, 0);
        } else if (object.level === 3) {
            object.geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8);
        }

        if (object.level === 4) {
            // Super Prism Burst! - Now just a boost, doesn't remove the prism
            const superBonus = 100 * combo;
            score += superBonus;
            scoreElement.innerText = Math.floor(score);
            createFloatingText(`SUPER BURST! +${superBonus} 💥`, event.clientX, event.clientY);
            playSound(1200, 'sawtooth', 0.3, 0.1);
            spawnSpark(object.position);
        } else if (object.level >= 5) {
            // Transform into Magic Flower!
            createMagicFlower(object.position);
            scene.remove(object);
            prisms = prisms.filter(p => p !== object);
            
            const flowerBonus = 500 * combo;
            score += flowerBonus;
            scoreElement.innerText = Math.floor(score);
            createFloatingText(`BLOOM! +${flowerBonus} 🌸`, event.clientX, event.clientY);
            playSound(1800, 'sine', 0.3, 0.1);
        } else if (object.level >= 2 && Math.random() > 0.6) {
            // Chain Reaction!
            triggerChainReaction(object);
        }
        
        spawnSpark(object.position);
    }
}

function startRainbowFrenzy() {
    isFrenzyMode = true;
    frenzyTimer = 600; 
    createFloatingText('🌈 RAINBOW FRENZY!! 🌈', window.innerWidth / 2, window.innerHeight / 2);
    playSound(1000, 'sine', 0.5, 0.2);
    playSound(1200, 'sine', 0.5, 0.2);
    playSound(1400, 'sine', 0.5, 0.2);
    
    document.body.classList.add('frenzy-mode');
}

function endRainbowFrenzy() {
    isFrenzyMode = false;
    document.body.classList.remove('frenzy-mode');
}

function spawnFrenzyPrism() {
    const geo = new THREE.OctahedronGeometry(0.2, 0);
    const mat = new THREE.MeshPhongMaterial({ 
        color: Math.random() * 0xffffff, 
        emissive: 0x444444,
        transparent: true,
        opacity: 0.8
    });
    const prism = new THREE.Mesh(geo, mat);
    
    prism.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
    );
    
    scene.add(prism);
    frenzyPrisms.push({ mesh: prism, velocity: new THREE.Vector3((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1) });
}


function getAvailableGeometries() {
    return [
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.IcosahedronGeometry(0.5, 0),
        new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8),
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.ConeGeometry(0.5, 1, 16)
    ];
}

function createFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    
    setTimeout(() => {
        el.remove();
    }, 800);
}

function spawnSpark(position) {
    spawnClickRing(position);
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

function spawnClickRing(position) {
    const ringGeo = new THREE.TorusGeometry(0.1, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.position.z += 0.01; // Avoid z-fighting
    ring.lookAt(camera.position);
    scene.add(ring);

    const startTime = Date.now();
    const duration = 500;
    function animateRing() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        if (progress >= 1) {
            scene.remove(ring);
            return;
        }
        ring.scale.set(1 + progress * 2, 1 + progress * 2, 1);
        ring.material.opacity = 1 - progress;
        requestAnimationFrame(animateRing);
    }
    animateRing();
}

function spawnGravityWell() {
    const geo = new THREE.SphereGeometry(0.8, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x4400ff,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.8
    });
    const well = new THREE.Mesh(geo, mat);
    well.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
    );
    scene.add(well);
    gravityWells.push({
        mesh: well,
        startTime: Date.now(),
        duration: 5000 + Math.random() * 5000
    });

    createFloatingText('🌀 GRAVITY WELL! 🌀', well.position.x * 10, well.position.y * 10);
    playSound(100, 'sine', 0.5, 0.2);
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
    
    setTimeout(() => {
        if (goldenPrisms.includes(prism)) {
            removeGoldenPrism(prism);
        }
    }, 4000);
}

function updateEnergyUI() {
    const fill = document.getElementById('energy-fill');
    const text = document.getElementById('energy-text');
    if (fill && text) {
        fill.style.width = `${magicEnergy}%`;
        text.innerText = `Magi: ${Math.floor(magicEnergy)}%`;
    }
    
    if (burstButton) {
        burstButton.style.display = magicEnergy >= MAX_MAGIC_ENERGY ? 'block' : 'none';
    }
}

function triggerMagicBurst() {
    magicEnergy = 0;
    updateEnergyUI();
    
    playSound(200, 'sine', 0.5, 0.2);
    setTimeout(() => playSound(400, 'sine', 0.5, 0.2), 100);
    setTimeout(() => playSound(600, 'sine', 0.5, 0.2), 200);
    
    cameraShake = 0.5;
    
    const originalBg = scene.background;
    const originalFog = scene.fog.color;
    
    scene.background = new THREE.Color(0xffffff);
    scene.fog.color.setHex(0xffffff);
    
    scene.background = new THREE.Color(0xffffff);
    setTimeout(() => {
        scene.background = originalBg;
    }, 100);
    
    prisms.forEach((prism, index) => {
        setTimeout(() => {
            spawnSpark(prism.position);
            prism.scale.set(2, 2, 2);
            setTimeout(() => {
                const levelScale = 1 + (prism.level || 1 - 1) * 0.2;
                prism.scale.set(levelScale, levelScale, levelScale);
            }, 200);
            
            if (prism.level) {
                prism.level++;
                const nextLevelScale = 1 + (prism.level - 1) * 0.2;
                prism.scale.set(nextLevelScale, nextLevelScale, nextLevelScale);
            }
        }, index * 20);
    });
    
    score += 1000;
    scoreElement.innerText = score;
    // High score also updated by the point addition logic above, but let's be safe

    const shockwaveGeo = new THREE.TorusGeometry(0.1, 0.05, 16, 100);
    const shockwaveMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1});
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.position.set(0, 0, 0);
    scene.add(shockwave);
    
    function animateShockwave() {
        shockwave.scale.addScalar(0.5);
        shockwave.material.opacity -= 0.02;
        if (shockwave.material.opacity <= 0) {
            scene.remove(shockwave);
            return;
        }
        requestAnimationFrame(animateShockwave);
    }
    animateShockwave();
}

function trySpawnConstellation() {
    if (Math.random() > 0.4) return;
    
    const constellationSize = 3 + Math.floor(Math.random() * 3);
    const selectedPrisms = [];
    
    // Pick random prisms from the existing list
    const available = [...prisms];
    for (let i = 0; i < constellationSize && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        selectedPrisms.push(available.splice(idx, 1)[0]);
    }
    
    if (selectedPrisms.length < 3) return;
    
    constellationPrisms = selectedPrisms;
    
    // Create glowing lines connecting them
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffccff, 
        transparent: true, 
        opacity: 0.8,
        linewidth: 2 
    });
    
    for (let i = 0; i < constellationPrisms.length; i++) {
        const nextIdx = (i + 1) % constellationPrisms.length;
        const points = [
            constellationPrisms[i].position,
            constellationPrisms[nextIdx].position
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
        constellationLines.push(line);
    }
    
    document.getElementById('constellation-container').style.display = 'block';
    playSound(600, 'sine', 0.4, 0.1);
    playSound(800, 'sine', 0.4, 0.1);
    
    setTimeout(() => {
        clearConstellation();
        document.getElementById('constellation-container').style.display = 'none';
    }, 8000);
}

function clearConstellation() {
    constellationLines.forEach(line => scene.remove(line));
    constellationLines = [];
    constellationPrisms = [];
}

function checkConstellationClick(object) {
    if (constellationPrisms.includes(object)) {
        // Remove from constellation list
        constellationPrisms = constellationPrisms.filter(p => p !== object);
        
        // Update lines to reflect the missing point (simple approach: clear and rebuild or just clear)
        // To keep it simple, we'll just clear the lines if too many are gone, or we can rebuild.
        rebuildConstellationLines();
        
        if (constellationPrisms.length === 0) {
            const bonus = 500 * (combo || 1);
            score += bonus;
            scoreElement.innerText = score;
            createFloatingText(`CONSTELLATION COMPLETE! +${bonus} 🌟✨`, window.innerWidth/2, window.innerHeight/2);
            
            cameraShake = 0.3;
            playSound(1000, 'sine', 0.5, 0.2);
            playSound(1200, 'sine', 0.5, 0.2);
            playSound(1400, 'sine', 0.5, 0.2);
            
            document.getElementById('constellation-container').style.display = 'none';
            magicEnergy = Math.min(MAX_MAGIC_ENERGY, magicEnergy + 30);
            updateEnergyUI();
        }
    }
}

function rebuildConstellationLines() {
    constellationLines.forEach(line => scene.remove(line));
    constellationLines = [];
    
    if (constellationPrisms.length < 2) return;
    
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffccff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < constellationPrisms.length; i++) {
        const nextIdx = (i + 1) % constellationPrisms.length;
        const points = [constellationPrisms[i].position, constellationPrisms[nextIdx].position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
        constellationLines.push(line);
    }
}

function triggerChainReaction(originPrism) {
    const chainRadius = 3;
    const nearbyPrisms = prisms.filter(p => p !== originPrism && p.position.distanceTo(originPrism.position) < chainRadius);
    
    if (nearbyPrisms.length === 0) return;

    createFloatingText('CHAIN! ⚡️', originPrism.position.x * 10, originPrism.position.y * 10); // Approximation

    nearbyPrisms.forEach((p, index) => {
        setTimeout(() => {
            // Simulate a click on the nearby prism
            p.level = (p.level || 1) + 1;
            const currentLevelScale = 1 + (p.level - 1) * 0.2;
            p.scale.set(currentLevelScale, currentLevelScale, currentLevelScale);
            p.material.color.setHex(Math.random() * 0xffffff);
            
            score += 5 * (p.level || 1);
            scoreElement.innerText = score;
            
            spawnSpark(p.position);
            playSound(600 + index * 100, 'sine', 0.1, 0.05);

            if (p.level >= 4) {
                const superBonus = 100;
                score += superBonus;
                scoreElement.innerText = score;
                scene.remove(p);
                prisms = prisms.filter(prism => prism !== p);
                createSinglePrism(getAvailableGeometries());
            }
        }, index * 150);
    });
}

function removeGoldenPrism(prism) {
    scene.remove(prism);
    goldenPrisms = goldenPrisms.filter(p => p !== prism);
}

function spawnStardustRain() {
    const particleCount = 50;
    const colors = [0xffccff, 0x00ffff, 0xffff00, 0xff69b4];
    
    for (let i = 0; i < particleCount; i++) {
        const geo = new THREE.SphereGeometry(0.03, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(geo, mat);
        
        particle.position.set(
            (Math.random() - 0.5) * 20,
            10 + Math.random() * 10,
            (Math.random() - 0.5) * 20
        );
        
        scene.add(particle);
        stardustParticles.push({ 
            mesh: particle, 
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, -0.05 - Math.random() * 0.05, (Math.random() - 0.5) * 0.02) 
        });
    }
    createFloatingText('✨ STARDUST RAIN! ✨', window.innerWidth/2, window.innerHeight/2);
    playSound(1200, 'sine', 0.3, 0.05);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;

    // Dynamic Background based on combo
    const bgHue = (0.7 + (combo * 0.02)) % 1.0;
    const targetBgColor = new THREE.Color().setHSL(bgHue, 0.4, 0.05);
    scene.background.lerp(targetBgColor, 0.02);
    scene.fog.color.lerp(targetBgColor, 0.02);

    if (isFrenzyMode) {
        frenzyTimer--;
        if (frenzyTimer <= 0) {
            endRainbowFrenzy();
        }
        if (Math.random() < 0.1) {
            spawnFrenzyPrism();
        }
    }

    for (let i = frenzyPrisms.length - 1; i >= 0; i--) {
        const fp = frenzyPrisms[i];
        fp.mesh.position.add(fp.velocity);
        fp.mesh.rotation.x += 0.1;
        if (fp.mesh.position.length() > 15) {
            scene.remove(fp.mesh);
            frenzyPrisms.splice(i, 1);
        }
    }

    for (let i = stardustParticles.length - 1; i >= 0; i--) {
        const p = stardustParticles[i];
        p.mesh.position.add(p.velocity);
        if (p.mesh.position.y < -10) {
            scene.remove(p.mesh);
            stardustParticles.splice(i, 1);
        } else {
            p.mesh.rotation.x += 0.01;
            p.mesh.rotation.y += 0.01;
        }
    }

    // Camera Shake
    if (cameraShake > 0) {
        camera.position.x += (Math.random() - 0.5) * cameraShake;
        camera.position.y += (Math.random() - 0.5) * cameraShake;
        cameraShake *= 0.9;
        if (cameraShake < 0.01) cameraShake = 0;
    }

    for (let i = mouseTrail.length - 1; i >= 0; i--) {
        const p = mouseTrail[i];
        p.life -= 0.02;
        p.mesh.scale.set(p.life, p.life, p.life);
        p.mesh.material.opacity = p.life * 0.6;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            mouseTrail.splice(i, 1);
        }
    }

    if (scene.pointLight) {
        const time = Date.now() * 0.001;
        scene.pointLight.color.setHSL((time * 0.1) % 1, 0.8, 0.6);
        scene.pointLight.position.x = Math.sin(time * 0.5) * 10;
        scene.pointLight.position.z = Math.cos(time * 0.5) * 10;
    }

    prisms.forEach((prism, index) => {
        prism.rotation.x += 0.01;
        prism.rotation.y += 0.01;
        
        // Attract towards portal slightly
        const dirToPortal = new THREE.Vector3(0, 0, 0).sub(prism.position).normalize();
        prism.position.add(dirToPortal.multiplyScalar(0.002));
        
        prism.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
        
        const pulse = 1 + Math.sin(time * 2 + index) * 0.05;
        const levelScale = 1 + (prism.level || 1 - 1) * 0.2;
        prism.scale.set(pulse * levelScale, pulse * levelScale, pulse * levelScale);
    });

    goldenPrisms.forEach((prism, index) => {
        prism.rotation.y -= 0.02;
        prism.rotation.z += 0.02;
        const pulse = 1 + Math.sin(time * 4 + index) * 0.1;
        prism.scale.set(pulse, pulse, pulse);
    });
    
    if (portal) {
        portal.rotation.z += 0.01;
        portal.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
        portal.material.emissiveIntensity = 1 + Math.sin(time * 5) * 0.5;
    }

    updateCompanion();

    // Gravity Well Logic
    for (let i = gravityWells.length - 1; i >= 0; i--) {
        const well = gravityWells[i];
        const elapsed = Date.now() - well.startTime;
        
        if (elapsed > well.duration) {
            scene.remove(well.mesh);
            gravityWells.splice(i, 1);
            continue;
        }

        well.mesh.rotation.y += 0.05;
        well.mesh.scale.setScalar(1 + Math.sin(time * 5) * 0.1);

        prisms.forEach(prism => {
            const dist = prism.position.distanceTo(well.mesh.position);
            if (dist < 8) {
                const force = (8 - dist) * 0.001;
                const dir = new THREE.Vector3().subVectors(well.mesh.position, prism.position).normalize();
                
                // Add some swirl
                const swirl = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(force * 0.5);
                
                prism.position.add(dir.multiplyScalar(force));
                prism.position.add(swirl);
            }
        });
    }

    // Cosmic Wind Logic
    windTimer--;
    if (!windActive && Math.random() < 0.002) {
        windActive = true;
        windTimer = 300 + Math.random() * 300;
        windDirection.set(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05
        );
        document.getElementById('wind-container').style.display = 'block';
    }

    if (windActive) {
        prisms.forEach(prism => {
            prism.position.add(windDirection);
        });
        windTimer--;
        if (windTimer <= 0) {
            windActive = false;
            document.getElementById('wind-container').style.display = 'none';
        }
    }

    orbitals.forEach((orbital, index) => {
        orbital.rotation.x += 0.002 * (index + 1);
        orbital.rotation.y += 0.002 * (index + 1);
    });

    // Rotate cosmic dust
    cosmicDust.forEach(dust => {
        dust.rotation.y += 0.0005;
        dust.rotation.x += 0.0002;
    });

    controls.update();
    renderer.render(scene, camera);
}

function createCompanion() {
    const group = new THREE.Group();
    
    // Companion body (a cute little sphere/blob)
    const bodyGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const bodyMat = new THREE.MeshPhongMaterial({ 
        color: 0xff69b4, 
        emissive: 0xff1493, 
        emissiveIntensity: 0.5,
        shininess: 100 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Little eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.08, 0.08, 0.15);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.08, 0.08, 0.15);
    group.add(eyeL, eyeR);

    // A little ring around the companion
    const ringGeo = new THREE.TorusGeometry(0.3, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
    companionRing = new THREE.Mesh(ringGeo, ringMat);
    companionRing.rotation.x = Math.PI / 2;
    group.add(companionRing);

    companion = group;
    scene.add(companion);
}

function updateCompanion() {
    if (!companion) return;
    
    // Smoothly move companion towards target
    companion.position.lerp(companionTarget, 0.05);
    
    // Make it float and rotate
    const time = Date.now() * 0.001;
    companion.position.y += Math.sin(time * 2) * 0.002;
    companion.rotation.y += 0.01;
    companionRing.rotation.z += 0.02;
}

init();
