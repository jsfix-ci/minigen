import path from 'path';
import Layout from './Layout';
import Page from './Page';
import utils from './utils';

type SiteGeneratorConfig = {
  layoutDir: string,
  pagesDir: string,
  outputDir: string,
  staticDir: string,
};

class SiteGenerator {
  layouts: Record<string, Layout> = {};
  pages: Record<string, Page> = {};
  config: SiteGeneratorConfig;

  constructor(config: SiteGeneratorConfig) {
    this.config = config;
  }

  async generate() {
    await this.loadLayouts();
    await this.loadPages();

    await this.copyStaticAssets();

    await this.renderSite();
  }

  async loadLayouts() {
    const layoutFiles = await utils.listAllFiles(this.config.layoutDir);

    const promises = layoutFiles.map(async (filepath) => {
      const layoutName = utils.extractFilename(filepath);
      const layoutDefinition = await utils.readFileContent(filepath);

      this.layouts[layoutName] = new Layout(layoutDefinition);
    });

    await Promise.all(promises);
  }

  async loadPages() {
    const pageFiles = await utils.listAllFiles(this.config.pagesDir);

    const promises = pageFiles.map(async (filepath) => {
      const pageName = utils.extractFilename(filepath);
      const pageDefinition = await utils.readFileContent(filepath);

      this.pages[pageName] = new Page(pageDefinition);
    });

    await Promise.all(promises);
  }

  async renderSite() {
    const promises = Object.entries(this.pages).map(async ([pageName, page]) => {
      const targetFile = path.join(this.config.outputDir, `${pageName}.html`);

      const layoutForPage = this.layouts[page.layout];
      if (!layoutForPage) {
        throw new Error(`No layout found for page ${pageName}`);
      }

      const renderedPage = layoutForPage.render(page);

      await utils.writeFileContent(targetFile, renderedPage);
    });

    await Promise.all(promises);
  }

  async copyStaticAssets() {
    const targetDir = path.join(this.config.outputDir, 'static');
    await utils.copyDir(this.config.staticDir, targetDir);
  }
}

export default SiteGenerator;
