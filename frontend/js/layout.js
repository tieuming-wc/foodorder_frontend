// Layout chung: tự chèn header (menu) và footer vào mọi trang,
// để không phải copy lại HTML menu ở từng file.
//
// Mỗi trang cần có:  <body data-root="./">   (trang ở thư mục gốc)
//              hoặc  <body data-root="../">  (trang trong thư mục pages/)
// và hai thẻ rỗng:   <header id="app-header"></header> ... <footer id="app-footer"></footer>
//
// Số món trong giỏ hiện trên menu: header nghe sự kiện "cart:changed" do
// js/cart.js phát ra, nên thêm / sửa số lượng / xoá món ở đâu cũng tự cập nhật.

// Thêm trang mới vào menu: thêm 1 dòng vào mảng này (đường dẫn tính từ thư mục frontend/)
const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/items.html", label: "Items (CRUD mẫu)" },
  { href: "pages/cart.html", label: "Giỏ hàng", showCartCount: true },
];

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;

  const links = MENU.map((item) => {
    const isActive = currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && currentPath.endsWith("/"));
    const badge = item.showCartCount
      ? ` <span class="cart-badge" id="cart-badge" hidden>0</span>`
      : "";
    return `<a href="${root}${item.href}" class="${isActive ? "active" : ""}">${item.label}${badge}</a>`;
  }).join("");

  // Khu vực đăng nhập: chưa đăng nhập -> link sang trang đăng nhập
  const user = typeof authStore !== "undefined" && authStore.isLoggedIn()
    ? authStore.currentUser()
    : null;
  const authLinks = user
    ? `<span class="nav-user" title="Đang đăng nhập">${escapeHtml(authStore.displayName())}</span>
       <button type="button" id="btn-logout" class="nav-logout">Đăng xuất</button>`
    : `<a href="${root}pages/login.html">Đăng nhập</a>`;

  document.getElementById("app-header").innerHTML = `
    <div class="container header-inner">
      <a href="${root}index.html" class="brand">
        <img src="${root}assets/images/logo.svg" alt="logo" width="28" height="28">
        <span>${CONFIG.APP_NAME}</span>
      </a>
      <nav class="nav">${links}${authLinks}</nav>
    </div>`;

  document.getElementById("app-footer").innerHTML = `
    <div class="container">© ${new Date().getFullYear()} HN-KS25-CNTT1 · Base code thực tập doanh nghiệp</div>`;

  const logoutButton = document.getElementById("btn-logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      authStore.logout();
      window.location.href = `${root}index.html`;
    });
  }

  updateCartBadge();
}

// Vẽ lại số món trên menu. Trang nào không nạp js/cart.js thì bỏ qua.
function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge || typeof cartStore === "undefined") return;
  const count = cartStore.count();
  badge.textContent = count;
  badge.hidden = count === 0;
}

// Giỏ thay đổi (thêm / sửa số lượng / xoá) -> cập nhật lại số trên menu
// (trang nào không nạp js/cart.js thì không có gì để nghe)
if (typeof CART_CHANGED_EVENT !== "undefined") {
  window.addEventListener(CART_CHANGED_EVENT, updateCartBadge);

  // Mở nhiều tab: tab khác sửa giỏ -> tab này cũng cập nhật số món
  window.addEventListener("storage", (event) => {
    if (event.key === CART_STORAGE_KEY) updateCartBadge();
  });
}

renderLayout();
