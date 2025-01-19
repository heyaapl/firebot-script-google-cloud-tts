export interface EffectModel {
    text: string;
    volume: number;
    audioOutputDevice?: {
      deviceId?: string;
      label?: string;
    };
    voiceName: string;
    voiceGender: string;
    pitch: number;
    speakingRate: number;
    overlayInstance?: string;
    stopOnError?: false | "bubble" | "stop" | "bubble-stop";
    waitComplete?: boolean;
  }

  interface BasePlaySoundData {
    /** Information about which audio device to play the audio on. */
    audioOutputDevice: {
      /** The unique identifier of the audio device. */
      deviceId?: "default" | "overlay" | string;
      /** The friendly name of the audio device, such as "App Default", "Send To Overlay", or "Speakers". */
      label?: string;
    };
    /** The file extension. */
    format: string;
    /** The length of the audio file. */
    maxSoundLength: number;
    /** How loud should the audio be played, from 0 to 10. */
    volume: number;
  
    /** Which overlay instance to use, should overlay instancing be enabled. */
    overlayInstance?: string;
    /** A permission slip so that the audio file can bypass the blood-brain barrier. */
    resourceToken?: string;
  };
  interface PlaySoundFileData extends BasePlaySoundData {
    /** `false` when the sound data is a local file. */
    isUrl: false;
    /** A path to the sound file to be played. */
    filepath: string;
  };
  interface PlaySoundUrlData extends BasePlaySoundData {
    /** `true` when the sound data represents an URL. */
    isUrl: true;
    /** An URL pointing to the sound to be played. */
    url: string;
  };
  /** The data type of a "playsound" communicator signal argument,
   * as used by the Firebot app/services/sound.service.js PLAY_SOUND listener.
  */
  export type PlaySoundData = PlaySoundFileData | PlaySoundUrlData;
