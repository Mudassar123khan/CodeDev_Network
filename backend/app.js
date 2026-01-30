import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import problemsRouter from './routes/problem.routes.js';
import submissionRouter from './routes/submission.routes.js';
import syncRouter from './routes/sync.routes.js';
import leaderBoardRouter from './routes/leaderboard.routes.js';
import "./workers/sync.worker.js";
const app = express();

app.use(express.json());
app.use(cors());

//******************************************************************//
//routes
//******************************************************************//
app.use('/api/auth',authRouter);//authentication routes
app.use('/api/problems',problemsRouter);//problems route
app.use('/api/submissions',submissionRouter);//submissions route
app.use('/api/sync',syncRouter);//sync route
app.use('/api/leaderboard',leaderBoardRouter);//leaderboard route

//health monitoring route
app.get('/api/health',(req,res)=>{
  res.send("OK");
});

export default app;
