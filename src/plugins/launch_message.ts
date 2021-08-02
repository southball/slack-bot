import { IsString } from 'class-validator';
import { BasePluginConfig, Plugin } from '.';

export class LaunchMessagePluginConfig extends BasePluginConfig {
  @IsString()
  message: string;
}

export class LaunchMessagePlugin extends Plugin<LaunchMessagePluginConfig> {
  static id = 'launch_message';
  static pluginName = 'Launch Message Plugin';
  static configClass = LaunchMessagePluginConfig;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.app.client.chat.postMessage({
      channel: this.appConfig.channelId,
      text: this.pluginConfig.message,
    });
  }

  async unregister(): Promise<void> {
    return;
  }
}
