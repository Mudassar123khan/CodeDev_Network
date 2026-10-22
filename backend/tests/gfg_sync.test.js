import { test, describe } from "node:test";
import assert from "node:assert";
import dotenv from "dotenv";
import fetchGfgStats from "../services/platformSync/gfg.syncs.js";

dotenv.config();

describe("GFG Profile Stats Scraping", () => {
  test("fetchGfgStats returns null for null, empty or invalid handle input", async () => {
    const resNull = await fetchGfgStats(null);
    assert.strictEqual(resNull, null);

    const resEmpty = await fetchGfgStats("");
    assert.strictEqual(resEmpty, null);

    const resSpaces = await fetchGfgStats("   ");
    assert.strictEqual(resSpaces, null);
  });

  test("fetchGfgStats fetches profile stats for a valid GFG handle", async () => {
    const handle = "amanullahcgw1";
    const result = await fetchGfgStats(handle);

    assert.ok(result, "Result should not be null");
    assert.strictEqual(result.handle, handle);
    assert.strictEqual(typeof result.solvedCount, "number");
    assert.ok(result.solvedCount > 0, `Expected solvedCount > 0, got ${result.solvedCount}`);
    assert.strictEqual(typeof result.rating, "number");
    assert.ok(result.lastSynced instanceof Date);
  });

  test("fetchGfgStats trims whitespace from handles", async () => {
    const handle = "  amanullahcgw1  ";
    const result = await fetchGfgStats(handle);

    assert.ok(result, "Result should not be null");
    assert.strictEqual(result.handle, "amanullahcgw1");
    assert.ok(result.solvedCount > 0);
  });

  test("fetchGfgStats handles non-existent user gracefully without crashing", async () => {
    const result = await fetchGfgStats("non_existent_gfg_user_xyz987654321");
    assert.ok(result, "Result should not be null");
    assert.strictEqual(result.solvedCount, 0);
  });
});
