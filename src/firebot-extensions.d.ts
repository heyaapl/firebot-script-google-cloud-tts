import type {
    ScriptModules as fbcstScriptModules
} from "@crowbartools/firebot-custom-scripts-types";
import type {
    Effects as fbcstEffects
} from "@crowbartools/firebot-custom-scripts-types/types/effects";


//
// Effect customizations:
//

/** An extended EffectType supporting default labels. */
export type EffectType<
    EffectModel,
    OverlayData = unknown,
    Outputs = Record<string, unknown>
> = fbcstEffects.EffectType<EffectModel, OverlayData, Outputs> & {
    getDefaultLabel?(
        effect: EffectModel,
        ...args: any[]
    ): string | undefined | Promise<string | undefined>;
};

/** An extended Firebot EffectManager. */
export type EffectManager = Omit<fbcstScriptModules["effectManager"], "registerEffect"> & {
    /** Registers an effect for Firebot to use.
     * @param effectType The definition of the effect type to register.
     */
    registerEffect<
        EffectModel = unknown,
        OverlayData = unknown,
        Outputs = Record<string, unknown>
    >(
        effectType: EffectType<EffectModel, OverlayData, Outputs>
    ): void;
};


//
// Filter customizations:
//

type FilterEventData = {
    eventSourceId: string;
    eventId: string;
    eventMeta?: Record<string, unknown>;
};
type FilterSettings<T = unknown> = {
    comparisonType: string;
    value?: T;
};
type PresetFilterValue<T = unknown> = {
    display: string;
    value: T;
};
type BaseEventFilter<T = unknown> = {
    id: string;
    name: string;
    description: string;
    events: Array<{
        eventSourceId: string;
        eventId: string;
    }>;
    comparisonTypes: Array<string>;
    /** The value type of the data that the filter operates upon. */
    valueType: (T extends number ? "number" : T extends string ? "string" : never);

    /** Returns a display label appropriate for the value of the provided filter settings.
     * @param filterSettings The filter's current settings.
     * @param args (optional) Auto-injectable Angular services.
     */
    getSelectedValueDisplay?(
        filterSettings: FilterSettings<T>,
        ...args: any[]
    ): string | Promise<string>;

    /** Returns a value indicating whether the filter settings match the provided event data.
     * @param filterSettings The settings stored by the user controlling the filter.
     * @param eventData The event to filter against.
     */
    predicate(
        filterSettings: FilterSettings<T>,
        eventData: FilterEventData
    ): boolean | Promise<boolean>;

    presetValues?: undefined;

    /** Returns a value indicating whether the filter settings data is still valid.
     * @param filterSettings The settings stored by the user controlling the filter.
     * @param args (optional) Auto-injectable Angular services.
     */
    valueIsStillValid?(
        filterSettings: FilterSettings<T>,
        ...args: any[]
    ): boolean | Promise<boolean>;
};
type BasePresetFilter<T = unknown> = Omit<BaseEventFilter<T>, "presetValues" | "valueType"> & {
    /** The value type that the filter operates upon, e.g. a preset list of values. */
    valueType: "preset";
    /** Returns an array of the selectable values and associated display label text. */
    presetValues(
        ...args: any[]
    ): Array<PresetFilterValue<T>> | Promise<Array<PresetFilterValue<T>>>;
};

/** A customized event filter definition with stronger typing. */
export type EventFilter<T = unknown> = BaseEventFilter<T> | BasePresetFilter<T>;

/** A customized Firebot EventFilterManager. */
export type EventFilterManager = {
    /** Register an extended filter with Firebot.
     * @param filter The expanded event filter to register.
     */
    registerFilter<T = unknown>(filter: EventFilter<T>): void;
};


//
// ScriptModules customizations:
//

/** Customized Firebot custom script modules. */
export type ScriptModules = fbcstScriptModules & {
    /** The extended Firebot EffectManager. */
    effectManager: EffectManager;
    /** The extended Firebot EventFilterManager. */
    eventFilterManager: EventFilterManager;
};
