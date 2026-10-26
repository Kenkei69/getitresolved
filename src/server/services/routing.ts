import { PrismaClient } from '@prisma/client';

export interface RoutingResult {
  departmentId: string | null;
  departmentName: string | null;
  success: boolean;
  requiresReview: boolean;
  reason?: string;
}

/**
 * Resolves department from the database routing table given categoryId and serviceAreaId.
 */
export async function routeComplaint(
  prisma: PrismaClient,
  categoryId: string | null,
  serviceAreaId: string
): Promise<RoutingResult> {
  if (!categoryId) {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: 'No category assigned; cannot determine department.',
    };
  }

  // Check if category is "Other / uncertain"
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.code === 'OTHER') {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: 'Category is Other / uncertain; requires administrative review.',
    };
  }

  // Look up routing rule
  const rule = await prisma.routingRule.findUnique({
    where: {
      categoryId_serviceAreaId: {
        categoryId,
        serviceAreaId,
      },
    },
    include: {
      department: true,
    },
  });

  if (!rule || !rule.department) {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: `No routing rule exists for category "${category.name}" in selected service area. Sent to administrator review.`,
    };
  }

  return {
    departmentId: rule.department.id,
    departmentName: rule.department.name,
    success: true,
    requiresReview: false,
  };
}
