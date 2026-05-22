const http = require('http');

const testOllama = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/tags',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Ollama accessible');
          console.log('Models disponibles:', json.models.map(m => m.name));
          resolve(json.models);
        } catch (e) {
          console.log('❌ Erreur de parsing JSON:', e.message);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Impossible de contacter Ollama:', e.message);
      console.log('Vérifiez que "ollama serve" est lancé');
      reject(e);
    });

    req.end();
  });
};

testOllama().catch(() => process.exit(1));