const DrawingSession = require('./DrawingSession');
const WordManager = require('./WordManager');

class Game {
    constructor(room, io) {
        this.room = room;
        this.io = io;
        this.drawingSession = new DrawingSession();
        this.wordManager = new WordManager(room.settings.category, room.settings.customWords);

        this.currentRound = 0;
        this.totalRounds = room.settings.rounds || 3;
        this.drawDuration = room.settings.drawTime || 80;
        this.wordChoicesCount = room.settings.wordCount || 3;
        this.maxHints = room.settings.hintsCount ?? 2;

        this.phase = 'LOBBY'; // 'LOBBY', 'WORD_SELECTION', 'DRAWING', 'ROUND_END', 'GAME_OVER'
        this.drawerOrder = [];
        this.currentDrawerIndex = -1;
        this.activeDrawerId = null;

        this.targetWord = '';
        this.revealedIndices = new Set();
        this.hintSchedule = [];

        this.timer = 0;
        this.timerInterval = null;
        this.turnTimeout = null;
    }

    start() {
        this.currentRound = 1;
        this.buildDrawerOrder();

        if (this.drawerOrder.length === 0) {
            throw new Error('Not enough players to start');
        }

        // Reset all player game scores
        this.room.participants.forEach(p => p.resetGameScore());

        this.currentDrawerIndex = -1;
        this.startNextTurn();
    }

    buildDrawerOrder() {
        const playerIds = Array.from(this.room.participants.keys());
        // Shuffle order for variety
        this.drawerOrder = [...playerIds].sort(() => 0.5 - Math.random());
    }

