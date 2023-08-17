import * as dotenv from "dotenv";
dotenv.config();

import { exec, ExecOptions } from "child_process";
import { readdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import _difference from "lodash.difference";
import _range from "lodash.range";
//@ts-ignore
import _startCase from "lodash.startCase";

import { AggregatedResultItem } from "./types";

export const tempJSON = (): string => {
	return path.join(
		process.env.PPTR_BENCHMARK_OUT_PATH || tmpdir(),
		`${Date.now()}.json`,
	);
};

export const readJSON = async (name: string) => {
	const file = await readFile(name);
	return JSON.parse(file.toString());
};

export const sleep = (ms: number): Promise<void> => {
	return new Promise((res) => setTimeout(res, ms));
};

export const avaiableVersions = async () => {
	const versions = (await readdir("./versions").catch(() => [])).map(
		(v) => v.split("puppeteer-")[1],
	);
	return versions.sort((a, b) => {
		if (a === "latest") return 1;
		if (Number(a) > Number(b)) return 1;
		return -1;
	});
};

export const missingVersions = async (): Promise<string[]> => {
	const avaiable = (await readdir("./versions").catch(() => [])).map(
		(v) => v.split("puppeteer-")[1],
	);

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

const resultsToHTMLTable = (
	resultItems: AggregatedResultItem[],
	date: number,
	highlightVals: boolean,
) => {
	const json: any[] = simplifyResults(resultItems);
	for (const result of json) {
		delete result.functionName;
	}

	let table = `<table class="table custom-table"><thead><th>`;
	for (const key in json[0]) {
		table += "<td><b>" + key + "</b></td>";
	}
	table += "</th></thead>";
	for (var i = 0; i < json.length; i++) {
		table += "<tr>";
		table += "<td>" + (i + 1) + "</td>";

		const rowValues = Object.values(json[i]).filter((val: any) =>
			Boolean(Number(val)),
		) as number[];
		const max = Math.max(...rowValues);
		const min = Math.min(...rowValues);

		for (const key in json[i]) {
			let highlightClassname = "";
			const value = json[i][key];
			const cell = typeof value === "string" ? _startCase(value) : value;

			if (!highlightVals) highlightClassname = "";
			else if (value === max) highlightClassname = "highlight-high";
			else if (value === min) highlightClassname = "highlight-low";

			table +=
				'<td><div class="' + highlightClassname + '">' + cell + "</div></td>";
		}
		table += "</tr>";
	}
	table += "</table>";

	return `<html>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
  thead tr td {
    border-top: none !important;
  }
  .table {
  width: 100%;
  margin-bottom: 1rem;
  color: #212529;
  }

  .table th, .table td {
  padding: 0.75rem;
  vertical-align: top;
  border-top: 1px solid #dee2e6;
  }

  body {
  font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  background-color: #fefefe;
  display: flex;
  justify-content: center;
  margin-top: 8em;
  }

  p {
  color: #b3b3b3;
  font-weight: 300; }

  a {
  -webkit-transition: .3s all ease;
  -o-transition: .3s all ease;
  transition: .3s all ease; }
  a, a:hover {
  text-decoration: none !important; }

  .content {
  padding: 7rem 0; }

  h2 {
  font-size: 20px;
  margin-bottom: 2em;
  }

  .custom-table {
  min-width: 900px; }
  .custom-table thead tr, .custom-table thead th {
  border-top: none;
  border-bottom: none !important; }
  .custom-table tbody th, .custom-table tbody td {
  color: #777 !important;
  padding-right: 30px;
  font-weight: 300;
  }

  td div {
    padding: 2px 6px;
    width: fit-content !important;
  }

  .highlight-high {
    background: #ffe6e6;
    border-radius: 3px;
    color: #b55d5d;
  }


 .highlight-low {
    background: #ecf2eb !important;
    border-radius: 3px;
    color: #267135;
  }


  </style>
  <div style="width: 85%">
  <div style="display: flex;">
    <img
    height="50px"
    src="https://raw.githubusercontent.com/browserless/chrome/master/assets/browserless_logo_screen_gradient.png"
    alt="" />
  <h2>Test ran on ${new Date(date).toString().slice(0, 24)}</h2>
  </div>
  ${table}
  <br />
  <p>* This report was generated on Windows, therefore CPU measurements are unreliable.</p>
  <br /><br />
  </div>
  </html>`;
};

export const exportHTMLResults = async (
	results: AggregatedResultItem[],
	highlightVals: boolean,
) => {
	const date = Date.now();
	const table = resultsToHTMLTable(results, date, highlightVals);
	await writeFile(
		path.join(
			process.env.PPTR_BENCHMARK_REPORT_DIR || "./",
			`results-${date}.html`,
		),
		table,
	);
};
