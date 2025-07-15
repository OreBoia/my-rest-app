const mysql = require('mysql2');

// Crea il pool di connessioni
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        // il tuo utente MySQL
  password: 'password', // la tua password MySQL
  database: 'todo_db'   // il database che userai
});

// Trasforma in promise per usare async/await
const db = pool.promise();

module.exports = db;
