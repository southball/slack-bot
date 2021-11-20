import * as dotenv from 'dotenv';
import express from 'express';
import { createApp } from './app';

dotenv.config();

const expressApp = express();

async function main() {
  let slackApp = await createApp();
  await slackApp.start();
  console.log('App started.');

  expressApp.get('/restart', async (req, res) => {
    try {
      await slackApp.stop();
      slackApp = await createApp();
      await slackApp.start();
      console.log('App started.');
    } catch {
      res.json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  console.log('Server listening at port 3000.');
  expressApp.listen(3000);
}

main();
