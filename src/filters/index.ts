import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import costFilter from "./cost";
import pricingBucketFilter from "./pricing-bucket";

export function registerTtsEventFilters(eventFilterManager: ScriptModules["eventFilterManager"]) {
    const ttsEventFilters = [
        costFilter,
        pricingBucketFilter,
    ];

    for (const filter of ttsEventFilters) {
        eventFilterManager.registerFilter(filter);
    }
}
