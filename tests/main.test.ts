import { RunRequest } from "@crowbartools/firebot-custom-scripts-types";
import customScript from "../src/main";

test("main default export is the custom script", () => {
  expect(customScript).not.toBeUndefined();
  expect(customScript.run).not.toBeUndefined();
  expect(customScript.getScriptManifest).not.toBeUndefined();
  expect(customScript.getDefaultParameters).not.toBeUndefined();
});

test("run() calls logger.info with the message", async () => {
  const logger = {
    debug: jest.fn<void, any[]>(),
    info: jest.fn<void, any[]>(),
    warn: jest.fn<void, any[]>(),
    error: jest.fn<void, any[]>()
  };

  const expectedMessage = "foobar";
  const runRequest = ({
    parameters: { testMessage: expectedMessage },
    modules: { logger: logger },
  } as unknown) as RunRequest<any>;

  await customScript.run(runRequest);

  expect(logger.info.mock.calls.length).toBeGreaterThanOrEqual(1);
  expect(logger.info.mock.calls[0][0]).toBe(expectedMessage);
});
