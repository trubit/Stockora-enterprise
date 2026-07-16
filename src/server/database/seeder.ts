import { Role } from '../models/Role.js';
import { SYSTEM_ROLES, SYSTEM_PERMISSIONS } from '../../shared/constants.js';
import { logger } from '../logger.js';

export async function seedRolesIfEmpty(): Promise<void> {
  try {
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
          SYSTEM_PERMISSIONS.CUSTOMERS_READ,
          SYSTEM_PERMISSIONS.CUSTOMERS_WRITE,
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
          SYSTEM_PERMISSIONS.CUSTOMERS_READ,
          SYSTEM_PERMISSIONS.CUSTOMERS_WRITE,
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
          SYSTEM_PERMISSIONS.CUSTOMERS_READ,
          SYSTEM_PERMISSIONS.SUPPLIERS_READ,
        ],
        isSystem: true,
      },
    ];

    for (const r of rolesToCreate) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { $set: { permissions: r.permissions, description: r.description, isSystem: r.isSystem } },
        { upsert: true, new: true }
      );
    }
    logger.info(`[Database Seeding] Successfully seeded and synced ${rolesToCreate.length} default workspace system roles.`);
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

export async function seedDefaultsIfEmpty(): Promise<void> {
  try {
    const { Company } = await import('../models/Company.js');
    const { Branch } = await import('../models/Branch.js');
    const { Warehouse } = await import('../models/Warehouse.js');
    const { Supplier } = await import('../models/Supplier.js');
    const { Customer } = await import('../models/Customer.js');

    // 1. Seed Company
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'Stockora Enterprise Inc.',
        taxId: 'TX-998877',
        address: '100 Innovation Way, Toronto, ON',
        phone: '416-555-0199',
        currency: 'USD',
        timeZone: 'EST',
      });
      logger.info('[Database Seeding] Seeded default company.');
    }

    // 2. Seed Branch
    let branch = await Branch.findOne();
    if (!branch) {
      branch = await Branch.create({
        companyId: company._id,
        name: 'Toronto Headquarters',
        code: 'BR-HQ-01',
        address: '100 Innovation Way, Toronto, ON',
        phone: '416-555-0199',
        isActive: true,
      });
      logger.info('[Database Seeding] Seeded default headquarters branch.');
    }

    // 3. Seed Warehouses
    const warehouseCount = await Warehouse.countDocuments();
    if (warehouseCount === 0) {
      await Warehouse.create([
        {
          branchId: branch._id,
          name: 'Main Distribution Center',
          code: 'WH-CDC-01',
          zones: ['A', 'B', 'C'],
          capacity: 10000,
          isActive: true,
        },
        {
          branchId: branch._id,
          name: 'Retail Storage Annex',
          code: 'WH-ANNEX-02',
          zones: ['Zone X', 'Zone Y'],
          capacity: 2500,
          isActive: true,
        },
      ]);
      logger.info('[Database Seeding] Seeded default warehouses.');
    }

    // 4. Seed Supplier
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      await Supplier.create({
        name: 'Apex Global Logistics',
        code: 'SUP-APEX',
        contactPerson: 'John Doe',
        email: 'sales@apexlogistics.com',
        phone: '555-0144',
        address: '456 Industrial Pkwy, Chicago, IL',
        paymentTerms: 'NET 30',
        creditLimit: 50000,
        rating: 5,
        isActive: true,
      });
      logger.info('[Database Seeding] Seeded default supplier.');
    }

    // 5. Seed Customer
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      await Customer.create({
        name: 'Acme Corporate Buyers',
        code: 'CUST-ACME',
        email: 'purchasing@acme.com',
        phone: '555-0155',
        group: 'VIP',
        creditLimit: 25000,
        loyaltyPoints: 120,
        billingAddress: '789 Corporate Way, New York, NY',
        shippingAddress: '789 Corporate Way, New York, NY',
        isActive: true,
      });
      logger.info('[Database Seeding] Seeded default customer.');
    }
  } catch (err: unknown) {
    logger.error('Failed to seed default database properties:', err);
  }
}
