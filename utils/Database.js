const mysql = require('mysql2');
const config = require('../config');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database
});

module.exports = pool;
