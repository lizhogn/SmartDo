export const DB_NAME = 'smartdo-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'todos';

export class DatabaseService {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async getAllTodos(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveTodo(todo: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(todo);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTodo(id: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new DatabaseService();
