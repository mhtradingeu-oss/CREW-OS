#!/usr/bin/env node
/*
 * Lightweight backend health harness.
 * Starts the backend via ts-node and probes key API endpoints.
 */

const { spawn } = require("child_process");
const { setTimeout: delay } = require("timers/promises");
const fs = require("node:fs");
const path = require("node:path");

const port = process.env.PORT || "4000";
const baseUrl = `http://localhost:${port}`;
const authToken = process.env.BACKEND_HEALTH_TOKEN;
const rootDir = path.resolve(__dirname, "..");
const distServerPath = path.join(rootDir, "apps/back-end/dist/server.js");

const endpoints = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/api/v1/ai/monitoring/engine-health" },
  { method: "GET", path: "/api/v1/ai/monitoring/token-usage" },
  { method: "GET", path: "/api/v1/ai/safety/firewall" },
  { method: "GET", path: "/api/v1/ai/safety/safety-rules" },
  { method: "GET", path: "/api/v1/ai/safety/banned-actions" },
  { method: "POST", path: "/api/v1/ai/safety/test-prompt", body: { prompt: "health check" } },
];

function startServer() {
  const useDist = fs.existsSync(distServerPath);
  const args = useDist
    ? ["--experimental-specifier-resolution=node", distServerPath]
    : [
        "--loader",
        "ts-node/esm",
        "--experimental-specifier-resolution=node",
        "apps/back-end/src/server.ts",
      ];

  const child = spawn("node", args, {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => process.stdout.write(`[backend] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[backend:err] ${data}`));
  return child;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return true;
    } catch (err) {
      // ignore retryable errors
    }
    await delay(500);
  }
  return false;
}

async function hitEndpoint(endpoint) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${baseUrl}${endpoint.path}`, {
    method: endpoint.method,
    headers,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text();
  }

  const ok = res.status < 500 && res.status !== 404;
  return {
    ...endpoint,
    status: res.status,
    ok,
    payload,
  };
}

(async () => {
  const server = startServer();

  const ready = await waitForServer();
  if (!ready) {
    console.error(`Backend did not become ready on ${baseUrl}`);
    server.kill("SIGINT");
    process.exit(1);
  }

  const results = [];
  for (const endpoint of endpoints) {
    try {
      const result = await hitEndpoint(endpoint);
      results.push(result);
    } catch (err) {
      results.push({ ...endpoint, status: 0, ok: false, payload: String(err) });
    }
  }

  server.kill("SIGINT");
  await delay(300);

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nBackend health summary (${passed}/${results.length} ok):`);
  results.forEach((r) => {
    console.log(
      `  [${r.ok ? "OK" : "FAIL"}] ${r.method} ${r.path} -> ${r.status} ${
        typeof r.payload === "string" ? r.payload.slice(0, 120) : JSON.stringify(r.payload).slice(0, 120)
      }`,
    );
  });

  if (failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
})();
