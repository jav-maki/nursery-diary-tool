// service-worker.js
const CACHE_NAME = 'hoikuen-journal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// ネットワークリクエストをインターセプト
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにヒットした場合はキャッシュから返す
        if (response) {
          return response;
        }
        
        // キャッシュにヒットしなかった場合はネットワークにフェッチ
        return fetch(event.request)
          .then(function(response) {
            // 無効なレスポンスは無視
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスのクローンを作成（レスポンスは一度しか使用できないため）
            var responseToCache = response.clone();
            
            // レスポンスをキャッシュに追加
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(function() {
        // オフライン時のフォールバック
        if (event.request.url.indexOf('/api/') !== -1) {
          // API呼び出しの場合はエラーをスロー
          return new Response(JSON.stringify({
            error: 'オフラインモード: APIにアクセスできません'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});