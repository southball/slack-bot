import { App } from '@slack/bolt';
import { IsBoolean } from 'class-validator';
import { Config } from '../config';

export class BasePluginConfig {
  @IsBoolean()
  enabled: boolean;
}

export const defaultPluginConfig: BasePluginConfig = {
  enabled: false,
};

export function isBasePluginConfig(
  config: unknown,
): config is BasePluginConfig {
  return typeof config === 'object' && typeof config['enabled'] === 'boolean';
}

export abstract class Plugin<PluginConfig extends BasePluginConfig> {
  /**
   * The ID for the plugin.
   * Used for identifying the plugin and
   */
  static id: string;

  /**
   * The name of the plugin, displayed to users.
   */
  static pluginName: string;

  /**
   * The list of plugins required before this plugin is loaded.
   */
  static requiredPlugins: { [key: string]: typeof Plugin } = {};

  /**
   * The list of plugins injected to the plugin if available
   */
  static peerPlugins: { [key: string]: typeof Plugin } = {};

  /**
   * The map of plugins generated.
   */
  dependencies: { [key: string]: Plugin<BasePluginConfig> } = {};

  /**
   * Class object for the config. Used for config validation and transformation.
   */
  static configClass: typeof BasePluginConfig;

  /**
   * The App object in @slack/bolt.
   * Automatically initialized by the constructor.
   */
  app: App;

  /**
   * The config for the plugin.
   * Automatically initialized by the constructor.
   */
  pluginConfig: PluginConfig;

  /**
   * The config for the whole bot.
   * Automatically initialized by the constructor.
   */
  appConfig: Config;

  constructor(app: App, pluginConfig: PluginConfig, appConfig: Config) {
    this.app = app;
    this.appConfig = appConfig;
    this.pluginConfig = pluginConfig;
  }

  /**
   * This function should clean up
   */
  abstract init(): Promise<void>;

  /**
   * This function should clean up all the data created by the plugin.
   */
  abstract uninit(): Promise<void>;

  /**
   * This function should initiate the required hooks.
   */
  abstract register(): Promise<void>;

  /**
   * This function should remove all hooks created by the plugin.
   * This function should NOT remove user data.
   */
  abstract unregister(): Promise<void>;

  /**
   * This function will be called when all plugins are loaded.
   */
  async onReady(): Promise<void> {
    return;
  }
}
