export type TestOptions = {
  retriesNumber: number;
  version: string;
};

export type RunOptions = {
  puppeteerVersions: string[];
  out: string;
};

export type ExecutionDetails = {
  functionName: string;
  puppeteerVersion: string;
  chromeVersion: string;
  retryNumber: number;
  casePath: string;
};

export type TestCasePerformanceResultItem = {
  details: ExecutionDetails;
  item: PerformanceEntry;
};

export type AggregatedResultVersionsPerformance = {
  min: number;
  max: number;
  avg: number;
  stddev: number;
};

export type AggregatedResultItem = {
  functionName: string;
  measureName: string;
  measuresNum: number;
  resultsByVersion: {
    [version: string]: AggregatedResultVersionsPerformance;
  };
};
