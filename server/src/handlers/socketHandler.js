const roomManager = require('../managers/RoomManager');

function registerSocketHandlers(io, socket) {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // --- ROOM CREATION & JOINING ---

    socket.on('create_room', (payload, callback) => {
        try {
            const { hostName, avatar, settings } = payload || {};
            const cleanName = (hostName || '').trim() || 'DoodleMaster';

            const room = roomManager.createRoom(socket.id, settings, io);
            const player = room.addPlayer(socket.id, cleanName, avatar);
            roomManager.bindSocketToRoom(socket.id, room.id);

            socket.join(room.id);
            console.log(`[Room Created] Code: ${room.id} by ${cleanName}`);

            if (callback) {
                callback({
                    success: true,
                    roomId: room.id,
                    player: player.toJSON(),
                    roomState: room.getFullSyncState(socket.id)
                });
            }
        } catch (error) {
            console.error('[create_room error]', error.message);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('join_room', (payload, callback) => {
        try {
            const { roomId, playerName, avatar } = payload || {};
            const cleanRoomId = (roomId || '').toUpperCase().trim();
            const cleanName = (playerName || '').trim() || 'Artist';

            const room = roomManager.getRoom(cleanRoomId);
            if (!room) {
                return callback && callback({ success: false, message: 'Room not found. Check the code and try again.' });
            }

            const player = room.addPlayer(socket.id, cleanName, avatar);
            roomManager.bindSocketToRoom(socket.id, room.id);
            socket.join(room.id);

            console.log(`[Room Joined] Player ${cleanName} joined ${room.id}`);

            // Broadcast new player joined to room
            socket.to(room.id).emit('player_joined', {
                player: player.toJSON(),
                players: room.getParticipantList()
            });

            // Send system chat notification
            io.to(room.id).emit('chat_message', {
                playerId: 'system',
                playerName: 'System',
                text: `${player.name} hopped into the room! 🎨`,
                type: 'system',
                timestamp: Date.now()
            });

            if (callback) {
                callback({
                    success: true,
                    roomId: room.id,
                    player: player.toJSON(),
                    roomState: room.getFullSyncState(socket.id)
                });
            }
        } catch (error) {
            console.error('[join_room error]', error.message);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('get_public_rooms', (_, callback) => {
        try {
            const publicRooms = roomManager.getPublicRooms();
            if (callback) callback({ success: true, rooms: publicRooms });
        } catch (error) {
            if (callback) callback({ success: false, message: error.message });
        }
    });

    // --- GAME CONTROL EVENTS ---

    socket.on('start_game', (payload, callback) => {
        try {
            const { roomId } = payload || {};
            const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
            if (!room) throw new Error('Room not found');

            room.startGame(socket.id);
            if (callback) callback({ success: true });
        } catch (error) {
            console.error('[start_game error]', error.message);
            if (callback) callback({ success: false, message: error.message });
            else socket.emit('game_error', { message: error.message });
        }
    });

    socket.on('update_settings', (payload, callback) => {
        try {
            const { roomId, settings } = payload || {};
            const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
            if (!room) throw new Error('Room not found');
            if (room.hostId !== socket.id) throw new Error('Only the host can change settings');

            room.updateSettings(settings);
            if (callback) callback({ success: true, settings: room.settings });
        } catch (error) {
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('return_to_lobby', (payload, callback) => {
        try {
            const { roomId } = payload || {};
            const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
            if (!room) throw new Error('Room not found');

            room.returnToLobby(socket.id);
            if (callback) callback({ success: true });
        } catch (error) {
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('kick_player', (payload, callback) => {
        try {
            const { roomId, targetPlayerId } = payload || {};
            const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
            if (!room) throw new Error('Room not found');
            if (room.hostId !== socket.id) throw new Error('Only host can kick players');

            const kickedPlayer = room.removePlayer(targetPlayerId);
            if (kickedPlayer) {
                roomManager.unbindSocket(targetPlayerId);
                // Notify kicked player
                io.to(targetPlayerId).emit('kicked', { reason: 'You were kicked by the host.' });
                // Broadcast updated player list
                io.to(room.id).emit('player_left', {
                    playerId: targetPlayerId,
                    players: room.getParticipantList()
                });
                io.to(room.id).emit('chat_message', {
                    playerId: 'system',
                    playerName: 'System',
                    text: `${kickedPlayer.name} was kicked from the room.`,
                    type: 'system',
                    timestamp: Date.now()
                });
            }
            if (callback) callback({ success: true });
        } catch (error) {
            if (callback) callback({ success: false, message: error.message });
        }
    });

    // --- WORD SELECTION ---

    socket.on('choose_word', (payload) => {
        const { roomId, word } = payload || {};
        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (room && room.game) {
            room.game.selectWord(socket.id, word);
        }
    });

    // --- REAL-TIME DRAWING EVENTS ---

    socket.on('draw_stroke', (payload) => {
        const { roomId, action } = payload || {};
        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (!room || !room.game) return;

        // Only active drawer in DRAWING phase can draw
        if (room.game.activeDrawerId === socket.id && room.game.phase === 'DRAWING') {
            room.game.drawingSession.addAction(action);
            // Broadcast stroke to all OTHER players in room
            socket.to(room.id).emit('draw_data', action);
        }
    });

    socket.on('draw_cursor', (payload) => {
        const { roomId, x, y } = payload || {};
        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (!room || !room.game) return;

        if (room.game.activeDrawerId === socket.id) {
            socket.to(room.id).emit('drawer_cursor', { x, y });
        }
    });

    socket.on('canvas_clear', (payload) => {
        const { roomId } = payload || {};
        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (!room || !room.game) return;

        if (room.game.activeDrawerId === socket.id && room.game.phase === 'DRAWING') {
            room.game.drawingSession.clear();
            socket.to(room.id).emit('canvas_clear');
        }
    });

    socket.on('draw_undo', (payload) => {
        const { roomId } = payload || {};
        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (!room || !room.game) return;

        if (room.game.activeDrawerId === socket.id && room.game.phase === 'DRAWING') {
            const popped = room.game.drawingSession.undo();
            if (popped) {
                // Broadcast updated canvas history so all clients re-render accurately
                io.to(room.id).emit('canvas_sync_history', {
                    history: room.game.drawingSession.getHistory()
                });
            }
        }
    });

    // --- CHAT & GUESSING ---

    socket.on('chat_or_guess', (payload) => {
        const { roomId, text } = payload || {};
        const cleanText = (text || '').trim();
        if (!cleanText) return;

        const room = roomManager.getRoom(roomId) || roomManager.getRoomBySocket(socket.id);
        if (!room) return;

        const player = room.getPlayer(socket.id);
        if (!player) return;

        // If game is actively in DRAWING phase, evaluate as guess
        if (room.game && room.game.phase === 'DRAWING') {
            const guessResult = room.game.processGuess(socket.id, cleanText);

            if (guessResult.handled) {
                if (guessResult.correct) {
                    // Do not broadcast target word in chat!
                    // guess_result was already broadcast by game.processGuess
                    return;
                }

                if (guessResult.alreadyGuessed) {
                    // Player has already guessed correctly. Send message only to other players who have guessed!
                    const correctPlayers = Array.from(room.participants.values())
                        .filter(p => p.hasGuessed || p.id === room.game.activeDrawerId);
                    
                    correctPlayers.forEach(p => {
                        io.to(p.id).emit('chat_message', {
                            playerId: player.id,
                            playerName: player.name,
                            avatar: player.avatar,
                            text: cleanText,
                            type: 'guessed_chat',
                            timestamp: Date.now()
                        });
                    });
                    return;
                }
            }
        }

        // Normal chat message broadcast to everyone
        io.to(room.id).emit('chat_message', {
            playerId: player.id,
            playerName: player.name,
            avatar: player.avatar,
            text: cleanText,
            type: 'chat',
            timestamp: Date.now()
        });
    });

    // --- DISCONNECT ---

    socket.on('disconnect', () => {
        console.log(`[Socket Disconnected] ID: ${socket.id}`);
        const room = roomManager.getRoomBySocket(socket.id);
        if (room) {
            const player = room.removePlayer(socket.id);
            roomManager.unbindSocket(socket.id);

            if (player) {
                io.to(room.id).emit('player_left', {
                    playerId: socket.id,
                    playerName: player.name,
                    players: room.getParticipantList()
                });

                io.to(room.id).emit('chat_message', {
                    playerId: 'system',
                    playerName: 'System',
                    text: `${player.name} left the room.`,
                    type: 'system',
                    timestamp: Date.now()
                });
            }

            roomManager.cleanupEmptyRoom(room.id);
        }
    });
}

module.exports = registerSocketHandlers;
