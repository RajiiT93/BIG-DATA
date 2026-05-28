const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config();

const DocumentProcessor = require('./documentProcessor');
const Chatbot = require('./chatbot');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation des services
const documentProcessor = new DocumentProcessor();
const chatbot = new Chatbot();

// Test Ollama au démarrage
const testOllamaConnection = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Ollama accessible - Models:', json.models.map(m => m.name));
          resolve(true);
        } catch (e) {
          console.log('❌ Ollama répond mais JSON invalide');
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Ollama non accessible sur http://127.0.0.1:11434');
      console.log('💡 Lancez: ollama serve');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout Ollama');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
}

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et DOCX sont autorisés'));
    }
  }
});

// Routes
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    // Traiter le document
    const processedDoc = await documentProcessor.processFile(req.file.path);

    res.json({
      message: 'Fichier uploadé et traité avec succès',
      document: processedDoc
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'upload du fichier' });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question requise' });
    }

    let answer;
    if (documentId) {
      // Question sur un document spécifique
      answer = await chatbot.askAboutDocument(question, documentId, documentProcessor);
    } else {
      // Question générale
      answer = await chatbot.askQuestion(question);
    }

    res.json({
      answer: answer,
      question: question,
      documentId: documentId || null
    });
  } catch (error) {
    console.error('Erreur lors de la question:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de la question' });
  }
});

app.get('/documents', (req, res) => {
  try {
    const documents = documentProcessor.getAllDocuments().map(doc => ({
      id: doc.id,
      name: doc.id.split('-').slice(1).join('-'),
      uploadedAt: doc.processedAt,
      textLength: doc.text.length
    }));

    res.json(documents);
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

app.get('/search', (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Paramètre de recherche requis' });
    }

    const results = documentProcessor.searchDocuments(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Route SSE pour streaming (quickstart demo)
app.get('/stream', (req, res) => {
  const message = (req.query.message || '').toString().trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Simulated AI response in French
  const fullResponse = `Voici une réponse simulée en français basée sur votre message : "${message}"\nMerci d'avoir testé le quickstart.`;
  const tokens = fullResponse.split(/(\s+)/); // split but keep spaces as tokens

  let i = 0;
  const interval = setInterval(() => {
    if (i >= tokens.length) {
      // signal end
      res.write(`event: done\ndata: [DONE]\n\n`);
      clearInterval(interval);
      res.end();
      return;
    }

    const chunk = tokens[i++];
    // send as SSE data event
    res.write(`data: ${chunk}\n\n`);
  }, 40);

  // client disconnect handling
  req.on('close', () => {
    clearInterval(interval);
  });
});

if (fs.existsSync(frontendPath)) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Interface frontend: http://localhost:${PORT}`);

  // Test de connexion à Ollama
  await testOllamaConnection();
  // Indexer les fichiers déjà présents dans uploads au démarrage
  const uploadDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const f of files) {
      const p = path.join(uploadDir, f);
      try {
        if (fs.statSync(p).isFile()) {
          console.log('📥 Traitement au démarrage du fichier:', f);
          await documentProcessor.processFile(p);
        }
      } catch (e) {
        console.error('Erreur lors du traitement au démarrage:', e);
      }
    }
  }
});