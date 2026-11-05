// Maximum number of days per month. February allows 29 so that leap-day birthdays can be stored.
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const BIRTHDAY_PATTERN = /^(\d{1,2})\/(\d{1,2})$/;

// Parses a birthday written as D/M or DD/MM. Returns { day, month }, or null if the input is not a real date.
function parseBirthday(input) {
  if (typeof input !== 'string') return null;

  const match = BIRTHDAY_PATTERN.exec(input.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return null;

  return { day, month };
}

// Formats { day, month } as a zero-padded DD/MM string, the format stored in the database.
function formatBirthday({ day, month }) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

module.exports = { parseBirthday, formatBirthday };
