import path from "path";
import { performance, PerformanceObserver } from "perf_hooks";

import * as mathjs from "mathjs";

import { TestOptions, TestCasePerformanceResultItem, ExecutionDetails, AggregatedResultItem } from "./types";
import { simplifyResults } from "./utils";

const _requireUncached = (module: string) => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

export const testPuppeteerCase = async (
  casePath: string,
  options: TestOptions,
): Promise<{
  measures: TestCasePerformanceResultItem[];
}> => {
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
    await testCaseFunction(options.caseUrl, options.caseOpts);
    performance.mark(`execution-finish`);

    performance.measure("total", "execution-start", "execution-finish");

    // We need to wait for observer callback to be completed before disconnecting
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    performanceObserver.disconnect();
  }

  return { measures };
};

/**
 * Convert raw measurement items to grouped data
 */
export const aggregateResults = (resultItems: TestCasePerformanceResultItem[]): AggregatedResultItem[] => {
  const testedFunctions = new Set<string>();
  const puppeteerVersions = new Set<string>();
  const reportedMeasures = new Set<string>();

  resultItems.forEach((item) => {
    testedFunctions.add(item.details.functionName);
    puppeteerVersions.add(item.details.puppeteerVersion);
    reportedMeasures.add(item.item.name);
  });

  return Array.from(testedFunctions)
    .map((fnName) => {
      return Array.from(reportedMeasures).map((measureName) => {
        return Array.from(puppeteerVersions).reduce<AggregatedResultItem>(
          (acc, puppeteerVersion) => {
            const relatedRunResults = resultItems.filter((item) => {
              return (
                item.item.name === measureName &&
                item.details.functionName === fnName &&
                item.details.puppeteerVersion === puppeteerVersion
              );
            });

            const relatedDurations = relatedRunResults.map((_) => _.item.duration);

            acc.measuresNum = relatedDurations.length;

            acc.resultsByVersion[puppeteerVersion] = {
              avg: mathjs.mean(relatedDurations),
              min: mathjs.min(relatedDurations),
              max: mathjs.max(relatedDurations),
              stddev: mathjs.std(...relatedDurations),
            };

            return acc;
          },
          {
            functionName: fnName,
            measureName,
            measuresNum: 0,
            resultsByVersion: {},
          },
        );
      });
    })
    .flat()
    .filter((_) => _.measuresNum > 0);
};

/**
 * Simplify results structure and print table to console
 */
export const printResultsTable = (resultItems: AggregatedResultItem[]): void => {
  console.table(simplifyResults(resultItems));
};
