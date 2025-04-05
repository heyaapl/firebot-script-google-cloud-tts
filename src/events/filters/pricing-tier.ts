import type { EventFilter } from "../../firebot-extensions";
import type { PricingBucket } from "../../types";

const pricingTierFilter: EventFilter<PricingBucket> = {
    id: "google-cloud-tts:pricing-tier",
    name: "Pricing Tier",
    description: "Filter by which pricing SKU a TTS effect utilized.",
    valueType: "preset",
    events: [
        { eventSourceId: "google-cloud-tts", eventId: "usage" }
    ],
    comparisonTypes: [
        "is",
        "is not"
    ],
    presetValues: () => [
        { value: "Studio", display: "Casual, News, or Studio" },
        { value: "Chirp", display: "Chirp HD" },
        { value: "Neural", display: "Neural2" },
        { value: "Polyglot", display: "Polyglot" },
        { value: "Standard", display: "Standard" },
        { value: "Wavenet", display: "WaveNet" },
        { value: "Unknown", display: "Unknown" }
    ],
    getSelectedValueDisplay: (filterSettings) => {
        switch (filterSettings.value as string) {
            case "Studio":
                return "Casual, News, or Studio";
            case "Journey":
            case "Chirp":
                return "Chirp HD";
            case "Neural":
                return "Neural2";
            case "Polyglot":
                return "Polyglot";
            case "Standard":
                return "Standard"
            case "Wavenet":
                return "WaveNet";
            case "Unknown":
                return "Unknown"
            default:
                break;
        }
        return null;
    },
    predicate: (filterSettings, eventData) => {
        const { comparisonType } = filterSettings;
        const { eventMeta } = eventData;
        const eventValue = eventMeta["bucket"];

        const backCompatValues = [
            // "Journey" was renamed to "Chirp 2" in 2025/Q1, the pricing SKU renamed to "Chirp 3: HD". Voices
            // were renamed ('en-US-Journey-D' to 'en-US-Chirp-HD-D'), and v3 was added ('en-US-Chirp3-HD-Charon').
            { prior: "Journey", current: "Chirp" },
        ];
        const value = backCompatValues.some(bcv => bcv.prior === filterSettings.value)
            ? backCompatValues.find(bcv => bcv.prior === filterSettings.value).current
            : filterSettings.value;

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

export default pricingTierFilter;
