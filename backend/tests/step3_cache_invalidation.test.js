import test, { describe, before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import InterviewExperience from "../models/InterviewExperience.js";
import { getCache, setCache, clearCacheByPrefix } from "../services/cache.service.js";
import { startTestServer, stopTestServer, generateToken } from "./test_helpers.js";

describe("Step 3: Cache Invalidation & Consistency (Admin Delete & Updates)", () => {
  let baseUrl;
  const adminToken = generateToken({ role: "admin" });
  const userToken = generateToken({ role: "user" });

  before(async () => {
    const res = await startTestServer();
    baseUrl = res.baseUrl;
  });

  after(async () => {
    await stopTestServer();
  });

  test("Deleting an interview via Admin Panel invalidates cache and removes item from list immediately", async () => {
    // 1. Create a temporary interview experience directly in DB
    const testDoc = await InterviewExperience.create({
      user: new mongoose.Types.ObjectId("6a5228ab9e5b3bdd2ecfb514"),
      personalInfo: {
        name: "DeleteBugVerification",
        email: "deletebug@test.com",
        linkedin: "https://linkedin.com/in/deletebug",
      },
      companyDetails: {
        companyName: "BugFreeTech",
        role: "QA Engineer",
        location: "Remote",
        experienceLevel: "Mid",
      },
      rounds: [
        {
          roundName: "Technical Round",
          roundType: "Technical",
          difficulty: "Medium",
          mode: "remote",
          duration: "45m",
          summary: "Tested caching invalidation",
        },
      ],
      feedback: {
        outcome: "cleared",
      },
    });

    const docId = testDoc._id.toString();

    // 2. Clear cache first, then fetch list so it gets populated in cache
    await clearCacheByPrefix("interviews:");
    const listRes1 = await fetch(`${baseUrl}/api/interviews`);
    const listJson1 = await listRes1.json();
    const foundBefore = listJson1.data.some((item) => item._id === docId);
    assert.strictEqual(foundBefore, true, "Created interview must appear in list before deletion");

    // 3. Perform admin deletion (simulates clicking delete in Admin panel)
    const delRes = await fetch(`${baseUrl}/api/admin/interviews/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delRes.status, 200);
    const delJson = await delRes.json();
    assert.strictEqual(delJson.success, true);

    // 4. Fetch list again: MUST NOT contain deleted item (proves cache was invalidated!)
    const listRes2 = await fetch(`${baseUrl}/api/interviews`);
    const listJson2 = await listRes2.json();
    const foundAfter = listJson2.data.some((item) => item._id === docId);
    assert.strictEqual(
      foundAfter,
      false,
      "Deleted interview MUST NOT appear in list after admin deletion (Cache Invalidation Failure!)"
    );

    // 5. Trying to access deleted interview detail directly returns 404
    const detailRes = await fetch(`${baseUrl}/api/interviews/${docId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(detailRes.status, 404, "Accessing deleted interview must return 404");
  });

  test("Updating outcome via Admin Panel invalidates cache and updates list immediately", async () => {
    // 1. Create a test interview with outcome 'waiting'
    const testDoc = await InterviewExperience.create({
      user: new mongoose.Types.ObjectId("6a5228ab9e5b3bdd2ecfb514"),
      personalInfo: {
        name: "OutcomeUpdateTest",
        email: "outcome@test.com",
        linkedin: "https://linkedin.com/in/outcome",
      },
      companyDetails: {
        companyName: "OutcomeCo",
        role: "Developer",
        location: "Onsite",
        experienceLevel: "Fresher",
      },
      rounds: [
        {
          roundName: "HR",
          roundType: "HR",
          difficulty: "Easy",
          mode: "onsite",
          duration: "30m",
          summary: "Outcome test round",
        },
      ],
      feedback: {
        outcome: "waiting",
      },
    });

    const docId = testDoc._id.toString();

    // 2. Fetch list so outcome is cached as 'waiting'
    await clearCacheByPrefix("interviews:");
    const listRes1 = await fetch(`${baseUrl}/api/interviews`);
    const listJson1 = await listRes1.json();
    const itemBefore = listJson1.data.find((item) => item._id === docId);
    assert.strictEqual(itemBefore?.feedback?.outcome, "waiting");

    // 3. Update outcome to 'cleared' via Admin Panel endpoint
    const patchRes = await fetch(`${baseUrl}/api/admin/interviews/${docId}/outcome`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outcome: "cleared" }),
    });
    assert.strictEqual(patchRes.status, 200);

    // 4. Fetch list again: outcome must immediately be 'cleared'
    const listRes2 = await fetch(`${baseUrl}/api/interviews`);
    const listJson2 = await listRes2.json();
    const itemAfter = listJson2.data.find((item) => item._id === docId);
    assert.strictEqual(
      itemAfter?.feedback?.outcome,
      "cleared",
      "List must show updated outcome immediately"
    );

    // Cleanup
    await InterviewExperience.findByIdAndDelete(docId);
    await clearCacheByPrefix("interviews:");
  });

  test("Posting a new interview experience invalidates cache so it appears immediately", async () => {
    // 1. Warm cache
    await clearCacheByPrefix("interviews:");
    const initialList = await (await fetch(`${baseUrl}/api/interviews`)).json();
    const initialCount = initialList.totalCount;

    // 2. Post experience via public/user endpoint
    const postRes = await fetch(`${baseUrl}/api/interviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalInfo: {
          name: "NewPostUser",
          email: "newpost@test.com",
          linkedin: "https://linkedin.com",
        },
        companyDetails: {
          companyName: "BrandNewTech",
          role: "SDE-1",
          location: "Bangalore",
          experienceLevel: "Fresher",
        },
        rounds: [
          {
            roundName: "Coding Round",
            roundType: "Coding test",
            difficulty: "Hard",
            mode: "remote",
            duration: "60m",
            summary: "Solved 2 problems",
          },
        ],
        feedback: {
          outcome: "cleared",
          prepTips: "Practice DP and Graphs",
        },
      }),
    });

    assert.strictEqual(postRes.status, 201);
    const postJson = await postRes.json();
    const newId = postJson.data._id;

    // 3. Fetch list again immediately: new item MUST be present
    const updatedList = await (await fetch(`${baseUrl}/api/interviews`)).json();
    assert.strictEqual(
      updatedList.totalCount,
      initialCount + 1,
      "Total count must increase by 1"
    );
    const foundNew = updatedList.data.some((item) => item._id === newId);
    assert.strictEqual(
      foundNew,
      true,
      "Newly posted interview must appear in list immediately"
    );

    // Cleanup
    await InterviewExperience.findByIdAndDelete(newId);
    await clearCacheByPrefix("interviews:");
  });
});
