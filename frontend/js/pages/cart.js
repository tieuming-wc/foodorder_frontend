// Trang Giỏ hàng: đọc giỏ trong localStorage (js/cart.js), hiện từng dòng và tổng tiền.
// Toàn bộ xử lý nằm ở trình duyệt, không gọi API.

const cartBody = document.getElementById("cart-body");
const cartEmpty = document.getElementById("cart-empty");
const cartFilled = document.getElementById("cart-filled");
const cartSubtitle = document.getElementById("cart-subtitle");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("btn-checkout");

const PLACEHOLDER_IMAGE = "../assets/images/mon-placeholder.svg";

// Chỉ nhận ảnh http(s) hoặc đường dẫn tương đối; còn lại dùng ảnh mặc định
function cartImage(image) {
  if (!image) return PLACEHOLDER_IMAGE;
  const value = String(image).trim();
  return /^(https?:\/\/|\/|\.\.?\/)/i.test(value) ? value : PLACEHOLDER_IMAGE;
}

function renderCart() {
  const lines = cartStore.all();
  const isEmpty = lines.length === 0;

  cartEmpty.hidden = !isEmpty;
  cartFilled.hidden = isEmpty;
  cartSubtitle.textContent = isEmpty ? "" : `${cartStore.count()} món trong giỏ`;

  if (isEmpty) {
    cartBody.innerHTML = "";
    cartTotal.textContent = formatMoney(0);
    cartCount.textContent = 0;
    return;
  }

  cartBody.innerHTML = lines.map((line) => `
    <article class="cart-line">
      <img class="cart-thumb" src="${escapeHtml(cartImage(line.image))}" alt="${escapeHtml(line.name)}">
      <div class="cart-line-info">
        <h3 class="cart-line-name">${escapeHtml(line.name)}</h3>
        <div class="cart-line-price">${formatMoney(line.price)} <span>/ món</span></div>
      </div>
      <div class="qty">
        <button type="button" class="qty-btn" data-action="decrease" data-id="${line.id}"
          aria-label="Giảm số lượng" ${line.quantity <= 1 ? "disabled" : ""}>−</button>
        <span class="qty-value">${line.quantity}</span>
        <button type="button" class="qty-btn" data-action="increase" data-id="${line.id}"
          aria-label="Tăng số lượng">+</button>
      </div>
      <div class="cart-line-total">${formatMoney(line.price * line.quantity)}</div>
      <button type="button" class="icon-btn" data-action="remove" data-id="${line.id}"
        aria-label="Xoá ${escapeHtml(line.name)}" title="Xoá món">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6"></path>
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path>
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </article>`).join("");

  cartTotal.textContent = formatMoney(cartStore.total());
  cartCount.textContent = cartStore.count();
}

// Bắt sự kiện cho các nút trong danh sách (event delegation)
cartBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const line = cartStore.find(cartStore.all(), id);
  if (!line) return;

  if (action === "increase") {
    cartStore.setQuantity(id, line.quantity + 1);
    renderCart();
  }

  if (action === "decrease") {
    if (line.quantity <= 1) return;
    cartStore.setQuantity(id, line.quantity - 1);
    renderCart();
  }

  if (action === "remove") {
    if (!confirm(`Xoá "${line.name}" khỏi giỏ hàng?`)) return;
    cartStore.remove(id);
    renderCart();
    showToast(`Đã xoá "${line.name}" khỏi giỏ`);
  }
});

// Đặt hàng: base code chưa có API đơn hàng, nối api.post("/orders", ...) tại đây.
checkoutButton.addEventListener("click", () => {
  const lines = cartStore.all();
  if (lines.length === 0) return;

  const summary = lines.map((line) => `${line.name} ×${line.quantity}`).join(", ");
  console.log("Đơn hàng:", { items: lines, total: cartStore.total() });
  showToast(`Đã ghi nhận đơn: ${summary} · ${formatMoney(cartStore.total())}`);
});

renderCart();
