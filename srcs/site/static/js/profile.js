document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const showAllUsers = urlParams.get('showAllUsers');

    if (showAllUsers === 'true') {
        const allUsersContainer = document.getElementById('allUsersContainer');
        const allUsersButton = document.querySelector('[data-bs-target="#allUsersContainer"]') || 
                               document.querySelector('[href="#allUsersContainer"]');
        if (allUsersContainer && !allUsersContainer.classList.contains('show')) {
            new bootstrap.Collapse(allUsersContainer, { toggle: true });
            if (allUsersButton) {
                allUsersButton.setAttribute('aria-expanded', 'true');
            }
        }
        urlParams.delete('showAllUsers');
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }

    const accessToken = localStorage.getItem('accessToken');
    const userFirstName = document.getElementById('userFirstName');
    const userLastName = document.getElementById('userLastName');
    const userUsername = document.getElementById('userUsername');
    const userEmail = document.getElementById('userEmail');
    const profilePhoto = document.getElementById('profilePhoto');
    const editOverlay = document.querySelector('.edit-overlay');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const passwordChangeMessage = document.getElementById('passwordChangeMessage');
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editProfileForm = document.getElementById('editProfileForm');
    const profileEditMessage = document.getElementById('profileEditMessage');

    if (!accessToken) {
        alert('You must be logged in to access this page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('https://localhost:8000/api/user/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error retrieving profile: ${response.status} ${errorText}`);
        }

        const profileData = await response.json();
        profilePhoto.src = profileData.profile_photo;
        userFirstName.textContent = profileData.first_name;
        userLastName.textContent = profileData.last_name;
        userUsername.textContent = profileData.username;
        userEmail.textContent = profileData.email;
    } catch (error) {
        console.error('Error retrieving profile data:', error);
        window.location.href = 'login.html';
    }

    editOverlay.addEventListener('click', () => {
        const editProfilePhotoModal = new bootstrap.Modal(document.getElementById('editProfilePhotoModal'));
        editProfilePhotoModal.show();
    });

    document.getElementById('profilePhotoForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData();
        const newPhoto = document.getElementById('newProfilePhoto').files[0];

        if (newPhoto) {
            formData.append('profile_photo', newPhoto);
        }

        try {
            const response = await fetch('https://localhost:8000/api/user/profile/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error updating profile photo: ${response.status}`);
            }

            const result = await response.json();
            profilePhoto.src = result.profile_photo;
            const editProfilePhotoModal = bootstrap.Modal.getInstance(document.getElementById('editProfilePhotoModal'));
            editProfilePhotoModal.hide();
            location.reload();
        } catch (error) {
            console.error('Error updating profile photo:', error);
        }
    });

    document.getElementById('deletePhotoButton').addEventListener('click', async () => {
        try {
            const response = await fetch('https://localhost:8000/api/user/profile/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ delete_photo: "True" }),
            });

            if (!response.ok) {
                throw new Error(`Error deleting profile photo: ${response.status}`);
            }

            profilePhoto.src = '../../profile_photos/default/default-user-profile-photo.jpg';
            document.getElementById('newProfilePhoto').value = '';
            const editProfilePhotoModal = bootstrap.Modal.getInstance(document.getElementById('editProfilePhotoModal'));
            editProfilePhotoModal.hide();
            location.reload();
        } catch (error) {
            console.error('Error deleting profile photo:', error);
        }
    });

    changePasswordBtn.addEventListener('click', () => {
        const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        changePasswordModal.show();
    });

    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger" data-translate="password_mismatch">Les nouveaux mots de passe ne correspondent pas.</div>';
            return;
        }

        try {
            const response = await fetch('https://localhost:8000/api/user/change-password/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    new_password2: confirmNewPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData).flat().join('<br>');
                passwordChangeMessage.innerHTML = `<div class="alert alert-danger">${errorMessages}</div>`;
                return;
            }

            const result = await response.json();
            passwordChangeMessage.innerHTML = `<div class="alert alert-success">${result.detail}</div>`;
            changePasswordForm.reset();

            setTimeout(() => {
                const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                changePasswordModal.hide();
                passwordChangeMessage.innerHTML = '';
                localStorage.removeItem('accessToken');
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Error changing password:', error);
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger" data-translate="password_change_error">Une erreur s\'est produite lors du changement de mot de passe.</div>';
        }
    });

    editProfileBtn.addEventListener('click', () => {
        clearError(editFirstName);
        clearError(editLastName);
        clearError(editUsername);
        clearError(editEmail);
        profileEditMessage.innerHTML = '';

        editFirstName.value = userFirstName.textContent;
        editLastName.value = userLastName.textContent;
        editUsername.value = userUsername.textContent;
        editEmail.value = userEmail.textContent;

        new bootstrap.Modal(document.getElementById('editProfileModal')).show();
    });

    function showError(field, message) {
        clearError(field);
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

    function validateFirstName() {
        const namePattern = /^[A-Z][a-zA-Z -]{0,49}$/;
        if (!namePattern.test(editFirstName.value.trim())) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let firstNameErrorMessage;

            if (selectedLanguage === 'fr') {
                firstNameErrorMessage = "Le prÃ©nom doit commencer par une lettre majuscule.";
            } else if (selectedLanguage === 'es') {
                firstNameErrorMessage = "El nombre debe comenzar con una letra mayÃºscula.";
            } else if (selectedLanguage === 'bg') {
                firstNameErrorMessage = "Ð˜Ð¼ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð²Ð° Ñ Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°.";
            } else {
                firstNameErrorMessage = "First name must start with a capital letter.";
            }

            showError(editFirstName, firstNameErrorMessage);

            return false;
        } else {
            clearError(editFirstName);
            return true;
        }
    }

    function validateLastName() {
        const namePattern = /^[A-Z][a-zA-Z -]{0,49}$/;
        if (!namePattern.test(editLastName.value.trim())) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let lastNameErrorMessage;

            if (selectedLanguage === 'fr') {
                lastNameErrorMessage = "Le nom doit commencer par une lettre majuscule.";
            } else if (selectedLanguage === 'es') {
                lastNameErrorMessage = "El apellido debe comenzar con una letra mayÃºscula.";
            } else if (selectedLanguage === 'bg') {
                lastNameErrorMessage = "Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð²Ð° Ñ Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°.";
            } else {
                lastNameErrorMessage = "Last name must start with a capital letter.";
            }

            showError(editLastName, lastNameErrorMessage);

            return false;
        } else {
            clearError(editLastName);
            return true;
        }
    }

    function validateUsername() {
        const usernamePattern = /^[a-zA-Z0-9@#_-]{8}$/;
        if (!usernamePattern.test(editUsername.value.trim())) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let usernameErrorMessage;

            if (selectedLanguage === 'fr') {
                usernameErrorMessage = "Le nom d'utilisateur doit contenir exactement 8 caractÃ¨res : lettres, chiffres, - _ @ #";
            } else if (selectedLanguage === 'es') {
                usernameErrorMessage = "El nombre de usuario debe contener exactamente 8 caracteres: letras, nÃºmeros, - _ @ #";
            } else if (selectedLanguage === 'bg') {
                usernameErrorMessage = "ÐŸÐ¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»ÑÐºÐ¾Ñ‚Ð¾ Ð¸Ð¼Ðµ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ñ‚Ð¾Ñ‡Ð½Ð¾ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°: Ð±ÑƒÐºÐ²Ð¸, Ñ†Ð¸Ñ„Ñ€Ð¸, - _ @ #";
            } else {
                usernameErrorMessage = "Username must contain exactly 8 characters: letters, numbers, - _ @ #";
            }

            showError(editUsername, usernameErrorMessage);

            return false;
        } else {
            clearError(editUsername);
            return true;
        }
    }

    function validateEmail() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(editEmail.value)) {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let emailErrorMessage;

            if (selectedLanguage === 'fr') {
                emailErrorMessage = "Adresse email non valide.";
            } else if (selectedLanguage === 'es') {
                emailErrorMessage = "DirecciÃ³n de correo electrÃ³nico no vÃ¡lida.";
            } else if (selectedLanguage === 'bg') {
                emailErrorMessage = "ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ.";
            } else {
                emailErrorMessage = "Invalid email address.";
            }

            showError(editEmail, emailErrorMessage);

            return false;
        } else {
            clearError(editEmail);
            return true;
        }
    }

    function validateForm() {
        let isValid = true;
        if (!validateFirstName()) isValid = false;
        if (!validateLastName()) isValid = false;
        if (!validateUsername()) isValid = false;
        if (!validateEmail()) isValid = false;
        return isValid;
    }

	editProfileForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (!validateForm()) return;
	
		const updatedData = {
			first_name: editFirstName.value,
			last_name: editLastName.value,
			username: editUsername.value,
			email: editEmail.value,
		};
	
		try {
			const response = await fetch('https://localhost:8000/api/user/profile/', {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedData),
			});
	
			if (!response.ok) {
				const errorData = await response.json();
				const errorMessages = Object.values(errorData).flat().join('<br>');
				profileEditMessage.innerHTML = `<div class="alert alert-danger">${errorMessages}</div>`;
				return;
			}
	
			const result = await response.json();
			userFirstName.textContent = result.first_name;
			userLastName.textContent = result.last_name;
			userUsername.textContent = result.username;
			userEmail.textContent = result.email;

			const editProfileModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
			editProfileModal.hide();
			profileEditMessage.innerHTML = '';
		} catch (error) {
			console.error('Error updating profile:', error);
			profileEditMessage.innerHTML = '<div class="alert alert-danger" data-translate="profile_update_error">Une erreur est survenue lors de la mise Ã  jour du profil.</div>';
		}
	});
	
});

document.getElementById('selectPhotoButton').addEventListener('click', () => {
    document.getElementById('newProfilePhoto').click();
});

// Pour mettre à jour l'aperçu de la photo une fois sélectionnée
document.getElementById('newProfilePhoto').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Mise à jour du nom du fichier dans l'élément 'fileNameDisplay'
        document.getElementById('fileNameDisplay').textContent = file.name;
    }
});
