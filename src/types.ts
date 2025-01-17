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