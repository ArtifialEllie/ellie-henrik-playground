const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const totalStardustEl = document.getElementById('total-stardust');
const statusMsgEl = document.getElementById('status-msg');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');

// Game Settings
const GRID_SIZE = 15;
const CELL_SIZE = 40;
canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

let player = { x: 0, y: 0, color: '#00ffff' };
let goal = { x: 0, y: 0, color: '#ff00ff' };
let walls = [];
let stardust = [];
let score = 0;
let gameActive = true;

// Maze Generation (Recursive Backtracker)
function generateMaze() {
    walls = [];
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
    const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    
    function getNeighbors(x, y) {
        const neighbors = [];
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        dirs.forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                neighbors.push({ x: nx, y: ny });
            }
        });
        return neighbors;
    }

    const stack = [{ x: 0, y: 0 }];
    visited[0][0] = true;

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getNeighbors(current.x, current.y).filter(n => !visited[n.x][n.y]);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            visited[next.x][next.y] = true;
            
            // Remove wall between current and next
            const wx = (current.x + next.x) / 2;
            const wy = (current.y + next.y) / 2;
            // Since we are using a grid where walls are the boundaries, 
            // we need to handle "walls" differently.
            // For a simple grid maze, we'll track passage instead.
            stack.push(next);
        } else {
            stack.pop();
        }
    }
}

// Simpler Maze: Random walls with guarantee of path
function createPlayableMaze() {
    walls = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (Math.random() < 0.3) {
                walls.push({ x, y });
            }
        }
    }
    // Ensure start and end are clear
    walls = walls.filter(w => !(w.x === 0 && w.y === 0) && !(w.x === GRID_SIZE-1 && w.y === GRID_SIZE-1));
    
    // Simple path check (BFS)
    if (!hasPath()) {
        return createPlayableMaze();
    }
}

function hasPath() {
    const queue = [{ x: 0, y: 0 }];
    const visited = new Set(['0,0']);
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) return true;
        
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && 
                !walls.some(w => w.x === nx && w.y === ny) && !visited.has(`${nx},${ny}`)) {
                visited.add(`${nx},${ny}`);
                queue.push({ x: nx, y: ny });
            }
        });
    }
    return false;
}

function spawnStardust() {
    stardust = [];
    const count = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
        const pos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        if (!walls.some(w => w.x === pos.x && w.y === pos.y) && !(pos.x === 0 && pos.y === 0)) {
            stardust.push(pos);
        }
    }
    totalStardustEl.textContent = stardust.length;
}

function initGame() {
    player = { x: 0, y: 0, color: '#00ffff' };
    goal = { x: GRID_SIZE - 1, y: GRID_SIZE - 1, color: '#ff00ff' };
    score = 0;
    scoreEl.textContent = score;
    createPlayableMaze();
    spawnStardust();
    gameActive = true;
    overlay.classList.add('hidden');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Walls (Magic Mirrors)
    ctx.fillStyle = '#4b2a7d';
    walls.forEach(w => {
        ctx.beginPath();
        ctx.roundRect(w.x * CELL_SIZE + 2, w.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4, 8);
        ctx.fill();
        // Mirror shine
        ctx.strokeStyle = '#8a4fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw Stardust
    ctx.fillStyle = '#ffff00';
    stardust.forEach((s, index) => {
        const time = Date.now() * 0.005;
        const floatY = Math.sin(time + index) * 3;
        ctx.beginPath();
        ctx.arc(s.x * CELL_SIZE + CELL_SIZE/2, s.y * CELL_SIZE + CELL_SIZE/2 + floatY, 6, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
    });
    ctx.shadowBlur = 0;

    // Draw Goal (Crystal Portal)
    ctx.fillStyle = goal.color;
    ctx.beginPath();
    ctx.arc(goal.x * CELL_SIZE + CELL_SIZE/2, goal.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 5, 0, Math.PI * 2);
    ctx.fill();
    // Portal pulse
    const pulse = Math.sin(Date.now() * 0.005) * 5;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(goal.x * CELL_SIZE + CELL_SIZE/2, goal.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 5 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x * CELL_SIZE + CELL_SIZE/2, player.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 8, 0, Math.PI * 2);
    ctx.fill();
    // Player Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
}

window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    let dx = 0, dy = 0;
    if (e.key === 'ArrowUp') dy = -1;
    if (e.key === 'ArrowDown') dy = 1;
    if (e.key === 'ArrowLeft') dx = -1;
    if (e.key === 'ArrowRight') dx = 1;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !walls.some(w => w.x === nx && w.y === ny)) {
        player.x = nx;
        player.y = ny;
        
        // Check Stardust collection
        stardust = stardust.filter(s => {
            if (s.x === player.x && s.y === player.y) {
                score++;
                scoreEl.textContent = score;
                return false;
            }
            return true;
        });

        // Check Win condition
        if (player.x === goal.x && player.y === goal.y) {
            gameActive = false;
            overlay.classList.remove('hidden');
            document.getElementById('overlay-title').textContent = "Magic Mirror Maze Solved! ✨";
            document.getElementById('overlay-text').textContent = `You collected ${score}/${totalStardustEl.textContent} stardust particles!`;
        }
    }
});

restartBtn.addEventListener('click', () => {
    initGame();
});

initGame();
draw();
