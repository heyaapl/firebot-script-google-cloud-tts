import type { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import type { EffectTriggerResponse } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import type { FirebotSettings } from "@crowbartools/firebot-custom-scripts-types/types/settings";
import type { EffectType } from "./firebot-extensions";
import { getTTSAudioContent } from "./google-api";
import { logger } from "./logger";
import type { EffectModel, PlaySoundData, SynthesisResult, VoiceData } from "./types";
import { tmpDir, wait } from "./utils";
import voices from "./voices";
import ng from "angular";
import { v4 as uuid } from "uuid";

interface EffectScope extends ng.IScope {
  /** `true` when the voice is guaranteed to utilize a Chirp voice model; `false` when a variable
   * voice, or a non-Chirp voice is selected.
   */
  chirpVoice: boolean;
  /** The effect that the UI is operating upon. */
  effect: EffectModel;
  /** `true` when the UI allows for variable voices along with a fallback; `false` otherwise. */
  variableVoice: boolean;
  /** The list of known voices. */
  voices: ReadonlyArray<VoiceData>;
  /** `true` when the effect should bubble a stop request upon failure; `false` otherwise. */
  wantsBubbleStop: boolean;
  /** `true` when the effect should send a stop request upon failure; `false` otherwise. */
  wantsStop: boolean;

  /** Invoked when the `wantsBubbleStop` value is changed in the UI. */
  bubbleChanged(newValue: boolean): void;
  /** Open a URL in an external web browser. */
  openLink(uri: string): void;
  /** Invoked when the `wantsStop` value was changed in the UI. */
  stopChanged(newValue: boolean): void;
  /** Invoked when the non-variable `effect.voiceName` value is changed in the UI. */
  primaryChanged(voice: VoiceData): void;
  /** Invoked when the `variableVoice` value is changed in the UI. */
  variableVoiceChanged(newValue: boolean): void;

  [x: string]: unknown;
}

export function buildGoogleTtsEffectType(
  modules: ScriptModules,
  settings: FirebotSettings,
  getApiKey: () => string
) {
  const { eventManager, frontendCommunicator, fs, httpServer, path, resourceTokenManager } = modules;

  const googleTtsEffectType: EffectType<EffectModel, never, SynthesisResult> = {
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
          defaultName: "ttsCost",
          label: "Cost",
          description: "The number of characters or bytes that were synthesized into speech."
        },
        {
          defaultName: "ttsPricingTier",
          label: "Pricing Tier",
          description: "The name of the pricing tier that was used."
        },
        {
          defaultName: "ttsSucceeded",
          label: "Succeeded",
          description: "true when the audio is playing or was successfully played, or false if an error occurred."
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
          <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter the text to be synthesized into speech." rows="4" cols="40" replace-variables menu-position="under"></textarea>
      </eos-container>

      <eos-container header="Voice Selection" pad-top="true">
          <firebot-checkbox label="Use Variables" model="variableVoice" on-change="variableVoiceChanged(newValue)" tooltip="Allow for using variables in voice selection." />

          <!-- Either one voice selection dropdown... -->
          <ui-select ng-if="variableVoice != true" ng-model="effect.voiceName" class="mb-3" theme="bootstrap" on-select="primaryChanged($item)">
              <ui-select-match placeholder="Select or search for a voice…">{{$select.selected.name}}</ui-select-match>
              <ui-select-choices repeat="voice.name as voice in voices | filter: $select.search" style="position: relative;">
                  <div ng-bind-html="voice.name | highlight: $select.search"></div>
                  <small class="muted"><strong>{{voice.language}}</strong> | <strong>{{voice.gender}}</strong></small>
              </ui-select-choices>
          </ui-select>

          <!-- ... or a primary voice textbox supporting variables and a backup voice selection dropdown. -->
          <div ng-if="variableVoice == true" class="mt-3 mb-3">
              Primary Voice
              <textarea ng-model="effect.voiceName" class="form-control mt-1 mb-3" name="text" placeholder="Enter the name of the voice to be used." rows="3" cols="40" replace-variables menu-position="under"></textarea>
              Fallback Voice
              <tooltip text="'This voice will be used when the primary voice above does not evaluate to a valid voice name.'"></tooltip>
              <ui-select ng-model="effect.backupVoice" class="mt-1" theme="bootstrap">
                  <ui-select-match placeholder="Select or search for a fallback voice…">{{$select.selected.name}}</ui-select-match>
                  <ui-select-choices repeat="voice.name as voice in voices | filter: $select.search" style="position: relative;">
                      <div ng-bind-html="voice.name | highlight: $select.search"></div>
                      <small class="muted"><strong>{{voice.language}}</strong> | <strong>{{voice.gender}}</strong></small>
                  </ui-select-choices>
              </ui-select>
          </div>

          <a class="clickable" tooltip-append-to-body="true"
            aria-label="Open a list of voices with samples in your web browser."
            ng-click="openLink('https://cloud.google.com/text-to-speech/docs/voices')"
            uib-tooltip="https://cloud.google.com/text-to-speech/docs/voices"
          >
              Voices List
          </a>
      </eos-container>

      <eos-container header="Pitch &amp; Speed" pad-top="true" ng-if="chirpVoice != true">
          <div>
            <p>Pitch</p>
            <rzslider rz-slider-model="effect.pitch" rz-slider-options="{floor: -20, ceil: 20, hideLimitLabels: true, showSelectionBar: true, step: 0.01, precision: 2}"></rzslider>
          </div>

          <div>Speed</div>
          <rzslider rz-slider-model="effect.speakingRate" rz-slider-options="{floor: 0.25, ceil: 4, hideLimitLabels: true, showSelectionBar: true, step: 0.01, precision: 2}"></rzslider>

          <div class="effect-info alert alert-info" ng-if="variableVoice == true">
            Chirp voice models <strong>do not</strong> support speaking rate nor pitch adjustment, and <em>will</em> ignore these settings.
          </div>
      </eos-container>

      <eos-container header="Volume" pad-top="true">
          <div class="volume-slider-wrapper">
              <i class="fal fa-volume-down volume-low"></i>
              <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 0.01, ceil: 10, hideLimitLabels: true, showSelectionBar: true, step: 0.01, precision: 2}"></rzslider>
              <i class="fal fa-volume-up volume-high"></i>
          </div>
      </eos-container>

      <eos-container header="Wait" pad-top="true">
          <firebot-checkbox label="Wait for sound To finish" model="effect.waitComplete" tooltip="Wait for the sound to finish before starting the next effect." />
      </eos-container>

      <eos-audio-output-device effect="effect" pad-top="false"></eos-audio-output-device>
      <eos-overlay-instance ng-if="effect.audioOutputDevice &amp;&amp; effect.audioOutputDevice.deviceId === 'overlay'" effect="effect" pad-top="true"></eos-overlay-instance>

      <eos-container header="Error Handling" pad-top="true">
          <firebot-checkbox label="Stop Effect List On Error" model="wantsStop" on-change="stopChanged(newValue)"
            tooltip="Request to stop future effects in the parent list from running should an error occur."
          />
          <firebot-checkbox label="Bubble to Parent Effect Lists On Error" model="wantsBubbleStop" on-change="bubbleChanged(newValue)"
            tooltip="Bubble a stop request up to all parent effect lists should an error occur. Useful if nested within a Conditional Effect, or a Preset Effects List, etc."
          />
      </eos-container>
    `,
    getDefaultLabel: (effect) => {
      return `${effect.backupVoice != null ? "Variable voice" : effect.voiceName}: "${effect.text}"`;
    },
    optionsController: ($scope: EffectScope, $rootScope: any, backendCommunicator: any) => {
      $scope.bubbleChanged = function(newValue: boolean): void {
        $scope.wantsBubbleStop = newValue;

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
      $scope.stopChanged = function(newValue: boolean): void {
        $scope.wantsStop = newValue;

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
      $scope.openLink = function(uri: string): void {
        $rootScope.openLinkExternally(uri);
      };
      $scope.primaryChanged = function(voice: VoiceData): void {
        $scope.effect.voiceName = voice?.name ?? "en-US-Wavenet-A";

        if ($scope.effect.voiceName.toLowerCase().includes("chirp")) {
          $scope.chirpVoice = true;
          $scope.effect.pitch = undefined;
          $scope.effect.speakingRate = undefined;
        } else {
          $scope.chirpVoice = false;
        }
      };
      $scope.variableVoiceChanged = function(newValue: boolean): void {
        $scope.variableVoice = newValue;

        if (newValue) {
          $scope.chirpVoice = false;
          $scope.effect.backupVoice = $scope.effect.voiceName;
          if (Number.isNaN($scope.effect.pitch)) {
            $scope.effect.pitch = 0;
          }
          if (Number.isNaN($scope.effect.speakingRate)) {
            $scope.effect.speakingRate = 1;
          }
        } else {
          $scope.effect.backupVoice = undefined;
          $scope.effect.voiceName = $scope.effect.backupVoice;
          $scope.chirpVoice = $scope.effect.voiceName?.toLowerCase().includes("chirp") ?? false;
        }
      };

      $scope.voices = backendCommunicator.fireEventSync("getGoogleTtsVoices") ?? [];

      if ($scope.effect.voiceName == null || $scope.effect.voiceName.length < 3) {
        $scope.effect.voiceName = "en-US-Wavenet-A"; // Historical default
      }

      if ($scope.effect.volume == null || Number.isNaN($scope.effect.volume)) {
        $scope.effect.volume = 7.00;
      } else if ($scope.effect.volume < 0.01) {
        $scope.effect.volume = 0.01;
      } else if ($scope.effect.volume > 10) {
        $scope.effect.volume = 10;
      }

      if ($scope.effect.pitch == null || Number.isNaN($scope.effect.pitch)) {
        $scope.effect.pitch = 0;
      } else if ($scope.effect.pitch < -20) {
        $scope.effect.pitch = -20;
      } else if ($scope.effect.pitch > 20) {
        $scope.effect.pitch = 20;
      }

      if ($scope.effect.speakingRate == null || Number.isNaN($scope.effect.speakingRate)) {
        $scope.effect.speakingRate = 1;
      } else if ($scope.effect.speakingRate < 0.25) {
        $scope.effect.speakingRate = 0.25;
      } else if ($scope.effect.speakingRate > 4) {
        $scope.effect.speakingRate = 4;
      }
      // `(undefined | null | true)` => `true` for sync playback mode; `false` for async playback
      $scope.effect.waitComplete = ($scope.effect.waitComplete !== false);

      $scope.variableVoice = ($scope.effect.backupVoice != null);
      $scope.wantsBubbleStop = ($scope.effect.stopOnError && $scope.effect.stopOnError.includes("bubble"));
      $scope.wantsStop = ($scope.effect.stopOnError && $scope.effect.stopOnError.includes("stop"));
      $scope.chirpVoice = (!$scope.variableVoice && $scope.effect.voiceName?.toLowerCase().includes("chirp"));
    },
    optionsValidator: (effect) => {
      const errors = [];
      if (effect.text == null || effect.text.length < 1) {
        errors.push("Please input some text.");
      }
      // 3 allows for '$$a', assuming 'a' is a legit custom variable name
      if (effect.voiceName == null || effect.voiceName.length < 3) {
        errors.push("Please select a primary voice.");
      }
      return errors;
    },
    onTriggerEvent: async (event) => {
      const { effect } = event;

      const effectResult = (wasBilled: boolean, duration?: number): EffectTriggerResponse<SynthesisResult> => {
        const category = (wasBilled && effect.text.length > 0)
          ? voices.getVoiceCategory(effect.voiceName)
          : null;
        const cost = (category != null)
          ? (category.countBytes ? new Blob([effect.text]).size : effect.text.length)
          : 0;

        if (wasBilled && cost > 0) {
          eventManager.triggerEvent("google-cloud-tts", "usage", {
            bucket: category.bucket,
            cost: cost
          });
        }

        const success = wasBilled && duration && duration > 0;
        return {
          execution: {
            bubbleStop: !success && effect.stopOnError && effect.stopOnError.includes("bubble"),
            stop: !success && effect.stopOnError && effect.stopOnError.includes("stop")
          },
          outputs: {
            ttsAudioDuration: success ? duration : 0,
            ttsCost: cost,
            ttsPricingTier: category?.bucket ?? "Unknown",
            ttsSucceeded: success,
            ttsVoiceName: effect.voiceName
          },
          success: true
        };
      };
      const getVoice = (voiceName: string, fallbackVoice?: string): string | null => {
        if (!voiceName || !voices.isKnownVoice(voiceName)) {
          if (fallbackVoice && voices.isKnownVoice(fallbackVoice)) {
            logger.info(`Google TTS voice "${voiceName ?? "(null)"}" is unknown; falling back to "${fallbackVoice}"`);
            return fallbackVoice;
          } else {
            logger.error(`Google TTS voice "${voiceName ?? "(null)"}" is unknown, and the fallback voice (${fallbackVoice ?? "null"}) was unknown`);
            return null;
          }
        }
        return effect.voiceName;
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
        logger.error(`Failed to create Google TTS temporary folder at ${tmpDir}: ${err.message}`, err);
        return effectResult(false);
      }

      effect.voiceName = getVoice(effect.voiceName, effect.backupVoice);
      if (!effect.voiceName) {
        logger.error("Google Cloud TTS effect: voiceName is null");
        return effectResult(false);
      } else if (effect.voiceName.toLowerCase().includes("chirp")) {
        effect.pitch = undefined;
        effect.speakingRate = undefined;
      }

      let audioContent: string = null;
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
        volume: effect.volume
      };
      if (soundData.audioOutputDevice.deviceId === "overlay") {
        if (settings.useOverlayInstances() && effect.overlayInstance && settings.getOverlayInstances().includes(effect.overlayInstance)) {
          soundData.overlayInstance = effect.overlayInstance;
        }
        soundData.resourceToken = resourceTokenManager.storeResourcePath(filePath, soundDuration);
        httpServer.sendToOverlay("sound", soundData);
        logger.debug(`Sent Google Cloud TTS audio to overlay (${soundData.maxSoundLength} seconds)`);
      } else {
        soundData.filepath = soundData.filepath.replaceAll("%", "%25").replaceAll("#", "%23");
        frontendCommunicator.send("playsound", soundData);
        logger.debug(`Sent Google Cloud TTS audio to playsound (${soundData.maxSoundLength} seconds)`);
      }

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
