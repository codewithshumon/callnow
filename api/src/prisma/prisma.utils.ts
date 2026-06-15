/**
 * Prisma utility helpers.
 *
 * Ref: SDD §5.1 (best practice — transaction helper, pagination helper)
 */

/**
 * Run a callback within a Prisma interactive transaction.
 * Pass the PrismaService instance and a callback receiving the transaction client.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function transaction<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(fn);
}

/**
 * Standard pagination parameters.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

/**
 * Build Prisma skip/take from pagination params.
 */
export function paginationParams(params: PaginationParams = {}) {
  const page = Math.max(1, params.page || 1);
  const maxLimit = params.maxLimit || 50;
  const limit = Math.min(Math.max(1, params.limit || 20), maxLimit);
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

/**
 * Build paginated response meta.
 */
export function paginatedMeta(
  total: number,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    total,
  };
}

/**
 * E.164 phone number regex validation.
 */
export const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Validate and normalize an E.164 phone number.
 */
export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}
