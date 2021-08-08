# Slack Bot

This is a Slack bot that is written for personal use, and is designed to host
itself in a single channel.

It is designed to be easy to use and customize: all functions should be
configure by editing the `config.yml` only. In addition, the template for most
messages can also be set.

## Plugins

See `config.sample.yml` for how to configure these plugins.

- `cron_message`
- `daily_schedule`
- `launch_message`
- `plugins_list`
- `text_slash_command`
- `timetable`

## Instructions

1. Run `yarn` to install the required packages.
1. Copy `.sample.env` to `.env` and provide the required variables.
1. Copy `config.sample.yml` to `config.yml` and customize the file.
1. Run `yarn start` to launch the bot.
