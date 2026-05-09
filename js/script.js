/**
 * Adi's Ceramics — Main Script
 * Assembled from _base modules: utils, navigation, scroll-animations,
 * form-handler, plus custom lightbox and gallery logic.
 */
(function () {
  "use strict";

  /* ================================================================
     UTILITIES
     ================================================================ */

  function getBasePath() {
    if (window.location.pathname.includes("/pages/")) {
      return "../";
    }
    return "";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ================================================================
     BRANDING — populate logo, footer from SITE_CONFIG
     ================================================================ */

  function applyBranding() {
    if (typeof SITE_CONFIG === "undefined") return;
    var BASE = getBasePath();

    var logo = document.getElementById("site-logo");
    if (logo) {
      logo.textContent = SITE_CONFIG.siteName;
      logo.href = BASE + "index.html";
    }

    var footerCopyright = document.getElementById("footer-copyright");
    if (footerCopyright) {
      footerCopyright.textContent = SITE_CONFIG.footer.copyright;
    }

    var footerBuiltWith = document.getElementById("footer-built-with");
    if (footerBuiltWith) {
      footerBuiltWith.textContent = SITE_CONFIG.footer.builtWith;
    }
  }

  /* ================================================================
     NAVIGATION — mobile menu, scroll header, active section highlight
     ================================================================ */

  function initMobileMenu() {
    var toggle = document.getElementById("mobile-toggle");
    var nav = document.getElementById("nav-links");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      toggle.classList.toggle("open");
      nav.classList.toggle("open");
      var isOpen = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu"
      );
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close on link click
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        toggle.classList.remove("open");
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        document.body.style.overflow = "";
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        toggle.classList.remove("open");
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  function initScrollHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 10);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initActiveNavHighlight() {
    var sections = document.querySelectorAll("main > section[id]");
    var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
    if (!sections.length || !navLinks.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + id
              );
            });
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ================================================================
     SCROLL ANIMATIONS — IntersectionObserver-driven reveals
     ================================================================ */

  function initScrollAnimations() {
    // Bail out if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Single elements
    var elements = document.querySelectorAll(
      ".fade-in, .fade-in-up, .scale-in"
    );

    if (elements.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      elements.forEach(function (el) {
        observer.observe(el);
      });
    }

    // Staggered children (gallery grid)
    var staggerGroups = document.querySelectorAll(".stagger-children");

    if (staggerGroups.length) {
      var staggerObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var children = entry.target.children;
              Array.from(children).forEach(function (child, i) {
                setTimeout(function () {
                  child.classList.add("visible");
                }, Math.min(i * 80, 1600));
              });
              staggerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05 }
      );

      staggerGroups.forEach(function (el) {
        staggerObserver.observe(el);
      });
    }
  }

  /* ================================================================
     HERO ENTRANCE ANIMATION
     ================================================================ */

  function initHeroAnimation() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var heroElements = document.querySelectorAll(".hero-enter");
    heroElements.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 300 + i * 200);
    });
  }

  /* ================================================================
     LIGHTBOX — full-screen image viewer with keyboard navigation
     ================================================================ */

  function initLightbox() {
    var overlay = document.getElementById("lightbox");
    var lightboxImg = document.getElementById("lightbox-img");
    var closeBtn = document.getElementById("lightbox-close");
    var prevBtn = document.getElementById("lightbox-prev");
    var nextBtn = document.getElementById("lightbox-next");
    if (!overlay || !lightboxImg) return;

    var galleryItems = document.querySelectorAll(".gallery-item img");
    var images = Array.from(galleryItems).map(function (img) {
      return img.getAttribute("src");
    });
    var currentIndex = 0;
    var triggerElement = null;

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = images[currentIndex];
      lightboxImg.alt =
        "Enlarged view: ceramic piece " + (currentIndex + 1) + " of " + images.length;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function closeLightbox() {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
      lightboxImg.src = "data:,";
      if (triggerElement) {
        triggerElement.focus();
        triggerElement = null;
      }
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      lightboxImg.src = images[currentIndex];
      lightboxImg.alt =
        "Enlarged view: ceramic piece " + (currentIndex + 1) + " of " + images.length;
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      lightboxImg.src = images[currentIndex];
      lightboxImg.alt =
        "Enlarged view: ceramic piece " + (currentIndex + 1) + " of " + images.length;
    }

    // Click handlers on gallery items
    galleryItems.forEach(function (img, i) {
      var item = img.closest(".gallery-item");
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute(
        "aria-label",
        "View ceramic piece " + (i + 1) + " in full size"
      );

      item.addEventListener("click", function () {
        triggerElement = item;
        openLightbox(i);
      });

      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerElement = item;
          openLightbox(i);
        }
      });
    });

    // Close
    closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLightbox();
    });

    // Navigation
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showPrev();
    });
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showNext();
    });

    // Keyboard navigation
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("active")) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();

      // Focus trap inside lightbox
      if (e.key === "Tab") {
        var focusable = [closeBtn, prevBtn, nextBtn];
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ================================================================
     CONTACT FORM
     ================================================================ */

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      var formData = new FormData(form);

      var name = (formData.get("name") || "").toString().trim();
      var email = (formData.get("email") || "").toString().trim();
      var message = (formData.get("message") || "").toString().trim();

      if (!name || !email || !message) {
        showFormStatus(status, "Please fill in all required fields.", "error");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormStatus(
          status,
          "Please enter a valid email address.",
          "error"
        );
        return;
      }

      if (
        typeof SITE_CONFIG !== "undefined" &&
        SITE_CONFIG.contact.formAction
      ) {
        fetch(SITE_CONFIG.contact.formAction, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }
        })
          .then(function (res) {
            if (res.ok) {
              showFormStatus(
                status,
                "Message sent! I\u2019ll get back to you soon.",
                "success"
              );
              form.reset();
            } else {
              showFormStatus(
                status,
                "Something went wrong. Please try again.",
                "error"
              );
            }
          })
          .catch(function () {
            showFormStatus(
              status,
              "Network error. Please try again later.",
              "error"
            );
          });
      } else {
        var contactEmail =
          typeof SITE_CONFIG !== "undefined"
            ? SITE_CONFIG.contact.email
            : "adi@example.com";
        var mailtoLink =
          "mailto:" +
          encodeURIComponent(contactEmail) +
          "?subject=Contact from " +
          encodeURIComponent(name) +
          "&body=" +
          encodeURIComponent(message);
        window.location.href = mailtoLink;
        showFormStatus(status, "Opening your email client\u2026", "success");
      }
    });
  }

  function showFormStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = "form-status " + type;
    setTimeout(function () {
      element.className = "form-status";
    }, 5000);
  }

  /* ================================================================
     INIT — run on DOMContentLoaded
     ================================================================ */

  function init() {
    applyBranding();
    initMobileMenu();
    initScrollHeader();
    initActiveNavHighlight();
    initScrollAnimations();
    initHeroAnimation();
    initLightbox();
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
