import rewiremock from "rewiremock/node";

export const usePuppeteerVersion = (version: string) => {
  rewiremock("puppeteer").by(`../versions/puppeteer-${version}/node_modules/puppeteer-${version}`);
  rewiremock("puppeteer/package.json").by(
    `../versions/puppeteer-${version}/node_modules/puppeteer-${version}/package.json`,
  );

  rewiremock.overrideEntryPoint(module);

  rewiremock.enable();
};

export { rewiremock };
