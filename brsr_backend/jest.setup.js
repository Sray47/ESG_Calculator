// jest.setup.js
const { pool } = require('./db'); // Adjust path as necessary

afterAll(async () => {
  await pool.end();
});
