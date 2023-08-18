#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();

import { readdirSync } from "fs";
import fs from "fs/promises";
import path from "path";

import { program } from "commander";
import commander from "commander";
import ora from "ora";

import "./rewiremock";
import {
	aggregateResults,
	printResultsTable,
	testPuppeteerCase,
} from "./index";
import { usePuppeteerVersion } from "./rewiremock";
import {
	CommandOptions,
	TestCasePerformanceResultItem,
	TestOptions,
} from "./types";
import { prepareVersions } from "./prepare-versions";
import {
	avaiableVersions,
	exportHTMLResults,
	missingVersions,
	readJSON,
	sleep,
	tempJSON,
	waitForFile,
} from "./utils";

const myParseInt = (value: string): number => {
	const parsedValue = parseInt(value, 10);

	if (isNaN(parsedValue)) {
		throw new commander.InvalidArgumentError("Not a number.");
	}

	return parsedValue;
};

const tests = readdirSync(path.join(__dirname, "..", "test-cases"));

const getTestModulePath = (test: string): string =>
	path.join(__dirname, "..", "test-cases", test);

const runTest = async (
	casePath: string,
	args: TestOptions & CommandOptions,
) => {
	const testResults: TestCasePerformanceResultItem[][] = [];
	let spinner;

	if (!args.silent)
		spinner = ora().info("Started testing " + path.basename(casePath));

	for (const puppeteerVersion of args.puppeteerVersions) {
		usePuppeteerVersion(puppeteerVersion);
		const result = await testPuppeteerCase(casePath, args);

		testResults.push(result.measures);

		if (!args.silent && spinner)
			spinner.succeed(
				`Finished testing ${casePath} with puppeteer version: ${puppeteerVersion}`,
			);
	}

	const output = aggregateResults(testResults.flat());

	if (args.out) {
		await fs.writeFile(args.out, JSON.stringify(output, null, 2));
	}

	if (args.printTable) printResultsTable(output);

	return output;
};

const runAll = async (args: TestOptions & CommandOptions) => {
	if (!args.out) args.out = tempJSON();

	const benchmarks = [];

	for (const test of tests) {
		const file = args.out;
		await runTest(getTestModulePath(test), args);
		await waitForFile(file);
		const results = await readJSON(file);
		benchmarks.push(...results);
	}

	if (args.printTable) printResultsTable(benchmarks);
	return benchmarks;
};

program
	.name("pptr-benchmark")
	.command("run <case>")
	.description("run puppeteer case")
	.option(
		"-r, --retries-number <number>",
		"number of test exectuions",
		myParseInt,
		5,
	)
	.option(
		"--puppeteer-versions <string...>",
		"comma-separated list of puppeteer versions",
		["latest"],
	)
	.option(
		"--case-url <url>",
		"url parameter that will be passed to case function",
	)
	.option("--silent", "turn console output off")
	.option("--generate-report", "export results as an HTML report")
	.option("--highlight-html", "highlight min and max values in html report")
	.option("--report-dir <reportDir>", "write the final HTML repor to directory")
	.option(
		"--temp-dir <tempDir>",
		"write testing PDFs and screenshots to directory",
	)
	.option("--out <outPath>", "write json results to file")
	.action(async (casePath: string, args: TestOptions & CommandOptions) => {
		if (args.tempDir) process.env.PPTR_BENCHMARK_TEMP_DIR = args.tempDir;
		if (args.reportDir) process.env.PPTR_BENCHMARK_REPORT_DIR = args.reportDir;
		if (args.outPath) process.env.PPTR_BENCHMARK_OUT_PATH = args.outPath;
		if (args.silent)
			process.env.PPTR_BENCHMARK_SILENT = JSON.stringify(args.silent);

		let results;

		if (casePath === "all") {
			results = await runAll(args);
			printResultsTable(results);
		} else {
			results = await runTest(getTestModulePath(casePath), {
				...args,
				printTable: true,
			});
		}

		if (args.generateReport)
			exportHTMLResults(results, args.highlightHtml || false);
	});

program
	.command("prepare")
	.argument("<versions...>", "versions")
	.description("load versions of puppeteer")
	.action(async (versions) => {
		const spinner = ora().start("Loading puppeteer versions");
		await prepareVersions(versions);
		spinner.stop();
		spinner.succeed("Versions prepared: " + versions.join(", "));
	});

program
	.command("suite")
	.description("runs all tests with default arguments")
	.action(async () => {
		const benchmarks = [];
		const pptrVersions = await avaiableVersions();

		for (const test of tests) {
			const file = tempJSON();
			await runTest(getTestModulePath(test), {
				puppeteerVersions: pptrVersions,
				retriesNumber: 5,
				out: file,
				reportDir: "./",
				generateReport: true,
				caseUrl: process.env.TEST_URL || "https://www.example.com/",
				highlightHtml: true,
				printTable: false,
			});
			await waitForFile(file);
			const results = await readJSON(file);
			benchmarks.push(...results);
		}

		printResultsTable(benchmarks);
		exportHTMLResults(benchmarks, true);
	});

program
	.command("prepare-suite")
	.description("install all puppeteer versions")
	.action(async () => {
		const spinner = ora().info(
			"Installing missing puppeteer versions. This may take some time...",
		);

		const missing = await missingVersions();
		if (missing.length === 0) {
			console.log("Everything was up to date!");
			process.exit(0);
		}
		await prepareVersions(missing);
		spinner.succeed("Done!");
		spinner.stop();
	});

program.parse(process.argv);
