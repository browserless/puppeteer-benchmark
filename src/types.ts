export interface TestOptions<T = any> {
	/** Argument that will be passed to case function */
	caseUrl?: string;
	caseOpts?: T;
	printTable?: boolean;
	tempDir?: string;

	retriesNumber: number;
}

export type CommandOptions = {
	puppeteerVersions: string[];
	generateReport: boolean;
	highlightHtml?: boolean;
	outPath?: string;
	reportDir?: string;
	out: string;
};

export type ExecutionDetails = {
	functionName: string;
	puppeteerVersion: string;
	chromeVersion: string;
	retryNumber: number;
	casePath: string;
};

interface SinglePerformanceEntry extends PerformanceEntry {
	detail: any;
}

export type TestCasePerformanceResultItem = {
	details: ExecutionDetails;
	item: SinglePerformanceEntry;
};

export type AggregatedResultVersionsPerformance = {
	min: any;
	max: any;
	avg: any;
	stddev: any;
};

export type AggregatedResultItem = {
	functionName: string;
	measureName: string;
	measuresNum: number;
	resultsByVersion: {
		[version: string]: AggregatedResultVersionsPerformance;
	};
};
