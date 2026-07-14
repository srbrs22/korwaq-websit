/**
 * KORWAQ — Main Application Entry Point
 */

import LanguageManager from "./language.js";

const PARTIAL_BASE = "assets/partials/";
const ASSET_VERSION = "20260714-2";
const LOGO_SRC = `assets/icons/Klogo-web.png?v=${ASSET_VERSION}`;

const FETCH_OPTIONS = { cache: "no-store" };

const UNSAFE_PARTIAL_PATTERN = /<(script|iframe|object|embed|link|meta|base)\b/i;

function partialUrl(file) {
  return `${PARTIAL_BASE}${file}?v=${ASSET_VERSION}`;
}

function assertSafePartialHtml(html, source) {
  if (UNSAFE_PARTIAL_PATTERN.test(html)) {
    throw new Error(`Unsafe content blocked in partial: ${source}`);
  }

  return html;
}

async function fetchPartialText(file) {
  const response = await fetch(partialUrl(file), FETCH_OPTIONS);

  if (!response.ok) {
    throw new Error(`Failed to load partial: ${file}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    throw new Error(`Unexpected content type for partial: ${file}`);
  }

  return assertSafePartialHtml(await response.text(), file);
}

const PARTIALS = {
  home: [
    "hero.html",
    "why-korwaq.html",
    "solutions-home.html",
    "about-home.html",
    "updates.html",
    "cta.html",
  ],
  about: ["about-page.html"],
  solutions: ["solutions-page.html"],
  blog: ["blog-page.html"],
  careers: ["careers-page.html"],
  contact: ["contact-page.html"],
  privacy: ["privacy-page.html"],
  404: ["404-page.html"],
};

const Header = (() => {
  let headerEl = null;
  let toggleBtn = null;
  let mobileNav = null;
  let overlay = null;
  let isOpen = false;

  async function loadPartial() {
    const placeholder = document.getElementById("site-header");
    if (!placeholder) return;

    try {
      let html = await fetchPartialText("header.html");
      html = html.replace(
        /assets\/icons\/Klogo-web\.png(?:\?[^"']*)?/g,
        LOGO_SRC
      );
      placeholder.outerHTML = html;
    } catch (error) {
      console.error("[Header]", error);
    }
  }

  function setActiveNavLink() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const isActive = link.getAttribute("data-nav") === currentPage;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function handleScroll() {
    if (!headerEl) return;
    headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function openMobileNav() {
    isOpen = true;
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.setAttribute("aria-label", LanguageManager.t("a11y.menu_close"));
    mobileNav.setAttribute("aria-hidden", "false");
    mobileNav.classList.add("is-open");
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeMobileNav() {
    isOpen = false;
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-label", LanguageManager.t("a11y.menu_toggle"));
    mobileNav.setAttribute("aria-hidden", "true");
    mobileNav.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindEvents() {
    headerEl = document.querySelector(".site-header");
    toggleBtn = document.querySelector(".site-header__toggle");
    mobileNav = document.getElementById("mobile-nav");
    overlay = document.querySelector(".site-header__overlay");

    if (!headerEl) return;

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (toggleBtn && mobileNav && overlay) {
      toggleBtn.addEventListener("click", () => {
        isOpen ? closeMobileNav() : openMobileNav();
      });

      overlay.addEventListener("click", closeMobileNav);

      mobileNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMobileNav);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen) {
          closeMobileNav();
          toggleBtn.focus();
        }
      });
    }

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMobileNav();
      }
    });
  }

  async function init() {
    await loadPartial();
    setActiveNavLink();
    bindEvents();
  }

  return { init };
})();

const Footer = (() => {
  async function loadPartial() {
    const placeholder = document.getElementById("site-footer");
    if (!placeholder) return;

    try {
      let html = await fetchPartialText("footer.html");
      html = html.replace(
        /assets\/icons\/Klogo-web\.png(?:\?[^"']*)?/g,
        LOGO_SRC
      );
      placeholder.outerHTML = html;
    } catch (error) {
      console.error("[Footer]", error);
    }
  }

  return { loadPartial };
})();

const PageContent = (() => {
  async function loadPartials() {
    const page = document.body.dataset.page;
    const partialFiles = PARTIALS[page];
    const main = document.getElementById("main-content");

    if (!partialFiles || !main) return;

    try {
      const contents = await Promise.all(
        partialFiles.map((file) => fetchPartialText(file))
      );

      main.innerHTML = contents.join("\n");
    } catch (error) {
      console.error("[PageContent]", error);
    }
  }

  return { loadPartials };
})();

const ScrollReveal = (() => {
  function init() {
    const elements = document.querySelectorAll("[data-reveal]");

    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  return { init };
})();

const ContactForm = (() => {
  const SUBMIT_COOLDOWN_MS = 60_000;
  const FIELD_LIMITS = {
    name: 100,
    email: 254,
    company: 100,
    message: 2000,
  };

  function sanitizeField(value, maxLength) {
    return value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function isRateLimited() {
    const lastSubmit = Number(sessionStorage.getItem("korwaq-form-ts") || 0);
    return Date.now() - lastSubmit < SUBMIT_COOLDOWN_MS;
  }

  function init() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const honeypot = form.querySelector("#contact-website");
      if (honeypot?.value.trim()) {
        return;
      }

      if (isRateLimited()) {
        return;
      }

      const name = form.querySelector("#contact-name");
      const email = form.querySelector("#contact-email");
      const company = form.querySelector("#contact-company");
      const message = form.querySelector("#contact-message");
      const errorEl = document.getElementById("contact-error");

      const safeName = sanitizeField(name.value, FIELD_LIMITS.name);
      const safeEmail = sanitizeField(email.value, FIELD_LIMITS.email);
      const safeCompany = sanitizeField(company.value, FIELD_LIMITS.company);
      const safeMessage = sanitizeField(message.value, FIELD_LIMITS.message);

      const isValid =
        safeName &&
        safeEmail &&
        email.validity.valid &&
        safeMessage;

      if (!isValid) {
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      sessionStorage.setItem("korwaq-form-ts", String(Date.now()));

      const subject = encodeURIComponent(`KORWAQ Contact — ${safeName}`);
      const body = encodeURIComponent(
        `Name: ${safeName}\nEmail: ${safeEmail}\nCompany: ${safeCompany || "—"}\n\n${safeMessage}`
      );

      window.location.href = `mailto:info@korwaq.com?subject=${subject}&body=${body}`;
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", async () => {
  await Header.init();
  await PageContent.loadPartials();
  await Footer.loadPartial();
  await LanguageManager.init();
  ScrollReveal.init();
  ContactForm.init();
});
