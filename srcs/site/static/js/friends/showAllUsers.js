document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const allUsersContainer = document.getElementById('allUsersContainer');
	const newFriendRequestIndicator = document.getElementById('newFriendRequestIndicator');

    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const [usersResponse, friendsResponse, sentRequestsResponse, receivedRequestsResponse] = await Promise.all([
            fetch('https://localhost:8000/api/user/show-all-users/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }),
            fetch('https://localhost:8000/api/friends/show-all-friends/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }),
            fetch('https://localhost:8000/api/friends/show-all-sent-requests/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }),
            fetch('https://localhost:8000/api/friends/show-all-received-requests/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
        ]);

        if (!usersResponse.ok || !friendsResponse.ok || !sentRequestsResponse.ok || !receivedRequestsResponse.ok) {
            throw new Error('Error retrieving data.');
        }

        const users = await usersResponse.json();
        const friendsData = await friendsResponse.json();
        const sentRequestsData = await sentRequestsResponse.json();
        const receivedRequestsData = await receivedRequestsResponse.json();

        const friendIds = new Set(friendsData.map(friendEntry => friendEntry.friend.id));
        const sentRequestIds = new Set(sentRequestsData.map(request => request.receiver.id));
        const receivedRequestIds = new Set(receivedRequestsData.map(request => request.sender.id));

        // Afficher le point jaune clignotant si des demandes d'amis ont été reçues
        if (receivedRequestsData.length > 0) {
            newFriendRequestIndicator.classList.remove('d-none');
        } else {
            newFriendRequestIndicator.classList.add('d-none');
        }

        // Trier les utilisateurs pour afficher d'abord ceux qui ont envoyé une demande, puis les autres par date de création de compte (plus récent au plus ancien)
        const sortedUsers = users.sort((a, b) => {
            if (receivedRequestIds.has(a.id) && !receivedRequestIds.has(b.id)) {
                return -1;
            }
            if (!receivedRequestIds.has(a.id) && receivedRequestIds.has(b.id)) {
                return 1;
            }
            return new Date(b.date_joined) - new Date(a.date_joined);
        });

        users.forEach(user => {
            if (friendIds.has(user.id)) {
                return;
            }

            const userElement = document.createElement('div');
            userElement.classList.add('card', 'mb-3', 'w-auto');
            userElement.innerHTML = `
                <div class="row g-0 align-items-center">
                    <div class="col-md-2">
                        <img src="${user.profile_photo}" class="profile-photo" alt="${user.username}">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title user-username">${user.username}</h5>
                            <p class="card-text user-joined-date">
                                <span data-translate="member_since">Membre depuis :</span> <span class="user-date-joined">${user.date_joined}</span>
                            </p>
                        </div>
                    </div>
                    <div class="col-md-2 d-flex flex-column align-items-center justify-content-center" id="action-${user.id}">
                    </div>
                </div>
            `;
            allUsersContainer.appendChild(userElement);

            const actionContainer = document.getElementById(`action-${user.id}`);

            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

            let cancelText, acceptText, declineText, addFriendText;

            if (selectedLanguage === 'fr') {
                cancelText = "Annuler";
                acceptText = "Accepter";
                declineText = "Refuser";
                addFriendText = "Ajouter";
            } else if (selectedLanguage === 'es') {
                cancelText = "Cancelar";
                acceptText = "Aceptar";
                declineText = "Rechazar";
                addFriendText = "Agregar";
            } else if (selectedLanguage === 'bg') {
                cancelText = "Отказ";
                acceptText = "Приемам";
                declineText = "Отхвърлям";
                addFriendText = "Добавяне";
            } else {
                cancelText = "Cancel";
                acceptText = "Accept";
                declineText = "Decline";
                addFriendText = "Add";
            }

            if (sentRequestIds.has(user.id)) {
                const cancelRequestButton = document.createElement('button');
                cancelRequestButton.textContent = cancelText;
                cancelRequestButton.classList.add('btn', 'btn-danger', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                cancelRequestButton.addEventListener('click', async () => await cancelFriendRequest(user.id));
                actionContainer.appendChild(cancelRequestButton);
            } else if (receivedRequestIds.has(user.id)) {
                const acceptButton = document.createElement('button');
                acceptButton.textContent = acceptText;
                acceptButton.classList.add('btn', 'btn-success', 'mb-2', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                acceptButton.addEventListener('click', async () => await acceptFriendRequest(user.id));

                const declineButton = document.createElement('button');
                declineButton.textContent = declineText;
                declineButton.classList.add('btn', 'btn-danger', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                declineButton.addEventListener('click', async () => await declineFriendRequest(user.id));

                actionContainer.appendChild(acceptButton);
                actionContainer.appendChild(declineButton);
            } else {
                const addFriendButton = document.createElement('button');
                addFriendButton.textContent = addFriendText;
                addFriendButton.classList.add('btn', 'btn-primary', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                addFriendButton.addEventListener('click', async () => await sendFriendRequest(user.id));
                actionContainer.appendChild(addFriendButton);
            }

        });

    } catch (error) {
        console.error('Error managing users and friends:', error);
    }
});


// Fonction pour envoyer une demande d'ami
async function sendFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    const messageContainer = document.getElementById('messageContainer');

    try {
        const response = await fetch('https://localhost:8000/api/friends/send-friend-request/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error sending friend request: ${response.status} ${errorText}`);
        }

		const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        let friendRequestSentMessage;

        if (selectedLanguage === 'fr') {
            friendRequestSentMessage = "Demande d\'ami envoyée avec succès !";
        } else if (selectedLanguage === 'es') {
            friendRequestSentMessage = "¡Solicitud de amistad enviada con éxito!";
        } else if (selectedLanguage === 'bg') {
            friendRequestSentMessage = "Заявката за приятелство е изпратена успешно!";
        } else {
            friendRequestSentMessage = "Friend request sent successfully!";
        }

        showMessage(friendRequestSentMessage, "success");

        window.location.reload();

    } catch (error) {
        console.error('Error sending friend request:', error);
        messageContainer.innerHTML = `<div class="alert alert-danger" data-translate="friend_request_error">Une erreur s'est produite lors de l'envoi de la demande d'ami.</div>`;
    }
}

// Fonction pour accepter une demande d'ami
async function acceptFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/accept-friend-request/', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error accepting friend request: ${response.status} ${errorText}`);
        }

		const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        let friendRequestAcceptedMessage;

        if (selectedLanguage === 'fr') {
            friendRequestAcceptedMessage = "Demande d\'ami acceptée avec succès.";
        } else if (selectedLanguage === 'es') {
            friendRequestAcceptedMessage = "Solicitud de amistad aceptada con éxito.";
        } else if (selectedLanguage === 'bg') {
            friendRequestAcceptedMessage = "Заявката за приятелство беше успешно приета.";
        } else {
            friendRequestAcceptedMessage = "Friend request accepted successfully.";
        }

        showMessage(friendRequestAcceptedMessage, "success");

        window.location.reload();
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

// Fonction pour refuser une demande d'ami
async function declineFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/decline-friend-request/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error refusing friend request: ${response.status} ${errorText}`);
        }

		const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        let friendRequestDeclinedMessage;

        if (selectedLanguage === 'fr') {
            friendRequestDeclinedMessage = "Demande d\'ami refusée avec succès.";
        } else if (selectedLanguage === 'es') {
            friendRequestDeclinedMessage = "Solicitud de amistad rechazada con éxito.";
        } else if (selectedLanguage === 'bg') {
            friendRequestDeclinedMessage = "Заявката за приятелство беше успешно отхвърлена.";
        } else {
            friendRequestDeclinedMessage = "Friend request declined successfully.";
        }

        showMessage(friendRequestDeclinedMessage, "success");

        window.location.reload();
    } catch (error) {
        console.error('Error refusing friend request:', error);
    }
}

// Fonction pour annuler une demande d'ami envoyée
async function cancelFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/cancel-friend-request/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error canceling friend request: ${response.status} ${errorText}`);
        }

		const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

    let friendRequestCancelledMessage;

    if (selectedLanguage === 'fr') {
        friendRequestCancelledMessage = "Demande d\'ami annulée avec succès.";
    } else if (selectedLanguage === 'es') {
        friendRequestCancelledMessage = "Solicitud de amistad cancelada con éxito.";
    } else if (selectedLanguage === 'bg') {
        friendRequestCancelledMessage = "Заявката за приятелство беше успешно отменена.";
    } else {
        friendRequestCancelledMessage = "Friend request cancelled successfully.";
    }

    showMessage(friendRequestCancelledMessage, "success");

        window.location.reload();
    } catch (error) {
        console.error('Error canceling friend request:', error);
    }
}