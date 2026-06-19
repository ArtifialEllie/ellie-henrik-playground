const COLORS = ['#ff80ab', '#81d4fa', '#ce93d8', '#b39ddb', '#fff59d', '#a5d6a7', '#ffccbc'];

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
];

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
    { color: '#2c3e50', name: 'Nebula Night ✨', cost: 12000 }, // NEW SKIN
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
];
