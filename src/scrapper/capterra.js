import Scrapper from './index.js';
const scrapper = new Scrapper();

const getProductUrl = async name => {
  try {
    const url = new URL(`https://www.capterra.in/search/product`);
    url.searchParams.set('q', name);
    await scrapper.init();
    const page = await scrapper.goto(url.href);
    const productUrl = await page.evaluate(() => {
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

    console.log('Product Url found:', productUrl);
    return productUrl;
  } catch (error) {
    console.error(error);
  }
};

const inDateRange = (date, start_date, end_date) => {
  const d = new Date(date).getTime();
  if (isNaN(d)) {
    console.log(`Invalid date ${date}`);
    return false;
  }
  const s = new Date(start_date).getTime();
  const e = new Date(end_date).getTime();
  return d >= s && d <= e;
};

const getReviews = async (name, start_date, end_date) => {
  try {
    const productUrl = await getProductUrl(name);
    if (!productUrl) {
      console.error('Product URL not found');
      return null;
    }

    const reviewsUrl = productUrl.replace('software', 'reviews');
    const url = new URL(reviewsUrl);

    let pageNumber = 1;
    const allReviews = [];

    const LIMIT = process.env.PAGINATION_LIMIT || 2;
    while (pageNumber <= LIMIT) {
      url.searchParams.set('page', pageNumber);
      const page = await scrapper.goto(url.href);
      const { reviews, hasNextPage } = await page.evaluate(() => {
        const reviewsContainer = document.evaluate(
          '/html/body/main/section[2]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!reviewsContainer) return { reviews: [], hasNextPage: false };

        const reviewCards = reviewsContainer.querySelectorAll('.review-card');

        const reviews = Array.from(reviewCards).map(card => {
          const getText = selector => {
            const el = card.querySelector(selector);
            return el ? el.textContent.trim() : null;
          };
          const date = getText('div.d-lg-flex > div > div.fs-5.text-neutral-90.mb-2');
          const reviewerName = getText('div.fw-600.mb-1');
          const title = getText('h3.fs-3.fw-bold').replace(/"/g, ' ');
          const rating = (() => {
            const ratingSpan = card.querySelector('.star-rating-component .ms-1');
            return ratingSpan ? ratingSpan.textContent.trim() : null;
          })();
          const description = getText('div.fs-4.lh-2.text-neutral-99 > span');
          return { reviewerName, date, title, rating, description };
        });

        const nextLi = document.evaluate(
          '/html/body/main/div[6]/div/ul/li[12]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        let hasNextPage = false;
        if (nextLi) {
          const classList = nextLi.className.split(' ').map(c => c.trim());
          hasNextPage = !(
            classList.includes('page-item') &&
            classList.includes('disabled') &&
            classList.includes('next')
          );
        }
        return { reviews, hasNextPage };
      });

      if (!reviews || reviews.length === 0) break;

      const validReviews = reviews.filter(({ date }) => inDateRange(date, start_date, end_date));
      allReviews.push(...validReviews);

      if (!hasNextPage) break;
      pageNumber++;
    }
    await scrapper.close();

    return allReviews;
  } catch (error) {
    console.error(error);
  }
};

export default getReviews;