    startNextTurn() {
        this.clearTimers();
        this.drawingSession.reset();

        // Check if current round has completed
        this.currentDrawerIndex++;
        if (this.currentDrawerIndex >= this.drawerOrder.length) {
            // Next round
            this.currentRound++;
            this.currentDrawerIndex = 0;
            this.buildDrawerOrder();
        }

        // Check if all rounds are completed
        if (this.currentRound > this.totalRounds) {
            return this.endGame();
        }

        const nextDrawerId = this.drawerOrder[this.currentDrawerIndex];
        const drawer = this.room.participants.get(nextDrawerId);

        // If drawer is missing or disconnected, skip to next
        if (!drawer) {
            return this.startNextTurn();
        }

        // Reset turn states for all participants
        this.room.participants.forEach(p => p.resetTurnState());
        drawer.isDrawing = true;
        this.activeDrawerId = nextDrawerId;

        // Transition to WORD_SELECTION phase
        this.phase = 'WORD_SELECTION';
        this.targetWord = '';
        this.revealedIndices = new Set();
        this.timer = 15; // 15 seconds to pick a word

        const choices = this.wordManager.getRandomChoices(this.wordChoicesCount);

        // Broadcast turn start to everyone
        this.io.to(this.room.id).emit('round_start', {
            drawerId: this.activeDrawerId,
            drawerName: drawer.name,
            round: this.currentRound,
            totalRounds: this.totalRounds,
            phase: 'WORD_SELECTION',
            drawTime: this.drawDuration
        });

        // Send word choices privately to the drawer
        this.io.to(this.activeDrawerId).emit('word_choices', {
            words: choices,
            timeLimit: 15
        });

        // Run selection countdown
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.to(this.room.id).emit('timer_tick', { timeLeft: this.timer });

            if (this.timer <= 0) {
                this.clearTimers();
                // Auto-pick first word if drawer didn't choose
                this.selectWord(this.activeDrawerId, choices[0] || 'apple');
            }
        }, 1000);
    }

    selectWord(socketId, word) {
        if (socketId !== this.activeDrawerId || this.phase !== 'WORD_SELECTION') {
            return;
        }

        this.clearTimers();
        this.targetWord = word;
        this.phase = 'DRAWING';
        this.timer = this.drawDuration;

        // Initialize hints
        this.revealedIndices = this.wordManager.initHints(word);
        this.calculateHintSchedule();

        const maskedWord = this.wordManager.getMaskedWord(word, this.revealedIndices);

        // Broadcast to room that drawing has started with masked word
        this.io.to(this.room.id).emit('word_chosen', {
            drawerId: this.activeDrawerId,
            maskedWord: maskedWord,
            wordLength: word.length,
            drawTime: this.drawDuration,
            phase: 'DRAWING'
        });

        // Send exact word privately to drawer
        this.io.to(this.activeDrawerId).emit('your_word', {
            word: word
        });

        // Start drawing countdown & hint reveal loop
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.to(this.room.id).emit('timer_tick', { timeLeft: this.timer });

            // Check if any hint is scheduled for this second
            if (this.hintSchedule.includes(this.timer)) {
                this.revealHint();
            }

            if (this.timer <= 0) {
                this.clearTimers();
                this.endTurn('Time is up!');
            }
        }, 1000);
    }

    calculateHintSchedule() {
        this.hintSchedule = [];
        if (this.maxHints <= 0) return;

        // Schedule hints at regular intervals during the draw time
        const interval = Math.floor(this.drawDuration / (this.maxHints + 1));
        for (let i = 1; i <= this.maxHints; i++) {
            const hintTime = this.drawDuration - (interval * i);
            if (hintTime > 5) {
                this.hintSchedule.push(hintTime);
            }
        }
    }

    revealHint() {
        const revealed = this.wordManager.revealNextLetter(this.targetWord, this.revealedIndices, this.maxHints);
        if (revealed) {
            const masked = this.wordManager.getMaskedWord(this.targetWord, this.revealedIndices);
            this.io.to(this.room.id).emit('hint_update', {
                maskedWord: masked
            });
        }
    }

    processGuess(socketId, text) {
        if (this.phase !== 'DRAWING') {
            return { handled: false };
        }

        const player = this.room.participants.get(socketId);
        if (!player) return { handled: false };

        // Drawer cannot guess
        if (socketId === this.activeDrawerId) {
            return { handled: true, isDrawer: true };
        }

        // Already guessed
        if (player.hasGuessed) {
            return { handled: true, alreadyGuessed: true };
        }

        const evalResult = this.wordManager.evaluateGuess(text, this.targetWord);

        if (evalResult.isExact) {
            player.hasGuessed = true;
            player.guessedAt = this.timer;

            // Score formula: faster guess = more points
            // Max 500, min 100
            const timeRatio = Math.max(0.1, this.timer / this.drawDuration);
            const guesserPoints = Math.floor(timeRatio * 400) + 100;
            player.awardPoints(guesserPoints);

            // Drawer gets bonus points for each player who guesses
            const drawer = this.room.participants.get(this.activeDrawerId);
            if (drawer) {
                drawer.awardPoints(75);
            }

            // Broadcast guess result
            this.io.to(this.room.id).emit('guess_result', {
                correct: true,
                playerId: player.id,
                playerName: player.name,
                points: guesserPoints,
                scores: this.getLeaderboard()
            });

            // Check if all non-drawing players have guessed
            const nonDrawers = Array.from(this.room.participants.values()).filter(p => p.id !== this.activeDrawerId);
            const allGuessed = nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed);

            if (allGuessed) {
                this.clearTimers();
                this.io.to(this.room.id).emit('chat_message', {
                    playerId: 'system',
                    playerName: 'System',
                    text: '🎉 Everyone guessed the word!',
                    type: 'system'
                });
                this.endTurn('Everyone guessed the word!');
            }

            return { handled: true, correct: true, points: guesserPoints };
        }

        if (evalResult.isClose) {
            // Send close notification privately to guesser
            this.io.to(socketId).emit('close_guess', {
                text: `'${text}' is very close!`
            });
            return { handled: true, correct: false, isClose: true };
        }

        return { handled: true, correct: false, isClose: false };
    }

    endTurn(reason = '') {
        this.clearTimers();
        this.phase = 'ROUND_END';

        const roundScores = Array.from(this.room.participants.values()).map(p => ({
            id: p.id,
            name: p.name,
            roundScore: p.roundScore,
            totalScore: p.score
        }));

        this.io.to(this.room.id).emit('round_end', {
            word: this.targetWord,
            reason: reason,
            scores: roundScores,
            leaderboard: this.getLeaderboard(),
            nextDrawer: this.getNextDrawerPreview(),
            replayData: this.drawingSession.getHistory()
        });

        // 5 second cooldown before next turn
        this.turnTimeout = setTimeout(() => {
            this.startNextTurn();
        }, 5000);
    }

    getNextDrawerPreview() {
        const nextIndex = this.currentDrawerIndex + 1;
        if (nextIndex < this.drawerOrder.length) {
            const nextId = this.drawerOrder[nextIndex];
            const p = this.room.participants.get(nextId);
            return p ? p.name : 'Unknown';
        }
        return 'Round Changing';
    }

    endGame() {
        this.clearTimers();
        this.phase = 'GAME_OVER';

        const leaderboard = this.getLeaderboard();
        const winner = leaderboard[0] || null;

        this.io.to(this.room.id).emit('game_over', {
            leaderboard: leaderboard,
            winner: winner,
            totalRounds: this.totalRounds
        });
    }

    getLeaderboard() {
        return Array.from(this.room.participants.values())
            .map(p => p.toJSON())
            .sort((a, b) => b.score - a.score);
    }

    handlePlayerDisconnect(socketId) {
        // Remove from drawer order
        this.drawerOrder = this.drawerOrder.filter(id => id !== socketId);

        // If the active drawer left during word selection or drawing
        if (this.activeDrawerId === socketId && (this.phase === 'WORD_SELECTION' || this.phase === 'DRAWING')) {
            this.clearTimers();
            this.io.to(this.room.id).emit('chat_message', {
                playerId: 'system',
                playerName: 'System',
                text: 'Drawer left the game! Skipping turn...',
                type: 'system'
            });
            this.endTurn('Drawer left');
            return;
        }

        // If remaining players have all guessed now
        if (this.phase === 'DRAWING') {
            const nonDrawers = Array.from(this.room.participants.values()).filter(p => p.id !== this.activeDrawerId);
            if (nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed)) {
                this.endTurn('Everyone remaining has guessed!');
            }
        }
    }

    clearTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.turnTimeout) {
            clearTimeout(this.turnTimeout);
            this.turnTimeout = null;
        }
    }
}

module.exports = Game;
