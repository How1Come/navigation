const wordList = ["apple", "banana", "cherry", /* ... */];
const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
let currentRow = 0;
let currentCol = 0;

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");

function renderBoard() {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      board.appendChild(tile);
    }
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
    currentCol = Math.max(currentCol - 1, 0);
  } else if (key === "ENTER") {
    currentRow++;
    currentCol = 0;
  } else {
    updateBoard(key);
    currentCol++;
  }
}

function updateBoard(guess) {
  const tiles = board.querySelectorAll(".tile");

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const index = (row * 5) + col;
      const tile = tiles[index];

      if (row === currentRow && col === currentCol) {
        tile.textContent = guess;
      } else if (row < currentRow) {
        const letter = tile.textContent;
        const color = getColor(letter, col, row);
        tile.classList.add(color);
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