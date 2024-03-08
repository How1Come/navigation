// Word list
const words = ["apple", "banana", "cherry", "grape", "melon", "orange"];

// Generate a random word
const randomWord = words[Math.floor(Math.random() * words.length)];

// Variables to track the game state
let attempts = 0;
let correctLetters = 0;

// Function to check the player's guess
function checkGuess() {
    const guessInputs = document.getElementsByClassName("letter-input");

    let guess = "";
    for (let i = 0; i < guessInputs.length; i++) {
        guess += guessInputs[i].value.toLowerCase();
    }

    attempts++;
    document.getElementById("attemptCount").innerText = attempts;

    if (guess.length !== 5) {
        document.getElementById("resultMessage").innerText = "Please enter a 5-letter word.";
        return;
    }

    correctLetters = 0;
    for (let i = 0; i < randomWord.length; i++) {
        if (guess.includes(randomWord[i])) {
            correctLetters++;
        }
    }

    if (correctLetters === 5) {
        document.getElementById("resultMessage").innerText = "Congratulations! You guessed the word!";
    } else {
        document.getElementById("resultMessage").innerText = `Correct letters: ${correctLetters}`;
    }
}