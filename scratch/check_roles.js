require('dotenv').config({ path: './.env' });
const { Client } = require('pg');

async function checkRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT DISTINCT role FROM "User"');
    console.log('--- ROLES IN DB ---');
    console.log(res.rows.map(r => r.role));
    console.log('-------------------');
  } catch (err) {
    console.error('DB Check Error:', err);
  } finally {
    await client.end();
  }
}

checkRoles();
