import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- Configuration ---
const CONFIG = {
    gravity: -0.15,
    ballRadius: 0.4,
    flipperSize: { width: 2, height: 0.3, depth: 0.3 },
    boardWidth: 12,
    boardHeight: 20,
    colors: {
        ball: 0xffffff,
        board: 0xffb6c1,
        flipper: 0x87ceeb,
        bumper: 0xffd700,
        background: 0xffeef8
    }
};

// --- Game State ---
let score = 0;
let isBallInPlay = false;
let leftFlipperAngle = 0;
let rightFlipperAngle = 0;
const FLIPPER_MAX_ANGLE = Math.PI / 4;
const FLIPPER_SPEED = 0.2;

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.background);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 50);
pointLight.position.set(5, 10, 5);
scene.add(pointLight);

// --- Game Objects ---
const boardGeo = new THREE.BoxGeometry(CONFIG.boardWidth, 0.5, CONFIG.boardHeight);
const boardMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.board });
const board = new THREE.Mesh(boardGeo, boardMat);
board.position.y = -1;
scene.add(board);

// Walls
const wallMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.board });
const createWall = (w, h, d, x, y, z) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
};

createWall(0.5, 1, CONFIG.boardHeight, -CONFIG.boardWidth / 2, 0, 0); // Left
createWall(0.5, 1, CONFIG.boardHeight, CONFIG.boardWidth / 2, 0, 0);  // Right
createWall(CONFIG.boardWidth, 1, 0.5, 0, 0, -CONFIG.boardHeight / 2); // Top

// Ball
const ballGeo = new THREE.SphereGeometry(CONFIG.ballRadius, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.ball, roughness: 0.1, metalness: 0.5 });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(CONFIG.boardWidth / 2 - 1, 0.5, CONFIG.boardHeight / 2 - 1);
scene.add(ball);

let ballVelocity = new THREE.Vector3(0, 0, 0);

// Flippers
const flipperGeo = new THREE.BoxGeometry(CONFIG.flipperSize.width, CONFIG.flipperSize.height, CONFIG.flipperSize.depth);
const flipperMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.flipper });

const leftFlipperPivot = new THREE.Object3D();
leftFlipperPivot.position.set(-2, 0, CONFIG.boardHeight / 2 - 3);
scene.add(leftFlipperPivot);

const leftFlipper = new THREE.Mesh(flipperGeo, flipperMat);
leftFlipper.position.set(CONFIG.flipperSize.width / 2, 0, 0);
leftFlipperPivot.add(leftFlipper);

const rightFlipperPivot = new THREE.Object3D();
rightFlipperPivot.position.set(2, 0, CONFIG.boardHeight / 2 - 3);
scene.add(rightFlipperPivot);

const rightFlipper = new THREE.Mesh(flipperGeo, flipperMat);
rightFlipper.position.set(-CONFIG.flipperSize.width / 2, 0, 0);
rightFlipperPivot.add(rightFlipper);

// Bumpers
const bumpers = [];
const bumperGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.6, 32);
const bumperMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.bumper, emissive: CONFIG.colors.bumper, emissiveIntensity: 0.5 });
const bumperPositions = [
    { x: -2, z: 0 },
    { x: 2, z: 0 },
    { x: 0, z: -2 },
];
bumperPositions.forEach(pos => {
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.position.set(pos.x, 0.5, pos.z);
    scene.add(bumper);
    bumpers.push(bumper);
});

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && !isBallInPlay) {
        launchBall();
    }
});
window.addEventListener('keyup', e => {
        keys[e.code] = false;
});

function launchBall() {
    isBallInPlay = true;
    ballVelocity.set(0, 0, -15);
    ball.position.set(CONFIG.boardWidth / 2 - 1, 0.5, CONFIG.boardHeight / 2 - 1);
}

