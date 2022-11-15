/**
 * To mock module we need to have existing one
 * This file is creating dummy "puppeteer" module
 */

import fs from "fs";
import path from "path";

const modulePath = path.resolve(__dirname, "..", "..", "node_modules", "puppeteer");

if (fs.existsSync(modulePath)) {
  process.exit(0);
}

fs.mkdirSync(modulePath);

fs.writeFileSync(
  path.resolve(modulePath, "package.json"),
  JSON.stringify(
    {
      name: "puppeteer",
      version: "1.0.0",
    },
    null,
    2,
  ),
);

fs.writeFileSync(path.resolve(modulePath, "index.js"), 'console.log("puppeteer placeholder module")');
