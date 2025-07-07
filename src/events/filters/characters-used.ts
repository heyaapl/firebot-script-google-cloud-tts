import type { EventFilter } from "../../firebot-extensions";

const charactersUsedFilter: EventFilter<number> = {
    id: "google-cloud-tts:cost",
    name: "Characters Used",
    description: "Filter by the number of characters or bytes used by the TTS effect.",
    valueType: "number",
    events: [{ eventSourceId: "google-cloud-tts", eventId: "usage" }],
    comparisonTypes: [
        "is",
        "is not",
        "less than",
        "less than or equal to",
        "greater than",
        "greater than or equal to"
    ],
    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;
        let eventValue = "cost" in eventMeta ? Number(eventMeta["cost"]) : 0;
        if (Number.isNaN(eventValue) || !Number.isFinite(eventValue)) {
            eventValue = 0;
        }

        switch (comparisonType) {
            case "is":
                return eventValue === value;
            case "is not":
                return eventValue !== value;
            case "less than":
                return eventValue < value;
            case "less than or equal to":
                return eventValue <= value;
            case "greater than":
                return eventValue > value;
            case "greater than or equal to":
                return eventValue >= value;
            default:
                break;
        }
        return false;
    }
};

export default charactersUsedFilter;
