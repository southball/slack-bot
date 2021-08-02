import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as Handlebars from 'handlebars';
import {
  addMinutes,
  isAfter,
  minutesInHour,
  format,
  parse,
  subMinutes,
  isBefore,
} from 'date-fns';
import { Option } from 'monapt';
import { BasePluginConfig, Plugin } from '.';

const defaultTemplate = `{{{title}}} ({{{startTime}}} - {{{endTime}}}){{#if teacher}} by {{{teacher}}}{{/if}} will start soon{{#if classroom}} at {{{classroom}}}{{/if}}.`;

@ValidatorConstraint({ name: 'lessonPeriods', async: false })
class LessonPeriods implements ValidatorConstraintInterface {
  validate(value: number | [number, number]): boolean | Promise<boolean> {
    return (
      (typeof value === 'number' && 1 <= value) ||
      (Array.isArray(value) &&
        value.length === 2 &&
        1 <= value[0] &&
        value[0] <= value[1])
    );
  }
  defaultMessage?(): string {
    return `The value(s) should be one or two positive numbers.`;
  }
}

class TimetablePluginConfigLesson {
  @IsNumber()
  @IsIn([0, 1, 2, 3, 4, 5, 6])
  weekday: number;

  @Validate(LessonPeriods)
  period: number | [number, number];

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  classroom: string;

  @IsOptional()
  @IsString()
  teacher: string;
}

class TimetablePluginConfigPeriod {
  @IsNumber()
  period: number;

  @IsString()
  @Matches(/^\d\d:\d\d$/)
  startTime: string;

  @IsString()
  @Matches(/^\d\d:\d\d$/)
  endTime: string;
}

class TimetablePluginConfigRemindBefore {
  @IsBoolean()
  enabled: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  before_minutes?: number;

  @IsString()
  @IsOptional()
  template: string;
}

export class TimetablePluginConfig extends BasePluginConfig {
  @IsArray()
  @ValidateNested()
  @Type(() => TimetablePluginConfigPeriod)
  @ArrayUnique(({ period }: TimetablePluginConfigPeriod) => period)
  periods: TimetablePluginConfigPeriod[];

  @IsArray()
  @ValidateNested()
  @Type(() => TimetablePluginConfigLesson)
  lessons: TimetablePluginConfigLesson[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TimetablePluginConfigRemindBefore)
  remind_before?: TimetablePluginConfigRemindBefore;
}

// Used to describe a lesson today.
export interface TemporalLesson {
  title: string;
  period: number | number[];
  startTime: Date;
  endTime: Date;
  teacher: string;
  classroom: string;
}

export class TimetablePlugin extends Plugin<TimetablePluginConfig> {
  static id = 'timetable';
  static pluginName = 'Timetable Plugin';
  static configClass = TimetablePluginConfig;

  timer: Option<NodeJS.Timer>;
  compiledTemplate?: Handlebars.TemplateDelegate;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    if (this.pluginConfig.remind_before?.enabled) {
      const template =
        this.pluginConfig.remind_before?.template ?? defaultTemplate;
      this.compiledTemplate = Handlebars.compile(template);

      this.timer = Option(setInterval(() => this.kickoff_reminder(), 60000));
      this.kickoff_reminder();
    }
  }

  async unregister(): Promise<void> {
    this.timer.map(clearInterval);
    return;
  }

  getLessonsToday(): TemporalLesson[] {
    const date = new Date();

    const temporalLessons: TemporalLesson[] = [];

    // Process periods list
    const periods: Map<number, [Date, Date]> = new Map();
    for (const period of this.pluginConfig.periods) {
      const startTime = parse(period.startTime, 'HH:mm', date);
      const endTime = parse(period.endTime, 'HH:mm', date);
      periods.set(period.period, [startTime, endTime]);
    }

    for (const lesson of this.pluginConfig.lessons) {
      if (lesson.weekday == date.getDay()) {
        const [startPeriod, endPeriod] =
          typeof lesson.period === 'number'
            ? [lesson.period, lesson.period]
            : lesson.period;
        const [startTime] = periods.get(startPeriod);
        const [, endTime] = periods.get(endPeriod);
        temporalLessons.push({
          title: lesson.title,
          period: lesson.period,
          teacher: lesson.teacher,
          classroom: lesson.classroom,
          startTime,
          endTime,
        });
      }
    }

    return temporalLessons;
  }

  /**
   * This function is called every 1 minute to send the messages.
   */
  kickoff_reminder(): void {
    const messages = [];

    const date = new Date();
    const lessons = this.getLessonsToday();

    for (const lesson of lessons) {
      // We want to send the remainder [N, N+1] minutes before the lesson.
      const remindMinutes =
        (this.pluginConfig.remind_before?.before_minutes ?? 15) + 1;
      const remindTime = subMinutes(lesson.startTime, remindMinutes);
      const remindEndTime = addMinutes(remindTime, 1);

      if (isBefore(remindTime, date) && isBefore(date, remindEndTime)) {
        const message =
          this.compiledTemplate?.({
            title: lesson.title,
            periods: lesson.period,
            startTime: format(lesson.startTime, 'HH:mm'),
            endTime: format(lesson.endTime, 'HH:mm'),
            teacher: lesson.teacher,
            classroom: lesson.classroom,
          }) ?? 'Cannot compile template. Please check your config.';
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
