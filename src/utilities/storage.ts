import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class Storage {
  database?: Database;

  async init(filename: string): Promise<void> {
    if (this.database) {
      throw new Error('Cannot init Storage more than once.');
    }
    this.database = await open({
      filename,
      driver: sqlite3.Database,
    });
    await this.database.exec(
      'CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, value TEXT)',
    );
    await this.database.exec(
      'CREATE INDEX IF NOT EXISTS storage_pk_key ON storage (key)',
    );
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.database)
      throw new Error('The Storage object is not initialized.');
    const result = await this.database.get(
      'SELECT value FROM storage WHERE key = ?',
      key,
    );
    if (typeof result === 'undefined') return undefined;
    return JSON.parse(result.value);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.database)
      throw new Error('The Storage object is not initialized.');
    const serializedValue = JSON.stringify(value);
    await this.database.run(
      `
      INSERT INTO storage (key, value) VALUES (?, ?)
      ON CONFLICT (key) DO UPDATE SET value = ?
    `,
      [key, serializedValue, serializedValue],
    );
  }
}

export class DefaultStorage {
  static storage?: Storage;

  static async get(): Promise<Storage> {
    if (DefaultStorage.storage) return DefaultStorage.storage;
    const storage = new Storage();
    await storage.init('storage.sqlite3');
    DefaultStorage.storage = storage;
    return storage;
  }
}
