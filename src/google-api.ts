import axios from "axios";

interface SynthesizeTextResponse {
  audioContent: string;
}

export async function getTTSAudioContent(text: string): Promise<string | null> {
  const googleApiKey = "AIzaSyCWbRF5-5eORTdoi0rndoe3ExBjzJRseKU";
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`;

  const response = await axios.post<SynthesizeTextResponse>(url, {
    input: {
      text: text,
    },
    voice: {
      languageCode: "en-US",
      name: "en-US-Wavenet-C",
      ssmlGender: "FEMALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  });

  return response?.data?.audioContent;
}
