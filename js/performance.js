// Performance Monitoring and Optimization Script
// This script monitors page performance and provides insights

(function () {
  "use strict";

  // Performance monitoring configuration
  const config = {
    enableMetrics: true,
    enableResourceTiming: true,
    enableUserTiming: true,
    reportThreshold: 3000, // Report if page load > 3 seconds
    reportEndpoint: "/api/performance", // Optional: send data to server
  };

  // Performance metrics collection
  const performanceMetrics = {
    navigationStart: 0,
    loadComplete: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    timeToInteractive: 0,
    cumulativeLayoutShift: 0,
  };

  // Initialize performance monitoring
  function initPerformanceMonitoring() {
    if (!config.enableMetrics) return;

    // Navigation timing
    window.addEventListener("load", function () {
      setTimeout(collectNavigationMetrics, 0);
    });

    // Paint timing
    if ("performance" in window && "getEntriesByType" in performance) {
      collectPaintMetrics();
    }

    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      observeLargestContentfulPaint();
      observeCumulativeLayoutShift();
    }

    // First Input Delay
    if ("PerformanceEventTiming" in window) {
      observeFirstInputDelay();
    }

    // Resource timing
    if (config.enableResourceTiming) {
      setTimeout(collectResourceMetrics, 1000);
    }
  }

  // Collect navigation timing metrics
  function collectNavigationMetrics() {
    if (!performance.timing) return;

    const timing = performance.timing;
    performanceMetrics.navigationStart = timing.navigationStart;
    performanceMetrics.loadComplete =
      timing.loadEventEnd - timing.navigationStart;
    performanceMetrics.domContentLoaded =
      timing.domContentLoadedEventEnd - timing.navigationStart;

    console.log("Navigation Metrics:", {
      "Page Load Time": performanceMetrics.loadComplete + "ms",
      "DOM Content Loaded": performanceMetrics.domContentLoaded + "ms",
    });

    // Report slow page loads
    if (performanceMetrics.loadComplete > config.reportThreshold) {
      console.warn(
        "Slow page load detected:",
        performanceMetrics.loadComplete + "ms"
      );
      optimizePage();
    }
  }

  // Collect paint timing metrics
  function collectPaintMetrics() {
    const paintEntries = performance.getEntriesByType("paint");
    paintEntries.forEach((entry) => {
      if (entry.name === "first-paint") {
        performanceMetrics.firstPaint = entry.startTime;
      } else if (entry.name === "first-contentful-paint") {
        performanceMetrics.firstContentfulPaint = entry.startTime;
      }
    });

    console.log("Paint Metrics:", {
      "First Paint": performanceMetrics.firstPaint + "ms",
      "First Contentful Paint": performanceMetrics.firstContentfulPaint + "ms",
    });
  }

  // Observe Largest Contentful Paint
  function observeLargestContentfulPaint() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceMetrics.largestContentfulPaint = lastEntry.startTime;

      console.log(
        "Largest Contentful Paint:",
        performanceMetrics.largestContentfulPaint + "ms"
      );
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  }

  // Observe Cumulative Layout Shift
  function observeCumulativeLayoutShift() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      performanceMetrics.cumulativeLayoutShift = clsValue;

      if (clsValue > 0.1) {
        console.warn("High Cumulative Layout Shift detected:", clsValue);
      }
    });

    observer.observe({ entryTypes: ["layout-shift"] });
  }

  // Observe First Input Delay
  function observeFirstInputDelay() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        console.log("First Input Delay:", fid + "ms");

        if (fid > 100) {
          console.warn("High First Input Delay detected:", fid + "ms");
        }
      }
    });

    observer.observe({ entryTypes: ["first-input"] });
  }

  // Collect resource timing metrics
  function collectResourceMetrics() {
    const resources = performance.getEntriesByType("resource");
    const slowResources = [];

    resources.forEach((resource) => {
      const loadTime = resource.responseEnd - resource.startTime;

      if (loadTime > 1000) {
        // Resources taking > 1 second
        slowResources.push({
          name: resource.name,
          loadTime: Math.round(loadTime),
          size: resource.transferSize,
        });
      }
    });

    if (slowResources.length > 0) {
      console.warn("Slow loading resources detected:", slowResources);
    }
  }

  // Automatic page optimization suggestions
  function optimizePage() {
    const optimizations = [];

    // Check for large images
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.loading || img.loading !== "lazy") {
        img.loading = "lazy";
        optimizations.push("Added lazy loading to images");
      }
    });

    // Check for missing preload hints
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    if (
      cssLinks.length > 0 &&
      !document.querySelector('link[rel="preload"][as="style"]')
    ) {
      optimizations.push("Consider adding preload hints for critical CSS");
    }

    // Check for render-blocking resources
    const scripts = document.querySelectorAll(
      "script[src]:not([async]):not([defer])"
    );
    if (scripts.length > 0) {
      optimizations.push("Consider adding defer/async to non-critical scripts");
    }

    if (optimizations.length > 0) {
      console.log("Performance optimization suggestions:", optimizations);
    }
  }

  // Image lazy loading enhancement
  function enhanceImageLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove("lazy");
                imageObserver.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.01,
        }
      );

      document.querySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // Resource hints for critical pages
  function addResourceHints() {
    const criticalPages = [
      "index.html",
      "about.html",
      "contact.html",
      "calculator.html",
    ];
    const currentPage = window.location.pathname.split("/").pop();

    criticalPages.forEach((page) => {
      if (page !== currentPage) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = page;
        document.head.appendChild(link);
      }
    });
  }

  // Connection optimization
  function optimizeConnections() {
    const criticalDomains = [
      "cdn.jsdelivr.net",
      "cdnjs.cloudflare.com",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
    ];

    criticalDomains.forEach((domain) => {
      if (
        !document.querySelector(`link[rel="preconnect"][href*="${domain}"]`)
      ) {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = `https://${domain}`;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    });
  }

  // Memory usage monitoring
  function monitorMemoryUsage() {
    if ("memory" in performance) {
      const memory = performance.memory;
      const memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };

      console.log("Memory Usage:", memoryUsage);

      if (memoryUsage.used > memoryUsage.limit * 0.8) {
        console.warn(
          "High memory usage detected. Consider optimizing JavaScript."
        );
      }
    }
  }

  // Send performance data to server (optional)
  function reportPerformanceData() {
    if (!config.reportEndpoint) return;

    const data = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      metrics: performanceMetrics,
      connection: navigator.connection
        ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
          }
        : null,
    };

    // Send data (implement based on your backend)
    fetch(config.reportEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch((err) => {
      console.log("Performance data reporting failed:", err);
    });
  }

  // Initialize everything when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    initPerformanceMonitoring();
    enhanceImageLoading();
    addResourceHints();
    optimizeConnections();

    // Monitor memory usage periodically
    setInterval(monitorMemoryUsage, 30000); // Every 30 seconds
  });

  // Report performance data when page is about to unload
  window.addEventListener("beforeunload", function () {
    reportPerformanceData();
  });

  // Public API for manual performance checks
  window.JMPerformance = {
    getMetrics: () => performanceMetrics,
    optimize: optimizePage,
    report: reportPerformanceData,
  };
})();
