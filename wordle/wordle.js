const wordList = ["apple", "berry", "catch", /* ... */]; // List of 5-letter words
const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
let currentRow = 0;
let currentCol = 0;
const boardTiles = [];

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const messageContainer = document.getElementById("message");

function renderBoard() {
  for (let row = 0; row < 6; row++) {
    const rowTiles = [];
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      rowTiles.push(tile);
      board.appendChild(tile);
    }
    boardTiles.push(rowTiles);
  }
}

function renderKeyboard() {
  const keys = [
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
    "A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER",
    "Z", "X", "C", "V", "B", "N", "M", "⌫",
  ];

  keys.forEach((key) => {
    const buttonElement = document.createElement("button");
    buttonElement.textContent = key;
    buttonElement.classList.add("key");
    buttonElement.addEventListener("click", () => handleKeyPress(key));
    keyboard.appendChild(buttonElement);
  });
}

function handleKeyPress(key) {
  if (key === "⌫") {
    if (currentCol > 0) {
      currentCol--;
      boardTiles[currentRow][currentCol].textContent = "";
    }
  } else if (key === "ENTER") {
    if (currentCol === 5) {
      const guess = boardTiles[currentRow].map((tile) => tile.textContent.toLowerCase()).join("");
      if (wordList.includes(guess)) {
        updateBoard();
        currentRow++;
        currentCol = 0;
        checkGameStatus();
      } else {
        displayMessage("Not a valid word");
      }
    }
  } else {
    if (currentCol < 5) {
      boardTiles[currentRow][currentCol].textContent = key;
      currentCol++;
    }
  }
}

function updateBoard() {
  for (let row = 0; row < currentRow; row++) {
    for (let col = 0; col < 5; col++) {
      const letter = boardTiles[row][col].textContent.toLowerCase();
      const color = getColor(letter, col, row);
      boardTiles[row][col].classList.remove("correct", "present", "absent");
      boardTiles[row][col].classList.add(color);
    }
  }
}

function getColor(letter, col, row) {
  if (targetWord[col] === letter) {
    return "correct";
  } else if (targetWord.includes(letter)) {
    return "present";
  } else {
    return "absent";
  }
}

function checkGameStatus() {
  const currentGuess = boardTiles[currentRow - 1].map((tile) => tile.textContent.toLowerCase()).join("");
  if (currentGuess === targetWord) {
    displayMessage("Congratulations! You guessed the word correctly!");
  } else if (currentRow === 6) {
    displayMessage(`Game over! The word was "${targetWord}".`);
  }
}

function displayMessage(message) {
  messageContainer.textContent = message;
}

function resetGame() {
  currentRow = 0;
  currentCol = 0;
  boardTiles.forEach((row) => {
    row.forEach((tile) => {
      tile.textContent = "";
      tile.classList.remove("correct", "present", "absent");
    });
  });
  messageContainer.textContent = "";
  targetWord = wordList[Math.floor(Math.random() * wordList.length)];
}

renderBoard();
renderKeyboard();