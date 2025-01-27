import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import costFilter from "./cost";
import pricingTierFilter from "./pricing-tier";

export function registerGoogleTtsEventFilters(eventFilterManager: ScriptModules["eventFilterManager"]) {
    const ttsEventFilters = [
        costFilter,
        pricingTierFilter,
    ];

    for (const filter of ttsEventFilters) {
        eventFilterManager.registerFilter(filter);
    }
}
