import { App } from "@slack/bolt";
import { plugins, zConfig } from "./plugins";
import { z } from "zod";

const dummyConfig = {
  template: {
    prefix: "test",
  },
};

async function main() {
  if (
    !process.env.SLACK_BOT_TOKEN ||
    !process.env.SLACK_SIGNING_SECRET ||
    !process.env.SLACK_APP_TOKEN
  ) {
    console.error(
      "Error: you must set all of SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET and SLACK_APP_TOKEN."
    );
    process.exit(1);
  }

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  let config: z.infer<typeof zConfig>;
  try {
    config = zConfig.parse(dummyConfig);
  } catch (error) {
    console.error("Error while parsing config:");
    console.error(error);
    process.exit(1);
  }

  for (const plugin of plugins) {
    plugin({ app, config });
  }

  await app.start();
  console.log("App is running.");
}

main();
