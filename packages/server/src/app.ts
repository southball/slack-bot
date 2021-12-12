import { App } from '@slack/bolt';
import { cronMessageModule } from './modules/cronMessage';
import { pingModule } from './modules/ping';

export async function createApp(): Promise<App> {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  await cronMessageModule(app);
  await pingModule(app);

  return app;
}
