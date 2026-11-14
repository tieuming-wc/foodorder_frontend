// Giỏ hàng dùng chung: lưu trong localStorage để trang món và trang giỏ hàng
// đọc/ghi cùng một chỗ. Không cần backend.
//
// Mỗi dòng trong giỏ có dạng:
//   { id: 1, name: "Cơm rang", image: "https://...", price: 45000, quantity: 2 }
//
// Trang món muốn thêm vào giỏ:  cartStore.add({ id, name, image, price });

const CART_STORAGE_KEY = "ks25_cart";

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
  },

  find(lines, id) {
    return lines.find((line) => String(line.id) === String(id));
  },

  // Tổng số món trong giỏ (cộng cả số lượng) - dùng để hiện số trên menu nếu cần
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
