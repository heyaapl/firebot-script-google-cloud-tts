import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import ttsUsageVariable from "./tts-usage";

export function registerGoogleTtsVariables(replaceVariableManager: ScriptModules["replaceVariableManager"]) {
    const ttsVariables = [
        ttsUsageVariable,
    ];

    for (const variable of ttsVariables) {
        replaceVariableManager.registerReplaceVariable(variable);
    }
}
