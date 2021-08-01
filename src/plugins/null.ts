import { BasePluginConfig, Plugin } from '.';

export class NullPluginConfig extends BasePluginConfig {}

export class NullPlugin extends Plugin<NullPluginConfig> {
  static id = 'null_plugin';
  static pluginName = 'Null Plugin';
  static requiredPlugins: string[] = [];
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
}
