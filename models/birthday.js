const { execute } = require('../utils/Database');

class Birthday {
  constructor(userID, day, month) {
    this.user_id = userID;
    this.day = day;
    this.month = month;
  }

  save() {
    return execute('INSERT INTO birthdays (user_id, day, month) VALUES (?, ?, ?)', [
      this.user_id,
      this.day,
      this.month
    ]);
  }

  static async getMemberBirthday(userID) {
    const rows = await execute('SELECT * FROM birthdays WHERE user_id = ?', [userID]);
    return rows[0];
  }

  /** @param {{ day: number, month: number }[]} dates at least one date */
  static getBirthdaysByDates(dates) {
    const conditions = dates.map(() => '(day = ? AND month = ?)').join(' OR ');
    const params = dates.flatMap(({ day, month }) => [day, month]);
    return execute(`SELECT * FROM birthdays WHERE ${conditions}`, params);
  }

  static getAllBirthdays() {
    return execute('SELECT * FROM birthdays ORDER BY month, day');
  }

  /** @returns {Promise<import('mysql2').ResultSetHeader>} check `affectedRows` to know if a row was updated */
  static updateBirthday(userID, day, month) {
    return execute('UPDATE birthdays SET day = ?, month = ? WHERE user_id = ?', [day, month, userID]);
  }

  /** @returns {Promise<import('mysql2').ResultSetHeader>} check `affectedRows` to know if a row was deleted */
  static removeBirthday(userID) {
    return execute('DELETE FROM birthdays WHERE user_id = ?', [userID]);
  }
}

module.exports = Birthday;
