import {
  BasePluginConfig,
  defaultPluginConfig,
  isBasePluginConfig,
  Plugin,
} from '.';
import { plugins } from '..';

export type PluginsListPluginConfig = BasePluginConfig;

export class PluginsListPlugin extends Plugin<PluginsListPluginConfig> {
  static id = 'plugins_list';
  static pluginName = 'Plugins List';
  static requiredPlugins: string[] = [];

  static validatePluginConfig(
    config: unknown,
  ): config is PluginsListPluginConfig {
    return isBasePluginConfig(config);
  }

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.app.message('plugins list', async ({ message, say }) => {
      const list =
        `Plugins List:\n` +
        plugins
          .map((plugin) => {
            const config =
              this.appConfig.plugins[plugin.id] ?? defaultPluginConfig;
            const enabled =
              typeof config === 'object' && config['enabled'] === true;
            return `・ ${plugin.id} (${plugin.pluginName}): ${
              enabled ? 'enabled' : 'disabled'
            }`;
          })
          .join('\n');
      say(list);
    });
  }

  async unregister(): Promise<void> {
    return;
  }
}
