const assert = require('assert');
const RoomManager = require('../src/managers/RoomManager');
const WordManager = require('../src/models/WordManager');
const DrawingSession = require('../src/models/DrawingSession');

console.log('🧪 Starting Skribbl Game Engine Integration Tests...\n');

// 1. Test WordManager
console.log('Testing WordManager...');
const wm = new WordManager('animals', ['rocketship', 'hoverboard']);
const choices = wm.getRandomChoices(3);
assert.strictEqual(choices.length, 3, 'Should generate 3 word choices');

// Test Hint generation
const secretWord = 'elephant';
const hints = wm.initHints(secretWord);
const initialMask = wm.getMaskedWord(secretWord, hints);
assert.strictEqual(initialMask, '_ _ _ _ _ _ _ _', 'Initial masked word should be all underscores');

// Reveal letter
const didReveal = wm.revealNextLetter(secretWord, hints, 3);
assert.strictEqual(didReveal, true, 'Should successfully reveal a letter');
const hintedMask = wm.getMaskedWord(secretWord, hints);
assert(hintedMask.includes('_') && hintedMask.replace(/[^a-zA-Z]/g, '').length >= 1, 'Mask should reveal at least one letter');

// Test Guess evaluation (exact match)
const exactResult = wm.evaluateGuess('elephant', secretWord);
assert.strictEqual(exactResult.isExact, true, 'Exact match should succeed');

// Test Guess evaluation (close match - Levenshtein)
const closeResult = wm.evaluateGuess('elefant', secretWord);
assert.strictEqual(closeResult.isClose, true, 'Close match should detect typo');

// Test Wrong Guess
const wrongResult = wm.evaluateGuess('banana', secretWord);
assert.strictEqual(wrongResult.isExact, false);
assert.strictEqual(wrongResult.isClose, false);
console.log('✅ WordManager & Guessing logic verified!');

// 2. Test DrawingSession
console.log('Testing DrawingSession...');
const ds = new DrawingSession();
ds.addAction({ type: 'stroke', points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }], color: '#000', size: 4 });
ds.addAction({ type: 'stroke', points: [{ x: 0.3, y: 0.3 }], color: '#f00', size: 6 });
assert.strictEqual(ds.getHistory().length, 2, 'Drawing history should contain 2 actions');

ds.undo();
assert.strictEqual(ds.getHistory().length, 1, 'Undo should remove last action');

ds.clear();
assert.strictEqual(ds.getHistory().length, 0, 'Clear should empty history');
console.log('✅ DrawingSession verified!');

// 3. Test Room & Game Lifecycle
console.log('Testing Room & Player Management...');
const mockIo = {
    to: () => ({
        emit: () => {}
    })
};

const room = RoomManager.createRoom('socket-host', {
    maxPlayers: 5,
    rounds: 2,
    drawTime: 60,
    category: 'food'
}, mockIo);

assert.strictEqual(room.id.length, 6, 'Room ID should be 6 characters');
assert.strictEqual(room.settings.maxPlayers, 5);

// Add host
const host = room.addPlayer('socket-host', 'HostAlice', { face: 1, color: '#ff0000' });
assert.strictEqual(host.isHost, true);

// Add player 2
const p2 = room.addPlayer('socket-p2', 'BobGuess', { face: 2, color: '#00ff00' });
assert.strictEqual(p2.isHost, false);
assert.strictEqual(room.participants.size, 2);

// Test host migration
room.removePlayer('socket-host');
assert.strictEqual(room.participants.size, 1);
assert.strictEqual(p2.isHost, true, 'Bob should become new host when Alice leaves');

console.log('✅ Room & Host Migration verified!');
console.log('\n🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
