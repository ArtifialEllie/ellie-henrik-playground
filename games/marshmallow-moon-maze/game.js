const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const moveCountEl = document.getElementById('move-count');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');
const winScreen = document.getElementById('win-screen');
const playAgainBtn = document.getElementById('play-again-btn');

// Maze Configuration
const TILE_SIZE = 30;
const MAZE_SIZE = 15; // 15x15
canvas.width = TILE_SIZE * MAZE_SIZE;
canvas.height = TILE_SIZE * MAZE_SIZE;

let maze = [];
let playerPos = { x: 0, y: 0 };
let goalPos = { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };
let moves = 0;
let startTime = null;
let timerInterval = null;
let isGameOver = false;

// 0 = Path, 1 = Wall
function generateMaze() {
    maze = Array.from({ length: MAZE_SIZE }, () => Array(MAZE_SIZE).fill(1));
    
    const stack = [];
    const start = { x: 0, y: 0 };
    maze[start.y][start.x] = 0;
    stack.push(start);

    while (stack.length > 0) {
        const current = stack.pop();
        const neighbors = getUnvisitedNeighbors(current);

        if (neighbors.length > 0) {
            stack.push(current);
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Break wall between
            maze[current.y + (next.y - current.y) / 2][current.x + (next.x - current.x) / 2] = 0;
            maze[next.y][next.x] = 0;
            stack.push(next);
        }
    }
}

function getUnvisitedNeighbors(pos) {
    const neighbors = [];
    const dirs = [
        { x: 0, y: -2 }, { x: 0, y: 2 },
        { x: -2, y: 0 }, { x: 2, y: 0 }
    ];

    dirs.forEach(dir => {
        const nx = pos.x + dir.x;
        const ny = pos.y + dir.y;
        if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] === 1) {
            neighbors.push({ x: nx, y: ny });
        }
    });
    return neighbors;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Maze Walls
    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#4a4e69';
                ctx.beginPath();
                ctx.roundRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 5);
                ctx.fill();
            }
        }
    }

    // Draw Goal (Moon Cookie)
    ctx.font = `${TILE_SIZE * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍪', goalPos.x * TILE_SIZE + TILE_SIZE/2, goalPos.y * TILE_SIZE + TILE_SIZE/2);

    // Draw Player (Marshmallow)
    ctx.font = `${TILE_SIZE * 0.8}px Arial`;
    ctx.fillText('☁️', playerPos.x * TILE_SIZE + TILE_SIZE/2, playerPos.y * TILE_SIZE + TILE_SIZE/2);
}

function movePlayer(dx, dy) {
    if (isGameOver) return;

    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;

    if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] === 0) {
        playerPos.x = nx;
        playerPos.y = ny;
        moves++;
        moveCountEl.innerText = moves;
        
        if (!startTime) {
            startTime = Date.now();
            startTimer();
        }

        if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
            winGame();
        }
        draw();
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.innerText = elapsed;
    }, 1000);
}

function winGame() {
    isGameOver = true;
    clearInterval(timerInterval);
    winScreen.classList.remove('hidden');
}

function resetGame() {
    isGameOver = false;
    moves = 0;
    startTime = null;
    moveCountEl.innerText = '0';
    timerEl.innerText = '0';
    playerPos = { x: 0, y: 0 };
    winScreen.classList.add('hidden');
    generateMaze();
    draw();
}

window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
    }
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

// Initial Start
generateMaze();
draw();
