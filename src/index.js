import 'dotenv/config';
import inputs from "../input.json" with { type: 'json'};
import capterra from './scrapper/capterra.js';
import browser from './scrapper/index.js';
import g2 from './scrapper/g2.js';
import { writeFileSync } from 'fs';
import { notValidInput } from './utils/index.js';

const sources = {
  capterra,
  g2,
};

const init = async () => {
  try {
    const output = [];
    await browser.init();
    for (const input of inputs) {
      if (!notValidInput(input)) continue;
      const { name, start_date, end_date, source } = input;
      const result = await sources[source](name, start_date, end_date);
      output.push(result);
    }
    writeFileSync('output.json', JSON.stringify(output, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await browser?.close();
  };
};

init();
