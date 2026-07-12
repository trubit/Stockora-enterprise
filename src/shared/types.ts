export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
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
