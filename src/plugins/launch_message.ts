import { BasePluginConfig, Plugin } from '.';

export type LaunchMessagePluginConfig = BasePluginConfig & {
  message: string;
};

export class LaunchMessagePlugin extends Plugin<LaunchMessagePluginConfig> {
  static id = 'launch_message';
  static pluginName = 'Launch Message Plugin';
  static requiredPlugins: string[] = [];

  static validatePluginConfig(
    config: unknown,
  ): config is LaunchMessagePluginConfig {
    return (
      typeof config === 'object' &&
      (config['enabled'] === false ||
        (config['enabled'] === true && typeof config['message'] === 'string'))
    );
  }

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.app.client.chat.postMessage({
      channel: this.appConfig.channel_id,
      text: this.pluginConfig.message,
    });
  }

  async unregister(): Promise<void> {
    return;
  }
}
