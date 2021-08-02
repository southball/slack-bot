import { BasePluginConfig, Plugin } from '.';
import { CronMessagePlugin } from './cron_message';

export class NullPluginConfig extends BasePluginConfig {}

export class NullPlugin extends Plugin<NullPluginConfig> {
  static id = 'null_plugin';
  static pluginName = 'Null Plugin';
  static configClass = NullPluginConfig;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    return;
  }

  async unregister(): Promise<void> {
    return;
  }

  async onReady(): Promise<void> {
    return;
  }
}
