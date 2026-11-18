(function () {
  const root = document.body.dataset.root || "./";
  const store = window.SavorisDishes;
  const cart = window.SavorisCart;
  const grid = document.getElementById("home-featured");

  function dishHtml(dish) {
    const image = dish.image || store.imageFallback;
    return `
      <article class="sv-dish">
        <div class="sv-dish__media">
          <img src="${root}${escapeHtml(image)}" alt="${escapeHtml(dish.name)}" width="400" height="300" loading="lazy">
        </div>
        <div class="sv-dish__body">
          <h3 class="sv-dish__name">${escapeHtml(dish.name)}</h3>
          ${dish.note ? `<p class="sv-dish__note">${escapeHtml(dish.note)}</p>` : ""}
          <div class="sv-dish__foot">
            <span class="sv-dish__price">${cart.money(dish.price)}</span>
            <button class="sv-btn sv-btn--gold sv-dish__add" type="button" data-add="${escapeHtml(dish.id)}">Thêm vào giỏ</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const dishes = store.selling().slice(0, 3);
    grid.innerHTML = dishes.length
      ? dishes.map(dishHtml).join("")
      : `<p class="sv-home-empty">Thực đơn đang được nhà hàng cập nhật. Vui lòng quay lại sau ít phút.</p>`;
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-add]");
    if (!button) return;

    const dish = store.find(button.dataset.add);
    if (!dish || dish.status !== "selling") return;

    const result = cart.add(dish);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(`Đã thêm "${dish.name}" vào giỏ`);
    window.SavorisLayout.syncCartCount();
  });

  render();
  store.subscribe(render);
})();
