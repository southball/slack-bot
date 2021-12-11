import { App } from '@slack/bolt';
import * as parser from 'cron-parser';
import { subMinutes } from 'date-fns';
import { cronMessageStoragePath } from '../storagePath';
import { DefaultStorage } from '../utilities/storage';

type CronMessage = {
  cron: string;
  template: string;
};

let lastTickTime: Date = new Date(0);
async function tick(app: App) {
  const now = new Date();
  if (now.getMinutes() == lastTickTime.getMinutes()) {
    return;
  }
  lastTickTime = now;

  console.log('Tick', now);

  const storage = await DefaultStorage.get();
  const cronMessages: CronMessage[] =
    (await storage.get(cronMessageStoragePath('messages'))) ?? [];

  for (const cronMessage of cronMessages) {
    const interval = parser.parseExpression(cronMessage.cron, {
      currentDate: subMinutes(now, 1),
      endDate: now,
      iterator: true,
      tz: 'Asia/Tokyo',
    });
    if (interval.hasNext()) {
      app.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID as string,
        text: cronMessage.template,
      });
    }
  }
}

export async function cronMessageModule(app: App) {
  setInterval(() => tick(app), 10_000);
}
