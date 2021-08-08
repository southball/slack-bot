import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { BasePluginConfig, defaultPluginConfig, Plugin } from '.';
import { plugins } from '..';
import { generateExactMatchRegexp } from '../utils/exact-regexp';

export class PluginsListPluginOverride {
  @IsOptional()
  @IsString()
  command?: string;
}

export class PluginsListPluginConfig extends BasePluginConfig {
  @ValidateNested()
  @IsOptional()
  @Type(() => PluginsListPluginOverride)
  override?: PluginsListPluginOverride;
}

export class PluginsListPlugin extends Plugin<PluginsListPluginConfig> {
  static id = 'plugins_list';
  static pluginName = 'Plugins List';
  static configClass = PluginsListPluginConfig;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    const command = this.pluginConfig.override?.command ?? 'plugins list';
    this.app.message(generateExactMatchRegexp(command), async ({ say }) => {
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
