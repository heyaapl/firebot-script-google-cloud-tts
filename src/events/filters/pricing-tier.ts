import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";

const pricingTierFilter: EventFilter = {
    id: "google-cloud-tts:pricing-tier",
    name: "Pricing Tier",
    description: "Filter by which pricing tier a TTS effect utilized.",
    valueType: "preset",
    events: [
        { eventSourceId: "google-cloud-tts", eventId: "usage" }
    ],
    presetValues: () => new Promise(resolve => resolve([
        { display: "Standard", value: "Standard" },
        { display: "WaveNet", value: "Wavenet" },
        { display: "Neural2", value: "Neural" },
        { display: "Polyglot", value: "Polyglot" },
        { display: "Journey", value: "Journey" },
        { display: "Casual, News, or Studio", value: "Studio" },
        { display: "Unknown", value: "Unknown" },
    ])),
    comparisonTypes: [
        "is",
        "is not"
    ],
    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;
        const eventValue = eventMeta["bucket"];

        switch (comparisonType) {
            case "is":
                return eventValue === value;
            case "is not":
                return eventValue !== value;
            default:
                break;
        }
        return false;
    }
};

export default pricingTierFilter as any as EventFilter;
