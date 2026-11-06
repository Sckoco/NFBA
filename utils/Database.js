const mysql = require('mysql2/promise');
const config = require('../config');
const Logger = require('./Logger');
const formatString = require('./QueryUtils');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database
});

/**
 * Runs a prepared statement. Every query goes through here so logging stays consistent.
 * Queries are only logged in development, because their values contain user IDs.
 * @returns {Promise<Array|import('mysql2').ResultSetHeader>} rows for SELECT, the ResultSetHeader otherwise
 */
async function execute(sql, params = []) {
  if (config.isDevelopment) Logger.database(formatString(sql, params));
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = { pool, execute };
