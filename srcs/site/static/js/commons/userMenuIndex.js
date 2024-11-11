document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userMenu = document.getElementById('userMenu');

    // Fonction pour supprimer les tokens invalides du localStorage
    function clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    async function getProfilePhoto() {
        try {
            const response = await fetch('https://localhost:8000/api/user/profile/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error(`Error retrieving profile: ${response.status}`);
            
            const profileData = await response.json();
            return profileData.profile_photo || '../../profile_photos/default/default-user-profile-photo.jpg';
        } catch (error) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let errorMessage;

            if (selectedLanguage === 'fr') {
                errorMessage = "Impossible de charger la photo de profil.";
            } else if (selectedLanguage === 'es') {
                errorMessage = "No se pudo cargar la foto de perfil.";
            } else if (selectedLanguage === 'bg') {
                errorMessage = "Неуспешно зареждане на профилната снимка.";
            } else {
                errorMessage = "Unable to load profile picture.";
            }

            showMessage(errorMessage, "danger");
            return '../../profile_photos/default/default-user-profile-photo.jpg';
        }
    }

    async function verifyToken() {
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
        let sessionExpiredMessage, networkErrorMessage;
    
        if (selectedLanguage === 'fr') {
            sessionExpiredMessage = "Session expirée. Veuillez vous reconnecter.";
            networkErrorMessage = "Erreur réseau. Veuillez vous reconnecter.";
        } else if (selectedLanguage === 'es') {
            sessionExpiredMessage = "Sesión expirada. Por favor, vuelva a iniciar sesión.";
            networkErrorMessage = "Error de red. Por favor, vuelva a iniciar sesión.";
        } else if (selectedLanguage === 'bg') {
            sessionExpiredMessage = "Сесията е изтекла. Моля, влезте отново.";
            networkErrorMessage = "Мрежова грешка. Моля, влезте отново.";
        } else {
            sessionExpiredMessage = "Session expired. Please log in again.";
            networkErrorMessage = "Network error. Please log in again.";
        }
    
        try {
            const verifyResponse = await fetch('https://localhost:8000/api/user/token/verify/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: accessToken }),
            });
    
            if (!verifyResponse.ok) {
                clearTokens();
                showMessage(sessionExpiredMessage, "warning");
                window.location.href = 'index.html';
                return false;
            }
            return true;
        } catch (error) {
            clearTokens();
            showMessage(networkErrorMessage, "danger");
            window.location.href = 'index.html';
            return false;
        }
    }
    

    async function verifyUser() {
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
        let accountIssueMessage, networkErrorMessage;
    
        if (selectedLanguage === 'fr') {
            accountIssueMessage = "Votre compte a été supprimé ou vous n'êtes plus connecté.";
            networkErrorMessage = "Erreur réseau lors de la vérification du profil. Veuillez vous reconnecter.";
        } else if (selectedLanguage === 'es') {
            accountIssueMessage = "Su cuenta ha sido eliminada o ya no está conectado.";
            networkErrorMessage = "Error de red al verificar el perfil. Por favor, vuelva a iniciar sesión.";
        } else if (selectedLanguage === 'bg') {
            accountIssueMessage = "Вашият акаунт е изтрит или вече не сте влезли в системата.";
            networkErrorMessage = "Мрежова грешка при проверка на профила. Моля, влезте отново.";
        } else {
            accountIssueMessage = "Your account has been deleted or you are no longer logged in.";
            networkErrorMessage = "Network error while verifying profile. Please log in again.";
        }
    
        try {
            const profileResponse = await fetch('https://localhost:8000/api/user/profile/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
    
            if (!profileResponse.ok) {
                clearTokens();
                showMessage(accountIssueMessage, "warning");
                window.location.href = 'index.html';
                return false;
            }
            return true;
        } catch (error) {
            clearTokens();
            showMessage(networkErrorMessage, "danger");
            window.location.href = 'index.html';
            return false;
        }
    }
    

    // Vérification des tokens et de l'utilisateur
    if (accessToken) {
        const tokenValid = await verifyToken();
        if (!tokenValid) return;

        const userExists = await verifyUser();
        if (!userExists) return;
    }

    checkForMessage();

    // Construction du menu utilisateur en fonction de l'état de connexion
    if (accessToken) {
        const profilePhoto = await getProfilePhoto();
        userMenu.innerHTML = `
            <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <div class="profile-photo-wrapper-nav">
                    <img src="${profilePhoto}" alt="User Menu" class="profile-photo">
                </div>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="html/profile.html"data-translate="profil_button">Profile</a></li>
                <li><a class="dropdown-item" href="#" id="logoutBtn"data-translate="logout_button">Logout</a></li>
            </ul>
        `;
    
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
            let notConnectedMessage, logoutErrorMessage;
    
            if (selectedLanguage === 'fr') {
                notConnectedMessage = "Vous n'êtes pas connecté.";
                logoutErrorMessage = "Une erreur s'est produite lors de la déconnexion.";
            } else if (selectedLanguage === 'es') {
                notConnectedMessage = "No está conectado.";
                logoutErrorMessage = "Se produjo un error al cerrar la sesión.";
            } else if (selectedLanguage === 'bg') {
                notConnectedMessage = "Не сте влезли в системата.";
                logoutErrorMessage = "Възникна грешка при излизане от системата.";
            } else {
                notConnectedMessage = "You are not logged in.";
                logoutErrorMessage = "An error occurred while logging out.";
            }
    
            if (!refreshToken) {
                showMessage(notConnectedMessage, "warning");
                window.location.href = 'index.html';
                return;
            }
    
            try {
                const response = await fetch('https://localhost:8000/api/user/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ refresh: refreshToken }),
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error disconnecting: ${response.status} ${errorText}`);
                }
    
                clearTokens();
                localStorage.setItem('successMessage', 'Disconnection successful!');
                window.location.href = 'index.html';
    
            } catch (error) {
                showMessage(logoutErrorMessage, "danger");
            }
        });
    } else {
        userMenu.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="../../profile_photos/default/default-user-profile-photo.jpg" alt="User Menu" width="50" height="50" class="rounded-circle">
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="html/register.html"data-translate="register_button">Register</a></li>
                <li><a class="dropdown-item" href="html/login.html"data-translate="login_button">Login</a></li>
            </ul>
        `;
    }    
});

// Animation blob
const blob = document.querySelector('.blob');
document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const speed = Math.min(10, Math.hypot(e.movementX, e.movementY) / 10);
    blob.style.transform = `translate3d(calc(${clientX}px - 50%), calc(${clientY}px - 50%), 0) scale(${1 + speed / 10})`;
});
