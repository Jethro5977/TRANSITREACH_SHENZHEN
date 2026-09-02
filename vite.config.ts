import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

/**
 * Where the OpenTripPlanner routing service lives, read from `public/_redirects`.
 *
 * That file is the single source of truth: Netlify uses it to proxy `/otp/*` in
 * production, and the dev server below proxies the same path to the same target. Keeping
 * one address means dev and production exercise the same route, so "it works locally" is
 * evidence that it works deployed — which was not true when dev called the engine
 * directly and production went through a proxy.
 *
 * To point at a different engine — the AWS fallback, or one running locally — change the
 * address in `public/_redirects`. Both environments follow.
 */
function otpTarget(): string {
  const redirects = readFileSync(
    fileURLToPath(new URL('./public/_redirects', import.meta.url)),
    'utf8',
  );
  const match = redirects.match(/^\s*\/otp\/\*\s+(\S+?)\/otp\/:splat\s+200/m);
  if (!match) {
    throw new Error(
      'No /otp/* proxy rule found in public/_redirects. The dev server and Netlify both ' +
      'rely on it to reach the routing engine; see routing/deploy/NETLIFY.md.',
    );
  }
  return match[1];
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Mirrors the Netlify rule, so the app calls /otp/... in both environments.
      '/otp': {
        target: otpTarget(),
        changeOrigin: true,
        // No connection pooling. The routing engine closes idle sockets, and a pooled
        // socket reused after that surfaces as ECONNRESET — the request then hangs for
        // the full timeout instead of retrying, so the first call after a pause appears
        // to freeze. A fresh connection per request costs a few milliseconds and removes
        // the failure entirely.
        agent: false,
        // Fail in seconds rather than hanging, if the engine is unreachable.
        timeout: 30_000,
        proxyTimeout: 30_000,
      },
    },
  },
});
