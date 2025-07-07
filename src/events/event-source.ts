import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";

const googleTtsEventSource: EventSource = {
    id: "google-cloud-tts",
    name: "Google Cloud TTS",
    events: [{
        id: "usage",
        name: "TTS Usage",
        description: "Occurs when a Google Cloud Text-to-Speech effect is used.",
        manualMetadata: {
            bucket: {
                type: "enum",
                options: {
                    Standard: "Standard",
                    Wavenet: "WaveNet",
                    Neural: "Neural2",
                    Polyglot: "Polyglot",
                    Chirp: "Chirp 3: HD",
                    Studio: "Casual, News, or Studio",
                    Unknown: "Unknown"
                },
                value: "Chirp"
            },
            cost: 75
        }
    }]
};

export default googleTtsEventSource;
