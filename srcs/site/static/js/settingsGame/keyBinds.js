// Crée un ensemble pour stocker toutes les touches utilisées
const usedKeys = new Set();

export function handleKeyBindings(index, mode) {
    const upKeyField = document.getElementById(`player${index}Up`);
    const downKeyField = document.getElementById(`player${index}Down`);

    const handleKeyEvent = (event, field) => {
        event.preventDefault();
        const key = event.key;
        let displayValue = key;

        // Vérification et conversion des flèches en icônes Unicode
        if (key === "ArrowUp") displayValue = "↑";
        else if (key === "ArrowDown") displayValue = "↓";
        else if (key === "ArrowLeft") displayValue = "←";
        else if (key === "ArrowRight") displayValue = "→";

        // Vérifie si la touche est valide et si elle n'est pas déjà utilisée
        if (/^[a-z0-9]$/.test(key) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            const previousKey = field.getAttribute('data-key'); // Récupère la touche précédente

            // Supprime l'ancienne touche de l'ensemble des touches utilisées
            if (previousKey) {
                usedKeys.delete(previousKey);
            }

            // Vérifie si la nouvelle touche est déjà utilisée
            if (!usedKeys.has(key)) {
                // Si la touche est valide et non utilisée, enregistre-la
                usedKeys.add(key); // Ajoute la nouvelle touche dans l'ensemble global
                field.value = displayValue; // Affiche l'icône ou la lettre
                field.setAttribute('data-key', key); // Stocke la vraie touche dans un attribut data-key
                field.classList.remove('is-invalid'); // Enlève le style rouge si présent
            } else {
                // Si la touche est déjà assignée, applique un style d'erreur
                field.classList.add('is-invalid'); // Ajoute un contour rouge
                setTimeout(() => {
                    field.classList.remove('is-invalid'); // Retire le contour rouge après une courte pause
                }, 1500);
            }
        } else {
            // Si la touche n'est pas autorisée, montre un message
            showMessage("Only lowercase letters, numbers, and arrow keys are allowed.", "warning");
        }
    };

    // Attache les événements de touche pour Up et Down
    upKeyField.addEventListener('keydown', (event) => handleKeyEvent(event, upKeyField));
    downKeyField.addEventListener('keydown', (event) => handleKeyEvent(event, downKeyField));
}

// Fonction pour vider les touches utilisées, utile lors de la réinitialisation ou de la suppression de joueurs
export function clearUsedKeys() {
    usedKeys.clear();
}
