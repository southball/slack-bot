import * as dotenv from 'dotenv';
import { App } from '@slack/bolt';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

async function main() {
  await app.start();
}

main();
