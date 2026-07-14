/**
 * KORWAQ — Internationalization Module
 * Loads translations from JSON and applies via data-i18n attributes.
 */

const LanguageManager = (() => {
  const STORAGE_KEY = "korwaq-lang";
  const DEFAULT_LANG = "tr";
  const SUPPORTED_LANGS = ["tr", "en"];

  let currentLang = DEFAULT_LANG;
  let translations = {};

  /**
   * Resolve a dot-notation key from the translations object.
   * @param {string} key - e.g. "nav.home"
   * @returns {string|undefined}
   */
  function getNestedValue(obj, key) {
    return key.split(".").reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Load translation file for the given language.
   * @param {string} lang
   */
  async function loadTranslations(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new Error(`Unsupported language: ${lang}`);
    }

    const response = await fetch(`assets/lang/${lang}.json`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load translations for "${lang}"`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      throw new Error(`Unexpected content type for translations: ${lang}`);
    }

    return response.json();
  }

  /**
   * Apply translations to all elements with data-i18n attributes.
   */
  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getNestedValue(translations, key);

      if (value !== undefined) {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const mappings = el.getAttribute("data-i18n-attr").split(";");

      mappings.forEach((mapping) => {
        const [attr, key] = mapping.split(":").map((s) => s.trim());
        const value = getNestedValue(translations, key);

        if (attr && value !== undefined) {
          el.setAttribute(attr, value);
        }
      });
    });

    document.documentElement.lang = currentLang;
  }

  /**
   * Update language switcher button states.
   */
  function updateLangButtons() {
    document.querySelectorAll(".lang-switcher__btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-lang") === currentLang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  /**
   * Update page meta title and description if keys exist.
   */
  function updatePageMeta() {
    const page = document.body.dataset.page;

    if (!page) return;

    const title = getNestedValue(translations, `pages.${page}.title`);
    const description = getNestedValue(translations, `pages.${page}.description`);

    if (title) {
      document.title = title;
    }

    const metaDescription = document.querySelector('meta[name="description"]');

    if (metaDescription && description) {
      metaDescription.setAttribute("content", description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    if (ogTitle && title) ogTitle.setAttribute("content", title);
    if (ogDescription && description) ogDescription.setAttribute("content", description);
    if (twitterTitle && title) twitterTitle.setAttribute("content", title);
    if (twitterDescription && description) twitterDescription.setAttribute("content", description);
  }

  /**
   * Set the active language and persist to localStorage.
   * @param {string} lang
   */
  async function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) {
      return;
    }

    try {
      translations = await loadTranslations(lang);
      currentLang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
      applyTranslations();
      updateLangButtons();
      updatePageMeta();
    } catch (error) {
      console.error("[LanguageManager]", error);
    }
  }

  /**
   * Initialize language from localStorage or default.
   */
  async function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    currentLang = SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;

    try {
      translations = await loadTranslations(currentLang);
      applyTranslations();
      updateLangButtons();
      updatePageMeta();
    } catch (error) {
      console.error("[LanguageManager]", error);

      if (currentLang !== DEFAULT_LANG) {
        currentLang = DEFAULT_LANG;
        translations = await loadTranslations(DEFAULT_LANG);
        applyTranslations();
        updateLangButtons();
        updatePageMeta();
      }
    }

    document.addEventListener("click", (event) => {
      const btn = event.target.closest(".lang-switcher__btn");

      if (btn) {
        setLanguage(btn.getAttribute("data-lang"));
      }
    });
  }

  return {
    init,
    setLanguage,
    getCurrentLang: () => currentLang,
    t: (key) => getNestedValue(translations, key) ?? key,
  };
})();

export default LanguageManager;
