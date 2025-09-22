import scrapper from './index.js';

const BASE_URL = 'https://www.capterra.in';
const XPath = '/html/body/main/div[4]';

const inDateRange = (date, start_date, end_date) => {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  const [day, month, year] = date.trim().split(' ');
  const d = new Date(year, months[month], day).getTime();
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
    const productUrl = await scrapper.getProductUrl(name, `${BASE_URL}/search/product`, XPath);
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
          const authorName = getText('div.fw-600.mb-1');
          const title = getText('h3.fs-3.fw-bold').replace(/"/g, ' ');
          const rating = (() => {
            const ratingSpan = card.querySelector('.star-rating-component .ms-1');
            return ratingSpan ? ratingSpan.textContent.trim() : null;
          })();
          const overallFeedback = getText('div.fs-4.lh-2.text-neutral-99 > span')?.trim();
          const positiveFeedback = getText('div.my-3.my-lg-4 > div.fs-4.lh-2.text-neutral-99');
          const negativeFeedback = getText('div.mb-3.mb-lg-4 > div.fs-4.lh-2.text-neutral-99');
          return {
            authorName,
            date,
            title,
            rating,
            overallFeedback,
            positiveFeedback,
            negativeFeedback,
          };
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
    return allReviews;
  } catch (error) {
    console.error(error);
  }
};

export default getReviews;
