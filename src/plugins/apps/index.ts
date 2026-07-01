import type { AppPlugin } from "../types.js";

import { zedPlugin } from "./zed.js";
import { ghosttyPlugin } from "./ghostty.js";
import { vscodePlugin } from "./vscode.js";
import { chromePlugin } from "./chrome.js";
import { openchamberPlugin } from "./openchamber.js";

export { zedPlugin, ghosttyPlugin, vscodePlugin, chromePlugin, openchamberPlugin };

export const internalRegistry: Record<string, AppPlugin> = {
  zed: zedPlugin,
  ghostty: ghosttyPlugin,
  vscode: vscodePlugin,
  chrome: chromePlugin,
  openchamber: openchamberPlugin,
};
