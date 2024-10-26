const { Birthday } = require('../models');
const Logger = require('./Logger');

module.exports = client => {

  client.getMemberBirthday = async member => {
    try {
      const birthday = await Birthday.getMemberBirthday(member.id);
      return birthday;
    } catch (err) {
      Logger.error(`Error saving birtday: ${err}`)
    }
  }

  client.createBirthday = async (member, date) => {
    const newBirthday = new Birthday(member.id, date);
    newBirthday.save()
      .then(() => Logger.client(`Birthday saved! (${member.user.username} - ${member.id})`))
      .catch((err) => Logger.error(`Error saving birthday: ${err}`));
  }

  client.updateBirthday = async (member, date) => {
    Birthday.updateBirthday(member.id, date)
      .then(() => Logger.client(`Birthday updated! (${member.user.username} - ${member.id})`))
      .catch((err) => Logger.error(`Error updating birthday: ${err}`));
  }
  
  client.removeBirthday = async member => {
    Birthday.removeBirthday(member.id)
      .then(() => Logger.client(`Birthday deleted! (${member.user.username} - ${member.id})`))
      .catch((err) => Logger.error(`Error deleting birthday: ${err}`));
  } 

  client.getAllBirthdays = async () => {
    try {
      const birthdays = await Birthday.getAllBirthdays();
      return birthdays;
    } catch (err) {
      Logger.error(`Error retrieving all birthdays: ${err}`);
    }
  }

  client.getBirthdayByDate = async(date) => {
    try {
      const birthday = await Birthday.getBirthdayByDate(date);
      return birthday;
    } catch (err) {
      Logger.error(`Error retrieving birthday by date: ${err}`);
    }
  }
}