import { Firebot } from "firebot-custom-scripts-types";
import { buildGoogleTtsEffectType } from "./google-tts-effect";
import { initLogger } from "./logger";

interface Params {
  googleCloudAPIKey: string
}

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Google TTS Effect",
      description: "Adds the Google TTS effect",
      author: "heyaapl",
      version: "1.0",
      firebotVersion: "5",
      startupOnly: true,
    };
  },
  getDefaultParameters: () => {
    return {
      googleCloudAPIKey: {
        type: "string",
        description: "Google Cloud API Key",
        secondaryDescription: "Go here to get your Google Cloud API Key: https://cloud.google.com/docs/authentication/api-keys",
        default: ""
      }
    };
  },
  run: (runRequest) => {
    const { effectManager, frontendCommunicator, logger } = runRequest.modules;
    const fs = (runRequest.modules as any).fs;
    const path = (runRequest.modules as any).path;
    initLogger(logger);
    effectManager.registerEffect(
      buildGoogleTtsEffectType(frontendCommunicator, fs, path, runRequest.parameters.googleCloudAPIKey)
    );
  },
};

export default script;
