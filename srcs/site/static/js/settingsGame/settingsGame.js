import { addPlayerField } from './addPlayerField.js';
import { initializeStartGame } from './startGame.js';
import { clearUsedKeys } from './keyBinds.js';

const MIN_PLAYERS = 2;
const VERSUS_MAX = 4;
const TOURNAMENT_MAX = 10;
const LASTMANSTANDING_MAX = 4;
const BRICKBREAKER_MAX = 4;

let existingUsernames = [];

// Fetch existing usernames
async function fetchExistingUsernames() {
    try {
        const response = await fetch("https://localhost:8000/api/user/show-all-users/");
        if (response.ok) {
            const users = await response.json();
            existingUsernames = users.map(user => user.username.toLowerCase());
        } else {
            console.error('Failed to fetch existing usernames');
        }
    } catch (error) {
        console.error('Error fetching usernames:', error);
    }
}

// Check username availability and show error message if taken
function checkUsernameAvailability(inputField) {
    const username = inputField.value.trim().toLowerCase();

    // Remove any existing error message to avoid duplicates
    let errorMessage = inputField.parentNode.querySelector('.invalid-feedback');
    if (errorMessage) {
        errorMessage.remove();
    }

    // Check if the entered username already exists in the database or among other player inputs
    const isUsernameTaken = existingUsernames.includes(username) || isUsernameAlreadyUsedInGame(username, inputField);

    if (isUsernameTaken) {
        // Add an error message only if the username is already taken
        errorMessage = document.createElement('div');
        errorMessage.classList.add('invalid-feedback', 'text-danger');
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        let nameExistsMessage;

        if (selectedLanguage === 'fr') {
            nameExistsMessage = "Le nom existe déjà, essayez de vous connecter !";
        } else if (selectedLanguage === 'es') {
            nameExistsMessage = "El nombre ya existe, ¡intenta conectarte!";
        } else if (selectedLanguage === 'bg') {
            nameExistsMessage = "Името вече съществува, опитайте се да се свържете!";
        } else {
            nameExistsMessage = "Name already exists, try to connect!";
        }

        errorMessage.textContent = nameExistsMessage;
        inputField.classList.add('is-invalid');
        inputField.parentNode.appendChild(errorMessage);
    } else {
        inputField.classList.remove('is-invalid');
    }
}

// Check if username is already used in another player input field
function isUsernameAlreadyUsedInGame(username, currentInputField) {
    const playerInputFields = document.querySelectorAll('.player-control input[type="text"]');
    for (const field of playerInputFields) {
        if (field !== currentInputField && field.value.trim().toLowerCase() === username) {
            return true;
        }
    }
    return false;
}

// Initialize settings and fetch existing usernames on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchExistingUsernames();

    document.getElementById('mode').addEventListener('change', updateOptions);
    document.getElementById('addPlayer').addEventListener('click', addPlayer);
    document.getElementById('removePlayer').addEventListener('click', removePlayer);
    document.getElementById('defaultSetting').addEventListener('click', resetToDefault);

    document.getElementById('player-controls-wrapper').addEventListener('input', event => {
        if (event.target && event.target.matches('.player-control input[type="text"]')) {
            checkUsernameAvailability(event.target);
        }
    });

    initializeRangeDisplays();
    updateOptions();
    initializeStartGame();
});

// Initialize range sliders display
function initializeRangeDisplays() {
    document.getElementById('maxScore').addEventListener('input', () => {
        document.getElementById('maxScoreValue').textContent = document.getElementById('maxScore').value;
    });
    document.getElementById('paddleSpeed').addEventListener('input', () => {
        document.getElementById('paddleSpeedValue').textContent = document.getElementById('paddleSpeed').value;
    });
    document.getElementById('paddleSize').addEventListener('input', () => {
        document.getElementById('paddleSizeValue').textContent = document.getElementById('paddleSize').value;
    });
    document.getElementById('ballSpeed').addEventListener('input', () => {
        document.getElementById('ballSpeedValue').textContent = document.getElementById('ballSpeed').value;
    });
    document.getElementById('ballAcceleration').addEventListener('input', () => {
        document.getElementById('ballAccelerationValue').textContent = document.getElementById('ballAcceleration').value;
    });
    document.getElementById('numBalls').addEventListener('input', () => {
        document.getElementById('numBallsValue').textContent = document.getElementById('numBalls').value;
    });
    document.getElementById('map').addEventListener('input', () => {
        document.getElementById('mapValue').textContent = document.getElementById('map').value;
    });
}

