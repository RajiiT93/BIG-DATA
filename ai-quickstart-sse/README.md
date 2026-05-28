# AI Quickstart — SSE Chat (Local Demo)

Ce petit projet montre comment implémenter un chat en streaming via Server-Sent Events (SSE).
Le serveur simule un flux de tokens d'une IA en français; remplacez la logique de streaming par votre SDK IA réel.

Prérequis
- Node.js 18+ installé
- pnpm (optionnel) ou npm

Installation

```bash
cd ai-quickstart-sse
pnpm install   # ou `npm install`
```

Lancer

```bash
pnpm dev       # ou `npm run dev`
# puis ouvrir http://localhost:3002
```

Remarques
- L'endpoint `/stream` est un GET SSE pour simplifier la démo. Pour intégrer un SDK IA réel, appelez votre client depuis le serveur et streamer les tokens reçus.
- Le code est volontairement minimal pour être facile à comprendre et modifier.
