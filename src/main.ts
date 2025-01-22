import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import ttsEventSource from "./event-source";
import { registerTtsEventFilters } from "./filters";
import { buildGoogleTtsEffectType } from "./google-tts-effect";
import { initLogger } from "./logger";
import ttsUsageVariable from "./usage-variable";
import { setTmpDir } from "./utils";
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

    const { effectManager, eventFilterManager, eventManager, frontendCommunicator, logger, path, replaceVariableManager } = runRequest.modules;

    logger.info(params?.testMessage ?? "Google Cloud TTS plugin is starting up");
    // Not a fan of divergent testing, but I don't want to fully mockup runRequest
    if (params?.testMessage) {
      return {
        effects: [],
        success: false
      };
    }

    try {
      // `%appdata%/Firebot/v5/profiles/{profile_name}/scripts` -> `%appdata%/Firebot/tmp/google-tts`
      setTmpDir(path.join(SCRIPTS_DIR, '..', '..', '..', '..', 'tmp', 'google-tts'));
      initLogger(logger);
      effectManager.registerEffect(
        buildGoogleTtsEffectType(runRequest.modules, runRequest.firebot.settings, () => params?.googleCloudAPIKey)
      );
      eventManager.registerEventSource(ttsEventSource);
      registerTtsEventFilters(eventFilterManager);
      replaceVariableManager.registerReplaceVariable(ttsUsageVariable);
      frontendCommunicator.on("getGoogleTtsVoices", voices.getSupportedVoices);
    } catch (error) {
      return {
        effects: [],
        errorMessage: error?.message ?? "An unknown error occurred",
        success: false
      };
    }
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
