import { ScriptModules } from "firebot-custom-scripts-types";
export let logger: ScriptModules["logger"] = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export function initLogger(newLogger: ScriptModules["logger"]) {
  logger = newLogger;
}
