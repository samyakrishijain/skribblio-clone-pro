const Room = require('../models/Room');
const { customAlphabet } = require('nanoid');

// Clean, easily readable uppercase alphabet avoiding confusing characters (0/O, 1/I)
const generateCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.socketToRoom = new Map(); // socketId -> roomId
    }

    createRoom(hostId, settings = {}, io) {
        let roomId = generateCode();
        while (this.rooms.has(roomId)) {
            roomId = generateCode();
        }

        const room = new Room(roomId, hostId, settings, io);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        if (!roomId) return null;
        return this.rooms.get(roomId.toUpperCase().trim());
    }

    getRoomBySocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        return roomId ? this.getRoom(roomId) : null;
    }

    bindSocketToRoom(socketId, roomId) {
        this.socketToRoom.set(socketId, roomId);
    }

    unbindSocket(socketId) {
        this.socketToRoom.delete(socketId);
    }

    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.game.clearTimers();
            this.rooms.delete(roomId);
        }
    }

    getPublicRooms() {
        const publicList = [];
        for (const [id, room] of this.rooms.entries()) {
            if (!room.settings.isPrivate && room.participants.size > 0) {
                publicList.push(room.getRoomSummary());
            }
        }
        return publicList;
    }

    cleanupEmptyRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room && room.participants.size === 0) {
            this.removeRoom(roomId);
        }
    }
}

module.exports = new RoomManager();
