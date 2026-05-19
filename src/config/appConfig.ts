import { env } from './env';

export const appConfig = {
  ...env,
  staffPin: '0000',
  feedbackMs: 1100,
  paymentPendingMinMs: 900,
  sessionTimeoutSec: 90,
  sessionTimeoutWarningSec: 15
};
