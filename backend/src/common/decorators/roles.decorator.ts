import { SetMetadata } from '@nestjs/common';

/**
 * Roles metadata key consumed by RolesGuard.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator — restricts endpoint access by user role.
 *
 * Usage:
 *   @Roles('admin')
 *   @Delete('users/:id')
 *   deleteUser() { ... }
 *
 *   @Roles('admin', 'business')
 *   @Post('campaigns')
 *   createCampaign() { ... }
 *
 * Ref: SDD §3.1 (common/decorators/)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
