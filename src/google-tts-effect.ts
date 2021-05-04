import axios from "axios";
import { Firebot, ScriptModules } from "firebot-custom-scripts-types";
import { v4 as uuid } from "uuid";
import { getTTSAudioContent } from "./google-api";
import { logger } from "./logger";
import { wait } from "./utils";

interface EffectModel {
  text: string;
  volume: number;
  audioOutputDevice: any;
}

export function buildGoogleTtsEffectType(
  frontendCommunicator: ScriptModules["frontendCommunicator"],
  fs: ScriptModules["fs"],
  path: ScriptModules["path"]
) {
  const googleTtsEffectType: Firebot.EffectType<EffectModel> = {
    definition: {
      id: "heyaapl:google-cloud-tts",
      name: "Google Cloud Text-to-Speech",
      description: "TTS via Google Cloud",
      icon: "fad fa-microphone-alt",
      categories: ["fun"],
      dependencies: [],
      triggers: {
        command: true,
        custom_script: true,
        startup_script: true,
        api: true,
        event: true,
        hotkey: true,
        timer: true,
        counter: true,
        preset: true,
        manual: true,
      },
    },
    optionsTemplate: `
      <eos-container header="Text">
          <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>
      </eos-container>

      <eos-container header="Volume" pad-top="true">
          <div class="volume-slider-wrapper">
              <i class="fal fa-volume-down volume-low"></i>
                <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true, showSelectionBar: true}"></rzslider>
              <i class="fal fa-volume-up volume-high"></i>
          </div>
      </eos-container>

      <eos-audio-output-device effect="effect" pad-top="true"></eos-audio-output-device>
    `,
    optionsController: ($scope) => {
      if ($scope.effect.volume == null) {
        $scope.effect.volume = 10;
      }
    },
    optionsValidator: (effect) => {
      const errors = [];
      if (effect.text == null || effect.text.length < 1) {
        errors.push("Please input some text.");
      }
      return errors;
    },
    onTriggerEvent: async (event) => {
      const effect = event.effect;

      try {
        //  synthesize text via google tts
        const audioContent = await getTTSAudioContent(effect.text);

        logger.debug(audioContent);

        if (audioContent == null) {
          // call to google tts api failed
          return true;
        }

        const filePath = path.join(process.cwd(), "tmp", `tts${uuid()}.mp3`);

        logger.debug(filePath);

        // save audio content to file
        await fs.writeFile(filePath, Buffer.from(audioContent, "base64"));

        // get the duration of this tts sound duration
        const soundDuration = await frontendCommunicator.fireEventAsync<number>(
          "getSoundDuration",
          {
            path: filePath,
            format: "mp3",
          }
        );

        // play the TTS audio
        frontendCommunicator.send("playsound", {
          volume: effect.volume || 10,
          audioOutputDevice: effect.audioOutputDevice,
          format: "mp3",
          filepath: filePath,
        });

        // wait for the sound to finish (plus 1.5 sec buffer)
        await wait((soundDuration + 1.5) * 1000);

        // remove the audio file
        await fs.unlink(filePath);
      } catch (error) {
        logger.error("ADA TTS Effect failed", error);
      }

      // returning true tells the firebot effect system this effect has completed
      // and that it can continue to the next effect
      return true;
    },
  };
  return googleTtsEffectType;
}
