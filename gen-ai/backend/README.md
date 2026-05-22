# Chatbot Document AI Backend

Backend Node.js pour un chatbot intelligent capable d'analyser des documents PDF et DOCX et répondre aux questions des utilisateurs.

## Fonctionnalités

- 📄 Upload de documents PDF et DOCX
- 🔍 Extraction automatique du texte
- 🤖 Chatbot alimenté par LangChain + Ollama
- 🔎 Recherche dans les documents
- 🌐 API REST complète

## Prérequis

- Node.js (v16+)
- Ollama installé et configuré avec un modèle (ex: llama2)

## Installation

1. Cloner le projet
2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer Ollama :
   - Installer Ollama depuis https://ollama.ai
   - Télécharger un modèle : `ollama pull llama2`
   - Démarrer Ollama : `ollama serve`

4. Configurer les variables d'environnement (fichier `.env`) :
   ```
   PORT=3001
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama2
   ```

## Démarrage

```bash
npm run dev  # Mode développement avec nodemon
npm start    # Mode production
```

Le serveur sera accessible sur `http://localhost:3001`

## Interface frontend

Une interface web est disponible dans le dossier `../frontend`. Lorsque le backend est démarré, elle est servie automatiquement sur :

`http://localhost:3001`

## API Endpoints

### POST /upload
Upload d'un document PDF ou DOCX.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (fichier PDF/DOCX)

**Response:**
```json
{
  "message": "Fichier uploadé et traité avec succès",
  "document": {
    "id": "1714464332123-document.pdf",
    "text": "Contenu extrait du document..."
  }
}
```

### POST /ask
Poser une question au chatbot.

**Request:**
```json
{
  "question": "Quelle est la conclusion du document ?",
  "documentId": "1714464332123-document.pdf"  // optionnel
}
```

**Response:**
```json
{
  "answer": "Réponse générée par l'IA",
  "question": "Quelle est la conclusion du document ?",
  "documentId": "1714464332123-document.pdf"
}
```

### GET /documents
Récupérer la liste des documents uploadés.

**Response:**
```json
[
  {
    "id": "1714464332123-document.pdf",
    "name": "document.pdf",
    "uploadedAt": "2024-04-30T08:45:32.123Z",
    "textLength": 15432
  }
]
```

### GET /search?q=terme
Rechercher dans tous les documents.

**Response:**
```json
[
  {
    "id": "1714464332123-document.pdf",
    "snippet": "...contexte autour du terme recherché...",
    "score": 3
  }
]
```

## Test de l'API

Vous pouvez tester l'API avec curl :

```bash
# Upload d'un fichier
curl -X POST -F "file=@document.pdf" http://localhost:3001/upload

# Poser une question
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"Résume ce document","documentId":"1714464332123-document.pdf"}' \
  http://localhost:3001/ask

# Lister les documents
curl http://localhost:3001/documents
```

## Architecture

- `server.js` : Serveur Express principal
- `documentProcessor.js` : Traitement et extraction de texte des documents
- `chatbot.js` : Logique du chatbot utilisant LangChain et Ollama
- `uploads/` : Dossier de stockage des fichiers uploadés

## Technologies utilisées

- **Express.js** : Framework web
- **Multer** : Gestion des fichiers uploadés
- **PDF-parse** : Extraction de texte des PDFs
- **Mammoth** : Extraction de texte des DOCX
- **LangChain** : Framework pour les LLMs
- **Ollama** : Interface locale pour les modèles d'IA
- **ChromaDB** : Base de données vectorielle (pour futures améliorations)

## Développement

Pour contribuer ou modifier le code :

1. Les fichiers principaux sont dans `/backend`
2. Utiliser `npm run dev` pour le développement
3. Les logs sont affichés dans la console

## Prochaines étapes

- [ ] Interface frontend React/Vue
- [ ] Intégration ChromaDB pour la recherche sémantique
- [ ] Support de plus de formats de documents
- [ ] Authentification utilisateur
- [ ] Historique des conversations