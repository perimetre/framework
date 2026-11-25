import { GlobalRegistrator } from '@happy-dom/global-registrator';

declare global {
  var __UI_SDK_STRICT__: boolean | undefined;
}

GlobalRegistrator.register();

// Development warnings from UI SDK fail the test.
globalThis.__UI_SDK_STRICT__ = true;
