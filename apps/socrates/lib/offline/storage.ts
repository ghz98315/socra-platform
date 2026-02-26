// =====================================================
// Project Socrates - Offline Storage (IndexedDB)
// 离线数据存储
// =====================================================

import type { OfflineData, OfflineOperation } from './types';

const DB_NAME = 'socrates_offline';
const DB_VERSION = 1;

// 数据库存储
let dbInstance: IDBDatabase | null = null;

// 初始化数据库
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 离线数据存储
      if (!db.objectStoreNames.contains('offline_data')) {
        const dataStore = db.createObjectStore('offline_data', { keyPath: 'id' });
        dataStore.createIndex('type', 'type', { unique: false });
        dataStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 操作队列
      if (!db.objectStoreNames.contains('operations')) {
        const opStore = db.createObjectStore('operations', { keyPath: 'id' });
        opStore.createIndex('table', 'table', { unique: false });
        opStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      console.log('IndexedDB schema upgraded');
    };
  });
}

// 保存离线数据
export async function saveOfflineData(data: OfflineData): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 获取离线数据
export async function getOfflineData(id: string): Promise<OfflineData | null> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readonly');
    const store = transaction.objectStore('offline_data');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// 获取所有待同步数据
export async function getPendingData(): Promise<OfflineData[]> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readonly');
    const store = transaction.objectStore('offline_data');
    const index = store.index('syncStatus');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 获取指定类型的离线数据
export async function getOfflineDataByType(type: OfflineData['type']): Promise<OfflineData[]> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readonly');
    const store = transaction.objectStore('offline_data');
    const index = store.index('type');
    const request = index.getAll(type);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 删除离线数据
export async function deleteOfflineData(id: string): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 添加操作到队列
export async function queueOperation(operation: OfflineOperation): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    const request = store.put(operation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 获取所有待处理操作
export async function getPendingOperations(): Promise<OfflineOperation[]> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 删除操作
export async function deleteOperation(id: string): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 清空所有离线数据
export async function clearOfflineData(): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data', 'operations'], 'readwrite');

    const dataRequest = transaction.objectStore('offline_data').clear();
    const opRequest = transaction.objectStore('operations').clear();

    let dataDone = false;
    let opDone = false;

    const checkDone = () => {
      if (dataDone && opDone) resolve();
    };

    dataRequest.onsuccess = () => { dataDone = true; checkDone(); };
    dataRequest.onerror = () => reject(dataRequest.error);

    opRequest.onsuccess = () => { opDone = true; checkDone(); };
    opRequest.onerror = () => reject(opRequest.error);
  });
}

// 获取存储使用情况
export async function getStorageInfo(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }

  // Fallback: 估算 IndexedDB 使用量
  return { used: 0, quota: 50 * 1024 * 1024 }; // 假设 50MB 配额
}

// 生成唯一 ID
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
