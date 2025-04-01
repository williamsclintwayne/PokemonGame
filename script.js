const POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/";
let selectedCards = [];
let moves = 0;

async function fetchPokemon() {
  const randomIds = new Set();
  while (randomIds.size < 8) {
    randomIds.add(Math.floor(Math.random() * 150) + 1);
  }

  const responses = await Promise.all(
    [...randomIds].map((id) => fetch(POKEAPI_URL + id))
  );

  const pokemonData = await Promise.all(responses.map((res) => res.json()));
  return pokemonData.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.sprites.other["official-artwork"].front_default,
    types: p.types.map((t) => t.type.name),
  }));
}

function createCardElement(pokemon) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${pokemon.image}" alt="${
    pokemon.name
  }" class="pokemon-image">
                        <div class="stats">
                            <h3>${pokemon.name.toUpperCase()}</h3>
                            <p>Types: ${pokemon.types.join(", ")}</p>
                        </div>
                    </div>
                    <div class="card-back">?</div>
                </div>
            `;
  card.dataset.pokemonId = pokemon.id;
  card.addEventListener("click", handleCardClick);
  return card;
}

function handleCardClick(e) {
  const card = e.currentTarget;
  if (card.classList.contains("flipped") || selectedCards.length >= 2) return;

  card.classList.add("flipped");
  selectedCards.push(card);

  if (selectedCards.length === 2) {
    moves++;
    document.getElementById("moves").textContent = `Moves: ${moves}`;
    setTimeout(checkMatch, 1000);
  }
}

function checkMatch() {
  const [card1, card2] = selectedCards;
  const match = card1.dataset.pokemonId === card2.dataset.pokemonId;

  if (!match) {
    card1.classList.remove("flipped");
    card2.classList.remove("flipped");
  }
  selectedCards = [];
}

async function startGame() {
  const gameBoard = document.getElementById("game-board");
  gameBoard.innerHTML = "";
  moves = 0;
  document.getElementById("moves").textContent = "Moves: 0";

  const pokemon = await fetchPokemon();
  const duplicated = [...pokemon, ...pokemon];

  duplicated
    .sort(() => Math.random() - 0.5)
    .forEach((p) => {
      gameBoard.appendChild(createCardElement(p));
    });
}

// Start initial game
startGame();
