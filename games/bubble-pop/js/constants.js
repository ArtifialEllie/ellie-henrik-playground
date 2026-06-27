const COLORS = ['#ff80ab', '#81d4fa', '#ce93d8', '#b39ddb', '#fff59d', '#a5d6a7', '#ffccbc'];
const COLOR_NOTES = {
    '#ff80ab': 261.63, // C4
    '#81d4fa': 293.66, // D4
    '#ce93d8': 329.63, // E4
    '#b39ddb': 349.23, // F4
    '#fff59d': 392.00, // G4
    '#a5d6a7': 440.00, // A4
    '#ffccbc': 493.88, // B4
};

const MOODS = {
    HAPPY: { name: 'Happy 🌸', speedMult: 1, spawnMult: 1, scoreMult: 1, color: '#ff80ab' },
    DREAMY: { name: 'Dreamy 🌙', speedMult: 0.6, spawnMult: 0.8, scoreMult: 1.5, color: '#ce93d8' },
    ENERGETIC: { name: 'Energetic ⚡', speedMult: 1.4, spawnMult: 1.6, scoreMult: 0.8, color: '#fff59d' },
    SILLY: { name: 'Silly 😜', speedMult: 1.1, spawnMult: 1.2, scoreMult: 1.0, color: '#a5d6a7' },
    MYSTICAL: { name: 'Mystical ✨', speedMult: 0.9, spawnMult: 1.0, scoreMult: 1.2, color: '#b39ddb' }
};

