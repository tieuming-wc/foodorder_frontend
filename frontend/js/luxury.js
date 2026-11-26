// SAVORIS — Quiet Luxury Micro-interactions, Scroll Choreography, Custom Cursor & Mobile Nav
(function () {
  "use strict";

  // 1. Scroll Reveal Choreography
  function setupReveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // 2. Subtle Parallax for Editorial Images
  function setupParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = document.querySelectorAll("[data-parallax]");
    if (!els.length) return;

    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh;
        const offset = Math.max(-22, Math.min(22, progress * 28));
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.04)`;
      });
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  // 3. Custom Luxury Cursor (desktop fine pointer only)
  function setupCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cursor = document.createElement("div");
    cursor.className = "lux-cursor";
    document.body.appendChild(cursor);

    let mx = -100, my = -100;
    let cx = -100, cy = -100;
    let rafId = null;

    function tick() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(mx - cx) > 0.2 || Math.abs(my - cy) > 0.2) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    document.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.classList.add("is-visible");
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    document.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-visible");
    });

    document.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".dish-card, .menu-card, .hero-visual");
      if (card) {
        cursor.classList.add("is-label");
        cursor.textContent = card.classList.contains("hero-visual") ? "Khám phá" : "Chi tiết";
      } else {
        cursor.classList.remove("is-label");
        cursor.textContent = "";
      }
    });
  }

  // 4. Mobile Floating Bottom Navigation Bar
  function setupMobileNav() {
    if (document.getElementById("luxMobileNav")) return;

    const inPages = window.location.pathname.includes("/pages/");
    const prefix = inPages ? "../" : "./";
    const pagesPrefix = inPages ? "./" : "./pages/";

    function getCartCount() {
      try {
        const cart = JSON.parse(localStorage.getItem("savoris-cart") || "[]");
        if (!Array.isArray(cart)) return 0;
        return cart.reduce((sum, it) => sum + Number(it?.quantity || 0), 0);
      } catch {
        return 0;
      }
    }

    function currentKey() {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes("account.html")) return "account";
      if (path.includes("sommelier.html")) return "sommelier";
      if (path.includes("items.html")) {
        const cartPage = document.getElementById("cartPage");
        if ((cartPage && !cartPage.hidden) || hash === "#cartPage") return "cart";
        return "menu";
      }
      return "home";
    }

    const nav = document.createElement("nav");
    nav.id = "luxMobileNav";
    nav.className = "lux-mobile-nav";
    nav.setAttribute("aria-label", "Điều hướng nhanh");

    const icons = {
      home: '<path d="M3 9.5 10 3l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V9.5Z"/>',
      menu: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>',
      sommelier: '<circle cx="10" cy="10" r="7"/><path d="M10 3v7l4.5 2.5"/>',
      cart: '<path d="M3 4h2l2 10h9l2-7H6.5"/><circle cx="8.5" cy="17" r="1"/><circle cx="15.5" cy="17" r="1"/>',
      account: '<circle cx="10" cy="6.5" r="3"/><path d="M4 17c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5"/>',
    };

    const items = [
      { key: "home", label: "Trang chủ", href: `${prefix}index.html`, icon: icons.home },
      { key: "menu", label: "Thực đơn", href: `${pagesPrefix}items.html`, icon: icons.menu },
      { key: "sommelier", label: "Tư vấn", href: `${pagesPrefix}sommelier.html`, icon: icons.sommelier },
      { key: "cart", label: "Giỏ hàng", href: `${pagesPrefix}items.html#cartPage`, icon: icons.cart, badge: true },
      { key: "account", label: "Tài khoản", href: `${pagesPrefix}account.html`, icon: icons.account },
    ];

    function render() {
      const active = currentKey();
      const count = getCartCount();
      nav.innerHTML = items
        .map(
          (it) => `
        <a href="${it.href}" class="lux-mobile-nav__item ${it.key === active ? "is-active" : ""}" data-lux-nav="${it.key}">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${it.icon}</svg>
          <span>${it.label}</span>
          ${it.badge && count > 0 ? `<span class="lux-mobile-nav__badge">${count}</span>` : ""}
        </a>`
        )
        .join("");
    }

    render();
    document.body.appendChild(nav);

    // Keep active state & cart badge synced when SPA sections switch on items.html
    window.addEventListener("hashchange", render);
    window.addEventListener("storage", render);
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-lux-nav]");
      if (link && inPages && window.location.pathname.includes("items.html")) {
        const target = link.dataset.luxNav;
        if (target === "cart") {
          e.preventDefault();
          document.querySelector('[data-page="cart"]')?.click();
          setTimeout(render, 60);
        } else if (target === "menu") {
          e.preventDefault();
          document.querySelector('[data-page="menu"]')?.click();
          setTimeout(render, 60);
        }
      } else {
        setTimeout(render, 120);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupReveal();
      setupParallax();
      setupCursor();
      setupMobileNav();
    });
  } else {
    setupReveal();
    setupParallax();
    setupCursor();
    setupMobileNav();
  }
})();
