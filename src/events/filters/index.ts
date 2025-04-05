import type { EventFilter, ScriptModules } from "../../firebot-extensions";
import charactersUsedFilter from "./characters-used";
import pricingTierFilter from "./pricing-tier";

export function registerGoogleTtsEventFilters(eventFilterManager: ScriptModules["eventFilterManager"]) {
    const ttsEventFilters = [
        charactersUsedFilter,
        pricingTierFilter,
    ];

    for (const filter of ttsEventFilters) {
        eventFilterManager.registerFilter(filter as EventFilter);
    }
}
