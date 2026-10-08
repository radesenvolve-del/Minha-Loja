export type MarkupMethod = 'margin' | 'markup';
export type RoundingMethod = '90' | '99' | '00' | 'none';
export type ProductStatus = 'ativo' | 'inativo' | 'esgotado';
export type StockMovementType = 'entrada' | 'venda' | 'devolucao' | 'ajuste' | 'perda' | 'avaria' | 'consumo' | 'cancelamento';
export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'credito_parcelado' | 'transferencia' | 'outro';
export type OrderStatus = 'novo' | 'aguardando_pagamento' | 'pagamento_confirmado' | 'em_separacao' | 'pronto_envio' | 'enviado' | 'entregue' | 'cancelado' | 'devolvido';
export type OrderOrigin = 'instagram' | 'whatsapp' | 'balcao' | 'outros';
export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado';
export type AccountStatus = 'pendente' | 'pago' | 'recebido' | 'vencido' | 'cancelado';
export type CashSessionStatus = 'open' | 'closed';
export type CashMovementType = 'suprimento' | 'sangria' | 'despesa' | 'venda' | 'ajuste';
export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'caixa' | 'user';

export interface UserPermissions {
  products: boolean;
  stock: boolean;
  sales: boolean;
  financial: boolean;
  reports: boolean;
  customers: boolean;
  settings: boolean;
  canGiveDiscountAboveMax?: boolean;
  maxDiscountPercent?: number; // e.g. 10%
  canCancelSales?: boolean;
  canManualStockAdjust?: boolean;
  canViewCostAndProfit?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Tamanho M / Preto"
  sku: string;
  barcode?: string;
  stock: number;
  price?: number;
  cost?: number;
}

export interface KitComponentItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface Product {
  id: string;
  name: string;
  photo?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku: string;
  barcode?: string;
  qrCode?: string;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  cost: number;
  markupMethod: MarkupMethod;
  marginPercent: number; // e.g. 40%
  extraCosts?: {
    packaging?: number;
    shipping?: number;
    cardFeePercent?: number;
    marketplaceFeePercent?: number;
    commissionPercent?: number;
    other?: number;
  };
  includeExtraCosts?: boolean;
  suggestedPrice: number;
  minPrice: number;
  price: number;
  promotionalPrice?: number;
  promoStartDate?: string;
  promoEndDate?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string; // UN, PC, KG, M, PAR, CX
  location?: string;
  weight?: string;
  dimensions?: string;
  status: ProductStatus;
  isFavorite?: boolean;
  isKit?: boolean;
  kitComponents?: KitComponentItem[];
  hasVariants?: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  photo?: string;
  whatsapp?: string;
  instagram?: string;
  cpf?: string;
  email?: string;
  birthDate?: string; // YYYY-MM-DD
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  cashbackBalance?: number; // Accumulated cashback in R$
  creditBalance?: number; // Store credit in R$
  totalPurchasesCount?: number;
  totalSpent?: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpjCpf?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  unitPrice: number;
  originalPrice: number;
  cost: number;
  minPrice: number;
  quantity: number;
  discount: number; // in R$
  total: number;
  isKit?: boolean;
  kitComponents?: KitComponentItem[];
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  sellerId?: string;
  sellerName?: string;
  items: CartItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  shipping: number;
  fees: number;
  total: number;
  costTotal: number;
  estimatedProfit: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  change?: number; // troco
  amountPaid?: number;
  cashbackEarned?: number;
  cashbackUsed?: number;
  creditUsed?: number;
  adminApprovedBy?: string;
  status: 'completed' | 'cancelled';
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  userName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  origin: OrderOrigin;
  customerId?: string;
  customerName: string;
  instagramHandle?: string;
  whatsapp?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  deliveryAddress?: string;
  trackingCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId?: string;
  customerName: string;
  customerWhatsapp?: string;
  date: string;
  validUntil: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  unitCost?: number;
  referenceId?: string; // sale id, order id, purchase id
  userName: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  initialAmount: number;
  status: CashSessionStatus;
  expectedCash?: number;
  countedCash?: number;
  difference?: number;
  totalPix: number;
  totalCard: number;
  totalCash: number;
  totalOther: number;
  grandTotal: number;
  notes?: string;
  openedBy: string;
  closedBy?: string;
}

export interface CashMovement {
  id: string;
  sessionId: string;
  date: string;
  type: CashMovementType;
  amount: number;
  method?: PaymentMethod;
  reason: string;
  userName: string;
  createdAt: string;
}

export interface AccountPayable {
  id: string;
  description: string;
  category: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status: AccountStatus;
  notes?: string;
  createdAt: string;
}

export interface AccountReceivable {
  id: string;
  description: string;
  customerId?: string;
  customerName?: string;
  saleId?: string;
  orderId?: string;
  amount: number;
  dueDate: string;
  receiptDate?: string;
  paymentMethod?: PaymentMethod;
  status: AccountStatus;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId?: string;
  supplierName: string;
  invoiceNumber?: string;
  date: string;
  items: PurchaseItem[];
  shippingCost: number;
  extraExpenses: number;
  totalCost: number;
  costUpdateStrategy: 'ultimo' | 'medio' | 'nenhum';
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  date: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  userName: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  pin?: string;
  role: UserRole;
  active?: boolean;
  commissionPercent?: number; // e.g. 5%
  monthlySalesTarget?: number; // e.g. 15000 in R$
  permissions: UserPermissions;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  logo?: string;
  cnpjCpf?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pricingMethod: MarkupMethod;
  defaultMarginPercent: number;
  includeExtraCosts: boolean;
  defaultPackagingCost: number;
  defaultCardFeePercent: number;
  roundingMethod: RoundingMethod;
  lowStockAlertThreshold: number;
  idleProductDays: number; // 30, 60, 90, 120
  allowNegativeStock: boolean;
  thermalPrinterWidth: '58mm' | '80mm';
  theme: 'light' | 'dark' | 'system';
  primaryColor: string; // hex
  setupCompleted: boolean;
  mainSalesChannel?: 'instagram' | 'whatsapp' | 'loja_fisica' | 'online' | 'todas';
  // Advanced features
  cashbackEnabled?: boolean;
  cashbackPercent?: number; // e.g. 3%
  maxSellerDiscountPercent?: number; // e.g. 10% - above this requires admin pin
  requireAdminPinForCancel?: boolean;
  requireAdminPinForBelowMinPrice?: boolean;
  autoBackupEnabled?: boolean;
  autoBackupFrequency?: 'daily' | 'on_cash_close' | 'weekly';
  lastAutoBackupAt?: string;
  p2pSyncDeviceName?: string;
}

export interface AutoBackupRecord {
  id: string;
  date: string;
  reason: string;
  dataSize: number;
  recordsCount: number;
  jsonBackup: string;
}

export interface Promotion {
  id: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  productIds: string[];
  active: boolean;
  createdAt: string;
}

export interface ReturnItemRecord {
  id: string;
  saleId: string;
  saleNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
  refundMethod: 'credito_cliente' | 'estorno_dinheiro' | 'estorno_pix' | 'troca_produto';
  reason: string;
  userName: string;
  createdAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'products'
  | 'stock'
  | 'pdv'
  | 'sales'
  | 'orders'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'quotes'
  | 'cash'
  | 'financial'
  | 'reports'
  | 'labels'
  | 'catalog'
  | 'crm'
  | 'promotions'
  | 'sync'
  | 'audit'
  | 'settings'
  | 'backup';
