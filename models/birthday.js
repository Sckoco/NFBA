const mongoose = require('mongoose');

const birthdaySchema = mongoose.Schema({
  userID: String,
  date: String
});

module.exports = mongoose.model('Birthday', birthdaySchema);