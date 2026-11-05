const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseBirthday, formatBirthday, isLeapYear, birthdaysCelebratedOn } = require('../utils/date');

describe('parseBirthday', () => {
  it('accepts DD/MM', () => {
    assert.deepEqual(parseBirthday('05/03'), { day: 5, month: 3 });
    assert.deepEqual(parseBirthday('31/12'), { day: 31, month: 12 });
  });

  it('accepts D/M and mixed forms', () => {
    assert.deepEqual(parseBirthday('1/3'), { day: 1, month: 3 });
    assert.deepEqual(parseBirthday('1/03'), { day: 1, month: 3 });
    assert.deepEqual(parseBirthday('01/3'), { day: 1, month: 3 });
  });

  it('ignores surrounding whitespace', () => {
    assert.deepEqual(parseBirthday('  14/07 '), { day: 14, month: 7 });
  });

  it('accepts 29/02', () => {
    assert.deepEqual(parseBirthday('29/02'), { day: 29, month: 2 });
  });

  it('accepts the last day of every month', () => {
    const lastDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    lastDays.forEach((day, i) => {
      assert.deepEqual(parseBirthday(`${day}/${i + 1}`), { day, month: i + 1 });
    });
  });

  it('rejects days that do not exist in the month', () => {
    for (const input of ['30/02', '31/04', '31/06', '31/09', '31/11', '32/01']) {
      assert.equal(parseBirthday(input), null, input);
    }
  });

  it('rejects day or month out of range', () => {
    for (const input of ['0/1', '00/01', '1/0', '1/13', '32/13']) {
      assert.equal(parseBirthday(input), null, input);
    }
  });

  it('rejects malformed input', () => {
    const inputs = ['abc', '', '/', '1/', '/1', '1-3', '1.3', '1/3/2000', '001/01', '01/001', '1 / 3', '-1/3', '1/3a'];
    for (const input of inputs) {
      assert.equal(parseBirthday(input), null, JSON.stringify(input));
    }
  });

  it('rejects non-string input', () => {
    for (const input of [undefined, null, 13, { day: 1, month: 3 }]) {
      assert.equal(parseBirthday(input), null);
    }
  });
});

describe('formatBirthday', () => {
  it('zero-pads day and month', () => {
    assert.equal(formatBirthday({ day: 1, month: 3 }), '01/03');
    assert.equal(formatBirthday({ day: 29, month: 2 }), '29/02');
    assert.equal(formatBirthday({ day: 31, month: 12 }), '31/12');
  });

  it('round-trips with parseBirthday', () => {
    assert.equal(formatBirthday(parseBirthday('1/3')), '01/03');
  });
});

describe('isLeapYear', () => {
  it('follows the Gregorian rules', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2026), false);
    assert.equal(isLeapYear(1900), false);
    assert.equal(isLeapYear(2000), true);
  });
});

describe('birthdaysCelebratedOn (29/02 rule)', () => {
  it('celebrates 29/02 birthdays on 28/02 in a non-leap year', () => {
    assert.deepEqual(birthdaysCelebratedOn({ day: 28, month: 2, year: 2026 }), [
      { day: 28, month: 2 },
      { day: 29, month: 2 }
    ]);
    assert.deepEqual(birthdaysCelebratedOn({ day: 28, month: 2, year: 1900 }), [
      { day: 28, month: 2 },
      { day: 29, month: 2 }
    ]);
  });

  it('celebrates only 28/02 on 28/02 in a leap year', () => {
    assert.deepEqual(birthdaysCelebratedOn({ day: 28, month: 2, year: 2024 }), [{ day: 28, month: 2 }]);
    assert.deepEqual(birthdaysCelebratedOn({ day: 28, month: 2, year: 2000 }), [{ day: 28, month: 2 }]);
  });

  it('celebrates 29/02 on 29/02 in a leap year', () => {
    assert.deepEqual(birthdaysCelebratedOn({ day: 29, month: 2, year: 2024 }), [{ day: 29, month: 2 }]);
  });

  it('does not move 29/02 birthdays to 01/03', () => {
    assert.deepEqual(birthdaysCelebratedOn({ day: 1, month: 3, year: 2026 }), [{ day: 1, month: 3 }]);
  });

  it('returns only the date itself on other days', () => {
    assert.deepEqual(birthdaysCelebratedOn({ day: 15, month: 8, year: 2026 }), [{ day: 15, month: 8 }]);
  });
});
