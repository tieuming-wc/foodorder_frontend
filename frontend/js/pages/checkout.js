// Trang Thanh toán: kiểm tra thông tin người nhận, địa chỉ, phương thức thanh toán
// rồi "Chốt đơn". Nút Chốt đơn chỉ bấm được khi đã nhập đủ Tên, Số điện thoại, Địa chỉ.

(function () {
  const cart = window.SavorisCart;
  const money = cart.money;
  const root = document.body.dataset.root || "../";

  const form = document.getElementById("checkout-form");
  const grid = document.getElementById("checkout-grid");
  const successBox = document.getElementById("order-success");
  const successDetail = document.getElementById("success-detail");
  const miniList = document.getElementById("mini-list");
  const orderButton = document.getElementById("btn-order");
  const orderHint = document.getElementById("order-hint");

  const sumSubtotal = document.getElementById("sum-subtotal");
  const sumShipping = document.getElementById("sum-shipping");
  const sumDiscount = document.getElementById("sum-discount");
  const sumDiscountRow = document.getElementById("sum-discount-row");
  const sumDiscountLabel = document.getElementById("sum-discount-label");
  const sumTotal = document.getElementById("sum-total");

  const PAYMENT_LABELS = {
    cod: "Tiền mặt khi nhận hàng",
    bank: "Chuyển khoản ngân hàng",
    momo: "Ví điện tử MoMo",
  };

  let items = cart.items();

  // ---------- Tóm tắt đơn ----------
  function renderSummary() {
    miniList.innerHTML = items.map((item) => `
      <div class="sv-mini">
        <img src="${root}${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="52" height="52" loading="lazy">
        <div>
          <p class="sv-mini__name">${escapeHtml(item.name)}</p>
          <p class="sv-mini__meta">${item.qty} × ${money(item.price)}</p>
        </div>
        <span class="sv-mini__price">${money(item.price * item.qty)}</span>
      </div>`).join("");

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

    return { subtotal, discount, shipping, total: cart.total(subtotal) };
  }

  // ---------- Kiểm tra dữ liệu ----------
  const RULES = {
    "full-name": {
      message: "Vui lòng nhập họ tên người nhận (ít nhất 2 ký tự).",
      test: (value) => value.trim().length >= 2,
    },
    phone: {
      message: "Số điện thoại không hợp lệ. VD: 0912345678.",
      test: (value) => /^(?:0\d{9}|\+84\d{9})$/.test(value.replace(/[\s.\-()]/g, "")),
    },
    email: {
      message: "Email không hợp lệ.",
      test: (value) => value.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
    },
    province: {
      message: "Vui lòng chọn tỉnh / thành phố.",
      test: (value) => value !== "",
    },
    district: {
      message: "Vui lòng nhập quận / huyện.",
      test: (value) => value.trim().length >= 2,
    },
    address: {
      message: "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).",
      test: (value) => value.trim().length >= 5,
    },
  };

  const touched = new Set();

  function fieldState(id) {
    const input = document.getElementById(id);
    return RULES[id].test(input.value);
  }

  function showError(id, show) {
    const input = document.getElementById(id);
    const error = document.getElementById("err-" + id);
    const valid = fieldState(id);
    const visible = show && !valid;

    input.classList.toggle("is-invalid", visible);
    input.setAttribute("aria-invalid", visible ? "true" : "false");
    error.textContent = visible ? RULES[id].message : "";
    error.classList.toggle("is-visible", visible);
    return valid;
  }

  function refreshButton() {
    const valid = Object.keys(RULES).every(fieldState) && items.length > 0;
    orderButton.disabled = !valid;
    orderButton.textContent = "Chốt đơn";

    if (items.length === 0) {
      orderHint.textContent = "Giỏ hàng đang trống — hãy chọn món trước khi thanh toán.";
    } else if (valid) {
      orderHint.textContent = "Kiểm tra lại thông tin rồi bấm Chốt đơn nhé.";
    } else {
      orderHint.textContent = "Nhập đủ Họ tên, Số điện thoại và Địa chỉ để chốt đơn.";
    }
    return valid;
  }

  Object.keys(RULES).forEach((id) => {
    const input = document.getElementById(id);

    input.addEventListener("blur", () => {
      touched.add(id);
      showError(id, true);
    });

    input.addEventListener("input", () => {
      if (touched.has(id)) showError(id, true);
      refreshButton();
    });

    input.addEventListener("change", () => {
      if (touched.has(id)) showError(id, true);
      refreshButton();
    });
  });

  // Chọn phương thức thanh toán
  form.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      form.querySelectorAll(".sv-pay").forEach((label) => {
        label.classList.toggle("is-selected", label.querySelector("input").checked);
      });
    });
  });

  // ---------- Chốt đơn ----------
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    Object.keys(RULES).forEach((id) => {
      touched.add(id);
      showError(id, true);
    });

    if (!refreshButton()) {
      const firstInvalid = Object.keys(RULES).find((id) => !fieldState(id));
      if (firstInvalid) document.getElementById(firstInvalid).focus();
      showToast("Vui lòng điền đủ thông tin bắt buộc.", "error");
      return;
    }

    const totals = renderSummary();
    const order = {
      code: "SV" + String(Date.now()).slice(-8),
      createdAt: new Date().toISOString(),
      fullName: form.full_name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      province: form.province.value,
      district: form.district.value.trim(),
      address: form.address.value.trim(),
      note: form.note.value.trim(),
      payment: form.payment.value,
      paymentLabel: PAYMENT_LABELS[form.payment.value],
      items: items.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
      ...totals,
    };

    cart.saveOrder(order);
    cart.clear();
    window.SavorisLayout.syncCartCount();
    showOrderSuccess(order);
  });

  function showOrderSuccess(order) {
    grid.hidden = true;
    successBox.hidden = false;

    successDetail.innerHTML = `
      <div class="sv-summary__row">
        <span>Mã đơn hàng</span>
        <span style="color:var(--sv-gold);font-weight:600">${escapeHtml(order.code)}</span>
      </div>
      <div class="sv-summary__row">
        <span>Người nhận</span>
        <span>${escapeHtml(order.fullName)} · ${escapeHtml(order.phone)}</span>
      </div>
      <div class="sv-summary__row">
        <span>Giao tới</span>
        <span style="text-align:right;max-width:60%">${escapeHtml(order.address)}, ${escapeHtml(order.district)}, ${escapeHtml(order.province)}</span>
      </div>
      <div class="sv-summary__row">
        <span>Thanh toán</span>
        <span>${escapeHtml(order.paymentLabel)}</span>
      </div>
      <div class="sv-summary__row">
        <span>Tổng thanh toán</span>
        <span style="color:var(--sv-gold);font-weight:600">${money(order.total)}</span>
      </div>`;

    document.querySelector(".sv-page-head").innerHTML = `
      <nav class="sv-breadcrumb" aria-label="Bạn đang ở">
        <a href="cart.html">Giỏ hàng</a>
        <span aria-hidden="true">/</span>
        <span>Hoàn tất</span>
      </nav>
      <h1 class="sv-display">Cảm ơn bạn, ${escapeHtml(order.fullName.split(" ").slice(-1)[0])}!</h1>
      <p class="sv-page-head__meta">Đơn ${escapeHtml(order.code)} đã được ghi nhận.</p>`;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Khởi động ----------
  const lastOrder = cart.lastOrder();

  if (lastOrder && items.length === 0) {
    // Vừa chốt đơn xong (hoặc tải lại trang): giữ màn hình thành công
    showOrderSuccess(lastOrder);
    return;
  }
  if (lastOrder) cart.clearLastOrder(); // đã có giỏ mới thì bỏ đơn cũ

  if (items.length === 0) {
    grid.hidden = true;
    document.querySelector(".sv-page-head__meta").textContent = "Giỏ hàng đang trống.";
    successBox.hidden = false;
    successBox.innerHTML = `
      <div class="sv-empty__icon">
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L17 7H6"/>
          <circle cx="8" cy="16.5" r="1.2"/><circle cx="14" cy="16.5" r="1.2"/>
        </svg>
      </div>
      <h2>Chưa có món nào để thanh toán</h2>
      <p>Giỏ hàng của bạn đang trống. Hãy chọn món trước khi tiến hành đặt hàng.</p>
      <div class="sv-success__actions"><a class="sv-btn sv-btn--gold" href="menu.html">Khám phá thực đơn</a></div>`;
    return;
  }

  renderSummary();
  refreshButton();
})();
