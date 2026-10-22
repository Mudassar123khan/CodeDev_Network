import axios from "axios";
import { launchBrowser } from "./puppeteer.config.js";

const extractFromHtml = (html) => {
  if (!html || typeof html !== "string") return null;

  // Match total_problems_solved and score in Next.js streaming chunks or SSR HTML
  const solvedMatch = html.match(/total_problems_solved[^\d]*(\d+)/i);
  const scoreMatch = html.match(/\\?"score\\?"\s*:\s*(\d+)/i);

  if (solvedMatch) {
    return {
      solvedCount: parseInt(solvedMatch[1], 10) || 0,
      rating: scoreMatch ? parseInt(scoreMatch[1], 10) || 0 : 0,
    };
  }

  return null;
};

const fetchViaHttp = async (handle) => {
  const url = `https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 8000,
  });

  return extractFromHtml(response.data);
};

const fetchViaPuppeteer = async (handle) => {
  let browser = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Abort media, fonts, images to make page loading fast and avoid timeouts
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "media", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    try {
      await page.waitForFunction(
        () => {
          return (
            document.querySelector('[class*="ScoreContainer_value"]') !== null ||
            document.querySelector('[class*="DoughnutChart_totalCount"]') !== null ||
            document.body.innerText.includes("Problems Solved") ||
            document.documentElement.innerHTML.includes("total_problems_solved")
          );
        },
        { timeout: 8000 }
      );
    } catch {
      // Continue to evaluate if selector wait timed out
    }

    const data = await page.evaluate(() => {
      let solvedCount = 0;
      let rating = 0;

      const html = document.documentElement.innerHTML;
      const solvedMatch = html.match(/total_problems_solved[^\d]*(\d+)/i);
      const scoreMatch = html.match(/\\?"score\\?"\s*:\s*(\d+)/i);

      if (solvedMatch) {
        solvedCount = parseInt(solvedMatch[1], 10) || 0;
      }
      if (scoreMatch) {
        rating = parseInt(scoreMatch[1], 10) || 0;
      }

      // Check DoughnutChart element
      if (!solvedCount) {
        const doughnut = document.querySelector('[class*="DoughnutChart_totalCount"]');
        if (doughnut) {
          solvedCount = parseInt(doughnut.innerText, 10) || 0;
        }
      }

      // Check score container rows semantically
      if (!solvedCount || !rating) {
        const rows = document.querySelectorAll('[class*="ScoreContainer_score-row"]');
        for (const row of rows) {
          const text = row.innerText || "";
          if (text.includes("Problems Solved")) {
            const valEl = row.querySelector('[class*="ScoreContainer_value"]');
            if (valEl) solvedCount = parseInt(valEl.innerText, 10) || solvedCount;
          } else if (text.includes("Coding Score")) {
            const valEl = row.querySelector('[class*="ScoreContainer_value"]');
            if (valEl) rating = parseInt(valEl.innerText, 10) || rating;
          }
        }
      }

      // Fallback: any score container value list
      if (!solvedCount) {
        const values = Array.from(document.querySelectorAll('[class*="ScoreContainer_value"]'));
        if (values.length > 1) {
          solvedCount = parseInt(values[1].innerText, 10) || 0;
        }
      }

      return { solvedCount, rating };
    });

    return data;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr.message);
      }
    }
  }
};

const fetchGfgStats = async (rawHandle) => {
  if (!rawHandle || typeof rawHandle !== "string") return null;
  const handle = rawHandle.trim();
  if (!handle) return null;

  try {
    // 1. Fast direct HTTP fetch (< 1.5s)
    try {
      const httpResult = await fetchViaHttp(handle);
      if (httpResult) {
        return {
          handle,
          rating: httpResult.rating || 0,
          solvedCount: httpResult.solvedCount || 0,
          lastSynced: new Date(),
        };
      }
    } catch (httpErr) {
      console.warn(
        `GFG HTTP fetch failed for ${handle} (${httpErr.message}). Falling back to browser scraper.`
      );
    }

    // 2. Container-safe Puppeteer fallback
    const browserResult = await fetchViaPuppeteer(handle);
    return {
      handle,
      rating: browserResult?.rating || 0,
      solvedCount: browserResult?.solvedCount || 0,
      lastSynced: new Date(),
    };
  } catch (err) {
    console.error("GFG scrape failed:", err.message);
    return null;
  }
};

export default fetchGfgStats;

