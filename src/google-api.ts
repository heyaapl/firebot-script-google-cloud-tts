import { GoogleApiError } from "./google-api-error";
import { EffectModel } from "./types";
import voices from "./voices";

interface SynthesizeTextResponse {
  audioContent?: string;
  error?: {
    code: number;
    status: string;
    message: string;
  };
}

export async function getTTSAudioContent(effect: EffectModel, googleCloudAPIKey: string): Promise<string | null> {
  // shortcut when the script has been unloaded or is not configured
  if (!googleCloudAPIKey) {
    throw new GoogleApiError({
      code: 401,
      message: "No API key available",
      status: "Unauthorized"
    });
  }

  const languageCode = voices.getVoiceLangCode(effect.voiceName);
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleCloudAPIKey}`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        text: effect.text,
      },
      voice: {
        languageCode: languageCode,
        name: effect.voiceName
      },
      audioConfig: {
        audioEncoding: "MP3",
        pitch: effect.pitch,
        speakingRate: effect.speakingRate
      }
    })
  });
  
  const responseData = await response.json() as SynthesizeTextResponse;
  if (!response.ok) {
    if (responseData?.error) {
      throw new GoogleApiError(responseData.error);
    } else {
      // The error wasn't loaded into the response body:
      // *I* likely messed *something* up in the fetch request...
      throw new GoogleApiError({
        code: response.status,
        message: `${response.statusText}: ${await response.text()}`,
        status: "UNKNOWN"
      });
    }
  }

  return responseData?.audioContent;
}
