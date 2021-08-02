import { App } from '@slack/bolt';
import { transformAndValidate } from 'class-transformer-validator';
import { ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import 'reflect-metadata';
import { loadConfig } from './config';
import { BasePluginConfig, defaultPluginConfig, Plugin } from './plugins';
import { CronMessagePlugin } from './plugins/cron_message';
import { DailySchedulePlugin } from './plugins/daily_schedule';
import { LaunchMessagePlugin } from './plugins/launch_message';
import { NullPlugin } from './plugins/null';
import { PluginsListPlugin } from './plugins/plugins_list';
import { TextSlashCommandPlugin } from './plugins/text_slash_command';
import { TimetablePlugin } from './plugins/timetable';
import { fix } from './utils/fix';
import { stringifyWithCircularReference } from './utils/stringify';

dotenv.config();

export const plugins = [
  NullPlugin,
  CronMessagePlugin,
  LaunchMessagePlugin,
  PluginsListPlugin,
  TextSlashCommandPlugin,
  TimetablePlugin,
  DailySchedulePlugin,
];

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
  const loadedPlugins: Set<string> = new Set();

  for (const T of plugins) {
    const pluginConfig: unknown = config.plugins[T.id] ?? defaultPluginConfig;
    if (typeof pluginConfig !== 'object') {
      throw new Error(`Config for plugin ${T.id} should be an object.`);
    }
    console.log(`Validating config for plugin ${T.id}...`);
    const validatedPluginConfig = await transformAndValidate(
      T.configClass,
      pluginConfig,
      {
        validator: {
          forbidUnknownValues: true,
        },
      },
    ).catch((errors) => {
      if (
        Array.isArray(errors) &&
        errors.every((error) => error instanceof ValidationError)
      ) {
        /**
         * This function attempts to extract only the relevant part of the
         * ValidationError.
         */
        const shake = fix<ValidationError, ValidationError[]>(
          (shake) =>
            (error: ValidationError): ValidationError[] => {
              const result = [];
              if (typeof error.constraints !== 'undefined') {
                result.push(error);
              }
              if (Array.isArray(error.children)) {
                for (const child of error.children) {
                  result.push(...shake(child));
                }
              }
              return result;
            },
        );
        throw errors.map(shake).flat();
      } else {
        throw errors;
      }
    });
    if (!validatedPluginConfig.enabled) {
      continue;
    }
    console.log(`Plugin ${T.id} will be loaded. The config is validated.`);
    // We know that the type is safe here due to the use of transformAndValidate.
    pluginMap.set(T.id, new T(app, validatedPluginConfig as any, config));
    pluginTypeMap.set(T.id, T as typeof Plugin);
  }

  const loadPlugin = fix<string, void>(
    (loadPlugin) => async (pluginName: string) => {
      console.log(`Attempting to load plugin ${pluginName}.`);
      if (!pluginMap.has(pluginName)) {
        throw new Error(`Plugin ${pluginName} should be enabled but is not.`);
      }
      if (loadedPlugins.has(pluginName)) {
        return;
      }

      const plugin = pluginMap.get(pluginName);

      const T = pluginTypeMap.get(pluginName);
      for (const [key, pluginClass] of Object.entries(T.requiredPlugins)) {
        console.log(
          `The plugin ${pluginName} requires the plugin ${pluginClass.id}.`,
        );
        await loadPlugin(pluginClass.id);
        plugin.dependencies[key] = pluginMap.get(pluginClass.id);
      }

      console.log(`Start loading plugin ${pluginName}.`);
      await plugin.register();
      console.log(`Plugin ${pluginName} is loaded.`);
    },
  );

  for (const pluginName of pluginMap.keys()) {
    loadPlugin(pluginName);
  }

  // Inject peer plugins if available
  for (const pluginClass of pluginTypeMap.values()) {
    const plugin = pluginMap.get(pluginClass.id);
    for (const [key, peerPluginClass] of Object.entries(
      pluginClass.peerPlugins,
    )) {
      if (pluginMap.has(peerPluginClass.id)) {
        plugin.dependencies[key] = pluginMap.get(peerPluginClass.id);
      }
    }
  }

  // Call onReady function for each
  for (const plugin of pluginMap.values()) {
    await plugin.onReady();
  }

  await app.start();
  console.log('The app has started.');
}

main().catch((error) => {
  console.error(
    'Critical error during the operation of bot. See error.log for more details.',
  );
  const message = `Error:\n${error}\n\nExpanded version of error:\n${stringifyWithCircularReference(
    error,
  )}`;
  fs.writeFileSync('error.log', message);
});
