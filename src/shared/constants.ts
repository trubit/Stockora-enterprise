export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE: 'MOBILE',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const;

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super Administrator',
  COMPANY_OWNER: 'Company Owner',
  BRANCH_MANAGER: 'Branch Manager',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory Manager',
  SALES_MANAGER: 'Sales Manager',
  PURCHASING_MANAGER: 'Purchasing Manager',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee',
  AUDITOR: 'Read-Only Auditor',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const SYSTEM_PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',
  COMPANIES_READ: 'companies:read',
  COMPANIES_WRITE: 'companies:write',
  BRANCHES_READ: 'branches:read',
  BRANCHES_WRITE: 'branches:write',
  WAREHOUSES_READ: 'warehouses:read',
  WAREHOUSES_WRITE: 'warehouses:write',
  MASTER_DATA_READ: 'master_data:read',
  MASTER_DATA_WRITE: 'master_data:write',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_WRITE: 'transactions:write',
  AUDIT_READ: 'audit:read',
} as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS];

export const MASTER_DATA_TYPES = {
  CATEGORY: 'CATEGORY',
  BRAND: 'BRAND',
  UOM: 'UOM',
  TAX_RATE: 'TAX_RATE',
  CUSTOMER_TYPE: 'CUSTOMER_TYPE',
  SUPPLIER_TYPE: 'SUPPLIER_TYPE',
} as const;

export type MasterDataType = (typeof MASTER_DATA_TYPES)[keyof typeof MASTER_DATA_TYPES];

