import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";

const googleTtsEventSource: EventSource = {
    id: "google-cloud-tts",
    name: "Google Cloud Text-to-Speech",
    events: [{
        id: "usage",
        name: "TTS Usage",
        description: "Occurs when the Google Cloud Text-to-Speech effect is used.",
        manualMetadata: {
            bucket: {
                type: "enum",
                options: {
                    Standard: "Standard",
                    Wavenet: "WaveNet",
                    Neural: "Neural2",
                    Polyglot: "Polyglot",
                    Journey: "Journey",
                    Studio: "Casual, News, or Studio",
                    Unknown: "Unknown"
                },
                value: "Journey"
            },
            cost: 75
        }
    }]
};

export default googleTtsEventSource;
