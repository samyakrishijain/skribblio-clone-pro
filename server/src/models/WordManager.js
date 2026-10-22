const { WORD_BANK, ALL_WORDS } = require('../words/wordBank');

class WordManager {
    constructor(category = 'all', customWords = []) {
        this.category = category;
        this.customWords = this.parseCustomWords(customWords);
        this.usedWords = new Set();
    }

    parseCustomWords(raw) {
        if (Array.isArray(raw)) {
            return raw.map(w => w.trim().toLowerCase()).filter(w => w.length >= 2);
        }
        if (typeof raw === 'string') {
            return raw.split(',')
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length >= 2);
        }
        return [];
    }

    setCategory(category) {
        this.category = category;
    }

    setCustomWords(words) {
        this.customWords = this.parseCustomWords(words);
    }

    getWordPool() {
        if (this.customWords.length >= 5) {
            return this.customWords;
        }

        let pool = [];
        if (this.category === 'all' || !WORD_BANK[this.category]) {
            pool = [...ALL_WORDS];
        } else {
            pool = [...WORD_BANK[this.category]];
        }

        // Mix in any custom words if provided
        if (this.customWords.length > 0) {
            pool = [...pool, ...this.customWords];
        }

        return pool;
    }

    getRandomChoices(count = 3) {
        const pool = this.getWordPool();
        const available = pool.filter(w => !this.usedWords.has(w));
        const candidatePool = available.length >= count ? available : pool;

        const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        selected.forEach(w => this.usedWords.add(w));
        return selected;
    }

    /**
     * Initializes hints for a word.
     * revealedIndices: Set of indices already shown.
     */
    initHints(word) {
        const revealed = new Set();
        // Automatically reveal spaces
        for (let i = 0; i < word.length; i++) {
            if (word[i] === ' ' || word[i] === '-') {
                revealed.add(i);
            }
        }
        return revealed;
    }

    /**
     * Generates a hint representation for viewers
     */
    getMaskedWord(word, revealedIndices) {
        return word
            .split('')
            .map((char, index) => {
                if (char === ' ') return '   ';
                if (revealedIndices.has(index)) return char.toUpperCase();
                return '_';
            })
            .join(' ');
    }

    /**
     * Reveals one new unrevealed letter
     */
    revealNextLetter(word, revealedIndices, maxAllowedReveals = 3) {
        const unrevealed = [];
        for (let i = 0; i < word.length; i++) {
            if (word[i] !== ' ' && word[i] !== '-' && !revealedIndices.has(i)) {
                unrevealed.push(i);
            }
        }

        // Don't reveal more than half or maxAllowedReveals of the word
        const letterCount = word.replace(/[^a-zA-Z]/g, '').length;
        const currentRevealed = revealedIndices.size;
        if (unrevealed.length === 0 || currentRevealed >= Math.min(maxAllowedReveals, Math.floor(letterCount * 0.5))) {
            return false;
        }

        const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndices.add(randomIndex);
        return true;
    }

    /**
     * Check guess against target word
     */
    evaluateGuess(guess, targetWord) {
        const cleanGuess = guess.trim().toLowerCase();
        const cleanTarget = targetWord.trim().toLowerCase();

        if (cleanGuess === cleanTarget) {
            return { isExact: true, isClose: false };
        }

        // Check if close using Levenshtein distance
        if (cleanTarget.length >= 4 && this.levenshtein(cleanGuess, cleanTarget) <= 2) {
            return { isExact: false, isClose: true };
        }

        return { isExact: false, isClose: false };
    }

    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}

module.exports = WordManager;
