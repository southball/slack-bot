import { BasePluginConfig, Plugin } from '.';

export type NullPluginConfig = BasePluginConfig;

export class NullPlugin extends Plugin<NullPluginConfig> {
  static id = 'null_plugin';
  static pluginName = 'Null Plugin';
  static requiredPlugins: string[] = [];

  static validatePluginConfig(config: unknown): config is NullPluginConfig {
    return true;
  }

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
}
