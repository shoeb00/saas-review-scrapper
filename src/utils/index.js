const isValidateDate = date => {
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getTime() > Date.now() || d.getTime() < new Date(null).getTime())
    throw new Error(`Invalid date ${date}`);
  return true;
};

const validateDates = (start_date, end_date) => {
  const start = isValidateDate(start_date);
  const end = isValidateDate(end_date);
  if (start < end) throw new Error(`Start date ${start_date} is greater than end date ${end_date}`);
};

export const notValidInput = input => {
  try {
    Object.entries(input).forEach(([key, value]) => {
      if (!value)
        throw new Error(`Input '${key}' is missing, skipping input ${JSON.stringify(input)}`);
    });
    input.source = input.source?.toLowerCase();
    const { start_date, end_date, source } = input;
    validateDates(start_date, end_date);
    const SUPPORTED_SOURCES = process.env.SUPPORTED_SOURCES.split(',');
    if (!SUPPORTED_SOURCES.includes(source)) {
      throw new Error(`Source '${source}' is not supported`);
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
