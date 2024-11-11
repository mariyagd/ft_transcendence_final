document.addEventListener('DOMContentLoaded', () => {
    const loginSubmit = document.getElementById('loginSubmit');
    const loginModalElement = document.getElementById('loginModal');
    const loginModal = new bootstrap.Modal(loginModalElement);
    let verifiedUsers = new Map(); // Utilisation d'une Map pour stocker les IDs utilisateur avec les noms
    let usedUsernames = new Set(); // Ensemble pour stocker les noms d'utilisateur vérifiés ou déjà utilisés

    // Fonction de soumission du formulaire
    const submitLogin = async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const playerIndex = document.getElementById('loginPlayerIndex').value;

		const updateVerifiedUsersInLocalStorage = () => {
			const verifiedUsersObject = Object.fromEntries(verifiedUsers); // Conversion de Map en objet pour stockage
			localStorage.setItem('verifiedUsers', JSON.stringify(verifiedUsersObject));
		};

        if (!email || !password) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let enterEmailPasswordMessage;

            if (selectedLanguage === 'fr') {
                enterEmailPasswordMessage = "Veuillez entrer votre email et mot de passe.";
            } else if (selectedLanguage === 'es') {
                enterEmailPasswordMessage = "Por favor, ingrese su correo electrónico y contraseña.";
            } else if (selectedLanguage === 'bg') {
                enterEmailPasswordMessage = "Моля, въведете вашия имейл и парола.";
            } else {
                enterEmailPasswordMessage = "Please enter your email and password.";
            }

            showMessage(enterEmailPasswordMessage, "warning");

            return;
        }

        try {
            const response = await fetch('https://localhost:8000/api/user/verify-user-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error verifying user: ${response.status} ${errorText}`);
            }

            const userData = await response.json();

            // Vérification si l'utilisateur est déjà utilisé pour un autre joueur
            if (verifiedUsers.has(userData.username)) {
				const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

                let userAlreadyLoggedInMessage;

                if (selectedLanguage === 'fr') {
                    userAlreadyLoggedInMessage = "Cet utilisateur est déjà connecté pour un autre joueur.";
                } else if (selectedLanguage === 'es') {
                    userAlreadyLoggedInMessage = "Este usuario ya está conectado para otro jugador.";
                } else if (selectedLanguage === 'bg') {
                    userAlreadyLoggedInMessage = "Този потребител вече е влязъл за друг играч.";
                } else {
                    userAlreadyLoggedInMessage = "This user is already logged in for another player.";
                }

                showMessage(userAlreadyLoggedInMessage, "warning");

                return;
            }

            // Met à jour le champ du joueur avec le nom d'utilisateur
            const playerInput = document.getElementById(`player${playerIndex}`);

            // Si un autre joueur est déjà dans ce champ, le retirer des ensembles
            const previousValue = playerInput.value;
            if (previousValue) {
                verifiedUsers.delete(previousValue); // Retirer l'utilisateur précédent de la Map des utilisateurs vérifiés
                usedUsernames.delete(previousValue); // Retirer de l'ensemble des noms utilisés
            }

            // Définir le nouveau joueur vérifié
            playerInput.value = userData.username;
            playerInput.disabled = true; // Empêche la modification du champ après la vérification
            verifiedUsers.set(userData.username, userData.id); // Ajouter l'utilisateur vérifié à la Map avec son ID
            usedUsernames.add(userData.username); // Ajouter à la liste des noms utilisés

			updateVerifiedUsersInLocalStorage();

            // Fermer la modale après une connexion réussie
            loginModal.hide();

        } catch (error) {
            console.error('Error connecting:', error);
			const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let loginErrorMessage;

            if (selectedLanguage === 'fr') {
                loginErrorMessage = "Une erreur s'est produite lors de la connexion. Vérifiez vos identifiants.";
            } else if (selectedLanguage === 'es') {
                loginErrorMessage = "Se produjo un error durante el inicio de sesión. Verifique sus credenciales.";
            } else if (selectedLanguage === 'bg') {
                loginErrorMessage = "Възникна грешка при влизането. Проверете вашите идентификационни данни.";
            } else {
                loginErrorMessage = "An error occurred during login. Please check your credentials.";
            }

            showMessage(loginErrorMessage, "warning");
        }
    };

    // Lorsque le bouton de connexion est cliqué dans la modale
    loginSubmit.addEventListener('click', submitLogin);

    // Permettre la soumission via la touche "Enter"
    document.getElementById('loginEmail').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLogin();
        }
    });

    document.getElementById('loginPassword').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLogin();
        }
    });

    // Attacher les événements de clic sur tous les boutons "Connect"
    document.addEventListener('click', function (event) {
        if (event.target && event.target.classList.contains('connect-btn')) {
            const playerIndex = event.target.getAttribute('data-player-index');
            document.getElementById('loginPlayerIndex').value = playerIndex;
        }
    });

    // Ajouter un événement qui vide les champs "email" et "password" lorsque la modale se ferme
    loginModalElement.addEventListener('hidden.bs.modal', () => {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPlayerIndex').value = ''; // Réinitialise aussi l'index joueur
    });

    // Empêcher les noms d'invités de dupliquer un nom d'utilisateur vérifié
    document.addEventListener('input', (event) => {
        if (event.target && event.target.matches('[id^="player"]')) {
            const inputField = event.target;
            const playerName = inputField.value.trim();

            if (usedUsernames.has(playerName)) {
				const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

                let nameAlreadyUsedMessage;

                if (selectedLanguage === 'fr') {
                    nameAlreadyUsedMessage = "Ce nom est déjà utilisé par un joueur vérifié. Veuillez en choisir un autre.";
                } else if (selectedLanguage === 'es') {
                    nameAlreadyUsedMessage = "Este nombre ya está en uso por un jugador verificado. Por favor, elija otro.";
                } else if (selectedLanguage === 'bg') {
                    nameAlreadyUsedMessage = "Това име вече се използва от проверен играч. Моля, изберете друго.";
                } else {
                    nameAlreadyUsedMessage = "This name is already used by a verified player. Please choose another one.";
                }

                showMessage(nameAlreadyUsedMessage, "warning");

                inputField.value = ''; // Effacer le champ si le nom est déjà utilisé
            }
        }
    });

    // Exposer les utilisateurs vérifiés pour l'utiliser dans d'autres fichiers
    window.getVerifiedUsers = () => verifiedUsers;
});
