/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the OpenTripPlanner instance, with no trailing slash.
   * Defaults to http://localhost:8080 when unset. See routing/README.md.
   */
  readonly VITE_OTP_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
