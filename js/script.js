// JMGOLDBUYERS - Main JavaScript File

// Navigation functionality
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.querySelector(".navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navItems = document.querySelectorAll(".nav-item a");

  // Navbar scroll effect
  window.addEventListener("scroll", function () {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  }

  // Close mobile menu when clicking on nav items
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      navMenu.classList.remove("active");
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Fade in animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  // Observe elements with fade-in class
  document.querySelectorAll(".fade-in").forEach((el) => {
    observer.observe(el);
  });

  // Gold Calculator functionality
  if (document.getElementById("goldCalculator")) {
    initGoldCalculator();
  }

  // Contact form functionality
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactForm);
  }
});

// Gold Calculator Functions
function initGoldCalculator() {
  const weightInput = document.getElementById("goldWeight");
  const puritySelect = document.getElementById("goldPurity");
  const currentPriceElement = document.getElementById("currentPrice");
  const calculateBtn = document.getElementById("calculateBtn");
  const resultElement = document.getElementById("calculationResult");

  // Fetch current gold price on page load
  fetchGoldPrice();

  // Auto-calculate when inputs change
  if (weightInput) {
    weightInput.addEventListener("input", calculateGoldValue);
  }
  if (puritySelect) {
    puritySelect.addEventListener("change", calculateGoldValue);
  }
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateGoldValue);
  }

  // Add refresh button functionality if it exists
  const refreshBtn = document.getElementById("refreshPriceBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      fetchGoldPrice();
      // Show loading state
      const updateElement = document.getElementById("lastUpdate");
      if (updateElement) {
        updateElement.textContent = "Refreshing prices...";
      }
    });
  }

  // Refresh price every 60 seconds (reduced from 30 for better performance)
  setInterval(fetchGoldPrice, 60000);
}

async function fetchGoldPrice() {
  try {
    let goldPricePerGram = null;
    let priceSource = "Live API";

    // Method 1: Try getting international gold price and convert to INR
    try {
      // First get USD to INR rate
      const usdToInrResponse = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const usdToInrData = await usdToInrResponse.json();
      const usdToInr = usdToInrData.rates.INR || 83.5; // Current approximate rate

      // Then get gold price in USD
      const goldResponse = await fetch("https://api.metals.live/v1/spot/gold");
      const goldData = await goldResponse.json();

      if (goldData && goldData[0] && goldData[0].price) {
        const goldPricePerOunce = goldData[0].price;
        goldPricePerGram = (goldPricePerOunce / 31.1035) * usdToInr;

        // Apply Indian market premium (typically 3-5% higher than international spot)
        goldPricePerGram = goldPricePerGram * 1.04;
        priceSource = "International + INR Conversion";
      }
    } catch (apiError) {
      console.log("International API failed:", apiError);
    }

    // Method 2: If API fails, use realistic current Indian market rates
    if (!goldPricePerGram) {
      // Current approximate rates based on Indian gold market (August 2024)
      goldPricePerGram = 6850; // 24K gold rate in India
      priceSource = "Indian Market Rate";
    }

    // Ensure minimum realistic price (safety check)
    if (goldPricePerGram < 6000) {
      goldPricePerGram = 6800;
      priceSource = "Adjusted Market Rate";
    }

    // Update all price displays
    const currentPriceElement = document.getElementById("currentPrice");
    const price10gElement = document.getElementById("price10g");
    const priceTolaElement = document.getElementById("priceTola");

    if (currentPriceElement) {
      currentPriceElement.textContent = `₹${Math.round(
        goldPricePerGram
      ).toLocaleString("en-IN")}`;
      currentPriceElement.dataset.price = goldPricePerGram;
    }

    if (price10gElement) {
      price10gElement.textContent = `₹${Math.round(
        goldPricePerGram * 10
      ).toLocaleString("en-IN")}`;
    }

    if (priceTolaElement) {
      priceTolaElement.textContent = `₹${Math.round(
        goldPricePerGram * 11.66
      ).toLocaleString("en-IN")}`;
    }

    // Update last refresh time with source info
    const lastUpdate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const updateElement = document.getElementById("lastUpdate");
    if (updateElement) {
      updateElement.textContent = `${priceSource} - Updated: ${lastUpdate} IST`;
    }
  } catch (error) {
    console.error("Error fetching gold price:", error);
    // Fallback prices - more realistic current Indian market rates
    const fallbackPrice = 6800; // Current approximate rate for 24K gold in India
    const currentPriceElement = document.getElementById("currentPrice");
    const price10gElement = document.getElementById("price10g");
    const priceTolaElement = document.getElementById("priceTola");

    if (currentPriceElement) {
      currentPriceElement.textContent = `₹${fallbackPrice.toLocaleString(
        "en-IN"
      )}`;
      currentPriceElement.dataset.price = fallbackPrice;
    }

    if (price10gElement) {
      price10gElement.textContent = `₹${(fallbackPrice * 10).toLocaleString(
        "en-IN"
      )}`;
    }

    if (priceTolaElement) {
      priceTolaElement.textContent = `₹${Math.round(
        fallbackPrice * 11.66
      ).toLocaleString("en-IN")}`;
    }

    // Update with fallback timestamp
    const lastUpdate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const updateElement = document.getElementById("lastUpdate");
    if (updateElement) {
      updateElement.textContent = `Fallback price - ${lastUpdate} IST`;
    }
  }
}

