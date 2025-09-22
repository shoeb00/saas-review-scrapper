import scrapper from './index.js';

const BASE_URL = 'https://www.g2.com';
const XPath = '/html/body/div[6]/div/div[1]/div/div[7]/div/div[2]/div[4]/div[1]/section/div/div/div/div[1]';

const getReviews = async (name, start_date, end_date) => {
  try {
    const productUrl = await getProductUrl(name, `${BASE_URL}/search`, XPath);
    if (!productUrl) {
      console.error('Product URL not found');
      return null;
    }

    const url = new URL(productUrl);

    let pageNumber = 1;
    const allReviews = [];
    const LIMIT = process.env.PAGINATION_LIMIT || 2;

    while (pageNumber <= LIMIT) {
      url.searchParams.set('page', pageNumber);
      const page = await scrapper.goto(url.href);

      const { reviews, hasNextPage } = await page.evaluate(() => {
        const reviewsContainer = document.evaluate(
          '/html/body/div[6]/div/div[1]/div/div[7]/div[2]/div/div/main/section[2]/div/turbo-frame/div[3]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!reviewsContainer) return { reviews: [], hasNextPage: false };

        const reviewBlocks = Array.from(reviewsContainer.children);

        const reviews = reviewBlocks.map(review => {
          const getXPathValue = (xpath, attr) => {
            const el = document.evaluate(
              xpath,
              review,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
            if (!el) return null;
            if (attr) return el.getAttribute(attr);
            return el.textContent ? el.textContent.trim() : null;
          };

          const authorName = getXPathValue(
            './div[1]/div[1]/article/div[1]/div[1]/div[1]/div/div[1]/meta',
            'content'
          );
          const title = getXPathValue('./div[1]/div[1]/article/div[2]/div[1]/div');
          const rating = getXPathValue(
            './div[1]/div[1]/article/div[2]/div[2]/div[1]/div/div/div[1]/label'
          );
          const likedSection = document.evaluate(
            './div[1]/div[1]/article/div[2]/div[2]/section[1]',
            review,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          const reviewLiked = likedSection
            ? Array.from(likedSection.querySelectorAll('p'))
                .map(p => p.textContent.trim())
                .join('\n')
            : null;
          const dislikedSection = document.evaluate(
            './div[1]/div[1]/article/div[2]/div[2]/section[2]',
            review,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          const reviewDisliked = dislikedSection
            ? Array.from(dislikedSection.querySelectorAll('p'))
                .map(p => p.textContent.trim())
                .join('\n')
            : null;
          const date = getXPathValue('./div[1]/div[1]/article/div[1]/div[1]/div[2]/span/label');

          return {
            authorName,
            title,
            rating,
            reviewLiked,
            reviewDisliked,
            date,
          };
        });

        const nextAnchor = document.evaluate(
          '/html/body/div[8]/div/div[1]/div/div[7]/div[2]/div/div/main/section[2]/div/turbo-frame/div[3]/div/div[11]/ul/li[10]/a',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        const hasNextPage = !!nextAnchor;

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
