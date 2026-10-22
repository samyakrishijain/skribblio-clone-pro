const Player = require('./Player');
const Game = require('./Game');

class Room {
    constructor(id, hostId, settings = {}, io) {
        this.id = id;
        this.hostId = hostId;
        this.io = io;
        this.createdAt = Date.now();

        this.settings = {
            maxPlayers: Math.min(20, Math.max(2, settings.maxPlayers || 8)),
            rounds: Math.min(10, Math.max(2, settings.rounds || 3)),
            drawTime: Math.min(240, Math.max(15, settings.drawTime || 80)),
            wordCount: Math.min(5, Math.max(1, settings.wordCount || 3)),
            hintsCount: Math.min(5, Math.max(0, settings.hintsCount ?? 2)),
            category: settings.category || 'all',
            customWords: settings.customWords || '',
            isPrivate: Boolean(settings.isPrivate)
        };

        this.participants = new Map();
        this.game = new Game(this, io);
    }

    addPlayer(socketId, name, avatar = {}) {
        if (this.participants.size >= this.settings.maxPlayers) {
            throw new Error('Room is full (max players reached)');
        }

        const isHost = this.participants.size === 0 || this.hostId === socketId;
        if (isHost) {
            this.hostId = socketId;
        }

        const player = new Player(socketId, name, avatar, isHost);
        this.participants.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        const player = this.participants.get(socketId);
        if (!player) return null;

        this.participants.delete(socketId);

        // Handle game active turn adjustments
        if (this.game && this.game.phase !== 'LOBBY' && this.game.phase !== 'GAME_OVER') {
            this.game.handlePlayerDisconnect(socketId);
        }

        // Host migration if host left
        if (this.hostId === socketId && this.participants.size > 0) {
            const nextHost = this.participants.values().next().value;
            if (nextHost) {
                nextHost.isHost = true;
                this.hostId = nextHost.id;
                this.io.to(this.id).emit('host_changed', {
                    newHostId: nextHost.id,
                    newHostName: nextHost.name
                });
            }
        }

        return player;
    }

    getPlayer(socketId) {
        return this.participants.get(socketId);
    }

    getParticipantList() {
        return Array.from(this.participants.values()).map(p => p.toJSON());
    }

    updateSettings(newSettings) {
        if (this.game.phase !== 'LOBBY') {
            throw new Error('Settings cannot be changed mid-game');
        }

        this.settings = {
            ...this.settings,
            ...newSettings
        };

        // Re-sync game settings
        this.game.totalRounds = this.settings.rounds;
        this.game.drawDuration = this.settings.drawTime;
        this.game.wordChoicesCount = this.settings.wordCount;
        this.game.maxHints = this.settings.hintsCount;
        this.game.wordManager.setCategory(this.settings.category);
        this.game.wordManager.setCustomWords(this.settings.customWords);

        this.io.to(this.id).emit('room_settings_updated', this.settings);
    }

    startGame(requesterId) {
        if (requesterId !== this.hostId) {
            throw new Error('Only the host can start the game');
        }

        if (this.participants.size < 2 && !process.env.SOLO_TEST) {
            throw new Error('At least 2 players are required to start');
        }

        this.game.start();
    }

    returnToLobby(requesterId) {
        if (requesterId !== this.hostId) {
            throw new Error('Only the host can return the room to lobby');
        }

        this.game.clearTimers();
        this.game.phase = 'LOBBY';
        this.participants.forEach(p => p.resetGameScore());

        this.io.to(this.id).emit('returned_to_lobby', {
            players: this.getParticipantList(),
            settings: this.settings
        });
    }

    getRoomSummary() {
        return {
            id: this.id,
            playerCount: this.participants.size,
            maxPlayers: this.settings.maxPlayers,
            rounds: this.settings.rounds,
            category: this.settings.category,
            phase: this.game.phase,
            isPrivate: this.settings.isPrivate,
            createdAt: this.createdAt
        };
    }

    getFullSyncState(socketId) {
        const isDrawer = this.game.activeDrawerId === socketId;
        return {
            roomId: this.id,
            hostId: this.hostId,
            settings: this.settings,
            players: this.getParticipantList(),
            phase: this.game.phase,
            round: this.game.currentRound,
            totalRounds: this.game.totalRounds,
            activeDrawerId: this.game.activeDrawerId,
            timer: this.game.timer,
            maskedWord: isDrawer ? this.game.targetWord : this.game.wordManager.getMaskedWord(this.game.targetWord, this.game.revealedIndices),
            targetWord: isDrawer ? this.game.targetWord : '',
            canvasHistory: this.game.drawingSession.getHistory()
        };
    }
}

module.exports = Room;
