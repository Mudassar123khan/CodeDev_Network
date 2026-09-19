import test, { describe, before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import ExternalStats from "../models/ExternalStats.js";
import InterviewExperience from "../models/InterviewExperience.js";
import { startTestServer, stopTestServer, generateToken } from "./test_helpers.js";

describe("Step 1: Database Indexes, Query Projections & Pagination", () => {
  let baseUrl;
  const authToken = generateToken();

  before(async () => {
    const res = await startTestServer();
    baseUrl = res.baseUrl;
  });

  after(async () => {
    await stopTestServer();
  });

  test("ExternalStats model defines indexes for all platform scores", () => {
    const indexes = ExternalStats.schema.indexes();
    const indexFields = indexes.map(([fieldSpec]) => Object.keys(fieldSpec)[0]);

    assert.ok(
      indexFields.includes("platformScores.leetcode"),
      "Missing index on platformScores.leetcode"
    );
    assert.ok(
      indexFields.includes("platformScores.codeforces"),
      "Missing index on platformScores.codeforces"
    );
    assert.ok(
      indexFields.includes("platformScores.codechef"),
      "Missing index on platformScores.codechef"
    );
    assert.ok(
      indexFields.includes("platformScores.gfg"),
      "Missing index on platformScores.gfg"
    );
  });

  test("InterviewExperience model defines indexes for sorting, filtering, and text search", () => {
    const indexes = InterviewExperience.schema.indexes();
    const indexKeys = indexes.map(([fieldSpec]) => JSON.stringify(fieldSpec));

    assert.ok(
      indexKeys.some((k) => k.includes("createdAt")),
      "Missing index on createdAt"
    );
    assert.ok(
      indexKeys.some((k) => k.includes("feedback.outcome")),
      "Missing index on feedback.outcome"
    );
    assert.ok(
      indexKeys.some((k) => k.includes("rounds.difficulty")),
      "Missing index on rounds.difficulty"
    );
    assert.ok(
      indexKeys.some((k) => k.includes("text")),
      "Missing compound text index"
    );
  });

  test("Leaderboard API returns ranked list with pagination metadata and correct sort", async () => {
    const response = await fetch(`${baseUrl}/api/leaderboard?platform=leetcode&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(response.status, 200);
    const json = await response.json();

    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data), "data must be an array");
    assert.ok(json.pagination, "pagination metadata must be present");
    assert.strictEqual(json.pagination.page, 1);
    assert.strictEqual(json.pagination.limit, 5);
    assert.ok(json.pagination.totalUsers >= 0);

    if (json.data.length > 0) {
      // Verify rank sequence
      assert.strictEqual(json.data[0].rank, 1);

      // Verify descending sort order
      for (let i = 0; i < json.data.length - 1; i++) {
        const scoreA = json.data[i].platformScores?.leetcode || 0;
        const scoreB = json.data[i + 1].platformScores?.leetcode || 0;
        assert.ok(
          scoreA >= scoreB,
          `Sort order violation: item ${i} (${scoreA}) < item ${i + 1} (${scoreB})`
        );
      }
    }
  });

  test("Interview Experiences API projects card fields and strips heavy text", async () => {
    const response = await fetch(`${baseUrl}/api/interviews?page=1&limit=5`);

    assert.strictEqual(response.status, 200);
    const json = await response.json();

    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data), "data must be an array");
    assert.ok(json.totalCount !== undefined, "totalCount must be present");
    assert.strictEqual(json.currentPage, 1);
    assert.strictEqual(json.limit, 5);

    if (json.data.length > 0) {
      const card = json.data[0];

      // Required summary fields must exist
      assert.ok(card._id, "Card _id is missing");
      assert.ok(card.companyDetails?.companyName, "Company name is missing");
      assert.ok(card.feedback?.outcome, "Outcome badge is missing");
      assert.ok(card.createdAt, "createdAt is missing");

      // Rounds should contain difficulty for the difficulty badge
      if (card.rounds && card.rounds.length > 0) {
        assert.ok(card.rounds[0].difficulty, "rounds.difficulty is missing");

        // HEAVY FIELDS MUST NOT BE PRESENT (bandwidth optimization verification)
        assert.strictEqual(
          card.rounds[0].summary,
          undefined,
          "rounds.summary should be excluded in list projection"
        );
      }

      assert.strictEqual(
        card.feedback.prepTips,
        undefined,
        "feedback.prepTips should be excluded in list projection"
      );
      assert.strictEqual(
        card.feedback.salaryRange,
        undefined,
        "feedback.salaryRange should be excluded in list projection"
      );
    }
  });
});
