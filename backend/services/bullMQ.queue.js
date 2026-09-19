import { Queue } from 'bullmq';
import dotenv from "dotenv";
dotenv.config();

let submissionQueue;

if (process.env.NODE_ENV === "test") {
  submissionQueue = {
    add: async () => ({ id: "mock-job-id" }),
    on: () => {},
    close: async () => {},
  };
} else {
  submissionQueue = new Queue("submissionQueue", {
    connection: {
      url: process.env.REDIS_URL,
    },
  });

  submissionQueue.on("error", (err) => {
    // Suppress unhandled EventEmitter crash when Redis is unreachable locally
  });
}

export default submissionQueue;