// Update options based on game mode
function updateOptions() {
    const mode = document.getElementById('mode').value;
    const maxScoreField = document.getElementById('maxScore');
    document.getElementById('player-controls-wrapper').innerHTML = ''; 
    document.getElementById('player-key-wrapper').innerHTML = ''; 

	clearUsedKeys();

    let initialPlayers = MIN_PLAYERS;
    let maxPlayers = getMaxPlayersForMode(mode);

    if (mode === 'brickBreaker') {
        maxScoreField.disabled = true;
        document.getElementById('maxScoreValue').textContent = 'N/A'; 
    } else {
        maxScoreField.disabled = false;
        document.getElementById('maxScoreValue').textContent = maxScoreField.value;
    }

    for (let i = 0; i < initialPlayers; i++) {
        addPlayerField(i);
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

// Helper function to decide the number of players to add or remove
function getPlayersToAddOrRemove(mode) {
    return (mode === 'versus' || mode === 'brickBreaker') ? 2 : 1;
}

function addPlayer() {
    const mode = document.getElementById('mode').value;
    const maxPlayers = getMaxPlayersForMode(mode);
    const playerFields = document.getElementsByClassName('player-control');

    let toAdd = getPlayersToAddOrRemove(mode);
    const currentPlayers = playerFields.length;
    
    for (let i = 0; i < toAdd; i++) {
        if (currentPlayers + i < maxPlayers) {
            addPlayerField(currentPlayers + i, mode === 'tournament'); // add without controls for tournament mode
        }
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

function removePlayer() {
    const mode = document.getElementById('mode').value;
    const column1 = document.getElementById('column1');
    const column2 = document.getElementById('column2');
    const playerContainersCol1 = column1.getElementsByClassName('player-container');
    const playerContainersCol2 = column2.getElementsByClassName('player-container');
    
    let toRemove = getPlayersToAddOrRemove(mode);

    for (let i = 0; i < toRemove; i++) {
        if (playerContainersCol1.length + playerContainersCol2.length > MIN_PLAYERS) {
            if (playerContainersCol1.length > playerContainersCol2.length) {
                playerContainersCol1[playerContainersCol1.length - 1].remove();
            } else {
                playerContainersCol2[playerContainersCol2.length - 1].remove();
            }
        }
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

function updateAddPlayerButton() {
    const mode = document.getElementById('mode').value;
    const maxPlayers = getMaxPlayersForMode(mode);
    const playerFields = document.getElementsByClassName('player-control');

    if (playerFields.length >= maxPlayers) {
        document.getElementById('addPlayer').style.display = 'none';
    } else {
        document.getElementById('addPlayer').style.display = 'inline';
    }
}

function updateRemovePlayerButton() {
    const playerFields = document.getElementsByClassName('player-control');
    if (playerFields.length <= MIN_PLAYERS) {
        document.getElementById('removePlayer').style.display = 'none';
    } else {
        document.getElementById('removePlayer').style.display = 'inline';
    }
}

function getMaxPlayersForMode(mode) {
    switch (mode) {
        case 'versus':
        case 'brickBreaker':
            return VERSUS_MAX;
        case 'tournament':
            return TOURNAMENT_MAX;
        case 'lastManStanding':
            return LASTMANSTANDING_MAX;
        default:
            return 4;
    }
}

updateOptions();
initializeStartGame();

function resetToDefault() {
    document.getElementById('maxScore').value = 10;
    document.getElementById('maxScoreValue').textContent = 10;

    document.getElementById('paddleSpeed').value = 5;
    document.getElementById('paddleSpeedValue').textContent = 5;

    document.getElementById('paddleSize').value = 100;
    document.getElementById('paddleSizeValue').textContent = 100;

    document.getElementById('bounceMode').checked = true;

    document.getElementById('ballSpeed').value = 5;
    document.getElementById('ballSpeedValue').textContent = 5;

    document.getElementById('ballAcceleration').value = 1;
    document.getElementById('ballAccelerationValue').textContent = 1;

    document.getElementById('numBalls').value = 1;
    document.getElementById('numBallsValue').textContent = 1;

    document.getElementById('map').value = 1;
    document.getElementById('mapValue').textContent = 1;
}

// Mettre le focus sur le champ email lorsque la fenêtre de connexion s'ouvre
const loginModal = document.getElementById('loginModal');
loginModal.addEventListener('shown.bs.modal', () => {
    document.getElementById('loginEmail').focus();
});



document.getElementById('defaultSetting').addEventListener('click', resetToDefault);

document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    const matchmakingSection = document.getElementById('matchmakingSection');

    if (!accessToken && matchmakingSection) {
        matchmakingSection.style.display = 'none';
    }
});
