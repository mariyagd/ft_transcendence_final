#!/bin/sh
set -e

# Attendre que Ganache soit prêt
wait-for-ganache.sh

# Vérifier si le contrat est déjà déployé en essayant d'accéder à son adresse
if truffle networks | grep -q 'Network: development'; then
    echo "Le contrat est déjà déployé sur le réseau 'development'."
else
    echo "Déploiement du contrat sur le réseau 'development'..."
    truffle compile && truffle migrate --network development
fi
