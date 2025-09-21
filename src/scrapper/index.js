import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';
import fs from 'fs';

puppeteer.use(StealthPlugin());

class Scrapper {
  browser;
  page;

  init = async () => {
    try {
      if (this.browser) return;
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // adjust per OS
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
      });

      this.page = await this.browser.newPage();

      // Random UserAgent
      const userAgent = randomUseragent.getRandom();
      await this.page.setUserAgent(userAgent);

      // Intercept requests (optional – sometimes blocking can break login)
      await this.page.setRequestInterception(true);
      this.page.on('request', req => {
        if (req.url().includes('perimeterx') || req.url().includes('datadome')) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Random viewport
      const width = 1200 + Math.floor(Math.random() * 200);
      const height = 700 + Math.floor(Math.random() * 300);
      await this.page.setViewport({ width, height });

      // Try loading cookies if available
      if (fs.existsSync('cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json'));
        await this.page.setCookie(...cookies);
        console.log('✅ Loaded session cookies');
      }
    } catch (error) {
      console.error('Error during init:', error);
      this.browser?.close();
    }
  };

  // Run once manually to save cookies after successful login
  saveCookies = async () => {
    const cookies = await this.page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    console.log('✅ Cookies saved to cookies.json');
  };

  createSessionG2 = async () => {
    try {
      const email = process.env.G2_EMAIL;
      const password = process.env.G2_PASSWORD;
      if (!email || !password) {
        console.error('createSessionG2: Missing email or password.');
        return false;
      }
      const loginUrl =
        'https://www.g2.com/identities/start_login?return_to=https://www.g2.com/search';
      const page = await this.goto(loginUrl);
      if (!page) {
        console.warn('createSessionG2: goto returned null (navigation failure).');
        return false;
      }

      const logoutXPath = '/html/body/div[5]/aside/div/ul/li[16]/a';
      const logoutHandle = await page.$x(logoutXPath);
      if (logoutHandle && logoutHandle.length > 0) {
        console.log('✅ Already logged in (logout link found).');
        await this.exportCookies();
        return true;
      }

      const emailXPath = '/html/body/div[3]/div/div[1]/div[2]/div/div[1]/form/div[1]/div[2]/input';
      const passXPath =
        '/html/body/div[3]/div/div[1]/div[2]/div/div[1]/form/div[1]/div[3]/div/div/input';
      const submitXPath = '/html/body/div[3]/div/div[1]/div[2]/div/div[1]/form/div[2]/input';

      const emailHandle = await page.waitForXPath(emailXPath, { timeout: 10000 }).catch(() => null);
      if (!emailHandle) {
        console.warn('Email field not found by XPath.');
        return false;
      }

      await this.typeLikeHuman(page, emailXPath, process.env.G2_EMAIL || '');
      await this.typeLikeHuman(page, passXPath, process.env.G2_PASSWORD || '');

      const submitHandle = await page
        .waitForXPath(submitXPath, { timeout: 5000 })
        .catch(() => null);
      if (!submitHandle) {
        console.warn('Submit button not found by XPath.');
        return false;
      }
      await submitHandle.click();

      try {
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch (e) {
        console.warn('Navigation after submit timed out:', e.message);
      }

      const afterLoginLogout = await page.$x(logoutXPath);
      if (afterLoginLogout && afterLoginLogout.length > 0) {
        console.log('🎉 Login succeeded — logout link found.');
        await this.exportCookies();
        return true;
      }

      console.warn('Login may have failed (logout link not found).');
      return false;
    } catch (err) {
      console.error('createSessionG2 error:', err);
      return false;
    }
  };

  goto = async url => {
    try {
      if (!this.page) await this.init();
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      if (process.env.DEBUG === 'true') {
        await this.page.screenshot({ path: `screenshots/${Date.now()}.png` });
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
        const timer = setInterval(() => {
          const distance = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, Math.floor(Math.random() * (400 - 100 + 1)) + 100);
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

export default new Scrapper();
