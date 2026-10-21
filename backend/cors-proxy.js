/**
 * cors-proxy.js — Development-only CORS proxy for Expo web.
 *
 * Problem: The backend at caregames.mk-ultra.tech does not include
 * `Authorization` in Access-Control-Allow-Headers, which causes the browser
 * to block every pre-flighted request from localhost:8081.
 *
 * Solution: This proxy runs on localhost:8090 and sits between the browser
 * and the real API. Requests between local ports are still cross-origin.
 * The proxy handles preflight and forwards API requests to the
 * real backend and pipes the response back, injecting permissive CORS headers.
 *
 * Usage:
 *   node backend/cors-proxy.js
 *
 * The API client uses http://localhost:8090/api/v1
 * automatically when running in dev + web mode (see services/api.ts).
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 8090;
const TARGET_BASE = 'https://caregames.mk-ultra.tech';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Accept, X-Requested-With, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

const server = http.createServer((req, res) => {
  // Handle pre-flight immediately — never forward OPTIONS to the real server.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const parsed = url.parse(TARGET_BASE);
  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: parsed.hostname },
  };

  // Remove hop-by-hop headers that must not be forwarded.
  delete options.headers['connection'];
  delete options.headers['keep-alive'];

  const proxyReq = https.request(options, (proxyRes) => {
    // Node normalizes upstream header names to lowercase. Remove upstream CORS
    // headers first: spreading differently cased keys would send duplicates.
    const upstreamHeaders = Object.fromEntries(
      Object.entries(proxyRes.headers).filter(
        ([name]) => !name.toLowerCase().startsWith('access-control-')
      )
    );
    const responseHeaders = {
      ...upstreamHeaders,
      ...CORS_HEADERS,
    };
    // Remove hop-by-hop headers from the upstream response.
    delete responseHeaders['transfer-encoding'];

    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy] Upstream error:', err.message);
    res.writeHead(502, CORS_HEADERS);
    res.end(JSON.stringify({ success: false, error: { message: 'Proxy upstream error' } }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`\n✅  CORS proxy running on http://localhost:${PROXY_PORT}`);
  console.log(`    Forwarding to: ${TARGET_BASE}\n`);
});
