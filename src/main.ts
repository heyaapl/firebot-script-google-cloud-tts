import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { buildGoogleTtsEffectType } from "./google-tts-effect";
import { initLogger } from "./logger";
import { setTmpDir } from "./utils";
import { VoiceData } from "./types";
import voices from "./voices";

interface Params {
  googleCloudAPIKey: string;
  testMessage?: string;
}

let params: Params = null;
const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Google Cloud TTS Effect",
      description: "Adds the Google Cloud TTS effect",
      author: "heyaapl",
      version: "2.0",
      firebotVersion: "5",
      startupOnly: true,
    };
  },
  getDefaultParameters: () => {
    return {
      googleCloudAPIKey: {
        type: "password",
        title: "API Key",
        description: "Google Cloud API Key",
        tip: "You must have a Google Cloud API Key & Cloud Text-to-Speech Enabled for this to work. Follow the [steps in the readme](https://github.com/heyaapl/firebot-script-google-cloud-tts?tab=readme-ov-file#how-to-use) to get started",
        default: ""
      }
    };
  },
  parametersUpdated: (parameters) => {
    params = parameters;
  },
  run: (runRequest) => {
    params = runRequest.parameters;

    const { firebot, modules } = runRequest;
    const { settings } = firebot;
    const { effectManager, frontendCommunicator, logger, path } = modules;

    logger.info(params?.testMessage ?? "Google Cloud TTS plugin is starting up");
    // Not a fan of divergent testing, but I don't want to fully mockup runRequest
    if (params?.testMessage) {
      return {
        effects: [],
        success: false
      };
    }

    // `%appdata%/Firebot/v5/profiles/{profile_name}/scripts` -> `%appdata%/Firebot/tmp/google-tts`
    setTmpDir(path.join(SCRIPTS_DIR, '..', '..', '..', '..', 'tmp', 'google-tts'));
    initLogger(logger);
    effectManager.registerEffect(
      buildGoogleTtsEffectType(modules, settings, () => params?.googleCloudAPIKey)
    );
    frontendCommunicator.on("getGoogleTtsVoices", voices.getSupportedVoices);
    return {
      effects: [],
      success: true
    };
  },
  stop: () => {
    params = null;
  }
};

export default script;
