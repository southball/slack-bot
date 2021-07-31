import * as fs from 'fs';
import { parse } from 'yaml';

export type Config = {
    channel_id: string,
    plugins: { [plugin_id: string]: Object },
};

export function loadConfig(): Config {
    const configBody = fs.readFileSync(process.env.CONFIG_PATH, 'utf8');
    return parse(configBody) as Config;
}
