#!/bin/bash

# Effectuer la migration
truffle migrate --network development

# Assurer que le fichier JSON a les bons droits
if [ -f /app/build/contracts/TournamentScore.json ]; then
  chown www-data:www-data /app/build/contracts/TournamentScore.json
  chmod 644 /app/build/contracts/TournamentScore.json
fi

# Garder le conteneur en cours d'exécution (optionnel)
tail -f /dev/null
