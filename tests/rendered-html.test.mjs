import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the finished sales page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Lead Leak Fix Pack/);
  assert.match(html, /Where are the leads\?/);
  assert.match(html, /Get the \$100 fix pack/);
  assert.match(html, /https:\/\/buy\.stripe\.com\/fZucN7chm3Lgca3g2zenS10/);
  assert.match(html, /View a sample report/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("ships the proof sample and removes disposable preview files", async () => {
  const sample = await readFile(new URL("../public/sample-report.html", import.meta.url), "utf8");
  assert.match(sample, /FICTIONAL BUSINESS/);
  assert.match(sample, /Replacement hero copy/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
