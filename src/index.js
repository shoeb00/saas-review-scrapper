import 'dotenv/config';
import inputs from "../input.json" with { type: 'json'};
import { writeFileSync } from 'fs';
import capterra from './scrapper/capterra.js';
import { notValidInput } from './utils/index.js';

const scrapper = {
  capterra,
};

const init = async () => {
  try {
    const output = [];
    for (const input of inputs) {
      if (!notValidInput(input)) continue;
      const { name, start_date, end_date, source } = input;
      const result = await scrapper[source](name, start_date, end_date);
      output.push(result);
    }
    writeFileSync('output.json', JSON.stringify(output, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

init();
