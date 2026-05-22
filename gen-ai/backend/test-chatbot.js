const DocumentProcessor = require('./documentProcessor');
const Chatbot = require('./chatbot');

async function testChatbot() {
  console.log('🧪 Test du chatbot avec document\n');

  const docProcessor = new DocumentProcessor();
  const chatbot = new Chatbot();

  // Créer un document de test
  const testDocument = {
    id: 'test-doc',
    text: `Ceci est un document de test sur l'intelligence artificielle.
    L'IA est une technologie qui permet aux machines d'apprendre et de raisonner.
    Les applications de l'IA incluent la reconnaissance d'images, le traitement du langage naturel,
    et l'analyse prédictive. Le machine learning est une branche importante de l'IA.`
  };

  // Simuler l'ajout du document
  docProcessor.documents.set('test-doc', testDocument);

  console.log('📄 Document de test ajouté');
  console.log('📝 Contenu:', testDocument.text.substring(0, 100) + '...\n');

  // Test 1: Question sur le document
  console.log('❓ Test 1: Question sur le document');
  const answer1 = await chatbot.askAboutDocument(
    'Quelles sont les applications de l\'IA mentionnées dans ce document ?',
    'test-doc',
    docProcessor
  );
  console.log('💬 Réponse:', answer1);
  console.log('');

  // Test 2: Question générale
  console.log('❓ Test 2: Question générale');
  const answer2 = await chatbot.askQuestion('Quel temps fait-il aujourd\'hui ?');
  console.log('💬 Réponse:', answer2);
  console.log('');

  console.log('✅ Tests terminés');
}

testChatbot().catch(console.error);