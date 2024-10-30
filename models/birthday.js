const pool = require('../utils/Database');
const Logger = require('./../utils/Logger');
const formatString = require('./../utils/QueryUtils');

class Birthday {
  constructor(userID, date) {
    this.user_id = userID;
    this.date = date;
  }

  save() {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO birthdays (user_id, date) VALUES (?, ?)';
      Logger.database(formatString(query, this.user_id, this.date));
      Logger
      pool.query(query, [this.user_id, this.date], (err, results) => {
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
      Logger.database(formatString(query, userID));
      pool.query(query, [userID], (err, results) => {
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
      Logger.database(formatString(query, date));
      pool.query(query, [date], (err, results) => {
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
      Logger.database(query);
      pool.query(query, (err, results) => {
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
      Logger.database(query, newDate, userID);
      pool.query(query, [newDate, userID], (err, results) => {
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
      Logger.database(query, userID);
      pool.query(query, [userID], (err, results) => {
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