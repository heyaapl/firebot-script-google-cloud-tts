import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import googleTtsEventSource from "./event-source";
import { registerGoogleTtsEventFilters } from "./filters";

export function registerGoogleTtsEvents(
    eventManager: ScriptModules["eventManager"],
    eventFilterManager: ScriptModules["eventFilterManager"],
) {
    eventManager.registerEventSource(googleTtsEventSource);
    registerGoogleTtsEventFilters(eventFilterManager);
}
