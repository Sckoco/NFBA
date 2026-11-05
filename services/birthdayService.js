const { Birthday } = require('../models');
const Logger = require('../utils/Logger');
const { birthdaysCelebratedOn } = require('../utils/date');

async function getMemberBirthday(member) {
  try {
    const birthday = await Birthday.getMemberBirthday(member.id);
    return birthday;
  } catch (err) {
    Logger.error(`Error retrieving birtday - ${err}`);
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
    Logger.error(`Error saving birthday - ${err}`);
    throw err;
  }
}

async function updateBirthday(member, { day, month }) {
  return Birthday.updateBirthday(member.id, day, month)
    .then(() => Logger.client(`Birthday updated! (${member.user.username} - ${member.id})`))
    .catch((err) => {
      Logger.error(`Error updating birthday - ${err}`);
      throw err;
    });
}

async function removeBirthday(member) {
  return Birthday.removeBirthday(member.id)
    .then(() => Logger.client(`Birthday deleted! (${member.user.username} - ${member.id})`))
    .catch((err) => {
      Logger.error(`Error deleting birthday - ${err}`);
      throw err;
    });
}

async function getAllBirthdays() {
  try {
    const birthdays = await Birthday.getAllBirthdays();
    return birthdays;
  } catch (err) {
    Logger.error(`Error retrieving all birthdays - ${err}`);
    throw err;
  }
}

// Returns the birthdays to celebrate on a calendar date ({ day, month, year }), including the 29/02 rule.
async function getBirthdaysCelebratedOn(date) {
  try {
    const birthdays = await Birthday.getBirthdaysByDates(birthdaysCelebratedOn(date));
    return birthdays;
  } catch (err) {
    Logger.error(`Error retrieving birthdays by date - ${err}`);
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
