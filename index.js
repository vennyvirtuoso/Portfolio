document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. Theme Coordinator (Light/Dark Mode)
  // ==========================================
  const themeBtn = document.getElementById("theme-btn");
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const root = document.documentElement;

  // Retrieve pinned theme or evaluate system preference
  const getPreferredTheme = () => {
    const pinnedTheme = localStorage.getItem("color-scheme");
    if (pinnedTheme) return pinnedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply the theme to DOM
  const applyTheme = (theme, pin = false) => {
    // 1. Update root attribute to sync custom CSS rules (like icons)
    root.setAttribute("content", theme);
    
    // 2. Set the actual color-scheme style rule to trigger CSS light-dark()
    root.style.colorScheme = theme;

    // 3. Update the meta tag
    if (metaColorScheme) {
      metaColorScheme.content = theme;
    }

    // 4. Save/Clear pin
    if (pin) {
      localStorage.setItem("color-scheme", theme);
    } else {
      localStorage.removeItem("color-scheme");
    }
  };

  // Set initial theme
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, localStorage.getItem("color-scheme") !== null);

  // Toggle Theme on Button Click
  themeBtn.addEventListener("click", () => {
    const currentTheme = root.getAttribute("content");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true); // Pinned by user click
  });

  // Handle OS / System level theme change
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    // Only apply if user hasn't pinned a preference
    if (localStorage.getItem("color-scheme") === null) {
      applyTheme(e.matches ? "dark" : "light", false);
    }
  });

  // ==========================================
  // 2. Mobile Navigation Toggle
  // ==========================================
  const mobileToggleBtn = document.querySelector(".mobile-menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  const toggleMenu = () => {
    const isExpanded = mobileToggleBtn.getAttribute("aria-expanded") === "true";
    mobileToggleBtn.setAttribute("aria-expanded", !isExpanded);
    navMenu.classList.toggle("active");
    document.body.classList.toggle("no-scroll");
  };

  mobileToggleBtn.addEventListener("click", toggleMenu);

  // Close menu when clicking navigation links
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (navMenu.classList.contains("active")) {
        toggleMenu();
      }
    });
  });

  // ==========================================
  // 3. Scroll Header Effect
  // ==========================================
  const header = document.getElementById("header");
  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add("header-scrolled");
    } else {
      header.classList.remove("header-scrolled");
    }
  };
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Trigger once on mount

  // ==========================================
  // 4. Intersection Observer Fallback for Scroll Entrance
  // ==========================================
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    root.classList.add("no-view-timeline");

    const animatedSelectors = [
      ".about-grid > *",
      ".timeline-item",
      ".projects-grid > *",
      ".skill-category",
      ".publication-card",
      ".achievements-grid > *",
      ".contact-grid > *"
    ];

    const observerOptions = {
      root: null, // Viewport
      threshold: 0.1, // Trigger when 10% visible
      rootMargin: "0px 0px -50px 0px" // Slight offset from bottom
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target); // Trigger once
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Query and observe all elements
    animatedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        observer.observe(el);
      });
    });
  }

  // ==========================================
  // 5. Contact Form Validation and Submission
  // ==========================================
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector(".submit-btn");
      const submitText = submitBtn.querySelector("span");
      const name = document.getElementById("form-name").value.trim();
      const email = document.getElementById("form-email").value.trim();
      const message = document.getElementById("form-message").value.trim();

      // Basic validation
      if (!name || !email || !message) {
        formStatus.textContent = "Please fill in all fields.";
        formStatus.className = "form-status error";
        return;
      }

      // Simulating loading state
      submitBtn.disabled = true;
      submitText.textContent = "Sending...";
      formStatus.textContent = "";
      formStatus.className = "form-status";

      setTimeout(() => {
        // Success state
        submitBtn.disabled = false;
        submitText.textContent = "Send Message";
        formStatus.textContent = `Thank you, ${name}! Your message has been sent successfully.`;
        formStatus.className = "form-status success";
        
        // Clear inputs
        contactForm.reset();

        // Clear status message after 5 seconds
        setTimeout(() => {
          formStatus.textContent = "";
          formStatus.className = "form-status";
        }, 5000);

      }, 1200); // Simulate API latency
    });
  }
});
