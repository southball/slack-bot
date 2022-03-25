import { z } from "zod";
import { App } from "@slack/bolt";

import template from "./_template";

type PluginParams = {
  app: App;
  config: z.infer<typeof zConfig>;
};

// We can use this to reload plugins.
type PluginUnloadFunction = () => void;

export type Plugin = (params: PluginParams) => PluginUnloadFunction;

export type PluginManifest<Namespace, ConfigType> = {
  namespace: Namespace;
  config: ConfigType;
  plugin: Plugin;
};

const pluginManifests = [template];

export const zConfig = z
  .object({
    [template.namespace]: template.config,
  })
  .strict();

export const plugins: Plugin[] = [template.plugin];
