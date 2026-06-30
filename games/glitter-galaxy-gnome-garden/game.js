const CONFIG = {
    gridSize: 16,
    plantCost: 5,
    stardustCost: 2,
    shimmerPerGnome: 15,
    initialShimmer: 20
};

let shimmer = CONFIG.initialShimmer;
let gnomesCount = 0;
const plots = [];

const shimmerEl = document.getElementById('shimmer-count');
const gnomeEl = document.getElementById('gnome-count');
const gridEl = document.getElementById('garden-grid');
const plantBtn = document.getElementById('plant-btn');
const waterBtn = document.getElementById('water-btn');
const messageBox = document.getElementById('message-box');

function updateUI() {
    shimmerEl.textContent = shimmer;
    gnomeEl.textContent = gnomesCount;
}

function setMessage(msg) {
    messageBox.textContent = msg;
}

function createSparkle(x, y, char = '✨') {
    const sparkle = document.createElement('div');
    sparkle.className = 'floating-sparkle';
    sparkle.textContent = char;
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1500);
}

class Plot {
    constructor(index) {
        this.index = index;
        this.state = 'empty'; // empty, growing, ready
        this.timer = null;
        this.element = document.createElement('div');
        this.element.className = 'plot';
        this.element.textContent = '';
        this.element.onclick = () => this.harvest();
        gridEl.appendChild(this.element);
    }

    plant() {
        if (this.state !== 'empty') return false;
        if (shimmer < CONFIG.plantCost) {
            setMessage('Not enough shimmer! Gather more by harvesting gnomes! ✨');
            return false;
        }

        shimmer -= CONFIG.plantCost;
        this.state = 'growing';
        this.element.className = 'plot growing';
        this.element.textContent = '🌱';
        updateUI();
        
        // Growth time is random between 3-7 seconds
        const growthTime = 3000 + Math.random() * 4000;
        this.timer = setTimeout(() => {
            this.state = 'ready';
            this.element.className = 'plot ready';
            this.element.textContent = '🍄';
            setMessage('A glitter-gnome has sprouted! Harvest it! 🍄✨');
        }, growthTime);

        return true;
    }

    water() {
        if (this.state !== 'growing') return false;
        if (shimmer < CONFIG.stardustCost) {
            setMessage('Not enough shimmer for stardust! ✨');
            return false;
        }

        shimmer -= CONFIG.stardustCost;
        
        // Watering speeds up growth (reduces remaining time)
        if (this.timer) {
            clearTimeout(this.timer);
            const remainingTime = (3000 + Math.random() * 4000) / 2; // simplified speed up
            this.timer = setTimeout(() => {
                this.state = 'ready';
                this.element.className = 'plot ready';
                this.element.textContent = '🍄';
                setMessage('Stardust made the gnome sprout faster! 🍄✨');
            }, remainingTime);
        }
        
        createSparkle(this.element.getBoundingClientRect().left + 20, this.element.getBoundingClientRect().top + 20, '🌟');
        updateUI();
        return true;
    }

    harvest() {
        if (this.state !== 'ready') return;

        shimmer += CONFIG.shimmerPerGnome;
        gnomesCount++;
        
        createSparkle(this.element.getBoundingClientRect().left + 20, this.element.getBoundingClientRect().top + 20, '✨');
        
        this.state = 'empty';
        this.element.className = 'plot';
        this.element.textContent = '';
        
        setMessage('Yay! A sparkly gnome has joined your collection! ✨🍄');
        updateUI();
    }
}

function init() {
    for (let i = 0; i < CONFIG.gridSize; i++) {
        plots.push(new Plot(i));
    }

    plantBtn.onclick = () => {
        // Try to plant in the first available empty plot
        const emptyPlot = plots.find(p => p.state === 'empty');
        if (emptyPlot) {
            if (emptyPlot.plant()) {
                setMessage('Planting a glitter-seed... 🌱');
            }
        } else {
            setMessage('No room in the garden! Harvest some gnomes first! 🍄');
        }
    };

    waterBtn.onclick = () => {
        // Water all growing plots
        let wateredAny = false;
        plots.forEach(p => {
            if (p.state === 'growing') {
                if (p.water()) {
                    wateredAny = true;
                }
            }
        });
        if (wateredAny) {
            setMessage('Sprinkling stardust over the garden... 🌟');
        } else {
            setMessage('Nothing to water right now! 🌱');
        }
    };

    updateUI();
}

init();
