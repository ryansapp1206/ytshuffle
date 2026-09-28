const DB_NAME = 'yt_shuffle_db';
const DB_VERSION = 1;
const STORE_NAME = 'playlist_cache';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'playlistId' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getCachedVideos(playlistId) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(playlistId);

            request.onsuccess = () => {
                const entry = request.result;
                db.close();

                if (!entry) return resolve(null);

                if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
                    resolve(entry.videos);
                } else {
                    deleteCachedVideos(playlistId); 
                    resolve(null);
                }
            };

            request.onerror = () => {
                db.close();
                resolve(null);
            };
        });
    } catch {
        return null;
    }
}

export async function setCachedVideos(playlistId, videos) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const record = {
                playlistId,
                videos,
                timestamp: Date.now()
            };

            const request = store.put(record);
            
            request.onsuccess = () => {
                db.close();
                resolve(true);
            };
            
            request.onerror = () => {
                db.close();
                resolve(false);
            };
        });
    } catch (error) {
        console.error("IndexedDB Cache Write Error:", error);
        return false;
    }
}

export async function deleteCachedVideos(playlistId) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(playlistId);
            
            request.onsuccess = () => {
                db.close();
                resolve(true);
            };
            
            request.onerror = () => {
                db.close(); 
                resolve(false);
            };
        });
    } catch {
        return false;
    }
}