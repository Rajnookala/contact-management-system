const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // This should use the DATABASE_URL from .env.local
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
