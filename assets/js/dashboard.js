document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // -------------------------------------------------------------
  // 1. Role Metadata & Predefined Profiles
  // -------------------------------------------------------------
  const ROLE_CONFIG = {
    client: {
      name: "Client Partner",
      defaultEmail: "victoria.stirling@apexgroup.com",
      defaultName: "Victoria Stirling",
      title: "Managing Director, Apex Capital",
      roleLabel: "Client / Corporate Partner",
      badgeClass: "badge-blue",
      defaultPane: "client-overview",
    },
    consultant: {
      name: "Marcus Vance",
      defaultEmail: "marcus.vance@stacklycorp.com",
      defaultName: "Marcus Vance",
      title: "Senior Strategy Director",
      roleLabel: "Senior Consultant / Advisor",
      badgeClass: "badge-teal",
      defaultPane: "consultant-cockpit",
    },
    executive: {
      name: "Helena Rossi",
      defaultEmail: "helena.rossi@stacklycorp.com",
      defaultName: "Helena Rossi",
      title: "Chief Executive Officer & Partner",
      roleLabel: "Enterprise Executive / C-Suite",
      badgeClass: "badge-gold",
      defaultPane: "executive-overview",
    },
    stakeholder: {
      name: "Lord Arthur Sterling",
      defaultEmail: "a.sterling@sterlingholdings.co.uk",
      defaultName: "Lord Arthur Sterling",
      title: "Principal Board Trustee & Shareholder",
      roleLabel: "Board Member / Stakeholder",
      badgeClass: "badge-purple",
      defaultPane: "stakeholder-governance",
    },
  };

  // -------------------------------------------------------------
  // 2. Session Initialization
  // Read data saved during login or URL params
  // -------------------------------------------------------------
  function getSessionUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramRole = urlParams.get("role");
    const paramEmail = urlParams.get("email");

    const savedRole =
      localStorage.getItem("stackly_auth_role") ||
      sessionStorage.getItem("stackly_auth_role") ||
      paramRole ||
      "client";
    const savedEmail =
      localStorage.getItem("stackly_auth_email") ||
      sessionStorage.getItem("stackly_auth_email") ||
      paramEmail ||
      "";
    const savedTime =
      localStorage.getItem("stackly_auth_login_time") ||
      sessionStorage.getItem("stackly_auth_login_time") ||
      new Date().toLocaleString();

    // Determine current role key (validate against defined roles)
    const activeRoleKey = ROLE_CONFIG[savedRole.toLowerCase()]
      ? savedRole.toLowerCase()
      : "client";
    const rolePreset = ROLE_CONFIG[activeRoleKey];

    // Compute display name from email or preset
    let displayName = rolePreset.defaultName;
    let displayEmail = savedEmail || rolePreset.defaultEmail;

    if (savedEmail && savedEmail.includes("@")) {
      const emailPrefix = savedEmail.split("@")[0].replace(/[._-]/g, " ");
      displayName = emailPrefix
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    return {
      roleKey: activeRoleKey,
      roleConfig: rolePreset,
      email: displayEmail,
      name: displayName,
      loginTime: savedTime,
    };
  }

  let currentUser = getSessionUser();

  // -------------------------------------------------------------
  // 3. Render User and Role Information to Dashboard UI
  // -------------------------------------------------------------
  function updateDashboardRoleUI(roleKey) {
    if (!ROLE_CONFIG[roleKey]) roleKey = "client";
    currentUser.roleKey = roleKey;
    currentUser.roleConfig = ROLE_CONFIG[roleKey];

    // Save active role to session
    sessionStorage.setItem("stackly_auth_role", roleKey);

    // 1. Update text elements
    const nameElements = document.querySelectorAll(".dyn-user-name");
    nameElements.forEach((el) => (el.textContent = currentUser.name));

    const emailElements = document.querySelectorAll(".dyn-user-email");
    emailElements.forEach((el) => (el.textContent = currentUser.email));

    const roleBadgeElements = document.querySelectorAll(".dyn-user-role");
    roleBadgeElements.forEach((el) => {
      el.textContent = currentUser.roleConfig.roleLabel;
    });

    const loginTimeElements = document.querySelectorAll(".dyn-login-time");
    loginTimeElements.forEach((el) => (el.textContent = currentUser.loginTime));

    // 2. Update user avatars (first letter of name only)
    const initial =
      currentUser.name && currentUser.name.trim().length > 0
        ? currentUser.name.trim().charAt(0).toUpperCase()
        : "U";
    const avatarElements = document.querySelectorAll(
      ".dyn-user-avatar, .dyn-user-initial",
    );
    avatarElements.forEach((el) => {
      el.textContent = initial;
    });

    // 3. Update top role pills active state
    const rolePills = document.querySelectorAll(".role-pill-btn");
    rolePills.forEach((pill) => {
      if (pill.getAttribute("data-role") === roleKey) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });

    // 4. Show the corresponding sidebar menu set
    const allRoleMenus = document.querySelectorAll(".role-sidebar-group");
    allRoleMenus.forEach((menu) => {
      if (menu.getAttribute("data-role") === roleKey) {
        menu.style.display = "block";
      } else {
        menu.style.display = "none";
      }
    });

    // 5. Show the corresponding role main section
    const allRoleSections = document.querySelectorAll(".role-section-wrapper");
    allRoleSections.forEach((section) => {
      if (section.getAttribute("data-role") === roleKey) {
        section.classList.add("active-role");
      } else {
        section.classList.remove("active-role");
      }
    });

    // 6. Activate default tab pane for this role
    const activeSection = document.querySelector(
      `.role-section-wrapper[data-role="${roleKey}"]`,
    );
    if (activeSection) {
      const activeSidebar = document.querySelector(
        `.role-sidebar-group[data-role="${roleKey}"]`,
      );
      const firstLink = activeSidebar
        ? activeSidebar.querySelector(".sidebar-nav-link")
        : null;
      if (firstLink) {
        const targetPaneId = firstLink.getAttribute("data-pane");
        activateTabPane(roleKey, targetPaneId, firstLink);
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Tab Pane Navigation within a Role
  // -------------------------------------------------------------
  function activateTabPane(roleKey, targetPaneId, activeLinkElement) {
    const roleSection = document.querySelector(
      `.role-section-wrapper[data-role="${roleKey}"]`,
    );
    if (!roleSection) return;

    // Remove active class from all tab panes in this role
    const panes = roleSection.querySelectorAll(".role-tab-pane");
    panes.forEach((pane) => pane.classList.remove("active-pane"));

    // Activate the targeted pane
    const targetPane = roleSection.querySelector(`#${targetPaneId}`);
    if (targetPane) {
      targetPane.classList.add("active-pane");
    }

    // Update active class on sidebar links
    const sidebarGroup = document.querySelector(
      `.role-sidebar-group[data-role="${roleKey}"]`,
    );
    if (sidebarGroup) {
      sidebarGroup.querySelectorAll(".sidebar-nav-link").forEach((link) => {
        link.classList.remove("active");
      });
      if (activeLinkElement) {
        activeLinkElement.classList.add("active");
      }
    }

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Scroll to top of main content smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Bind click listeners to all sidebar navigation links
  document.querySelectorAll(".sidebar-nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetPaneId = this.getAttribute("data-pane");
      activateTabPane(currentUser.roleKey, targetPaneId, this);
    });
  });

  // -------------------------------------------------------------
  // 5. Role Switcher Handlers (Topbar pills + dropdown items)
  // -------------------------------------------------------------
  document
    .querySelectorAll(".role-pill-btn, .role-dropdown-item")
    .forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const newRole = this.getAttribute("data-role");
        if (newRole) {
          updateDashboardRoleUI(newRole);
          showDashboardToast(
            "Role Switched",
            `Now viewing enterprise dashboard as ${ROLE_CONFIG[newRole].roleLabel}`,
            "info",
          );
        }
      });
    });

  // -------------------------------------------------------------
  // 6. Mobile Sidebar Offcanvas Handlers
  // -------------------------------------------------------------
  const sidebar = document.getElementById("dashboardSidebar");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add("sidebar-open");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove("sidebar-open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (sidebarToggleBtn)
    sidebarToggleBtn.addEventListener("click", openMobileSidebar);
  if (sidebarCloseBtn)
    sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
  if (sidebarOverlay)
    sidebarOverlay.addEventListener("click", closeMobileSidebar);

  // -------------------------------------------------------------
  // 7. Logout Action Handler
  // Logout button must redirect cleanly to login page
  // -------------------------------------------------------------
  document.querySelectorAll(".logout-action-btn, #logoutBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.removeItem("stackly_auth_role");
      sessionStorage.removeItem("stackly_auth_email");
      sessionStorage.removeItem("stackly_auth_logged_in");
      localStorage.removeItem("stackly_auth_role");
      localStorage.removeItem("stackly_auth_email");

      showDashboardToast(
        "Session Closed",
        "Signing out of Stackly Corporate Advisory Portal...",
        "warning",
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    });
  });

  // -------------------------------------------------------------
  // 8. Global Interceptor for Empty Links & Buttons -> 404 Direct Redirection
  // Except sidebar menus and logout button, all buttons, empty links, #,
  // and form submissions directly redirect to 404 page with no alert dialog.
  // -------------------------------------------------------------
  document.addEventListener("click", (e) => {
    // 1. Check if clicked an anchor link
    const link = e.target.closest("a");
    if (link) {
      // Excluded elements that should never trigger 404:
      // - Sidebar menu links
      // - Sidebar brand logo
      // - Logout action links
      // - Role dropdown items
      if (
        link.classList.contains("sidebar-nav-link") ||
        link.classList.contains("sidebar-logo") ||
        link.classList.contains("logout-action-btn") ||
        link.classList.contains("role-dropdown-item") ||
        link.id === "logoutBtn" ||
        link.hasAttribute("data-pane") ||
        link.hasAttribute("data-role")
      ) {
        return;
      }

      const href = link.getAttribute("href");
      // If href is empty, #, javascript, or any placeholder link, redirect directly to 404
      if (
        href === null ||
        href.trim() === "" ||
        href.trim() === "#" ||
        href.trim() === "#!" ||
        href.trim().startsWith("javascript:") ||
        link.classList.contains("tbl-btn")
      ) {
        e.preventDefault();
        window.location.href = "../404.html";
        return;
      }
    }

    // 2. Check if clicked a button
    const btn = e.target.closest("button");
    if (btn) {
      // Excluded functional dashboard controls:
      // - Logout button
      // - Sidebar navigation / toggles
      // - Role switcher pills
      if (
        btn.classList.contains("logout-action-btn") ||
        btn.id === "logoutBtn" ||
        btn.classList.contains("sidebar-nav-link") ||
        btn.classList.contains("role-pill-btn") ||
        btn.classList.contains("dashboard-toggle-sidebar") ||
        btn.classList.contains("sidebar-close-btn") ||
        btn.id === "sidebarToggleBtn" ||
        btn.id === "sidebarCloseBtn"
      ) {
        return;
      }

      // All remaining buttons redirect directly to 404 page (no alert)
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "../404.html";
      return;
    }
  });

  // Intercept any form submission on dashboard to redirect to 404 page directly
  document.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "../404.html";
  });

  // -------------------------------------------------------------
  // 9. Toast Notification Helper
  // -------------------------------------------------------------
  function showDashboardToast(title, message, type = "success") {
    let toast = document.getElementById("dashToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "dashToast";
      toast.className = "auth-toast";
      document.body.appendChild(toast);
    }

    const iconMap = {
      success: '<i class="fa-solid fa-circle-check auth-toast-icon"></i>',
      info: '<i class="fa-solid fa-circle-info auth-toast-icon"></i>',
      warning:
        '<i class="fa-solid fa-triangle-exclamation auth-toast-icon"></i>',
      error: '<i class="fa-solid fa-circle-exclamation auth-toast-icon"></i>',
    };

    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `
      ${iconMap[type] || iconMap.success}
      <div class="auth-toast-content">
        <h5 style="margin: 0 0 2px; font-size: 0.95rem; font-weight: 700;">${title}</h5>
        <p style="margin: 0; font-size: 0.82rem; color: #94a3b8;">${message}</p>
      </div>
    `;

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  // -------------------------------------------------------------
  // 10. Interactive Search Filter for Tables
  // -------------------------------------------------------------
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const term = this.value.toLowerCase().trim();
      const activePane = document.querySelector(".role-tab-pane.active-pane");
      if (!activePane) return;

      const rows = activePane.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? "" : "none";
      });
    });
  }

  // -------------------------------------------------------------
  // 11. Initial execution on page load
  // -------------------------------------------------------------
  updateDashboardRoleUI(currentUser.roleKey);
});
