const os = require("os");
const path = require("path");
const { performance } = require("perf_hooks");

const puppeteer = require("puppeteer");
const puppeteerVersion = require("puppeteer/package.json").version;

const generalTesting = async (url = "http://example.com/") => {
  const screenshotPath = path.resolve(os.tmpdir(), `result-${puppeteerVersion}-${+new Date()}.png`);

  performance.mark("browser-launch-start");
  const browser = await puppeteer.launch();
  performance.mark("browser-launch-finish");

  const page = await browser.newPage();

  performance.mark("navigation-start");
  await page.goto(url);
  performance.mark("navigation-finish");

  performance.mark("screenshot-start");
  await page.screenshot({
    path: screenshotPath,
  });
  performance.mark("screenshot-finish");

  console.log("Saved screenshot to", screenshotPath);

  performance.mark("browser-close-start");
  await browser.close();
  performance.mark("browser-close-finish");

  performance.measure("browser-launch", "browser-launch-start", "browser-launch-finish");
  performance.measure("navigation", "navigation-start", "navigation-finish");
  performance.measure("screenshot", "screenshot-start", "screenshot-finish");
  performance.measure("browser-close", "browser-close-start", "browser-close-finish");
};

module.exports = generalTesting;
