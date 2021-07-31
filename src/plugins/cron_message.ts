import { None, Option } from 'monapt';
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
}

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

const validatePluginConfig = (config: unknown): config is CronMessagePluginConfig => {
    const isValidCron = (cron: unknown): cron is CronJob => (
        typeof cron === "object" &&
        typeof cron["message"] === "string" &&
        (typeof cron["month"] === "number" || Array.isArray(cron["month"]) && cron["month"].every((month) => typeof month === "number" && 1 <= month && month <= 12)) &&
        (typeof cron["date"] === "number" || Array.isArray(cron["date"]) && cron["date"].every((date) => typeof date === "number" && 1 <= date && date <= 31)) &&
        (typeof cron["day"] === "number" || Array.isArray(cron["day"]) && cron["day"].every((day) => typeof day === "number" && 0 <= day && day <= 6)) &&
        (typeof cron["hour"] === "number" || Array.isArray(cron["hour"]) && cron["hour"].every((hour) => typeof hour === "number" && 0 <= hour && hour <= 23)) &&
        (typeof cron["minute"] === "number" || Array.isArray(cron["minute"]) && cron["minute"].every((minute) => typeof minute === "number" && 0 <= minute && minute <= 59))
    );
    return typeof config === "object" && (typeof config["crons"] === "undefined" || Array.isArray(config["crons"]) && config["crons"].every(isValidCron));
}

export class CronMessagePlugin extends Plugin<CronMessagePluginConfig> {
    static id: string = "cron_message";
    static pluginName: string = "Cron Message Plugin"
    static requiredPlugins: string[] = [];

    timer: Option<NodeJS.Timer> = None;

    static validatePluginConfig(config: Object): config is CronMessagePluginConfig {
        return validatePluginConfig(config);
    }

    async init(): Promise<void> {
        return;
    }

    async uninit(): Promise<void> {
        return;
    }

    async register(): Promise<void> {
        this.timer = Option(setInterval(() => this.kickoff(), 60000));
        this.kickoff();
    }

    async unregister(): Promise<void> {
        this.timer.map(clearInterval);
    }

    /**
     * This function is called every 1 minute to run the cron jobs.
     */
    kickoff() {
        const jobs = this.pluginConfig.crons ?? [];
        const date = new Date();
        const messages = [];

        for (const job of jobs) {
            if (
                (typeof job.month === "undefined" || matchFilter(date.getMonth() + 1, job.month)) &&
                (typeof job.date === "undefined" || matchFilter(date.getDate(), job.date)) &&
                (typeof job.day === "undefined" || matchFilter(date.getDay(), job.day)) &&
                (typeof job.hour === "undefined" || matchFilter(date.getHours(), job.hour)) &&
                (typeof job.minute === "undefined" || matchFilter(date.getMinutes(), job.minute))
            ) {
                // TODO allow variables in message.
                messages.push(job.message);
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