function calculateGoldValue() {
  const weightInput = document.getElementById("goldWeight");
  const puritySelect = document.getElementById("goldPurity");
  const customPurityInput = document.getElementById("customPurity");
  const currentPriceElement = document.getElementById("currentPrice");
  const resultElement = document.getElementById("calculationResult");

  if (!weightInput || !puritySelect || !currentPriceElement || !resultElement) {
    return;
  }

  const weight = parseFloat(weightInput.value);
  let purity = parseFloat(puritySelect.value);

  // Handle custom purity
  if (
    puritySelect.value === "custom" &&
    customPurityInput &&
    customPurityInput.value
  ) {
    purity = parseFloat(customPurityInput.value);
  }

  const currentPrice = parseFloat(currentPriceElement.dataset.price) || 6200;

  if (weight && weight > 0 && purity && purity > 0) {
    const pureGoldWeight = (weight * purity) / 100;
    const estimatedValue = pureGoldWeight * currentPrice;

    resultElement.innerHTML = `
            <div class="result-breakdown">
                <h3>Estimated Value</h3>
                <div class="result-main">₹${estimatedValue.toLocaleString(
                  "en-IN",
                  { maximumFractionDigits: 0 }
                )}</div>
                <div class="result-details">
                    <p><strong>Weight:</strong> ${weight}g</p>
                    <p><strong>Purity:</strong> ${purity}% (${(
      (purity / 100) *
      24
    ).toFixed(1)}K)</p>
                    <p><strong>Pure Gold:</strong> ${pureGoldWeight.toFixed(
                      2
                    )}g</p>
                    <p><strong>Rate:</strong> ₹${currentPrice.toFixed(0)}/g</p>
                </div>
                <div class="disclaimer">
                    <small>*This is an estimated value. Actual price may vary based on market conditions and verification.</small>
                </div>
            </div>
        `;
    resultElement.classList.remove("result-hidden");
    resultElement.style.display = "block";
  } else {
    resultElement.classList.add("result-hidden");
    resultElement.style.display = "none";
  }
}

