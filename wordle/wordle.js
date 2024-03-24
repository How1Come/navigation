// Define the constants and variables
const wordList = ["apple", "banana", "cherry", /* ... */];
const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
let currentRow = 0;
let currentCol = 0;

// Get the game board element
const gameBoard = document.getElementById("game-board");

// Get the keyboard element
const keyboardContainer = document.getElementById("keyboard");

// Create a function to render the on-screen keyboard
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

    // Add event listener for keyboard clicks
    buttonElement.addEventListener("click", () => handleKeyPress(key));

    keyboardContainer.appendChild(buttonElement);
  });
}

// Function to handle key presses
function handleKeyPress(key) {
  if (key === "⌫") {
    // Handle backspace
    currentCol = Math.max(currentCol - 1, 0);
  } else if (key === "ENTER") {
    // Handle enter key
    currentRow++;
    currentCol = 0;
  } else {
    // Handle letter input
    updateGameBoard(key);
    currentCol++;
  }
}

// Create a function to update the game board
function updateGameBoard(guess) {
  // Clear the game board
  gameBoard.innerHTML = "";

  // Loop through each row
  for (let row = 0; row < 6; row++) {
    // Loop through each column
    for (let col = 0; col < 5; col++) {
      // Create a new tile element
      const tile = document.createElement("div");
      tile.classList.add("tile");

      // If the row and column match the current position,
      // display the guessed letter
      if (row === currentRow && col === currentCol) {
        tile.textContent = guess;
      }
      // Otherwise, display the previously guessed letters
      // and update the tile color based on the correctness of the letter

      // Add the tile to the game board
      gameBoard.appendChild(tile);
    }
  }
}

// Render the on-screen keyboard
renderKeyboard();