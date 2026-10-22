import puppeteer from "puppeteer-core";

/**
 * Returns the appropriate Chromium executable path for the current OS.
 * On Linux (Render / Docker container), defaults to /usr/bin/chromium.
 * On Windows, defaults to the local Chrome executable path.
 */
export const getChromiumExecutablePath = () => {
  if (process.platform === "linux") {
    return (
      process.env.EXECUTABLE_PATH ||
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      "/usr/bin/chromium"
    );
  }
  return (
    process.env.EXECUTABLE_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  );
};

/**
 * Returns container-safe flags for launching Chromium.
 * NOTE: '--single-process' is intentionally omitted because it causes
 * segmentation faults and 'Code: null' process crashes in Linux Docker containers.
 */
export const getChromiumLaunchArgs = () => [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-first-run",
  "--no-zygote",
  "--disable-extensions",
  "--disable-software-rasterizer",
];

/**
 * Launches a Puppeteer browser instance with proper container settings.
 */
export const launchBrowser = async () => {
  const executablePath = getChromiumExecutablePath();
  return await puppeteer.launch({
    executablePath,
    headless: true,
    args: getChromiumLaunchArgs(),
  });
};
