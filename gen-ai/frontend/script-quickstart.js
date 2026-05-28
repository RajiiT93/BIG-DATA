const sendBtn = document.getElementById('send');
const stopBtn = document.getElementById('stop');
const promptEl = document.getElementById('prompt');
const messagesEl = document.getElementById('messages');
let es;

function appendChunk(chunk){
  messagesEl.textContent += chunk;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const msg = promptEl.value.trim();
  if (!msg) return alert('Écris d\'abord une question.');

  // close previous connection if any
  if (es) es.close();
  messagesEl.textContent = '';

  const url = `/stream?message=${encodeURIComponent(msg)}`;
  es = new EventSource(url);

  es.onmessage = (e) => {
    // SSE 'data' chunks are received here
    appendChunk(e.data);
  };

  es.addEventListener('done', () => {
    appendChunk('\n\n[FIN]\n');
    es.close();
    es = null;
  });

  es.onerror = (err) => {
    appendChunk('\n\n[ERREUR]\n');
    es.close();
    es = null;
  };
});

stopBtn.addEventListener('click', () => {
  if (es) es.close();
});
