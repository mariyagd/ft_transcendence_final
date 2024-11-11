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
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger">Les nouveaux mots de passe ne correspondent pas.</div>';
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
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger">Une erreur s\'est produite lors du changement de mot de passe.</div>';
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
            showError(editFirstName, 'Le prénom doit commencer par une lettre majuscule.');
            return false;
        } else {
            clearError(editFirstName);
            return true;
        }
    }

    function validateLastName() {
        const namePattern = /^[A-Z][a-zA-Z -]{0,49}$/;
        if (!namePattern.test(editLastName.value.trim())) {
            showError(editLastName, 'Le nom doit commencer par une lettre majuscule.');
            return false;
        } else {
            clearError(editLastName);
            return true;
        }
    }

    function validateUsername() {
        const usernamePattern = /^[a-zA-Z0-9@#_-]{8}$/;
        if (!usernamePattern.test(editUsername.value.trim())) {
            showError(editUsername, "Le nom d'utilisateur doit contenir exactement 8 caractères : lettres, chiffres, - _ @ #");
            return false;
        } else {
            clearError(editUsername);
            return true;
        }
    }

    function validateEmail() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(editEmail.value)) {
            showError(editEmail, 'Adresse email non valide.');
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
	
			// Fermer la modale après validation
			const editProfileModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
			editProfileModal.hide();
			profileEditMessage.innerHTML = '';
		} catch (error) {
			console.error('Error updating profile:', error);
			profileEditMessage.innerHTML = '<div class="alert alert-danger">Une erreur est survenue lors de la mise à jour du profil.</div>';
		}
	});
	
});
