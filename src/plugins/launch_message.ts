import { BasePluginConfig, Plugin } from '.';

export type LaunchMessagePluginConfig = BasePluginConfig & {
    message: string;
};

export class LaunchMessagePlugin extends Plugin<LaunchMessagePluginConfig> {
    static id: string = "launch_message";
    static pluginName: string = "Launch Message Plugin";
    static requiredPlugins: string[] = [];

    static validatePluginConfig(config: Object): config is LaunchMessagePluginConfig {
        return config["enabled"] === false ||
            config["enabled"] === true && typeof config["message"] === "string";
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

