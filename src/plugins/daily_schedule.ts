import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { None, Option } from 'monapt';
import { BasePluginConfig, Plugin } from '.';
import { isBefore, addMinutes, parse, format } from 'date-fns';
import { Type } from 'class-transformer';
import { TimetablePlugin } from './timetable';
import * as Handlebars from 'handlebars';

export class DailySchedulePluginConfigMessages {
  @IsOptional()
  @IsString()
  title = '*Your schedule today:*';

  @IsOptional()
  @IsString()
  timetableTitle = 'Timetable:';

  @IsOptional()
  @IsString()
  timetableRow =
    '・ {{{title}}} ({{{startTime}}} - {{{endTime}}}){{#if classroom}} at {{{classroom}}}{{/if}}{{#if teacher}} by {{{teacher}}}{{/if}}';

  @IsOptional()
  @IsString()
  noInformation = 'No plugins can provide information for the schedule.';
}

export class DailySchedulePluginConfig extends BasePluginConfig {
  @IsOptional()
  @IsBoolean()
  enableReminder = false;

  @IsOptional()
  @IsString()
  @Matches(/^\d\d:\d\d$/)
  scheduleTime = '06:01';

  @IsOptional()
  @IsBoolean()
  enableCommand = false;

  @IsOptional()
  @IsString()
  command = 'schedule today';

  @ValidateNested()
  @Type(() => DailySchedulePluginConfigMessages)
  messages = new DailySchedulePluginConfigMessages();
}

export class DailySchedulePlugin extends Plugin<DailySchedulePluginConfig> {
  static id = 'daily_schedule';
  static pluginName = 'Daily Schedule Plugin';
  static configClass = DailySchedulePluginConfig;
  static peerPlugins = { timetablePlugin: TimetablePlugin as typeof Plugin };

  timer: Option<NodeJS.Timer> = None;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    if (this.pluginConfig.enableCommand) {
      this.app.message(this.pluginConfig.command, async () =>
        this.sendReminder(),
      );
    }
    return;
  }

  async unregister(): Promise<void> {
    this.timer.map(clearInterval);
    return;
  }

  async onReady(): Promise<void> {
    if (this.pluginConfig.enableReminder) {
      this.timer = Option(setInterval(() => this.kickoff(), 60000));
      this.kickoff();
    }
    return;
  }

  sendReminder(): void {
    this.app.client.chat.postMessage({
      channel: this.appConfig.channelId,
      mrkdwn: true,
      text: this.generateDailySchedule(),
    });
  }

  generateDailySchedule(): string {
    const { messages } = this.pluginConfig;

    let schedule = `${messages.title}\n\n`;
    let hasPlugin = false;

    if (this.dependencies.timetablePlugin instanceof TimetablePlugin) {
      const timetablePlugin: TimetablePlugin =
        this.dependencies.timetablePlugin;

      hasPlugin = true;
      schedule += `${messages.timetableTitle}\n`;

      const lessons = timetablePlugin.getLessonsToday();
      const lessonRowTemplate = Handlebars.compile(messages.timetableRow);

      for (const lesson of lessons) {
        schedule +=
          lessonRowTemplate({
            ...lesson,
            startTime: format(lesson.startTime, 'HH:mm'),
            endTime: format(lesson.endTime, 'HH:mm'),
          }) + '\n';
      }
    }

    if (!hasPlugin) {
      schedule += messages.noInformation;
    }

    return schedule;
  }

  kickoff(): void {
    const date = new Date();
    const remindStart = parse(this.pluginConfig.scheduleTime, 'HH:mm', date);
    const remindEnd = addMinutes(remindStart, 1);
    if (isBefore(remindStart, date) && isBefore(date, remindEnd)) {
      this.sendReminder();
    }
  }
}
