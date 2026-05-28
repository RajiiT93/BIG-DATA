const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

// Simple SSE streaming endpoint (GET) for demo purposes.
// In real use, replace the simulated token stream with calls to your AI SDK.
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Quickstart SSE demo running: http://localhost:${PORT}`);
});
