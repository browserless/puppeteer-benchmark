const { performance } = require("perf_hooks");

const puppeteer = require("puppeteer");

const paintEvents = async (url = "http://example.com/", options = {
  selector: "h1"
}) => {
  performance.mark("browser-launch-start");
  const browser = await puppeteer.launch();
  performance.mark("browser-launch-finish");

  performance.measure("browser-launch", "browser-launch-start", "browser-launch-finish");

  const page = await browser.newPage();

  const selectorPromise = page.waitForSelector(options.selector).then(_ => {
    performance.mark('wait-for-selector-finish')
  })
  
  performance.mark('navigation-start')
  await page.goto(url, {waitUntil: 'networkidle0'});

  const rawPerfEntries = await page.evaluate(function () {
    return JSON.stringify(window.performance.getEntries());
  });

  const allPerformanceEntries = JSON.parse(rawPerfEntries);

  const navigationEvent = allPerformanceEntries.find((x) => x.entryType === "navigation");
  const fcp = allPerformanceEntries.find((x) => x.name === "first-contentful-paint");
  const fp = allPerformanceEntries.find((x) => x.name === "first-paint");

  if (navigationEvent) {
    performance.measure('time-to-first-byte', {
      start: 0,
      end: navigationEvent.responseStart ?? 0
    })
  }
  
  if (fp) {
    performance.measure('first-paint', {
      start: 0,
      end: fp.startTime
    })
  }

  if (fcp) {
    performance.measure('first-contentful-paint', {
      start: 0,
      end: fcp.startTime
    })
  }

  await selectorPromise;

  performance.measure(`wait-for-selector-${options.selector}`, 'navigation-start','wait-for-selector-finish')

  await browser.close();
};

module.exports = paintEvents;
