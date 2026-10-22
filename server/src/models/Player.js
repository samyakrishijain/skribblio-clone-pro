class Player {
    constructor(id, name, avatar = {}, isHost = false) {
        this.id = id;
        this.name = name || 'Anonymous';
        this.avatar = {
            face: avatar.face ?? 0,
            color: avatar.color ?? '#3b82f6',
            eyes: avatar.eyes ?? 0,
            mouth: avatar.mouth ?? 0,
            accessory: avatar.accessory ?? 0,
            ...avatar
        };
        this.score = 0;
        this.roundScore = 0;
        this.isHost = isHost;
        this.isReady = false;
        this.isDrawing = false;
        this.hasGuessed = false;
        this.guessedAt = null;
        this.lastActive = Date.now();
    }

    resetTurnState() {
        this.isDrawing = false;
        this.hasGuessed = false;
        this.roundScore = 0;
        this.guessedAt = null;
    }

    awardPoints(points) {
        this.score += points;
        this.roundScore += points;
    }

    resetGameScore() {
        this.score = 0;
        this.roundScore = 0;
        this.resetTurnState();
        this.isReady = false;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar,
            score: this.score,
            roundScore: this.roundScore,
            isHost: this.isHost,
            isReady: this.isReady,
            isDrawing: this.isDrawing,
            hasGuessed: this.hasGuessed
        };
    }
}

module.exports = Player;
