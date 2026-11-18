// Khung giao diện admin: sidebar (thu gọn / mở rộng) + navbar trên cùng.
// Mỗi trang admin khai báo <body class="ad-body" data-admin-page="dashboard">,
// HTML chỉ cần 2 thẻ rỗng: <aside id="ad-sidebar"></aside> và <header id="ad-topbar"></header>.
// Toàn bộ class đều có tiền tố "ad-" (xem css/admin.css) nên không đụng giao diện khách.

(function () {
  const COLLAPSE_KEY = "savoris_admin_sidebar"; // "collapsed" | "expanded"

  const TABS = [
    {
      page: "dashboard",
      href: "index.html",
      label: "Tổng quan",
      en: "Dashboard",
      icon: '<rect x="2.5" y="2.5" width="6" height="6" rx="1.4"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.4"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.4"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.4"/>',
    },
    {
      page: "users",
      href: "users.html",
      label: "Tài khoản",
      en: "Users",
      icon: '<circle cx="10" cy="6.5" r="3.2"/><path d="M3.5 17.5c.7-3.2 3.3-5 6.5-5s5.8 1.8 6.5 5"/>',
    },
    {
      page: "products",
      href: "products.html",
      label: "Danh mục & món",
      en: "Products",
      icon: '<path d="M6 3v6.5a2 2 0 0 0 4 0V3M8 9.5V17M14.5 3c-1.4 1.4-2 2.9-2 4.8s.6 3.2 2 3.2V17"/>',
    },
    {
      page: "orders",
      href: "orders.html",
      label: "Đơn hàng",
      en: "Orders",
      icon: '<path d="M5 3h10v14.5l-2.5-1.6L10 17.5l-2.5-1.6L5 17.5V3Z"/><path d="M7.5 7.5h5M7.5 11h5"/>',
    },
  ];

  const current = document.body.dataset.adminPage || "dashboard";
  const root = document.documentElement;
  const app = document.getElementById("ad-app");
  const store = window.SavorisAuth;

  function icon(path, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const currentTab = TABS.find((tab) => tab.page === current) || TABS[0];

  function initials(name) {
    const parts = String(name || "Admin").trim().split(/\s+/);
    return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
  }

  // ---------- Sidebar ----------
  function renderSidebar() {
    const mount = document.getElementById("ad-sidebar");
    if (!mount) return;

    mount.className = "ad-sidebar";
    mount.innerHTML = `
      <div class="ad-sidebar__brand">
        <a class="ad-brand" href="../index.html" title="Về trang khách">
          <svg class="ad-brand__mark" width="14" height="8" viewBox="0 0 15 9" fill="none" stroke="currentColor"
            stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M1 8 7.5 1 14 8"/></svg>
          <span class="ad-brand__name">Savoris</span>
        </a>
        <button class="ad-collapse" type="button" id="ad-collapse" aria-label="Thu gọn thanh điều hướng"
          aria-expanded="true" title="Thu gọn / mở rộng">
          ${icon('<path d="M11 4 6 10l5 6"/>', 16)}
        </button>
      </div>

      <p class="ad-sidebar__label">Quản trị nhà hàng</p>

      <nav class="ad-nav" aria-label="Chức năng quản trị">
        ${TABS.map((tab) => `
          <a href="${tab.href}" class="${tab.page === current ? "is-active" : ""}"
            data-tab="${tab.page}" title="${tab.label} · ${tab.en}"
            ${tab.page === current ? 'aria-current="page"' : ""}>
            ${icon(tab.icon)}
            <span class="ad-nav__text">${tab.label}</span>
          </a>`).join("")}
      </nav>

      <div class="ad-sidebar__foot">
        <strong>Admin · Toàn quyền</strong>
        <p>Bảo mật hai lớp đang bật</p>
        <div class="ad-sidebar__links">
          <a href="../index.html">Xem trang khách</a>
          <button type="button" data-logout>Đăng xuất</button>
        </div>
      </div>`;
  }

  // ---------- Navbar ----------
  function renderTopbar() {
    const mount = document.getElementById("ad-topbar");
    if (!mount) return;

    const user = store ? store.user() || {} : {};
    const name = user.full_name || user.name || user.email || "Quản trị viên";
    const roleLabel = store && store.isAdmin() ? "Quản trị viên" : String(user.role || "Admin");

    mount.className = "ad-topbar";
    mount.innerHTML = `
      <button class="ad-icon-btn ad-burger" type="button" id="ad-burger" aria-label="Mở menu quản trị"
        aria-expanded="false" aria-controls="ad-sidebar">
        ${icon('<path d="M3 5.5h14M3 10h14M3 14.5h14"/>', 18)}
      </button>

      <div class="ad-crumb">
        <a href="../index.html">Savoris</a>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"
          aria-hidden="true"><path d="M3.5 1.5 7 5l-3.5 3.5"/></svg>
        <span>Admin</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"
          aria-hidden="true"><path d="M3.5 1.5 7 5l-3.5 3.5"/></svg>
        <span>${currentTab.label}</span>
      </div>

      <div class="ad-topbar__user">
        <span class="ad-avatar" aria-hidden="true">${initials(name)}</span>
        <div class="ad-user__text">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(roleLabel)}</span>
        </div>
        <button class="ad-icon-btn" type="button" data-logout title="Đăng xuất" aria-label="Đăng xuất">
          ${icon('<path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8"/><path d="M12 6.5 15.5 10 12 13.5M7.5 10h8"/>', 18)}
        </button>
      </div>`;
  }

  // ---------- Điều hướng mobile ----------
  function renderBottomNav() {
    if (document.querySelector(".ad-bottom-nav")) return;
    const nav = document.createElement("nav");
    nav.className = "ad-bottom-nav";
    nav.setAttribute("aria-label", "Điều hướng quản trị");
    nav.innerHTML = TABS.map((tab) => `
      <a href="${tab.href}" class="${tab.page === current ? "is-active" : ""}">
        ${icon(tab.icon, 19)}
        <span>${tab.label}</span>
      </a>`).join("");
    document.body.appendChild(nav);

    const overlay = document.createElement("div");
    overlay.className = "ad-overlay";
    overlay.id = "ad-overlay";
    // Nằm trong .ad-app để CSS `.ad-app.is-open .ad-overlay` bật lớp phủ
    app.appendChild(overlay);
  }

  // ---------- Sự kiện ----------
  function setupToggle() {
    const collapseBtn = document.getElementById("ad-collapse");
    const burger = document.getElementById("ad-burger");
    const overlay = document.getElementById("ad-overlay");

    // Nhớ trạng thái thu gọn giữa các trang
    if (localStorage.getItem(COLLAPSE_KEY) === "collapsed") {
      app.classList.add("is-collapsed");
      collapseBtn.setAttribute("aria-expanded", "false");
    }

    collapseBtn.addEventListener("click", () => {
      const collapsed = app.classList.toggle("is-collapsed");
      collapseBtn.setAttribute("aria-expanded", String(!collapsed));
      collapseBtn.setAttribute("aria-label", collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng");
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "collapsed" : "expanded");
    });

    function setDrawer(open) {
      app.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    }

    burger.addEventListener("click", () => setDrawer(!app.classList.contains("is-open")));
    overlay.addEventListener("click", () => setDrawer(false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && app.classList.contains("is-open")) setDrawer(false);
    });

    // Bấm menu trên mobile thì đóng drawer
    document.querySelectorAll(".ad-nav a").forEach((link) => {
      link.addEventListener("click", () => setDrawer(false));
    });
  }

  function setupLogout() {
    // Gắn một lần ở document để navbar render lại vẫn bấm được nút Đăng xuất
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-logout]")) return;
      if (!confirm("Đăng xuất khỏi khu vực quản trị?")) return;
      store.logout("../pages/login.html?logout=1");
    });
  }

  renderSidebar();
  renderTopbar();
  renderBottomNav();
  setupToggle();
  setupLogout();

  // Việc bỏ ẩn trang do Admin Guard đảm nhận, sau khi đã xác thực xong
  // (kể cả bước gọi /auth/me), nên ở đây không tự hiện nội dung.
  // Xác thực xong thì vẽ lại navbar theo thông tin user thật từ backend.
  if (window.SavorisGuard && window.SavorisGuard.ready) {
    window.SavorisGuard.ready.then(renderTopbar).catch(() => {});
  }
})();
