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
          let count = 0;

          const updateCount = () => {
            const increment = Math.ceil(target / 60);
            count += increment;
            if (count >= target) {
              counter.innerText = target.toLocaleString();
            } else {
              counter.innerText = count.toLocaleString();
              setTimeout(updateCount, 30);
            }
          };

          updateCount();
          observer.unobserve(counter);
        }
      });
    },
    { threshold: 0.5 },
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

// Form Submission Handlers
function initForms() {
  const contactForms = document.querySelectorAll(
    ".ajax-contact-form, #contactForm, .newsletter-form",
  );

  contactForms.forEach((form) => {
    // Avoid double attaching listeners
    if (form.dataset.listenerAttached) return;
    form.dataset.listenerAttached = "true";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i> Sending...';
      }

      setTimeout(() => {
        alert(
          "Thank you! Your message has been received successfully. Our corporate advisory team will contact you shortly.",
        );
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }, 1200);
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

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

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

  // 3. Initialize page-specific features
  initCounters();
  initPortfolioFilter();
  initVideoModal();
});
