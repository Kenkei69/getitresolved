export const CATEGORIES = [
  {
    code: 'ROADS',
    name: 'Roads and potholes',
    description: 'Damaged asphalt, craters, potholes, missing road markings, damaged curbs, or hazardous street surfaces.',
    defaultKeywords: ['pothole', 'crater', 'asphalt', 'road damage', 'curb', 'pavement', 'street surface', 'traffic hazard'],
  },
  {
    code: 'STREETLIGHTS',
    name: 'Streetlights',
    description: 'Broken lamp posts, dark streets, flickering bulbs, damaged wiring, or public lighting outages.',
    defaultKeywords: ['streetlight', 'lamp', 'light post', 'flicker', 'dark street', 'blackout street', 'light bulb'],
  },
  {
    code: 'WATER',
    name: 'Water supply',
    description: 'Burst pipelines, contaminated water, tap water outages, low water pressure, or main leaks.',
    defaultKeywords: ['water pipe', 'pipe burst', 'contaminated water', 'tap water', 'low pressure', 'no water', 'leak', 'water supply'],
  },
  {
    code: 'DRAINAGE',
    name: 'Drainage and sewage',
    description: 'Overflowing storm drains, sewage stench, clogged gutters, manhole blockages, or wastewater backups.',
    defaultKeywords: ['drain', 'drainage', 'sewage', 'stench', 'manhole', 'overflow', 'clogged gutter', 'wastewater', 'sewer'],
  },
  {
    code: 'SANITATION',
    name: 'Garbage and sanitation',
    description: 'Uncollected refuse, illegal dumping, overflowing public trash bins, rotting waste, or litter accumulation.',
    defaultKeywords: ['garbage', 'trash', 'waste', 'litter', 'dumping', 'rubbish', 'refuse', 'sanitation', 'bins'],
  },
  {
    code: 'OTHER',
    name: 'Other / uncertain',
    description: 'Uncertain, multi-domain, ambiguous civic issues, or issues requiring administrative triage.',
    defaultKeywords: ['other', 'general', 'unknown', 'unsure'],
  },
] as const;

export const DEPARTMENTS = [
  {
    code: 'ROADS',
    name: 'Roads and Public Works',
    description: 'Maintains civil roadways, bridges, pavements, and vehicular thoroughfares.',
  },
  {
    code: 'ELECTRICAL',
    name: 'Electrical / Streetlighting',
    description: 'Manages municipal public lighting, power conduits, and electrical infrastructure.',
  },
  {
    code: 'WATER',
    name: 'Water Supply',
    description: 'Ensures potable water distribution, main pipeline integrity, and municipal metering.',
  },
  {
    code: 'DRAINAGE',
    name: 'Drainage and Sewage',
    description: 'Operates storm water drainage systems, sewer trunk lines, and wastewater treatment channels.',
  },
  {
    code: 'SANITATION',
    name: 'Sanitation',
    description: 'Responsible for public cleanliness, solid waste collection, and municipal recycling.',
  },
] as const;

export const SERVICE_AREAS = [
  { code: 'NORTH', name: 'North District', description: 'Northern residential and civic ward.' },
  { code: 'SOUTH', name: 'South Ward', description: 'Southern commercial and harbor adjacent zone.' },
  { code: 'CENTRAL', name: 'Central Metro', description: 'High-density downtown and administrative center.' },
  { code: 'WEST', name: 'West Hills', description: 'Western suburban and elevated terrain district.' },
  { code: 'HARBOR', name: 'Harbor Basin', description: 'Coastal maritime and industrial logistics sector.' },
  { code: 'EAST', name: 'East End', description: 'Eastern mixed-use commercial and community district.' },
] as const;

export const SCORING_CONFIG = {
  weights: {
    priority: 0.45,
    urgency: 0.40,
    duration: 0.15,
  },
  // Strict threshold: strictly greater than 7 (score > 7)
  starThreshold: 7.0,
  confidenceThreshold: 0.75,
  maxScore: 10.0,
  minScore: 0.0,
  daysPerDurationPoint: 3,
  maxDurationScoreDays: 30, // 30 / 3 = 10
} as const;

export const UPLOAD_LIMITS = {
  maxFiles: 3,
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'SUBMITTED'],
  IN_PROGRESS: ['RESOLVED', 'ASSIGNED'],
  RESOLVED: ['ASSIGNED'], // Can be reopened by admin with explanation
};
