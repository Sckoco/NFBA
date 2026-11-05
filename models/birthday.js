const { execute } = require('../utils/Database');

class Birthday {
  constructor(userID, date) {
    this.user_id = userID;
    this.date = date;
  }

  save() {
    return execute('INSERT INTO birthdays (user_id, date) VALUES (?, ?)', [this.user_id, this.date]);
  }

  static async getMemberBirthday(userID) {
    const rows = await execute('SELECT * FROM birthdays WHERE user_id = ?', [userID]);
    return rows[0];
  }

  static getBirthdayByDate(date) {
    return execute('SELECT * FROM birthdays WHERE date = ?', [date]);
  }

  static getAllBirthdays() {
    return execute('SELECT * FROM birthdays');
  }

  /** @returns {Promise<import('mysql2').ResultSetHeader>} check `affectedRows` to know if a row was updated */
  static updateBirthday(userID, newDate) {
    return execute('UPDATE birthdays SET date = ? WHERE user_id = ?', [newDate, userID]);
  }

  /** @returns {Promise<import('mysql2').ResultSetHeader>} check `affectedRows` to know if a row was deleted */
  static removeBirthday(userID) {
    return execute('DELETE FROM birthdays WHERE user_id = ?', [userID]);
  }
}

module.exports = Birthday;
