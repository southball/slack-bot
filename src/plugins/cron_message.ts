import * as Handlebars from 'handlebars';
import { None, Option } from 'monapt';
import { vsprintf } from 'sprintf-js';
import { BasePluginConfig, Plugin } from '.';

type CronJob = {
  message: string;
  month?: number | number[];
  date?: number | number[];

  /**
   * Day of week. 0 for Sunday, 1 for Monday and so on.
   */
  day?: number | number[];
  hour?: number | number[];
  minute?: number | number[];
};

export type CronMessagePluginConfig = BasePluginConfig & {
  crons?: CronJob[];
};

const matchFilter = (value: number, filter: number | number[]) => {
  if (Array.isArray(filter)) {
    return filter.includes(value);
  } else {
    return filter === value;
  }
};

const validatePluginConfig = (
  config: unknown,
): config is CronMessagePluginConfig => {
  const isValidFilter = (filter: unknown, min: number, max: number): boolean =>
    typeof filter === 'undefined' ||
    (typeof filter === 'number' && min <= filter && filter <= max) ||
    (Array.isArray(filter) &&
      filter.every(
        (value) => typeof value === 'number' && min <= value && value <= max,
      ));

  const isValidCron = (cron: unknown): cron is CronJob =>
    typeof cron === 'object' &&
    typeof cron['message'] === 'string' &&
    isValidFilter(cron['month'], 1, 12) &&
    isValidFilter(cron['date'], 1, 31) &&
    isValidFilter(cron['day'], 0, 6) &&
    isValidFilter(cron['hour'], 0, 23) &&
    isValidFilter(cron['minute'], 0, 59);

  return (
    typeof config === 'object' &&
    (typeof config['crons'] === 'undefined' ||
      (Array.isArray(config['crons']) && config['crons'].every(isValidCron)))
  );
};

export class CronMessagePlugin extends Plugin<CronMessagePluginConfig> {
  static id = 'cron_message';
  static pluginName = 'Cron Message Plugin';
  static requiredPlugins: string[] = [];

  timer: Option<NodeJS.Timer> = None;

  static validatePluginConfig(
    config: unknown,
  ): config is CronMessagePluginConfig {
    return validatePluginConfig(config);
  }

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    Handlebars.registerHelper('sprintf', (format, ...args) => {
      return new Handlebars.SafeString(vsprintf(format, args));
    });
    Handlebars.registerHelper('sprintf', (format, ...args) => {
      return new Handlebars.SafeString(vsprintf(format, args));
    });
    Handlebars.registerHelper('sprintf', (format, ...args) => {
      return new Handlebars.SafeString(vsprintf(format, args));
    });

    this.timer = Option(setInterval(() => this.kickoff(), 60000));
    this.kickoff();
  }

  async unregister(): Promise<void> {
    this.timer.map(clearInterval);
  }

  /**
   * This function is called every 1 minute to run the cron jobs.
   */
  kickoff(): void {
    const jobs = this.pluginConfig.crons ?? [];
    const date = new Date();
    const messages = [];

    for (const job of jobs) {
      if (
        (typeof job.month === 'undefined' ||
          matchFilter(date.getMonth() + 1, job.month)) &&
        (typeof job.date === 'undefined' ||
          matchFilter(date.getDate(), job.date)) &&
        (typeof job.day === 'undefined' ||
          matchFilter(date.getDay(), job.day)) &&
        (typeof job.hour === 'undefined' ||
          matchFilter(date.getHours(), job.hour)) &&
        (typeof job.minute === 'undefined' ||
          matchFilter(date.getMinutes(), job.minute))
      ) {
        const message = Handlebars.compile(job.message)({
          hour: date.getHours(),
          minute: date.getMinutes(),
          month: date.getMonth(),
          date: date.getDate(),
        });
        messages.push(message);
      }
    }

    for (const message of messages) {
      this.app.client.chat.postMessage({
        channel: this.appConfig.channel_id,
        text: message,
      });
    }
  }
}
