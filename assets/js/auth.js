document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // -------------------------------------------------------------
  // 1. Toast Notification Utility
  // -------------------------------------------------------------
  function showToast(title, message, type = "success") {
    let toast = document.getElementById("authToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "authToast";
      toast.className = "auth-toast";
      document.body.appendChild(toast);
    }

    const iconMap = {
      success: '<i class="fa-solid fa-circle-check auth-toast-icon"></i>',
      error: '<i class="fa-solid fa-circle-exclamation auth-toast-icon"></i>',
      warning:
        '<i class="fa-solid fa-triangle-exclamation auth-toast-icon"></i>',
    };

    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `
      ${iconMap[type] || iconMap.success}
      <div class="auth-toast-content">
        <h5>${title}</h5>
        <p>${message}</p>
      </div>
    `;

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  // Check if we arrived from a recent registration
  if (sessionStorage.getItem("stackly_registered_msg")) {
    showToast(
      "Registration Complete",
      sessionStorage.getItem("stackly_registered_msg"),
      "success",
    );
    sessionStorage.removeItem("stackly_registered_msg");
  }

  // -------------------------------------------------------------
  // 2. Password Visibility Toggle
  // -------------------------------------------------------------
  const toggleButtons = document.querySelectorAll(".password-toggle-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetInputId = btn.getAttribute("data-target");
      const targetInput = document.getElementById(targetInputId);
      if (!targetInput) return;

      const isPassword = targetInput.getAttribute("type") === "password";
      targetInput.setAttribute("type", isPassword ? "text" : "password");

      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      }
    });
  });

  // -------------------------------------------------------------
  // 3. Username Keydown & Input Restriction (Requirement 7)
  // Prevent typing numbers, special characters, and spaces.
  // -------------------------------------------------------------
  const usernameInput = document.getElementById("regUsername");
  const usernameFeedback = document.getElementById("usernameFeedback");

  if (usernameInput) {
    // 3a. Prevent keypress of numbers, spaces, and special symbols
    usernameInput.addEventListener("keydown", (e) => {
      // Allow control keys: Backspace, Tab, Enter, Delete, Arrow keys, Home, End
      const allowedKeys = [
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
      ];

      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Check if key is a letter (a-z, A-Z)
      const isLetter = /^[a-zA-Z]$/.test(e.key);

      if (!isLetter) {
        e.preventDefault();
        if (usernameFeedback) {
          usernameFeedback.className = "field-feedback show-error";
          usernameFeedback.innerHTML =
            '<i class="fa-solid fa-circle-exclamation"></i> Only alphabetic letters (A-Z, a-z) are allowed. Numbers, spaces & symbols are blocked.';
          setTimeout(() => {
            if (usernameInput.value.length >= 3) {
              usernameFeedback.className = "field-feedback show-success";
              usernameFeedback.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> Valid username format.';
            } else {
              usernameFeedback.className = "field-feedback";
            }
          }, 3000);
        }
      }
    });

    // 3b. Sanitize on input and paste to strip any invalid chars instantly
    usernameInput.addEventListener("input", function () {
      const sanitized = this.value.replace(/[^a-zA-Z]/g, "");
      if (this.value !== sanitized) {
        this.value = sanitized;
      }

      if (this.value.length === 0) {
        this.classList.remove("is-valid", "is-invalid");
        if (usernameFeedback) usernameFeedback.className = "field-feedback";
      } else if (this.value.length < 3) {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
        if (usernameFeedback) {
          usernameFeedback.className = "field-feedback show-error";
          usernameFeedback.innerHTML =
            '<i class="fa-solid fa-circle-exclamation"></i> Username must be at least 3 letters.';
        }
      } else {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        if (usernameFeedback) {
          usernameFeedback.className = "field-feedback show-success";
          usernameFeedback.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Valid username format.';
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 4. Password Strength & Weak Password Validation (Requirements 5 & 6)
  // -------------------------------------------------------------
  function evaluatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.lowercase && checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    let level = "empty";
    if (password.length === 0) {
      level = "empty";
    } else if (password.length < 6 || score <= 1) {
      level = "weak";
    } else if (score === 2) {
      level = "fair";
    } else if (score === 3) {
      level = "good";
    } else if (score >= 4) {
      level = "strong";
    }

    return { checks, score, level };
  }

  function updateStrengthUI(container, strength) {
    if (!container) return;

    const badge = container.querySelector(".strength-badge");
    const segments = container.querySelectorAll(".strength-segment");
    const critLength = container.querySelector("[data-crit='length']");
    const critCases = container.querySelector("[data-crit='cases']");
    const critNumber = container.querySelector("[data-crit='number']");
    const critSpecial = container.querySelector("[data-crit='special']");

    // Reset segments
    segments.forEach((s) => {
      s.className = "strength-segment";
    });

    if (strength.level === "empty") {
      if (badge) {
        badge.className = "strength-badge";
        badge.textContent = "Strength";
      }
    } else if (strength.level === "weak") {
      if (badge) {
        badge.className = "strength-badge strength-weak";
        badge.textContent = "Weak";
      }
      if (segments[0]) segments[0].classList.add("active-weak");
    } else if (strength.level === "fair") {
      if (badge) {
        badge.className = "strength-badge strength-fair";
        badge.textContent = "Fair";
      }
      if (segments[0]) segments[0].classList.add("active-fair");
      if (segments[1]) segments[1].classList.add("active-fair");
    } else if (strength.level === "good") {
      if (badge) {
        badge.className = "strength-badge strength-good";
        badge.textContent = "Good";
      }
      if (segments[0]) segments[0].classList.add("active-good");
      if (segments[1]) segments[1].classList.add("active-good");
      if (segments[2]) segments[2].classList.add("active-good");
    } else if (strength.level === "strong") {
      if (badge) {
        badge.className = "strength-badge strength-strong";
        badge.textContent = "Strong";
      }
      segments.forEach((s) => s.classList.add("active-strong"));
    }

    // Update criteria list
    const updateCriteriaItem = (elem, isValid) => {
      if (!elem) return;
      elem.classList.toggle("valid", isValid);
      elem.classList.toggle("invalid", !isValid);
      const icon = elem.querySelector("i");
      if (icon) {
        icon.className = isValid ? "fa-solid fa-check" : "fa-regular fa-circle";
      }
    };

    if (critLength) updateCriteriaItem(critLength, strength.checks.length);
    if (critCases)
      updateCriteriaItem(
        critCases,
        strength.checks.lowercase && strength.checks.uppercase,
      );
    if (critNumber) updateCriteriaItem(critNumber, strength.checks.number);
    if (critSpecial) updateCriteriaItem(critSpecial, strength.checks.special);
  }

  // Register Password Strength Listener
  const regPasswordInput = document.getElementById("regPassword");
  const regStrengthContainer = document.getElementById("regStrengthContainer");
  const regPasswordFeedback = document.getElementById("regPasswordFeedback");

  if (regPasswordInput && regStrengthContainer) {
    regPasswordInput.addEventListener("input", function () {
      const strength = evaluatePasswordStrength(this.value);
      updateStrengthUI(regStrengthContainer, strength);

      if (this.value.length === 0) {
        this.classList.remove("is-valid", "is-invalid");
        if (regPasswordFeedback)
          regPasswordFeedback.className = "field-feedback";
      } else if (strength.level === "weak") {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
        if (regPasswordFeedback) {
          regPasswordFeedback.className = "field-feedback show-error";
          regPasswordFeedback.innerHTML =
            '<i class="fa-solid fa-shield-halved"></i> Weak password. Please use at least 8 characters with letters, numbers, and symbols.';
        }
      } else {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        if (regPasswordFeedback) {
          regPasswordFeedback.className = "field-feedback show-success";
          regPasswordFeedback.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Password meets corporate security strength.';
        }
      }

      // Check confirm password matching as well if already filled
      validateConfirmPassword();
    });
  }

  // Login Password Strength / Validation Listener
  const loginPasswordInput = document.getElementById("loginPassword");
  const loginPasswordFeedback = document.getElementById(
    "loginPasswordFeedback",
  );

  if (loginPasswordInput) {
    loginPasswordInput.addEventListener("input", function () {
      if (this.value.length === 0) {
        this.classList.remove("is-valid", "is-invalid");
        if (loginPasswordFeedback)
          loginPasswordFeedback.className = "field-feedback";
      } else if (this.value.length < 6) {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
        if (loginPasswordFeedback) {
          loginPasswordFeedback.className = "field-feedback show-error";
          loginPasswordFeedback.innerHTML =
            '<i class="fa-solid fa-triangle-exclamation"></i> Password must be at least 6 characters.';
        }
      } else {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        if (loginPasswordFeedback) {
          loginPasswordFeedback.className = "field-feedback show-success";
          loginPasswordFeedback.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Password entered.';
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 5. Password & Confirm Password Matching (Requirement 5)
  // -------------------------------------------------------------
  const confirmPasswordInput = document.getElementById("regConfirmPassword");
  const confirmPasswordFeedback = document.getElementById(
    "confirmPasswordFeedback",
  );

  function validateConfirmPassword() {
    if (!confirmPasswordInput || !regPasswordInput) return false;
    const password = regPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    if (confirm.length === 0) {
      confirmPasswordInput.classList.remove("is-valid", "is-invalid");
      if (confirmPasswordFeedback)
        confirmPasswordFeedback.className = "field-feedback";
      return false;
    }

    if (password === confirm) {
      confirmPasswordInput.classList.remove("is-invalid");
      confirmPasswordInput.classList.add("is-valid");
      if (confirmPasswordFeedback) {
        confirmPasswordFeedback.className = "field-feedback show-success";
        confirmPasswordFeedback.innerHTML =
          '<i class="fa-solid fa-circle-check"></i> Passwords match successfully!';
      }
      return true;
    } else {
      confirmPasswordInput.classList.add("is-invalid");
      confirmPasswordInput.classList.remove("is-valid");
      if (confirmPasswordFeedback) {
        confirmPasswordFeedback.className = "field-feedback show-error";
        confirmPasswordFeedback.innerHTML =
          '<i class="fa-solid fa-circle-xmark"></i> Passwords do not match. Please re-check.';
      }
      return false;
    }
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", validateConfirmPassword);
  }

  // -------------------------------------------------------------
  // 6. Email Format Validation
  // -------------------------------------------------------------
  function setupEmailValidation(inputId, feedbackId) {
    const emailInput = document.getElementById(inputId);
    const feedback = document.getElementById(feedbackId);
    if (!emailInput) return;

    emailInput.addEventListener("input", function () {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.value.length === 0) {
        this.classList.remove("is-valid", "is-invalid");
        if (feedback) feedback.className = "field-feedback";
      } else if (!emailRegex.test(this.value)) {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
        if (feedback) {
          feedback.className = "field-feedback show-error";
          feedback.innerHTML =
            '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid corporate email address.';
        }
      } else {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        if (feedback) {
          feedback.className = "field-feedback show-success";
          feedback.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Valid email address.';
        }
      }
    });
  }

  setupEmailValidation("loginEmail", "loginEmailFeedback");
  setupEmailValidation("regEmail", "regEmailFeedback");

  // -------------------------------------------------------------
  // 7. Role Selection Validation
  // -------------------------------------------------------------
  function setupRoleValidation(selectId) {
    const roleSelect = document.getElementById(selectId);
    if (!roleSelect) return;

    roleSelect.addEventListener("change", function () {
      if (this.value) {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
      } else {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
      }
    });
  }

  setupRoleValidation("loginRole");
  setupRoleValidation("regRole");

  // -------------------------------------------------------------
  // 8. Form Submission: Register Form (Requirements 4, 5, 6, 7, 8)
  // -------------------------------------------------------------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = usernameInput ? usernameInput.value.trim() : "";
      const role = document.getElementById("regRole")?.value;
      const email = document.getElementById("regEmail")?.value.trim();
      const password = regPasswordInput ? regPasswordInput.value : "";
      const confirmPassword = confirmPasswordInput
        ? confirmPasswordInput.value
        : "";
      const terms = document.getElementById("regTerms")?.checked;

      // Validation Checks
      // 1. Username
      if (!username || username.length < 3 || /[^a-zA-Z]/.test(username)) {
        showToast(
          "Validation Error",
          "Username must contain only letters (at least 3 characters).",
          "error",
        );
        usernameInput?.focus();
        usernameInput?.classList.add("is-invalid");
        return;
      }

      // 2. Role
      if (!role) {
        showToast(
          "Validation Error",
          "Please select your enterprise role.",
          "error",
        );
        document.getElementById("regRole")?.focus();
        document.getElementById("regRole")?.classList.add("is-invalid");
        return;
      }

      // 3. Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast(
          "Validation Error",
          "Please enter a valid corporate email address.",
          "error",
        );
        document.getElementById("regEmail")?.focus();
        document.getElementById("regEmail")?.classList.add("is-invalid");
        return;
      }

      // 4. Password Strength Check
      const strength = evaluatePasswordStrength(password);
      if (strength.level === "weak" || password.length < 8) {
        showToast(
          "Weak Password",
          "Please choose a stronger password (minimum 8 characters with upper, lower, numbers, and symbols).",
          "warning",
        );
        regPasswordInput?.focus();
        regPasswordInput?.classList.add("is-invalid");
        return;
      }

      // 5. Confirm Password Match Check
      if (password !== confirmPassword) {
        showToast(
          "Password Mismatch",
          "Confirm password does not match the password entered.",
          "error",
        );
        confirmPasswordInput?.focus();
        confirmPasswordInput?.classList.add("is-invalid");
        return;
      }

      // 6. Terms & Conditions Check
      if (!terms) {
        showToast(
          "Terms Required",
          "You must agree to the Terms of Service and Privacy Policy to register.",
          "error",
        );
        document.getElementById("regTerms")?.focus();
        return;
      }

      // Process Submission & Redirect to Login
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i> Creating Enterprise Account...';
      }

      setTimeout(() => {
        // Store message for login page
        sessionStorage.setItem(
          "stackly_registered_msg",
          `Account for ${username} created successfully! Please sign in with your credentials.`,
        );

        showToast(
          "Account Created",
          "Registration successful! Redirecting to login page...",
          "success",
        );

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      }, 1000);
    });
  }

  // -------------------------------------------------------------
  // 9. Form Submission: Login Form (Requirements 2, 4, 6, 9)
  // -------------------------------------------------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const role = document.getElementById("loginRole")?.value;
      const email = document.getElementById("loginEmail")?.value.trim();
      const password = loginPasswordInput ? loginPasswordInput.value : "";
      const remember = document.getElementById("loginRemember")?.checked;

      // 1. Role
      if (!role) {
        showToast(
          "Validation Error",
          "Please select your access role.",
          "error",
        );
        document.getElementById("loginRole")?.focus();
        document.getElementById("loginRole")?.classList.add("is-invalid");
        return;
      }

      // 2. Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast(
          "Validation Error",
          "Please enter a valid corporate email address.",
          "error",
        );
        document.getElementById("loginEmail")?.focus();
        document.getElementById("loginEmail")?.classList.add("is-invalid");
        return;
      }

      // 3. Password Check
      if (!password || password.length < 6) {
        showToast(
          "Invalid Password",
          "Password must be at least 6 characters.",
          "error",
        );
        loginPasswordInput?.focus();
        loginPasswordInput?.classList.add("is-invalid");
        return;
      }

      // 4. Remember Me Check (Required field check)
      if (!remember) {
        showToast(
          "Selection Required",
          "Please check the Remember Me option to proceed.",
          "warning",
        );
        document.getElementById("loginRemember")?.focus();
        return;
      }

      // Process Login
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i> Authenticating...';
      }

      setTimeout(() => {
        showToast(
          "Authentication Successful",
          `Welcome back! Accessing Stackly Corporate Portal as ${role.toUpperCase()}...`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1400);
      }, 1000);
    });
  }
});
