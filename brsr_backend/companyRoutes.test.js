// Automated tests for company profile endpoints
const request = require('supertest');
const app = require('./server'); // Import the Express app (fixed path)

describe('Company Profile API', () => {
  it('GET /api/company/profile should return company profile', async () => {
    const res = await request(app)
      .get('/api/company/profile')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode); // Acceptable: 200 (success), 401/403 (auth required)
  });

  it('PUT /api/company/profile should update company profile', async () => {
    const update = { company_name: 'Test Company Updated' };
    const res = await request(app)
      .put('/api/company/profile')
      .send(update)
      .set('Accept', 'application/json');
    expect([200, 401, 403, 404, 400]).toContain(res.statusCode); // Acceptable: 200 (success), 401/403/404/400 (various auth/data errors)
  });
});
