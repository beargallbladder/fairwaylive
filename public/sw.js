// FairwayLive Service Worker
// Aggressive caching for battery efficiency

const CACHE_NAME = 'fairwaylive-v1';
const STATIC_CACHE = 'fairwaylive-static-v1';
const DYNAMIC_CACHE = 'fairwaylive-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/app.css',
    '/js/app.js',
    '/js/swarm-client.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name.startsWith('fairwaylive-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip WebSocket requests
    if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

    // Different strategies for different resources
    if (url.origin === location.origin && STATIC_ASSETS.includes(url.pathname)) {
        // Cache first for static assets
        event.respondWith(cacheFirst(request));
    } else if (request.url.includes('/api/')) {
        // Network first for API calls
        event.respondWith(networkFirst(request));
    } else {
        // Network first with cache fallback for everything else
        event.respondWith(networkFirst(request));
    }
});

// Cache first strategy
async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || fetch(request).then(response => {
        if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseClone);
            });
        }
        return response;
    });
}

// Network first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
            });
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Offline fallback for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
        }
        
        throw error;
    }
}

// Background sync for offline score submission
self.addEventListener('sync', event => {
    if (event.tag === 'submit-scores') {
        event.waitUntil(submitPendingScores());
    }
});

async function submitPendingScores() {
    // Get pending scores from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_scores', 'readonly');
    const scores = await tx.objectStore('pending_scores').getAll();
    
    for (const score of scores) {
        try {
            await fetch('/api/rounds/' + score.roundId + '/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(score)
            });
            
            // Remove from pending
            const deleteTx = db.transaction('pending_scores', 'readwrite');
            await deleteTx.objectStore('pending_scores').delete(score.id);
        } catch (error) {
            console.error('Failed to sync score:', error);
        }
    }
}

// Simple IndexedDB wrapper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('fairwaylive', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending_scores')) {
                db.createObjectStore('pending_scores', { keyPath: 'id' });
            }
        };
    });
}