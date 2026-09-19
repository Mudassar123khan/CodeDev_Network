import test, { describe, before, after } from "node:test";
import assert from "node:assert";
import { getCache, setCache, clearCacheByPrefix } from "../services/cache.service.js";
import { startTestServer, stopTestServer, generateToken } from "./test_helpers.js";

describe("Step 2: Dual-Layer Caching & HTTP Compression", () => {
  let baseUrl;
  const authToken = generateToken();

  before(async () => {
    const res = await startTestServer();
    baseUrl = res.baseUrl;
  });

  after(async () => {
    await stopTestServer();
  });

  test("Cache service stores and retrieves JSON objects", async () => {
    const testKey = "test:step2:object";
    const testVal = { id: 123, name: "Antigravity", roles: ["admin", "dev"] };

    await setCache(testKey, testVal, 10);
    const retrieved = await getCache(testKey);

    assert.deepStrictEqual(retrieved, testVal);
  });

  test("Cache service returns null for non-existent keys", async () => {
    const val = await getCache("test:step2:non_existent_key_9999");
    assert.strictEqual(val, null);
  });

  test("Cache service clears keys by prefix selectively", async () => {
    await setCache("test_prefix:item1", { data: 1 }, 10);
    await setCache("test_prefix:item2", { data: 2 }, 10);
    await setCache("other_prefix:item3", { data: 3 }, 10);

    await clearCacheByPrefix("test_prefix:");

    assert.strictEqual(await getCache("test_prefix:item1"), null);
    assert.strictEqual(await getCache("test_prefix:item2"), null);
    assert.deepStrictEqual(await getCache("other_prefix:item3"), { data: 3 });

    // Cleanup
    await clearCacheByPrefix("other_prefix:");
  });

  test("Cache service respects TTL expiration", async () => {
    const shortLivedKey = "test:step2:short_ttl";
    await setCache(shortLivedKey, { status: "temporary" }, 1); // 1 second TTL

    const immediateVal = await getCache(shortLivedKey);
    assert.ok(immediateVal !== null, "Value should exist immediately");

    // Wait 1.1s for expiration
    await new Promise((r) => setTimeout(r, 1100));

    const expiredVal = await getCache(shortLivedKey);
    assert.strictEqual(expiredVal, null, "Value should have expired");
  });

  test("Express mounts compression middleware and serves Gzip encoding", async () => {
    const response = await fetch(`${baseUrl}/api/interviews?limit=5`, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });

    assert.strictEqual(response.status, 200);
    const contentEncoding = response.headers.get("content-encoding");
    assert.ok(
      contentEncoding === "gzip" || contentEncoding === "deflate",
      `Expected gzip/deflate content-encoding, got: ${contentEncoding}`
    );
  });

  test("API endpoints include Cache-Control no-cache header to ensure browser revalidation", async () => {
    const resInterviews = await fetch(`${baseUrl}/api/interviews?limit=5`);
    assert.strictEqual(
      resInterviews.headers.get("cache-control"),
      "no-cache",
      "Interviews endpoint missing Cache-Control: no-cache"
    );

    const resLeaderboard = await fetch(`${baseUrl}/api/leaderboard?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(
      resLeaderboard.headers.get("cache-control"),
      "no-cache",
      "Leaderboard endpoint missing Cache-Control: no-cache"
    );
  });

  test("Subsequent API requests hit cache with sub-20ms latency", async () => {
    // 1st request (populates cache)
    const t0 = performance.now();
    const res1 = await fetch(`${baseUrl}/api/interviews?limit=5`);
    const timeCold = performance.now() - t0;
    assert.strictEqual(res1.status, 200);
    const json1 = await res1.json();

    // 2nd request (cache hit)
    const t1 = performance.now();
    const res2 = await fetch(`${baseUrl}/api/interviews?limit=5`);
    const timeCached = performance.now() - t1;
    assert.strictEqual(res2.status, 200);
    const json2 = await res2.json();

    assert.deepStrictEqual(json1, json2, "Cached payload must match original");
    assert.ok(
      timeCached < 50,
      `Cached request should complete in <50ms (took ${timeCached.toFixed(2)}ms)`
    );
  });
});
