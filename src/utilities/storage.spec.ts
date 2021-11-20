import { Storage } from './storage';
import * as fs from 'fs';

const generateFilename = () => `test-${Math.random()}.sqlite3`;

describe('Storage', () => {
  let storageFilename: string;
  let storage: Storage;

  beforeEach(async () => {
    storageFilename = generateFilename();
    storage = new Storage();
    await storage.init(storageFilename);
  });

  afterEach(() => {
    fs.rmSync(storageFilename);
    storageFilename = undefined;
    storage = undefined;
  });

  it('should err when storage is not initialized', async () => {
    storage = new Storage();
    expect(async () => await storage.get('test-key')).rejects.toThrow();
  });

  it('should err when storage is initialized twice', async () => {
    expect(async () => {
      await storage.init(generateFilename());
    }).rejects.toThrow();
  });

  it('should store and obtain value properly', async () => {
    await storage.set('test-key', 'test-value');
    expect(await storage.get('test-key')).toBe('test-value');
  });
});
