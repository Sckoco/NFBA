const { Birthday } = require('../models');
const { client } = require('./Logger');

module.exports = client => {
  client.getMemberBirthday = async member => {
    const birthdayData = await Birthday.findOne({ userID: member.id });
    return birthdayData;
  }

  client.createBirthday = async (member, date) => {
    const createBirthday = new Birthday({ userID: member.id, date: date });
    createBirthday.save().then(g => console.log(`Nouvel anniversaire (${g.id})`));
  }

  client.updateBirthday = async (member, settings) => {
    let birthdayData = await client.getMemberBirthday(member);
    if (typeof birthdayData != 'object') birthdayData = {};
    for (const key in settings) {
      if (birthdayData[key] != settings[key]) birthdayData[key] = settings[key];
    }
    console.log(`Anniversaire modifié ${member.user.tag}`);
    return birthdayData.updateOne(settings);
  }
  
  client.removeBirthday = async member => {
    await Birthday.deleteOne({ userID: member.id });
    console.log(`Anniversaire supprimé ${member.user.tag}`);
  } 

  client.getAllBirthdays = async () => {
    const birthdaysData = await Birthday.find();
    return birthdaysData;
  }
}