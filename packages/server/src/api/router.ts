import cors from 'cors';
import * as express from 'express';
import { DefaultStorage } from '../utilities/storage';
import { HTTPDataResponse, HTTPSuccessResponse } from './types';

export function getApiRouter() {
  const apiRouter = express.Router();

  apiRouter.use(cors());

  apiRouter.get('/:path', async (req, res) => {
    const { path } = req.params;
    const storage = await DefaultStorage.get();
    res.json({
      success: true,
      data: await storage.get(path),
    } as HTTPDataResponse<string>);
  });

  apiRouter.post('/:path', express.json(), async (req, res) => {
    const { path } = req.params;
    const storage = await DefaultStorage.get();
    const value = req.body;
    await storage.set(path, value);
    res.json({
      success: true,
    } as HTTPSuccessResponse);
  });

  return apiRouter;
}
