import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

class Scrapper {
  browser;
  page;

  init = async () => {
    try {
      this.browser = await puppeteer.launch({ headless: false });
      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      );
      await this.page.setViewport({ width: 1280, height: 800 });
    } catch (error) {
      console.error('Error during init:', error);
    }
  };

  goto = async url => {
    try {
      if (!this.page) await this.init();
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      if (process.env.DEBUG === 'true') {
        await this.page.screenshot({ path: `./screenshots/${Date.now()} - ${url}.png` });
      }
      await this.randomDelay();
      await this.autoScroll();
      return this.page;
    } catch (error) {
      console.error('Error during goto:', error);
    }
  };

  randomDelay = async () => {
    const delay = 1000 + Math.random() * 2500;
    return new Promise(res => setTimeout(res, delay));
  };

  autoScroll = async () => {
    await this.page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  };

  close = async () => {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('Error during close:', error);
    }
  };
}

export default Scrapper;
