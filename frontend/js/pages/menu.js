// Trang Thực đơn: đọc món từ SavorisDishes (dùng chung với trang quản trị)
// và thêm món vào giỏ (SavorisCart).

(function () {
  const cart = window.SavorisCart;
  const store = window.SavorisDishes;
  const root = document.body.dataset.root || "../";
  const money = cart.money;

  const grid = document.getElementById("menu-grid");
  const countLabel = document.getElementById("menu-count");

  function dishHtml(dish) {
    const image = dish.image || store.imageFallback;
    return `
      <article class="sv-dish">
        <div class="sv-dish__media">
          <img src="${root}${escapeHtml(image)}" alt="${escapeHtml(dish.name)}"
            width="400" height="300" loading="lazy">
        </div>
        <div class="sv-dish__body">
          <h2 class="sv-dish__name">${escapeHtml(dish.name)}</h2>
          ${dish.note ? `<p class="sv-dish__note">${escapeHtml(dish.note)}</p>` : ""}
          <div class="sv-dish__foot">
            <span class="sv-dish__price">${money(dish.price)}</span>
            <button class="sv-btn sv-btn--gold sv-dish__add" type="button" data-add="${escapeHtml(dish.id)}">
              Thêm vào giỏ
            </button>
          </div>
          <p class="sv-dish__count" data-count="${escapeHtml(dish.id)}" hidden></p>
        </div>
      </article>`;
  }

  function renderQuantities(dishes) {
    dishes.forEach((dish) => {
      const label = grid.querySelector(`[data-count="${dish.id}"]`);
      if (!label) return;
      const qty = cart.qtyOf(dish.id);
      if (qty > 0) {
        label.hidden = false;
        label.textContent = `Đã có ${qty} phần trong giỏ`;
      } else {
        label.hidden = true;
      }
    });
  }

  function render() {
    // Chỉ hiển thị món đang bán; món admin tạm ngưng sẽ biến mất khỏi thực đơn.
    const dishes = store ? store.selling() : [];

    if (countLabel) {
      countLabel.textContent = dishes.length
        ? `${dishes.length} món đặc trưng · Bếp mở 10:00 – 22:00 mỗi ngày`
        : "Bếp mở 10:00 – 22:00 mỗi ngày";
    }

    if (!dishes.length) {
      grid.innerHTML = `<p class="sv-page-head__meta">Thực đơn đang được nhà hàng cập nhật. Vui lòng quay lại sau ít phút.</p>`;
      return;
    }

    grid.innerHTML = dishes.map(dishHtml).join("");
    renderQuantities(dishes);
  }

  render();

  // Admin đổi thực đơn ở tab khác thì trang khách cập nhật theo
  if (store) store.subscribe(render);

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-add]");
    if (!button) return;

    const dish = store.find(button.dataset.add);
    if (!dish) return;

    const result = cart.add(dish);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(`Đã thêm "${dish.name}" vào giỏ`);
    renderQuantities(store.selling());
    window.SavorisLayout.syncCartCount();
  });
})();
