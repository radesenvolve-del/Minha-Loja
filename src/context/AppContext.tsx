import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { db } from '../db/indexedDB';
import {
  AccountPayable,
  AccountReceivable,
  ActiveTab,
  AppUser,
  AuditLog,
  CartItem,
  CashMovement,
  CashMovementType,
  CashSession,
  Customer,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Purchase,
  Quote,
  Sale,
  StockMovement,
  StoreSettings,
  Supplier,
} from '../types';
import { initialSettings, initialUsers } from '../db/seedData';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  users: AppUser[];
  saveUser: (user: AppUser) => Promise<void>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isFastPDVOpen: boolean;
  setIsFastPDVOpen: (open: boolean) => void;
  isSidebarCompact: boolean;
  setIsSidebarCompact: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCompact: () => void;

  // Collections
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  orders: Order[];
  quotes: Quote[];
  stockMovements: StockMovement[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  purchases: Purchase[];
  auditLogs: AuditLog[];

  // Data Actions
  refreshData: () => Promise<void>;
  saveProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  registerStockMovement: (
    movement: Omit<StockMovement, 'id' | 'createdAt'>
  ) => Promise<void>;
  saveCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  saveSupplier: (supplier: Supplier) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;
  completeSale: (
    saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'userName'> & { userName?: string }
  ) => Promise<Sale>;
  cancelSale: (saleId: string, reason: string) => Promise<void>;
  saveOrder: (order: Order) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  saveQuote: (quote: Quote) => Promise<Quote>;
  savePurchase: (purchase: Purchase) => Promise<Purchase>;
  saveAccountPayable: (item: AccountPayable) => Promise<AccountPayable>;
  markAccountPayablePaid: (id: string, paymentMethod?: PaymentMethod) => Promise<void>;
  deleteAccountPayable: (id: string) => Promise<void>;
  saveAccountReceivable: (item: AccountReceivable) => Promise<AccountReceivable>;
  markAccountReceivableReceived: (id: string, paymentMethod?: PaymentMethod) => Promise<void>;
  deleteAccountReceivable: (id: string) => Promise<void>;

  // Cash Session
  currentCashSession?: CashSession;
  openCashSession: (initialAmount: number, notes?: string) => Promise<CashSession>;
  closeCashSession: (countedCash: number, notes?: string) => Promise<CashSession>;
  addCashMovement: (type: CashMovementType, amount: number, reason: string, method?: PaymentMethod) => Promise<CashMovement>;

  // Demo / Reset
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Global Category Filter (Omnipresent across all modules)
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  // Feedback & Network
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  isOnline: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<AppUser>(initialUsers[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFastPDVOpen, setIsFastPDVOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Compact Sidebar state (Default true for sleek compact layout)
  const [isSidebarCompact, setIsSidebarCompact] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minha_loja_sidebar_compact');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebarCompact = useCallback(() => {
    setIsSidebarCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('minha_loja_sidebar_compact', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Global Category filter (omnipresent across all modules)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Collections state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Feedback & Online
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexão restabelecida. Modo online.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Você está offline. Todas as operações continuam funcionando localmente!', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Load all data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [
        loadedSettings,
        loadedUsers,
        loadedProducts,
        loadedCustomers,
        loadedSuppliers,
        loadedSales,
        loadedOrders,
        loadedQuotes,
        loadedMovements,
        loadedSessions,
        loadedCashMoves,
        loadedPayable,
        loadedReceivable,
        loadedPurchases,
        loadedAudit,
      ] = await Promise.all([
        db.getSettings(),
        db.getAll<AppUser>('users'),
        db.getAll<Product>('products'),
        db.getAll<Customer>('customers'),
        db.getAll<Supplier>('suppliers'),
        db.getAll<Sale>('sales'),
        db.getAll<Order>('orders'),
        db.getAll<Quote>('quotes'),
        db.getAll<StockMovement>('stockMovements'),
        db.getAll<CashSession>('cashSessions'),
        db.getAll<CashMovement>('cashMovements'),
        db.getAll<AccountPayable>('accountsPayable'),
        db.getAll<AccountReceivable>('accountsReceivable'),
        db.getAll<Purchase>('purchases'),
        db.getAll<AuditLog>('auditLogs'),
      ]);

      setSettings(loadedSettings);
      if (loadedUsers.length > 0) {
        setUsers(loadedUsers);
        // keep current user or default to first
        setCurrentUser((prev) => loadedUsers.find((u) => u.id === prev?.id) || loadedUsers[0]);
      } else {
        await db.putMany('users', initialUsers);
        setUsers(initialUsers);
        setCurrentUser(initialUsers[0]);
      }

      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setSuppliers(loadedSuppliers);
      setSales(loadedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setOrders(loadedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setQuotes(loadedQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setStockMovements(loadedMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCashSessions(loadedSessions.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));
      setCashMovements(loadedCashMoves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAccountsPayable(loadedPayable.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setAccountsReceivable(loadedReceivable.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setPurchases(loadedPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAuditLogs(loadedAudit.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await db.saveSettings(updated);
    await db.logAudit('Configurações', 'Sistema', 'Configurações da loja atualizadas', undefined, currentUser.name);
    showToast('Configurações salvas com sucesso!', 'success');
  };

  const saveUser = async (user: AppUser) => {
    await db.put('users', user);
    await refreshData();
    showToast(`Usuário ${user.name} salvo com sucesso!`, 'success');
  };

  const currentCashSession = useMemo(() => {
    return cashSessions.find((s) => s.status === 'open');
  }, [cashSessions]);

  // Products
  const saveProduct = async (product: Product): Promise<Product> => {
    const isNew = !product.id || !products.some((p) => p.id === product.id);
    const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const productToSave: Product = {
      ...product,
      id,
      createdAt: product.createdAt || now,
      updatedAt: now,
    };

    // If new product with initial stock > 0, create stock movement
    if (isNew && productToSave.stock > 0) {
      await db.put('stockMovements', {
        id: `mov_${Date.now()}_init`,
        date: now,
        productId: id,
        productName: productToSave.name,
        sku: productToSave.sku,
        type: 'entrada',
        quantity: productToSave.stock,
        previousStock: 0,
        newStock: productToSave.stock,
        reason: 'Estoque inicial de cadastro',
        unitCost: productToSave.cost,
        userName: currentUser.name,
        createdAt: now,
      } as StockMovement);
    }

    await db.put('products', productToSave);
    await db.logAudit(
      isNew ? 'Produto Criado' : 'Produto Alterado',
      'Produtos',
      `${productToSave.name} (SKU: ${productToSave.sku})`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Produto "${productToSave.name}" salvo com sucesso!`, 'success');
    return productToSave;
  };

  const deleteProduct = async (id: string) => {
    const product = products.find((p) => p.id === id);
    await db.delete('products', id);
    await db.logAudit(
      'Produto Excluído',
      'Produtos',
      `Exclusão do produto: ${product?.name || id}`,
      id,
      currentUser.name
    );
    await refreshData();
    showToast('Produto excluído com sucesso.', 'info');
  };

  // Stock Movement
  const registerStockMovement = async (
    movement: Omit<StockMovement, 'id' | 'createdAt'>
  ) => {
    const now = new Date().toISOString();
    const movId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fullMovement: StockMovement = {
      ...movement,
      id: movId,
      createdAt: now,
      userName: currentUser.name,
    };

    const targetProduct = products.find((p) => p.id === movement.productId);
    if (!targetProduct) {
      throw new Error('Produto não encontrado');
    }

    const updatedProduct: Product = {
      ...targetProduct,
      stock: movement.newStock,
      status: movement.newStock <= 0 ? 'esgotado' : targetProduct.status === 'esgotado' ? 'ativo' : targetProduct.status,
      updatedAt: now,
    };

    await db.put('stockMovements', fullMovement);
    await db.put('products', updatedProduct);
    await db.logAudit(
      'Movimentação de Estoque',
      'Estoque',
      `${movement.type.toUpperCase()}: ${movement.quantity > 0 ? '+' : ''}${movement.quantity} em ${targetProduct.name} (Saldo: ${movement.newStock}). Motivo: ${movement.reason}`,
      targetProduct.id,
      currentUser.name
    );

    await refreshData();
    showToast(`Estoque de "${targetProduct.name}" atualizado para ${movement.newStock} un.`, 'success');
  };

  // Customers
  const saveCustomer = async (customer: Customer): Promise<Customer> => {
    const isNew = !customer.id || !customers.some((c) => c.id === customer.id);
    const id = customer.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const savedCustomer: Customer = {
      ...customer,
      id,
      createdAt: customer.createdAt || new Date().toISOString(),
    };

    await db.put('customers', savedCustomer);
    await db.logAudit(
      isNew ? 'Cliente Cadastrado' : 'Cliente Atualizado',
      'Clientes',
      `${savedCustomer.name} (${savedCustomer.whatsapp || savedCustomer.instagram || 'Sem contato'})`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Cliente "${savedCustomer.name}" salvo com sucesso!`, 'success');
    return savedCustomer;
  };

  const deleteCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    await db.delete('customers', id);
    await db.logAudit('Cliente Excluído', 'Clientes', `Exclusão: ${customer?.name || id}`, id, currentUser.name);
    await refreshData();
    showToast('Cliente removido.', 'info');
  };

  // Suppliers
  const saveSupplier = async (supplier: Supplier): Promise<Supplier> => {
    const id = supplier.id || `sup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const savedSupplier: Supplier = {
      ...supplier,
      id,
      createdAt: supplier.createdAt || new Date().toISOString(),
    };
    await db.put('suppliers', savedSupplier);
    await refreshData();
    showToast(`Fornecedor "${savedSupplier.name}" salvo!`, 'success');
    return savedSupplier;
  };

  const deleteSupplier = async (id: string) => {
    await db.delete('suppliers', id);
    await refreshData();
    showToast('Fornecedor removido.', 'info');
  };

  // Sales (PDV / Vendas)
  const completeSale = async (
    saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'userName'> & { userName?: string }
  ): Promise<Sale> => {
    const now = new Date().toISOString();
    const nextNumber = (sales.length + 1001).toString();
    const saleId = `sale_${Date.now()}`;

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      saleNumber: nextNumber,
      createdAt: now,
      userName: saleData.userName || currentUser.name,
    };

    // 1. Save Sale
    await db.put('sales', newSale);

    // 2. Reduce Stock for each item & combo/kit components
    for (const item of saleData.items) {
      const product = await db.getById<Product>('products', item.productId);
      if (product) {
        if (product.isKit && product.kitComponents && product.kitComponents.length > 0) {
          // It's a combo/kit: reduce components
          for (const comp of product.kitComponents) {
            const compProduct = await db.getById<Product>('products', comp.productId);
            if (compProduct) {
              const compQty = comp.quantity * item.quantity;
              const newCompStock = Math.max(0, compProduct.stock - compQty);
              await db.put('products', {
                ...compProduct,
                stock: newCompStock,
                status: newCompStock <= 0 ? 'esgotado' : compProduct.status,
                updatedAt: now,
              });
              await db.put('stockMovements', {
                id: `mov_${Date.now()}_${comp.productId}`,
                date: now,
                productId: compProduct.id,
                productName: compProduct.name,
                sku: compProduct.sku,
                type: 'venda',
                quantity: -compQty,
                previousStock: compProduct.stock,
                newStock: newCompStock,
                reason: `Venda #${nextNumber} (Componente do Kit ${product.name})`,
                referenceId: saleId,
                userName: currentUser.name,
                createdAt: now,
              } as StockMovement);
            }
          }
        } else {
          // Regular product
          const newStock = Math.max(0, product.stock - item.quantity);
          await db.put('products', {
            ...product,
            stock: newStock,
            status: newStock <= 0 ? 'esgotado' : product.status,
            updatedAt: now,
          });

          await db.put('stockMovements', {
            id: `mov_${Date.now()}_${product.id}`,
            date: now,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            type: 'venda',
            quantity: -item.quantity,
            previousStock: product.stock,
            newStock,
            reason: `Venda Balcão PDV #${nextNumber}`,
            referenceId: saleId,
            userName: currentUser.name,
            createdAt: now,
          } as StockMovement);
        }
      }
    }

    // 3. If Cash register is open, update session and add movement
    if (currentCashSession) {
      let updatedTotalCash = currentCashSession.totalCash;
      let updatedTotalPix = currentCashSession.totalPix;
      let updatedTotalCard = currentCashSession.totalCard;
      let updatedTotalOther = currentCashSession.totalOther;

      if (saleData.paymentMethod === 'dinheiro') {
        updatedTotalCash += saleData.total;
        await db.put('cashMovements', {
          id: `cmov_${Date.now()}`,
          sessionId: currentCashSession.id,
          date: now,
          type: 'venda',
          amount: saleData.total,
          method: 'dinheiro',
          reason: `Venda #${nextNumber}`,
          userName: currentUser.name,
          createdAt: now,
        } as CashMovement);
      } else if (saleData.paymentMethod === 'pix') {
        updatedTotalPix += saleData.total;
      } else if (saleData.paymentMethod.includes('credito') || saleData.paymentMethod === 'debito') {
        updatedTotalCard += saleData.total;
      } else {
        updatedTotalOther += saleData.total;
      }

      await db.put('cashSessions', {
        ...currentCashSession,
        totalCash: updatedTotalCash,
        totalPix: updatedTotalPix,
        totalCard: updatedTotalCard,
        totalOther: updatedTotalOther,
        grandTotal: updatedTotalCash + updatedTotalPix + updatedTotalCard + updatedTotalOther,
      });
    }

    await db.logAudit(
      'Venda Concluída',
      'Vendas',
      `Venda #${nextNumber} de R$ ${saleData.total.toFixed(2)} (${saleData.customerName})`,
      saleId,
      currentUser.name
    );

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    await refreshData();
    showToast(`Venda #${nextNumber} finalizada com sucesso!`, 'success');
    return newSale;
  };

  // Sale Cancellation with stock reversal
  const cancelSale = async (saleId: string, reason: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    if (sale.status === 'cancelled') {
      showToast('Esta venda já foi cancelada anteriormente.', 'warning');
      return;
    }

    const now = new Date().toISOString();

    // 1. Revert stock
    for (const item of sale.items) {
      const product = await db.getById<Product>('products', item.productId);
      if (product) {
        const restoredStock = product.stock + item.quantity;
        await db.put('products', {
          ...product,
          stock: restoredStock,
          status: restoredStock > 0 && product.status === 'esgotado' ? 'ativo' : product.status,
          updatedAt: now,
        });

        await db.put('stockMovements', {
          id: `mov_${Date.now()}_cancel_${product.id}`,
          date: now,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'cancelamento',
          quantity: item.quantity,
          previousStock: product.stock,
          newStock: restoredStock,
          reason: `Cancelamento da Venda #${sale.saleNumber}. Motivo: ${reason}`,
          referenceId: sale.id,
          userName: currentUser.name,
          createdAt: now,
        } as StockMovement);
      }
    }

    // 2. Mark sale as cancelled
    const updatedSale: Sale = {
      ...sale,
      status: 'cancelled',
      cancelledAt: now,
      cancelReason: reason,
    };
    await db.put('sales', updatedSale);

    // 3. Cash adjustment if needed
    if (currentCashSession && sale.paymentMethod === 'dinheiro') {
      await db.put('cashMovements', {
        id: `cmov_${Date.now()}_cancel`,
        sessionId: currentCashSession.id,
        date: now,
        type: 'ajuste',
        amount: -sale.total,
        method: 'dinheiro',
        reason: `Estorno Venda Cancelada #${sale.saleNumber}`,
        userName: currentUser.name,
        createdAt: now,
      } as CashMovement);

      await db.put('cashSessions', {
        ...currentCashSession,
        totalCash: Math.max(0, currentCashSession.totalCash - sale.total),
        grandTotal: Math.max(0, currentCashSession.grandTotal - sale.total),
      });
    }

    await db.logAudit(
      'Venda Cancelada',
      'Vendas',
      `Cancelamento da venda #${sale.saleNumber}. Motivo: ${reason}`,
      sale.id,
      currentUser.name
    );

    await refreshData();
    showToast(`Venda #${sale.saleNumber} cancelada e estoque estornado!`, 'info');
  };

  // Orders (Instagram / WhatsApp)
  const saveOrder = async (order: Order): Promise<Order> => {
    const isNew = !order.id || !orders.some((o) => o.id === order.id);
    const id = order.id || `order_${Date.now()}`;
    const orderNumber = order.orderNumber || `PED-${orders.length + 101}`;
    const now = new Date().toISOString();

    const savedOrder: Order = {
      ...order,
      id,
      orderNumber,
      createdAt: order.createdAt || now,
      updatedAt: now,
    };

    await db.put('orders', savedOrder);
    await db.logAudit(
      isNew ? 'Pedido Criado' : 'Pedido Atualizado',
      'Pedidos',
      `Pedido #${orderNumber} (${savedOrder.customerName} - ${savedOrder.origin.toUpperCase()})`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Pedido #${orderNumber} salvo com sucesso!`, 'success');
    return savedOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
    };

    await db.put('orders', updatedOrder);
    await db.logAudit(
      'Status de Pedido Alterado',
      'Pedidos',
      `Pedido #${order.orderNumber} mudou para ${status.toUpperCase()}`,
      orderId,
      currentUser.name
    );

    await refreshData();
    showToast(`Pedido #${order.orderNumber} atualizado para "${status.replace('_', ' ')}"!`, 'info');
  };

  const deleteOrder = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    await db.delete('orders', id);
    await db.logAudit(
      'Pedido Excluído',
      'Pedidos',
      `Pedido #${order?.orderNumber || id} excluído`,
      id,
      currentUser.name
    );
    await refreshData();
    showToast(`Pedido #${order?.orderNumber || id} excluído com sucesso!`, 'info');
  };

  // Quotes
  const saveQuote = async (quote: Quote): Promise<Quote> => {
    const id = quote.id || `quote_${Date.now()}`;
    const quoteNumber = quote.quoteNumber || `ORC-${quotes.length + 101}`;
    const savedQuote: Quote = {
      ...quote,
      id,
      quoteNumber,
      createdAt: quote.createdAt || new Date().toISOString(),
    };
    await db.put('quotes', savedQuote);
    await refreshData();
    showToast(`Orçamento #${quoteNumber} salvo!`, 'success');
    return savedQuote;
  };

  // Purchases
  const savePurchase = async (purchase: Purchase): Promise<Purchase> => {
    const now = new Date().toISOString();
    const id = purchase.id || `purch_${Date.now()}`;
    const purchaseNumber = purchase.purchaseNumber || `COMP-${purchases.length + 101}`;

    const savedPurchase: Purchase = {
      ...purchase,
      id,
      purchaseNumber,
      createdAt: purchase.createdAt || now,
    };

    // Update stock and cost for each item
    for (const item of purchase.items) {
      const product = await db.getById<Product>('products', item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        let newCost = product.cost;

        if (purchase.costUpdateStrategy === 'ultimo') {
          newCost = item.unitCost;
        } else if (purchase.costUpdateStrategy === 'medio') {
          // Average cost: ((current stock * current cost) + (incoming qty * incoming cost)) / total stock
          const totalVal = product.stock * product.cost + item.quantity * item.unitCost;
          newCost = newStock > 0 ? Math.round((totalVal / newStock) * 100) / 100 : item.unitCost;
        }

        await db.put('products', {
          ...product,
          stock: newStock,
          cost: newCost,
          status: newStock > 0 && product.status === 'esgotado' ? 'ativo' : product.status,
          updatedAt: now,
        });

        await db.put('stockMovements', {
          id: `mov_${Date.now()}_purch_${item.productId}`,
          date: now,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'entrada',
          quantity: item.quantity,
          previousStock: product.stock,
          newStock,
          reason: `Entrada Compra #${purchaseNumber} ${purchase.supplierName ? `(${purchase.supplierName})` : ''}`,
          unitCost: item.unitCost,
          referenceId: id,
          userName: currentUser.name,
          createdAt: now,
        } as StockMovement);
      }
    }

    // Register account payable automatically
    await db.put('accountsPayable', {
      id: `ap_${Date.now()}`,
      description: `Compra de Mercadorias #${purchaseNumber} - ${purchase.supplierName || 'Fornecedor'}`,
      category: 'Mercadoria',
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      amount: purchase.totalCost,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      status: 'pendente',
      notes: `Referente à compra NF ${purchase.invoiceNumber || 'S/N'}`,
      createdAt: now,
    } as AccountPayable);

    await db.put('purchases', savedPurchase);
    await db.logAudit(
      'Compra Registrada',
      'Estoque / Compras',
      `Entrada de mercadorias #${purchaseNumber} no valor de R$ ${purchase.totalCost.toFixed(2)}`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Entrada #${purchaseNumber} registrada e estoque abastecido!`, 'success');
    return savedPurchase;
  };

  // Accounts Payable
  const saveAccountPayable = async (item: AccountPayable): Promise<AccountPayable> => {
    const id = item.id || `ap_${Date.now()}`;
    const saved: AccountPayable = {
      ...item,
      id,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    await db.put('accountsPayable', saved);
    await refreshData();
    showToast('Conta a pagar salva!', 'success');
    return saved;
  };

  const markAccountPayablePaid = async (id: string, paymentMethod: PaymentMethod = 'pix') => {
    const item = accountsPayable.find((a) => a.id === id);
    if (!item) return;

    const today = new Date().toISOString().slice(0, 10);
    const updated: AccountPayable = {
      ...item,
      status: 'pago',
      paymentDate: today,
      paymentMethod,
    };

    // If paid in cash and cash session is open, record expense
    if (paymentMethod === 'dinheiro' && currentCashSession) {
      await addCashMovement('despesa', item.amount, `Pagamento: ${item.description}`, 'dinheiro');
    }

    await db.put('accountsPayable', updated);
    await db.logAudit(
      'Conta Paga',
      'Financeiro',
      `Pagamento de ${item.description} no valor de R$ ${item.amount.toFixed(2)}`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Conta "${item.description}" marcada como paga!`, 'success');
  };

  const deleteAccountPayable = async (id: string) => {
    await db.delete('accountsPayable', id);
    await refreshData();
    showToast('Conta a pagar excluída.', 'info');
  };

  // Accounts Receivable
  const saveAccountReceivable = async (item: AccountReceivable): Promise<AccountReceivable> => {
    const id = item.id || `ar_${Date.now()}`;
    const saved: AccountReceivable = {
      ...item,
      id,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    await db.put('accountsReceivable', saved);
    await refreshData();
    showToast('Conta a receber salva!', 'success');
    return saved;
  };

  const markAccountReceivableReceived = async (id: string, paymentMethod: PaymentMethod = 'pix') => {
    const item = accountsReceivable.find((a) => a.id === id);
    if (!item) return;

    const today = new Date().toISOString().slice(0, 10);
    const updated: AccountReceivable = {
      ...item,
      status: 'recebido',
      receiptDate: today,
      paymentMethod,
    };

    if (paymentMethod === 'dinheiro' && currentCashSession) {
      await addCashMovement('suprimento', item.amount, `Recebimento: ${item.description}`, 'dinheiro');
    }

    await db.put('accountsReceivable', updated);
    await db.logAudit(
      'Conta Recebida',
      'Financeiro',
      `Recebimento de ${item.description} no valor de R$ ${item.amount.toFixed(2)}`,
      id,
      currentUser.name
    );

    await refreshData();
    showToast(`Conta "${item.description}" recebida com sucesso!`, 'success');
  };

  const deleteAccountReceivable = async (id: string) => {
    await db.delete('accountsReceivable', id);
    await refreshData();
    showToast('Conta a receber removida.', 'info');
  };

  // Cash Register Sessions
  const openCashSession = async (initialAmount: number, notes?: string): Promise<CashSession> => {
    if (currentCashSession) {
      throw new Error('Já existe um caixa aberto.');
    }

    const now = new Date().toISOString();
    const sessionId = `cash_${Date.now()}`;

    const newSession: CashSession = {
      id: sessionId,
      openedAt: now,
      initialAmount,
      status: 'open',
      totalCash: initialAmount,
      totalPix: 0,
      totalCard: 0,
      totalOther: 0,
      grandTotal: initialAmount,
      notes,
      openedBy: currentUser.name,
    };

    await db.put('cashSessions', newSession);
    await db.put('cashMovements', {
      id: `cmov_${Date.now()}_open`,
      sessionId,
      date: now,
      type: 'suprimento',
      amount: initialAmount,
      reason: 'Abertura de Caixa - Fundo de Troco',
      userName: currentUser.name,
      createdAt: now,
    } as CashMovement);

    await db.logAudit(
      'Abertura de Caixa',
      'Caixa',
      `Caixa aberto com fundo inicial de R$ ${initialAmount.toFixed(2)}`,
      sessionId,
      currentUser.name
    );

    await refreshData();
    showToast(`Caixa aberto com R$ ${initialAmount.toFixed(2)}!`, 'success');
    return newSession;
  };

  const closeCashSession = async (countedCash: number, notes?: string): Promise<CashSession> => {
    if (!currentCashSession) {
      throw new Error('Nenhum caixa aberto para fechar.');
    }

    const now = new Date().toISOString();
    const expectedCash = currentCashSession.totalCash;
    const difference = Math.round((countedCash - expectedCash) * 100) / 100;

    const closedSession: CashSession = {
      ...currentCashSession,
      status: 'closed',
      closedAt: now,
      expectedCash,
      countedCash,
      difference,
      notes,
      closedBy: currentUser.name,
    };

    await db.put('cashSessions', closedSession);
    await db.logAudit(
      'Fechamento de Caixa',
      'Caixa',
      `Caixa fechado. Dinheiro esperado: R$ ${expectedCash.toFixed(2)}, Contado: R$ ${countedCash.toFixed(2)}, Diferença: R$ ${difference.toFixed(2)}`,
      closedSession.id,
      currentUser.name
    );

    await refreshData();
    showToast('Caixa fechado com sucesso!', 'info');
    return closedSession;
  };

  const addCashMovement = async (
    type: CashMovementType,
    amount: number,
    reason: string,
    method: PaymentMethod = 'dinheiro'
  ): Promise<CashMovement> => {
    if (!currentCashSession) {
      throw new Error('Abra o caixa antes de lançar movimentações.');
    }

    const now = new Date().toISOString();
    const mov: CashMovement = {
      id: `cmov_${Date.now()}`,
      sessionId: currentCashSession.id,
      date: now,
      type,
      amount,
      method,
      reason,
      userName: currentUser.name,
      createdAt: now,
    };

    let newTotalCash = currentCashSession.totalCash;
    if (type === 'suprimento') {
      newTotalCash += amount;
    } else if (type === 'sangria' || type === 'despesa') {
      newTotalCash -= amount;
    }

    await db.put('cashMovements', mov);
    await db.put('cashSessions', {
      ...currentCashSession,
      totalCash: Math.max(0, newTotalCash),
      grandTotal: Math.max(0, currentCashSession.grandTotal + (type === 'suprimento' ? amount : -amount)),
    });

    await db.logAudit(
      `Caixa: ${type.toUpperCase()}`,
      'Caixa',
      `Lançamento de ${type} no valor de R$ ${amount.toFixed(2)}: ${reason}`,
      currentCashSession.id,
      currentUser.name
    );

    await refreshData();
    showToast(`Movimentação de caixa registrada!`, 'success');
    return mov;
  };

  // Demo / Clear
  const loadDemoData = async () => {
    await db.seedDemoData();
    await refreshData();
    showToast('Dados de demonstração carregados com sucesso!', 'success');
  };

  const clearAllData = async () => {
    await db.clearAll();
    await db.saveSettings({
      ...initialSettings,
      setupCompleted: false,
    });
    await db.putMany('users', initialUsers);
    await refreshData();
    showToast('Todos os dados foram resetados.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        currentUser,
        setCurrentUser,
        users,
        saveUser,
        activeTab,
        setActiveTab,
        isFastPDVOpen,
        setIsFastPDVOpen,
        products,
        customers,
        suppliers,
        sales,
        orders,
        quotes,
        stockMovements,
        cashSessions,
        cashMovements,
        accountsPayable,
        accountsReceivable,
        purchases,
        auditLogs,
        refreshData,
        saveProduct,
        deleteProduct,
        registerStockMovement,
        saveCustomer,
        deleteCustomer,
        saveSupplier,
        deleteSupplier,
        completeSale,
        cancelSale,
        saveOrder,
        updateOrderStatus,
        deleteOrder,
        saveQuote,
        savePurchase,
        saveAccountPayable,
        markAccountPayablePaid,
        deleteAccountPayable,
        saveAccountReceivable,
        markAccountReceivableReceived,
        deleteAccountReceivable,
        currentCashSession,
        openCashSession,
        closeCashSession,
        addCashMovement,
        loadDemoData,
        clearAllData,
        showToast,
        toasts,
        removeToast,
        isOnline,
        isLoading,
        selectedCategory,
        setSelectedCategory,
        isSidebarCompact,
        setIsSidebarCompact,
        toggleSidebarCompact,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
