import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import problemsRouter from './routes/problem.routes.js';
import submissionRouter from './routes/submission.routes.js';
const app = express();

app.use(express.json());
app.use(cors());

//******************************************************************//
//routes
//******************************************************************//
app.use('/api/auth',authRouter);
app.use('/api/problems',problemsRouter);
app.use('/api/submissions',submissionRouter);
export default app;