import { BasePluginConfig, Plugin } from '.';

export type NullPluginConfig = BasePluginConfig;

export class NullPlugin extends Plugin<NullPluginConfig> {
    static id: string = "null_plugin";
    static pluginName: string = "Null Plugin";
    static requiredPlugins: string[] = [];

    static validatePluginConfig(config: Object): config is NullPluginConfig {
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

