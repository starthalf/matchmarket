// public/service-worker.js
// 🔥 배포할 때마다 이 버전 숫자를 올려주세요 (v1 → v2 → v3 ...)
const CACHE_NAME = 'matchmarket-v2';

const urlsToCache = [
  '/',
  '/index.html',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// 활성화 이벤트 (이전 캐시 삭제)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🔥 SKIP_WAITING 메시지 수신 시 즉시 활성화
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skip waiting requested');
    self.skipWaiting();
  }
});

// Fetch 이벤트 (네트워크 우선 전략)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});