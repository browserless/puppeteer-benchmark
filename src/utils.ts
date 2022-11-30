import * as dotenv from "dotenv";
dotenv.config();

import { exec, ExecOptions } from "child_process";
import { readdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import _difference from "lodash.difference";
import _range from "lodash.range";

import { AggregatedResultItem } from "./types";

const tempDir = tmpdir();

export const run = (command: string, opts: ExecOptions = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    const subProcess = exec(command, opts, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout.toString());
    });

    subProcess.stdout?.pipe(process.stdout);
  });

export const tempJSON = (): string => {
  return path.join(tempDir, `${Date.now()}.json`);
};

export const readJSON = async (name: string) => {
  const file = await readFile(name);
  return JSON.parse(file.toString());
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((res) => setTimeout(res, ms));
};

export const avaiableVersions = async () => {
  const versions = (await readdir("./versions").catch(() => [])).map((v) => v.split("puppeteer-")[1]);
  return versions.sort((a, b) => {
    if (a === "latest") return 1;
    if (Number(a) > Number(b)) return 1;
    return -1;
  });
};

export const missingVersions = async (): Promise<string[]> => {
  const avaiable = (await readdir("./versions").catch(() => [])).map((v) => v.split("puppeteer-")[1]);

  const latest = process.env.LAST_PPTR_VERSION;
  const major = Number(latest?.split(".")[0]); // npm versions are always #.#.#, so this is deterministic
  const versions = _range(1, major).map((v) => v.toString());

  versions.push("latest"); // lodash.range is not inclusive
  return _difference(versions, avaiable);
};

export const simplifyResults = (resultItems: AggregatedResultItem[]) => {
  return resultItems.map((item) => {
    const { resultsByVersion, measuresNum, ...others } = item;
    return Object.entries(resultsByVersion).reduce(
      (acc, [version, r]) => {
        acc[version] = parseFloat(r.avg.toFixed(2));
        return acc;
      },
      { ...others } as any,
    );
  });
};

const resultsToHTMLTable = (resultItems: AggregatedResultItem[]) => {
  const json: any[] = simplifyResults(resultItems);
  for (const result of json) {
    delete result.functionName;
  }

  let table = `<table border="1"><th>`;
  for (const key in json[0]) {
    table += "<td>" + key + "</td>";
  }
  table += "</th>";
  for (var i = 0; i < json.length; i++) {
    table += "<tr>";
    table += "<td>" + (i + 1) + "</td>";
    for (const key in json[i]) {
      table += "<td>" + json[i][key] + "</td>";
    }
    table += "</tr>";
  }
  table += "</table>";

  return `<html>
  <style>table {border-collapse: collapse;margin: 25px 0;font-size: 0.9em;font-family: sans-serif;min-width: 400px;}table td {padding: 5px 15px;}table tbody tr {border-bottom: 1px solid #dddddd;}table tbody tr:nth-of-type(odd) {background-color: #f3f3f3;}tr:first-of-type {background: #6d6d6d !important;color: #fff;font-weight: 600;}</style>
  ${table}
  </html>`;
};

export const exportHTMLResults = async (results: AggregatedResultItem[]) => {
  const table = resultsToHTMLTable(results);
  await writeFile(path.join("./", `results-${Date.now()}.html`), table);
};
