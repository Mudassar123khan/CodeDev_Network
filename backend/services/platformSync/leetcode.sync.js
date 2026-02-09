import puppeteer from "puppeteer-core";

const fetchLeetcodeStats = async (handle) => {
  const browser = await puppeteer.launch({
   executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });
  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(`https://leetcode.com/u/${handle}`, {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(".absolute.inset-0 div div span");

    //function to select the element and extract data
    const findData = await page.evaluate(() => {
      const problemsSolved = document.querySelector(
        ".absolute.inset-0 div div span",
      );

      return problemsSolved.innerText;
    });

    const ques = findData;
    return {
      handle,
      rating: 0,
      solvedCount: Number(ques),
      lastSynced: new Date(),
    };
  } catch (err) {
    console.log(
      `An error occured while syncing leetcode, message: ${err.message}`,
    );
  } finally {
    await browser.close();
  }
};

export default fetchLeetcodeStats;
