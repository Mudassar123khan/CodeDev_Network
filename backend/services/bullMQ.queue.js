import { Queue } from 'bullmq';
import dotenv from "dotenv";
dotenv.config();

const submissionQueue = new Queue("submissionQueue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});

export default submissionQueue;
