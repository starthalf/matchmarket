// public/service-worker.js
//
// ✅ 이 파일은 배포할 때마다 버전을 올릴 필요가 없습니다.
//
// 왜 필요 없나:
//   Expo web 빌드(output: "single")는 에셋 파일명에 해시를 박습니다.
//     /_expo/static/js/web/entry-a1b2c3d4.js
//   내용이 바뀌면 파일명(=URL)이 바뀝니다. URL이 곧 버전입니다.
//   따라서 "해시 붙은 에셋"은 cache-first로 캐싱해도 절대 stale해질 수 없습니다.
//   반대로 index.html은 파일명이 안 바뀌므로 network-first로 항상 최신을 받습니다.
//
//   → 캐시 이름을 사람이 바꿔줄 이유가 없어집니다.
//
// 캐시를 강제로 통째로 날려야 할 일이 생기면 (거의 없음) 아래 SCHEMA만 올리세요.
// 평상시엔 건드리지 마세요.

const SCHEMA = 1;
const HTML_CACHE = `mm-html-v${SCHEMA}`;
const ASSET_CACHE = `mm-asset-v${SCHEMA}`;
const KNOWN_CACHES = [HTML_CACHE, ASSET_CACHE];

const OFFLINE_URL = '/';
const MAX_ASSET_ENTRIES = 120; // 캐시 무한 증식 방지

/** 내용 해시가 파일명에 박혀 있어 cache-first가 안전한 요청인가 */
function isImmutableAsset(url) {
  if (url.origin !== self.location.origin) return false;

  // Expo/Metro 번들 & 정적 에셋
  if (url.pathname.startsWith('/_expo/')) return true;
  if (url.pathname.startsWith('/assets/')) return true;

  // 파일명에 8자 이상 해시가 붙은 경우 (entry-a1b2c3d4.js 등)
  if (/-[0-9a-f]{8,}\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf)$/i.test(url.pathname)) {
    return true;
  }

  return false;
}

/** SPA 진입점(HTML)을 요청하는 네비게이션인가 */
function isNavigation(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html'))
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // 오래된 것부터 제거 (keys()는 삽입 순서를 유지)
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

// ─────────────────────────────────────────────
// install
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // 오프라인 fallback용 셸만 확보. 해시 에셋은 런타임에 알아서 쌓인다.
      const cache = await caches.open(HTML_CACHE);
      try {
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      } catch (e) {
        // 오프라인 셸 확보 실패해도 SW 설치는 계속 진행
        console.warn('[SW] offline shell cache failed', e);
      }
      // 여기서 skipWaiting()을 부르지 않습니다.
      // 사용자가 UpdateBanner에서 "업데이트"를 눌러야 교체됩니다. (세션 중 강제 리로드 방지)
    })()
  );
});

// ─────────────────────────────────────────────
// activate — 스키마가 다른 옛 캐시만 정리
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('mm-') || n.startsWith('matchmarket-')) // 예전 matchmarket-vN 캐시도 청소
          .filter((n) => !KNOWN_CACHES.includes(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// ─────────────────────────────────────────────
// message — UpdateBanner에서 보내는 즉시 활성화 신호
// ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─────────────────────────────────────────────
// fetch
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase 등 외부 API는 SW가 절대 건드리지 않는다 (인증/실시간 깨짐 방지)
  if (url.origin !== self.location.origin) return;

  // 1) 네비게이션(HTML) → network-first
  //    index.html은 파일명이 안 바뀌므로 항상 네트워크 우선. 실패 시에만 캐시.
  if (isNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(HTML_CACHE);
          cache.put(OFFLINE_URL, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(OFFLINE_URL);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // 2) 해시 붙은 정적 에셋 → cache-first
  //    URL이 곧 버전이라 stale이 구조적으로 불가능하다.
  if (isImmutableAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(ASSET_CACHE);
          cache.put(request, fresh.clone());
          trimCache(ASSET_CACHE, MAX_ASSET_ENTRIES);
        }
        return fresh;
      })()
    );
    return;
  }

  // 3) 그 외 동일 출처 요청 → network-first (manifest.json 등)
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch (e) {
        const cached = await caches.match(request);
        return cached || Response.error();
      }
    })()
  );
});
