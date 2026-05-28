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

  getRelevantSnippet(text, query, maxLength = 1500) {
    if (!query || !query.trim()) {
      return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
    }

    const lowerText = text.toLowerCase();
    const terms = query
      .toLowerCase()
      .replace(/["'’‘.,;:!?()\[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    let bestIndex = 0;
    let bestScore = 0;

    for (const term of terms) {
      const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
      const matches = lowerText.match(regex);
      const count = matches ? matches.length : 0;
      if (count > bestScore) {
        bestScore = count;
        bestIndex = lowerText.search(regex);
      }
    }

    if (bestScore === 0 || bestIndex < 0) {
      return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
    }

    const start = Math.max(0, bestIndex - Math.floor(maxLength / 4));
    const end = Math.min(text.length, start + maxLength);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = `...${snippet}`;
    if (end < text.length) snippet = `${snippet}...`;
    return snippet;
  }

  // Extractive QA: find best sentence(s) in the document matching the question
  findBestAnswer(documentText, question, maxSentences = 2) {
    if (!documentText || !question) return null;

    const qLower = question.toLowerCase();
    const wantsList = /\b(\d+|trois|deux|un|principaux|principal|top)\b/.test(qLower);
    const asksProblems = /\b(probl\w*|issue|bug|erreur|difficulté|difficultes)\b/.test(qLower);

    // Normalize and split into sentences
    const cleaned = documentText.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
    const sentences = cleaned.split(/(?<=[\.\!\?])\s+/g).filter(Boolean).map(s => s.trim());

    // Prepare query terms and phrase bigrams
    const qClean = question.toLowerCase().replace(/["'’‘.,;:!?()\[\]{}]/g, ' ');
    const qTerms = qClean.split(/\s+/).filter(Boolean).filter(t => t.length >= 2);
    const bigrams = [];
    for (let i = 0; i < qTerms.length - 1; i++) bigrams.push(`${qTerms[i]} ${qTerms[i+1]}`);

    const scoreForSentence = (s) => {
      const lower = s.toLowerCase();
      let score = 0;

      // Term matches (weighted by length)
      for (const t of qTerms) {
        const esc = t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`\\b${esc}\\b`, 'g');
        const m = lower.match(re);
        if (m) score += m.length * Math.min(3, t.length / 3);
      }

      // Phrase (bigram) matches are stronger signals
      for (const b of bigrams) {
        if (lower.indexOf(b) !== -1) score += 3;
      }

      // Proximity bonus: if multiple query terms appear, reward shorter span
      const positions = [];
      for (const t of qTerms) {
        const idx = lower.indexOf(t);
        if (idx >= 0) positions.push(idx);
      }
      if (positions.length >= 2) {
        positions.sort((a,b)=>a-b);
        const span = positions[positions.length-1] - positions[0] + 1;
        score += Math.max(0, 5 - Math.floor(span / 50));
      }

      // Prefer reasonably concise sentences (penalize extremely long ones)
      const len = s.length;
      if (len > 1000) score -= 1;

      return score;
    };

    // If user asks specifically for problems, try to extract enumerated problem sections
    if (asksProblems) {
      const problemLines = [];
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        if (/\bprobl\w*\b/i.test(s) || /\bimpact\b/i.test(s) || /^\s*Problème\s*\d*/i.test(s)) {
          problemLines.push({ sentence: s, idx: i });
        }
      }
      if (problemLines.length > 0) {
        // Return up to requested number of problems (default 3)
        const n = wantsList ? (qLower.match(/\d+/) ? parseInt(qLower.match(/\d+/)[0],10) : (qLower.includes('trois')?3:3)) : 3;
        const picks = problemLines.slice(0, n).map(p => p.sentence);
        return picks.join(' ');
      }
      // fallback: continue with generic scoring if no explicit problem lines
    }

    const scored = sentences.map(s => ({ sentence: s, score: scoreForSentence(s) }));
    scored.sort((a,b) => b.score - a.score);

    const top = scored.filter(x => x.score > 0).slice(0, maxSentences);
    if (top.length === 0) {
      // If nothing matched, try a relaxed match: include sentences that contain any small term
      const fallback = sentences.filter(s => qTerms.some(t => s.toLowerCase().includes(t))).slice(0, maxSentences);
      if (fallback.length) return fallback.join(' ');
      // final fallback: first sentences
      return sentences.slice(0, maxSentences).join(' ');
    }

    // Expand to include following sentence if top sentence is short and context may help
    const results = [];
    for (const t of top) {
      results.push(t.sentence);
      const idx = sentences.indexOf(t.sentence);
      if (idx >= 0 && idx < sentences.length - 1 && results.length < maxSentences) {
        results.push(sentences[idx+1]);
      }
    }

    // Deduplicate and limit length
    const unique = Array.from(new Set(results)).slice(0, maxSentences);
    let out = unique.join(' ');
    if (out.length > 1500) out = out.slice(0, 1500) + '...';
    return out;
  }
}

module.exports = DocumentProcessor;