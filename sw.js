// Service Worker for Performance Optimization
const CACHE_NAME = "jmgoldbuyers-v1.2";
const STATIC_CACHE = "static-cache-v1.2";
const DYNAMIC_CACHE = "dynamic-cache-v1.2";

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/index.html",
  "/about.html",
  "/contact.html",
  "/calculator.html",
  "/css/style.css",
  "/js/script.js",
  "/robots.txt",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching static files");
        return cache.addAll(
          STATIC_FILES.map((url) => {
            return new Request(url, { cache: "reload" });
          })
        );
      })
      .catch((error) => {
        console.log("Cache failed:", error);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith("http")) return;

  // Handle HTML requests (Network First with Cache Fallback)
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // Handle static assets (Cache First with Network Fallback)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Return placeholder for failed image requests
          if (request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#ccc">Image</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
        })
    );
    return;
  }

  // Default: Network First
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Background Sync for form submissions
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered");
  if (event.tag === "contact-form") {
    event.waitUntil(syncContactForm());
  }
});

// Handle form submission sync
async function syncContactForm() {
  try {
    const forms = await getStoredForms();
    for (const formData of forms) {
      try {
        await fetch("/contact-submit", {
          method: "POST",
          body: formData,
        });
        // Remove successfully sent form
        await removeStoredForm(formData);
      } catch (error) {
        console.log("Form sync failed, will retry later");
      }
    }
  } catch (error) {
    console.log("Sync error:", error);
  }
}

// Helper functions for form storage
async function getStoredForms() {
  // Implementation would depend on IndexedDB storage
  return [];
}

async function removeStoredForm(formData) {
  // Implementation would depend on IndexedDB storage
  return true;
}

// Handle push notifications (future enhancement)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "jmgoldbuyers-notification",
      actions: [
        {
          action: "view",
          title: "View Details",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});
