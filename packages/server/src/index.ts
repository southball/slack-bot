import * as dotenv from 'dotenv';
import express from 'express';
import { getApiRouter } from './api/router';
import { createApp } from './app';
import { getLogger } from './logger';

dotenv.config();

const logger = getLogger('main');
const expressApp = express();

async function main() {
  let slackApp = await createApp();
  await slackApp.start();
  logger.info('App started.');

  expressApp.get('/restart', async (req, res) => {
    try {
      logger.info('Stopping current instance.');
      await slackApp.stop();
      logger.info('Stopped current instance. Creating new instance.');
      slackApp = await createApp();
      logger.info('Created new instance. Starting new instance.');
      await slackApp.start();
      logger.info('New instance started.');
    } catch {
      res.json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  expressApp.use('/api', getApiRouter());

  const PORT = +(process.env.PORT ?? 3000);
  logger.info(`Server listening at port ${PORT}.`);
  expressApp.listen(PORT);
}

main();
