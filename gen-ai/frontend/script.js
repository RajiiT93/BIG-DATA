const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadMessage = document.getElementById('upload-message');
const documentsList = document.getElementById('documents-list');
const refreshDocsBtn = document.getElementById('refresh-docs');
const documentSelect = document.getElementById('document-select');
const questionInput = document.getElementById('question-input');
const askButton = document.getElementById('ask-button');
const answerCard = document.getElementById('answer-card');
const answerText = document.getElementById('answer-text');
const askMessage = document.getElementById('ask-message');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const API_BASE = '';

async function fetchDocuments() {
  documentsList.innerHTML = '<p>Chargement...</p>';

  try {
    const response = await fetch(`${API_BASE}/documents`);
    const documents = await response.json();

    updateDocumentSelect(documents);
    renderDocuments(documents);
  } catch (error) {
    documentsList.innerHTML = '<p>Impossible de charger les documents.</p>';
    console.error(error);
  }
}

function updateDocumentSelect(documents) {
  documentSelect.innerHTML = '<option value="">Aucune - question générale</option>';
  documents.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${doc.name} (${Math.round(doc.textLength / 1000)}k mots)`;
    documentSelect.appendChild(option);
  });
}

function renderDocuments(documents) {
  if (!documents.length) {
    documentsList.innerHTML = '<p>Aucun document encore uploadé.</p>';
    return;
  }

  documentsList.innerHTML = '';
  documents.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'document-card';
    card.innerHTML = `
      <h3>${doc.name}</h3>
      <div><strong>ID :</strong> ${doc.id}</div>
      <div><strong>Texte :</strong> ${doc.textLength ? `${doc.textLength} caractères` : 'N/A'}</div>
      ${doc.snippet ? `<div><strong>Extrait :</strong> ${doc.snippet}</div>` : ''}
      <div><small>Uploadé : ${new Date(doc.uploadedAt).toLocaleString()}</small></div>
      <button data-id="${doc.id}" class="select-doc">Utiliser ce document</button>
    `;
    documentsList.appendChild(card);
  });

  document.querySelectorAll('.select-doc').forEach(button => {
    button.addEventListener('click', () => {
      documentSelect.value = button.dataset.id;
      askMessage.textContent = 'Document sélectionné pour la question.';
      askMessage.style.color = '#16a34a';
    });
  });
}

uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  uploadMessage.textContent = '';

  const file = fileInput.files[0];
  if (!file) {
    uploadMessage.textContent = 'Sélectionne un fichier PDF ou DOCX.';
    uploadMessage.style.color = '#b91c1c';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  uploadMessage.textContent = 'Upload en cours...';
  uploadMessage.style.color = '#0f172a';

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de l\'upload');
    }

    uploadMessage.textContent = result.message;
    uploadMessage.style.color = '#16a34a';
    fileInput.value = '';
    fetchDocuments();
  } catch (error) {
    uploadMessage.textContent = error.message;
    uploadMessage.style.color = '#b91c1c';
    console.error(error);
  }
});

askButton.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  const documentId = documentSelect.value;

  askMessage.textContent = '';
  answerCard.classList.add('hidden');

  if (!question) {
    askMessage.textContent = 'Écris d\'abord une question.';
    askMessage.style.color = '#b91c1c';
    return;
  }

  askMessage.textContent = 'Génération en cours...';
  askMessage.style.color = '#0f172a';

  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, documentId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de l\'envoi de la question');
    }

    answerText.textContent = result.answer;
    answerCard.classList.remove('hidden');
    askMessage.textContent = 'Réponse reçue.';
    askMessage.style.color = '#16a34a';
  } catch (error) {
    askMessage.textContent = error.message;
    askMessage.style.color = '#b91c1c';
    console.error(error);
  }
});

refreshDocsBtn.addEventListener('click', () => fetchDocuments());
searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) {
    askMessage.textContent = 'Saisis un terme à rechercher.';
    askMessage.style.color = '#b91c1c';
    return;
  }

  askMessage.textContent = 'Recherche en cours...';
  askMessage.style.color = '#0f172a';

  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    if (!response.ok) {
      throw new Error(results.error || 'Erreur lors de la recherche');
    }

    if (!results.length) {
      documentsList.innerHTML = '<p>Aucun résultat pour cette recherche.</p>';
      askMessage.textContent = 'Aucun résultat trouvé.';
      askMessage.style.color = '#f97316';
      return;
    }

    renderDocuments(results.map(item => ({
      id: item.id,
      name: item.id.split('-').slice(1).join('-'),
      uploadedAt: new Date().toISOString(),
      textLength: 0,
      snippet: item.snippet
    })));
    askMessage.textContent = 'Résultats de recherche affichés.';
    askMessage.style.color = '#16a34a';
  } catch (error) {
    askMessage.textContent = error.message;
    askMessage.style.color = '#b91c1c';
    console.error(error);
  }
});

fetchDocuments();
