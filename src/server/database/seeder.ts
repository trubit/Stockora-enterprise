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

export async function seedProductsIfEmpty(): Promise<void> {
  const { Product } = await import('../models/Product.js');
  try {
    const count = await Product.countDocuments();
    if (count > 0) return;

    const mockProducts = [
      {
        sku: 'SKU-APP-001',
        name: 'Fuji Apples (Organic)',
        description: 'Fresh organic imported Fuji apples.',
        category: 'Produce',
        price: 4.99,
        cost: 2.2,
        quantity: 150,
        lowStockAlert: 20,
        barcode: '40012011',
        isActive: true,
      },
      {
        sku: 'SKU-MILK-002',
        name: 'Whole Milk 1L',
        description: 'Pasteurized homogenized whole milk.',
        category: 'Dairy',
        price: 2.49,
        cost: 1.1,
        quantity: 80,
        lowStockAlert: 15,
        barcode: '40012022',
        isActive: true,
      },
      {
        sku: 'SKU-BREAD-003',
        name: 'Sourdough Bread',
        description: 'Freshly baked artisanal sourdough bread.',
        category: 'Bakery',
        price: 3.99,
        cost: 1.8,
        quantity: 12,
        lowStockAlert: 10,
        barcode: '40012033',
        isActive: true,
      },
      {
        sku: 'SKU-COF-004',
        name: 'Espresso Coffee Beans 500g',
        description: 'Medium roast Arabica coffee beans.',
        category: 'Pantry',
        price: 12.99,
        cost: 6.5,
        quantity: 45,
        lowStockAlert: 8,
        barcode: '40012044',
        isActive: true,
      },
    ];

    await Product.insertMany(mockProducts);
    logger.info('[Database Seeding] Successfully seeded default mock products.');
  } catch (err: unknown) {
    logger.error('Failed to seed default products:', err);
  }
}
