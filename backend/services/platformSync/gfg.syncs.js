import puppeteer from "puppeteer";

const fetchGfgStats = async (handle) => {
  console.log("Chrome path:", puppeteer.executablePath());
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--no-zygote",
    "--single-process"
  ]
  });

  try {
    const page = await browser.newPage();

    await page.goto(
      `https://www.geeksforgeeks.org/profile/${handle}?tab=activity`,
      { waitUntil: "networkidle2" }
    );

    await page.waitForSelector(".ScoreContainer_value__7yy7h");

    const problemsSolved = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        ".ScoreContainer_value__7yy7h"
      );
      return Array.from(elements).map(el => el.innerText);
    });

    return {
        handle,
        rating:0,
        solvedCount:parseInt(problemsSolved[1]) || 0,
        lastSynced:new Date(),
    }

  } catch (err) {
    console.error("GFG scrape failed:", err.message);
    return null;

  } finally {
    await browser.close();
  }
};

export default fetchGfgStats;
