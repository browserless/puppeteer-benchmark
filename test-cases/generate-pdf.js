const fs = require("fs");
const os = require("os");
const path = require("path");
const { performance } = require("perf_hooks");

const pidusage = require("pidusage");
const puppeteer = require("puppeteer");
const puppeteerVersion = require("puppeteer/package.json").version;

const getFilesize = (filename) => {
	const stats = fs.statSync(filename);
	return stats.size;
};

const generatePdf = async (url = "http://example.com/") => {
	const silent = JSON.parse(process.env.PPTR_BENCHMARK_SILENT ?? "false");

	const resultPath = path.resolve(
		process.env.PPTR_BENCHMARK_TEMP_DIR || os.tmpdir(),
		`result-${puppeteerVersion}-${+new Date()}.pdf`,
	);

	performance.mark("browser-launch-start");
	const browser = await puppeteer.launch();
	performance.mark("browser-launch-finish");

	performance.measure(
		"browser-launch",
		"browser-launch-start",
		"browser-launch-finish",
	);

	const page = await browser.newPage();

	await page.goto(url);
	const chromeStats = await pidusage(browser.process().pid);

	performance.mark("pdf-start");
	await page.pdf({
		path: resultPath,
	});
	performance.mark("pdf-finish");
	performance.measure("pdf-generation", "pdf-start", "pdf-finish");

	performance.measure("pdf-size", {
		detail: { pdfSize: getFilesize(resultPath) },
		start: "pdf-start",
		end: "pdf-finish",
	});

	performance.measure("memory", {
		detail: { memory: chromeStats.memory },
		start: "pdf-start",
		end: "pdf-finish",
	});

	performance.measure("cpu", {
		detail: { cpu: chromeStats.cpu },
		start: "pdf-start",
		end: "pdf-finish",
	});

	if (!silent) console.log("Saved pdf to", resultPath);

	await browser.close();
};

module.exports = generatePdf;
