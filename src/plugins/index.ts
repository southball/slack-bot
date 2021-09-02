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

/**
 * The base class for all plugins.
 * The lifecycle of the plugins are:
 * - constructor is called
 * - init() is called
 * - requiredPlugins and peerPlugins are injected
 * - register() is called
 *
 * When the plugin is to be disabled,
 * - unregister() is called
 * - uninit() is called
 */
export abstract class Plugin<PluginConfig extends BasePluginConfig> {
  /**
   * The ID for the plugin.
   * Used for identifying the plugin.
   */
  static id: string;

  /**
   * The name of the plugin, displayed to users.
   */
  static pluginName: string;

  /**
   * Class object for the config. Used for config validation and transformation.
   */
  static configClass: typeof BasePluginConfig;

  /**
   * The IDs of plugins that are required for the plugin to function.
   */
  requiredPluginIDs: string[] = [];

  /**
   * The IDs of peer plugins required.
   */
  peerPluginIDs: string[] = [];

  /**
   * The plugins required injected.
   */
  requiredPlugins: Plugin<any>[] = [];

  /**
   * Peer plugins injected.
   */
  peerPlugins: Plugin<any>[] = [];

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
}
