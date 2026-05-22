const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentProcessor {
  constructor() {
    this.documents = new Map(); // Stockage en mémoire des documents traités
  }

  async processFile(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let text = '';

      if (fileExtension === '.pdf') {
        text = await this.extractTextFromPDF(filePath);
      } else if (fileExtension === '.docx') {
        text = await this.extractTextFromDOCX(filePath);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      const documentId = path.basename(filePath);
      this.documents.set(documentId, {
        id: documentId,
        text: text,
        path: filePath,
        processedAt: new Date()
      });

      return {
        id: documentId,
        text: text.substring(0, 500) + '...' // Aperçu du texte
      };
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      throw error;
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Erreur lors de l\'extraction PDF:', error);
      throw new Error('Impossible d\'extraire le texte du PDF');
    }
  }

  async extractTextFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Erreur lors de l\'extraction DOCX:', error);
      throw new Error('Impossible d\'extraire le texte du DOCX');
    }
  }

  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  searchDocuments(query) {
    const results = [];
    for (const [id, doc] of this.documents) {
      if (doc.text.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: doc.id,
          snippet: this.getSnippet(doc.text, query),
          score: this.calculateRelevance(doc.text, query)
        });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  getSnippet(text, query, maxLength = 200) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, maxLength);

    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(text.length, start + maxLength);
    return text.substring(start, end);
  }

  calculateRelevance(text, query) {
    const queryWords = query.toLowerCase().split(' ');
    let score = 0;
    for (const word of queryWords) {
      const count = (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      score += count;
    }
    return score;
  }
}

module.exports = DocumentProcessor;