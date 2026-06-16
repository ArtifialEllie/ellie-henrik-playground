import * as THREE from 'three';

let scene, camera, renderer, ball, road, stars = [];
    let sparkles = [];
    let rings = [];
    let obstacles = [];
    let score = 0;
    let gameActive = false;
    let speed = 0.2;
    let combo = 1;
    let targetX = 0;
    let currentX = 0;


const ROAD_WIDTH = 10;
const STAR_COUNT = 15;
const ROAD_LENGTH = 200;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffdef2);
    scene.fog = new THREE.Fog(0xffdef2, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Player (The Roller)
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff69b4, 
        shininess: 100,
        specular: 0xffffff 
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.y = 0.5;
    scene.add(ball);

    // The Rainbow Road
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);
    const roadMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x87ceeb, 
        side: THREE.DoubleSide 
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -ROAD_LENGTH / 2 + 5;
    scene.add(road);

    // Add some rainbow stripes to the road
    for (let i = 0; i < 20; i++) {
        const stripeGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 2);
        const colors = [0xff0000, 0xffa500, 0xffff00, 0x008000, 0x0000ff, 0x4b0082, 0xee82ee];
        const color = colors[i % colors.length];
        const stripeMat = new THREE.MeshPhongMaterial({ color: color });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.01, -i * 10);
        scene.add(stripe);
    }

    // Create initial stars
    for (let i = 0; i < STAR_COUNT; i++) {
        createStar();
    }

    createClouds();
    createRings();
    createObstacles();

    window.addEventListener('resize', onWindowResize, false);
    setupControls();
}

function createStar() {
    const starGeo = new THREE.OctahedronGeometry(0.3, 0);
    const starMat = new THREE.MeshPhongMaterial({ 
        color: 0xffff00, 
        emissive: 0xffff00, 
        emissiveIntensity: 0.5 
    });
    const star = new THREE.Mesh(starGeo, starMat);
    
    // Random position
    star.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
    star.position.y = 0.5;
    star.position.z = -Math.random() * ROAD_LENGTH;
    
    scene.add(star);
    stars.push(star);
}

function createRings() {
    for (let i = 0; i < 5; i++) {
        const ringGeo = new THREE.TorusGeometry(0.8, 0.1, 16, 100);
        const ringMat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff, 
            emissiveIntensity: 0.5 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        
        ring.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2);
        ring.position.y = 0.5;
        ring.position.z = -Math.random() * ROAD_LENGTH;
        
        scene.add(ring);
        rings.push(ring);
    }
}

