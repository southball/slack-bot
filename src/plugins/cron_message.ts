import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as Handlebars from 'handlebars';
import { None, Option } from 'monapt';
import { vsprintf } from 'sprintf-js';
import { BasePluginConfig, Plugin } from '.';

@ValidatorConstraint({ name: 'cronExpression', async: false })
export class CronExpression implements ValidatorConstraintInterface {
  validate(
    value: number | number[],
    validationArguments?: ValidationArguments,
  ): boolean | Promise<boolean> {
    const [low, high] = validationArguments.constraints;
    return (
      (typeof value === 'number' && low <= value && value <= high) ||
      (Array.isArray(value) &&
        value.every(
          (entry) => typeof entry === 'number' && low <= entry && entry <= high,
        ))
    );
  }
  defaultMessage?(validationArguments?: ValidationArguments): string {
    const [low, high] = validationArguments.constraints;
    return `The values should be a number or an array of numbers between ${low} and ${high}.`;
  }
}

export class CronJob {
  @IsString()
  message: string;

  @IsOptional()
  @Validate(CronExpression, [1, 12])
  month?: number | number[];

  @IsOptional()
  @Validate(CronExpression, [1, 31])
  date?: number | number[];

  /**
   * Day of week. 0 for Sunday, 1 for Monday and so on.
   */
  @IsOptional()
  @Validate(CronExpression, [0, 6])
  day?: number | number[];

  @IsOptional()
  @Validate(CronExpression, [0, 23])
  hour?: number | number[];

  @IsOptional()
  @Validate(CronExpression, [0, 59])
  minute?: number | number[];
}

export class CronMessagePluginConfig extends BasePluginConfig {
  // @IsOptional()
  @ValidateNested()
  @Type(() => CronJob)
  crons?: CronJob[];
}

const matchFilter = (value: number, filter: number | number[]) => {
  if (Array.isArray(filter)) {
    return filter.includes(value);
  } else {
    return filter === value;
  }
};

export class CronMessagePlugin extends Plugin<CronMessagePluginConfig> {
  static id = 'cron_message';
  static pluginName = 'Cron Message Plugin';
  static configClass = CronMessagePluginConfig;

  timer: Option<NodeJS.Timer> = None;

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
