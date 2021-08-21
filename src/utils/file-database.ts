import * as fs from 'fs';

export class FileDatabase<T> {
  public readonly name: string;

  private getFilename() {
    return `database.${this.name}.json`;
  }

  constructor(name: string) {
    this.name = name;
  }

  get(): T[] {
    const filename = this.getFilename();
    if (!fs.existsSync(filename)) {
      return [];
    }
    const content = fs.readFileSync(filename, { encoding: 'utf8' });
    const data = JSON.parse(content) as T[];
    return data;
  }

  set(data: T[]): void {
    const filename = this.getFilename();
    const content = JSON.stringify(data);
    fs.writeFileSync(filename, content);
  }
}