const QUESTS = [
    { text: 'Pop 10 bubbles! 🫧', goal: 10, reward: 50, rewardGold: 10 },
    { text: 'Reach a x3 Multiplier! 🚀', goal: 3, reward: 100, rewardGold: 20, type: 'multiplier' },
    { text: 'Pop 20 bubbles in total! 🫧', goal: 20, reward: 150, rewardGold: 30 },
    { text: 'Get a Combo of 10! 🔥', goal: 10, reward: 200, rewardGold: 50, type: 'combo' },
    { text: 'Reach Level 5! 🌟', goal: 5, reward: 300, rewardGold: 100, type: 'level' },
    { text: 'Pop 50 bubbles! 🫧', goal: 50, reward: 500, rewardGold: 200 },
    { text: 'Reach Level 10! 🌟', goal: 10, reward: 600, rewardGold: 300, type: 'level' },
    { text: 'Get a Combo of 20! 🔥', goal: 20, reward: 700, rewardGold: 400, type: 'combo' },
    { text: 'Reach a x5 Multiplier! 🚀', goal: 5, reward: 800, rewardGold: 500, type: 'multiplier' },
    { text: 'Pop 100 bubbles! 🫧', goal: 100, reward: 1000, rewardGold: 600 },
    { text: 'Collect 1000 Gold! ✨', goal: 1000, reward: 1200, rewardGold: 0, type: 'gold' },
    { text: 'Pop 200 bubbles! 🫧', goal: 200, reward: 2000, rewardGold: 1000 },
    { text: 'Reach Level 20! 🌟', goal: 20, reward: 3000, rewardGold: 1500, type: 'level' },
    { text: 'Get a Combo of 30! 🔥', goal: 30, reward: 4000, rewardGold: 2000, type: 'combo' },
    { text: 'Collect 5000 Gold! ✨', goal: 5000, reward: 5000, rewardGold: 0, type: 'gold' },
    { text: 'Pop 10 emotion bubbles! 🥺', goal: 10, reward: 1000, rewardGold: 500, type: 'emotion' },
    { text: 'Pop 500 bubbles! 🫧', goal: 500, reward: 10000, rewardGold: 5000 },
    { text: 'Reach Level 50! 🌟', goal: 50, reward: 15000, rewardGold: 10000, type: 'level' },
    { text: 'Get a Combo of 50! 🔥', goal: 50, reward: 20000, rewardGold: 15000, type: 'combo' },
    { text: 'Collect 50,000 Gold! ✨', goal: 50000, reward: 30000, rewardGold: 0, type: 'gold' },
    { text: 'Pop 1000 bubbles! 🫧', goal: 1000, reward: 50000, rewardGold: 25000 },
    { text: 'Pop 50 emotion bubbles! 🥳', goal: 50, reward: 20000, rewardGold: 10000, type: 'emotion' },
    { text: 'Collect 100,000 Gold! ✨', goal: 100000, reward: 50000, rewardGold: 0, type: 'gold' },
    { text: 'Reach Level 100! 🌟', goal: 100, reward: 100000, rewardGold: 50000, type: 'level' },
    { text: 'Get a Combo of 100! 🔥', goal: 100, reward: 150000, rewardGold: 100000, type: 'combo' },
    { text: 'Pop 2000 bubbles! 🫧', goal: 2000, reward: 200000, rewardGold: 150000 },
    { text: 'Reach a x20 Multiplier! 🚀', goal: 20, reward: 250000, rewardGold: 200000, type: 'multiplier' },
    { text: 'Pop 200 emotion bubbles! 🥳', goal: 200, reward: 300000, rewardGold: 250000, type: 'emotion' },
    { text: 'Collect 500,000 Gold! ✨', goal: 500000, reward: 500000, rewardGold: 0, type: 'gold' },

const SKINS = [
    { color: '#ff80ab', name: 'Pastel Pink', cost: 0 },
    { color: '#81d4fa', name: 'Sky Blue', cost: 50 },
    { color: '#ce93d8', name: 'Lavender', cost: 100 },
    { color: '#b39ddb', name: 'Deep Purple', cost: 150 },
    { color: '#fff59d', name: 'Lemonade', cost: 200 },
    { color: '#a5d6a7', name: 'Minty', cost: 250 },
    { color: '#ffffff', name: 'Cloud White', cost: 500 },
    { color: 'rainbow', name: 'Rainbow', cost: 1000 },
    { color: '#ffccbc', name: 'Peach Puff', cost: 1200 },
    { color: '#b2dfdb', name: 'Seafoam', cost: 1500 },
    { color: '#f8bbd0', name: 'Cherry Blossom', cost: 2000 },
    { color: 'cosmic', name: 'Cosmic Glitter', cost: 3000 },
    { color: '#c0c0c0', name: 'Starlight Silver', cost: 4000 },
    { color: 'holographic', name: 'Holographic Dream', cost: 5000 },
    { color: 'diamond', name: 'Diamond Dust 💎', cost: 10000 },
    { color: '#2c3e50', name: 'Nebula Night ✨', cost: 12000 },
    { color: '#fffacd', name: 'Sunbeam Gold ☀️', cost: 15000 },
    { color: '#e0ffff', name: 'Ocean Whisper 🌊', cost: 18000 },
    { color: 'supernova', name: 'Supernova Silver 🎇', cost: 25000 },
    { color: '#ff69b4', name: 'Neon Dream 🍭', cost: 30000 },
    { color: '#7fffd4', name: 'Aquamarine Glow 💎', cost: 35000 },
    { color: 'rainbow-glitter', name: 'Rainbow Glitter ✨', cost: 50000 },
    { color: '#ff1493', name: 'Sugar-Rush Pink 🍭', cost: 60000 },
];

const ACCESSORIES = [
    { name: 'Pink Bow', emoji: '🎀', cost: 100, effect: 'none' },
    { name: 'Flower Crown', emoji: '🌸', cost: 200, effect: 'none' },
    { name: 'Cool Shades', emoji: '🕶️', cost: 300, effect: 'none' },
    { name: 'Golden Collar', emoji: '👑', cost: 500, effect: 'gold_bonus' },
    { name: 'Smart Hat', emoji: '🎓', cost: 600, effect: 'none' },
    { name: 'Magic Wand', emoji: '🪄', cost: 700, effect: 'none' },
    { name: 'Magic Hat', emoji: '🎩', cost: 1000, effect: 'spawn_rate' },
    { name: 'Sparkle Wings', emoji: '🦋', cost: 1500, effect: 'auto_pop_range' },
    { name: 'Diamond Bow', emoji: '💎', cost: 2000, effect: 'multiplier_boost' },
    { name: 'Cosmic Cape', emoji: '🌌', cost: 5000, effect: 'frenzy_chance' },
    { name: 'Rainbow Tutu', emoji: '👗', cost: 7000, effect: 'rainbow_bonus' },
    { name: 'Magic Bubble Wand', emoji: '🪄', cost: 9000, effect: 'score_boost' },
    { name: 'Heart Glasses', emoji: '❤️🕶️', cost: 12000, effect: 'heart_bonus' },
    { name: 'Starry Halo', emoji: '🌟', cost: 25000, effect: 'gold_spawn_boost' },
];
