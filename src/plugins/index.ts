import { App } from '@slack/bolt';
import { Config } from '../config';

export type BasePluginConfig = {
    enabled: boolean,
};

export const defaultPluginConfig: BasePluginConfig = {
    enabled: false,
};

export function isBasePluginConfig(config: unknown): config is BasePluginConfig {
    return typeof config === "object" && typeof config["enabled"] === "boolean";
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
     * The ID of the lists of plugins required before this plugin is loaded.
     */
    static requiredPlugins: string[];

    /**
     * A type guard to check whether the config for the plugin is valid.
     * @param config Object to be verified.
     * @returns whether config matches the type for the config of the plugin.
     */
    static validatePluginConfig(config: Object): boolean {
        throw new Error("validatePluginConfig has not been overriden for this plugin.")
    }

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