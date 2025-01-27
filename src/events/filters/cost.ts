import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";

// EventFilter is lacking in FBCST
type NumberFilter = Omit<EventFilter, "presetValues" | "valueType"> & {
    valueType: "number";
};

const costFilter: NumberFilter = {
    id: "google-cloud-tts:cost",
    name: "Cost",
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
        const eventValue = eventMeta["cost"] ?? 0;

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

export default costFilter as any as EventFilter;
