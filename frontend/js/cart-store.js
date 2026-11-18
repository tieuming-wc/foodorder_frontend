// Kho dữ liệu giỏ hàng dùng chung cho trang Thực đơn, Giỏ hàng và Thanh toán.
// Giỏ được lưu ở localStorage nên tải lại trang / mở trang khác vẫn còn món.
// Khi backend có API giỏ hàng & đơn hàng, chỉ cần thay phần đọc/ghi localStorage bằng api.get/api.post.

const CART_KEY = "savoris_cart_v1";
const VOUCHER_KEY = "savoris_voucher_v1";
const ORDER_KEY = "savoris_last_order_v1";

const SHIPPING_FEE = 30000; // phí giao hàng cố định
const MAX_QTY = 20; // tối đa mỗi món trong một đơn
const FALLBACK_IMAGE = "assets/images/dishes/dish.svg";

// Mã giảm giá đang hỗ trợ
const VOUCHERS = {
  SAVORIS10: { code: "SAVORIS10", type: "percent", value: 0.1, max: 200000, label: "giảm 10% · tối đa 200.000đ" },
};

// 1250000 -> "1.250.000đ"
function svMoney(value) {
  return Number(value).toLocaleString("vi-VN") + "đ";
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch (error) {
    return null;
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const SavorisCart = {
  money: svMoney,
  shippingFee: SHIPPING_FEE,
  maxQty: MAX_QTY,

  items() {
    return readCart() || [];
  },

  count() {
    return this.items().reduce((sum, item) => sum + item.qty, 0);
  },

  // Thêm 1 món từ trang Thực đơn. Món đã có thì tăng số lượng.
  // dish: { id, name, price, note?, image? }
  add(dish) {
    const items = this.items();
    const id = String(dish.id || dish.name);
    const existing = items.find((item) => item.id === id);

    if (existing) {
      if (existing.qty >= MAX_QTY) {
        return { ok: false, message: `Mỗi món chỉ đặt tối đa ${MAX_QTY} phần.` };
      }
      existing.qty += 1;
      writeCart(items);
      return { ok: true, qty: existing.qty, name: existing.name };
    }

    items.push({
      id,
      name: dish.name,
      note: dish.note || "",
      price: Number(dish.price) || 0,
      image: dish.image || FALLBACK_IMAGE,
      qty: 1,
    });
    writeCart(items);
    return { ok: true, qty: 1, name: dish.name };
  },

  qtyOf(id) {
    const found = this.items().find((item) => item.id === id);
    return found ? found.qty : 0;
  },

  setQty(id, qty) {
    const items = this.items()
      .map((item) => (item.id === id ? { ...item, qty: Math.min(MAX_QTY, Math.max(1, Number(qty) || 1)) } : item));
    writeCart(items);
    return items;
  },

  remove(id) {
    const items = this.items().filter((item) => item.id !== id);
    writeCart(items);
    return items;
  },

  clear() {
    writeCart([]);
    this.setVoucher(null);
  },

  // ----- Tiền -----
  subtotal(items = this.items()) {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  voucher() {
    const code = localStorage.getItem(VOUCHER_KEY);
    return code && VOUCHERS[code] ? VOUCHERS[code] : null;
  },

  // Áp mã: trả về { ok, message } để trang hiển thị
  applyVoucher(input, subtotal = this.subtotal()) {
    const code = String(input || "").trim().toUpperCase();
    if (!code) return { ok: false, message: "Vui lòng nhập mã ưu đãi." };

    const voucher = VOUCHERS[code];
    if (!voucher) return { ok: false, message: `Mã "${code}" không tồn tại hoặc đã hết hạn.` };
    if (subtotal <= 0) return { ok: false, message: "Giỏ hàng đang trống." };

    localStorage.setItem(VOUCHER_KEY, code);
    return { ok: true, message: `Đã áp dụng ${voucher.label}.` };
  },

  setVoucher(code) {
    if (code) localStorage.setItem(VOUCHER_KEY, code);
    else localStorage.removeItem(VOUCHER_KEY);
  },

  discount(subtotal = this.subtotal()) {
    const voucher = this.voucher();
    if (!voucher || subtotal <= 0) return 0;
    const raw = voucher.type === "percent" ? subtotal * voucher.value : voucher.value;
    return Math.min(Math.round(raw), voucher.max, subtotal);
  },

  total(subtotal = this.subtotal()) {
    if (subtotal <= 0) return 0;
    return subtotal + SHIPPING_FEE - this.discount(subtotal);
  },

  // ----- Đơn hàng vừa đặt (hiển thị ở trang Thanh toán) -----
  saveOrder(order) {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  },

  lastOrder() {
    try {
      const raw = sessionStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  },

  clearLastOrder() {
    sessionStorage.removeItem(ORDER_KEY);
  },
};

window.SavorisCart = SavorisCart;
