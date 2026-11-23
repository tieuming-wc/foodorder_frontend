// Nội dung từng trang quản trị. Dữ liệu là dữ liệu mẫu ở frontend;
// khi backend có API admin (/api/users, /api/items, /api/orders) thì thay bằng api.get/api.put.

(function () {
  const page = document.body.dataset.adminPage;
  const esc = window.escapeHtml;
  const money = (value) => Number(value).toLocaleString("vi-VN") + "đ";

  function adToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "ad-toast" + (type === "error" ? " ad-toast--error" : "");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  // ============================================================
  // Dữ liệu mẫu
  // ============================================================
  const USERS = [
    {
      id: 1,
      name: "Nguyễn Minh Anh",
      email: "minhanh@email.com",
      role: "Khách hàng",
      status: "active",
      phone: "0912 345 678",
      joined: "12/03/2025",
      extra: "Đã xác minh email",
    },
    {
      id: 2,
      name: "Trần Hoàng Nam",
      email: "namtran@email.com",
      role: "Shipper",
      status: "pending",
      phone: "0938 112 477",
      joined: "05/11/2026",
      extra: "CCCD: 079201012345 · Bằng lái: Hợp lệ",
    },
    {
      id: 3,
      name: "Lê Thu Hà",
      email: "thuha@email.com",
      role: "Khách hàng",
      status: "locked",
      phone: "0907 663 210",
      joined: "21/08/2025",
      extra: "Khóa do hủy đơn 3 lần",
    },
    {
      id: 4,
      name: "Phạm Gia Bảo",
      email: "giabao@email.com",
      role: "Khách hàng",
      status: "active",
      phone: "0901 224 889",
      joined: "02/09/2025",
      extra: "Đã xác minh SĐT",
    },
    {
      id: 5,
      name: "Vũ Hải Đăng",
      email: "haidang@email.com",
      role: "Quản trị viên",
      status: "active",
      phone: "0988 445 120",
      joined: "10/01/2025",
      extra: "Toàn quyền hệ thống",
    },
    {
      id: 6,
      name: "Savoris Kitchen",
      email: "kitchen@savoris.vn",
      role: "Đối tác",
      status: "pending",
      phone: "028 3822 1199",
      joined: "16/11/2026",
      extra: "GPKD: 0312 889 441",
    },
  ];

  const ORDERS = [
    {
      code: "SV-2411-018",
      customer: "Nguyễn Minh Anh",
      items: 2,
      total: 2815000,
      status: "pending",
      time: "10:42",
    },
    {
      code: "SV-2411-017",
      customer: "Lê Thu Hà",
      items: 1,
      total: 425000,
      status: "shipping",
      time: "10:15",
    },
    {
      code: "SV-2411-016",
      customer: "Phạm Gia Bảo",
      items: 3,
      total: 1960000,
      status: "done",
      time: "09:58",
    },
    {
      code: "SV-2411-015",
      customer: "Trần Hoàng Nam",
      items: 2,
      total: 710000,
      status: "done",
      time: "09:31",
    },
    {
      code: "SV-2411-014",
      customer: "Nguyễn Minh Anh",
      items: 1,
      total: 285000,
      status: "done",
      time: "09:12",
    },
    {
      code: "SV-2411-013",
      customer: "Savoris Kitchen",
      items: 4,
      total: 3120000,
      status: "cancelled",
      time: "08:47",
    },
    {
      code: "SV-2411-012",
      customer: "Vũ Hải Đăng",
      items: 2,
      total: 640000,
      status: "done",
      time: "08:20",
    },
  ];

  // Danh sách món dùng CHUNG với trang Thực đơn của khách (js/dishes-store.js).
  // Thêm mới / tạm ngưng / xoá ở đây thì thực đơn của khách đổi theo ngay.
  const dishStore = window.SavorisDishes;

  // ============================================================
  // Nhãn trạng thái
  // ============================================================
  const USER_STATUS = {
    pending: { label: "Chờ duyệt", cls: "warn" },
    active: { label: "Đang hoạt động", cls: "ok" },
    locked: { label: "Đã khóa", cls: "danger" },
  };

  const ORDER_STATUS = {
    pending: { label: "Chờ xác nhận", cls: "warn" },
    shipping: { label: "Đang giao", cls: "warn" },
    done: { label: "Hoàn tất", cls: "ok" },
    cancelled: { label: "Đã hủy", cls: "danger" },
  };

  const DISH_STATUS = {
    selling: { label: "Còn bán", cls: "ok" },
    paused: { label: "Tạm ngưng", cls: "muted" },
  };

  function badge(map, key) {
    const item = map[key] || { label: key, cls: "muted" };
    return `<span class="ad-badge ad-badge--${item.cls}">${item.label}</span>`;
  }

  // ============================================================
  // Tổng quan
  // ============================================================
  function renderDashboard() {
    const dishes = dishStore.all();
    const revenue = ORDERS.filter((order) => order.status === "done").reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const pendingUsers = USERS.filter(
      (user) => user.status === "pending",
    ).length;
    const selling = dishes.filter((dish) => dish.status === "selling").length;

    document.getElementById("ad-stats").innerHTML = `
      <article class="ad-stat">
        <p class="ad-stat__label">Doanh thu hôm nay</p>
        <p class="ad-stat__value">${money(revenue)}</p>
        <p class="ad-stat__meta ad-stat__meta--ok">+8,2% so với hôm qua</p>
      </article>
      <article class="ad-stat">
        <p class="ad-stat__label">Đơn hàng</p>
        <p class="ad-stat__value">${ORDERS.length}</p>
        <p class="ad-stat__meta">${ORDERS.filter((order) => order.status === "pending").length} đơn chờ xác nhận</p>
      </article>
      <article class="ad-stat">
        <p class="ad-stat__label">Tài khoản chờ duyệt</p>
        <p class="ad-stat__value">${pendingUsers}</p>
        <p class="ad-stat__meta"><a class="ad-link" href="users.html">Xem hồ sơ</a></p>
      </article>
      <article class="ad-stat">
        <p class="ad-stat__label">Món đang bán</p>
        <p class="ad-stat__value">${selling}</p>
        <p class="ad-stat__meta">${dishes.length} món trong thực đơn</p>
      </article>`;

    document.getElementById("ad-recent-orders").innerHTML = ORDERS.slice(0, 5)
      .map(
        (order) => `
      <tr>
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(order.code)}</strong><span>${esc(order.time)}</span></div></td>
        <td data-label="Khách hàng">${esc(order.customer)}</td>
        <td data-label="Tổng tiền" class="ad-t-right ad-t-nowrap">${money(order.total)}</td>
        <td data-label="Trạng thái">${badge(ORDER_STATUS, order.status)}</td>
      </tr>`,
      )
      .join("");

    const top = [...dishes].sort((a, b) => b.sales - a.sales).slice(0, 4);
    const maxSales = top[0] ? top[0].sales : 1;

    document.getElementById("ad-top-dishes").innerHTML = top
      .map(
        (dish, index) => `
      <div class="ad-rank__row">
        <span class="ad-rank__no">${index + 1}</span>
        <div>
          <p class="ad-rank__name">${esc(dish.name)}</p>
          <div class="ad-rank__bar"><i style="width:${Math.round((dish.sales / maxSales) * 100)}%"></i></div>
        </div>
        <span class="ad-rank__value">${dish.sales} phần</span>
      </div>`,
      )
      .join("");
  }

  // ============================================================
  // Tài khoản
  // ============================================================
  let userFilter = "all";
  let userQuery = "";
  let selectedUserId = (
    USERS.find((user) => user.status === "pending") || USERS[0]
  ).id;

  function filteredUsers() {
    return USERS.filter((user) => {
      const matchStatus = userFilter === "all" || user.status === userFilter;
      const keyword = userQuery.toLowerCase();
      const matchQuery =
        !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, ""));
      return matchStatus && matchQuery;
    });
  }

  function renderUserDetail() {
    const panel = document.getElementById("ad-user-detail");
    const user = USERS.find((item) => item.id === selectedUserId);
    if (!user) {
      panel.innerHTML = `<p class="ad-panel__empty">Chọn một tài khoản để xem hồ sơ.</p>`;
      return;
    }

    const actions =
      user.status === "pending"
        ? `<button class="ad-btn ad-btn--gold" type="button" data-user-action="approve" data-id="${user.id}">Duyệt tài khoản</button>
         <button class="ad-btn ad-btn--danger" type="button" data-user-action="lock" data-id="${user.id}">Từ chối / Khóa</button>`
        : user.status === "locked"
          ? `<button class="ad-btn ad-btn--gold" type="button" data-user-action="unlock" data-id="${user.id}">Mở khóa tài khoản</button>`
          : `<button class="ad-btn ad-btn--danger" type="button" data-user-action="lock" data-id="${user.id}">Khóa tài khoản</button>`;

    panel.innerHTML = `
      <p class="ad-detail__name">${esc(user.name)}</p>
      <p class="ad-detail__role">${esc(user.role)} · ${badge(USER_STATUS, user.status)}</p>
      <dl class="ad-detail">
        <div class="ad-detail__row"><dt>Email</dt><dd>${esc(user.email)}</dd></div>
        <div class="ad-detail__row"><dt>Số điện thoại</dt><dd>${esc(user.phone)}</dd></div>
        <div class="ad-detail__row"><dt>Ngày tham gia</dt><dd>${esc(user.joined)}</dd></div>
        <div class="ad-detail__row"><dt>Ghi chú</dt><dd>${esc(user.extra)}</dd></div>
      </dl>
      <div class="ad-form__actions">${actions}</div>`;
  }

  function renderUsers() {
    const list = filteredUsers();
    const counts = {
      all: USERS.length,
      pending: USERS.filter((user) => user.status === "pending").length,
      active: USERS.filter((user) => user.status === "active").length,
      locked: USERS.filter((user) => user.status === "locked").length,
    };

    document.getElementById("ad-user-chips").innerHTML = `
      <button class="ad-chip ${userFilter === "all" ? "is-active" : ""}" type="button" data-user-filter="all">Tất cả <b>${counts.all}</b></button>
      <button class="ad-chip ${userFilter === "pending" ? "is-active" : ""}" type="button" data-user-filter="pending">Chờ duyệt <b>${counts.pending}</b></button>
      <button class="ad-chip ${userFilter === "active" ? "is-active" : ""}" type="button" data-user-filter="active">Đang hoạt động <b>${counts.active}</b></button>
      <button class="ad-chip ${userFilter === "locked" ? "is-active" : ""}" type="button" data-user-filter="locked">Đã khóa <b>${counts.locked}</b></button>`;

    const body = document.getElementById("ad-user-rows");
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="4"><div class="ad-empty">Không tìm thấy tài khoản phù hợp.</div></td></tr>`;
      return;
    }

    body.innerHTML = list
      .map((user) => {
        let action = "";
        if (user.status === "pending") {
          action = `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-user-action="approve" data-id="${user.id}">Duyệt</button>
          <button class="ad-btn ad-btn--sm" type="button" data-user-action="lock" data-id="${user.id}">Khóa</button>`;
        } else if (user.status === "locked") {
          action = `<button class="ad-btn ad-btn--sm" type="button" data-user-action="unlock" data-id="${user.id}">Mở khóa</button>`;
        } else {
          action = `<button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-user-action="lock" data-id="${user.id}">Khóa</button>`;
        }

        return `
        <tr data-id="${user.id}" class="${user.id === selectedUserId ? "is-selected" : ""}">
          <td class="ad-td-main">
            <div class="ad-cell-main"><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div>
          </td>
          <td data-label="Vai trò">${esc(user.role)}</td>
          <td data-label="Trạng thái">${badge(USER_STATUS, user.status)}</td>
          <td class="ad-td-actions">${action}</td>
        </tr>`;
      })
      .join("");

    renderUserDetail();
  }

  function updateUser(id, action) {
    const user = USERS.find((item) => item.id === id);
    if (!user) return;

    if (action === "approve") {
      user.status = "active";
      user.extra = "Đã duyệt bởi quản trị viên";
      adToast(`Đã duyệt tài khoản "${user.name}"`);
    }
    if (action === "lock") {
      user.status = "locked";
      adToast(`Đã khóa tài khoản "${user.name}"`);
    }
    if (action === "unlock") {
      user.status = "active";
      adToast(`Đã mở khóa tài khoản "${user.name}"`);
    }
    selectedUserId = user.id;
    renderUsers();
  }

  function setupUsers() {
    const body = document.getElementById("ad-user-rows");
    const chips = document.getElementById("ad-user-chips");
    const search = document.getElementById("ad-user-search");
    const panel = document.getElementById("ad-user-detail");

    function handleAction(button) {
      updateUser(Number(button.dataset.id), button.dataset.userAction);
    }

    chips.addEventListener("click", (event) => {
      const chip = event.target.closest("button[data-user-filter]");
      if (!chip) return;
      userFilter = chip.dataset.userFilter;
      renderUsers();
    });

    search.addEventListener("input", () => {
      userQuery = search.value.trim();
      renderUsers();
    });

    body.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-user-action]");
      if (button) {
        handleAction(button);
        return;
      }
      const row = event.target.closest("tr[data-id]");
      if (!row) return;
      selectedUserId = Number(row.dataset.id);
      renderUsers();
    });

    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-user-action]");
      if (button) handleAction(button);
    });

    renderUsers();
  }

  // ============================================================
  // Danh mục & món
  // ============================================================
  const CATEGORIES = ["Món chính", "Mỳ & Pasta", "Hải sản", "Tráng miệng"];
  let dishCategory = "all";

  function categories() {
    return [...new Set([...CATEGORIES, ...dishStore.categories()])];
  }

  function renderDishes() {
    const dishes = dishStore.all();
    const list = dishes.filter(
      (dish) => dishCategory === "all" || dish.category === dishCategory,
    );

    document.getElementById("ad-dish-chips").innerHTML = `
      <button class="ad-chip ${dishCategory === "all" ? "is-active" : ""}" type="button" data-dish-filter="all">Tất cả <b>${dishes.length}</b></button>
      ${categories()
        .map((category) => {
          const count = dishes.filter(
            (dish) => dish.category === category,
          ).length;
          return `<button class="ad-chip ${dishCategory === category ? "is-active" : ""}" type="button"
          data-dish-filter="${esc(category)}">${esc(category)} <b>${count}</b></button>`;
        })
        .join("")}`;

    const body = document.getElementById("ad-dish-rows");
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="5"><div class="ad-empty">Chưa có món nào trong danh mục này.</div></td></tr>`;
      return;
    }

    body.innerHTML = list
      .map(
        (dish) => `
      <tr data-id="${esc(dish.id)}">
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(dish.name)}</strong><span>${dish.sales} phần đã bán</span></div></td>
        <td data-label="Danh mục">${esc(dish.category)}</td>
        <td data-label="Giá" class="ad-t-nowrap">${money(dish.price)}</td>
        <td data-label="Trạng thái">${badge(DISH_STATUS, dish.status)}</td>
        <td class="ad-td-actions">
          <button class="ad-btn ad-btn--sm" type="button" data-dish-action="toggle" data-id="${esc(dish.id)}">
            ${dish.status === "selling" ? "Tạm ngưng" : "Mở bán"}
          </button>
          <button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-dish-action="remove" data-id="${esc(dish.id)}">Xóa</button>
        </td>
      </tr>`,
      )
      .join("");

    const select = document.getElementById("ad-dish-category");
    const categoryList = categories();
    if (select && select.options.length !== categoryList.length) {
      const current = select.value;
      select.innerHTML = categoryList
        .map((category) => `<option>${esc(category)}</option>`)
        .join("");
      if (current) select.value = current;
    }
  }

  function setupProducts() {
    const body = document.getElementById("ad-dish-rows");
    const chips = document.getElementById("ad-dish-chips");
    const form = document.getElementById("ad-dish-form");

    chips.addEventListener("click", (event) => {
      const chip = event.target.closest("button[data-dish-filter]");
      if (!chip) return;
      dishCategory = chip.dataset.dishFilter;
      renderDishes();
    });

    body.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-dish-action]");
      if (!button) return;

      const dish = dishStore.find(button.dataset.id);
      if (!dish) return;

      if (button.dataset.dishAction === "toggle") {
        const updated = dishStore.toggle(dish.id);
        adToast(
          updated.status === "selling"
            ? `Đã mở bán "${dish.name}"`
            : `Đã tạm ngưng "${dish.name}"`,
        );
      }

      if (button.dataset.dishAction === "remove") {
        if (!confirm(`Xóa món "${dish.name}" khỏi thực đơn?`)) return;
        dishStore.remove(dish.id);
        adToast(`Đã xóa "${dish.name}"`, "error");
      }

      renderDishes();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.dishName.value.trim();
      const price = Number(form.dishPrice.value || 0);

      if (name.length < 2) {
        adToast("Vui lòng nhập tên món.", "error");
        form.dishName.focus();
        return;
      }
      if (price <= 0) {
        adToast("Giá món phải lớn hơn 0.", "error");
        form.dishPrice.focus();
        return;
      }

      dishStore.add({
        name,
        note: form.dishNote ? form.dishNote.value.trim() : "",
        category: form.dishCategory.value,
        price,
        image: form.dishImage ? form.dishImage.value.trim() : "",
        status: form.dishVisible.checked ? "selling" : "paused",
      });

      dishCategory = "all";
      form.reset();
      renderDishes();
      adToast(`Đã thêm món "${name}"`);
    });

    renderDishes();
  }

  // ============================================================
  // Đơn hàng
  // ============================================================
  let orderFilter = "all";

  const ORDER_ACTIONS = {
    pending: [
      { action: "ship", label: "Xác nhận & giao" },
      { action: "cancel", label: "Hủy", danger: true },
    ],
    shipping: [
      { action: "done", label: "Hoàn tất" },
      { action: "cancel", label: "Hủy", danger: true },
    ],
    done: [],
    cancelled: [],
  };

  // ============================================================
  // Khuyến mãi
  // ============================================================
  const PROMOTIONS = [
    {
      id: 1,
      name: "Bữa trưa đầy cảm hứng",
      description: "Giảm 15% món chính 11:00–14:00",
      discount: 15,
      days: "Thứ hai đến thứ sáu",
      start: "10/11/2026",
      end: "23/11/2026",
      status: "active",
    },
    {
      id: 2,
      name: "Khuyến mãi mới",
      description: "Ưu đãi cuối tuần",
      discount: 10,
      days: "Cuối tuần",
      start: "20/11/2026",
      end: "20/12/2026",
      status: "active",
    },
  ];

  function renderPromotions() {
    const body = document.getElementById("ad-promotion-rows");
    if (!body) return;
    body.innerHTML = PROMOTIONS.map(
      (item) => `
      <tr>
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(item.name)}</strong><span>${esc(item.description)}</span></div></td>
        <td data-label="Giảm">${item.discount}%</td>
        <td data-label="Thời gian">${esc(item.start)} – ${esc(item.end)}</td>
        <td data-label="Trạng thái">${badge({ active: { label: "Đang chạy", cls: "ok" }, paused: { label: "Tạm dừng", cls: "muted" } }, item.status)}</td>
        <td class="ad-td-actions">
          <button class="ad-btn ad-btn--sm" type="button" data-promotion-action="${item.status === "active" ? "pause" : "resume"}" data-id="${item.id}">
            ${item.status === "active" ? "Tạm dừng" : "Kích hoạt"}
          </button>
        </td>
      </tr>`,
    ).join("");
  }

  function setupPromotions() {
    renderPromotions();
    const form = document.getElementById("ad-promotion-form");
    const body = document.getElementById("ad-promotion-rows");

    body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-promotion-action]");
      if (!button) return;
      const item = PROMOTIONS.find(
        (entry) => entry.id === Number(button.dataset.id),
      );
      if (!item) return;
      item.status =
        button.dataset.promotionAction === "pause" ? "paused" : "active";
      adToast(
        item.status === "active"
          ? `Đã kích hoạt "${item.name}"`
          : `Đã tạm dừng "${item.name}"`,
      );
      renderPromotions();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.promotionName.value.trim();
      const discount = Number(form.promotionDiscount.value || 0);
      if (!name || discount <= 0) {
        adToast("Vui lòng nhập tên và mức giảm hợp lệ.", "error");
        return;
      }
      PROMOTIONS.push({
        id: Date.now(),
        name,
        description:
          form.promotionDescription.value.trim() ||
          "Ưu đãi dành cho khách hàng",
        discount,
        days: form.promotionDays.value.trim() || "Tất cả các ngày",
        start: form.promotionStart.value,
        end: form.promotionEnd.value,
        status: "active",
      });
      form.reset();
      renderPromotions();
      adToast(`Đã tạo khuyến mãi "${name}"`);
    });
  }

  // ============================================================
  // Phản hồi
  // ============================================================
  const FEEDBACKS = [
    {
      id: 1,
      name: "Nguyễn Minh Anh",
      email: "minhanh@email.com",
      rating: 5,
      content: "Món ăn ngon, giao hàng nhanh.",
      status: "new",
    },
    {
      id: 2,
      name: "Lê Thu Hà",
      email: "thuha@email.com",
      rating: 4,
      content: "Đóng gói đẹp, sẽ đặt lại.",
      status: "new",
    },
    {
      id: 3,
      name: "Phạm Gia Bảo",
      email: "giabao@email.com",
      rating: 5,
      content: "Bít tết Wagyu rất ngon.",
      status: "replied",
    },
  ];

  function renderFeedback() {
    const body = document.getElementById("ad-feedback-rows");
    if (!body) return;
    body.innerHTML = FEEDBACKS.map(
      (item) => `
      <tr>
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(item.name)}</strong><span>${esc(item.email)}</span></div></td>
        <td data-label="Đánh giá">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</td>
        <td data-label="Nội dung">${esc(item.content)}</td>
        <td data-label="Trạng thái">${badge({ new: { label: "Chờ phản hồi", cls: "warn" }, replied: { label: "Đã phản hồi", cls: "ok" } }, item.status)}</td>
        <td class="ad-td-actions">
          ${item.status === "new" ? `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-feedback-action="reply" data-id="${item.id}">Phản hồi</button>` : '<span class="ad-panel__empty">—</span>'}
        </td>
      </tr>`,
    ).join("");
  }

  function setupFeedback() {
    renderFeedback();
    document
      .getElementById("ad-feedback-rows")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-feedback-action]");
        if (!button) return;
        const item = FEEDBACKS.find(
          (entry) => entry.id === Number(button.dataset.id),
        );
        if (!item) return;
        item.status = "replied";
        adToast(`Đã đánh dấu phản hồi cho ${item.name}`);
        renderFeedback();
      });
  }

  // ============================================================
  // Đối tác
  // ============================================================
  const PARTNERS = [
    {
      id: 1,
      name: "Savoris Kitchen",
      email: "kitchen@savoris.vn",
      phone: "028 3822 1199",
      license: "GPKD: 0312 889 441",
      status: "pending",
    },
  ];

  function renderPartners() {
    const body = document.getElementById("ad-partner-rows");
    if (!body) return;
    body.innerHTML = PARTNERS.map(
      (item) => `
      <tr>
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(item.name)}</strong><span>${esc(item.email)}</span></div></td>
        <td data-label="Liên hệ">${esc(item.phone)}</td>
        <td data-label="Giấy phép">${esc(item.license)}</td>
        <td data-label="Trạng thái">${badge({ pending: { label: "Chờ duyệt", cls: "warn" }, active: { label: "Đang hợp tác", cls: "ok" }, locked: { label: "Ngừng hợp tác", cls: "danger" } }, item.status)}</td>
        <td class="ad-td-actions">
          ${item.status === "pending" ? `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-partner-action="approve" data-id="${item.id}">Duyệt</button>` : ""}
          ${item.status === "active" ? `<button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-partner-action="lock" data-id="${item.id}">Ngừng</button>` : ""}
        </td>
      </tr>`,
    ).join("");
  }

  function setupPartners() {
    renderPartners();
    document
      .getElementById("ad-partner-rows")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-partner-action]");
        if (!button) return;
        const item = PARTNERS.find(
          (entry) => entry.id === Number(button.dataset.id),
        );
        if (!item) return;
        item.status =
          button.dataset.partnerAction === "approve" ? "active" : "locked";
        adToast(
          button.dataset.partnerAction === "approve"
            ? `Đã duyệt đối tác ${item.name}`
            : `Đã ngừng hợp tác ${item.name}`,
        );
        renderPartners();
      });
  }

  // ============================================================
  // Shipper
  // ============================================================
  const SHIPPERS = [
    {
      id: 1,
      name: "Trần Hoàng Nam",
      email: "namtran@email.com",
      phone: "0938 112 477",
      license: "CCCD và bằng lái hợp lệ",
      status: "pending",
    },
  ];

  function renderShippers() {
    const body = document.getElementById("ad-shipper-rows");
    if (!body) return;
    body.innerHTML = SHIPPERS.map(
      (item) => `
      <tr>
        <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(item.name)}</strong><span>${esc(item.email)}</span></div></td>
        <td data-label="Điện thoại">${esc(item.phone)}</td>
        <td data-label="Giấy tờ">${esc(item.license)}</td>
        <td data-label="Trạng thái">${badge({ pending: { label: "Chờ duyệt", cls: "warn" }, active: { label: "Đang hoạt động", cls: "ok" }, locked: { label: "Đã khóa", cls: "danger" } }, item.status)}</td>
        <td class="ad-td-actions">
          ${item.status === "pending" ? `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-shipper-action="approve" data-id="${item.id}">Duyệt</button>` : ""}
          ${item.status === "active" ? `<button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-shipper-action="lock" data-id="${item.id}">Khóa</button>` : ""}
        </td>
      </tr>`,
    ).join("");
  }

  function setupShippers() {
    renderShippers();
    document
      .getElementById("ad-shipper-rows")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-shipper-action]");
        if (!button) return;
        const item = SHIPPERS.find(
          (entry) => entry.id === Number(button.dataset.id),
        );
        if (!item) return;
        item.status =
          button.dataset.shipperAction === "approve" ? "active" : "locked";
        adToast(
          button.dataset.shipperAction === "approve"
            ? `Đã duyệt shipper ${item.name}`
            : `Đã khóa shipper ${item.name}`,
        );
        renderShippers();
      });
  }

  function renderOrders() {
    const list = ORDERS.filter(
      (order) => orderFilter === "all" || order.status === orderFilter,
    );

    document.getElementById("ad-order-chips").innerHTML = `
      <button class="ad-chip ${orderFilter === "all" ? "is-active" : ""}" type="button" data-order-filter="all">Tất cả <b>${ORDERS.length}</b></button>
      ${Object.keys(ORDER_STATUS)
        .map(
          (key) => `
        <button class="ad-chip ${orderFilter === key ? "is-active" : ""}" type="button" data-order-filter="${key}">
          ${ORDER_STATUS[key].label} <b>${ORDERS.filter((order) => order.status === key).length}</b>
        </button>`,
        )
        .join("")}`;

    const body = document.getElementById("ad-order-rows");
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="5"><div class="ad-empty">Không có đơn hàng ở trạng thái này.</div></td></tr>`;
      return;
    }

    body.innerHTML = list
      .map((order) => {
        const actions = ORDER_ACTIONS[order.status]
          .map(
            (item) => `
        <button class="ad-btn ad-btn--sm ${item.danger ? "ad-btn--danger" : ""}" type="button"
          data-order-action="${item.action}" data-code="${esc(order.code)}">${item.label}</button>`,
          )
          .join("");

        return `
        <tr data-code="${esc(order.code)}">
          <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(order.code)}</strong><span>${esc(order.time)} hôm nay</span></div></td>
          <td data-label="Khách hàng">${esc(order.customer)}</td>
          <td data-label="Số món">${order.items} món</td>
          <td data-label="Tổng tiền">${money(order.total)}</td>
          <td data-label="Trạng thái">${badge(ORDER_STATUS, order.status)}</td>
          <td class="ad-td-actions">${actions || '<span class="ad-panel__empty">—</span>'}</td>
        </tr>`;
      })
      .join("");
  }

  function setupOrders() {
    const chips = document.getElementById("ad-order-chips");
    const body = document.getElementById("ad-order-rows");

    chips.addEventListener("click", (event) => {
      const chip = event.target.closest("button[data-order-filter]");
      if (!chip) return;
      orderFilter = chip.dataset.orderFilter;
      renderOrders();
    });

    body.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-order-action]");
      if (!button) return;

      const order = ORDERS.find((item) => item.code === button.dataset.code);
      if (!order) return;

      if (
        button.dataset.orderAction === "cancel" &&
        !confirm(`Hủy đơn ${order.code}?`)
      )
        return;

      order.status = {
        ship: "shipping",
        done: "done",
        cancel: "cancelled",
      }[button.dataset.orderAction];

      adToast(`Đơn ${order.code}: ${ORDER_STATUS[order.status].label}`);
      renderOrders();
    });

    renderOrders();
  }

  // ============================================================
  // Khởi động theo trang
  // ============================================================
  if (page === "dashboard") renderDashboard();
  if (page === "users") setupUsers();
  if (page === "products") setupProducts();
  if (page === "orders") setupOrders();
  if (page === "promotions") setupPromotions();
  if (page === "feedback") setupFeedback();
  if (page === "partners") setupPartners();
  if (page === "shippers") setupShippers();
})();
