import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { buildGoogleTtsEffectType } from "./google-tts-effect";
import { initLogger } from "./logger";
import { setTmpDir } from "./utils";

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
    const { effectManager, logger, path } = modules;

    logger.info(parameters?.testMessage ?? "Google Cloud TTS plugin is starting up");
    // Not a fan of divergent testing, but I don't want to fully mockup runRequest
    if (parameters?.testMessage) {
      return;
    }

    // `%appdata%/Firebot/v5/profiles/{profile_name}/scripts` -> `%appdata%/Firebot/tmp/google-tts`
    setTmpDir(path.join(SCRIPTS_DIR, '..', '..', '..', '..', 'tmp', 'google-tts'));
    initLogger(logger);
    effectManager.registerEffect(
      buildGoogleTtsEffectType(modules, parameters.googleCloudAPIKey)
    );
  },
};

export default script;
