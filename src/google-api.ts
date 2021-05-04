import axios from "axios";
import { EffectModel } from "./types";

interface SynthesizeTextResponse {
  audioContent: string;
}

export async function getTTSAudioContent(effect: EffectModel, googleCloudAPIKey: string): Promise<string | null> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleCloudAPIKey}`;

  const response = await axios.post<SynthesizeTextResponse>(url, {
    input: {
      text: effect.text,
    },
    voice: {
      languageCode: effect.voiceName.substring(0,5),
      name: effect.voiceName,
      ssmlGender: effect.voiceGender,
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: effect.pitch,
      speakingRate: effect.speakingRate
    },
  });

  return response?.data?.audioContent;
}
