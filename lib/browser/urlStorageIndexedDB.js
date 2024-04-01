const isSupportIndexedDB = () => {
  return 'indexedDB' in window
  };

  let hasStorage = false;
  try {
    hasStorage = isSupportIndexedDB();
  } catch (e) {
    if (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR) {
      hasStorage = false;
    } else {
      throw e;
    }
  }

  export const canStoreURLsInIndexedDB = hasStorage;

  export class IndexedDBUrlStorage {
    constructor() {
      this.dbName = 'tusUrlStorage';
      this.storeName = 'upload';
      this.dbPromise = this.openDatabase();
    }

    openDatabase() {
      return new Promise((resolve, reject) => {
          const openRequest = indexedDB.open(this.dbName);
          openRequest.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(this.storeName)) {
                  db.createObjectStore(this.storeName, {keyPath: 'urlStorageKey'});
              }
          };
          openRequest.onsuccess = () => resolve(openRequest.result);
          openRequest.onerror = (event) => reject(event);
      });
  }

    async _getAllUploadWithKeys() {
      try {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        const results = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = reject;
        });
        return results.map((result) => ({
          ...result,
          urlStorageKey: result.urlStorageKey,
        }));
      } catch (error) {
        throw error;
      }
    }

    async findAllUploads() {
      try {
        const results = await this._getAllUploadWithKeys();
        return results;
      } catch (error) {
        throw error;
      }
    }

    async findUploadsByFingerprint(fingerprint) {
      try {
        const allData = await this._getAllUploadWithKeys();
        const results = allData.find(
          (data) => data.urlStorageKey.startsWith(`tus::${fingerprint}::`)
        );

        return results ? [results] : [];
      } catch (error) {
        throw error;
      }
    }

    async removeUpload(urlStorageKey) {
      try {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(urlStorageKey);
        await new Promise((resolve, reject) => {
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      } catch (error) {
        throw error;
      }
    }

    async addUpload(fingerprint, upload) {
      try {
        const id = Math.round(Math.random() * 1e12);
        const key = `tus::${fingerprint}::${id}`;
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({urlStorageKey: key, ...upload});
        await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(key);
          request.onerror = reject;
        });
        return key;
      } catch (error) {
        throw error;
      }
    }
  }
