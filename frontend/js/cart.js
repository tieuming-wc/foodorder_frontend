// Giỏ hàng dùng chung: lưu trong localStorage để trang món và trang giỏ hàng
// đọc/ghi cùng một chỗ. Không cần backend.
//
// Mỗi dòng trong giỏ có dạng:
//   { id: 1, name: "Cơm rang", image: "https://...", price: 45000, quantity: 2 }
//
// Trang nào muốn thêm món vào giỏ thì gọi hàm addToCart(...) ở cuối file này,
// không tự viết lại, để mọi trang cùng một cách xử lý (kiểm tra đăng nhập, toast).
//
// Số món trên header tự cập nhật: mỗi lần giỏ thay đổi, cartStore.save() phát
// sự kiện "cart:changed" và js/layout.js nghe để vẽ lại số trên menu.

const CART_STORAGE_KEY = "ks25_cart";
const CART_CHANGED_EVENT = "cart:changed";

const cartStore = {
  // Đọc giỏ từ localStorage. Dữ liệu hỏng hoặc sai định dạng -> coi như giỏ trống.
  all() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((line) => line && line.id !== undefined && line.name)
        .map((line) => ({
          id: line.id,
          name: String(line.name),
          image: line.image || null,
          price: Number(line.price) || 0,
          quantity: Math.max(1, Number(line.quantity) || 1),
        }));
    } catch (error) {
      return [];
    }
  },

  save(lines) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    // Báo cho header (và bất kỳ chỗ nào đang nghe) biết giỏ vừa thay đổi
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: lines }));
  },

  find(lines, id) {
    return lines.find((line) => String(line.id) === String(id));
  },

  // Tổng số món trong giỏ (cộng cả số lượng) - hiện trên menu header
  count() {
    return this.all().reduce((sum, line) => sum + line.quantity, 0);
  },

  // Tổng tiền cả giỏ
  total() {
    return this.all().reduce((sum, line) => sum + line.price * line.quantity, 0);
  },

  // Thêm 1 món; món đã có trong giỏ thì cộng thêm số lượng
  add(product, quantity = 1) {
    const lines = this.all();
    const existing = this.find(lines, product.id);
    if (existing) {
      existing.quantity += Math.max(1, Number(quantity) || 1);
    } else {
      lines.push({
        id: product.id,
        name: String(product.name || ""),
        image: product.image || null,
        price: Number(product.price) || 0,
        quantity: Math.max(1, Number(quantity) || 1),
      });
    }
    this.save(lines);
    return lines;
  },

  // Đổi số lượng 1 dòng; nhỏ hơn 1 thì giữ ở 1 (muốn bỏ món thì dùng remove)
  setQuantity(id, quantity) {
    const lines = this.all();
    const line = this.find(lines, id);
    if (!line) return lines;
    line.quantity = Math.max(1, Number(quantity) || 1);
    this.save(lines);
    return lines;
  },

  remove(id) {
    const lines = this.all().filter((line) => String(line.id) !== String(id));
    this.save(lines);
    return lines;
  },
};

// ---------- Hàm thêm vào giỏ dùng chung cho mọi trang ----------
// addToCart({ id, name, price, image })  ->  true nếu đã thêm được.
// Chưa đăng nhập: chuyển sang trang đăng nhập và không thêm gì (trả về false).
function addToCart(product, quantity = 1) {
  if (typeof authStore !== "undefined" && !authStore.requireLogin()) {
    return false; // requireLogin() đã tự chuyển trang
  }
  if (!product || product.id === undefined || product.id === null) {
    showToast("Không tìm thấy món để thêm vào giỏ", "error");
    return false;
  }
  cartStore.add(product, quantity);
  showToast(`Đã thêm "${product.name}" vào giỏ`);
  return true;
}
