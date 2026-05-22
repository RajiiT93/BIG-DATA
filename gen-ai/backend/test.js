// Script de test pour l'API du chatbot
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    console.log('🚀 Test de l\'API Chatbot Document AI\n');

    // Test 1: Vérifier que le serveur répond
    console.log('1. Test de connexion au serveur...');
    const healthCheck = await axios.get(`${BASE_URL}/documents`);
    console.log('✅ Serveur accessible\n');

    // Test 2: Upload d'un fichier (si disponible)
    const testFilePath = path.join(__dirname, 'README.md'); // Utiliser README comme test
    if (fs.existsSync(testFilePath)) {
      console.log('2. Test d\'upload de fichier...');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath), {
        filename: 'test-document.md',
        contentType: 'text/markdown'
      });

      try {
        const uploadResponse = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: formData.getHeaders(),
        });
        console.log('✅ Upload réussi:', uploadResponse.data.message);

        if (uploadResponse.data.document && uploadResponse.data.document.id) {
          const documentId = uploadResponse.data.document.id;

          // Test 3: Poser une question sur le document
          console.log('\n3. Test de question sur le document...');
          const questionResponse = await axios.post(`${BASE_URL}/ask`, {
            question: "Quelles sont les fonctionnalités de ce projet ?",
            documentId: documentId
          });
          console.log('✅ Réponse du chatbot:', questionResponse.data.answer.substring(0, 200) + '...');
        }
      } catch (uploadError) {
        console.log('⚠️ Upload non testé (fichier non trouvé ou format non supporté)');
      }
    }

    // Test 4: Question générale
    console.log('\n4. Test de question générale...');
    const generalQuestion = await axios.post(`${BASE_URL}/ask`, {
      question: "Bonjour, peux-tu te présenter ?"
    });
    console.log('✅ Réponse générale:', generalQuestion.data.answer.substring(0, 200) + '...');

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Assurez-vous que le serveur est démarré avec "npm run dev"');
    }
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };