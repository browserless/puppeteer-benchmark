const os = require("os");
const path = require("path");
const { performance } = require("perf_hooks");

const puppeteer = require("puppeteer");
const puppeteerVersion = require("puppeteer/package.json").version;

const generatePdf = async (url = "http://example.com/") => {
  const resultPath = path.resolve(os.tmpdir(), `result-${puppeteerVersion}-${+new Date()}.pdf`);

  performance.mark("browser-launch-start");
  const browser = await puppeteer.launch();
  performance.mark("browser-launch-finish");

  performance.measure("browser-launch", "browser-launch-start", "browser-launch-finish");

  const page = await browser.newPage();

  await page.goto(url);

  await page.pdf({
    path: resultPath,
  });

  console.log("Saved pdf to", resultPath);

  await browser.close();
};

module.exports = generatePdf;
