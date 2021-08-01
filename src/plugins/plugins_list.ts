import {
  BasePluginConfig,
  defaultPluginConfig,
  isBasePluginConfig,
  Plugin,
} from '.';
import { plugins } from '..';

export class PluginsListPluginConfig extends BasePluginConfig {}

export class PluginsListPlugin extends Plugin<PluginsListPluginConfig> {
  static id = 'plugins_list';
  static pluginName = 'Plugins List';
  static requiredPlugins: string[] = [];
  static configClasss = PluginsListPluginConfig;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.app.message('plugins list', async ({ say }) => {
      const list =
        'Plugins List:\n' +
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
