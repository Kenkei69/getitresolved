import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES, DEPARTMENTS, SERVICE_AREAS } from '../src/shared/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding for Getitresolved...');

  // 1. Seed Service Areas
  console.log('[Seed] Seeding service areas...');
  const areaMap: Record<string, string> = {};
  for (const area of SERVICE_AREAS) {
    const upserted = await prisma.serviceArea.upsert({
      where: { code: area.code },
      update: { name: area.name, description: area.description },
      create: { code: area.code, name: area.name, description: area.description },
    });
    areaMap[area.code] = upserted.id;
  }

  // 2. Seed Departments
  console.log('[Seed] Seeding departments...');
  const deptMap: Record<string, string> = {};
  for (const dept of DEPARTMENTS) {
    const upserted = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: { code: dept.code, name: dept.name, description: dept.description },
    });
    deptMap[dept.code] = upserted.id;
  }

  // 3. Seed Categories
  console.log('[Seed] Seeding categories...');
  const catMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const upserted = await prisma.category.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        description: cat.description,
        keywords: cat.defaultKeywords.join(', '),
      },
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        keywords: cat.defaultKeywords.join(', '),
      },
    });
    catMap[cat.code] = upserted.id;
  }

  // 4. Seed Configurable Routing Rules (Category + Service Area -> Department)
  console.log('[Seed] Seeding routing table rules...');
  const catToDeptMap: Record<string, string> = {
    ROADS: deptMap.ROADS,
    STREETLIGHTS: deptMap.ELECTRICAL,
    WATER: deptMap.WATER,
    DRAINAGE: deptMap.DRAINAGE,
    SANITATION: deptMap.SANITATION,
  };

  for (const [catCode, deptId] of Object.entries(catToDeptMap)) {
    const catId = catMap[catCode];
    if (!deptId || !catId) continue;

    for (const areaCode of Object.keys(areaMap)) {
      const areaId = areaMap[areaCode];
      await prisma.routingRule.upsert({
        where: {
          categoryId_serviceAreaId: {
            categoryId: catId,
            serviceAreaId: areaId,
          },
        },
        update: { departmentId: deptId },
        create: {
          categoryId: catId,
          serviceAreaId: areaId,
          departmentId: deptId,
        },
      });
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const shouldSeedDemo =
    process.env.SEED_DEMO_DATA === 'true' ||
    (!isProd && process.env.SEED_DEMO_DATA !== 'false');

  if (!shouldSeedDemo) {
    console.log('[Seed] Skipping demo users and dummy complaints (SEED_DEMO_DATA disabled or production).');
    
    // If ADMIN_EMAIL and ADMIN_PASSWORD are set, establish initial production admin
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log(`[Seed] Provisioning production administrator: ${process.env.ADMIN_EMAIL}...`);
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL },
        update: {
          name: process.env.ADMIN_NAME || 'Municipal Administrator',
          role: 'ADMIN',
          passwordHash: hash,
        },
        create: {
          email: process.env.ADMIN_EMAIL,
          name: process.env.ADMIN_NAME || 'Municipal Administrator',
          role: 'ADMIN',
          passwordHash: hash,
        },
      });
      console.log('[Seed] Production administrator account configured.');
    }

    console.log('[Seed] Essential system metadata seeded successfully.');
    return;
  }

  // 5. Seed Users (Demo Mode)
  console.log('[Seed] Seeding demo user accounts...');
  const passwordSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin123!', passwordSalt);
  const staffHash = await bcrypt.hash('Staff123!', passwordSalt);
  const citizenHash = await bcrypt.hash('Citizen123!', passwordSalt);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@civicresolve.gov' },
    update: { name: 'Elena Rostova (Admin)', role: 'ADMIN', passwordHash: adminHash },
    create: {
      email: 'admin@civicresolve.gov',
      name: 'Elena Rostova (Admin)',
      role: 'ADMIN',
      passwordHash: adminHash,
    },
  });

  // Department Staff (1 per department)
  const staffRoads = await prisma.user.upsert({
    where: { email: 'staff.roads@civicresolve.gov' },
    update: { name: 'Marcus Vance (Roads Staff)', role: 'STAFF', departmentId: deptMap.ROADS, passwordHash: staffHash },
    create: { email: 'staff.roads@civicresolve.gov', name: 'Marcus Vance (Roads Staff)', role: 'STAFF', departmentId: deptMap.ROADS, passwordHash: staffHash },
  });

  const staffElectrical = await prisma.user.upsert({
    where: { email: 'staff.electrical@civicresolve.gov' },
    update: { name: 'Sophia Chen (Electrical Staff)', role: 'STAFF', departmentId: deptMap.ELECTRICAL, passwordHash: staffHash },
    create: { email: 'staff.electrical@civicresolve.gov', name: 'Sophia Chen (Electrical Staff)', role: 'STAFF', departmentId: deptMap.ELECTRICAL, passwordHash: staffHash },
  });

  const staffWater = await prisma.user.upsert({
    where: { email: 'staff.water@civicresolve.gov' },
    update: { name: 'David Okafor (Water Staff)', role: 'STAFF', departmentId: deptMap.WATER, passwordHash: staffHash },
    create: { email: 'staff.water@civicresolve.gov', name: 'David Okafor (Water Staff)', role: 'STAFF', departmentId: deptMap.WATER, passwordHash: staffHash },
  });

  const staffDrainage = await prisma.user.upsert({
    where: { email: 'staff.drainage@civicresolve.gov' },
    update: { name: 'Amara Patel (Drainage Staff)', role: 'STAFF', departmentId: deptMap.DRAINAGE, passwordHash: staffHash },
    create: { email: 'staff.drainage@civicresolve.gov', name: 'Amara Patel (Drainage Staff)', role: 'STAFF', departmentId: deptMap.DRAINAGE, passwordHash: staffHash },
  });

  const staffSanitation = await prisma.user.upsert({
    where: { email: 'staff.sanitation@civicresolve.gov' },
    update: { name: 'Liam O’Connor (Sanitation Staff)', role: 'STAFF', departmentId: deptMap.SANITATION, passwordHash: staffHash },
    create: { email: 'staff.sanitation@civicresolve.gov', name: 'Liam O’Connor (Sanitation Staff)', role: 'STAFF', departmentId: deptMap.SANITATION, passwordHash: staffHash },
  });

  // Citizens
  const citizenJane = await prisma.user.upsert({
    where: { email: 'citizen.jane@example.com' },
    update: { name: 'Jane Doe', role: 'CITIZEN', passwordHash: citizenHash },
    create: { email: 'citizen.jane@example.com', name: 'Jane Doe', role: 'CITIZEN', passwordHash: citizenHash },
  });

  const citizenJohn = await prisma.user.upsert({
    where: { email: 'citizen.john@example.com' },
    update: { name: 'John Smith', role: 'CITIZEN', passwordHash: citizenHash },
    create: { email: 'citizen.john@example.com', name: 'John Smith', role: 'CITIZEN', passwordHash: citizenHash },
  });

  // 6. Seed Realistic Complaints
  console.log('[Seed] Seeding demonstration complaints with diverse lifecycles and stars...');

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const complaintsData = [
    // 1. Streetlights - Assigned (Jane) - Orange star (urgency > 7)
    {
      reference: 'CR-2026-0001',
      title: 'Dark intersection with broken streetlight on Elm & 4th',
      description: 'The overhead streetlight fixture has been completely out for three nights. The intersection is pitch dark and vehicles are narrowly missing pedestrians crossing from the transit stop.',
      address: 'Corner of Elm Street and 4th Avenue',
      serviceAreaId: areaMap.CENTRAL,
      categoryId: catMap.STREETLIGHTS,
      departmentId: deptMap.ELECTRICAL,
      citizenId: citizenJane.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'ai_analyzed',
      analysisVersion: 'v1.0',
      classificationConfidence: 0.94,
      aiRationale: 'Clear lighting outage creating pedestrian hazard at high-traffic intersection.',
      priority: 6.8, // <= 7, no red star
      urgency: 8.5,  // > 7, ORANGE STAR
      feasibility: 8.2, // > 7, GREEN STAR
      createdAt: daysAgo(4), // 4 days old -> durationScore = floor(4/3) = 1 (no pink star)
    },
    // 2. Roads - In Progress (John) - Red + Orange + Pink stars (> 7)
    {
      reference: 'CR-2026-0002',
      title: 'Deep asphalt crater causing tire damage on Westview Boulevard',
      description: 'Massive pothole approx 2.5 feet wide and 8 inches deep right in the right vehicular lane. Multiple cars have popped tires and swerved dangerously into oncoming traffic.',
      address: '742 Westview Boulevard near Hillside Overpass',
      serviceAreaId: areaMap.WEST,
      categoryId: catMap.ROADS,
      departmentId: deptMap.ROADS,
      citizenId: citizenJohn.id,
      status: 'IN_PROGRESS' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.96,
      aiRationale: 'Severe road pavement damage presenting active vehicular collision risk.',
      priority: 8.9, // > 7, RED STAR
      urgency: 8.4,  // > 7, ORANGE STAR
      feasibility: 6.2, // <= 7, no green star
      createdAt: daysAgo(25), // 25 days old -> floor(25/3) = 8 > 7, PINK STAR
    },
    // 3. Water - Resolved (Jane) - Frozen duration, resolution note
    {
      reference: 'CR-2026-0003',
      title: 'High-pressure water main burst flooding sidewalk and roadway',
      description: 'Treated municipal water is geysering from an underground joint onto the sidewalk, eroding the curb and flooding residential driveways.',
      address: '118 Harbor View Road',
      serviceAreaId: areaMap.HARBOR,
      categoryId: catMap.WATER,
      departmentId: deptMap.WATER,
      citizenId: citizenJane.id,
      status: 'RESOLVED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'ai_analyzed',
      analysisVersion: 'v1.0',
      classificationConfidence: 0.98,
      aiRationale: 'Critical water infrastructure rupture requiring emergency isolation and repair.',
      priority: 9.2, // > 7, RED STAR
      urgency: 9.5,  // > 7, ORANGE STAR
      feasibility: 5.0,
      createdAt: daysAgo(18),
      resolvedAt: daysAgo(2), // Resolved 2 days ago (age was 16 days -> durationScore = floor(16/3) = 5)
      resolutionNote: 'Water maintenance crew replaced damaged 6-inch ductile iron valve clamp. Water pressure restored and sidewalk backfilled.',
    },
    // 4. Drainage - Assigned (John) - Red Star (priority > 7), exactly 7.0 boundary test!
    {
      reference: 'CR-2026-0004',
      title: 'Storm drain clogged with storm debris causing street flooding',
      description: 'Heavy rain runoff has jammed the catch basin with tree limbs and plastic bags. Water is pooling up to 6 inches across the bicycle lane.',
      address: '320 South Market Street',
      serviceAreaId: areaMap.SOUTH,
      categoryId: catMap.DRAINAGE,
      departmentId: deptMap.DRAINAGE,
      citizenId: citizenJohn.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.91,
      aiRationale: 'Storm drainage obstruction preventing stormwater runoff clearance.',
      priority: 7.5, // > 7, RED STAR
      urgency: 7.0,  // EXACTLY 7.0 -> STRICT > 7 TEST: NO ORANGE STAR!
      feasibility: 7.0, // EXACTLY 7.0 -> NO GREEN STAR!
      createdAt: daysAgo(9), // 9 days -> floor(9/3) = 3 (no pink star)
    },
    // 5. Sanitation - In Progress (Jane) - Green Star (feasibility > 7)
    {
      reference: 'CR-2026-0005',
      title: 'Illegal commercial dumping of construction waste in public park alley',
      description: 'Piles of drywall, broken pallets, and roofing tiles dumped behind the park pavilion blocking emergency maintenance access.',
      address: 'Oakridge Community Park, North Service Gate',
      serviceAreaId: areaMap.NORTH,
      categoryId: catMap.SANITATION,
      departmentId: deptMap.SANITATION,
      citizenId: citizenJane.id,
      status: 'IN_PROGRESS' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.88,
      aiRationale: 'Commercial debris accumulation obstructing municipal park alley.',
      priority: 6.4,
      urgency: 5.5,
      feasibility: 8.5, // > 7, GREEN STAR
      createdAt: daysAgo(5),
    },
    // 6. Manual Review Queue - Category "Other / uncertain" (Jane)
    {
      reference: 'CR-2026-0006',
      title: 'Strange buzzing sound and vibration coming from underground utility box',
      description: 'There is a loud electrical or mechanical hum accompanied by ground vibrations near the pedestrian plaza. Not sure if this is power, water telemetry, or telephone lines.',
      address: 'Civic Plaza, near West Fountain',
      serviceAreaId: areaMap.CENTRAL,
      categoryId: catMap.OTHER,
      departmentId: null, // Unassigned! Waiting for manual review
      citizenId: citizenJane.id,
      status: 'SUBMITTED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'REQUIRED' as const,
      analysisProvider: 'needs_review',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.40,
      aiRationale: 'Issue spans multiple potential municipal utility departments; categorization uncertain.',
      priority: 7.1, // > 7, RED STAR
      urgency: 6.8,
      feasibility: 5.0,
      createdAt: daysAgo(2),
    },
    // 7. Manual Review Queue - Low Confidence Classification (John)
    {
      reference: 'CR-2026-0007',
      title: 'Property wall cracked after heavy machinery drove past',
      description: 'A private retaining wall developed cracks after large municipal trucks used the narrow residential lane. The homeowner is requesting an engineer inspection.',
      address: '89 Pinehurst Crest',
      serviceAreaId: areaMap.EAST,
      categoryId: catMap.ROADS,
      departmentId: null, // Routed to manual review due to low confidence
      citizenId: citizenJohn.id,
      status: 'SUBMITTED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'REQUIRED' as const,
      analysisProvider: 'needs_review',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.65, // Below 0.75 threshold
      aiRationale: 'Private property structural damage potentially related to roadway vibration. Confidence heuristic below 0.75.',
      priority: 6.5,
      urgency: 4.8,
      feasibility: 4.0,
      createdAt: daysAgo(3),
    },
    // 8. Staff Flagged for Admin Review (Jane)
    {
      reference: 'CR-2026-0008',
      title: 'Exposed conduits with standing water near bus shelter',
      description: 'Wires are visible in a broken plastic conduit right next to puddling rainwater at the bus stop.',
      address: 'Harbor Boulevard at 12th Quay',
      serviceAreaId: areaMap.HARBOR,
      categoryId: catMap.DRAINAGE, // Misassigned initially
      departmentId: deptMap.DRAINAGE,
      citizenId: citizenJane.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'REQUIRED' as const, // Flagged by staff
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.78,
      aiRationale: 'Flagged by Drainage staff: Issue is primarily live electrical street power cabling, not drainage infrastructure.',
      priority: 8.8, // > 7, RED STAR
      urgency: 9.1,  // > 7, ORANGE STAR
      feasibility: 7.2, // > 7, GREEN STAR
      createdAt: daysAgo(7),
    },
    // 9. Admin Score Override (John)
    {
      reference: 'CR-2026-0009',
      title: 'Cracked curb and crumbling handicap ramp at senior center',
      description: 'Wheelchair access ramp has crumbled at the curb edge, making it dangerous for elderly residents using walkers and mobility scooters.',
      address: '55 Golden Age Way, Senior Community Center',
      serviceAreaId: areaMap.SOUTH,
      categoryId: catMap.ROADS,
      departmentId: deptMap.ROADS,
      citizenId: citizenJohn.id,
      status: 'IN_PROGRESS' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.89,
      aiRationale: 'Sidewalk ramp degradation.',
      priority: 5.5,
      urgency: 4.5,
      feasibility: 7.5,
      overridePriority: 9.0, // Admin boosted priority due to ADA & senior safety
      overrideUrgency: 8.5,  // Admin boosted urgency
      overrideFeasibility: 8.0,
      overrideReason: 'Vulnerable population access hazard: ADA compliance requires prioritized restoration.',
      overriddenById: adminUser.id,
      overriddenAt: daysAgo(1),
      createdAt: daysAgo(8),
    },
    // 10. Streetlights - Old unresolved complaint -> Duration > 7 (Pink Star)
    {
      reference: 'CR-2026-0010',
      title: 'Continuous flickering sodium lamp buzzing outside bedroom windows',
      description: 'Lamp fixture blinks violently every 10 seconds and emits a high-pitched transformer whine all night.',
      address: '204 Maple Terrace',
      serviceAreaId: areaMap.NORTH,
      categoryId: catMap.STREETLIGHTS,
      departmentId: deptMap.ELECTRICAL,
      citizenId: citizenJane.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.90,
      aiRationale: 'Faulty ballast and sodium bulb cycling.',
      priority: 5.0,
      urgency: 4.2,
      feasibility: 8.8, // > 7, GREEN STAR
      createdAt: daysAgo(32), // 32 days old -> min(10, floor(32/3)) = 10 > 7, PINK STAR (Max duration score!)
    },
    // 11. Water - Resolved (John)
    {
      reference: 'CR-2026-0011',
      title: 'Discolored brown tap water with sulfur odor',
      description: 'Multiple households reporting brown sediment and rust smell coming from municipal kitchen taps.',
      address: 'Cascade Ridge Subdivision, Lots 12-28',
      serviceAreaId: areaMap.WEST,
      categoryId: catMap.WATER,
      departmentId: deptMap.WATER,
      citizenId: citizenJohn.id,
      status: 'RESOLVED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'ai_analyzed',
      analysisVersion: 'v1.0',
      classificationConfidence: 0.95,
      aiRationale: 'Municipal water distribution turbidity and sediment event.',
      priority: 8.7, // RED STAR
      urgency: 7.9,  // ORANGE STAR
      feasibility: 6.0,
      createdAt: daysAgo(14),
      resolvedAt: daysAgo(10),
      resolutionNote: 'Main water loop flushed via hydrants H-41 and H-43. Residual chlorine and turbidity tests within safe drinking standards.',
    },
    // 12. Garbage - Assigned (Jane) - Low Priority aesthetic
    {
      reference: 'CR-2026-0012',
      title: 'Litter scattered around bus stop bench after weekend parade',
      description: 'Candy wrappers, paper cups, and beverage cans left around the sidewalk bench.',
      address: 'Main Street & Broad Way',
      serviceAreaId: areaMap.CENTRAL,
      categoryId: catMap.SANITATION,
      departmentId: deptMap.SANITATION,
      citizenId: citizenJane.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.85,
      aiRationale: 'Surface litter requiring street sweep.',
      priority: 3.2,
      urgency: 3.0,
      feasibility: 9.2, // GREEN STAR
      createdAt: daysAgo(2),
    },
    // 13. Roads - Assigned (John)
    {
      reference: 'CR-2026-0013',
      title: 'Sunken trench line across lanes from recent gas utility dig',
      description: 'Utility trench backfill has settled 3 inches below grade creating a severe jarring bump for passing cars.',
      address: '512 Ocean Boulevard',
      serviceAreaId: areaMap.HARBOR,
      categoryId: catMap.ROADS,
      departmentId: deptMap.ROADS,
      citizenId: citizenJohn.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.91,
      aiRationale: 'Utility cut settlement on roadway.',
      priority: 7.4, // RED STAR
      urgency: 6.5,
      feasibility: 7.1, // GREEN STAR
      createdAt: daysAgo(11),
    },
    // 14. Drainage - In Progress (Jane) - Long standing issue (Pink Star)
    {
      reference: 'CR-2026-0014',
      title: 'Severe sewer odor permeating lower school playground',
      description: 'Foul sewer gases venting continuously from storm grate near elementary school field during recess hours.',
      address: 'East End Elementary, 400 Schoolhouse Road',
      serviceAreaId: areaMap.EAST,
      categoryId: catMap.DRAINAGE,
      departmentId: deptMap.DRAINAGE,
      citizenId: citizenJane.id,
      status: 'IN_PROGRESS' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.93,
      aiRationale: 'Sewer gas escaping into school recreational zone.',
      priority: 8.6, // RED STAR
      urgency: 8.2,  // ORANGE STAR
      feasibility: 5.5,
      createdAt: daysAgo(22), // 22 days -> floor(22/3) = 7 (Wait, strictly > 7 requires 24+ days for pink star!)
    },
    // 15. Drainage - High Core Score Quad-Star (Priority > 7, Duration > 7, Urgency > 7, Feasibility > 7)
    {
      reference: 'CR-2026-0015',
      title: 'Missing manhole cover on unlit pathway behind community gym',
      description: 'Cast iron cover is missing completely leaving a 4-foot deep open hole in the path. Extremely dangerous for evening joggers and children.',
      address: 'Greenway Pathway behind North District Gym',
      serviceAreaId: areaMap.NORTH,
      categoryId: catMap.DRAINAGE,
      departmentId: deptMap.DRAINAGE,
      citizenId: citizenJohn.id,
      status: 'IN_PROGRESS' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.97,
      aiRationale: 'Immediate fall and bodily injury hazard from open utility shaft.',
      priority: 9.8, // RED STAR
      urgency: 9.9,  // ORANGE STAR
      feasibility: 9.0, // GREEN STAR (Easy to deploy temporary barricade and drop replacement lid)
      createdAt: daysAgo(27), // 27 days -> floor(27/3) = 9 > 7 -> PINK STAR! (All 4 stars!)
    },
    // 16. Sanitation - Resolved (Jane)
    {
      reference: 'CR-2026-0016',
      title: 'Dead deer carcass on grass shoulder attracting scavengers',
      description: 'Deceased animal remains on the right shoulder of Highway 9 spur.',
      address: 'Highway 9 Spur near Mile Marker 4',
      serviceAreaId: areaMap.WEST,
      categoryId: catMap.SANITATION,
      departmentId: deptMap.SANITATION,
      citizenId: citizenJane.id,
      status: 'RESOLVED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.94,
      aiRationale: 'Biological waste removal on public thoroughfare.',
      priority: 6.8,
      urgency: 8.0, // ORANGE STAR
      feasibility: 8.5, // GREEN STAR
      createdAt: daysAgo(6),
      resolvedAt: daysAgo(5),
      resolutionNote: 'Animal control and sanitation services removed remains and sanitized shoulder area.',
    },
    // 17. Water - Assigned (Jane) - Low pressure
    {
      reference: 'CR-2026-0017',
      title: 'Trickling water pressure on top floor apartments',
      description: 'Water pressure dropped below 20 PSI since yesterday morning throughout the upper floor units.',
      address: '77 Beacon Hill Highrise Avenue',
      serviceAreaId: areaMap.CENTRAL,
      categoryId: catMap.WATER,
      departmentId: deptMap.WATER,
      citizenId: citizenJane.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.88,
      aiRationale: 'Municipal pressure regulator anomaly.',
      priority: 6.5,
      urgency: 6.2,
      feasibility: 6.8,
      createdAt: daysAgo(3),
    },
    // 18. Streetlights - Assigned (John)
    {
      reference: 'CR-2026-0018',
      title: 'Knocked down streetlight post after car collision',
      description: 'A light pole was struck by a vehicle and is leaning at a 45 degree angle with electrical wires exposed at the base.',
      address: '900 South Industrial Parkway',
      serviceAreaId: areaMap.SOUTH,
      categoryId: catMap.STREETLIGHTS,
      departmentId: deptMap.ELECTRICAL,
      citizenId: citizenJohn.id,
      status: 'ASSIGNED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'ai_analyzed',
      analysisVersion: 'v1.0',
      classificationConfidence: 0.96,
      aiRationale: 'Compromised vertical pole structure and live power feed hazard.',
      priority: 8.9, // RED STAR
      urgency: 9.3,  // ORANGE STAR
      feasibility: 5.5,
      createdAt: daysAgo(1),
    },
    // 19. Roads - Submitted (Jane) - Fresh submission
    {
      reference: 'CR-2026-0019',
      title: 'Faded pedestrian crosswalk striping outside public library',
      description: 'Thermal plastic stripes have completely worn away from winter snow plowing. Drivers do not yield to crossing children and patrons.',
      address: '15 Library Way',
      serviceAreaId: areaMap.NORTH,
      categoryId: catMap.ROADS,
      departmentId: deptMap.ROADS,
      citizenId: citizenJane.id,
      status: 'SUBMITTED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.86,
      aiRationale: 'Pedestrian safety pavement marking re-striping request.',
      priority: 6.0,
      urgency: 5.2,
      feasibility: 8.7, // GREEN STAR
      createdAt: daysAgo(0), // Today
    },
    // 20. Garbage - Resolved (John)
    {
      reference: 'CR-2026-0020',
      title: 'Overflowing public bins at waterfront promenade',
      description: 'Seagulls pulling trash bags and food containers out of three overfilled waste receptacles onto the walkway.',
      address: 'Pier 7 Promenade Walkway',
      serviceAreaId: areaMap.HARBOR,
      categoryId: catMap.SANITATION,
      departmentId: deptMap.SANITATION,
      citizenId: citizenJohn.id,
      status: 'RESOLVED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'NOT_REQUIRED' as const,
      analysisProvider: 'rule_based_fallback',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.92,
      aiRationale: 'Park receptacle overflow remediation.',
      priority: 5.0,
      urgency: 6.0,
      feasibility: 9.5, // GREEN STAR
      createdAt: daysAgo(8),
      resolvedAt: daysAgo(7),
      resolutionNote: 'Extra collection sweep performed and tamper-resistant double-capacity bins installed.',
    },
    // 21. Manual Review Queue - Missing routing mapping simulation
    {
      reference: 'CR-2026-0021',
      title: 'Sinkhole opening near creek embankment behind industrial park',
      description: 'Ground collapsed near stormwater outlet culvert, revealing broken clay pipes and eroding soil.',
      address: 'East End Industrial Way near Creek Bridge',
      serviceAreaId: areaMap.EAST,
      categoryId: catMap.OTHER,
      departmentId: null,
      citizenId: citizenJohn.id,
      status: 'SUBMITTED' as const,
      analysisState: 'COMPLETED' as const,
      reviewState: 'REQUIRED' as const,
      analysisProvider: 'needs_review',
      analysisVersion: 'rule-engine-v1.0',
      classificationConfidence: 0.45,
      aiRationale: 'Cross-departmental geotechnical risk involving civil drainage and environmental works.',
      priority: 8.5, // RED STAR
      urgency: 8.0,  // ORANGE STAR
      feasibility: 3.5,
      createdAt: daysAgo(5),
    },
  ];

  for (const c of complaintsData) {
    const upserted = await prisma.complaint.upsert({
      where: { reference: c.reference },
      update: {
        title: c.title,
        description: c.description,
        address: c.address,
        serviceAreaId: c.serviceAreaId,
        categoryId: c.categoryId,
        departmentId: c.departmentId,
        citizenId: c.citizenId,
        status: c.status,
        analysisState: c.analysisState,
        reviewState: c.reviewState,
        analysisProvider: c.analysisProvider,
        analysisVersion: c.analysisVersion,
        classificationConfidence: c.classificationConfidence,
        aiRationale: c.aiRationale,
        priority: c.priority,
        urgency: c.urgency,
        feasibility: c.feasibility,
        overridePriority: (c as any).overridePriority ?? null,
        overrideUrgency: (c as any).overrideUrgency ?? null,
        overrideFeasibility: (c as any).overrideFeasibility ?? null,
        overrideReason: (c as any).overrideReason ?? null,
        overriddenById: (c as any).overriddenById ?? null,
        overriddenAt: (c as any).overriddenAt ?? null,
        resolvedAt: (c as any).resolvedAt ?? null,
        resolutionNote: (c as any).resolutionNote ?? null,
        createdAt: c.createdAt,
      },
      create: {
        reference: c.reference,
        title: c.title,
        description: c.description,
        address: c.address,
        serviceAreaId: c.serviceAreaId,
        categoryId: c.categoryId,
        departmentId: c.departmentId,
        citizenId: c.citizenId,
        status: c.status,
        analysisState: c.analysisState,
        reviewState: c.reviewState,
        analysisProvider: c.analysisProvider,
        analysisVersion: c.analysisVersion,
        classificationConfidence: c.classificationConfidence,
        aiRationale: c.aiRationale,
        priority: c.priority,
        urgency: c.urgency,
        feasibility: c.feasibility,
        overridePriority: (c as any).overridePriority ?? null,
        overrideUrgency: (c as any).overrideUrgency ?? null,
        overrideFeasibility: (c as any).overrideFeasibility ?? null,
        overrideReason: (c as any).overrideReason ?? null,
        overriddenById: (c as any).overriddenById ?? null,
        overriddenAt: (c as any).overriddenAt ?? null,
        resolvedAt: (c as any).resolvedAt ?? null,
        resolutionNote: (c as any).resolutionNote ?? null,
        createdAt: c.createdAt,
      },
    });

    // Seed initial status history if empty
    const historyCount = await prisma.statusHistory.count({ where: { complaintId: upserted.id } });
    if (historyCount === 0) {
      await prisma.statusHistory.create({
        data: {
          complaintId: upserted.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          note: 'Complaint submitted by citizen.',
          isCitizenVisible: true,
          changedById: c.citizenId,
          createdAt: c.createdAt,
        },
      });

      if (c.status !== 'SUBMITTED') {
        await prisma.statusHistory.create({
          data: {
            complaintId: upserted.id,
            fromStatus: 'SUBMITTED',
            toStatus: 'ASSIGNED',
            note: 'Complaint classified and routed to department.',
            isCitizenVisible: true,
            changedById: adminUser.id,
            createdAt: new Date(c.createdAt.getTime() + 10 * 60 * 1000),
          },
        });
      }

      if (c.status === 'IN_PROGRESS' || c.status === 'RESOLVED') {
        await prisma.statusHistory.create({
          data: {
            complaintId: upserted.id,
            fromStatus: 'ASSIGNED',
            toStatus: 'IN_PROGRESS',
            note: 'Department crew dispatched to assess and address issue.',
            isCitizenVisible: true,
            changedById: staffRoads.id,
            createdAt: new Date(c.createdAt.getTime() + 2 * 60 * 60 * 1000),
          },
        });
      }

      if (c.status === 'RESOLVED') {
        await prisma.statusHistory.create({
          data: {
            complaintId: upserted.id,
            fromStatus: 'IN_PROGRESS',
            toStatus: 'RESOLVED',
            note: (c as any).resolutionNote || 'Issue resolved successfully.',
            isCitizenVisible: true,
            changedById: staffWater.id,
            createdAt: (c as any).resolvedAt || new Date(),
          },
        });
      }
    }
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log(`[Seed] Created / Verified:
  - 1 Administrator (${adminUser.email})
  - 5 Department Staff (Roads, Electrical, Water, Drainage, Sanitation)
  - 2 Citizens (${citizenJane.email}, ${citizenJohn.email})
  - 6 Service Areas
  - 6 Categories & complete routing table
  - ${complaintsData.length} Demonstrational Complaints with full scoring, duration, and star coverage!`);
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
