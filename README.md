# puppeteer-test-tool

```
$ npm i
$ npm link

$ puppeteer-test prepare 13 15 latest

$ puppeteer-test run test-cases/generate-pdf.js -r 2 --puppeteer-versions 13 15 latest --out results.json

$ puppeteer-test run test-cases/paint-events.js -r 5 \
    --puppeteer-versions 13 15 latest \
    --case-url "http://example.com" --case-opts '{"selector": "p"}' \
    --out results.json
```
