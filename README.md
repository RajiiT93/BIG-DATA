# Projet Gen-AI — Quickstart

Ce dépôt contient des exemples et une petite application Gen-AI (backend + frontend) pour des tests et démonstrations.

## Structure du projet

- `ai-quickstart-sse/` : exemple SSE + demo publique
- `gen-ai/backend/` : backend du chatbot, traitement de documents, tests
- `gen-ai/frontend/` : frontend, pages d'exemple et scripts
- `package.json` : fichier racine (scripts globaux éventuels)

## Prérequis

- Node.js (>=16)
- Git

## Installation (exemple)

Ouvrir un terminal à la racine du projet :

```bash
npm install
cd gen-ai/backend
npm install
cd ../..
cd ai-quickstart-sse
npm install
```

## Lancer localement

Backend (exemple) :

```bash
cd gen-ai/backend
node server.js
```

Frontend : ouvrir `gen-ai/frontend/index.html` ou utiliser un serveur statique.

## Répartition du travail

- Rajit : développement et intégration du backend (`gen-ai/backend/`), scripts serveur, tests unitaires.
- Nassim : développement du frontend (`gen-ai/frontend/`), intégration de la démo `ai-quickstart-sse/` et assets publics.

Si vous souhaitez modifier la répartition, dites-le et j'actualiserai ce README.

## Comment pousser sur GitHub

Commandes utiles :

```bash
git add README.md
git commit -m "Add project README with task distribution"
git push origin main
```

Remarque : remplacez `main` par la branche appropriée si nécessaire.

## Contribution

Merci de créer une issue ou un PR pour toute modification importante. Pour les petites tâches, discutez d'abord avec l'autre contributeur avant de merger.

---

Fait par Rajit et Nassim — Répartition initiale listée ci-dessus.