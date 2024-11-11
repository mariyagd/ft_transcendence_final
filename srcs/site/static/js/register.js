document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('registrationForm');
    const usernameInput = document.getElementById('username');
    const usernameCharCount = document.getElementById('usernameCharCount');
    const maxUsernameLength = 8;

    // Fonction pour mettre à jour le compteur de caractères restants
    const updateCharCount = () => {
        const remainingChars = maxUsernameLength - usernameInput.value.length;
        usernameCharCount.textContent = `Caractères restants : ${remainingChars}`;
    };

    // Appeler updateCharCount lorsque l'utilisateur tape dans le champ de nom d'utilisateur
    usernameInput.addEventListener('input', updateCharCount);

    // Initialisation de l'affichage du compteur
    updateCharCount();
    const passwordHelpBlock = document.getElementById('passwordHelpBlock');
    const profilePhotoInput = document.getElementById('profile_photo');
    const profilePreviewContainer = document.querySelector('.profile-photo-wrapper-register');
    const profilePreview = document.getElementById('profile_preview');

    profilePhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.src = e.target.result;
                profilePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            profilePreviewContainer.style.display = 'none';
        }
    });

    function showError(field, message) {
        field.classList.add('is-invalid');
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
            errorElement = document.createElement('div');
            errorElement.classList.add('invalid-feedback');
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    function clearError(field) {
        field.classList.remove('is-invalid');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
            errorElement.remove();
        }
    }

    function togglePasswordHelp(isValid) {
        if (isValid) {
            passwordHelpBlock.classList.remove('text-danger');
        } else {
            passwordHelpBlock.classList.add('text-danger');
        }
    }

    function validatePassword(password, firstName, lastName, email, username) {
        let isValid = true;
        let errorMessages = [];

        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        let minLengthMessage, cannotContainMessage, complexityMessage;

        if (selectedLanguage === 'fr') {
            minLengthMessage = 'Au moins 12 caractères';
            cannotContainMessage = "Ne peut pas contenir votre prénom, nom, email, ou nom d'utilisateur";
            complexityMessage = 'Doit contenir des majuscules, minuscules, chiffres et caractères spéciaux';
        } else if (selectedLanguage === 'es') {
            minLengthMessage = 'Al menos 12 caracteres';
            cannotContainMessage = 'No puede ser tu nombre, apellido, correo electrónico, o nombre de usuario';
            complexityMessage = 'Debe contener mayúsculas, minúsculas, números y caracteres especiales';
        } else if (selectedLanguage === 'bg') {
            minLengthMessage = 'Поне 12 символа';
            cannotContainMessage = 'Не може да бъде вашето първо име, фамилия, имейл или потребителско име';
            complexityMessage = 'Трябва да съдържа главни и малки букви, цифри и специални символи';
        } else {
            minLengthMessage = 'At least 12 characters';
            cannotContainMessage = "Can't be your first name, last name, email, or username";
            complexityMessage = 'Must contain uppercase, lowercase, numeric, and special character';
        }

        if (password.length < 12) {
            errorMessages.push(minLengthMessage);
            isValid = false;
        }

        const lowerPassword = password.toLowerCase();
        if (
            lowerPassword.includes(firstName.toLowerCase()) ||
            lowerPassword.includes(lastName.toLowerCase()) ||
            lowerPassword.includes(email.toLowerCase()) ||
            lowerPassword.includes(username.toLowerCase())
        ) {
            errorMessages.push(cannotContainMessage);
            isValid = false;
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            errorMessages.push(complexityMessage);
            isValid = false;
        }

        passwordHelpBlock.innerHTML = isValid
            ? `${minLengthMessage}<br>${complexityMessage}<br>${cannotContainMessage}`
            : errorMessages.join('<br>');
        togglePasswordHelp(isValid);

        return isValid;
    }

    function validateForm() {
        let isValid = true;
        const firstName = document.getElementById('first_name');
        const lastName = document.getElementById('last_name');
        const email = document.getElementById('email');
        const username = document.getElementById('username');
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;
    
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
        // Define messages based on the selected language
        let firstNameMessage, lastNameMessage, emailMessage, usernameMessage, passwordMatchMessage;
    
        if (selectedLanguage === 'fr') {
            firstNameMessage = 'Le prénom doit commencer par une majuscule.';
            lastNameMessage = 'Le nom doit commencer par une majuscule.';
            emailMessage = 'Adresse e-mail invalide.';
            usernameMessage = "Le nom d'utilisateur doit contenir 8 caractères composés uniquement de lettres, chiffres, et les caractères - _ @.";
            passwordMatchMessage = 'Les mots de passe ne correspondent pas.';
        } else if (selectedLanguage === 'es') {
            firstNameMessage = 'El nombre debe comenzar con una letra mayúscula.';
            lastNameMessage = 'El apellido debe comenzar con una letra mayúscula.';
            emailMessage = 'Dirección de correo electrónico no válida.';
            usernameMessage = 'El nombre de usuario debe contener 8 caracteres, incluidos solo letras, números y los caracteres - _ @.';
            passwordMatchMessage = 'Las contraseñas no coinciden.';
        } else if (selectedLanguage === 'bg') {
            firstNameMessage = 'Името трябва да започва с главна буква.';
            lastNameMessage = 'Фамилията трябва да започва с главна буква.';
            emailMessage = 'Невалиден имейл адрес.';
            usernameMessage = 'Потребителското име трябва да съдържа 8 символа, включително само букви, цифри и символите - _ @.';
            passwordMatchMessage = 'Паролите не съвпадат.';
        } else {
            firstNameMessage = 'First name must start with a capital letter.';
            lastNameMessage = 'Last name must start with a capital letter.';
            emailMessage = 'Invalid email address.';
            usernameMessage = 'Username can contain 8 characters with only letters, numbers, and - _ @.';
            passwordMatchMessage = 'Passwords do not match.';
        }
    
        // Nom et prénom
        const namePattern = /^[A-Z][a-zA-Z -]{0,49}$/;
        if (!namePattern.test(firstName.value.trim())) {
            showError(firstName, firstNameMessage);
            isValid = false;
        } else {
            clearError(firstName);
        }
    
        if (!namePattern.test(lastName.value.trim())) {
            showError(lastName, lastNameMessage);
            isValid = false;
        } else {
            clearError(lastName);
        }
    
        // Adresse email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            showError(email, emailMessage);
            isValid = false;
        } else {
            clearError(email);
        }
    
        // Nom d'utilisateur
        const usernamePattern = /^[a-zA-Z0-9@#_-]{8}$/;
        if (!usernamePattern.test(username.value.trim())) {
            showError(username, usernameMessage);
            isValid = false;
        } else {
            clearError(username);
        }
    
        // Mot de passe
        if (!validatePassword(password, firstName.value, lastName.value, email.value, username.value)) {
            isValid = false;
        }
    
        // Confirmation du mot de passe
        if (password !== password2) {
            showError(document.getElementById('password2'), passwordMatchMessage);
            isValid = false;
        } else {
            clearError(document.getElementById('password2'));
        }
    
        return isValid;
    }
    

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
    
        const formData = new FormData(form);
        const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
        try {
            const response = await fetch('https://localhost:8000/api/user/register/', {
                method: 'POST',
                headers: {},
                mode: 'cors',
                body: formData,
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                showMessage(`Error HTTP: ${response.status} - ${errorText}`, 'danger');
                return;
            }
    
            const result = await response.json();
            localStorage.setItem('successMessage', 'Inscription réussie !');
            window.location.href = '../html/login.html';
        } catch (error) {
            let errorMessage;
    
            if (selectedLanguage === 'fr') {
                errorMessage = "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.";
            } else if (selectedLanguage === 'es') {
                errorMessage = 'Se produjo un error durante el registro. Por favor, inténtelo de nuevo.';
            } else if (selectedLanguage === 'bg') {
                errorMessage = 'Възникна грешка при регистрацията. Моля, опитайте отново.';
            } else {
                errorMessage = 'An error occurred during registration. Please try again.';
            }
    
            showMessage(errorMessage, 'danger');
        }
    });    
});