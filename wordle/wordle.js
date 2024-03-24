const wordList = ["apple", "banana", "cherry", /* ... */];
const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
let currentRow = 0;
let currentCol = 0;
const boardTiles = [];

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");

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
      currentRow++;
      currentCol = 0;
    }
  } else {
    if (currentCol < 5) {
      boardTiles[currentRow][currentCol].textContent = key;
      currentCol++;
    }
  }

  if (currentRow === 6 && currentCol === 5) {
    // Game over
    console.log("Game over!");
  }
}

function updateBoard() {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const letter = boardTiles[row][col].textContent;
      const color = getColor(letter, col, row);
      if (color) {
        boardTiles[row][col].classList.add(color);
      }
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

renderBoard();
renderKeyboard();