import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { None, Option } from 'monapt';
import { BasePluginConfig, Plugin } from '.';
import { isBefore, addMinutes, parse, format, isToday } from 'date-fns';
import { Type } from 'class-transformer';
import { TimetablePlugin } from './timetable';
import * as Handlebars from 'handlebars';
import { Block } from '@slack/bolt';
import { generateExactMatchRegexp } from '../utils/exact-regexp';
import { TodoPlugin } from './todo';
import { CalendarPlugin } from './calendar';

export class DailySchedulePluginConfigMessages {
  @IsOptional()
  @IsString()
  title = 'Your schedule today:';

  @IsOptional()
  @IsString()
  timetableTitle = 'Timetable:';

  @IsOptional()
  @IsString()
  timetableRow =
    '・ {{{title}}} ({{{startTime}}} - {{{endTime}}}){{#if classroom}} at {{{classroom}}}{{/if}}{{#if teacher}} by {{{teacher}}}{{/if}}';

  @IsOptional()
  @IsString()
  timetableEmpty = 'There are no lessons today.';

  @IsOptional()
  @IsString()
  noInformation = 'No plugins can provide information for the schedule.';

  @IsOptional()
  @IsString()
  todoTitle = 'Todo:';

  @IsOptional()
  @IsString()
  todoRow = '・ {{{text}}}';

  @IsOptional()
  @IsString()
  todoEmpty = 'No todos left.';

  @IsOptional()
  @IsString()
  calendarTitle = 'Calendar:';

  @IsOptional()
  @IsString()
  calendarRow = '・ {{{summary}}} ({{{start}}} - {{{end}}})';

  @IsOptional()
  @IsString()
  calendarEmpty = 'No calendar events today.';
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

  peerPluginIDs = ['timetable', 'todo_plugin', 'calendar'];

  timer: Option<NodeJS.Timer> = None;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    if (this.pluginConfig.enableCommand) {
      this.app.message(
        generateExactMatchRegexp(this.pluginConfig.command),
        async () => this.sendReminder(),
      );
    }
    if (this.pluginConfig.enableReminder) {
      this.timer = Option(setInterval(() => this.kickoff(), 60000));
      this.kickoff();
    }
    return;
  }

  async unregister(): Promise<void> {
    this.timer.map(clearInterval);
    return;
  }

  async sendReminder(): Promise<void> {
    this.app.client.chat.postMessage({
      channel: this.appConfig.channelId,
      ...(await this.generateDailySchedule()),
    });
  }

  async generateDailySchedule(): Promise<{ blocks: Block[]; text: string }> {
    const { messages } = this.pluginConfig;
    const divider = { type: 'divider' } as any;

    const timetablePlugin = this.peerPlugins[0] as TimetablePlugin | undefined;
    const todoPlugin = this.peerPlugins[1] as TodoPlugin | undefined;
    const calendarPlugin = this.peerPlugins[2] as CalendarPlugin | undefined;

    let textSchedule = '';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: messages.title,
        },
      },
    ];
    textSchedule += `*${messages.title}*\n\n`;

    let hasPlugin = false;

    if (timetablePlugin instanceof TimetablePlugin) {
      hasPlugin = true;

      const lessons = timetablePlugin.getLessonsToday();
      const lessonRowTemplate = Handlebars.compile(messages.timetableRow);
      let timetableDisplay = '';

      blocks.push(divider);
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: messages.timetableTitle },
      });
      textSchedule += `*${messages.timetableTitle}*\n`;

      if (lessons.length > 0) {
        for (const lesson of lessons) {
          const row =
            lessonRowTemplate({
              ...lesson,
              startTime: format(lesson.startTime, 'HH:mm'),
              endTime: format(lesson.endTime, 'HH:mm'),
            }) + '\n';
          timetableDisplay += row;
        }
      } else {
        timetableDisplay += messages.timetableEmpty;
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: timetableDisplay,
        },
      });
      textSchedule += timetableDisplay + '\n\n';
    }

    if (todoPlugin instanceof TodoPlugin) {
      hasPlugin = true;

      const todos = todoPlugin.database.get();
      const todoRowTemplate = Handlebars.compile(messages.todoRow);
      let todoDisplay = '';

      blocks.push(divider);
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: messages.todoTitle },
      });
      textSchedule += `*${messages.todoTitle}*\n`;

      if (todos.length > 0) {
        for (const todo of todos) {
          const row = todoRowTemplate(todo) + '\n';
          todoDisplay += row;
        }
      } else {
        todoDisplay += messages.todoEmpty;
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: todoDisplay,
        },
      });
      textSchedule += todoDisplay + '\n\n';
    }

    if (calendarPlugin instanceof CalendarPlugin) {
      hasPlugin = true;

      const calendarEvents = (await calendarPlugin.loadEvents())
        .filter((event) => isToday(event.start))
        .map((event) => ({
          ...event,
          start: format(event.start, calendarPlugin.pluginConfig.dateFormat),
          end: format(event.end, calendarPlugin.pluginConfig.dateFormat),
        }));
      const calendarRowTemplate = Handlebars.compile(messages.calendarRow);
      let calendarDisplay = '';

      blocks.push(divider);
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: messages.calendarTitle },
      });
      textSchedule += `*${messages.calendarTitle}*`;

      if (calendarEvents.length > 0) {
        for (const event of calendarEvents) {
          const row = calendarRowTemplate(event) + '\n';
          calendarDisplay += row;
        }
      } else {
        calendarDisplay += messages.calendarEmpty;
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: calendarDisplay,
        },
      });
      textSchedule += calendarDisplay + '\n\n';
    }

    if (!hasPlugin) {
      textSchedule += `${messages.noInformation}`;
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: messages.noInformation,
        },
      });
    }

    return { blocks, text: textSchedule };
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