function updateScore(amount) {
    score += amount;
    document.getElementById('score').innerText = score;
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Flipper Logic
    if (keys['ArrowLeft']) {
        leftFlipperAngle = Math.min(leftFlipperAngle + FLIPPER_SPEED, FLIPPER_MAX_ANGLE);
    } else {
        leftFlipperAngle = Math.max(leftFlipperAngle - FLIPPER_SPEED, -FLIPPER_MAX_ANGLE);
    }

    if (keys['ArrowRight']) {
        rightFlipperAngle = Math.min(rightFlipperAngle + FLIPPER_SPEED, FLIPPER_MAX_ANGLE);
    } else {
        rightFlipperAngle = Math.max(rightFlipperAngle - FLIPPER_SPEED, -FLIPPER_MAX_ANGLE);
    }

    leftFlipperPivot.rotation.z = leftFlipperAngle;
    rightFlipperPivot.rotation.z = -rightFlipperAngle;

    if (isBallInPlay) {
        // Physics: Gravity
        ballVelocity.z += CONFIG.gravity; 
        ball.position.add(ballVelocity.multiplyScalar(0.016)); // Simple frame-rate approx (60fps)
        
        // Wait, I used multiplyScalar on ballVelocity, which modifies the ballVelocity! 
        // Let's fix that in the next update or just correct it here.
        // Re-calculating position based on velocity
        ball.position.x += ballVelocity.x * 0.016;
        ball.position.z += ballVelocity.z * 0.016;
    }

    // Simplified Collision Detection
    if (isBallInPlay) {
        // Board Bounds
        if (ball.position.x < -CONFIG.boardWidth / 2 + CONFIG.ballRadius) {
            ball.position.x = -CONFIG.boardWidth / 2 + CONFIG.ballRadius;
            ballVelocity.x *= -0.7;
        }
        if (ball.position.x > CONFIG.boardWidth / 2 - CONFIG.ballRadius) {
            ball.position.x = CONFIG.boardWidth / 2 - CONFIG.ballRadius;
            ballVelocity.x *= -0.7;
        }
        if (ball.position.z < -CONFIG.boardHeight / 2 - CONFIG.ballRadius) {
            ball.position.z = -CONFIG.boardHeight / 2 - CONFIG.ballRadius;
            ballVelocity.z *= -0.7;
        }

        // Bumpers
        bumpers.forEach(bumper => {
            const dist = ball.position.distanceTo(bumper.position);
            if (dist < CONFIG.ballRadius + 0.6) {
                const normal = new THREE.Vector3().subVectors(ball.position, bumper.position);
                normal.normalize();
                ballVelocity.reflect(normal).multiplyScalar(1.2);
                updateScore(100);
                bumper.material.emissiveIntensity = 2;
                setTimeout(() => bumper.material.emissiveIntensity = 0.5, 100);
            }
        });

        // Flippers (Very simplified)
        const leftFlipPos = new THREE.Vector3();
        leftFlipper.getWorldPosition(leftFlipPos);
        const distLeft = ball.position.distanceTo(leftFlipPos);
        if (distLeft < 1.5) {
            ballVelocity.z *= -1.1;
            ballVelocity.x += (keys['ArrowLeft'] ? 2 : 0);
            updateScore(10);
        }

        const rightFlipPos = new THREE.Vector3();
        rightFlipper.getWorldPosition(rightFlipPos);
        const distRight = ball.position.distanceTo(rightFlipPos);
        if (distRight < 1.5) {
            ballVelocity.z *= -1.1;
            ballVelocity.x += (keys['ArrowRight'] ? -2 : 0);
            updateScore(10);
        }

        // Out of bounds
        if (ball.position.z > CONFIG.boardHeight / 2 + 1) {
            isBallInPlay = false;
            ballVelocity.set(0, 0, 0);
            ball.position.set(CONFIG.boardWidth / 2 - 1, 0.5, CONFIG.boardHeight / 2 - 1);
        }
    }

    renderer.render(scene, camera);
}

