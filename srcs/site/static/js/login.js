document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

    // Initialisation des messages pour chaque langue
    let messages = {};

    if (selectedLanguage === 'fr') {
        messages = {
            connectionFailed: (errorMessage) => `Échec de la connexion : ${errorMessage}`,
            noTokens: "Échec de la connexion : aucun token reçu.",
            retryError: "Une erreur s'est produite lors de la connexion. Veuillez réessayer.",
            successMessage: "Connexion réussie !"
        };
    } else if (selectedLanguage === 'es') {
        messages = {
            connectionFailed: (errorMessage) => `Error de conexión: ${errorMessage}`,
            noTokens: "Error de conexión: no se recibió ningún token.",
            retryError: "Ocurrió un error durante la conexión. Inténtalo de nuevo.",
            successMessage: "¡Conexión exitosa!"
        };
    } else if (selectedLanguage === 'bg') {
        messages = {
            connectionFailed: (errorMessage) => `Неуспешна връзка: ${errorMessage}`,
            noTokens: "Неуспешна връзка: не е получен токен.",
            retryError: "Възникна грешка при свързването. Опитайте отново.",
            successMessage: "Успешно влизане!"
        };
    } else {
        messages = {
            connectionFailed: (errorMessage) => `Connection failed: ${errorMessage}`,
            noTokens: "Connection failed: no tokens received.",
            retryError: "An error occurred during connection. Please try again.",
            successMessage: "Login successful!"
        };
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('https://localhost:8000/api/user/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorMessage = 'Error connecting.';
                
                try {
                    // Tenter de parser la réponse en JSON pour obtenir le message d'erreur
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;  // Extraire "detail" s'il est présent
                } catch (jsonError) {
                    // En cas d'échec de parsing, utiliser le texte brut
                    errorMessage = await response.text();
                }

                showMessage(messages.connectionFailed(errorMessage), 'danger');
                return;
            }

            const result = await response.json();
            const accessToken = result.access;
            const refreshToken = result.refresh;

            if (accessToken && refreshToken) {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('successMessage', messages.successMessage);
                window.location.href = 'profile.html';
            } else {
                showMessage(messages.noTokens, 'warning');
            }
        } catch (error) {
            showMessage(messages.retryError, 'danger');
        }
    });
});
