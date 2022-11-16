import path from "path";
import { performance, PerformanceObserver } from "perf_hooks";

export interface TestOptions {
  retriesNumber: number;
  version: string;
}

export interface RunOptions {
  puppeteerVersions: string[];
}

export interface ExecutionDetails {
  functionName: string;
  puppeteerVersion: string;
  chromeVersion: string;
  retryNumber: number;
  casePath: string;
}

export interface TestCasePerformanceResultItem {
  details: ExecutionDetails;
  item: PerformanceEntry;
}

const _requireUncached = (module: string) => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

export const testPuppeteerCase = async (
  casePath: string,
  options: TestOptions,
): Promise<TestCasePerformanceResultItem[]> => {
  const testCase = path.resolve(casePath);
  const testCaseFunction = _requireUncached(testCase);

  const measures: TestCasePerformanceResultItem[] = [];

  const puppeteer = require("puppeteer");
  const puppeteerVersion = require("puppeteer/package.json").version;

  const browser = await puppeteer.launch();

  const chromeVersion = await browser.version();

  await browser.close();

  const commonDetails: Omit<ExecutionDetails, "retryNumber"> = {
    functionName: testCaseFunction.name,
    casePath,
    puppeteerVersion,
    chromeVersion,
  };

  for (const retryNumber of new Array(options.retriesNumber).fill(null).map((_, index) => ++index)) {
    const details: ExecutionDetails = {
      retryNumber,
      ...commonDetails,
    };

    const performanceObserver = new PerformanceObserver((list) => {
      measures.push(
        ...list.getEntries().map((item) => {
          return {
            details,
            item,
          };
        }),
      );
    });

    performanceObserver.observe({
      buffered: true,
      entryTypes: ["measure"],
    });

    performance.mark(`execution-start`);
    await testCaseFunction();
    performance.mark(`execution-finish`);

    performance.measure("execution", "execution-start", "execution-finish");

    // We need to wait for observer callback to be completed before disconnecting
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    performanceObserver.disconnect();
  }

  return measures;
};
