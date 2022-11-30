#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();

import { promises as fs } from "fs";
import path from "path";

import { program } from "commander";
import commander from "commander";
import ora from "ora";

import "./rewiremock";
import { aggregateResults, printResultsTable, testPuppeteerCase } from "./index";
import { usePuppeteerVersion } from "./rewiremock";
import { CommandOptions, TestCasePerformanceResultItem, TestOptions } from "./types";
import { prepareVersions } from "./prepare-versions";
import { avaiableVersions, exportHTMLResults, missingVersions, readJSON, run, sleep, tempJSON } from "./utils";

const myParseInt = (value: string): number => {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }

  return parsedValue;
};

const runTest = async (casePath: string, args: TestOptions & CommandOptions) => {
  const spinner = ora().info("Started testing");
  const testResults: TestCasePerformanceResultItem[][] = [];

  for (const puppeteerVersion of args.puppeteerVersions) {
    usePuppeteerVersion(puppeteerVersion);
    const result = await testPuppeteerCase(casePath, args);

    testResults.push(result.measures);

    spinner.succeed(`Finished testing ${casePath} with puppeteer version: ${puppeteerVersion}`);
  }

  const output = aggregateResults(testResults.flat());

  if (args.out) {
    await fs.writeFile(path.resolve(args.out), JSON.stringify(output, null, 2));
  }

  if (args.printTable) printResultsTable(output);
};

program
  .name("puppeteer-test")
  .command("run <case>")
  .description("run puppeteer case")
  .option("-r, --retries-number <number>", "number of test exectuions", myParseInt, 5)
  .option("--puppeteer-versions <string...>", "comma-separated list of puppeteer versions", ["latest"])
  .option("--case-url <url>", "url parameter that will be passed to case function")
  .option("--case-opts <caseOptions>", "additinal options for test case function", (value) => {
    return JSON.parse(value);
  })
  .option("--out <filePath>", "write json results to file")
  .action(
    async (casePath: string, args: TestOptions & CommandOptions) =>
      await runTest(casePath, { ...args, printTable: true }),
  );

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
  .description("runs all tests")
  .action(async () => {
    const tests = ["make-screenshot.js", "generate-pdf.js", "paint-events.js"];
    const benchmarks = [];
    const pptrVersions = await avaiableVersions();

    for (const test of tests) {
      const file = tempJSON();
      await runTest(`./test-cases/${test}`, {
        puppeteerVersions: pptrVersions,
        retriesNumber: 5,
        out: file,
        caseUrl: process.env.TEST_URL || "https://www.example.com/",
        printTable: false,
      });

      await sleep(2000); // bad practice
      const results = await readJSON(file);
      benchmarks.push(...results);
    }

    printResultsTable(benchmarks);
    exportHTMLResults(benchmarks);
  });

program
  .command("prepare-suite")
  .description("install all puppeteer versions")
  .action(async () => {
    const spinner = ora().info("Installing missing puppeteer versions. This may take some time...");

    const missing = await missingVersions();
    if (missing.length === 0) {
      console.log("Everything was up to date!");
      process.exit(0);
    }
    await prepareVersions(missing);
    spinner.succeed("Done!");
    spinner.stop();
  });
program.parse();
