#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";

import { program } from "commander";
import commander from "commander";

import "./rewiremock";
import { aggregateResults, printResultsTable, testPuppeteerCase } from "./index";
import { usePuppeteerVersion } from "./rewiremock";
import { RunOptions, TestCasePerformanceResultItem, TestOptions } from "./types";

const myParseInt = (value: string): number => {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }

  return parsedValue;
};

program
  .name("puppeteer-test")
  .command("run <case>")
  .description("run puppeteer case")
  .option("-r, --retries-number <number>", "number of test exectuions", myParseInt, 5)
  .option("--puppeteer-versions <string...>", "comma-separated list of puppeteer versions", ["latest"])
  .option("--out <filePath>", "write json results to file")
  .action(async (casePath, args: TestOptions & RunOptions) => {
    console.log(args);
    const testResults: TestCasePerformanceResultItem[][] = [];

    for (const puppeteerVersion of args.puppeteerVersions) {
      usePuppeteerVersion(puppeteerVersion);
      const measures = await testPuppeteerCase(casePath, args);
      testResults.push(measures);
    }

    const output = aggregateResults(testResults.flat());

    if (args.out) {
      await fs.writeFile(path.resolve(args.out), JSON.stringify(output, null, 2));
    }

    printResultsTable(output);
  });

program
  .command("prepare")
  .argument("<versions...>", "versions")
  .description("load versions of puppeteer")
  .action(async (versions) => {
    console.log("prepare", { versions });
  });

program.parse();
