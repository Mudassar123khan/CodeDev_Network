import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * useSocket — creates and manages one Socket.io connection per component mount.
 *
 * Returns a `socketRef` (React ref). Components should register listeners
 * inside their own useEffect, which runs AFTER this hook's useEffect,
 * guaranteeing the socket already exists at listener-registration time.
 *
 * @param {string} apiUrl    - API base URL, e.g. "http://localhost:3000/api"
 * @param {string|null} token - JWT token; no connection is made if null/empty.
 * @returns {React.MutableRefObject} socketRef — .current is the socket instance (or null)
 */
const useSocket = (apiUrl, token) => {
    const socketRef = useRef(null);

    // Strip trailing /api path to get the Socket.io server root
    const serverUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : null;

    useEffect(() => {
        if (!token || !serverUrl) return;

        const socket = io(serverUrl, {
            auth: { token },
            query: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => console.log('[WS] Connected:', socket.id));
        socket.on('connect_error', (err) => console.error('[WS] Error:', err.message));
        socket.on('disconnect', (reason) => console.log('[WS] Disconnected:', reason));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [serverUrl, token]);

    return socketRef; // .current is null until the socket is created
};

export default useSocket;
