import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Contest from "../models/Contest.js";
import Scoreboard from "../models/Scoreboard.js";
import ContestSubmission from "../models/ContestSubmission.js";
import { startTestServer, stopTestServer, generateToken } from "./test_helpers.js";
import { computeContestStatus, syncContestStatuses } from "../services/contestStatus.service.js";

describe("Contest System Security and Authorization Fixes", () => {
  let baseUrl;
  let adminUser, regularUser;
  let adminToken, regularToken;
  let contestProblem, regularProblem;
  let upcomingContest, endedContest;

  before(async () => {
    const s = await startTestServer();
    baseUrl = s.baseUrl;

    const suffix = Date.now().toString().slice(-8);

    // Create admin user
    adminUser = await User.create({
      username: `adm_${suffix}`,
      email: `adm_${suffix}@example.com`,
      password: "password123",
      role: "admin",
      branch: "CSDS",
      graduationYear: "2026"
    });
    adminToken = generateToken({ id: adminUser._id.toString(), role: "admin" });

    // Create regular user
    regularUser = await User.create({
      username: `usr_${suffix}`,
      email: `usr_${suffix}@example.com`,
      password: "password123",
      role: "user",
      branch: "CSDS",
      graduationYear: "2026"
    });
    regularToken = generateToken({ id: regularUser._id.toString(), role: "user" });

    // Create regular practice problem
    regularProblem = await Problem.create({
      title: `Practice Prob ${suffix}`,
      description: "Practice problem description",
      difficulty: "easy",
      tags: ["array"],
      slug: `practice-prob-${suffix}`,
      createdBy: adminUser._id,
      isContestProblem: false,
      testCases: [
        { input: "1", output: "1", isSample: true },
        { input: "999", output: "999", isSample: false } // Hidden testcase!
      ]
    });

    // Create contest problem
    contestProblem = await Problem.create({
      title: `Contest Secret Prob ${suffix}`,
      description: "Contest problem description",
      difficulty: "medium",
      tags: ["dp"],
      slug: `contest-secret-prob-${suffix}`,
      createdBy: adminUser._id,
      isContestProblem: true,
      testCases: [
        { input: "2", output: "4", isSample: true },
        { input: "secret", output: "supersecret", isSample: false } // Hidden testcase!
      ]
    });

    // Create upcoming contest (starts in 2 hours)
    upcomingContest = await Contest.create({
      title: `Upcoming Contest ${suffix}`,
      slug: `upcoming-contest-${suffix}`,
      startTime: new Date(Date.now() + 2 * 3600 * 1000),
      endTime: new Date(Date.now() + 4 * 3600 * 1000),
      status: "upcoming",
      createdBy: adminUser._id,
      participants: [regularUser._id], // regular user is registered!
      problems: [
        {
          problemId: contestProblem._id,
          order: 1,
          points: 100
        }
      ]
    });

    // Link contest problem to upcoming contest
    contestProblem.contest = upcomingContest._id;
    await contestProblem.save();

    // Create ended contest (ended yesterday)
    endedContest = await Contest.create({
      title: `Ended Contest ${suffix}`,
      slug: `ended-contest-${suffix}`,
      startTime: new Date(Date.now() - 48 * 3600 * 1000),
      endTime: new Date(Date.now() - 24 * 3600 * 1000),
      status: "ended",
      createdBy: adminUser._id,
      participants: [],
      problems: []
    });
  });

  after(async () => {
    await User.deleteMany({ _id: { $in: [adminUser?._id, regularUser?._id].filter(Boolean) } });
    await Problem.deleteMany({ _id: { $in: [regularProblem?._id, contestProblem?._id].filter(Boolean) } });
    await Contest.deleteMany({ _id: { $in: [upcomingContest?._id, endedContest?._id].filter(Boolean) } });
    await stopTestServer();
  });

  test("1. GET /api/problems?admin=true without valid admin token does NOT leak contest problems", async () => {
    // Unauthenticated request passing ?admin=true
    const res = await fetch(`${baseUrl}/api/problems?admin=true`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const slugs = body.data.map(p => p.slug);
    assert.ok(!slugs.includes(contestProblem.slug), "Contest problem must NOT be visible to unauthenticated ?admin=true");
    assert.ok(slugs.includes(regularProblem.slug), "Regular practice problem must be visible");
  });

  test("2. GET /api/problems with valid admin token DOES return all problems for admin management", async () => {
    const res = await fetch(`${baseUrl}/api/problems?admin=true`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const slugs = body.data.map(p => p.slug);
    assert.ok(slugs.includes(contestProblem.slug), "Admin should be able to view contest problems in admin panel");
  });

  test("3. GET /api/problems/:slug hides secret test cases for non-admin callers", async () => {
    const res = await fetch(`${baseUrl}/api/problems/${regularProblem.slug}`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.testCases.length, 1, "Only sample testcase must be returned");
    assert.strictEqual(body.data.testCases[0].isSample, true);
    assert.strictEqual(body.data.testCases[0].input, "1");
  });

  test("4. GET /api/problems/:slug returns 403 when non-admin accesses an upcoming contest problem", async () => {
    const res = await fetch(`${baseUrl}/api/problems/${contestProblem.slug}`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.strictEqual(res.status, 403, "Upcoming contest problem must be forbidden before contest starts");
  });

  test("5. GET /api/contest/:slug masks problem slugs and titles before contest start time", async () => {
    const res = await fetch(`${baseUrl}/api/contest/${upcomingContest.slug}`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.contest.problems.length, 1);
    // Problem slug and title must be masked
    assert.strictEqual(body.contest.problems[0].problemId, null, "Problem ID/slug/title must not leak before contest start");
    assert.strictEqual(body.contest.problems[0].points, 100);
  });

  test("6. GET /api/contest/:slug/problems correctly authorizes registered participant (ObjectId vs String comparison)", async () => {
    // Temporarily make contest running to test participant authorization check
    const originalStartTime = upcomingContest.startTime;
    upcomingContest.startTime = new Date(Date.now() - 3600 * 1000);
    await upcomingContest.save();

    const res = await fetch(`${baseUrl}/api/contest/${upcomingContest.slug}/problems`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.strictEqual(res.status, 200, "Registered participant should be accepted with 200");
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.problems.length, 1);
    assert.strictEqual(body.problems[0].slug, contestProblem.slug);

    // Restore start time
    upcomingContest.startTime = originalStartTime;
    await upcomingContest.save();
  });

  test("7. POST /api/contest/:slug/join rejects joining an ended contest with 400", async () => {
    const res = await fetch(`${baseUrl}/api/contest/${endedContest.slug}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test("8. GET /api/contest/:slug dynamically returns and updates status to 'running' without calling /api/contest", async () => {
    const testSlug = `auto-running-${Date.now()}`;
    // Insert contest directly with status="upcoming", but startTime in the past
    const contestDoc = await Contest.create({
      title: `Auto Running Contest ${Date.now()}`,
      slug: testSlug,
      startTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      endTime: new Date(Date.now() + 50 * 60 * 1000),   // 50 minutes left
      status: "upcoming", // intentionally stale DB status
      createdBy: adminUser._id,
      participants: [regularUser._id],
      problems: []
    });

    try {
      // Call single contest endpoint directly (simulating bookmark or direct link)
      const res = await fetch(`${baseUrl}/api/contest/${testSlug}`, {
        headers: { Authorization: `Bearer ${regularToken}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.contest.status, "running", "Returned status must be dynamically resolved to 'running'");

      // Wait a moment for async DB update and check DB
      await new Promise((r) => setTimeout(r, 200));
      const freshDoc = await Contest.findById(contestDoc._id);
      assert.strictEqual(freshDoc.status, "running", "Database document must be updated to 'running'");
    } finally {
      await Contest.deleteOne({ _id: contestDoc._id });
    }
  });

  test("9. POST /api/contest/:slug/leave rejects leaving when start time has passed, even if DB status was 'upcoming'", async () => {
    const testSlug = `no-leave-${Date.now()}`;
    const contestDoc = await Contest.create({
      title: `No Leave Running Contest ${Date.now()}`,
      slug: testSlug,
      startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      endTime: new Date(Date.now() + 55 * 60 * 1000),
      status: "upcoming", // Stale DB status
      createdBy: adminUser._id,
      participants: [regularUser._id],
      problems: []
    });

    try {
      const res = await fetch(`${baseUrl}/api/contest/${testSlug}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${regularToken}` }
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.message, /only unregister from upcoming contests/i);
    } finally {
      await Contest.deleteOne({ _id: contestDoc._id });
    }
  });

  test("10. syncContestStatuses() background service successfully transitions upcoming -> running and running -> ended", async () => {
    const suffix = Date.now().toString().slice(-6);
    const pastStart = new Date(Date.now() - 15 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 45 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 5 * 60 * 1000);

    const c1 = await Contest.create({
      title: `Sync C1 ${suffix}`,
      slug: `sync-c1-${suffix}`,
      startTime: pastStart,
      endTime: futureEnd,
      status: "upcoming",
      createdBy: adminUser._id,
      participants: [],
      problems: []
    });

    const c2 = await Contest.create({
      title: `Sync C2 ${suffix}`,
      slug: `sync-c2-${suffix}`,
      startTime: new Date(Date.now() - 120 * 60 * 1000),
      endTime: pastEnd,
      status: "running",
      createdBy: adminUser._id,
      participants: [],
      problems: []
    });

    try {
      const result = await syncContestStatuses(new Date());
      assert.ok(result.updatedToRunning >= 1, "At least 1 contest transitioned to running");
      assert.ok(result.updatedToEnded >= 1, "At least 1 contest transitioned to ended");

      const freshC1 = await Contest.findById(c1._id);
      const freshC2 = await Contest.findById(c2._id);
      assert.strictEqual(freshC1.status, "running");
      assert.strictEqual(freshC2.status, "ended");
    } finally {
      await Contest.deleteMany({ _id: { $in: [c1._id, c2._id] } });
    }
  });
});
