const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const registerSocketHandlers = require('./handlers/socketHandler');
const roomManager = require('./managers/RoomManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Register socket handlers
io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
});

// REST API endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        activeRooms: roomManager.rooms.size,
        timestamp: Date.now()
    });
});

app.get('/api/rooms', (req, res) => {
    res.json({
        success: true,
        rooms: roomManager.getPublicRooms()
    });
});

// Serve frontend static build if available (production full-stack single-port mode)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
    }
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.send('Skribbl God-Level WebSocket Game Server is active! Frontend is available in client dev server.');
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` 🎨 SKRIBBL.IO GOD-LEVEL SERVER RUNNING ON PORT ${PORT} `);
    console.log(` ⚡ WebSocket server ready for connections      `);
    console.log(` 🌐 Healthcheck: http://localhost:${PORT}/health`);
    console.log(`=================================================`);
});

module.exports = { app, server, io };
