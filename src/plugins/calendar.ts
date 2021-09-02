import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { BasePluginConfig, Plugin } from '.';
import axios from 'axios';
import * as ical from 'node-ical';
import { generateExactMatchRegexp } from '../utils/exact-regexp';
import { format } from 'date-fns';

export class CalendarPluginConfig extends BasePluginConfig {
  @IsArray()
  @Type(() => String)
  calendars: string[];

  @IsOptional()
  @IsString()
  dateFormat = 'y-MM-dd HH:mm';

  @IsOptional()
  @IsString()
  comingEventsTitle = 'Coming events:';

  @IsOptional()
  @IsString()
  comingEventsCommand = 'coming events';
}

export class CalendarPlugin extends Plugin<CalendarPluginConfig> {
  static id = 'calendar';
  static pluginName = 'Calendar Plugin';
  static configClass = CalendarPluginConfig;

  eventsCachedTime: Date = new Date(0);
  eventsCache: ical.VEvent[] = [];

  async loadEvents(): Promise<ical.VEvent[]> {
    const now = new Date();
    if (now.getTime() - this.eventsCachedTime.getTime() >= 5 * 60 * 1000) {
      this.eventsCachedTime = now;
      this.eventsCache = await this.uncachedLoadEvents();
    }
    return this.eventsCache;
  }

  /**
   * Downloads ICAL files and parse into events.
   */
  private async uncachedLoadEvents(): Promise<ical.VEvent[]> {
    const urls = this.pluginConfig.calendars;
    const components: ical.VEvent[] = [];

    for (const url of urls) {
      const { data } = await axios.get(url);
      const parsedData = ical.sync.parseICS(data);
      components.push(
        ...(Object.values(parsedData).filter(
          (data) => data.type === 'VEVENT',
        ) as ical.VEvent[]),
      );
    }

    // Sort events by start.
    components.sort(
      (event1, event2) => event1.start.getTime() - event2.start.getTime(),
    );

    return components;
  }

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.app.message(
      generateExactMatchRegexp(this.pluginConfig.comingEventsCommand),
      async ({ say }) => {
        const events = (await this.loadEvents()).slice(0, 10);
        const report =
          this.pluginConfig.comingEventsTitle +
          '\n' +
          events
            .map((event) => {
              const startDateString = format(
                event.start,
                this.pluginConfig.dateFormat,
              );
              const endDateString = format(
                event.end,
                this.pluginConfig.dateFormat,
              );
              return `・ ${event.summary} (${startDateString} ~ ${endDateString})`;
            })
            .join('\n');
        say(report);
      },
    );
    return;
  }

  async unregister(): Promise<void> {
    return;
  }
}
