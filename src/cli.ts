#!/usr/bin/env node

import { program } from "commander";
import commander from "commander";

import "./rewiremock";
import { RunOptions, TestOptions, testPuppeteerCase } from "./index";
import { usePuppeteerVersion } from "./rewiremock";

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
  .action(async (casePath, args: TestOptions & RunOptions) => {
    console.log(args);

    // FIXME: only first version is checked
    usePuppeteerVersion(args.puppeteerVersions[0]);
    const measures = await testPuppeteerCase(casePath, args);

    // FIXME: convert measures to readable format
    console.log(measures);
  });

program
  .command("prepare")
  .argument("<versions...>", "versions")
  .description("load versions of puppeteer")
  .action(async (versions) => {
    console.log("prepare", { versions });
  });

program.parse();