function createObstacles() {
    for (let i = 0; i < 10; i++) {
        const obstacleGeo = new THREE.ConeGeometry(0.4, 1, 8);
        const obstacleMat = new THREE.MeshPhongMaterial({ 
            color: 0xff00ff, 
            shininess: 100 
        });
        const obstacle = new THREE.Mesh(obstacleGeo, obstacleMat);
        
        obstacle.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
        obstacle.position.y = 0.5;
        obstacle.position.z = -Math.random() * ROAD_LENGTH;
        
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

function createClouds() {
    const cloudGeo = new THREE.SphereGeometry(1, 8, 8);
    const cloudMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    
    for (let i = 0; i < 30; i++) {
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 40,
            2 + Math.random() * 5,
            -Math.random() * ROAD_LENGTH * 2
        );
        cloud.scale.set(1 + Math.random() * 2, 0.5 + Math.random(), 1 + Math.random() * 2);
        scene.add(cloud);
        // We don't need to track them in an array if they are static, 
        // but we can add them to a list if we want them to move.
    }
}

function createSparkles(position) {
    const sparkleGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    for (let i = 0; i < 10; i++) {
        const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
        sparkle.position.copy(position);
        
        sparkle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ),
            life: 1.0
        };
        
        scene.add(sparkle);
        sparkles.push(sparkle);
    }
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'a' || e.key === 'ArrowLeft') {
            targetX = -3;
        } else if (e.key === 'd' || e.key === 'ArrowRight') {
            targetX = 3;
        }
    });

    window.addEventListener('keyup', (e) => {
        targetX = 0;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function update() {
    if (!gameActive) return;

    // Smooth movement
    currentX += (targetX - currentX) * 0.1;
    ball.position.x = currentX;
    
    // Rotation for rolling effect
    ball.rotation.x -= speed;

    // Move ball forward (fake it by moving everything else)
    // Or just move the ball and move the camera
    ball.position.z -= speed;
    camera.position.z = ball.position.z + 10;
    camera.position.x = ball.position.x * 0.5;
    camera.lookAt(ball.position);

    // Bound checking
    if (ball.position.x > ROAD_WIDTH/2) ball.position.x = ROAD_WIDTH/2;
    if (ball.position.x < -ROAD_WIDTH/2) ball.position.x = -ROAD_WIDTH/2;

    // Star collision and recycling
    stars.forEach(star => {
        star.rotation.y += 0.05;
        
        const dist = ball.position.distanceTo(star.position);
        if (dist < 1) {
            score += combo;
            document.getElementById('score').innerText = score;
            combo++;
            document.getElementById('combo').innerText = combo;
            createSparkles(star.position);
            
            // Move star far ahead
            star.position.z = ball.position.z - ROAD_LENGTH;
            star.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
        }

        // Recycle stars that are behind the player
        if (star.position.z > ball.position.z + 5) {
            star.position.z = ball.position.z - ROAD_LENGTH;
            star.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
            
            // Reset combo if the player misses too many stars (optional, but let's make it challenging)
            // For now, let's just reset combo when they've passed a certain distance without a star
            // Actually, let's just keep it simple: combo increases with each star and stays until hit.
        }
    });

    // Ring collision and speed boost
    rings.forEach(ring => {
        ring.rotation.y += 0.02;
        
        const dist = ball.position.distanceTo(ring.position);
        if (dist < 1.2) {
            speed += 0.05;
            document.getElementById('message').innerText = 'SPEED BOOST! 🚀';
            createSparkles(ring.position);
            
            // Move ring far ahead
            ring.position.z = ball.position.z - ROAD_LENGTH;
            ring.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2);
            
            // Reset message after a delay
            setTimeout(() => {
                document.getElementById('message').innerText = 'Roll through the rainbow! ✨';
            }, 2000);
        }

        // Recycle rings that are behind the player
        if (ring.position.z > ball.position.z + 5) {
            ring.position.z = ball.position.z - ROAD_LENGTH;
            ring.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2);
        }
    });

    // Speed up over time
    speed += 0.00005;

    // Update sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.position.add(s.userData.velocity);
        s.userData.life -= 0.02;
        s.material.opacity = s.userData.life;
        s.scale.setScalar(s.userData.life);
        
        if (s.userData.life <= 0) {
            scene.remove(s);
            sparkles.splice(i, 1);
        }
    }

    // Obstacle collision
    obstacles.forEach(obstacle => {
        const dist = ball.position.distanceTo(obstacle.position);
        if (dist < 0.8) {
            gameOver();
        }

        // Recycle obstacles that are behind the player
        if (obstacle.position.z > ball.position.z + 5) {
            obstacle.position.z = ball.position.z - ROAD_LENGTH;
            obstacle.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
        }
    });
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-score').innerText = `Stars Collected: ${score}`;
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Start game on button click
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('overlay').style.display = 'none';
    }, 500);
    gameActive = true;
});

document.getElementById('restart-button').addEventListener('click', () => {
    // Reset game state
    score = 0;
    speed = 0.2;
    combo = 1;
    ball.position.set(0, 0.5, 0);
    currentX = 0;
    targetX = 0;
    document.getElementById('score').innerText = '0';
    document.getElementById('combo').innerText = '1';
    document.getElementById('game-over').style.display = 'none';
    
    // Reposition obstacles, stars and rings
    stars.forEach(star => {
        star.position.z = -Math.random() * ROAD_LENGTH;
        star.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
    });
    rings.forEach(ring => {
        ring.position.z = -Math.random() * ROAD_LENGTH;
        ring.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 2);
    });
    obstacles.forEach(obstacle => {
        obstacle.position.z = -Math.random() * ROAD_LENGTH;
        obstacle.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 1);
    });
    
    gameActive = true;
});

init();
animate();
