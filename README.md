# Slack Bot

This is a Slack bot that is written for personal use, and is designed to host
itself in a single channel.

It is designed to be easy to use and customize: all functions should be
configure by editing the `config.yml` only. In addition, the template for most
messages can also be set.

## Plugins

More information for the plugin is available at
[the guide book](https://southball.dev/slack-bot).  
Especially see
[the configuration guide](https://southball.dev/slack-bot/config.html) to find
more information on how to configure the Slack app properly. See
`config.sample.yml` for how to configure these plugins.

## Instructions

1. Run `yarn` to install the required packages.
1. Copy `.sample.env` to `.env` and provide the required variables.
1. Copy `config.sample.yml` to `config.yml` and customize the file.
1. Run `yarn start` to launch the bot.
