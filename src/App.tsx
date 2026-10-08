import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { MenuDrawer } from './components/layout/MenuDrawer';
import { Header } from './components/layout/Header';
import { ContextualWorkspaceBar } from './components/layout/ContextualWorkspaceBar';
import { CircularCategoryBar } from './components/common/CircularCategoryBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileQuickActionStrip } from './components/layout/MobileQuickActionStrip';
import { QuickSaleFloatingButton } from './components/layout/QuickSaleFloatingButton';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { CameraScannerModal } from './components/common/CameraScannerModal';
import { InstagramCardGeneratorModal } from './components/catalog/InstagramCardGeneratorModal';

// Tabs & Views
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ProductList } from './components/products/ProductList';
import { ProductFormModal } from './components/products/ProductFormModal';
import { BarcodeModal } from './components/products/BarcodeModal';
import { CSVImportModal } from './components/products/CSVImportModal';
import { StockList } from './components/stock/StockList';
import { StockMovementModal } from './components/stock/StockMovementModal';
import { FastPOSModal } from './components/pdv/FastPOSModal';
import { SalesHistory } from './components/sales/SalesHistory';
import { OrderKanban } from './components/orders/OrderKanban';
import { NewOrderModal } from './components/orders/NewOrderModal';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerModal } from './components/customers/CustomerModal';
import { SupplierList } from './components/suppliers/SupplierList';
import { PurchasesList } from './components/purchases/PurchasesList';
import { QuotesList } from './components/quotes/QuotesList';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { FinancialOverview } from './components/financial/FinancialOverview';
import { ReportsView } from './components/reports/ReportsView';
import { BatchLabelsPrintView } from './components/labels/BatchLabelsPrintView';
import { DigitalCatalogView } from './components/catalog/DigitalCatalogView';
import { PublicCatalogView } from './components/catalog/PublicCatalogView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';
import { CrmLoyaltyView } from './components/crm/CrmLoyaltyView';
import { PromotionsView } from './components/promotions/PromotionsView';
import { DeviceSyncView } from './components/sync/DeviceSyncView';
import { AuditLogsView } from './components/audit/AuditLogsView';

import { Product, Customer, Order } from './types';

