import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes.js'
import problemsRouter from './routes/problem.routes.js'
import submissionRouter from './routes/submission.routes.js'
import syncRouter from './routes/sync.routes.js'
import leaderBoardRouter from './routes/leaderboard.routes.js'
import adminRouter from './routes/admin.routes.js'
import contestRouter from './routes/contest.routes.js'
import "./workers/sync.worker.js"
import "./workers/submission.worker.js"
import getProfileRouter from './routes/profile.routes.js'
const app = express()
import promClient from 'prom-client'

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });



app.use(express.json())
app.use(cors({
  origin: "*",
}));

//******************************************************************//
//routes
//******************************************************************//
app.use('/api/auth',authRouter)//authentication routes
app.use('/api/problems',problemsRouter)//problems route
app.use('/api/submissions',submissionRouter)//submissions route
app.use('/api/sync',syncRouter)//sync route
app.use('/api/leaderboard',leaderBoardRouter)//leaderboard route
app.use('/api/getProfile',getProfileRouter)//profile route
app.use('/api/admin',adminRouter)//admin routes
app.use('/api/contest',contestRouter);//contest routes

//health monitoring route
app.get('/api/health',(req,res)=>{
  console.log("Health check request received")
  res.send("OK")
});

//route for prometheus metrics
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader ('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics); 
  } catch (ex) {
    res.status(500).end(ex);
  }
}) 

export default app
