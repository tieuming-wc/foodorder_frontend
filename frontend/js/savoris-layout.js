// Header / footer / bottom-nav của theme Savoris (trang Giỏ hàng & Thanh toán).
// Mỗi trang cần: <body data-root="../"> và <header id="sv-header"></header> ... <footer id="sv-footer"></footer>

(function () {
  const root = document.body.dataset.root || "../";
  const cart = window.SavorisCart;
  const current = window.location.pathname;

  const NAV = [
    { href: "index.html", label: "Khám phá", file: "/index.html" },
    { href: "menu.html", label: "Món ăn", file: "/pages/menu.html" },
    { href: "cart.html", label: "Giỏ hàng", file: "/pages/cart.html" },
    { href: "checkout.html", label: "Thanh toán", file: "/pages/checkout.html" },
  ];

  const BOTTOM_NAV = [
    {
      file: "/index.html",
      label: "Trang chủ",
      match: "/index.html",
      icon: '<path d="M3 9.5 10 3l7 6.5V16a1 1 0 0 1-1 1h-4v-4H8v4H4a1 1 0 0 1-1-1V9.5Z"/>',
    },
    {
      file: "/pages/menu.html",
      label: "Món ăn",
      match: "/pages/menu.html",
      icon: '<path d="M7 2v7a2 2 0 0 0 4 0V2M9 9v9M15 2c-1.5 1.5-2 3-2 5s.5 3 2 3v8"/>',
    },
    {
      file: "/pages/cart.html",
      label: "Giỏ hàng",
      match: "/pages/cart.html",
      icon: '<path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L17 7H6"/><circle cx="8" cy="16.5" r="1.2"/><circle cx="14" cy="16.5" r="1.2"/>',
    },
    {
      file: "/pages/checkout.html",
      label: "Thanh toán",
      match: "/pages/checkout.html",
      icon: '<path d="M5 2.5h10v15l-2.5-1.6L10 17.5l-2.5-1.6L5 17.5v-15Z"/><path d="M7.5 7h5M7.5 10.5h5"/>',
    },
  ];

  function icon(path, size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const isActive = (suffix) => current.endsWith(suffix) || (suffix === "/index.html" && current.endsWith("/"));
  const pageHref = (file) => `${root}${file.replace(/^\//, "")}`;

  const cartHref = root + "pages/cart.html";

  function renderHeader() {
    const links = NAV.map((item) => {
      const active = isActive(item.file) ? " is-active" : "";
      const target = pageHref(item.file);
      return `<a href="${target}" class="${active.trim()}">${item.label}</a>`;
    }).join("");

    const header = document.getElementById("sv-header");
    header.className = "sv-header";
    header.innerHTML = `
      <div class="sv-container sv-header__inner">
        <button class="sv-burger" type="button" id="sv-burger" aria-label="Mở menu" aria-expanded="false"
          aria-controls="sv-mobile-menu">
          <span></span><span></span><span></span>
        </button>

        <a class="sv-brand" href="${root}index.html" aria-label="Savoris — về trang chủ">
          <svg class="sv-brand__mark" width="15" height="9" viewBox="0 0 15 9" fill="none" stroke="currentColor"
            stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M1 8 7.5 1 14 8"/></svg>
          <span class="sv-brand__name">Savoris</span>
        </a>

        <nav class="sv-nav" aria-label="Menu chính">${links}</nav>

        <div class="sv-header__actions">
          <a class="sv-cart-pill" href="${cartHref}">
            ${icon('<path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L17 7H6"/><circle cx="8" cy="16.5" r="1.2"/><circle cx="14" cy="16.5" r="1.2"/>', 18)}
            <span class="sv-cart-pill__label">Giỏ hàng (<b data-cart-count>0</b>)</span>
          </a>
          <button class="sv-user" type="button">
            <span>Minh Anh</span>
            <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="currentColor" stroke-width="1.3"
              stroke-linecap="round" aria-hidden="true"><path d="m1 1.5 4 4 4-4"/></svg>
          </button>
        </div>
      </div>

      <div class="sv-mobile-menu" id="sv-mobile-menu" hidden>
        ${NAV.map((item) => {
          const target = pageHref(item.file);
          return `<a href="${target}" class="${isActive(item.file) ? "is-active" : ""}">${item.label}</a>`;
        }).join("")}
      </div>`;

    const burger = document.getElementById("sv-burger");
    const menu = document.getElementById("sv-mobile-menu");
    burger.addEventListener("click", () => {
      const open = menu.hasAttribute("hidden");
      if (open) menu.removeAttribute("hidden");
      else menu.setAttribute("hidden", "");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });
  }

  function renderFooter() {
    document.getElementById("sv-footer").innerHTML = `
      <div class="sv-container sv-footer__inner">
        <span>© ${new Date().getFullYear()} Savoris Kitchen · 12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
        <span class="sv-footer__links">
          <a href="#">Điều khoản</a>
          <a href="#">Chính sách giao hàng</a>
          <a href="${root}index.html">Về trang chủ</a>
        </span>
      </div>`;
  }

  function renderBottomNav() {
    if (document.querySelector(".sv-bottom-nav")) return;
    const nav = document.createElement("nav");
    nav.className = "sv-bottom-nav";
    nav.setAttribute("aria-label", "Điều hướng nhanh");
    nav.innerHTML = `<div class="sv-bottom-nav__inner">${
      BOTTOM_NAV.map((item) => `
        <a href="${pageHref(item.file)}" class="${isActive(item.match) ? "is-active" : ""}">
          ${icon(item.icon)}
          <span>${item.label}</span>
        </a>`).join("")
    }</div>`;
    document.body.appendChild(nav);
  }

  function syncCartCount() {
    const count = cart ? cart.count() : 0;
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count;
    });
  }

  renderHeader();
  renderFooter();
  renderBottomNav();
  syncCartCount();

  window.SavorisLayout = { syncCartCount };
})();