const MainApp: React.FC = () => {
  const {
    settings,
    activeTab,
    isFastPDVOpen,
    setIsFastPDVOpen,
    isLoading,
    products,
    selectedCategory,
    setSelectedCategory,
  } = useApp();

  // Omnipresent category metadata for global quick navigation
  const customCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Retractable Navigation Menu Drawer state
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Global modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Instagram / WhatsApp Card Generator modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardProduct, setSelectedCardProduct] = useState<Product | null>(null);

  // Product modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDuplicateProduct, setIsDuplicateProduct] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);

  // Stock Movement modal
  const [isStockMovementModalOpen, setIsStockMovementModalOpen] = useState(false);
  const [targetStockProduct, setTargetStockProduct] = useState<Product | null>(null);

  // Customer modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Hotkeys: Ctrl+K/Cmd+K for search, M for Menu Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (
        e.key.toLowerCase() === 'm' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
      ) {
        setIsMenuDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Iniciando Minha Loja...</p>
      </div>
    );
  }

  // First-time Onboarding Wizard
  if (!settings.setupCompleted) {
    return (
      <>
        <OnboardingWizard />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] dark:bg-[#171412] text-[#2C241E] dark:text-[#F3EDE6] font-sans selection:bg-[#C99F3B] selection:text-white">
      {/* Retractable Luxury Navigation Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onOpenCardGenerator={() => {
          setSelectedCardProduct(null);
          setIsCardModalOpen(true);
        }}
      />

      {/* Main Layout Area - Full Width Canvas */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header
          onOpenMenuDrawer={() => setIsMenuDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenScanner={() => setIsCameraScannerOpen(true)}
          onOpenCardGenerator={() => {
            setSelectedCardProduct(null);
            setIsCardModalOpen(true);
          }}
        />

        <main className="flex-1 px-3.5 py-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto pb-32 md:pb-8">
          {/* Mobile Quick Action Strip (Ergonomic Touch Command Center) */}
          <MobileQuickActionStrip
            onOpenProductModal={() => {
              setEditingProduct(null);
              setIsDuplicateProduct(false);
              setIsProductModalOpen(true);
            }}
            onOpenScanner={() => setIsCameraScannerOpen(true)}
            onOpenCardGenerator={() => {
              setSelectedCardProduct(null);
              setIsCardModalOpen(true);
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenStockMovementModal={() => {
              setTargetStockProduct(null);
              setIsStockMovementModalOpen(true);
            }}
          />

          {/* Desktop Workspace Contextual Bar */}
          <div className="hidden md:block">
            <ContextualWorkspaceBar
              onOpenProductModal={() => {
                setEditingProduct(null);
                setIsDuplicateProduct(false);
                setIsProductModalOpen(true);
              }}
              onOpenStockMovementModal={() => {
                setTargetStockProduct(null);
                setIsStockMovementModalOpen(true);
              }}
              onOpenCSVImport={() => setIsCSVImportOpen(true)}
              onOpenScanner={() => setIsCameraScannerOpen(true)}
              onOpenOrderModal={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
            />
          </div>

          {/* Omnipresent Quick Category Navigation (Applied Independent of Module) */}
          <div className="mb-3 sm:mb-5 p-2 sm:p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-[#E8DFC8]/60 dark:border-[#3A302A]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase font-extrabold text-[#9D7320] dark:text-[#E6BE65] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                <span>Navegação Rápida por Categorias</span>
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-[10px] sm:text-[11px] font-bold text-[#9D7320] dark:text-[#E6BE65] hover:underline cursor-pointer"
                >
                  Ver Todos
                </button>
              )}
            </div>

            <CircularCategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              categoryCounts={categoryCounts}
              customCategories={customCategories}
            />
          </div>
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onOpenProductModal={() => {
                setEditingProduct(null);
                setIsDuplicateProduct(false);
                setIsProductModalOpen(true);
              }}
              onOpenStockMovementModal={() => {
                setTargetStockProduct(null);
                setIsStockMovementModalOpen(true);
              }}
              onOpenCustomerModal={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenOrderModal={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
              onOpenCardGenerator={() => {
                setSelectedCardProduct(null);
                setIsCardModalOpen(true);
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductList
              onOpenCreate={() => {
                setEditingProduct(null);
                setIsDuplicateProduct(false);
                setIsProductModalOpen(true);
              }}
              onOpenEdit={(product) => {
                setEditingProduct(product);
                setIsDuplicateProduct(false);
                setIsProductModalOpen(true);
              }}
              onOpenDuplicate={(product) => {
                setEditingProduct(product);
                setIsDuplicateProduct(true);
                setIsProductModalOpen(true);
              }}
              onOpenBarcode={(product) => {
                setSelectedProductForBarcode(product);
              }}
              onOpenImportCSV={() => setIsCSVImportOpen(true)}
              onOpenQuickStock={(product) => {
                setTargetStockProduct(product);
                setIsStockMovementModalOpen(true);
              }}
              onOpenCardGenerator={(product) => {
                setSelectedCardProduct(product || null);
                setIsCardModalOpen(true);
              }}
            />
          )}

          {activeTab === 'stock' && (
            <StockList
              onOpenMovementModal={(product) => {
                setTargetStockProduct(product || null);
                setIsStockMovementModalOpen(true);
              }}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsDuplicateProduct(false);
                setIsProductModalOpen(true);
              }}
            />
          )}

          {activeTab === 'pdv' && (
            <div className="space-y-4">
              <CashRegisterView />
            </div>
          )}

          {activeTab === 'sales' && <SalesHistory />}

          {activeTab === 'orders' && (
            <OrderKanban
              onOpenCreate={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
              onOpenEdit={(order) => {
                setEditingOrder(order);
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              onOpenCreate={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenEdit={(customer) => {
                setEditingCustomer(customer);
                setIsCustomerModalOpen(true);
              }}
            />
          )}

          {activeTab === 'suppliers' && <SupplierList />}

          {activeTab === 'purchases' && <PurchasesList />}

          {activeTab === 'quotes' && <QuotesList />}

          {activeTab === 'cash' && <CashRegisterView />}

          {activeTab === 'financial' && <FinancialOverview />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'labels' && <BatchLabelsPrintView />}

          {activeTab === 'catalog' && <DigitalCatalogView />}

          {activeTab === 'crm' && <CrmLoyaltyView />}

          {activeTab === 'promotions' && <PromotionsView />}

          {activeTab === 'sync' && <DeviceSyncView />}

          {activeTab === 'audit' && <AuditLogsView />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'backup' && <BackupRestoreView />}
        </main>
      </div>

      {/* Floating "+ VENDA" Fast POS Button */}
      <QuickSaleFloatingButton />

      {/* Fast POS Checkout Modal */}
      <FastPOSModal
        isOpen={isFastPDVOpen}
        onClose={() => setIsFastPDVOpen(false)}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        duplicateMode={isDuplicateProduct}
      />

      {/* Barcode and QR Code Modal */}
      <BarcodeModal
        isOpen={!!selectedProductForBarcode}
        onClose={() => setSelectedProductForBarcode(null)}
        product={selectedProductForBarcode}
      />

      {/* CSV Product Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportOpen}
        onClose={() => setIsCSVImportOpen(false)}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isStockMovementModalOpen}
        onClose={() => setIsStockMovementModalOpen(false)}
        targetProduct={targetStockProduct}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={editingCustomer}
      />

      {/* Order Modal */}
      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orderToEdit={editingOrder}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(id) => {
          const p = document.getElementById(id);
          p?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code) => {
          setIsFastPDVOpen(true);
        }}
      />

      {/* Floating Toast Alerts / Offline Banner */}
      <ToastContainer />
      <OfflineIndicator />

      {/* Instagram / WhatsApp Card Generator Modal */}
      <InstagramCardGeneratorModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        initialProduct={selectedCardProduct}
      />

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on phones) */}
      <MobileBottomNav onOpenMenu={() => setIsMenuDrawerOpen(true)} />
    </div>
  );
};

// Helper to detect if accessing the dedicated public catalog area
function checkIsPublicCatalogMode(): boolean {
  if (typeof window === 'undefined') return false;
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  return (
    search.includes('catalogo') ||
    search.includes('catalog') ||
    search.includes('vitrine') ||
    hash.includes('catalogo') ||
    hash.includes('catalog') ||
    hash.includes('vitrine') ||
    path.endsWith('/catalogo') ||
    path.endsWith('/vitrine')
  );
}

export default function App() {
  const [isPublicCatalog, setIsPublicCatalog] = useState(checkIsPublicCatalogMode);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsPublicCatalog(checkIsPublicCatalogMode());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Dedicated, Public Customer Catalog View (completely separated from internal admin)
  if (isPublicCatalog) {
    return (
      <AppProvider>
        <PublicCatalogView />
        <ToastContainer />
      </AppProvider>
    );
  }

  // Internal Management System (PDV, Stock, Financial, Settings)
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