// Contact form handling
function handleContactForm(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");

  // Create WhatsApp message
  const whatsappMessage = `Hello JMGOLDBUYERS,

Name: ${name}
Email: ${email}
Phone: ${phone}

Message: ${message}

I'm interested in your gold buying services.`;

  const whatsappURL = `https://wa.me/917099657978?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // Open WhatsApp
  window.open(whatsappURL, "_blank");

  // Show success message
  showNotification(
    "Message sent! You will be redirected to WhatsApp.",
    "success"
  );

  // Reset form
  e.target.reset();
}

// Utility functions
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "success"
            ? "#4CAF50"
            : type === "error"
            ? "#f44336"
            : "#2196F3"
        };
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);

  // Manual close
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.remove();
    });
}

// Format phone number for display
function formatPhoneNumber(phone) {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

// Animate numbers counting up
function animateNumber(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    element.textContent = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Initialize number animations when elements come into view
function initNumberAnimations() {
  const numbers = document.querySelectorAll(".animate-number");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const endValue = parseInt(element.dataset.number);
        animateNumber(element, 0, endValue, 2000);
        observer.unobserve(element);
      }
    });
  });

  numbers.forEach((number) => observer.observe(number));
}

// Call number animation init
document.addEventListener("DOMContentLoaded", initNumberAnimations);

// Loading animation
function showLoading() {
  const loader = document.createElement("div");
  loader.className = "loading-overlay";
  loader.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.querySelector(".loading-overlay");
  if (loader) {
    loader.remove();
  }
}

// Add CSS for loading spinner and notifications
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 1rem;
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .loading-spinner {
        text-align: center;
        color: white;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #FFD700;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .result-breakdown {
        text-align: center;
    }
    
    .result-main {
        font-size: 2rem;
        font-weight: bold;
        color: #1a1a1a;
        margin: 1rem 0;
    }
    
    .result-details {
        background: rgba(255,255,255,0.8);
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    
    .result-details p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }
    
    .disclaimer {
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(255,255,255,0.5);
        border-radius: 5px;
    }
    
    .disclaimer small {
        font-size: 0.8rem;
        color: #666;
    }
`;
document.head.appendChild(style);

// Expandable Contact Button Functionality
document.addEventListener("DOMContentLoaded", function () {
  const contactToggle = document.getElementById("contactToggle");
  const contactOptions = document.getElementById("contactOptions");

  if (contactToggle && contactOptions) {
    contactToggle.addEventListener("click", function () {
      const isActive = contactToggle.classList.contains("active");

      if (isActive) {
        // Close the options
        contactToggle.classList.remove("active");
        contactOptions.classList.remove("show");
      } else {
        // Open the options
        contactToggle.classList.add("active");
        contactOptions.classList.add("show");
      }
    });

    // Close contact options when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !contactToggle.contains(e.target) &&
        !contactOptions.contains(e.target)
      ) {
        contactToggle.classList.remove("active");
        contactOptions.classList.remove("show");
      }
    });

    // Close contact options when pressing Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        contactToggle.classList.remove("active");
        contactOptions.classList.remove("show");
      }
    });
  }

  // Interactive Heart Animation
  const interactiveHeart = document.querySelector(".interactive-heart");
  if (interactiveHeart) {
    interactiveHeart.addEventListener("click", function () {
      // Create floating hearts effect
      for (let i = 0; i < 5; i++) {
        createFloatingHeart(this);
      }

      // Play heart animation
      this.style.animation = "heartbeat-fast 0.5s infinite";
      setTimeout(() => {
        this.style.animation = "pulse-heart 2s infinite";
      }, 1000);
    });
  }

  function createFloatingHeart(element) {
    const heart = document.createElement("span");
    heart.innerHTML = "💖";
    heart.style.position = "fixed";
    heart.style.left = element.getBoundingClientRect().left + "px";
    heart.style.top = element.getBoundingClientRect().top + "px";
    heart.style.fontSize = "1.5rem";
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "9999";
    heart.style.animation = "floatUp 2s ease-out forwards";

    document.body.appendChild(heart);

    // Random horizontal movement
    const randomX = (Math.random() - 0.5) * 100;
    heart.style.transform = `translateX(${randomX}px)`;

    setTimeout(() => {
      heart.remove();
    }, 2000);
  }
});
