import * as dotenv from 'dotenv';
import express from 'express';
import { getApiRouter } from './api/router';
import { createApp } from './app';

dotenv.config();

const expressApp = express();

async function main() {
  let slackApp = await createApp();
  await slackApp.start();
  console.log('App started.');

  expressApp.get('/restart', async (req, res) => {
    try {
      console.log('Stopping current instance.');
      await slackApp.stop();
      console.log('Stopped current instance. Creating new instance.');
      slackApp = await createApp();
      console.log('Created new instance. Starting new instance.');
      await slackApp.start();
      console.log('New instance started.');
    } catch {
      res.json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  expressApp.use('/api', getApiRouter());

  console.log('Server listening at port 3000.');
  expressApp.listen(3000);
}

main();
