import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BasePluginConfig, Plugin } from '.';

const slashCommandConfigModes = ['sequential', 'random1'] as const;

class SlashCommandConfig {
  @IsString()
  command: string;

  @IsString()
  @IsIn(slashCommandConfigModes)
  mode: typeof slashCommandConfigModes[number];

  @IsArray()
  replies: string[];
}

export class TextSlashCommandPluginConfig extends BasePluginConfig {
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => SlashCommandConfig)
  commands?: SlashCommandConfig[];
}

export class TextSlashCommandPlugin extends Plugin<TextSlashCommandPluginConfig> {
  static id = 'text_slash_command';
  static pluginName = 'Text Slash Command Plugin';
  static requiredPlugins: string[] = [];
  static configClass = TextSlashCommandPluginConfig;

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    this.pluginConfig.commands?.forEach((command: SlashCommandConfig) => {
      this.app.command(command.command, async ({ ack, say }) => {
        await ack();

        if (command.mode === 'sequential') {
          for (const reply of command.replies) {
            await say({ text: reply });
          }
        } else {
          await say({
            text: command.replies[
              Math.floor(Math.random() * command.replies.length)
            ],
          });
        }
      });
    });
  }

  async unregister(): Promise<void> {
    return;
  }
}
