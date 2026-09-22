import { Queue } from 'bullmq';
import dotenv from "dotenv";
dotenv.config();

let submissionQueue;

const isBullMQEnabled = process.env.ENABLE_BULLMQ === "true" && process.env.NODE_ENV !== "test";

if (isBullMQEnabled) {
  submissionQueue = new Queue("submissionQueue", {
    connection: {
      url: process.env.REDIS_URL,
    },
  });

  submissionQueue.on("error", (err) => {
    // Suppress unhandled EventEmitter crash when Redis is unreachable locally
  });
} else {
  submissionQueue = {
    add: async (name, data) => {
      console.warn(`[BullMQ] submissionQueue is stopped (ENABLE_BULLMQ !== 'true'). Job '${name}' was not queued.`);
      return { id: "mock-job-id" };
    },
    on: () => {},
    close: async () => {},
  };
}

export default submissionQueue;

