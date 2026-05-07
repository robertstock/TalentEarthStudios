const truthyValues = new Set(["1", "true", "yes", "on"]);

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return truthyValues.has(value.toLowerCase());
}

export const appEnv = {
  isProduction: process.env.NODE_ENV === "production",
  demoMode: readBoolean(process.env.NEXT_PUBLIC_DEMO_MODE, false),
  allowDemoCredentials: readBoolean(process.env.ALLOW_DEMO_CREDENTIALS, false),
};

export function isDemoModeEnabled() {
  return appEnv.demoMode;
}

export function areDemoCredentialsEnabled() {
  return appEnv.demoMode && appEnv.allowDemoCredentials;
}
