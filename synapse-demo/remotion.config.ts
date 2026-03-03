import path from "path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Remotion's bundler overrides common alias names; parent app is imported via relative paths.
Config.overrideWebpackConfig((config) => {
  const parentSrc = path.resolve(__dirname, "..", "src");
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "synapse-components": path.join(parentSrc, "components"),
        "synapse-modules": path.join(parentSrc, "modules"),
        "synapse-assets": path.join(parentSrc, "assets"),
      },
    },
  };
});
