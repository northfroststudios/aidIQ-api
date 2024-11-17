import { EMAIL_QUEUES, EmailQueueName } from "./email/email.queues";

// this object contains all the queues the app uses
export const QUEUES = {
  emails: EMAIL_QUEUES,
} as const;

export type QueueTypes = {
  emails: EmailQueueName;
};
