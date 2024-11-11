import { storeGameSession } from '../games/registerGame.js';

export function initializeStartGame() {
    document.getElementById('startGame').addEventListener('click', () => {
        const mode = document.getElementById('mode').value;
        const playerFields = document.getElementsByClassName('player-control');
        const usedKeys = new Set();
        const usedNames = new Set();

        let allFieldsValid = true;

        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        // Initialisation des messages pour chaque langue
        let messages = {};

        if (selectedLanguage === 'fr') {
            messages = {
                playerFieldsMessage: (i) => `Le joueur ${i + 1} doit avoir un nom et des touches assignées !`,
                nameAlreadyUsedMessage: (playerName) => `Le nom '${playerName}' est déjà utilisé par un autre joueur. Veuillez choisir un nom différent.`,
                sameKeyMessage: (i) => `Le joueur ${i + 1} ne peut pas avoir la même touche pour Haut et Bas.`,
                upKeyUsedMessage: (upKey) => `La touche '${upKey}' est déjà assignée à un autre joueur.`,
                downKeyUsedMessage: (downKey) => `La touche '${downKey}' est déjà assignée à un autre joueur.`
            };
        } else if (selectedLanguage === 'es') {
            messages = {
                playerFieldsMessage: (i) => `¡El jugador ${i + 1} debe tener un nombre y teclas asignadas!`,
                nameAlreadyUsedMessage: (playerName) => `El nombre '${playerName}' ya está en uso por otro jugador. Por favor elija un nombre diferente.`,
                sameKeyMessage: (i) => `El jugador ${i + 1} no puede tener la misma tecla para Arriba y Abajo.`,
                upKeyUsedMessage: (upKey) => `La tecla '${upKey}' ya está asignada a otro jugador.`,
                downKeyUsedMessage: (downKey) => `La tecla '${downKey}' ya está asignada a otro jugador.`
            };
        } else if (selectedLanguage === 'bg') {
            messages = {
                playerFieldsMessage: (i) => `Играч ${i + 1} трябва да има име и зададени клавиши!`,
                nameAlreadyUsedMessage: (playerName) => `Името '${playerName}' вече се използва от друг играч. Моля, изберете различно име.`,
                sameKeyMessage: (i) => `Играч ${i + 1} не може да има един и същ клавиш за горе и долу.`,
                upKeyUsedMessage: (upKey) => `Клавишът '${upKey}' вече е зададен на друг играч.`,
                downKeyUsedMessage: (downKey) => `Клавишът '${downKey}' вече е зададен на друг играч.`
            };
        } else {
            messages = {
                playerFieldsMessage: (i) => `Player ${i + 1} must have a name and keys assigned!`,
                nameAlreadyUsedMessage: (playerName) => `The name '${playerName}' is already used by another player. Please choose a different name.`,
                sameKeyMessage: (i) => `Player ${i + 1} cannot have the same key for both Up and Down.`,
                upKeyUsedMessage: (upKey) => `The key '${upKey}' is already assigned to another player.`,
                downKeyUsedMessage: (downKey) => `The key '${downKey}' is already assigned to another player.`
            };
        }

        for (let i = 0; i < playerFields.length; i++) {
            const playerName = document.getElementById(`player${i}`).value.trim();

            let upKey = '';
            let downKey = '';

            if (mode !== 'tournament' || i < 2) {
                upKey = document.getElementById(`player${i}Up`).getAttribute('data-key') || document.getElementById(`player${i}Up`).value.trim();
                downKey = document.getElementById(`player${i}Down`).getAttribute('data-key') || document.getElementById(`player${i}Down`).value.trim();
            }

            if (!playerName || (mode !== 'tournament' && (!upKey || !downKey))) {
                allFieldsValid = false;
                showMessage(messages.playerFieldsMessage(i), "warning");
                break;
            }

            if (usedNames.has(playerName)) {
                allFieldsValid = false;
                showMessage(messages.nameAlreadyUsedMessage(playerName), "warning");
                break;
            }

            if (mode !== 'tournament' || i < 2) {
                if (upKey === downKey) {
                    allFieldsValid = false;
                    showMessage(messages.sameKeyMessage(i), "warning");
                    break;
                }

                if (usedKeys.has(upKey)) {
                    allFieldsValid = false;
                    showMessage(messages.upKeyUsedMessage(upKey), "warning");
                    break;
                }
                if (usedKeys.has(downKey)) {
                    allFieldsValid = false;
                    showMessage(messages.downKeyUsedMessage(downKey), "warning");
                    break;
                }

                usedKeys.add(upKey);
                usedKeys.add(downKey);
            }

            usedNames.add(playerName);
        }


		if (allFieldsValid) {
			const playerNames = [];
			const playerKeys = [];
			for (let i = 0; i < playerFields.length; i++) {
				const playerName = document.getElementById(`player${i}`).value;

				let upKey = '';
				let downKey = '';

				if (mode !== 'tournament' || i < 2) {
					upKey = document.getElementById(`player${i}Up`).getAttribute('data-key') || document.getElementById(`player${i}Up`).value;
					downKey = document.getElementById(`player${i}Down`).getAttribute('data-key') || document.getElementById(`player${i}Down`).value;
				}

				playerNames.push(playerName);
				playerKeys.push([upKey, downKey]);
			}

			const maxScore = document.getElementById('maxScore').value;
			const paddleSpeed = document.getElementById('paddleSpeed').value;
			const paddleSize = document.getElementById('paddleSize').value;
			const bounceMode = document.getElementById('bounceMode').checked;
			const ballSpeed = document.getElementById('ballSpeed').value;
			const ballAcceleration = document.getElementById('ballAcceleration').value;
			const numBalls = document.getElementById('numBalls').value;
			const map = document.getElementById('map').value;

			localStorage.setItem('gameOptions', JSON.stringify({
				mode, playerNames, playerKeys, maxScore, paddleSpeed, paddleSize, bounceMode, ballSpeed, ballAcceleration, numBalls, map
			}));

			storeGameSession();
			window.location.href = 'game.html';
		}
	});
}
