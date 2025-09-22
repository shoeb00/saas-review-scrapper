````markdown
# SaaS Review Scraper (G2 + Capterra + Extensible)

A Puppeteer-based web scraper that extracts SaaS product reviews from **G2** and **Capterra** (with easy extension to more sources).  
It supports filtering reviews by **company name** and **time period**, and outputs structured JSON files.

![Demo of scraper browsing](https://drive.google.com/file/d/1tby9J1C9RU4yVoXg5z5p0YGSpy6t2gaO/view?usp=drive_link)
---

## ✨ Features
- Scrape reviews from:
  - [G2](https://www.g2.com)  
  - [Capterra](https://www.capterra.com)  
  - (Easily extensible to more SaaS review sites)
- Input-driven scraping via `input.json`
- Filters reviews by **start date** and **end date**
- Extracts:
  - `title`
  - `description` / review text
  - `date`
  - `reviewerName`
  - `rating`
- Handles **pagination** automatically
- Session persistence using cookies (reduces CAPTCHA issues)
- Graceful error handling (invalid product names, missing reviews, etc.)

---

## 📦 Requirements
- Node.js **>=18** **<23**
- Google Chrome installed (used instead of bundled Chromium for stealth)
- NPM for dependencies

---

## ⚙️ Setup

### 1. Clone & Install
```bash
git clone https://github.com/shoeb00/saas-review-scrapper.git
cd saas-review-scraper
npm install
````

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supported sources
SUPPORTED_SOURCES=capterra,g2

# Pagination limit per source (default: 2 pages)
PAGINATION_LIMIT=50

# Debugging (set to 'true' to save screenshots)
DEBUG=false

# Optional credentials for G2 login
G2_EMAIL=youremail@example.com
G2_PASSWORD=yourpassword
```

### 3. Input File

Define your scraping jobs in `input.json`:

```json
[
  {
    "name": "Amazon S3",
    "start_date": "2023-06-01",
    "end_date": "2023-12-30",
    "source": "Capterra"
  },
  {
    "name": "Amazon S3",
    "start_date": "2023-06-01",
    "end_date": "2023-12-30",
    "source": "G2"
  }
]
```

* `name`: Company/product name
* `start_date` / `end_date`: ISO date format (`YYYY-MM-DD`)
* `source`: `"g2"` or `"capterra"`


### 4. Session Cookies (Optional but Recommended)

Cookies make the scraper behave more like a real browser session and can help reduce CAPTCHA triggers and repeated prompts.

* **Login is still part of the code**:
  If `G2_EMAIL` and `G2_PASSWORD` are set in `.env`, the scraper will always attempt to log in.

* **Cookies act as a supplement**:
  If session cookies are available, they’ll be loaded before login to smooth the process.

#### Setup

1. Log in manually to G2 in your real browser.
2. Export cookies and save them in:

   ```
   cookies/g2.json
   ```
3. On the next run, the scraper will:

   * Load cookies
   * Attempt login using credentials

---

## ▶️ Usage

Run the scraper:

```bash
npm start
```

After execution, you’ll get:

```bash
output.json
```

### Example Output

```json
[
    {
        "reviewerName": "Shola",
        "date": "22 December 2023",
        "title": " Innovation at its best ",
        "rating": "5.0",
        "description": "When you are talking of a proper modern file storage and sharing, Amazon S3 is the first software that comes to mind."
    },
    {
        "reviewerName": "Judy",
        "date": "3 October 2023",
        "title": " Easy storage with Amazon S3 ",
        "rating": "5.0",
        "description": "An amazing software for those interested in cloud storage"
    }
]
```

---

## 📂 Project Structure

```
.
├── cookies
│   └── g2.json          # Session cookies for G2 (avoid login & CAPTCHA)
├── input.json           # Defines scraping jobs (company name, date range, source)
├── LICENSE              # License file
├── nodemon.json         # Nodemon config (for auto-reload in dev)
├── output.json          # Generated reviews in JSON format
├── package-lock.json
├── package.json
├── README.md
└── src
    ├── index.js         # Main entry point: loads inputs & runs scrapers
    ├── scrapper
    │   ├── capterra.js  # Logic to scrape reviews from Capterra
    │   ├── g2.js        # Logic to scrape reviews from G2
    │   └── index.js     # Shared Puppeteer browser/session management
    └── utils
        └── index.js     # Helper functions (e.g., input validation)

```

---

## 🛠️ Development Notes

* **Filtering**: `inDateRange()` ensures reviews fall within given `start_date` → `end_date`
* **Pagination**: Iterates over review pages until limit or last page
* **Extensibility**: To add a third source:

  * Create `src/scrapper/<source>.js`
  * Export a `getReviews(name, start_date, end_date)` function
  * Add it to the `sources` map in `src/index.js`
  * To enable the source add it to the `SUPPORTED_SOURCES` variable in `.env`

---

## ⚠️ Disclaimer

This project is for **educational purposes only**.
Scraping sites like G2 or Capterra may violate their Terms of Service.
Use responsibly and at your own risk.

