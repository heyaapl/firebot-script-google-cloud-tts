import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { buildGoogleTtsEffectType } from "./google-tts-effect";
import { initLogger } from "./logger";

interface Params {
  googleCloudAPIKey: string;
  testMessage?: string;
}

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Google Cloud TTS Effect",
      description: "Adds the Google Cloud TTS effect",
      author: "heyaapl",
      version: "1.2",
      firebotVersion: "5",
      startupOnly: true,
    };
  },
  getDefaultParameters: () => {
    return {
      googleCloudAPIKey: {
        type: "string",
        title: "API Key",
        description: "Google Cloud API Key (Restart Firebot After Setting)",
        secondaryDescription: "You must have a Google Cloud API Key & Cloud Text-to-Speech Enabled for this to work. Follow the steps here to get started: https://github.com/heyaapl/firebot-script-google-cloud-tts#readme",
        default: ""
      }
    };
  },
  run: (runRequest) => {
    const { modules, parameters } = runRequest;
    const { effectManager, logger } = modules;

    logger.info(parameters?.testMessage ?? "Google Cloud TTS plugin is starting up");
    // Not a fan of divergent testing, but I don't want to fully mockup runRequest
    if (parameters?.testMessage) {
      return;
    }

    initLogger(logger);
    effectManager.registerEffect(
      buildGoogleTtsEffectType(modules, parameters.googleCloudAPIKey)
    );
  },
};

export default script;
