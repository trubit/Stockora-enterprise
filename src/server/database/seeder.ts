import { Role } from '../models/Role.js';
import { SYSTEM_ROLES, SYSTEM_PERMISSIONS } from '../../shared/constants.js';
import { logger } from '../logger.js';

export async function seedRolesIfEmpty(): Promise<void> {
  try {
    const count = await Role.countDocuments();
    if (count > 0) return;

    const rolesToCreate = [
      {
        name: SYSTEM_ROLES.SUPER_ADMIN,
        description: 'System Super Administrator with full global rights.',
        permissions: Object.values(SYSTEM_PERMISSIONS),
        isSystem: true,
      },
      {
        name: SYSTEM_ROLES.COMPANY_OWNER,
        description: 'Company Tenant Owner with full access.',
        permissions: Object.values(SYSTEM_PERMISSIONS),
        isSystem: true,
      },
      {
        name: SYSTEM_ROLES.BRANCH_MANAGER,
        description: 'Branch Manager managing single store site operations.',
        permissions: [
          SYSTEM_PERMISSIONS.PRODUCTS_READ,
          SYSTEM_PERMISSIONS.PRODUCTS_WRITE,
          SYSTEM_PERMISSIONS.TRANSACTIONS_READ,
          SYSTEM_PERMISSIONS.TRANSACTIONS_WRITE,
          SYSTEM_PERMISSIONS.WAREHOUSES_READ,
          SYSTEM_PERMISSIONS.USERS_READ,
        ],
        isSystem: true,
      },
      {
        name: SYSTEM_ROLES.WAREHOUSE_MANAGER,
        description: 'Warehouse Manager handling inventory and transfers.',
        permissions: [
          SYSTEM_PERMISSIONS.PRODUCTS_READ,
          SYSTEM_PERMISSIONS.WAREHOUSES_READ,
          SYSTEM_PERMISSIONS.WAREHOUSES_WRITE,
        ],
        isSystem: true,
      },
      {
        name: SYSTEM_ROLES.CASHIER,
        description: 'Cashier handling POS checkouts.',
        permissions: [
          SYSTEM_PERMISSIONS.PRODUCTS_READ,
          SYSTEM_PERMISSIONS.TRANSACTIONS_WRITE,
        ],
        isSystem: true,
      },
      {
        name: SYSTEM_ROLES.AUDITOR,
        description: 'Read-Only Auditor.',
        permissions: [
          SYSTEM_PERMISSIONS.USERS_READ,
          SYSTEM_PERMISSIONS.ROLES_READ,
          SYSTEM_PERMISSIONS.COMPANIES_READ,
          SYSTEM_PERMISSIONS.BRANCHES_READ,
          SYSTEM_PERMISSIONS.WAREHOUSES_READ,
          SYSTEM_PERMISSIONS.PRODUCTS_READ,
          SYSTEM_PERMISSIONS.TRANSACTIONS_READ,
          SYSTEM_PERMISSIONS.AUDIT_READ,
        ],
        isSystem: true,
      },
    ];

    await Role.insertMany(rolesToCreate);
    logger.info(`[Database Seeding] Successfully seeded ${rolesToCreate.length} default workspace system roles.`);
  } catch (err: unknown) {
    logger.error('Failed to seed system roles:', err);
  }
}
