import http from 'http';
import dns from 'node:dns';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { initSocket } from './config/socket.js';

// Prioritize IPv4 DNS resolution across all outbound connections (fixes ENETUNREACH in cloud deployments)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});