# Puppeteer Benchmark

This project is a CLI to write, test, and benchmark versions of puppeteer (and their respective Chrome binaries) for workloads that you might be interested in. By default, it comes with three basic test-cases:

1. PDF Generation
2. Screenshot Generation
3. Load/paint events

Tests are simple async functions that make use of the `perf_hooks` library to capture events you're interested in. Feel free to fork and add your own!

## Basic CLI usage

```sh
# Setup
$ npm i
$ npm link

# Prepare (download and install) the versions you care about
$ puppeteer-test prepare 13 15 latest

# Run the tests and output the results to a JSON file
$ puppeteer-test run test-cases/generate-pdf.js -r 2 --puppeteer-versions 13 15 latest --out results.json

$ puppeteer-test run test-cases/paint-events.js -r 5 \
    --puppeteer-versions 13 15 latest \
    --case-url "http://example.com" --case-opts '{"selector": "p"}' \
    --out results.json
```

## To install all versions

```sh
npm run prepare-suite
```

## To test all versions

```sh
npm run suite
```

## Why?

You can read more about why we did this in our blog. The TL;DR is that we (browserless) heard a lot from our users about performance changes from version-to-version of Chrome, and wanted a way to programmatically see if a version change would introduce new latencies.

This CLI was born from that curiosity, and we wanted to open-source it to the community so that you can write and run your own performance benchmarks to track KPIs that you care about.

## Future Features

Eventually we'll track the results of this suite into a static webpage that you can check on. This will hopefully give you a good sense of what to expect when upgrading. We'll work on adding newer tests as time goes on, but found enough value out of these initial few that we wanted to see what the community thought!

## I want to Help!
First, thanks! Please submit a PR and we'll follow up with you. If you have a bigger feature or want to do something drastic, please submit an issue describing what you want to do in order to avoid doing all that work.
