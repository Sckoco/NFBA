const mysql = require('mysql2');
const Logger = require('./../utils/Logger');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) throw err;
  Logger.client('Connected to the database!');
});

module.exports = connection;