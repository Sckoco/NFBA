const db = require('../utils/Database');

class Birthday {
  constructor(userID, date) {
    this.user_id = userID;
    this.date = date;
  }

  save() {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO birthdays (user_id, date) VALUES (?, ?)';
      db.query(query, [this.user_id, this.date], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static getMemberBirthday(userID) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM birthdays WHERE user_id = ?';
      db.query(query, [userID], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  static getBirthdayByDate(date) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * from birthdays WHERE date = ?';
      db.query(query, [date], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static getAllBirthdays() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * from birthdays';
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static updateBirthday(userID, newDate) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE birthdays SET date = ? WHERE user_id = ?';
      db.query(query, [newDate, userID], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  static removeBirthday(userID) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM birthdays WHERE user_id = ?';
      db.query(query, [userID], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = Birthday;