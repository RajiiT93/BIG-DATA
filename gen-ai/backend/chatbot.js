const { ChatOllama } = require('@langchain/ollama');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require('@langchain/core/prompts');

class Chatbot {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.ollamaModel = process.env.OLLAMA_MODEL || "llama2:latest";

    this.model = new ChatOllama({
      baseUrl: this.ollamaUrl,
      model: this.ollamaModel,
      temperature: 0.0,
    });

    this.outputParser = new StringOutputParser();

    // Template pour les questions sur les documents
    this.documentPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
Vous êtes un assistant IA strictement francophone.
Vous répondez uniquement en français et utilisez uniquement le contenu du document fourni.
Si la réponse n'est pas dans le document, indiquez clairement que le document ne contient pas l'information.
Ne mélangez pas l'anglais.
`),
      HumanMessagePromptTemplate.fromTemplate(`
CONTEXTE DU DOCUMENT:
{documentText}

QUESTION:
{question}
`),
    ]);

    // Template pour les questions générales
    this.generalPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
Vous êtes un assistant IA strictement francophone.
Répondez uniquement en français.
Ne répondez jamais en anglais.
Soyez clair, direct et précis.
`),
      HumanMessagePromptTemplate.fromTemplate(`
QUESTION:
{question}
`),
    ]);

    this.documentChain = this.documentPrompt.pipe(this.model).pipe(this.outputParser);
    this.generalChain = this.generalPrompt.pipe(this.model).pipe(this.outputParser);
  }

  async askQuestion(question, documentText = null) {
    try {
      console.log('🤖 Question reçue:', question);
      console.log('📄 Document fourni:', documentText ? 'Oui (' + documentText.length + ' caractères)' : 'Non');

      if (documentText && documentText.trim()) {
        // Question sur un document spécifique
        console.log('📖 Utilisation du mode document');
        const response = await this.documentChain.invoke({
          question: question,
          documentText: documentText
        });
        console.log('✅ Réponse générée pour document');
        return response;
      } else {
        // Question générale
        console.log('💬 Utilisation du mode général');
        const response = await this.generalChain.invoke({
          question: question
        });
        console.log('✅ Réponse générée générale');
        return response;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération de réponse:', error);
      return `Désolé, je n'ai pas pu traiter votre question. Vérifiez que Ollama est en cours d'exécution sur ${this.ollamaUrl} et que le modèle ${this.ollamaModel} est disponible.`;
    }
  }

  async askAboutDocument(question, documentId, documentProcessor) {
    try {
      console.log('🔍 Recherche du document:', documentId);
      const document = documentProcessor.getDocument(documentId);
      if (!document) {
        console.log('❌ Document non trouvé:', documentId);
        return 'Document non trouvé. Veuillez vérifier l\'ID du document.';
      }

      console.log('📄 Document trouvé, texte longueur:', document.text.length);
      console.log('📄 Aperçu du texte:', document.text.substring(0, 200) + '...');

      return await this.askQuestion(question, document.text);
    } catch (error) {
      console.error('❌ Erreur lors de la question sur le document:', error);
      return 'Erreur lors du traitement de votre question sur le document.';
    }
  }

  async summarizeDocument(documentText, maxLength = 500) {
    try {
      const summaryPrompt = PromptTemplate.fromTemplate(`
Résumez le document suivant en français en {maxLength} caractères maximum.
Soyez concis mais capturez les points principaux.

Document:
{documentText}

Résumé:
      `);

      const summaryChain = summaryPrompt.pipe(this.model).pipe(this.outputParser);
      const summary = await summaryChain.invoke({
        documentText: documentText,
        maxLength: maxLength
      });

      return summary;
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      return 'Impossible de générer un résumé du document.';
    }
  }
}

module.exports = Chatbot;