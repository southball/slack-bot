// This is a template file for plugins.

import { z } from "zod";
import { Plugin, PluginManifest } from ".";

const zTemplatePluginConfig = z.object({
  prefix: z.string().default("defaultTemplatePluginPrefix"),
});

const TemplatePlugin: Plugin = ({ app, config: { template: config } }) => {
  app.message("template", async ({ say, message }) => {
    say(`${config.prefix}: ${JSON.stringify(message)}`);
  });

  return () => {};
};

export default {
  namespace: "template",
  config: zTemplatePluginConfig,
  plugin: TemplatePlugin,
} as PluginManifest<"template", typeof zTemplatePluginConfig>;
