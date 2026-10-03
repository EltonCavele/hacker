import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import Redis from "ioredis";
import { getEnv } from "../env";

/**
 * Applied to every job unless the producer overrides it. Failed jobs stay in Redis for a week (BullMQ's failed set is
 * the dead-letter queue: inspect or retry them with `queue.getFailed()` / `job.retry()`); completed ones are trimmed.
 */
export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2_000 },
  removeOnComplete: { age: 3_600, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 3_600 },
};

function createConnection() {
  return new Redis(getEnv().REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export function createQueue<DataType extends object>(name: string) {
  return new Queue<DataType>(name, {
    connection: new Redis(getEnv().REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    }),
    defaultJobOptions,
  });
}

export function createWorker<DataType extends object, ReturnType = void>(
  name: string,
  processor: Processor<DataType, ReturnType>,
) {
  return new Worker<DataType, ReturnType>(name, processor, {
    connection: createConnection(),
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  });
}
