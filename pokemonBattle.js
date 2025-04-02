let playerPokemon = null;
let enemyPokemon = null;
let battleActive = false;
let moves = []; // Moves will be populated dynamically
const hitSound = new Audio('https://assets.mixkit.co/active_storage/sfx/3008/3008-preview.mp3'); 

async function initBattle() {
    const selectedPokemon = JSON.parse(localStorage.getItem('selectedPokemon'));
    playerPokemon = await fetchPokemonData(selectedPokemon.name, 5); // Start at level 5
    enemyPokemon = await fetchPokemonData('charmander', 5);
    
    // Initialize moves with calculated damage
    moves = playerPokemon.moves.map(moveName => {
        const moveData = playerPokemon.movePool.find(m => m.name === moveName);
        return calculateMovePower(moveData);
    });
    
    playerPokemon.currentHp = playerPokemon.maxHp;
    enemyPokemon.currentHp = enemyPokemon.maxHp;
    
    updatePlayerName("player", playerPokemon);
    updatePlayerName("enemy", enemyPokemon);
    updateSprites();
    updateHpDisplay();
    showMessage(`A wild ${enemyPokemon.name.toUpperCase()} appeared!`);
    battleActive = true;
    updateLevelDisplay();
}

async function fetchPokemonData(name, level = 5) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        const data = await response.json();

         // Extract cry URL from API
         const cryUrl = data.cries?.latest || data.cries?.legacy;
        
        // Process level-up moves
        const movePool = data.moves
            .filter(m => m.version_group_details.some(vgd => 
                vgd.move_learn_method.name === 'level-up'
            ))
            .map(m => {
                const levelDetail = m.version_group_details.find(vgd => 
                    vgd.move_learn_method.name === 'level-up'
                );
                return {
                    name: m.move.name,
                    level: levelDetail.level_learned_at,
                    power: m.move.power || 40 // Fallback power if unavailable
                };
            })
            .sort((a, b) => a.level - b.level);

        // Get moves available at current level
        const knownMoves = movePool
            .filter(m => m.level <= level)
            .map(m => m.name);

        return {
            name: data.name,
            frontSprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            backSprite: data.sprites.other['official-artwork'].back_default || data.sprites.back_default,
            moves: knownMoves,
            movePool: movePool,
            level: level,
            experience: 0,
            expToNextLevel: calculateExpToNextLevel(level),
            baseExperience: data.base_experience,
            currentHp: 100,
            maxHp: 100 + ((level - 1) * 10), // HP increases by 10 per level
            stats: {
                attack: 10 + (level * 2),
                defense: 10 + (level * 1.5)
            },
            cry: cryUrl // Add cry URL to Pokémon data
        };
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return null;
    }
}

// Add animation and sound handling functions
function playCry(pokemon) {
    if (pokemon.cry) {
        const audio = new Audio(pokemon.cry);
        audio.play().catch(error => console.log('Auto-play prevented'));
    }
}

async function animateAttack(attackerSide, defenderSide) {
    const attacker = document.getElementById(`${attackerSide}-sprite`);
    const defender = document.getElementById(`${defenderSide}-sprite`);
    
    attacker.classList.add('attack-animation');
    await new Promise(resolve => setTimeout(resolve, 300));
    attacker.classList.remove('attack-animation');
    
    defender.classList.add('hit-animation');
    hitSound.play();
    await new Promise(resolve => setTimeout(resolve, 300));
    defender.classList.remove('hit-animation');
}

function calculateExpToNextLevel(currentLevel) {
    // Medium-fast experience curve
    return Math.floor(Math.pow(currentLevel, 3) * 0.8);
}

function calculateMovePower(moveData) {
    // Calculate damage range based on move power and level
    const basePower = moveData.power || 40;
    const levelMultiplier = 1 + (playerPokemon.level / 100);
    const min = Math.floor(basePower * 0.9 * levelMultiplier);
    const max = Math.floor(basePower * 1.1 * levelMultiplier);
    
    return {
        name: moveData.name,
        damage: [min, max],
        levelLearned: moveData.level
    };
}

function gainExperience(exp) {
    playerPokemon.experience += exp;
    showMessage(`${playerPokemon.name} gained ${exp} EXP!`);
    
    let levelsGained = 0;
    while (playerPokemon.experience >= playerPokemon.expToNextLevel) {
        playerPokemon.experience -= playerPokemon.expToNextLevel;
        playerPokemon.level++;
        levelsGained++;
        playerPokemon.expToNextLevel = calculateExpToNextLevel(playerPokemon.level);
    }
    
    if (levelsGained > 0) {
        levelUp(levelsGained);
    }
}

