// Function to fetch and inject external HTML component files
async function loadComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(
        `Failed to load ${componentPath}: ${response.statusText}`,
      );
    }
    const html = await response.text();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const isRoot = !window.location.pathname
      .replace(/\\/g, "/")
      .includes("/pages/");
    const pathSegments = window.location.pathname
      .replace(/\\/g, "/")
      .split("/");
    const currentPage = pathSegments[pathSegments.length - 1] || "index.html";

    // Normalize relative paths when loaded on root index.html
    if (isRoot) {
      // Fix anchor links
      tempDiv.querySelectorAll("a").forEach((link) => {
        const href = link.getAttribute("href");
        if (
          !href ||
          href.startsWith("http") ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:")
        ) {
          return;
        }

        if (href === "../index.html" || href === "./index.html") {
          link.setAttribute("href", "index.html");
        } else if (href.startsWith("../assets/")) {
          link.setAttribute("href", href.replace("../assets/", "assets/"));
        } else if (
          !href.startsWith("pages/") &&
          !href.startsWith("../") &&
          !href.startsWith("/")
        ) {
          link.setAttribute("href", "pages/" + href);
        }
      });

      // Fix image sources
      tempDiv.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("../assets/")) {
          img.setAttribute("src", src.replace("../assets/", "assets/"));
        }
      });
    }

    // Set active state on current navigation link
    tempDiv.querySelectorAll("[data-page]").forEach((link) => {
      const page = link.getAttribute("data-page");
      if (
        page === currentPage ||
        (page === "index.html" &&
          (currentPage === "" || currentPage === "index.html") &&
          isRoot)
      ) {
        link.classList.add("active");
      }
    });

    placeholder.replaceWith(...tempDiv.childNodes);
  } catch (error) {
    console.error(
      `Error loading component [${placeholderId}] from ${componentPath}:`,
      error,
    );
  }
}

// Sticky Header Behavior
function initStickyHeader() {
  const mainHeader = document.querySelector(".main-header");
  if (!mainHeader) return;

  const headerStickyHandler = () => {
    if (window.scrollY > 80) {
      mainHeader.classList.add("fixed-header");
    } else {
      mainHeader.classList.remove("fixed-header");
    }
  };

  window.addEventListener("scroll", headerStickyHandler);
  headerStickyHandler();
}

// Mobile Fullscreen Offcanvas Menu Behavior
function initMobileMenu() {
  const mobileToggleBtn = document.querySelector(".mobile-nav-toggle");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-links a");

  if (mobileToggleBtn && mobileMenuOverlay) {
    mobileToggleBtn.addEventListener("click", () => {
      mobileMenuOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  if (mobileMenuClose && mobileMenuOverlay) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenuOverlay.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });
}

// Scroll To Top Floating Button Handler
function initScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("active");
    } else {
      scrollTopBtn.classList.remove("active");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// Counter Up Animation (Intersection Observer)
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length === 0) return;

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = +counter.getAttribute("data-count");
          const suffix = counter.getAttribute("data-suffix") || "";
          const prefix = counter.getAttribute("data-prefix") || "";
          let count = 0;

          const updateCount = () => {
            const increment = Math.ceil(target / 60) || 1;
            count += increment;
            if (count >= target) {
              counter.innerText = prefix + target.toLocaleString() + suffix;
            } else {
              counter.innerText = prefix + count.toLocaleString() + suffix;
              setTimeout(updateCount, 30);
            }
          };

          updateCount();
          observer.unobserve(counter);
        }
      });
    },
    { threshold: 0.3 },
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

// Portfolio Filter Functionality
function initPortfolioFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-filter-item");

  if (filterButtons.length === 0 || portfolioItems.length === 0) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filterValue = this.getAttribute("data-filter");

      portfolioItems.forEach((item) => {
        if (filterValue === "all" || item.classList.contains(filterValue)) {
          item.style.display = "block";
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          }, 50);
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.95)";
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    });
  });
}

