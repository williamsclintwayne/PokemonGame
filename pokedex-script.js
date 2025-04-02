const apiUrl = 'https://pokeapi.co/api/v2/pokemon?limit=900'; // Fetching first 150 Pokémon

async function fetchPokemon() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayPokemon(data.results);
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
    }
}

function displayPokemon(pokemonList) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // Clear previous content

    pokemonList.forEach(pokemon => {
        const pokemonCard = document.createElement('div');
        pokemonCard.className = 'pokemon-card';
        pokemonCard.innerHTML = `
            <h2>${pokemon.name}</h2>
            <img src="https://img.pokemondb.net/sprites/home/normal/${pokemon.name}.png" alt="${pokemon.name}">
        `;
        pokemonCard.onclick = () => showPokemonDetails(pokemon.name); // Add click event
        gameBoard.appendChild(pokemonCard);
    });
}

async function showPokemonDetails(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const data = await response.json();
        displayDetails(data);
        getTypeRelations(data); // Fetch type relations
    } catch (error) {
        console.error('Error fetching Pokémon details:', error);
    }
}

function displayDetails(pokemon) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = `
        <div class="pokemon-details">
            <h2>${pokemon.name}</h2>
            <img src="https://img.pokemondb.net/sprites/home/normal/${pokemon.name}.png" alt="${pokemon.name}">
            <p>Type: ${pokemon.types.map(type => type.type.name).join(', ')}</p>
            <p>Abilities: ${pokemon.abilities.map(ability => ability.ability.name).join(', ')}</p>
            <p>Height: ${pokemon.height}</p>
            <p>Weight: ${pokemon.weight}</p>
            <p>Sound: <button id="play-sound-btn">${pokemon.name} sounds like this</button></p>
            <p>Base Experience: ${pokemon.base_experience}</p>
            <button id="choosePokemon">Choose Pokémon</button>
            <div id="info">Info: </div>
            <button onclick="startGame()">Back to Pokédex</button>
        </div>
    `;

    // Add event listener for the "Play Sound" button
    const playSoundButton = document.getElementById('play-sound-btn');
    playSoundButton.addEventListener('click', () => {
        const soundUrl = pokemon.cries.latest;
        playSound(soundUrl);
    });

    const chooseButton = document.getElementById('choosePokemon');
    chooseButton.addEventListener('click', () => {
        localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));

        window.location.href = 'pokemonBattle.html'; // Redirect to battle page
    });
}

async function getTypeRelations(pokemon) {
    try {
        const typeRelations = await Promise.all(
            pokemon.types.map(async type => {
                const response = await fetch(type.type.url);
                return response.json();
            })
        );

        const damageRelations = typeRelations.reduce(
            (acc, relation) => {
                acc.doubleDamageFrom.push(...relation.damage_relations.double_damage_from.map(t => t.name));
                acc.doubleDamageTo.push(...relation.damage_relations.double_damage_to.map(t => t.name));
                acc.halfDamageFrom.push(...relation.damage_relations.half_damage_from.map(t => t.name));
                acc.halfDamageTo.push(...relation.damage_relations.half_damage_to.map(t => t.name));
                acc.noDamageFrom.push(...relation.damage_relations.no_damage_from.map(t => t.name));
                acc.noDamageTo.push(...relation.damage_relations.no_damage_to.map(t => t.name));
                return acc;
            },
            {
                doubleDamageFrom: [],
                doubleDamageTo: [],
                halfDamageFrom: [],
                halfDamageTo: [],
                noDamageFrom: [],
                noDamageTo: []
            }
        );

        const stats = pokemon.stats.map(stat => `${stat.stat.name}: ${stat.base_stat}`).join(', ');

        const information = document.getElementById('info');
        information.innerHTML = `
            <p>Double Damage From: ${[...new Set(damageRelations.doubleDamageFrom)].join(', ')}</p>
            <p>Double Damage To: ${[...new Set(damageRelations.doubleDamageTo)].join(', ')}</p>
            <p>Half Damage From: ${[...new Set(damageRelations.halfDamageFrom)].join(', ')}</p>
            <p>Half Damage To: ${[...new Set(damageRelations.halfDamageTo)].join(', ')}</p>
            <p>No Damage From: ${[...new Set(damageRelations.noDamageFrom)].join(', ')}</p>
            <p>No Damage To: ${[...new Set(damageRelations.noDamageTo)].join(', ')}</p>
            <p>Stats: ${stats}</p>
        `;
    } catch (error) {
        console.error('Error fetching type relations:', error);
    }
}

async function playSound(soundUrl) {
    try {
        const audio = new Audio(soundUrl);
        await audio.play();
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

function startGame() {
    fetchPokemon();
}

window.onload = startGame;