function levelUp(levelsGained) {
    // Update stats
    const prevMaxHp = playerPokemon.maxHp;
    playerPokemon.maxHp += 10 * levelsGained;
    playerPokemon.currentHp += playerPokemon.maxHp - prevMaxHp; // Heal difference
    playerPokemon.stats.attack += 2 * levelsGained;
    playerPokemon.stats.defense += 1.5 * levelsGained;
    
    showMessage(`${playerPokemon.name} grew to level ${playerPokemon.level}!`);
    
    // Learn new moves for each level gained
    for (let i = 0; i < levelsGained; i++) {
        const targetLevel = playerPokemon.level - levelsGained + i + 1;
        const newMoves = playerPokemon.movePool.filter(m => 
            m.level === targetLevel && 
            !playerPokemon.moves.includes(m.name)
        );
        
        newMoves.forEach(m => {
            playerPokemon.moves.push(m.name);
            moves.push(calculateMovePower(m));
            showMessage(`${playerPokemon.name} learned ${m.name.replace(/-/g, ' ')}!`);
        });
    }
    
    updateLevelDisplay();
    updateHpDisplay();
}

function updateLevelDisplay() {
    document.getElementById('player-level').textContent = `Lv.${playerPokemon.level}`;
    document.getElementById('enemy-level').textContent = `Lv.${enemyPokemon.level}`;
}

function updatePlayerName(side, pokemon) {
    document.getElementById(`${side}-name`).textContent = pokemon.name.replace(/-/g, ' ').toUpperCase();
}


function updateSprites() {
    document.getElementById('player-sprite').style.backgroundImage = 
        `url(${playerPokemon.backSprite})`;
    document.getElementById('enemy-sprite').style.backgroundImage = 
        `url(${enemyPokemon.frontSprite})`;
}

function updateHpDisplay() {
    updateSingleHp('player', playerPokemon);
    updateSingleHp('enemy', enemyPokemon);
}

function updateSingleHp(side, pokemon) {
    const hpBar = document.getElementById(`${side}-hp`).querySelector('.hp-current');
    const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
    hpBar.style.width = `${hpPercent}%`;
}

function showMessage(text) {
    const messageBox = document.getElementById('message');
    messageBox.textContent = text;
}

function handleAttack() {
    if (!battleActive) return;
    
    document.getElementById('action-buttons').style.display = 'none';
    const moveButtons = document.getElementById('move-buttons');
    moveButtons.style.display = 'grid';
    moveButtons.innerHTML = playerPokemon.moves
        .map(move => `<button onclick="handleMove('${move}')">${move.replace(/-/g, ' ')}</button>`)
        .join('');
}

async function handleMove(moveName) {
    if (!battleActive) return;
    
    const move = moves.find(m => m.name === moveName.toLowerCase());
    if (!move) {
        showMessage("Invalid move!");
        return;
    }

    document.getElementById('move-buttons').style.display = 'none';
    const damage = Math.floor(Math.random() * (move.damage[1] - move.damage[0])) + move.damage[0];
    
    // Player attack sequence
    showMessage(`${playerPokemon.name} used ${move.name.replace(/-/g, ' ')}!`);
    playCry(playerPokemon);
    await animateAttack('player', 'enemy');
    enemyPokemon.currentHp = Math.max(0, enemyPokemon.currentHp - damage);
    updateHpDisplay();

    if (enemyPokemon.currentHp <= 0) {
        endBattle(true);
        return;
    }

    // Enemy attack sequence
    await new Promise(resolve => setTimeout(resolve, 1000));
    const enemyMove = moves[Math.floor(Math.random() * moves.length)];
    const enemyDamage = Math.floor(Math.random() * (enemyMove.damage[1] - enemyMove.damage[0])) + enemyMove.damage[0];
    
    showMessage(`Enemy ${enemyPokemon.name} used ${enemyMove.name.replace(/-/g, ' ')}!`);
    playCry(enemyPokemon);
    await animateAttack('enemy', 'player');
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - enemyDamage);
    updateHpDisplay();

    if (playerPokemon.currentHp <= 0) {
        endBattle(false);
    } else {
        document.getElementById('action-buttons').style.display = 'grid';
    }
}

// Modified endBattle function
function endBattle(playerWon) {
    battleActive = false;
    showMessage(playerWon ? 
        `Enemy ${enemyPokemon.name} fainted! You win!` : 
        `${playerPokemon.name} fainted! You lose...`);
    
    document.getElementById('action-buttons').style.display = 'none';
    document.getElementById('move-buttons').style.display = 'none';
    
    if (playerWon) {
        gainExperience(enemyPokemon.baseExperience);
    }
}

function showPokemon() {
    showMessage("Going to Pokédex...");
    setTimeout(() => window.location.href = 'pokedex.html', 2000);
}

function handleRun() {
    if (!battleActive) return;
    if (Math.random() < 0.5) {
        showMessage("Got away safely!");
        setTimeout(() => window.location.href = 'index.html', 2000);
    } else {
        showMessage("Can't escape!");
        document.getElementById('action-buttons').style.display = 'grid';
    }
}

window.onload = initBattle;
