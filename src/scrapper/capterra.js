import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const scrapper = async (name, start_date, end_date) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setUserAgent({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });
    await page.setViewport({ width: 1280, height: 800 });

    const url = new URL(`https://www.capterra.in/search/product`);
    url.searchParams.set('q', name);

    await page.goto(url.href, { waitUntil: 'networkidle2' });

    const anchor = await page.evaluate(() => {
      const container = document.evaluate(
        '/html/body/main/div[4]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (!container) return null;
      return Array.from(container.querySelectorAll('a'))[0]?.href;
    });

    console.log('Anchors found:', anchor);

    await browser.close();
    return anchor;
  } catch (error) {
    console.error(error);
  }
};

export default scrapper;
