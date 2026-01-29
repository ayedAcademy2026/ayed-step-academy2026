// sw.js — PWA cache for Ayed Academy STEP 2026
const CACHE = "ayed-step-2026-202601290327";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./step-guide.html",
  "./course-content.html",
  "./level-test.html",
  "./results.html",
  "./register.html",
  "./faq.html",
  "./testimonials.html",
  "./support.html",
  "./terms.html",
  "./privacy.html",
  "./refund.html",
  "./assets/styles.css?v=202601290327",
  "./assets/site-data.js?v=202601290327",
  "./assets/notifications.js?v=202601290327",
  "./assets/plans.js?v=202601290327",
  "./assets/app.js?v=202601290327",
  "./assets/test.js?v=202601290327",
  "./assets/results.js?v=202601290327",
  "./assets/register.js?v=202601290327",
  "./assets/support.js?v=202601290327",
  "./assets/questions.json?v=202601290327",
  "./manifest.json",
  "./assets/icons/icon-64.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
        return resp;
      }).catch(()=> {
        // Offline fallback
        return caches.match("./index.html");
      });
    })
  );
});
