import { Firebot, ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import { EffectTriggerResponse } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { FirebotSettings } from "@crowbartools/firebot-custom-scripts-types/types/settings";
import { v4 as uuid } from "uuid";
import { getTTSAudioContent } from "./google-api";
import { logger } from "./logger";
import { tmpDir, wait } from "./utils";
import { EffectModel, PlaySoundData, SynthesisResult } from "./types";
import voices from "./voices";

export function buildGoogleTtsEffectType(
  modules: ScriptModules,
  settings: FirebotSettings,
  getApiKey: () => string
) {
  const { frontendCommunicator, fs, path, resourceTokenManager } = modules;

  const googleTtsEffectType: Firebot.EffectType<EffectModel> = {
    definition: {
      id: "heyaapl:google-cloud-tts",
      name: "Google Cloud Text-to-Speech",
      description: "TTS via Google Cloud",
      icon: "fad fa-microphone-alt",
      categories: ["fun"],
      dependencies: [],
      outputs: [
        {
          defaultName: "ttsAudioDuration",
          label: "Audio Duration",
          description: "The duration of the synthesized audio, in seconds."
        },
        {
          defaultName: "ttsBucket",
          label: "Pricing Bucket",
          description: "The name of the accounting bucket that was used."
        },
        {
          defaultName: "ttsCost",
          label: "Units Spent",
          description: "The number of characters or bytes that were synthesized into speech."
        },
        {
          defaultName: "ttsSucceeded",
          label: "Succeeded",
          description: "true when the audio is or was successfully played, or false if an error occurred."
        },
        {
          defaultName: "ttsVoiceName",
          label: "Voice Name",
          description: "The name of the voice that was used for synthesizing speech."
        },
      ]
    },
    optionsTemplate: `
      <eos-container header="Text">
          <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>
      </eos-container>

      <eos-container header="Voice" pad-top="true">
        <ui-select ng-model="effect.voiceName" theme="bootstrap">
            <ui-select-match placeholder="Select or search for a voice…">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="voice.name as voice in voices | filter: $select.search" style="position:relative;">
                <div ng-bind-html="voice.name | highlight: $select.search"></div>
                <small class="muted"><strong>{{voice.language}}</small>
            </ui-select-choices>
        </ui-select>
      </eos-container>
      <!--
      <eos-container header="Gender" pad-top="true">
            <dropdown-select options="{ MALE: 'Male', FEMALE: 'Female'}" selected="effect.voiceGender"></dropdown-select>
      </eos-container>
      -->
      <eos-container header="Pitch & Speed" pad-top="true">
        <div>Pitch</div>
        <rzslider rz-slider-model="effect.pitch" rz-slider-options="{floor: -20, ceil: 20, hideLimitLabels: true, showSelectionBar: true, step: 0.5, precision: 1}"></rzslider>
        <div>Speed</div>
        <rzslider rz-slider-model="effect.speakingRate" rz-slider-options="{floor: 0.25, ceil: 4, hideLimitLabels: true, showSelectionBar: true, step: 0.05, precision: 2}"></rzslider>
      </eos-container>

      <eos-container header="Volume" pad-top="true">
          <div class="volume-slider-wrapper">
              <i class="fal fa-volume-down volume-low"></i>
                <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true, showSelectionBar: true}"></rzslider>
              <i class="fal fa-volume-up volume-high"></i>
          </div>
      </eos-container>

      <eos-container header="Wait" pad-top="true">
        <firebot-checkbox label="Wait for sound To finish" model="effect.waitComplete" tooltip="Wait for the sound to finish before starting the next effect." />
      </eos-container>

      <eos-audio-output-device effect="effect" pad-top="false"></eos-audio-output-device>
      <eos-overlay-instance ng-if="effect.audioOutputDevice && effect.audioOutputDevice.deviceId === 'overlay'" effect="effect" pad-top="true"></eos-overlay-instance>

      <eos-container header="Error Handling" pad-top="true">
          <firebot-checkbox label="Stop Effect List On Error" model="wantsStop" on-change="stopChanged(newValue)"
              tooltip="Request to stop future effects in the parent list from running should an error occur."
          />
          <firebot-checkbox label="Bubble to Parent Effect Lists On Error" model="wantsBubbleStop" on-change="bubbleChanged(newValue)"
              tooltip="Bubble a stop request up to all parent effect lists should an error occur. Useful if nested within a Conditional Effect, or a Preset Effects List, etc."
          />
      </eos-container>
    `,
    optionsController: ($scope, backendCommunicator: any) => {
      $scope.bubbleChanged = (newValue: boolean) => {
        if (newValue) {
          // add bubble
          if ($scope.effect.stopOnError === "stop") {
            $scope.effect.stopOnError = "bubble-stop";
          } else {
            $scope.effect.stopOnError = "bubble";
          }
        } else {
          // remove bubble
          if ($scope.effect.stopOnError === "bubble-stop") {
            $scope.effect.stopOnError = "stop";
          } else {
            $scope.effect.stopOnError = false;
          }
        }
      };
      $scope.stopChanged = (newValue: boolean) => {
        if (newValue) {
          // add stop
          if ($scope.effect.stopOnError === "bubble") {
            $scope.effect.stopOnError = "bubble-stop";
          } else {
            $scope.effect.stopOnError = "stop";
          }
        } else {
          // remove stop
          if ($scope.effect.stopOnError === "bubble-stop") {
            $scope.effect.stopOnError = "bubble";
          } else {
            $scope.effect.stopOnError = false;
          }
        }
      };

      if ($scope.effect.volume == null) {
        $scope.effect.volume = 10;
      }
      $scope.voices = backendCommunicator.fireEventSync("getGoogleTtsVoices") ?? [];

      if ($scope.effect.voiceName == null) {
        $scope.effect.voiceName = "en-US-Wavenet-A"; // Historical default
      }
      if ($scope.effect.pitch == null) {
        $scope.effect.pitch = 0;
      }
      if ($scope.effect.speakingRate == null) {
        $scope.effect.speakingRate = 1;
      }
      // `(undefined | null | true)` => `true` for sync playback mode; `false` for async playback
      $scope.effect.waitComplete = ($scope.effect.waitComplete !== false);

      $scope.wantsBubbleStop = $scope.effect.stopOnError && $scope.effect.stopOnError.includes("bubble");
      $scope.wantsStop = $scope.effect.stopOnError && $scope.effect.stopOnError.includes("stop");
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

      const effectResult = (wasBilled: boolean, duration?: number): EffectTriggerResponse<SynthesisResult> => {
        const category = (wasBilled && effect.text.length > 0)
          ? voices.getVoiceCategory(effect.voiceName)
          : null;
        const cost = (category != null)
          ? (category.countBytes ? new Blob([effect.text]).size : effect.text.length)
          : 0;
        const success = wasBilled && duration && duration > 0;
        return {
          execution: {
            bubbleStop: !success && effect.stopOnError && effect.stopOnError.includes("bubble"),
            stop: !success && effect.stopOnError && effect.stopOnError.includes("stop")
          },
          outputs: {
            ttsAudioDuration: success ? duration : 0,
            ttsBucket: category?.bucket ?? "Unknown",
            ttsCost: cost,
            ttsSucceeded: success,
            ttsVoiceName: effect.voiceName
          },
          success: success
        };
      };
      const tryRemoveFile = (fd: string): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
          fs.unlink(fd, (err) => {
            if (err) {
              logger.warn(`Failed to remove Google TTS audio file from ${fd}:`, err.message);
            }
            resolve(!err);
          });
        });
      };
      const tryWriteFile = async (fd: string, b64Data: string): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
          if (fd && b64Data) {
            fs.writeFile(fd, Buffer.from(b64Data, "base64"), (err) => {
              if (err) {
                logger.error(`Failed to write Google TTS audio to ${fd}:`, err.message ?? "no message");
              }
              resolve(!err);
            });
          } else {
            logger.warn("Google TTS writeFile called with null parameter(s)");
            resolve(false);
          }
        });
      };

      // Create the temporary folder first
      try {
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir);
        }
      } catch (err) {
        logger.error(`Failed to create Google TTS temporary folder at ${tmpDir}:`, err.message);
        return effectResult(false);
      }

      let audioContent: string;
      // synthesize audio via google tts
      try {
        audioContent = await getTTSAudioContent(effect, getApiKey());
      } catch (error) {
        logger.error("Google Cloud TTS Effect failed", { error: error });
      }
      if (!audioContent) {
        return effectResult(false);
      } 

      // save audio content to file
      const filePath = path.join(tmpDir, `tts${uuid()}.mp3`);
      if (!await tryWriteFile(filePath, audioContent)) {
        return effectResult(true);
      }

      // get the duration of this tts sound file in seconds
      let soundDuration: number = undefined;
      try {
        soundDuration = await frontendCommunicator.fireEventAsync<number>(
          "getSoundDuration", { 
            format: "mp3",
            path: filePath
          }
        );
      } catch (err) {
        logger.warn("Failed to get duration for Google TTS audio file; assuming thirty seconds", err.message);
      }
      soundDuration ??= 30;

      // play the TTS audio
      const soundData: PlaySoundData = {
        audioOutputDevice: (!effect.audioOutputDevice || effect.audioOutputDevice.label === "App Default")
          ? settings.getAudioOutputDevice()
          : effect.audioOutputDevice,
        filepath: filePath,
        format: "mp3",
        isUrl: false,
        maxSoundLength: soundDuration,
        volume: effect.volume || 7
      };
      if (soundData.audioOutputDevice.deviceId === "overlay") {
        if (settings.useOverlayInstances() && effect.overlayInstance && settings.getOverlayInstances().includes(effect.overlayInstance)) {
          soundData.overlayInstance = effect.overlayInstance;
        }
        soundData.resourceToken = resourceTokenManager.storeResourcePath(filePath, soundDuration);
      }
      frontendCommunicator.send("playsound", soundData);
      logger.debug("Sent Google Cloud TTS audio to playsound");

      // return early when desired to start the next effect in the list
      if (effect.waitComplete === false) {
        setTimeout(() => tryRemoveFile(filePath), (soundData.maxSoundLength + 5) * 1000);
        return effectResult(true, soundDuration);
      }

      // wait for the sound to finish plus 1.5 second buffer
      await wait((soundDuration + 1.5) * 1000);

      // remove the audio file
      await tryRemoveFile(filePath);

      // returning true tells the firebot effect system this effect has completed
      // and that it can continue to the next effect
      return effectResult(true, soundDuration);
    },
  };
  return googleTtsEffectType;
}