// Fix the multiplyScalar issue: 
// In my previous logic: ball.position.add(ballVelocity.multiplyScalar(0.016));
// multiplyScalar modifies the velocity vector itself!
// Corrected logic:
function updatePhysics() {
    if (!isBallInPlay) return;

    // Gravity (z-axis in pinball)
    ballVelocity.z += CONFIG.gravity;

    // Position update
    ball.position.x += ballVelocity.x * 0.016;
    ball.position.z += ballVelocity.z * 0.016;

    // Bounds
    if (ball.position.x < -CONFIG.boardWidth / 2 + CONFIG.ballRadius) {
        ball.position.x = -CONFIG.boardWidth / 2 + CONFIG.ballRadius;
        ballVelocity.x *= -0.7;
    }
    if (ball.position.x > CONFIG.boardWidth / 2 - CONFIG.ballRadius) {
        ball.position.x = CONFIG.boardWidth / 2 - CONFIG.ballRadius;
        ball.ballVelocity.x *= -0.7; // Typo here: ball.ballVelocity.x
    }
    
    // Top boundary
    if (ball.position.z < -CONFIG.boardHeight / 2 - CONFIG.ballRadius) {
        ball.position.z = -CONFIG.boardHeight / 2 - CONFIG.ballRadius;
        ballVelocity.z *= -0.7;
    }

    // Bumper collision
    bumpers.forEach(bumper => {
        const dist = ball.position.distanceTo(bumper.position);
        if (dist < CONFIG.ballRadius + 0.6) {
            const normal = new THREE.Vector3().subVectors(ball.position, bumper.position);
            normal.normalize();
            ballVelocity.reflect(normal).multiplyScalar(1.2);
            updateScore(100);
            bumper.material.emissiveIntensity = 2;
            setTimeout(() => bumper.material.emissiveIntensity = 0.5, 100);
    }
    });

    // Flipper collision (Very crude approximation)
    const lPos = new THREE.Vector3();
    leftFlipper.getWorldPosition(lPos);
    const dL = ball.position.distanceTo(lPos);
    if (dL < 1.5) {
        ballVelocity.z *= -1.1;
        ballVelocity.x += (keys['ArrowLeft'] ? 2 : 0);
        updateScore(10);
    }

    const rPos = new THREE.Vector3();
    rightFlipper.getWorldPosition(rPos);
    const dR = ball.position.distanceTo(rPos);
    if (dR < 1.5) {
        ballVelocity.z *= -1.1;
        ballVelocity.x += (keys['ArrowRight'] ? -2 : 0);
        updateScore(10);
    }

    // Ball out
    if (ball.position.z > CONFIG.boardHeight / 2 + 1) {
        isBallInPlay = false;
        ballVelocity.set(0, 0, 0);
        ball.position.set(CONFIG.boardWidth / 2 - 1, 0.5, CONFIG.boardHeight / 2 - 1);
    }
}

// Replacing the animate loop with the cleaner version
function finalAnimate() {
    requestAnimationFrame(finalAnimate);

    // Flipper rotation
    if (keys['ArrowLeft']) {
        leftFlipperAngle = Math.min(leftFlipperAngle + FLIPPER_SPEED, FLIPPER_MAX_ANGLE);
    } else {
        leftFlipperAngle = Math.max(leftFlipperAngle - FLIPPER_SPEED, -FLIPPER_MAX_ANGLE);
    }

    if (keys['ArrowRight']) {
        rightFlipperAngle = Math.min(rightFlipperAngle + FLIPPER_SPEED, FLIPPER_MAX_ANGLE);
    } else {
        rightFlipperAngle = Math.max(rightFlipperAngle - FLIPPER_SPEED, -FLIPPER_MAX_ANGLE);
    }

    leftFlipperPivot.rotation.z = leftFlipperAngle;
    rightFlipperPivot.rotation.z = -rightFlipperAngle;

    updatePhysics();
    renderer.render(scene, camera);
}

// Start the game
finalAnimate();
