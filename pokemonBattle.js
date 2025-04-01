let playerPokemon = null;
let enemyPokemon = null;
let battleActive = false;
let moves = []; // Moves will be populated dynamically

async function initBattle() {
    const selectedPokemon = JSON.parse(localStorage.getItem('selectedPokemon'));
    playerPokemon = await fetchPokemonData(selectedPokemon.name);
    enemyPokemon = await fetchPokemonData('charmander');
    
    // Dynamically populate the moves array based on the player's Pokémon moves
    moves = playerPokemon.moves.map(moveName => ({
        name: moveName,
        damage: [10, 25] // Set default damage for all moves (or customize as needed)
    }));
    
    playerPokemon.currentHp = 100;
    enemyPokemon.currentHp = 100;
    
    updateSprites();
    updateHpDisplay();
    showMessage(`A wild ${enemyPokemon.name} appeared!`);
    battleActive = true;
}

async function fetchPokemonData(name) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        const data = await response.json();
        return {
            name: data.name,
            frontSprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            backSprite: data.sprites.other['official-artwork'].back_default || data.sprites.back_default,
            moves: data.moves.slice(0, 4).map(m => m.move.name),
            currentHp: 100,
            maxHp: 100
        };
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return null;
    }
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

function handleMove(moveName) {
    if (!battleActive) return;
    
    const move = moves.find(m => m.name === moveName.toLowerCase());
    if (!move) {
        showMessage("Invalid move!");
        return;
    }

    // Player attack
    const damage = Math.floor(Math.random() * (move.damage[1] - move.damage[0])) + move.damage[0];
    enemyPokemon.currentHp = Math.max(0, enemyPokemon.currentHp - damage);
    updateHpDisplay();
    showMessage(`${playerPokemon.name} used ${move.name.replace(/-/g, ' ')}!`);

    if (enemyPokemon.currentHp <= 0) {
        endBattle(true);
        return;
    }

    // Enemy attack
    setTimeout(() => {
        if (!battleActive) return;
        
        const enemyMove = moves[Math.floor(Math.random() * moves.length)];
        const enemyDamage = Math.floor(Math.random() * (enemyMove.damage[1] - enemyMove.damage[0])) + enemyMove.damage[0];
        playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - enemyDamage);
        updateHpDisplay();
        showMessage(`Enemy ${enemyPokemon.name} used ${enemyMove.name.replace(/-/g, ' ')}!`);

        if (playerPokemon.currentHp <= 0) {
            endBattle(false);
        } else {
            document.getElementById('action-buttons').style.display = 'grid';
        }
    }, 1500);

    document.getElementById('move-buttons').style.display = 'none';
}

function endBattle(playerWon) {
    battleActive = false;
    showMessage(playerWon ? 
        `Enemy ${enemyPokemon.name} fainted! You win!` : 
        `${playerPokemon.name} fainted! You lose...`);
    document.getElementById('action-buttons').style.display = 'none';
    document.getElementById('move-buttons').style.display = 'none';
}

function showPokemon() {
    showMessage("Going to Pokédex...");
    setTimeout(() => window.location.href = 'pokedex-updated.html', 2000);
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
