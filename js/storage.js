// Gestion du stockage local avec IndexedDB pour supporter de gros fichiers

class StorageManager {
    constructor() {
        this.dbName = 'ChristmasListDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store pour les profils
                if (!db.objectStoreNames.contains('profiles')) {
                    const profileStore = db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
                    profileStore.createIndex('name', 'name', { unique: false });
                }

                // Store pour les listes
                if (!db.objectStoreNames.contains('lists')) {
                    const listStore = db.createObjectStore('lists', { keyPath: 'id', autoIncrement: true });
                    listStore.createIndex('profileId', 'profileId', { unique: false });
                }

                // Store pour les cadeaux
                if (!db.objectStoreNames.contains('gifts')) {
                    const giftStore = db.createObjectStore('gifts', { keyPath: 'id', autoIncrement: true });
                    giftStore.createIndex('listId', 'listId', { unique: false });
                }
            };
        });
    }

    async addProfile(profile) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readwrite');
            const store = transaction.objectStore('profiles');
            const request = store.add(profile);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getProfiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readonly');
            const store = transaction.objectStore('profiles');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateProfile(id, profile) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readwrite');
            const store = transaction.objectStore('profiles');
            profile.id = id;
            const request = store.put(profile);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProfile(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readwrite');
            const store = transaction.objectStore('profiles');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async addList(list) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lists'], 'readwrite');
            const store = transaction.objectStore('lists');
            const request = store.add(list);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLists() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lists'], 'readonly');
            const store = transaction.objectStore('lists');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getList(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lists'], 'readonly');
            const store = transaction.objectStore('lists');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateList(id, list) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lists'], 'readwrite');
            const store = transaction.objectStore('lists');
            list.id = id;
            const request = store.put(list);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteList(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lists'], 'readwrite');
            const store = transaction.objectStore('lists');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async addGift(gift) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gifts'], 'readwrite');
            const store = transaction.objectStore('gifts');
            const request = store.add(gift);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getGiftsByList(listId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gifts'], 'readonly');
            const store = transaction.objectStore('gifts');
            const index = store.index('listId');
            const request = index.getAll(listId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteGift(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gifts'], 'readwrite');
            const store = transaction.objectStore('gifts');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const storage = new StorageManager();
