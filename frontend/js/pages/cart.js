// Trang Giỏ hàng: hiển thị món đã chọn, tăng/giảm số lượng, xoá món, mã ưu đãi và tổng tiền.
// Dữ liệu lấy từ SavorisCart (js/cart-store.js), lưu ở localStorage.

(function () {
  const cart = window.SavorisCart;
  const root = document.body.dataset.root || "../";
  const money = cart.money;

  const listEl = document.getElementById("cart-list");
  const metaEl = document.getElementById("cart-meta");
  const contentEl = document.getElementById("cart-content");
  const summaryEl = document.getElementById("cart-summary");
  const voucherBox = document.getElementById("voucher-box");
  const voucherInput = document.getElementById("voucher-input");
  const voucherApply = document.getElementById("voucher-apply");
  const voucherMsg = document.getElementById("voucher-msg");
  const voucherHint = document.getElementById("voucher-hint");

  const sumSubtotal = document.getElementById("sum-subtotal");
  const sumShipping = document.getElementById("sum-shipping");
  const sumDiscount = document.getElementById("sum-discount");
  const sumDiscountRow = document.getElementById("sum-discount-row");
  const sumDiscountLabel = document.getElementById("sum-discount-label");
  const sumTotal = document.getElementById("sum-total");

  let items = cart.items();

  // ---------- Hiển thị ----------
  function itemHtml(item) {
    return `
      <article class="sv-item" data-id="${escapeHtml(item.id)}">
        <img class="sv-item__img" src="${root}${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"
          width="100" height="100" loading="lazy">
        <div class="sv-item__body">
          <h2 class="sv-item__name">${escapeHtml(item.name)}</h2>
          <p class="sv-item__note">${escapeHtml(item.note)}</p>
          <p class="sv-item__price">${money(item.price)}</p>
          <div class="sv-item__controls">
            <div class="sv-qty" role="group" aria-label="Số lượng ${escapeHtml(item.name)}">
              <button type="button" data-action="dec" aria-label="Giảm số lượng ${escapeHtml(item.name)}"
                ${item.qty <= 1 ? "disabled" : ""}>
                <svg width="12" height="2" viewBox="0 0 12 2" aria-hidden="true"><path d="M0 1h12" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <span class="sv-qty__value" data-qty aria-live="polite">${item.qty}</span>
              <button type="button" data-action="inc" aria-label="Tăng số lượng ${escapeHtml(item.name)}"
                ${item.qty >= 20 ? "disabled" : ""}>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0v12M0 6h12" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="sv-item__side">
          <span class="sv-item__lTotal" data-line-total ${item.qty > 1 ? "" : "hidden"}>${money(item.price * item.qty)}</span>
          <button class="sv-link-danger" type="button" data-action="remove">Xoá</button>
        </div>
      </article>`;
  }

  function renderMeta() {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    metaEl.textContent = count > 0 ? `${count} món · Savoris Kitchen` : "Giỏ hàng đang trống";
  }

  function renderItems() {
    if (items.length === 0) {
      contentEl.hidden = false;
      listEl.innerHTML = `
        <div class="sv-empty">
          <div class="sv-empty__icon">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L17 7H6"/>
              <circle cx="8" cy="16.5" r="1.2"/><circle cx="14" cy="16.5" r="1.2"/>
            </svg>
          </div>
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy chọn vài món đặc trưng của Savoris Kitchen để bắt đầu bữa ăn nhé.</p>
          <a class="sv-btn sv-btn--gold" href="menu.html" style="max-width:260px;margin:0 auto">Khám phá thực đơn</a>
        </div>`;
      // Khi trống: ẩn cột tóm tắt nhưng vẫn hiển thị khối trống rộng rãi
      document.querySelector(".sv-split").style.gridTemplateColumns = "1fr";
      summaryEl.parentElement.hidden = true;
      voucherBox.hidden = true;
      document.querySelector(".sv-back").hidden = true;
      return;
    }

    document.querySelector(".sv-split").style.gridTemplateColumns = "";
    summaryEl.parentElement.hidden = false;
    voucherBox.hidden = false;
    document.querySelector(".sv-back").hidden = false;
    contentEl.hidden = false;

    listEl.innerHTML = items.map(itemHtml).join("");
  }

  function renderTotals() {
    const subtotal = cart.subtotal(items);
    const discount = cart.discount(subtotal);
    const shipping = subtotal > 0 ? cart.shippingFee : 0;

    sumSubtotal.textContent = money(subtotal);
    sumShipping.textContent = money(shipping);
    sumTotal.textContent = money(cart.total(subtotal));

    if (discount > 0) {
      sumDiscountRow.hidden = false;
      sumDiscountLabel.textContent = `Ưu đãi ${cart.voucher().code}`;
      sumDiscount.textContent = "−" + money(discount);
    } else {
      sumDiscountRow.hidden = true;
    }
  }

  function renderVoucher() {
    const voucher = cart.voucher();
    if (voucher) {
      voucherMsg.hidden = false;
      voucherMsg.className = "sv-voucher__msg";
      voucherMsg.innerHTML = `✓ Đã áp dụng ${escapeHtml(voucher.label)}
        <button class="sv-link-danger" type="button" data-action="remove-voucher">Bỏ áp dụng</button>`;
      voucherHint.hidden = true;
      voucherInput.value = voucher.code;
    } else {
      voucherMsg.hidden = true;
      voucherMsg.innerHTML = "";
      voucherHint.hidden = false;
    }
  }

  function refresh({ itemsChanged = false } = {}) {
    if (itemsChanged) {
      items = cart.items();
      renderItems();
    }
    renderTotals();
    renderVoucher();
    renderMeta();
    window.SavorisLayout.syncCartCount();
  }

  // Cập nhật 1 dòng tại chỗ (giữ nguyên focus của nút bấm)
  function syncRow(id) {
    const item = items.find((i) => i.id === id);
    const row = listEl.querySelector(`.sv-item[data-id="${id}"]`);
    if (!item || !row) return;

    row.querySelector("[data-qty]").textContent = item.qty;

    // Thành tiền chỉ hiện khi mua từ 2 phần trở lên (tránh trùng với đơn giá)
    const lineTotal = row.querySelector("[data-line-total]");
    lineTotal.textContent = money(item.price * item.qty);
    lineTotal.hidden = item.qty <= 1;

    const dec = row.querySelector('[data-action="dec"]');
    const inc = row.querySelector('[data-action="inc"]');
    dec.disabled = item.qty <= 1;
    inc.disabled = item.qty >= 20;
  }

  // ---------- Sự kiện ----------
  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const row = button.closest(".sv-item");
    const id = row.dataset.id;
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (button.dataset.action === "inc") {
      cart.setQty(id, item.qty + 1);
      item.qty += 1;
      syncRow(id);
      refresh();
    }

    if (button.dataset.action === "dec") {
      cart.setQty(id, item.qty - 1);
      item.qty -= 1;
      syncRow(id);
      refresh();
    }

    if (button.dataset.action === "remove") {
      cart.remove(id);
      showToast(`Đã xoá "${item.name}" khỏi giỏ`);
      refresh({ itemsChanged: true });
    }
  });

  function applyVoucher() {
    const result = cart.applyVoucher(voucherInput.value, cart.subtotal(items));
    if (result.ok) {
      showToast(result.message);
      refresh();
      voucherInput.blur();
    } else {
      voucherMsg.hidden = false;
      voucherMsg.className = "sv-voucher__msg is-error";
      voucherMsg.textContent = "✕ " + result.message;
      voucherHint.hidden = false;
      voucherInput.classList.add("is-invalid");
      voucherInput.focus();
    }
  }

  voucherApply.addEventListener("click", applyVoucher);

  voucherInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyVoucher();
    }
  });

  voucherInput.addEventListener("input", () => {
    voucherInput.classList.remove("is-invalid");
    if (voucherMsg.classList.contains("is-error")) {
      voucherMsg.hidden = true;
      voucherMsg.className = "sv-voucher__msg";
    }
  });

  voucherMsg.addEventListener("click", (event) => {
    if (!event.target.closest('[data-action="remove-voucher"]')) return;
    cart.setVoucher(null);
    voucherInput.value = "";
    refresh();
    showToast("Đã bỏ mã ưu đãi");
  });

  // ---------- Khởi động ----------
  // Giỏ trống nghĩa là đã xong đơn trước đó: bỏ màn hình "Đặt hàng thành công" còn lưu tạm
  if (items.length === 0) cart.clearLastOrder();

  renderItems();
  refresh();
})();
