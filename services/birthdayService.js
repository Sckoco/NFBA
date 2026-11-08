const { Birthday } = require('../models');
const Logger = require('../utils/Logger');
const { birthdaysCelebratedOn } = require('../utils/date');

async function getMemberBirthday(member) {
  try {
    const birthday = await Birthday.getMemberBirthday(member.id);
    return birthday;
  } catch (err) {
    Logger.error(`Error retrieving birthday:\n${err?.stack ?? err}`);
    throw err;
  }
}

// Inserts directly and relies on the primary key on user_id, so concurrent calls cannot create duplicates.
// Returns true if the birthday was created, false if the user already has one.
async function createBirthday(user, { day, month }) {
  try {
    await new Birthday(user.id, day, month).save();
    Logger.client(`Birthday saved! (${user.username} - ${user.id})`);
    return true;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      Logger.warn(`Birthday already exists (${user.username} - ${user.id})`);
      return false;
    }
    Logger.error(`Error saving birthday:\n${err?.stack ?? err}`);
    throw err;
  }
}

// Returns true if the birthday was updated, false if the user has no birthday registered.
// mysql2 enables FOUND_ROWS by default, so affectedRows counts matched rows: setting the same date again still returns true.
async function updateBirthday(user, { day, month }) {
  try {
    const { affectedRows } = await Birthday.updateBirthday(user.id, day, month);
    if (affectedRows === 0) {
      Logger.warn(`No birthday to update (${user.username} - ${user.id})`);
      return false;
    }
    Logger.client(`Birthday updated! (${user.username} - ${user.id})`);
    return true;
  } catch (err) {
    Logger.error(`Error updating birthday:\n${err?.stack ?? err}`);
    throw err;
  }
}

// Returns true if the birthday was deleted, false if the user has no birthday registered.
async function removeBirthday(user) {
  try {
    const { affectedRows } = await Birthday.removeBirthday(user.id);
    if (affectedRows === 0) {
      Logger.warn(`No birthday to delete (${user.username} - ${user.id})`);
      return false;
    }
    Logger.client(`Birthday deleted! (${user.username} - ${user.id})`);
    return true;
  } catch (err) {
    Logger.error(`Error deleting birthday:\n${err?.stack ?? err}`);
    throw err;
  }
}

async function getAllBirthdays() {
  try {
    const birthdays = await Birthday.getAllBirthdays();
    return birthdays;
  } catch (err) {
    Logger.error(`Error retrieving all birthdays:\n${err?.stack ?? err}`);
    throw err;
  }
}

// Returns the birthdays to celebrate on a calendar date ({ day, month, year }), including the 29/02 rule.
async function getBirthdaysCelebratedOn(date) {
  try {
    const birthdays = await Birthday.getBirthdaysByDates(birthdaysCelebratedOn(date));
    return birthdays;
  } catch (err) {
    Logger.error(`Error retrieving birthdays by date:\n${err?.stack ?? err}`);
    throw err;
  }
}

module.exports = {
  getMemberBirthday,
  createBirthday,
  updateBirthday,
  removeBirthday,
  getAllBirthdays,
  getBirthdaysCelebratedOn
};
