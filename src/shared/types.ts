export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';

export interface User {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  roleName?: string;
  isActive: boolean;
  branchId?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  timeZone?: string;
  themePreference?: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  _id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  _id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  lowStockAlert: number;
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'SALE' | 'RETURN' | 'TRANSFER';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT';

export interface TransactionItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Transaction {
  id: string;
  _id?: string;
  transactionNumber: string;
  type: TransactionType;
  status: TransactionStatus;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'PENDING' | 'EN_ROUTE' | 'RECEIVED' | 'CANCELLED';

export interface TransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  _id?: string;
  transferNumber: string;
  sourceBranchId: string;
  sourceBranchName: string;
  targetBranchId: string;
  targetBranchName: string;
  items: TransferItem[];
  status: TransferStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  _id?: string;
  name: string;
  logoUrl?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  currency: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  _id?: string;
  branchId: string;
  name: string;
  code: string;
  zones: string[];
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  _id?: string;
  companyId: string;
  name: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  _id?: string;
  userId: string;
  employeeId: string;
  departmentId?: string;
  assignedBranchId?: string;
  assignedWarehouseId?: string;
  status: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  hireDate: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterData {
  id: string;
  _id?: string;
  type: string;
  name: string;
  code: string;
  value?: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