// Form Submission Handlers & Input Restrictions
function initForms() {
  const isRoot = !window.location.pathname
    .replace(/\\/g, "/")
    .includes("/pages/");
  const notFoundPage = isRoot ? "404.html" : "../404.html";

  // 1. Contact Form (Confidential Inquiry Form on Contact Page)
  const contactForm =
    document.getElementById("contactForm") ||
    document.querySelector(".ajax-contact-form");
  if (contactForm && !contactForm.dataset.listenerAttached) {
    contactForm.dataset.listenerAttached = "true";

    const nameInput =
      document.getElementById("contactUsername") ||
      contactForm.querySelector("#contactUsername") ||
      contactForm.querySelector('input[name="name"]') ||
      contactForm.querySelector('input[type="text"]');

    const phoneInput =
      document.getElementById("contactPhone") ||
      contactForm.querySelector("#contactPhone") ||
      contactForm.querySelector('input[name="phone"]') ||
      contactForm.querySelector('input[type="tel"]');

    // Username / Full Name field: Prevent typing numbers or special characters (only allow letters & spaces)
    if (nameInput) {
      const allowedNavKeys = [
        "Backspace",
        "Tab",
        "Enter",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Escape",
        "Shift",
        "CapsLock",
      ];

      nameInput.addEventListener("keydown", (e) => {
        if (
          allowedNavKeys.includes(e.key) ||
          e.ctrlKey ||
          e.metaKey ||
          e.altKey
        ) {
          return;
        }
        // Block numbers and special characters immediately
        if (!/^[a-zA-Z\s]$/.test(e.key)) {
          e.preventDefault();
        }
      });

      nameInput.addEventListener("beforeinput", (e) => {
        if (e.data && /[^a-zA-Z\s]/.test(e.data)) {
          e.preventDefault();
        }
      });

      nameInput.addEventListener("input", function () {
        const sanitized = this.value.replace(/[^a-zA-Z\s]/g, "");
        if (this.value !== sanitized) {
          this.value = sanitized;
        }
      });
    }

    // Direct Phone Number / Number field: Prevent typing alphabets or special characters (only allow digits 0-9)
    if (phoneInput) {
      const allowedNavKeys = [
        "Backspace",
        "Tab",
        "Enter",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Escape",
        "Shift",
      ];

      phoneInput.addEventListener("keydown", (e) => {
        if (
          allowedNavKeys.includes(e.key) ||
          e.ctrlKey ||
          e.metaKey ||
          e.altKey
        ) {
          return;
        }
        // Block alphabets, special characters, and spaces immediately
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      });

      phoneInput.addEventListener("beforeinput", (e) => {
        if (e.data && /[^0-9]/.test(e.data)) {
          e.preventDefault();
        }
      });

      phoneInput.addEventListener("input", function () {
        const sanitized = this.value.replace(/[^0-9]/g, "");
        if (this.value !== sanitized) {
          this.value = sanitized;
        }
      });
    }

    // Contact Form Submission -> Redirect to 404 Page
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...';
      }
      setTimeout(() => {
        window.location.href = notFoundPage;
      }, 400);
    });
  }

  // 2. Footer Subscribe Form & Blog Executive Newsletter Form
  const newsletterForms = document.querySelectorAll(
    "#footerNewsletterForm, #executiveNewsletterForm, .newsletter-form, .newsletter-form-container, .footer-newsletter form",
  );

  newsletterForms.forEach((form) => {
    if (form.dataset.listenerAttached) return;
    form.dataset.listenerAttached = "true";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i> Subscribing...';
      }
      setTimeout(() => {
        window.location.href = notFoundPage;
      }, 400);
    });
  });
}

// Video Trigger Modal (Home Page)
function initVideoModal() {
  const videoBtns = document.querySelectorAll(".video-play-btn");
  videoBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const videoUrl =
        btn.getAttribute("data-video-url") ||
        "https://www.youtube.com/embed/dQw4w9WgXcQ";
      const modal = document.createElement("div");
      modal.className = "video-modal-backdrop";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0,0,0,0.85)";
      modal.style.zIndex = "10000";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.padding = "20px";

      modal.innerHTML = `
        <div style="position: relative; width: 100%; max-width: 800px; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
          <button id="closeVideoModal" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;">&times;</button>
          <iframe src="${videoUrl}?autoplay=1" style="width: 100%; height: 100%; border: none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
      `;

      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal
        .querySelector("#closeVideoModal")
        .addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    });
  });
}

