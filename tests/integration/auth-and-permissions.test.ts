import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/server/app';

const app = createApp();

describe('Auth & Permission Access Controls', () => {
  it('allows citizen registration and strictly assigns CITIZEN role', async () => {
    const uniqueEmail = `test.citizen.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Citizen',
        email: uniqueEmail,
        password: 'Password123!',
        role: 'ADMIN', // Attacker attempts privilege escalation in payload
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.role, 'CITIZEN', 'Registration must ignore role and force CITIZEN');
  });

  it('rejects registration with invalid or duplicate email', async () => {
    // Duplicate email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Duplicate',
        email: 'citizen.jane@example.com', // Seeded email
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  it('logs in valid user and returns HTTP-only session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen.jane@example.com',
        password: 'Citizen123!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, 'citizen.jane@example.com');
    assert.strictEqual(res.body.data.user.passwordHash, undefined, 'Must never leak password hash');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies && cookies.length > 0);
    assert.match(cookies[0], /civic_session=/);
    assert.match(cookies[0], /HttpOnly/i);
  });

  it('blocks unauthenticated access to complaints API', async () => {
    const res = await request(app).get('/api/complaints');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('enforces department isolation: staff cannot view complaints from another department', async () => {
    // 1. Login as Electrical Staff (Sophia Chen)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff.electrical@civicresolve.gov',
        password: 'Staff123!',
      });
    const cookie = loginRes.headers['set-cookie'];

    // 2. Query complaints list
    const listRes = await request(app)
      .get('/api/complaints')
      .set('Cookie', cookie);

    assert.strictEqual(listRes.status, 200);
    // Every complaint returned must belong to Electrical department!
    for (const c of listRes.body.data.items) {
      assert.strictEqual(c.department?.code, 'ELECTRICAL');
    }

    // 3. Attempt to directly access a Roads complaint (CR-2026-0002)
    // First find CR-2026-0002
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@civicresolve.gov',
        password: 'Admin123!',
      });
    const adminCookie = adminLogin.headers['set-cookie'];

    const adminQuery = await request(app)
      .get('/api/complaints?search=CR-2026-0002')
      .set('Cookie', adminCookie);

    const roadsComplaint = adminQuery.body.data.items[0];
    assert.ok(roadsComplaint);

    // Electrical staff tries to view Roads complaint details:
    const forbiddenRes = await request(app)
      .get(`/api/complaints/${roadsComplaint.id}`)
      .set('Cookie', cookie);

    assert.strictEqual(forbiddenRes.status, 403, 'Cross-department access must be forbidden with 403');
  });

  it('forbids citizens from accessing administrator review endpoints', async () => {
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen.jane@example.com',
        password: 'Citizen123!',
      });
    const citizenCookie = citizenLogin.headers['set-cookie'];

    const adminEndpoint = await request(app)
      .get('/api/admin/users')
      .set('Cookie', citizenCookie);

    assert.strictEqual(adminEndpoint.status, 403);
  });
});
