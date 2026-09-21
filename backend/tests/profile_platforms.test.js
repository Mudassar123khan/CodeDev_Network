import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import User from "../models/User.js";
import ExternalStats from "../models/ExternalStats.js";
import { startTestServer, stopTestServer, generateToken } from "./test_helpers.js";

describe("Profile Platform Handles Management", () => {
  let baseUrl;
  let testUser;
  let authToken;

  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;

    // Create unique test user
    const uniqueSuffix = Date.now().toString().slice(-8);
    testUser = await User.create({
      username: `usr_${uniqueSuffix}`,
      email: `t_${uniqueSuffix}@example.com`,
      password: "hashedPassword123",
      branch: "CSDS",
      graduationYear: "2026",
      platforms: {
        codeforces: "initial_cf",
        leetcode: "initial_lc",
        codechef: "initial_cc",
        gfg: "initial_gfg"
      }
    });

    authToken = generateToken({ id: testUser._id.toString(), role: "user" });
  });

  after(async () => {
    if (testUser?._id) {
      await User.deleteOne({ _id: testUser._id });
      await ExternalStats.deleteOne({ userId: testUser._id });
    }
    await stopTestServer();
  });

  test("PUT /api/getProfile/platforms rejects requests without token with 401", async () => {
    const res = await fetch(`${baseUrl}/api/getProfile/platforms`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms: { leetcode: "new_lc" } })
    });
    assert.strictEqual(res.status, 401);
  });

  test("PUT /api/getProfile/platforms updates user platforms and trims whitespace", async () => {
    const res = await fetch(`${baseUrl}/api/getProfile/platforms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        platforms: {
          leetcode: "  updated_lc  ",
          codeforces: "updated_cf",
          codechef: "updated_cc",
          gfg: "updated_gfg"
        }
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.platforms.leetcode, "updated_lc");
    assert.strictEqual(body.platforms.codeforces, "updated_cf");
    assert.strictEqual(body.platforms.codechef, "updated_cc");
    assert.strictEqual(body.platforms.gfg, "updated_gfg");

    // Verify persisted in DB
    const dbUser = await User.findById(testUser._id);
    assert.strictEqual(dbUser.platforms.leetcode, "updated_lc");
    assert.strictEqual(dbUser.platforms.codeforces, "updated_cf");
    assert.strictEqual(dbUser.platforms.codechef, "updated_cc");
    assert.strictEqual(dbUser.platforms.gfg, "updated_gfg");
  });

  test("GET /api/getProfile/:username returns userPlatforms and structured data", async () => {
    const res = await fetch(`${baseUrl}/api/getProfile/${testUser.username}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.basic);
    assert.strictEqual(body.data.basic.username, testUser.username);
    assert.ok(body.data.userPlatforms);
    assert.strictEqual(body.data.userPlatforms.leetcode, "updated_lc");
    assert.strictEqual(body.data.userPlatforms.codeforces, "updated_cf");
    assert.strictEqual(body.data.userPlatforms.codechef, "updated_cc");
    assert.strictEqual(body.data.userPlatforms.gfg, "updated_gfg");
  });

  test("PUT /api/profile/platforms alias endpoint works identically", async () => {
    const res = await fetch(`${baseUrl}/api/profile/platforms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        platforms: {
          leetcode: "alias_lc",
          codeforces: "alias_cf",
          codechef: "alias_cc",
          gfg: "alias_gfg"
        }
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.platforms.leetcode, "alias_lc");
  });
});
