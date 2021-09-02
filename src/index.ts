import { App } from '@slack/bolt';
import { transformAndValidate } from 'class-transformer-validator';
import { ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import 'reflect-metadata';
import { Config, loadConfig } from './config';
import { defaultPluginConfig, Plugin } from './plugins';
import { CronMessagePlugin } from './plugins/cron_message';
import { LaunchMessagePlugin } from './plugins/launch_message';
import { PluginsListPlugin } from './plugins/plugins_list';
import { TextSlashCommandPlugin } from './plugins/text_slash_command';
import { TimetablePlugin } from './plugins/timetable';
import { DailySchedulePlugin } from './plugins/daily_schedule';
import { TodoPlugin } from './plugins/todo';
import { fix } from './utils/fix';
import { stringifyWithCircularReference } from './utils/stringify';

dotenv.config();

export const plugins = [
  CronMessagePlugin,
  LaunchMessagePlugin,
  PluginsListPlugin,
  TextSlashCommandPlugin,
  TimetablePlugin,
  DailySchedulePlugin,
  TodoPlugin,
] as typeof Plugin[];

/**
 * This function cleans up errors by class-transformer-validator to make the error message more readable.
 */
function cleanupValidationError(errors: any): any {
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
}

/**
 * The entry point of the application.
 */
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

  for (const T of plugins) {
    const pluginConfig: unknown = config.plugins[T.id] ?? defaultPluginConfig;

    if (typeof pluginConfig !== 'object') {
      throw new Error(`Config for plugin ${T.id} should be an object.`);
    }

    if (pluginConfig['enabled'] !== true) {
      continue;
    }

    console.log(`Validating config for plugin ${T.id}...`);
    const validatedPluginConfig: any = await transformAndValidate(
      T.configClass as any,
      pluginConfig,
      {
        validator: {
          forbidUnknownValues: true,
        },
      },
    ).catch(cleanupValidationError);

    console.log(`Plugin ${T.id} will be loaded. The config is validated.`);
    const plugin: Plugin<any> = new (T as any)(
      app,
      validatedPluginConfig as any,
      config,
    );
    pluginMap.set(T.id, plugin);
  }

  // Check whether all required plugins are loaded.
  for (const [pluginID, plugin] of pluginMap.entries()) {
    for (const requiredPluginID of plugin.requiredPluginIDs) {
      if (!pluginMap.has(requiredPluginID)) {
        throw new Error(
          `Error: plugin ${pluginID} requires plugin ${requiredPluginID} but it is not loaded.`,
        );
      }
    }
  }

  // Inject required plugins and peer plugins
  for (const plugin of pluginMap.values()) {
    plugin.requiredPlugins = plugin.requiredPluginIDs.map((id) =>
      pluginMap.get(id),
    );
    plugin.peerPlugins = plugin.peerPluginIDs.map((id) => pluginMap.get(id));
  }

  // Call register function for all plugins
  for (const plugin of pluginMap.values()) {
    plugin.register();
  }

  await app.start();
  console.log('The app has started.');
}

main().catch((error: any) => {
  console.error(
    'Critical error during the operation of bot. See error.log for more details.',
  );
  const message = `Error:\n${error}\n\nExpanded version of error:\n${stringifyWithCircularReference(
    error,
  )}`;
  fs.writeFileSync('error.log', message);
});
