import { terminerTournoi } from '../../game/js/mods/tournament.js';
let tournamentContract;
let web3Initialized = false;

// Fonction pour charger Web3
async function chargerWeb3() {
    return new Promise((resolve, reject) => {
        if (typeof window.Web3 !== 'undefined') {
            console.log('Web3 est déjà chargé.');
            resolve();
            return;
        }
        // Utilisation de window.location.origin pour le domaine dynamique
        const domain = window.location.origin;
        const script = document.createElement('script');
        script.src = `${domain}/static/js/web3.min.js`;

        script.onload = () => {
            if (typeof window.Web3 !== 'undefined') {
                console.log('Web3 chargé avec succès');
                resolve();
            } else {
                reject(new Error('Web3 n\'a pas pu être chargé'));
            }
        };

        script.onerror = () => {
            reject(new Error('Échec du chargement de Web3'));
        };

        document.head.appendChild(script);
    });
}
// Fonction pour initialiser Web3 et le contrat
async function initWeb3() {
    if (web3Initialized) {
        console.log('Web3 est déjà initialisé.');
        return;
    }
    await chargerWeb3();

    // Utilisation de window.location.origin pour que l'URL s'ajuste au domaine courant
    const ganacheUrl = `${window.location.origin}/ganache/`;
    window.web3 = new Web3(new Web3.providers.HttpProvider(ganacheUrl));

    const domain = window.location.origin;
    const tournamentContractJSON = await fetch(`${domain}/contracts/TournamentScore.json`).then(response => response.json());

    const contractABI = tournamentContractJSON.abi;
    const networkId = Object.keys(tournamentContractJSON.networks)[0];
    const contractAddress = tournamentContractJSON.networks[networkId]?.address;

    if (!contractAddress) throw new Error('Adresse du contrat non trouvée.');
    tournamentContract = new web3.eth.Contract(contractABI, contractAddress);
    web3Initialized = true;
    console.log('Contrat initialisé:', tournamentContract);
}

// Fonction pour enregistrer le gagnant sur la blockchain
async function enregistrerGagnantSurBlockchain(gagnant) {
    try {
        await initWeb3();
        const compte = (await web3.eth.getAccounts())[0];
        const txReceipt = await tournamentContract.methods.enregistrerGagnant(gagnant).send({ from: compte, gas: 500000 });
        const block = await web3.eth.getBlock(txReceipt.blockNumber);
        return new Date(block.timestamp * 1000);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du gagnant sur la blockchain', error);
        return null;
    }
}

export { tournamentContract };

function getGameModeCode(mode) {
    switch (mode.toLowerCase()) {
        case 'versus':
            return 'VS';
        case 'tournament':
            return 'TN';
        case 'lastmanstanding':
            return 'LS';
        case 'brickbreaker':
            return 'BB';
        default:
            return mode;
    }
}

async function sendGameSessionToAPI(sessionData) {
    const token = await getValidToken();
    
    // Si aucun token, ne pas faire d'appel à l'API, stocker uniquement en local
    if (!token) {
        console.warn("No access token, game session stored locally only.");
        localStorage.setItem('offlineGameSession', JSON.stringify(sessionData));
        return;
    }

    sessionData.session.mode = getGameModeCode(sessionData.session.mode);	

    try {
        const response = await fetch('https://localhost:8000/api/game/register-game-session/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error saving game: ${response.status} ${errorText}`);
        }

        console.log('Game saved successfully');
    } catch (error) {
        console.error('Error saving game :', error);
    }
}

async function sendTournamentSessionToAPI(sessionData) {
    const token = await getValidToken();

    // Si aucun token, ne pas faire d'appel à l'API, stocker uniquement en local
    if (!token) {
        console.warn("No access token, tournament session stored locally only.");
        localStorage.setItem('offlineTournamentSession', JSON.stringify(sessionData));
        return;
    }

    sessionData.session.mode = 'TN';
    const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers')) || {};

    sessionData.players = sessionData.players.map(player => {
        if (player.user && !player.alias) {
            player.alias = Object.keys(verifiedUsers).find(key => verifiedUsers[key] === player.user) || player.user;
        }
        return player;
    });

    try {
        const response = await fetch('https://localhost:8000/api/game/register-tournament-session/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error saving tournament: ${response.status} ${errorText}`);
        }

        console.log('Tournament saved successfully');
    } catch (error) {
        console.error('Error saving tournament :', error);
    }
}

async function getValidToken() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken) {
        console.warn("Access token is missing. Game will be played in offline mode.");
        return null; // Retourne null si aucun token, pour fonctionner hors-ligne
    }

    return isTokenExpired(accessToken) ? await refreshAccessToken(refreshToken) : accessToken;
}



function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
}


// Fonction pour formater la date en 'DD/MM/YYYY HH:MM:SS'
function formatDateToStandard(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${day}/${month} ${hours}:${minutes}:${seconds}`;
}

export function storeGameSession() {
    const gameSessionOptions = JSON.parse(localStorage.getItem('gameOptions'));
    const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers')) || {};

    if (gameSessionOptions) {
        const { mode, playerNames } = gameSessionOptions;

        const players = playerNames.map((name) => {
            const userId = verifiedUsers[name];
            return userId ? { user: userId } : { alias: name };
        });

        // Formatage correct de start_date avec formatDateToStandard avant stockage
        const sessionData = {
            session: { mode },
            players,
            start_date: formatDateToStandard(new Date()) // Assure le formatage correct
        };

        // Enregistrer le format de date correct dans localStorage
        localStorage.setItem('gameSession', JSON.stringify(sessionData));
    }
}
//new

export function registerGameWinner(winnerAlias) {
    const sessionData = JSON.parse(localStorage.getItem('gameSession'));
    if (sessionData) {
        const winners = winnerAlias.split(' & ').map(name => name.trim());
        
        if (winners.length === 2) {
            sessionData.winner1 = winners[0];
            sessionData.winner2 = winners[1];
        } else {
            sessionData.winner1 = winners[0];
            delete sessionData.winner2;
        }

        sendGameSessionToAPI(sessionData);
    }
}

export async function registerTournamentWinner(finalWinnerAlias) {
    const sessionData = JSON.parse(localStorage.getItem('gameSession'));

    if (sessionData) {
        sessionData.winner1 = finalWinnerAlias;
        delete sessionData.winner2;

        sendTournamentSessionToAPI(sessionData);  // Appeler l'API de tournoi

		// Enregistrer le gagnant du tournoi sur la blockchain
		const date = await enregistrerGagnantSurBlockchain(finalWinnerAlias);
		if (date) {
			console.log(`Gagnant enregistré sur la blockchain le ${date}`);

			// Appeler terminerTournoi uniquement pour afficher l'historique
			const wins = { [finalWinnerAlias]: 1 };
			await terminerTournoi(wins);
		}
    }
}
