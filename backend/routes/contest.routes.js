import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { createContest,getContest,getContestProblems,joinContest,leaveContest,getAllContests,updateContest,deleteContest, contestSubmission } from '../controllers/contest.controller.js'
import adminOnly from '../middleware/admin.middleware.js'

const router = express.Router()

router.post('/create',authMiddleware,adminOnly,createContest)
router.get('/',authMiddleware,getAllContests)
router.put('/:id',authMiddleware,adminOnly,updateContest)
router.delete('/:id',authMiddleware,adminOnly,deleteContest)
router.get('/:slug',authMiddleware,getContest)
router.post('/:slug/join',authMiddleware,joinContest)
router.post('/:slug/leave',authMiddleware,leaveContest)
router.get('/:slug/problems',authMiddleware,getContestProblems)
router.post('/:slug/submit',authMiddleware,contestSubmission)
//router.get('/:slug/leaderboard',authMiddleware)


export default router