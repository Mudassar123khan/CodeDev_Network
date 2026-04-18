import http from 'http';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { initSocket } from './config/socket.js';

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});