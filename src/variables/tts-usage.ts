import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";

const ttsUsageVariable: ReplaceVariable = {
    definition: {
        handle: "googleTtsUsage",
        description: "Gets an object with information about Google Text-to-Speech service usage. Properties include `cost` with the number of characters or bytes expended in the pricing bucket, and `tier` with the name of the pricing bucket.",
        examples: [
            {
                usage: "googleTtsUsage[cost]",
                description: "Returns the number of characters or bytes that were synthesized."
            },
            {
                usage: "googleTtsUsage[tier]",
                description: "Returns the name of which of the pricing buckets incurred the usage."
            }
        ],
        triggers: {
            event: ["google-cloud-tts:usage"],
            manual: true
        },
        categories: ["trigger based"],
        possibleDataOutput: ["number", "object", "text"]
    },
    evaluator: (trigger, ...args: unknown[]) => {
        if (args.length > 0 && args[0]) {
            const argZero = `${args[0]}`.toLowerCase();
            if (argZero === "cost") {
                return trigger.metadata?.eventData?.cost ?? trigger.metadata?.cost ?? 0;
            }
            if (argZero === "tier") {
                return trigger.metadata?.eventData?.bucket ?? trigger.metadata?.bucket ?? "unknown";
            }
        }
        return {
            cost: trigger.metadata?.eventData?.cost ?? trigger.metadata?.cost ?? 0,
            tier: trigger.metadata?.eventData?.bucket ?? trigger.metadata?.bucket ?? "unknown"
        };
    }
};

export default ttsUsageVariable;
