const wordLists = {
  en: ["apple", "banana", "cherry", /* ... */],
  es: ["manzana", "plátano", "cereza", /* ... */],
  pt: ["maçã", "banana", "cereja", /* ... */],
  // Add more word lists for additional languages
};

let currentLanguage = "en";
let targetWord = "";
let currentRow = 0;
let currentCol = 0;

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const languageButtons = document.querySelectorAll(".language-btn");

function initGame() {
  currentRow = 0;
  currentCol = 0;
  targetWord = wordLists[currentLanguage][Math.floor(Math.random() * wordLists[currentLanguage].length)];
  renderKeyboard();
  updateBoard();
}

function renderKeyboard() {
  keyboard.innerHTML = "";
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
  // ... (key press handling logic remains the same)
}

function updateBoard(guess = "") {
  board.innerHTML = "";

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (row === currentRow && col === currentCol) {
        tile.textContent = guess;
      } else if (row < currentRow) {
        const letter = board.children[(row * 5) + col].textContent;
        const color = getColor(letter, col, row);
        tile.textContent = letter;
        tile.classList.add(color);
      }

      board.appendChild(tile);
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

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.id;
    initGame();
    languageButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

initGame();