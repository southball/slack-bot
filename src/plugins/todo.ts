import { IsOptional, IsString } from 'class-validator';
import * as escapeStringRegexp from 'escape-string-regexp';
import { BasePluginConfig, Plugin } from '.';
import { generateExactMatchRegexp } from '../utils/exact-regexp';
import { FileDatabase } from '../utils/file-database';
import { DailySchedulePlugin } from './daily_schedule';

export class TodoPluginConfig extends BasePluginConfig {
  @IsOptional()
  @IsString()
  addPrefix = 'todo:';

  @IsOptional()
  @IsString()
  removePrefix = 'todo remove';

  @IsOptional()
  @IsString()
  listCommand = 'todo list';

  @IsOptional()
  @IsString()
  todoAddedMessage = 'Todo is added.';

  @IsOptional()
  @IsString()
  todoListHeader = 'Todos:';

  @IsOptional()
  @IsString()
  todoRemoveOutOfIndexMessage = 'The ID of message provided does not exist.';

  @IsOptional()
  @IsString()
  todoRemoveSuccessMessage = 'Todo removed.';
}

export interface Todo {
  text?: string;
}

export class TodoPlugin extends Plugin<TodoPluginConfig> {
  static id = 'todo_plugin';
  static pluginName = 'Todo Plugin';
  static configClass = TodoPluginConfig;

  database: FileDatabase<Todo> = new FileDatabase('todo');

  async init(): Promise<void> {
    return;
  }

  async uninit(): Promise<void> {
    return;
  }

  async register(): Promise<void> {
    // Register command to add new todos.
    const addTodoCommandRegex = new RegExp(
      '^' + escapeStringRegexp(this.pluginConfig.addPrefix),
      'i',
    );
    this.app.message(addTodoCommandRegex, async ({ say, message }) => {
      const text: string = message['text'];
      const { addPrefix: prefix } = this.pluginConfig;
      const todoText = text.slice(prefix.length).trim();
      const todos = [...this.database.get(), { text: todoText }];
      this.database.set(todos);
      say(this.pluginConfig.todoAddedMessage);
    });

    // Register command to list all todos.
    const listTodoCommandRegex = new RegExp(
      generateExactMatchRegexp(this.pluginConfig.listCommand),
      'i', // Case insensitive command
    );
    this.app.message(listTodoCommandRegex, async ({ say }) => {
      const todos = this.database.get();
      const todoListMessage =
        `${this.pluginConfig.todoListHeader}\n` +
        todos.map(({ text }, index) => `${index + 1}. ${text}`).join('\n');
      say({ text: todoListMessage });
    });

    // Register todo to remove todo.
    const removeTodoCommandRegex = new RegExp(
      '^' + escapeStringRegexp(this.pluginConfig.removePrefix),
      'i',
    );
    this.app.message(removeTodoCommandRegex, async ({ say, message }) => {
      const todos = this.database.get();
      const text: string = message['text'];
      const body = text.slice(this.pluginConfig.removePrefix.length).trim();
      if (/^\d+$/.test(body)) {
        const index = parseInt(body);
        if (index <= 0 || index > todos.length) {
          say(this.pluginConfig.todoRemoveOutOfIndexMessage);
        } else {
          const newTodos = [
            ...todos.slice(0, index - 1),
            ...todos.slice(index),
          ];
          this.database.set(newTodos);
          say(this.pluginConfig.todoRemoveSuccessMessage);
        }
      }
    });
    return;
  }

  async unregister(): Promise<void> {
    return;
  }
}
