import { App } from '@slack/bolt';
import * as dotenv from 'dotenv';
import { loadConfig } from './config';
import { defaultPluginConfig, isBasePluginConfig, Plugin } from './plugins';
import { CronMessagePlugin } from './plugins/cron_message';
import { LaunchMessagePlugin } from './plugins/launch_message';
import { NullPlugin } from './plugins/null';
import { fix } from './utils/fix';

dotenv.config();

const plugins = [NullPlugin, CronMessagePlugin, LaunchMessagePlugin];

async function main() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const appToken = process.env.SLACK_APP_TOKEN;
  const config = loadConfig();

  const app = new App({
    appToken,
    token: botToken,
    socketMode: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginMap: Map<string, Plugin<any>> = new Map();
  const pluginTypeMap: Map<string, typeof Plugin> = new Map();
  const enabledPlugins: Set<string> = new Set();
  const loadedPlugins: Set<string> = new Set();

  for (const T of plugins) {
    const pluginConfig: unknown = config.plugins[T.id] ?? defaultPluginConfig;
    if (
      !isBasePluginConfig(pluginConfig) ||
      !T.validatePluginConfig(pluginConfig)
    ) {
      throw new Error(`Error in config for plugin ${T.id}.`);
    }
    if (!pluginConfig.enabled) {
      continue;
    }
    console.log(`Plugin ${T.id} will be loaded. The config is validated.`);
    enabledPlugins.add(T.id);
    pluginMap.set(T.id, new T(app, pluginConfig, config));
    pluginTypeMap.set(T.id, T as typeof Plugin);
  }

  const loadPlugin = fix<string, void>(
    (loadPlugin) => async (pluginName: string) => {
      console.log(`Attempting to load plugin ${pluginName}.`);
      if (!enabledPlugins.has(pluginName)) {
        throw new Error(`Plugin ${pluginName} should be enabled but is not.`);
      }
      if (loadedPlugins.has(pluginName)) {
        return;
      }

      const T = pluginTypeMap.get(pluginName);
      for (const requiredPlugin of T.requiredPlugins) {
        console.log(
          `The plugin ${pluginName} requires the plugin ${requiredPlugin}.`,
        );
        await loadPlugin(requiredPlugin);
      }

      const plugin = pluginMap.get(pluginName);
      console.log(`Start loading plugin ${pluginName}.`);
      await plugin.register();
      console.log(`Plugin ${pluginName} is loaded.`);
    },
  );

  for (const pluginName of enabledPlugins) {
    loadPlugin(pluginName);
  }

  await app.start();
  console.log('The app has started.');
}

main();
