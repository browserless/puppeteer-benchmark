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

  performance.mark("pdf-start");
  await page.pdf({
    path: resultPath,
  });
  performance.mark("pdf-finish");

  performance.measure("pdf-generation", "pdf-start", "pdf-finish");

  console.log("Saved pdf to", resultPath);

  await browser.close();
};

module.exports = generatePdf;
