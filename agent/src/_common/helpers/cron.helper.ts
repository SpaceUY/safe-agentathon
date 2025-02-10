import { CronJob } from 'cron';

export const createCron = (cronTime: string, task: () => Promise<void>) =>
  new CronJob(cronTime, task, null, true);
