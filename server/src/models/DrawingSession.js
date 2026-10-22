class DrawingSession {
    constructor() {
        this.actions = []; // Array of drawing actions: strokes, fills, clears
        this.undoStack = [];
    }

    addAction(action) {
        // action: { type: 'stroke'|'fill'|'clear', data: {...}, timestamp: Date.now() }
        const item = {
            ...action,
            timestamp: Date.now()
        };
        this.actions.push(item);
        // Clear redo stack if any
        this.undoStack = [];
        return item;
    }

    undo() {
        if (this.actions.length === 0) return null;
        // Pop the last non-empty action
        const popped = this.actions.pop();
        this.undoStack.push(popped);
        return popped;
    }

    clear() {
        this.actions = [];
        this.undoStack = [];
        const clearAction = {
            type: 'clear',
            timestamp: Date.now()
        };
        return clearAction;
    }

    getHistory() {
        return this.actions;
    }

    reset() {
        this.actions = [];
        this.undoStack = [];
    }
}

module.exports = DrawingSession;
