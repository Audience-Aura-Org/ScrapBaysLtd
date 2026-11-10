#!/usr/bin/env node
/**
 * Runs `next build` / `next start` with NODE_ENV forced to "production".
 *
 * Hostinger's Node.js hosting injects a non-production NODE_ENV (e.g. "development").
 * `next build` under a non-standard NODE_ENV mixes dev and prod React builds and fails
 * while prerendering /404 with: "<Html> should not be imported outside of pages/_document".
 *
 * Usage: node scripts/next-prod.mjs build|start [...next args]
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!["build", "start"].includes(command)) {
  console.error("Usage: node scripts/next-prod.mjs <build|start> [...args]");
  process.exit(1);
}

if (process.env.NODE_ENV && process.env.NODE_ENV !== "production") {
  console.log(`[next-prod] NODE_ENV was "${process.env.NODE_ENV}", forcing "production"`);
}
const env = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };

if (command === "start" && process.env.PORT && !args.includes("-p") && !args.includes("--port")) {
  args.push("-p", process.env.PORT);
}

const nextBin = require.resolve("next/dist/bin/next");
let child;
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child?.kill(sig));
const run = () =>
  new Promise((resolve) => {
    child = spawn(process.execPath, [nextBin, command, ...args], { stdio: "inherit", env });
    child.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });

let code = await run();
// A .next folder left behind by an earlier failed/interrupted build can make the next build
// fail with "Invariant: no direct app page entry found for /_not-found". Retry once clean.
if (command === "build" && code !== 0) {
  console.log("[next-prod] build failed; retrying once with a clean .next directory");
  fs.rmSync(".next", { recursive: true, force: true });
  code = await run();
}
process.exit(code);