// Global Handler: Redirect empty links or '#' to 404 page across the whole project
function initEmptyLinksRedirection() {
  const isRoot = !window.location.pathname
    .replace(/\\/g, "/")
    .includes("/pages/");
  const notFoundPage = isRoot ? "404.html" : "../404.html";
  const is404Page = window.location.pathname
    .replace(/\\/g, "/")
    .endsWith("404.html");

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    // Check raw href attribute
    const rawHref = link.getAttribute("href");

    // Do not intercept active modal closers or functional tab buttons if any
    if (
      link.hasAttribute("data-bs-toggle") ||
      link.hasAttribute("data-bs-target")
    ) {
      return;
    }

    // Intercept empty href, '#', '#!', 'javascript:void(0)', or 'javascript:;'
    if (
      rawHref === null ||
      rawHref.trim() === "" ||
      rawHref.trim() === "#" ||
      rawHref.trim() === "#!" ||
      rawHref.trim() === "javascript:void(0)" ||
      rawHref.trim() === "javascript:;"
    ) {
      e.preventDefault();
      if (!is404Page) {
        window.location.href = notFoundPage;
      }
    }
  });
}

// 404 Page Specific Features (Go Back handler & Interactive Search Directory)
function init404Page() {
  // Go Back Button
  const goBackBtn = document.getElementById("goBackBtn");
  if (goBackBtn) {
    goBackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        window.history.length > 1 &&
        document.referrer &&
        !document.referrer.endsWith("404.html")
      ) {
        window.history.back();
      } else {
        const isRoot = !window.location.pathname
          .replace(/\\/g, "/")
          .includes("/pages/");
        window.location.href = isRoot ? "index.html" : "../index.html";
      }
    });
  }

  // Interactive Search / Quick Directory
  const searchInput = document.getElementById("errorSearchInput");
  const searchBtn = document.getElementById("errorSearchBtn");
  const searchResults = document.getElementById("errorSearchResults");

  if (searchInput && searchBtn && searchResults) {
    const isRoot = !window.location.pathname
      .replace(/\\/g, "/")
      .includes("/pages/");
    const prefix = isRoot ? "pages/" : "";
    const rootPrefix = isRoot ? "" : "../";

    const directory = [
      {
        name: "Homepage - Strategic Overview",
        url: rootPrefix + "index.html",
        tags: ["home", "main", "start", "corporate", "stackly"],
      },
      {
        name: "About Us - Heritage & Mission",
        url: prefix + "about.html",
        tags: ["about", "heritage", "story", "mission", "values", "culture"],
      },
      {
        name: "Services - Corporate Practices & Advisory",
        url: prefix + "services.html",
        tags: [
          "services",
          "advisory",
          "consulting",
          "m&a",
          "strategy",
          "digital",
          "esg",
          "cybersecurity",
        ],
      },
      {
        name: "Portfolio - Case Studies & Transaction Outcomes",
        url: prefix + "portfolio.html",
        tags: [
          "portfolio",
          "projects",
          "cases",
          "case studies",
          "outcomes",
          "work",
        ],
      },
      {
        name: "Leadership - Managing Partners & Directors",
        url: prefix + "team.html",
        tags: [
          "leadership",
          "team",
          "executives",
          "partners",
          "directors",
          "people",
        ],
      },
      {
        name: "Executive Insights & Analysis Briefings",
        url: prefix + "blog.html",
        tags: [
          "insights",
          "blog",
          "articles",
          "news",
          "reports",
          "macroeconomic",
          "analysis",
        ],
      },
      {
        name: "Contact Us - Global Advisory Inquiry",
        url: prefix + "contact.html",
        tags: [
          "contact",
          "inquiry",
          "email",
          "office",
          "locations",
          "call",
          "consultation",
          "reach",
        ],
      },
      {
        name: "Enterprise Corporate Dashboard",
        url: prefix + "dashboard.html",
        tags: [
          "dashboard",
          "portal",
          "analytics",
          "client",
          "consultant",
          "executive",
          "stakeholder",
          "kpis",
        ],
      },
      {
        name: "Client Portal Login",
        url: prefix + "login.html",
        tags: ["login", "portal", "signin", "auth", "client"],
      },
      {
        name: "Client Portal Registration",
        url: prefix + "register.html",
        tags: ["register", "signup", "onboarding", "join"],
      },
    ];

    const performSearch = () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        searchResults.innerHTML = "";
        searchResults.classList.remove("active");
        return;
      }

      const matches = directory.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.includes(query)),
      );

      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div style="padding: 10px 12px; color: rgba(255,255,255,0.6); font-size: 0.88rem;">
            <i class="fa-solid fa-circle-info text-warning me-2"></i> No specific direct match found for "<strong>${query}</strong>". Explore our <a href="${prefix}services.html" style="color: var(--theme); text-decoration: underline;">Practices</a> or <a href="${prefix}contact.html" style="color: var(--theme); text-decoration: underline;">Contact Desk</a>.
          </div>
        `;
        searchResults.classList.add("active");
      } else {
        searchResults.innerHTML = matches
          .map(
            (item) => `
          <a href="${item.url}" class="error-search-item">
            <span><i class="fa-solid fa-file-lines text-warning me-2"></i> ${item.name}</span>
            <i class="fa-solid fa-arrow-right" style="font-size: 0.8rem;"></i>
          </a>
        `,
          )
          .join("");
        searchResults.classList.add("active");
      }
    };

    searchInput.addEventListener("input", performSearch);
    searchBtn.addEventListener("click", performSearch);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
        const firstMatch = searchResults.querySelector(".error-search-item");
        if (firstMatch) {
          firstMatch.click();
        }
      }
    });
  }
}

// Theme Luxury Preloader Behavior (~2 Seconds Duration)
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const progressBar = document.getElementById("preloader-bar");
  const counterText = document.getElementById("preloader-counter");
  const targetDuration = 2000; // ~2 seconds
  const startTime = performance.now();

  // Prevent background scrolling while loading
  document.body.style.overflow = "hidden";

  function updateProgress(currentTime) {
    const elapsed = currentTime - startTime;
    const progressRatio = Math.min(elapsed / targetDuration, 1);

    // Smooth easeInOutQuad progression
    const easeProgress =
      progressRatio < 0.5
        ? 2 * progressRatio * progressRatio
        : 1 - Math.pow(-2 * progressRatio + 2, 2) / 2;

    const percentage = Math.min(100, Math.floor(easeProgress * 100));

    if (progressBar) {
      progressBar.style.width = percentage + "%";
    }
    if (counterText) {
      counterText.textContent = percentage + "%";
    }

    if (progressRatio < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      if (progressBar) progressBar.style.width = "100%";
      if (counterText) counterText.textContent = "100%";

      // Complete progress and trigger elegant fade out
      setTimeout(() => {
        preloader.classList.add("fade-out");

        // Restore scrolling and hide element after transition completes
        setTimeout(() => {
          preloader.style.display = "none";
          document.body.style.overflow = "";
        }, 750);
      }, 150);
    }
  }

  requestAnimationFrame(updateProgress);
}

// Scroll Reveal Animations for sections across non-excluded pages
function initScrollReveal() {
  const currentPath = window.location.pathname
    .replace(/\\/g, "/")
    .toLowerCase();
  const excludedPages = [
    "dashboard.html",
    "404.html",
    "login.html",
    "register.html",
  ];

  // Exclude dashboard, 404, login, and register pages
  const isExcluded = excludedPages.some((p) => currentPath.endsWith(p));
  if (isExcluded) return;

  const revealElements = document.querySelectorAll(".reveal, [data-reveal]");
  if (revealElements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -40px 0px",
    threshold: 0.08,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => {
    const customDelay = el.getAttribute("data-reveal-delay");
    if (customDelay) {
      el.style.transitionDelay = `${customDelay}ms`;
    }
    revealObserver.observe(el);
  });
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // 0. Initialize preloader immediately
  initPreloader();

  // 1. Determine paths and load external header & footer HTML component files
  const isRoot = !window.location.pathname
    .replace(/\\/g, "/")
    .includes("/pages/");
  const headerPath = isRoot
    ? "pages/components/header.html"
    : "components/header.html";
  const footerPath = isRoot
    ? "pages/components/footer.html"
    : "components/footer.html";

  await Promise.all([
    loadComponent("header-placeholder", headerPath),
    loadComponent("footer-placeholder", footerPath),
  ]);

  // 2. Initialize interactive UI components once headers/footers are inserted
  initStickyHeader();
  initMobileMenu();
  initScrollTop();
  initForms();
  initEmptyLinksRedirection();
  init404Page();

  // 3. Initialize page-specific features
  initCounters();
  initPortfolioFilter();
  initVideoModal();

  // 4. Initialize scroll reveal animation system
  initScrollReveal();
});
