import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * Initialise Socket.io on the given HTTP server.
 * Call this once from server.js, then import `getIO` anywhere.
 */
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // ── JWT auth middleware ──────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication error: no token'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;  // attach userId to socket
            next();
        } catch (err) {
            return next(new Error('Authentication error: invalid token'));
        }
    });

    // ── On connection: join personal room ────────────────────────────
    io.on('connection', (socket) => {
        const room = `room:${socket.userId}`;
        socket.join(room);
        console.log(`[WS] User ${socket.userId} connected — joined ${room}`);

        socket.on('disconnect', () => {
            console.log(`[WS] User ${socket.userId} disconnected`);
        });
    });

    return io;
};

/**
 * Returns the initialised io instance.
 * Throws if initSocket has not been called yet.
 */
export const getIO = () => {
    if (!io) throw new Error('Socket.io has not been initialised. Call initSocket first.');
    return io;
};
