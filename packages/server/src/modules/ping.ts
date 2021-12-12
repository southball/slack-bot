import { App } from '@slack/bolt';

export async function pingModule(app: App) {
  app.message(/^ping!?$/i, async ({ say }) => {
    await say('Pong!');
  });
}
