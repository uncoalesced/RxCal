import type { Plugin } from 'vite';

/**
 * Content Security Policy for the built site. This is what makes RxCal's
 * privacy promise enforceable: the page may only talk to its own origin, so
 * prescription data has nowhere else to go. Model/WASM assets added later
 * (Tesseract, ONNX) must be self-hosted to work under this policy.
 */
const CSP_DIRECTIVES: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'wasm-unsafe-eval'",
  'worker-src': "'self' blob:",
  'connect-src': "'self'",
  'img-src': "'self' blob: data:",
  'style-src': "'self'",
  'font-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'none'",
};

/** Directives only honoured when sent as an HTTP header, not in a <meta> tag. */
const HEADER_ONLY_DIRECTIVES: Record<string, string> = {
  'frame-ancestors': "'none'",
};

const serialize = (directives: Record<string, string>) =>
  Object.entries(directives)
    .map(([name, value]) => `${name} ${value}`)
    .join('; ');

/**
 * Build-only plugin that
 *  - injects the CSP as a <meta> tag, so it applies on any static host and in `vite preview`;
 *  - emits a Cloudflare Pages `_headers` file with the full policy plus hardening headers.
 * It is skipped in dev, where Vite's HMR needs inline scripts and a websocket.
 */
export function securityHeaders(): Plugin {
  return {
    name: 'rxcal-security-headers',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: serialize(CSP_DIRECTIVES) },
          injectTo: 'head-prepend',
        },
      ];
    },
    generateBundle() {
      const csp = serialize({ ...CSP_DIRECTIVES, ...HEADER_ONLY_DIRECTIVES });
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: [
          '/*',
          `  Content-Security-Policy: ${csp}`,
          '  Referrer-Policy: no-referrer',
          '  X-Content-Type-Options: nosniff',
          '  Cross-Origin-Opener-Policy: same-origin',
          '  Permissions-Policy: camera=(self), microphone=(), geolocation=()',
          '',
        ].join('\n'),
      });
    },
  };
}
