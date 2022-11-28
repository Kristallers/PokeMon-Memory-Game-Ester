const apiURL = "https://pokeapi.co/api/v2/pokemon/";

// HTML Elements
const startButton = document.getElementById("startGameButton");
const gameBoard = document.getElementById("gameBoard");
const gameBoardContainer = document.querySelector(".game__board");
const loader = document.getElementById("loader");
const stopwatch = document.getElementById("timer");
const scoreboardWrapper = document.getElementById("scoreboard");
const inputField = document.querySelector("input");

let firstPick;
let isPaused = true;
let matches = 0;

let scoreArray = JSON.parse(localStorage.getItem("scoreArray")) || [];

// * hidden elements by default
gameBoardContainer.classList.add("hidden");
loader.classList.add("hidden");
startButton.classList.add("hidden");

// * input event
inputField.addEventListener("input", () => {
  startButton.classList.remove("hidden");
});

// * Fetch api function
const loadCardsFromApi = async () => {
  loader.classList.remove("hidden");
  const randomPokemonIds = new Set();

  while (randomPokemonIds.size < 8) {
    const randomNumber = Math.ceil(Math.random() * 150);
    randomPokemonIds.add(randomNumber);
  }

  const promisesArray = [...randomPokemonIds].map((randomPokemonId) =>
    fetch(apiURL + randomPokemonId)
  );
  const responseFromApi = await Promise.all(promisesArray);
  const pokemonData = await Promise.all(
    responseFromApi.map((item) => item.json())
  );

  loader.classList.add("hidden");
  return pokemonData;
};

// * Rendering images in the gameboard
const displayPokemonCards = (pokemonIdsArray) => {
  pokemonIdsArray.sort((_) => Math.random() - 0.5);
  const pokemonCardHTML = pokemonIdsArray
    .map((card) => {
      const pokemonImgData = card.sprites.front_default;
      const pokemonNameData = card.name;
      return `
        <div class="game__board--card" onclick="flipCard(event)" data-pokename="${pokemonNameData}">
          <div class="game__board--card-front"></div>
          <div class="game__board--card-back rotated">
            <img src="${pokemonImgData}" alt="${pokemonNameData}"  />
            <h2>${pokemonNameData}</h2>
          </div>
        </div>
      `;
    })
    .join("");
  gameBoard.innerHTML = pokemonCardHTML;
};

// * Scoreboard function
const storeScore = (currentScore) => {
  let name = inputField.value || "Player";
  let scoreDate = new Date();
  let playerScore = {
    date: scoreDate.toLocaleDateString(),
    player: name,
    score: currentScore,
  };
  scoreArray.push(playerScore);
  localStorage.setItem("scoreArray", JSON.stringify(scoreArray));
  return scoreArray;
};

// * create a list element when a score exists
const createListElement = (i) => {
  let scoreboardElement = document.createElement("li");

  scoreboardElement.innerHTML = `<b>${
    JSON.parse(localStorage.getItem("scoreArray"))[i].date
  }</b> ${JSON.parse(localStorage.getItem("scoreArray"))[i].player}: ${
    JSON.parse(localStorage.getItem("scoreArray"))[i].score
  }`;
  scoreboardWrapper.prepend(scoreboardElement);
};

const setScoreboard = () => {
  let i = 0;
  scoreArray.forEach(() => {
    createListElement(i);
    i++;
  });
};

// * start timer functionality
const updateStopwatch = () => {
  const time = Date.now() - timerStart;
  const seconds = Math.floor(time / 1000) % 60;
  const centiSeconds = Math.floor(time / 10) % 100;
  const minutes = Math.floor(time / 1000 / 60) % 60;

  stopwatch.innerHTML = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}:${centiSeconds.toString().padStart(2, "0")}`;
};

const startTimer = () => {
  timerStart = Date.now();
  updateStopwatch();
  timer = setInterval(() => {
    updateStopwatch();
  }, 10);
};

// * stop timer functionality
const stopTimer = () => {
  clearInterval(timer);
};

// * Flipping card functionality
const flipCard = (e) => {
  const pokemonCard = e.currentTarget;
  const [front, back] = getFrontAndBack(pokemonCard);
  if (front.classList.contains("rotated") || isPaused) {
    return;
  }
  isPaused = true;
  rotateElements([front, back]);
  if (!firstPick) {
    firstPick = pokemonCard;
    isPaused = false;
  } else {
    const secondPokemonName = pokemonCard.dataset.pokename;
    const firstPokemonName = firstPick.dataset.pokename;
    if (firstPokemonName !== secondPokemonName) {
      const [firstFront, firstBack] = getFrontAndBack(firstPick);
      setTimeout(() => {
        rotateElements([front, back, firstFront, firstBack]);
        firstPick = null;
        isPaused = false;
      }, 500);
    } else {
      matches++;
      if (matches === 8) {
        stopGame();
      }
      firstPick = null;
      isPaused = false;
    }
  }
};

const getFrontAndBack = (card) => {
  const front = card.querySelector(".game__board--card-front");
  const back = card.querySelector(".game__board--card-back");
  return [front, back];
};

const rotateElements = (elements) => {
  if (typeof elements !== "object" || !elements.length) return;
  elements.forEach((element) => element.classList.toggle("rotated"));
};

// * Start new Game
const createNewGame = async () => {
  isPaused = true;
  firstPick = null;
  matches = 0;
  gameBoardContainer.classList.remove("hidden");
  setTimeout(async () => {
    const gameCardsDataArray = await loadCardsFromApi();
    displayPokemonCards([...gameCardsDataArray, ...gameCardsDataArray]);
    isPaused = false;
  }, 200);

  startTimer();

  startButton.disabled = true; // disables the new game button while a game is already playing
  inputField.disabled = true; // disables the input field while a game is already playing
};

// * Stopping the game
const stopGame = () => {
  stopTimer();
  storeScore(stopwatch.innerText);
  createListElement(scoreArray.length - 1);
  startButton.disabled = false;
};

//* event listeners
startButton.addEventListener("click", createNewGame);

window.addEventListener("load", () => {
  setScoreboard();
});
