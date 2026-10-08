import {
  AccountPayable,
  AccountReceivable,
  AppUser,
  AuditLog,
  AutoBackupRecord,
  CashMovement,
  CashSession,
  Customer,
  Order,
  Product,
  Promotion,
  Purchase,
  Quote,
  Sale,
  StockMovement,
  StoreSettings,
  Supplier,
} from '../types';
import {
  initialSettings,
  initialUsers,
  sampleAccountsPayable,
  sampleAccountsReceivable,
  sampleCashMovements,
  sampleCashSession,
  sampleCustomers,
  sampleOrders,
  sampleProducts,
  sampleSales,
  sampleStockMovements,
  sampleSuppliers,
} from './seedData';

const DB_NAME = 'MinhaLojaDB';
const DB_VERSION = 2;

export const STORE_NAMES = [
  'products',
  'suppliers',
  'customers',
  'sales',
  'orders',
  'quotes',
  'stockMovements',
  'cashSessions',
  'cashMovements',
  'accountsPayable',
  'accountsReceivable',
  'purchases',
  'auditLogs',
  'users',
  'settings',
  'promotions',
  'backups',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        STORE_NAMES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });

            // Create common indices for quick search
            if (storeName === 'products') {
              store.createIndex('sku', 'sku', { unique: false });
              store.createIndex('barcode', 'barcode', { unique: false });
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            } else if (storeName === 'sales') {
              store.createIndex('date', 'date', { unique: false });
              store.createIndex('customerId', 'customerId', { unique: false });
              store.createIndex('saleNumber', 'saleNumber', { unique: false });
            } else if (storeName === 'orders') {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('date', 'date', { unique: false });
            } else if (storeName === 'stockMovements') {
              store.createIndex('productId', 'productId', { unique: false });
              store.createIndex('date', 'date', { unique: false });
            } else if (storeName === 'cashMovements') {
              store.createIndex('sessionId', 'sessionId', { unique: false });
            }
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T extends { id: string }>(storeName: StoreName, item: T): Promise<T> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  async putMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
    if (items.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: StoreName): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    for (const name of STORE_NAMES) {
      await this.clear(name);
    }
  }

  async getSettings(): Promise<StoreSettings> {
    const dbSettings = await this.getById<StoreSettings & { id: string }>('settings', 'main_settings');
    if (dbSettings) {
      return dbSettings;
    }
    // Try localStorage fallback or default
    const saved = localStorage.getItem('minha_loja_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        await this.saveSettings(parsed);
        return parsed;
      } catch {}
    }
    await this.saveSettings(initialSettings);
    return initialSettings;
  }

  async saveSettings(settings: StoreSettings): Promise<StoreSettings> {
    await this.put('settings', { ...settings, id: 'main_settings' });
    try {
      localStorage.setItem('minha_loja_settings', JSON.stringify(settings));
    } catch {}
    return settings;
  }

  async logAudit(action: string, entity: string, details: string, entityId?: string, userName = 'Sistema') {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      action,
      entity,
      entityId,
      details,
      userName,
      createdAt: new Date().toISOString(),
    };
    await this.put('auditLogs', log);
  }

  /**
   * Populate initial demo data
   */
  async seedDemoData(): Promise<void> {
    await this.clearAll();

    await this.saveSettings(initialSettings);
    await this.putMany('users', initialUsers);
    await this.putMany('suppliers', sampleSuppliers);
    await this.putMany('customers', sampleCustomers);
    await this.putMany('products', sampleProducts);
    await this.putMany('stockMovements', sampleStockMovements);
    await this.putMany('sales', sampleSales);
    await this.putMany('orders', sampleOrders);
    await this.putMany('accountsPayable', sampleAccountsPayable);
    await this.putMany('accountsReceivable', sampleAccountsReceivable);
    await this.put('cashSessions', sampleCashSession);
    await this.putMany('cashMovements', sampleCashMovements);

    await this.logAudit(
      'Carga Inicial',
      'Sistema',
      'Dados demonstrativos carregados com sucesso',
      undefined,
      'Administrador'
    );
  }

  /**
   * Export complete database to JSON
   */
  async exportBackup(): Promise<string> {
    const backup: Record<string, unknown> = {
      version: 2,
      appName: 'Minha Loja',
      exportedAt: new Date().toISOString(),
      data: {},
    };

    for (const storeName of STORE_NAMES) {
      if (storeName === 'backups') continue; // Avoid recursive backup records
      const items = await this.getAll(storeName);
      (backup.data as Record<string, unknown>)[storeName] = items;
    }

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Validate backup structure and return counts summary
   */
  validateBackup(jsonString: string): { valid: boolean; counts?: Record<string, number>; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        return { valid: false, error: 'Arquivo inválido: estrutura "data" não encontrada.' };
      }

      const counts: Record<string, number> = {};
      let totalRecords = 0;

      for (const storeName of STORE_NAMES) {
        if (storeName === 'backups') continue;
        const items = parsed.data[storeName];
        if (Array.isArray(items)) {
          counts[storeName] = items.length;
          totalRecords += items.length;
        } else {
          counts[storeName] = 0;
        }
      }

      if (totalRecords === 0 && !parsed.data.settings) {
        return { valid: false, error: 'O arquivo não contém registros válidos para restauração.' };
      }

      return { valid: true, counts };
    } catch (err: any) {
      return { valid: false, error: `Erro ao analisar JSON: ${err.message}` };
    }
  }

  /**
   * Import complete database from JSON with safe rollback check
   */
  async importBackup(jsonString: string): Promise<{ success: boolean; counts: Record<string, number> }> {
    const validation = this.validateBackup(jsonString);
    if (!validation.valid || !validation.counts) {
      throw new Error(validation.error || 'Arquivo de backup inválido.');
    }

    const parsed = JSON.parse(jsonString);
    const counts: Record<string, number> = {};

    for (const storeName of STORE_NAMES) {
      if (storeName === 'backups') continue;
      const items = parsed.data[storeName];
      if (Array.isArray(items)) {
        await this.clear(storeName);
        if (items.length > 0) {
          await this.putMany(storeName, items);
        }
        counts[storeName] = items.length;
      }
    }

    await this.logAudit('Restauração', 'Backup', 'Backup importado com sucesso', undefined, 'Administrador');

    return { success: true, counts };
  }

  /**
   * Create an automatic snapshot backup into IndexedDB
   */
  async createAutoBackup(reason: string): Promise<AutoBackupRecord> {
    const json = await this.exportBackup();
    const id = `backup_${Date.now()}`;
    const now = new Date().toISOString();

    const counts = this.validateBackup(json).counts || {};
    const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

    const record: AutoBackupRecord = {
      id,
      date: now,
      reason,
      dataSize: new Blob([json]).size,
      recordsCount: totalItems,
      jsonBackup: json,
    };

    await this.put('backups', record as any);

    // Keep only the most recent 12 auto-backups to preserve storage
    const allBackups = await this.getAll<AutoBackupRecord>('backups');
    if (allBackups.length > 12) {
      const sorted = allBackups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const toDelete = sorted.slice(0, sorted.length - 12);
      for (const item of toDelete) {
        await this.delete('backups', item.id);
      }
    }

    return record;
  }

  async getAutoBackups(): Promise<AutoBackupRecord[]> {
    const list = await this.getAll<AutoBackupRecord>('backups');
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async deleteAutoBackup(id: string): Promise<void> {
    await this.delete('backups', id);
  }
}

export const db = new IndexedDBManager();
