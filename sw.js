/* 账号管家 Service Worker：离线缓存核心文件，断网也能打开 */
const CACHE = 'av-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // 网络优先，失败回退缓存（保证数据/同步接口不被错误缓存拦截）
  e.respondWith(
    fetch(e.request).then(function (resp) {
      const cp = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
