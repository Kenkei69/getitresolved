import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp, prisma } from '../../src/server/app';

const app = createApp();

describe('Complaint Lifecycle & Auditing Journey', () => {
  it('executes full journey: Citizen submission -> Routing -> Staff Progress -> Resolution', async () => {
    // 1. Citizen logs in
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen.jane@example.com', password: 'Citizen123!' });
    const citizenCookie = citizenLogin.headers['set-cookie'];

    // Get a service area ID (North District)
    const northArea = await prisma.serviceArea.findUnique({ where: { code: 'NORTH' } });
    assert.ok(northArea);

    // 2. Citizen submits streetlight complaint
    const testId = Date.now();
    const submitRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', citizenCookie)
      .send({
        title: `Broken streetlight on Pine Avenue ${testId}`,
        description: 'The pole lamp post is completely dark at night and light bulb is shattered.',
        address: `104 Pine Avenue #${testId}`,
        serviceAreaId: northArea.id,
      });

    assert.strictEqual(submitRes.status, 201);
    const complaint = submitRes.body.data;
    assert.ok(complaint.reference.startsWith('CR-'));
    assert.strictEqual(complaint.category.code, 'STREETLIGHTS');
    assert.strictEqual(complaint.department.code, 'ELECTRICAL');
    assert.strictEqual(complaint.status, 'ASSIGNED');
    assert.strictEqual(complaint.reviewState, 'NOT_REQUIRED');

    // 3. Electrical Staff logs in
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.electrical@civicresolve.gov', password: 'Staff123!' });
    const staffCookie = staffLogin.headers['set-cookie'];

    // Staff sees complaint in queue
    const staffList = await request(app)
      .get(`/api/complaints?search=${complaint.reference}`)
      .set('Cookie', staffCookie);
    assert.strictEqual(staffList.status, 200);
    assert.strictEqual(staffList.body.data.items.length, 1);

    // 4. Staff moves complaint to IN_PROGRESS
    const progressRes = await request(app)
      .patch(`/api/complaints/${complaint.id}/status`)
      .set('Cookie', staffCookie)
      .send({
        toStatus: 'IN_PROGRESS',
        note: 'Electrician dispatch team assigned to replace bulb fixture.',
      });
    assert.strictEqual(progressRes.status, 200);
    assert.strictEqual(progressRes.body.data.status, 'IN_PROGRESS');

    // 5. Staff attempts to resolve WITHOUT note -> Rejected!
    const badResolveRes = await request(app)
      .patch(`/api/complaints/${complaint.id}/status`)
      .set('Cookie', staffCookie)
      .send({
        toStatus: 'RESOLVED',
        note: '', // Missing required resolution note
      });
    assert.strictEqual(badResolveRes.status, 400);

    // 6. Staff resolves WITH detailed resolution note
    const resolveRes = await request(app)
      .patch(`/api/complaints/${complaint.id}/status`)
      .set('Cookie', staffCookie)
      .send({
        toStatus: 'RESOLVED',
        note: 'High-pressure sodium fixture replaced with new energy-efficient LED luminaire. Tested operational.',
      });
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.data.status, 'RESOLVED');
    assert.ok(resolveRes.body.data.resolvedAt);

    // 7. Citizen checks their complaint details -> verifies resolution and note are visible
    const citizenCheck = await request(app)
      .get(`/api/complaints/${complaint.id}`)
      .set('Cookie', citizenCookie);
    assert.strictEqual(citizenCheck.status, 200);
    assert.strictEqual(citizenCheck.body.data.status, 'RESOLVED');
    assert.match(citizenCheck.body.data.resolutionNote, /High-pressure sodium fixture replaced/);
  });

  it('allows administrator to complete manual review and assign department with audit record', async () => {
    // 1. Admin logs in
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@civicresolve.gov', password: 'Admin123!' });
    const adminCookie = adminLogin.headers['set-cookie'];

    // 2. Fetch manual review queue
    const reviewQueue = await request(app)
      .get('/api/complaints?reviewState=REQUIRED')
      .set('Cookie', adminCookie);
    assert.strictEqual(reviewQueue.status, 200);

    let pendingComplaint: any;
    if (reviewQueue.body.data.items.length === 0) {
      const northArea = await prisma.serviceArea.findFirst();
      const citizen = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
      pendingComplaint = await prisma.complaint.create({
        data: {
          reference: `CR-TEST-${Date.now()}`,
          title: 'Unclear ambiguous complaint needing review',
          description: 'Ambiguous civic issue requiring administrative manual review and assignment.',
          address: '100 Municipal Way',
          serviceAreaId: northArea!.id,
          citizenId: citizen!.id,
          reviewState: 'REQUIRED',
          status: 'SUBMITTED',
        },
      });
    } else {
      pendingComplaint = reviewQueue.body.data.items[0];
    }

    // Find Roads Category and Roads Department
    const roadsCategory = await prisma.category.findUnique({ where: { code: 'ROADS' } });
    const roadsDept = await prisma.department.findUnique({ where: { code: 'ROADS' } });
    assert.ok(roadsCategory);
    assert.ok(roadsDept);

    // 3. Admin submits manual review decision
    const decisionRes = await request(app)
      .post(`/api/complaints/${pendingComplaint.id}/manual-review`)
      .set('Cookie', adminCookie)
      .send({
        categoryId: roadsCategory.id,
        departmentId: roadsDept.id,
        notes: 'Reviewed site description: Civil road repairs required.',
      });

    assert.strictEqual(decisionRes.status, 200);
    assert.strictEqual(decisionRes.body.data.reviewState, 'APPROVED');
    assert.strictEqual(decisionRes.body.data.department.code, 'ROADS');
    assert.strictEqual(decisionRes.body.data.status, 'ASSIGNED');
  });

  it('allows administrator score override with required reason', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@civicresolve.gov', password: 'Admin123!' });
    const adminCookie = adminLogin.headers['set-cookie'];

    const roadsComplaint = await prisma.complaint.findFirst({
      where: { reference: 'CR-2026-0004' },
    });
    assert.ok(roadsComplaint);

    const overrideRes = await request(app)
      .post(`/api/complaints/${roadsComplaint.id}/override-scores`)
      .set('Cookie', adminCookie)
      .send({
        priority: 9.5,
        urgency: 9.0,
        feasibility: 8.0,
        reason: 'Emergency school evacuation route affected; manual priority upgrade.',
      });

    assert.strictEqual(overrideRes.status, 200);
    assert.strictEqual(overrideRes.body.data.scores.hasOverrides, true);
    assert.strictEqual(overrideRes.body.data.scores.effectivePriority, 9.5);
    assert.strictEqual(overrideRes.body.data.overrideReason, 'Emergency school evacuation route affected; manual priority upgrade.');
  });

  it('rejects status update with HTTP 409 when expectedStatus conflicts with current state', async () => {
    // 1. Staff logs in
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.electrical@civicresolve.gov', password: 'Staff123!' });
    const staffCookie = staffLogin.headers['set-cookie'];

    // Find an electrical complaint currently in ASSIGNED
    const comp = await prisma.complaint.findFirst({
      where: { department: { code: 'ELECTRICAL' }, status: 'ASSIGNED' },
    });
    assert.ok(comp);

    // 2. Client sends an update claiming expectedStatus was 'IN_PROGRESS' (stale client state)
    const conflictRes = await request(app)
      .patch(`/api/complaints/${comp.id}/status`)
      .set('Cookie', staffCookie)
      .send({
        toStatus: 'RESOLVED',
        note: 'Attempting to resolve based on stale status.',
        expectedStatus: 'IN_PROGRESS', // Mismatch! Actual is ASSIGNED
      });

    assert.strictEqual(conflictRes.status, 409);
    assert.strictEqual(conflictRes.body.code, 'CONFLICT');
    assert.match(conflictRes.body.error, /Conflict: This complaint status was updated/);
  });

  it('deduplicates rapid repeated complaint submissions within 60s from the same citizen', async () => {
    // 1. Citizen logs in
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen.jane@example.com', password: 'Citizen123!' });
    const citizenCookie = citizenLogin.headers['set-cookie'];

    const northArea = await prisma.serviceArea.findUnique({ where: { code: 'NORTH' } });
    assert.ok(northArea);

    const uniqueTitle = `Burst water pipe on Maple Lane ${Date.now()}`;
    const uniqueAddress = `55 Maple Lane Apt ${Math.floor(Math.random() * 900) + 100}`;

    // 2. First submission
    const firstRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', citizenCookie)
      .send({
        title: uniqueTitle,
        description: 'Water spraying rapidly onto the roadway and flooding sidewalk.',
        address: uniqueAddress,
        serviceAreaId: northArea.id,
      });

    assert.strictEqual(firstRes.status, 201);
    const firstComplaint = firstRes.body.data;

    // 3. Second immediate submission with identical title & address from same citizen
    const secondRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', citizenCookie)
      .send({
        title: uniqueTitle,
        description: 'Water spraying rapidly onto the roadway and flooding sidewalk.',
        address: uniqueAddress,
        serviceAreaId: northArea.id,
      });

    assert.strictEqual(secondRes.status, 200);
    assert.strictEqual(secondRes.body.isDuplicate, true);
    assert.strictEqual(secondRes.body.data.id, firstComplaint.id);
    assert.strictEqual(secondRes.body.data.reference, firstComplaint.reference);
  });
});
