import axios from "axios";
import * as cheerio from "cheerio";
import { launchBrowser } from "./puppeteer.config.js";

const fetchViaCheerio = async (handle) => {
  const response = await axios.get(
    `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 8000,
    }
  );

  const $ = cheerio.load(response.data);
  const ratingText = $(".rating-number").first().text().trim();
  const rating = parseInt(ratingText, 10) || 0;

  let solvedCount = 0;
  // Look for "Total Problems Solved" in section headers
  $("h3").each((i, el) => {
    const text = $(el).text();
    if (text.toLowerCase().includes("problems solved")) {
      const match = text.match(/problems\s*solved[^\d]*(\d+)/i);
      if (match) {
        solvedCount = parseInt(match[1], 10);
      }
    }
  });

  return { rating, solvedCount };
};

const fetchCodechefStats = async (handle) => {
  if (!handle || typeof handle !== "string") return null;
  const cleanHandle = handle.trim();
  if (!cleanHandle) return null;

  // 1. Fast HTTP / Cheerio fetch (Takes ~500ms, does not require browser)
  try {
    const cheerioResult = await fetchViaCheerio(cleanHandle);
    if (cheerioResult && (cheerioResult.rating > 0 || cheerioResult.solvedCount > 0)) {
      return {
        handle: cleanHandle,
        lastSynced: new Date(),
        solvedCount: cheerioResult.solvedCount,
        rating: cheerioResult.rating,
      };
    }
  } catch (err) {
    console.warn(
      `CodeChef HTTP fetch failed for ${cleanHandle} (${err.message}). Trying browser fallback.`
    );
  }

  // 2. Container-safe Puppeteer fallback
  let browser = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Abort media, fonts, images to make loading fast and reliable
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "media", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(`https://www.codechef.com/users/${encodeURIComponent(cleanHandle)}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await page.waitForSelector(".rating-data-section", { timeout: 8000 });

    const user = await page.evaluate(() => {
      const rat = document.querySelector(".rating-number");
      let problems = 0;
      const allH3s = document.querySelectorAll(
        ".rating-data-section h3, .problems-solved h3"
      );
      allH3s.forEach((el) => {
        const text = el.innerText || "";
        const m = text.match(/problems\s*solved[^\d]*(\d+)/i);
        if (m) problems = parseInt(m[1], 10);
      });

      return {
        problems,
        rating: rat ? parseInt(rat.innerText, 10) || 0 : 0,
      };
    });

    return {
      handle: cleanHandle,
      lastSynced: new Date(),
      solvedCount: user.problems,
      rating: user.rating,
    };
  } catch (err) {
    console.error(`CodeChef sync failed for ${cleanHandle}: ${err.message}`);
    return null;
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

export default fetchCodechefStats;

