import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../src/server/app';
import { routeComplaint } from '../../src/server/services/routing';

describe('Deterministic Routing Table', () => {
  it('routes potholes in Central Metro to Roads and Public Works', async () => {
    const roadsCategory = await prisma.category.findUnique({ where: { code: 'ROADS' } });
    const centralArea = await prisma.serviceArea.findUnique({ where: { code: 'CENTRAL' } });
    const roadsDept = await prisma.department.findUnique({ where: { code: 'ROADS' } });

    assert.ok(roadsCategory);
    assert.ok(centralArea);
    assert.ok(roadsDept);

    const result = await routeComplaint(prisma, roadsCategory.id, centralArea.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.departmentId, roadsDept.id);
    assert.strictEqual(result.requiresReview, false);
  });

  it('routes streetlights in West Hills to Electrical / Streetlighting', async () => {
    const lightCategory = await prisma.category.findUnique({ where: { code: 'STREETLIGHTS' } });
    const westArea = await prisma.serviceArea.findUnique({ where: { code: 'WEST' } });
    const elecDept = await prisma.department.findUnique({ where: { code: 'ELECTRICAL' } });

    assert.ok(lightCategory);
    assert.ok(westArea);
    assert.ok(elecDept);

    const result = await routeComplaint(prisma, lightCategory.id, westArea.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.departmentId, elecDept.id);
    assert.strictEqual(result.requiresReview, false);
  });

  it('sends "Other / uncertain" complaints to Manual Review queue without guessing a department', async () => {
    const otherCategory = await prisma.category.findUnique({ where: { code: 'OTHER' } });
    const northArea = await prisma.serviceArea.findUnique({ where: { code: 'NORTH' } });

    assert.ok(otherCategory);
    assert.ok(northArea);

    const result = await routeComplaint(prisma, otherCategory.id, northArea.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.departmentId, null);
    assert.strictEqual(result.requiresReview, true);
    assert.match(result.reason || '', /Other \/ uncertain/);
  });

  it('sends unmapped or missing routing pairs to Manual Review queue', async () => {
    const northArea = await prisma.serviceArea.findUnique({ where: { code: 'NORTH' } });
    assert.ok(northArea);

    // Pass null category
    const result = await routeComplaint(prisma, null, northArea.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.departmentId, null);
    assert.strictEqual(result.requiresReview, true);
  });
});
