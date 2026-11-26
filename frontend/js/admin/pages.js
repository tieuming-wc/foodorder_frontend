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
    const tabsEl   = document.getElementById("ad-partner-tabs");
    const searchEl = document.getElementById("ad-partner-search");
    const chipsEl  = document.getElementById("ad-partner-chips");
    const rowsEl   = document.getElementById("ad-partner-rows");
    const detailEl = document.getElementById("ad-partner-detail");
    if (!rowsEl) return;

    let tab = "partners", pFilter = "all", pQuery = "";
    const P_STATUS = { pending: { label: "Chờ duyệt", cls: "warn" }, active: { label: "Đang hoạt động", cls: "ok" }, locked: { label: "Tạm dừng", cls: "danger" } };

    function draw() {
      const source = tab === "partners" ? PARTNERS : SHIPPERS;
      if (chipsEl) {
        chipsEl.innerHTML = `<button class="ad-chip ${pFilter==="all"?"is-active":""}" type="button" data-pf="all">Tất cả <b>${source.length}</b></button>` +
          Object.keys(P_STATUS).map((k) => `<button class="ad-chip ${pFilter===k?"is-active":""}" type="button" data-pf="${k}">${P_STATUS[k].label} <b>${source.filter((x)=>x.status===k).length}</b></button>`).join("");
      }
      const list = source.filter((x) => (pFilter === "all" || x.status === pFilter) && (!pQuery || `${x.name} ${x.email} ${x.phone}`.toLowerCase().includes(pQuery)));
      rowsEl.innerHTML = list.map((item) => `
        <tr data-pid="${item.id}" style="cursor:pointer">
          <td class="ad-td-main"><div class="ad-cell-main"><strong>${esc(item.name)}</strong><span>${esc(item.email)}</span></div></td>
          <td data-label="Liên hệ">${esc(item.phone)}</td>
          <td data-label="Đơn">${item.orders || 12} đơn</td>
          <td data-label="Đánh giá">${item.rating || "4.8"} ★</td>
          <td data-label="Trạng thái">${badge(P_STATUS, item.status)}</td>
          <td class="ad-td-actions">
            ${item.status === "pending" ? `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-partner-action="approve" data-id="${item.id}">Duyệt</button>` : ""}
            ${item.status === "active" ? `<button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-partner-action="lock" data-id="${item.id}">Ngừng</button>` : ""}
          </td>
        </tr>`).join("") || '<tr><td colspan="6"><div class="ad-empty">Không có dữ liệu.</div></td></tr>';
    }

    tabsEl?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-partner-tab]"); if (!b) return;
      tab = b.dataset.partnerTab; pFilter = "all";
      tabsEl.querySelectorAll(".ad-tab-btn").forEach((x) => x.classList.toggle("is-active", x === b));
      draw();
    });
    searchEl?.addEventListener("input", () => { pQuery = searchEl.value.trim().toLowerCase(); draw(); });
    chipsEl?.addEventListener("click", (e) => { const b = e.target.closest("[data-pf]"); if (b) { pFilter = b.dataset.pf; draw(); } });
    rowsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-partner-action]");
      const source = tab === "partners" ? PARTNERS : SHIPPERS;
      if (btn) {
        e.stopPropagation();
        const item = source.find((entry) => entry.id === Number(btn.dataset.id));
        if (!item) return;
        item.status = btn.dataset.partnerAction === "approve" ? "active" : "locked";
        adToast(btn.dataset.partnerAction === "approve" ? `Đã duyệt ${item.name}` : `Đã tạm dừng ${item.name}`);
        draw();
        return;
      }
      const tr = e.target.closest("tr[data-pid]");
      const item = tr && source.find((x) => x.id === Number(tr.dataset.pid));
      if (item && detailEl) {
        detailEl.innerHTML = `<h3 style="margin:0 0 6px">${esc(item.name)}</h3><p style="margin:0 0 12px;color:var(--ad-muted);font-size:12.5px">${esc(item.email)} · ${esc(item.phone)}</p><p style="margin:0;font-size:13px">${esc(item.license || item.address || "Hồ sơ đã xác minh")}</p>`;
      }
    });
    draw();
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
  // Trang Thống kê (Analytics — đọc từ API /orders & /dishes)
  // ============================================================
  let _analyticsCharts = {};
  async function renderAnalytics() {
    const statsEl   = document.getElementById("ad-analytics-stats");
    const tableEl   = document.getElementById("ad-analytics-table");
    const peakEl    = document.getElementById("ad-peak-hours");
    const rangeSel  = document.getElementById("ad-analytics-range");
    const exportBtn = document.getElementById("ad-export-analytics");
    if (!statsEl) return;

    statsEl.innerHTML = Array(4).fill('<article class="ad-stat ad-stat--skeleton"></article>').join("");

    let orderList = ORDERS;
    let dishList  = window.SavorisDishes ? window.SavorisDishes.all() : [];
    try {
      const [oRes, dRes] = await Promise.all([
        typeof api !== "undefined" ? api.get("/orders").catch(() => null) : null,
        typeof api !== "undefined" ? api.get("/dishes").catch(() => null) : null,
      ]);
      if (Array.isArray(oRes) && oRes.length) orderList = oRes;
      if (Array.isArray(dRes) && dRes.length) dishList  = dRes;
    } catch (_) {}

    if (typeof Chart !== "undefined") {
      Chart.defaults.color = "#8f948b";
      Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
      Chart.defaults.font.size = 11;
    }

    let lastRows = [];

    function draw(days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const scoped    = orderList.filter((o) => !o.created_at || new Date(o.created_at) >= cutoff);
      const done      = scoped.filter((o) => o.status === "done");
      const cancelled = scoped.filter((o) => o.status === "cancelled");
      const revenue   = done.reduce((s, o) => s + Number(o.total || 0), 0);
      const avg       = done.length ? Math.round(revenue / done.length) : 0;
      const cancRate  = scoped.length ? Math.round((cancelled.length / scoped.length) * 100) : 0;

      statsEl.innerHTML = `
        <article class="ad-stat">
          <p class="ad-stat__label">Tổng doanh thu</p>
          <p class="ad-stat__value">${money(revenue)}</p>
          <p class="ad-stat__meta ad-stat__meta--ok">${done.length} đơn hoàn tất</p>
        </article>
        <article class="ad-stat">
          <p class="ad-stat__label">Trung bình / đơn</p>
          <p class="ad-stat__value">${money(avg)}</p>
          <p class="ad-stat__meta">${scoped.length} đơn trong ${days} ngày</p>
        </article>
        <article class="ad-stat">
          <p class="ad-stat__label">Tỷ lệ hủy</p>
          <p class="ad-stat__value">${cancRate}%</p>
          <p class="ad-stat__meta ad-stat__meta--danger">${cancelled.length} đơn đã hủy</p>
        </article>
        <article class="ad-stat">
          <p class="ad-stat__label">Món đang bán</p>
          <p class="ad-stat__value">${dishList.filter((d) => d.status === "selling").length}</p>
          <p class="ad-stat__meta">${dishList.length} món trong thực đơn</p>
        </article>`;

      Object.values(_analyticsCharts).forEach((c) => c && c.destroy());
      _analyticsCharts = {};

      const revCanvas = document.getElementById("ad-analytics-revenue");
      const ordCanvas = document.getElementById("ad-analytics-orders");
      const catCanvas = document.getElementById("ad-analytics-cat");

      const labels = [], revData = [], ordData = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toDateString();
        labels.push(d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }));
        const dayDone = done.filter((o) => o.created_at && new Date(o.created_at).toDateString() === ds);
        revData.push(dayDone.reduce((s, o) => s + Number(o.total || 0), 0));
        ordData.push(scoped.filter((o) => o.created_at && new Date(o.created_at).toDateString() === ds).length);
      }

      if (revCanvas && typeof Chart !== "undefined") {
        const ctx = revCanvas.getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 0, 220);
        grad.addColorStop(0, "rgba(226,200,150,.28)");
        grad.addColorStop(1, "rgba(226,200,150,0)");
        _analyticsCharts.rev = new Chart(ctx, {
          type: "line",
          data: { labels, datasets: [{ label: "Doanh thu", data: revData, borderColor: "#e2c896", borderWidth: 2, fill: true, backgroundColor: grad, tension: 0.35, pointRadius: days > 30 ? 0 : 3 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { maxTicksLimit: 10 } }, y: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { callback: (v) => v >= 1e6 ? (v/1e6).toFixed(1)+"M" : (v/1000)+"k" } } } },
        });
      }

      if (ordCanvas && typeof Chart !== "undefined") {
        _analyticsCharts.ord = new Chart(ordCanvas.getContext("2d"), {
          type: "bar",
          data: { labels, datasets: [{ label: "Đơn hàng", data: ordData, backgroundColor: "rgba(226,200,150,.32)", borderColor: "#e2c896", borderWidth: 1, borderRadius: 4 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { maxTicksLimit: 10 } }, y: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { stepSize: 1 } } } },
        });
      }

      if (catCanvas && typeof Chart !== "undefined") {
        const cats = {};
        dishList.forEach((d) => { cats[d.category] = (cats[d.category] || 0) + Number(d.sales || 1); });
        const cLabels = Object.keys(cats);
        const cVals   = cLabels.map((k) => cats[k]);
        _analyticsCharts.cat = new Chart(catCanvas.getContext("2d"), {
          type: "doughnut",
          data: { labels: cLabels, datasets: [{ data: cVals, backgroundColor: ["#e2c896","#b69b6b","#7fbf8f","#60a5fa","#e0b663","#e2726a"], borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: "65%", plugins: { legend: { position: "bottom" } } },
        });
      }

      if (peakEl) {
        const hours = Array(24).fill(0);
        scoped.forEach((o) => { if (o.created_at) { const h = new Date(o.created_at).getHours(); if (!isNaN(h)) hours[h]++; } });
        const maxH = Math.max(...hours, 1);
        const peaks = hours.map((v, h) => ({ h, v })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);
        peakEl.innerHTML = peaks.length ? peaks.map((p) => `
          <div style="display:grid;grid-template-columns:46px 1fr 28px;gap:8px;align-items:center;margin-bottom:8px;font-size:12px">
            <span class="muted">${String(p.h).padStart(2,"0")}:00</span>
            <div style="height:6px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden"><div style="height:100%;width:${Math.round((p.v/maxH)*100)}%;background:var(--ad-gold,#e2c896)"></div></div>
            <span style="text-align:right">${p.v}</span>
          </div>`).join("") : '<p class="ad-panel__empty">Chưa có dữ liệu giờ đặt hàng.</p>';
      }

      if (tableEl) {
        const rowDays = Math.min(days, 14);
        lastRows = [];
        for (let i = rowDays - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const ds = d.toDateString();
          const dayDone = done.filter((o) => o.created_at && new Date(o.created_at).toDateString() === ds);
          const dayCanc = cancelled.filter((o) => o.created_at && new Date(o.created_at).toDateString() === ds);
          const dayRev  = dayDone.reduce((s, o) => s + Number(o.total || 0), 0);
          const dayAvg  = dayDone.length ? Math.round(dayRev / dayDone.length) : 0;
          lastRows.push({ date: d.toLocaleDateString("vi-VN"), done: dayDone.length, canc: dayCanc.length, rev: dayRev, avg: dayAvg });
        }
        tableEl.innerHTML = lastRows.map((r) => `
          <tr>
            <td>${r.date}</td>
            <td><span class="ad-badge ad-badge--ok">${r.done}</span></td>
            <td><span class="ad-badge ad-badge--danger">${r.canc}</span></td>
            <td class="ad-t-right ad-t-nowrap" style="color:var(--ad-gold)">${money(r.rev)}</td>
            <td class="ad-t-right ad-t-nowrap">${r.avg ? money(r.avg) : "—"}</td>
          </tr>`).join("");
      }
    }

    draw(Number(rangeSel?.value || 7));
    rangeSel?.addEventListener("change", () => draw(Number(rangeSel.value || 7)));
    exportBtn?.addEventListener("click", () => {
      const lines = [["Ngày","Đơn hoàn tất","Đơn hủy","Doanh thu","Trung bình"].join(","), ...lastRows.map((r) => [r.date, r.done, r.canc, r.rev, r.avg].join(","))];
      const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "savoris-thong-ke.csv"; a.click();
      adToast("Đã xuất file CSV thống kê");
    });
  }

  // ============================================================
  // Trang Phản hồi khách hàng (Reviews)
  // ============================================================
  function setupReviews() {
    const chipsEl   = document.getElementById("ad-review-chips");
    const listEl    = document.getElementById("ad-review-list");
    const summaryEl = document.getElementById("ad-review-summary");
    const replyCard = document.getElementById("ad-reply-card");
    const replyForm = document.getElementById("ad-reply-form");
    const replyText = document.getElementById("ad-reply-text");
    const replyCanc = document.getElementById("ad-reply-cancel");
    if (!listEl) return;

    const REVIEWS = [
      { id: 1, customer: "Nguyễn Minh Anh", dish: "Bít tết thăn nội sốt tiêu đen", rating: 5, status: "published", comment: "Thịt mềm tan, sốt tiêu đen thơm đậm vị. Đóng gói giữ nhiệt rất chỉn chu.", reply: "Cảm ơn Minh Anh đã tin tưởng Savoris Kitchen!", created_at: "2 giờ trước" },
      { id: 2, customer: "Trần Hoàng Nam",  dish: "Phở bò tái lăn Hà Nội",          rating: 5, status: "published", comment: "Nước dùng ngọt thanh đúng vị Hà Nội, giao đến vẫn nóng hổi.", reply: "", created_at: "5 giờ trước" },
      { id: 3, customer: "Lê Thu Hà",       dish: "Mỳ Ý nấm Truffle kem tươi",      rating: 4, status: "pending",   comment: "Mỳ ngon, sốt béo vừa nhưng giao hơi chậm 10 phút giờ cao điểm.", reply: "", created_at: "Hôm qua" },
      { id: 4, customer: "Phạm Gia Bảo",    dish: "Cơm tấm sườn bì chả",            rating: 5, status: "published", comment: "Sườn nướng thơm, giá hợp lý, phần ăn rất đầy đặn.", reply: "Savoris cảm ơn Gia Bảo rất nhiều ạ!", created_at: "2 ngày trước" },
      { id: 5, customer: "Đỗ Lan Phương",   dish: "Cá hồi Na Uy áp chảo",           rating: 2, status: "hidden",    comment: "Hôm nay cá hơi khô một chút so với lần trước mình đặt.", reply: "Savoris xin lỗi và đã gửi voucher bù cho đơn sau của bạn.", created_at: "3 ngày trước" },
      { id: 6, customer: "Vũ Quang Huy",    dish: "Bánh mì bò nướng sả",            rating: 4, status: "pending",   comment: "Vỏ bánh giòn, thịt bò ướp đậm đà.", reply: "", created_at: "4 ngày trước" },
    ];
    const R_STATUS = { published: { label: "Đã đăng", cls: "ok" }, pending: { label: "Chờ duyệt", cls: "warn" }, hidden: { label: "Đã ẩn", cls: "muted" } };
    let rFilter = "all";
    let replyingId = null;

    function stars(n) {
      return `<span style="color:#e2c896;letter-spacing:2px">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;
    }

    function renderReviews() {
      chipsEl.innerHTML = `
        <button class="ad-chip ${rFilter==="all"?"is-active":""}" type="button" data-rf="all">Tất cả <b>${REVIEWS.length}</b></button>
        ${Object.keys(R_STATUS).map((k) => `<button class="ad-chip ${rFilter===k?"is-active":""}" type="button" data-rf="${k}">${R_STATUS[k].label} <b>${REVIEWS.filter((r)=>r.status===k).length}</b></button>`).join("")}`;

      const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
      summaryEl.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px">
          <strong style="font-size:34px;font-family:var(--ad-serif,Georgia,serif);color:var(--ad-gold,#e2c896)">${avg}</strong>
          <div>${stars(Math.round(avg))}<div style="font-size:12px;color:var(--ad-muted)">${REVIEWS.length} đánh giá</div></div>
        </div>
        ${[5,4,3,2,1].map((st) => {
          const cnt = REVIEWS.filter((r) => r.rating === st).length;
          const pct = Math.round((cnt / REVIEWS.length) * 100);
          return `<div style="display:grid;grid-template-columns:28px 1fr 24px;gap:8px;align-items:center;font-size:12px;margin-bottom:6px">
            <span>${st}★</span>
            <div style="height:5px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--ad-gold,#e2c896)"></div></div>
            <span style="text-align:right;color:var(--ad-muted)">${cnt}</span>
          </div>`;
        }).join("")}`;

      const list = REVIEWS.filter((r) => rFilter === "all" || r.status === rFilter);
      listEl.innerHTML = list.map((r) => `
        <article class="ad-card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px">
            <div>
              <strong>${esc(r.customer)}</strong> · <span style="color:var(--ad-muted);font-size:12.5px">${esc(r.dish)}</span>
              <div style="margin-top:4px">${stars(r.rating)} <span style="font-size:11.5px;color:var(--ad-muted);margin-left:8px">${esc(r.created_at)}</span></div>
            </div>
            ${badge(R_STATUS, r.status)}
          </div>
          <p style="margin:0 0 10px;color:var(--ad-text)">“${esc(r.comment)}”</p>
          ${r.reply ? `<div style="padding:8px 12px;border-left:2px solid var(--ad-gold,#e2c896);background:rgba(226,200,150,.06);font-size:12.5px;margin-bottom:10px"><strong>Savoris phản hồi:</strong> ${esc(r.reply)}</div>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="ad-btn ad-btn--sm" type="button" data-ra="reply" data-id="${r.id}">Trả lời</button>
            ${r.status !== "published" ? `<button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-ra="publish" data-id="${r.id}">Duyệt đăng</button>` : ""}
            ${r.status !== "hidden" ? `<button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-ra="hide" data-id="${r.id}">Ẩn</button>` : ""}
          </div>
        </article>`).join("") || '<div class="ad-empty">Không có đánh giá nào.</div>';
    }

    chipsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-rf]"); if (!b) return;
      rFilter = b.dataset.rf; renderReviews();
    });
    listEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-ra]"); if (!b) return;
      const rev = REVIEWS.find((x) => x.id === Number(b.dataset.id)); if (!rev) return;
      if (b.dataset.ra === "reply") {
        replyingId = rev.id; replyCard.style.display = "block"; replyText.value = rev.reply || ""; replyText.focus();
      } else if (b.dataset.ra === "publish") {
        rev.status = "published"; adToast(`Đã duyệt đánh giá của ${rev.customer}`); renderReviews();
      } else if (b.dataset.ra === "hide") {
        rev.status = "hidden"; adToast(`Đã ẩn đánh giá của ${rev.customer}`); renderReviews();
      }
    });
    replyForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const rev = REVIEWS.find((x) => x.id === replyingId);
      if (rev && replyText.value.trim()) {
        rev.reply = replyText.value.trim(); rev.status = "published";
        replyCard.style.display = "none"; adToast("Đã gửi phản hồi"); renderReviews();
      }
    });
    replyCanc?.addEventListener("click", () => { replyCard.style.display = "none"; });
    renderReviews();
  }

  // ============================================================
  // Trang Mã giảm giá (Vouchers)
  // ============================================================
  function setupVouchers() {
    const searchEl = document.getElementById("ad-voucher-search");
    const chipsEl  = document.getElementById("ad-voucher-chips");
    const rowsEl   = document.getElementById("ad-voucher-rows");
    const form     = document.getElementById("ad-voucher-form");
    if (!rowsEl) return;

    const VOUCHERS = [
      { id: 1, code: "WELCOME15", type: "percent", discount: 15, min_order: 300000, max_uses: 200, used: 42, expires_at: "2026-12-31", status: "active" },
      { id: 2, code: "FREESHIP",  type: "fixed",   discount: 30000, min_order: 150000, max_uses: 500, used: 184, expires_at: "2026-12-31", status: "active" },
      { id: 3, code: "VIP20",     type: "percent", discount: 20, min_order: 400000, max_uses: 50,  used: 19, expires_at: "2026-12-15", status: "active" },
      { id: 4, code: "MONVIET25", type: "fixed",   discount: 25000, min_order: 120000, max_uses: 100, used: 100, expires_at: "2026-11-20", status: "expired" },
      { id: 5, code: "NOEL50K",   type: "fixed",   discount: 50000, min_order: 350000, max_uses: 150, used: 0, expires_at: "2026-12-26", status: "disabled" },
    ];
    const V_STATUS = { active: { label: "Đang bật", cls: "ok" }, disabled: { label: "Đã tắt", cls: "muted" }, expired: { label: "Hết hạn", cls: "danger" } };
    let vFilter = "all", vQuery = "";

    function renderVouchers() {
      chipsEl.innerHTML = `<button class="ad-chip ${vFilter==="all"?"is-active":""}" type="button" data-vf="all">Tất cả <b>${VOUCHERS.length}</b></button>` +
        Object.keys(V_STATUS).map((k) => `<button class="ad-chip ${vFilter===k?"is-active":""}" type="button" data-vf="${k}">${V_STATUS[k].label} <b>${VOUCHERS.filter((v)=>v.status===k).length}</b></button>`).join("");

      const list = VOUCHERS.filter((v) => (vFilter === "all" || v.status === vFilter) && (!vQuery || v.code.toLowerCase().includes(vQuery)));
      rowsEl.innerHTML = list.map((v) => `
        <tr>
          <td><strong style="color:var(--ad-gold);font-family:monospace">${esc(v.code)}</strong></td>
          <td>${v.type === "percent" ? "Phần trăm" : "Cố định"}</td>
          <td>${v.type === "percent" ? v.discount + "%" : money(v.discount)}</td>
          <td>${v.used}/${v.max_uses}</td>
          <td>${esc(v.expires_at)}</td>
          <td>${badge(V_STATUS, v.status)}</td>
          <td class="ad-td-actions">
            <button class="ad-btn ad-btn--sm" type="button" data-va="toggle" data-id="${v.id}">${v.status==="active"?"Tắt":"Bật"}</button>
            <button class="ad-btn ad-btn--sm ad-btn--danger" type="button" data-va="del" data-id="${v.id}">Xóa</button>
          </td>
        </tr>`).join("") || '<tr><td colspan="7"><div class="ad-empty">Không có mã giảm giá nào.</div></td></tr>';
    }

    searchEl?.addEventListener("input", () => { vQuery = searchEl.value.trim().toLowerCase(); renderVouchers(); });
    chipsEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-vf]"); if (b) { vFilter = b.dataset.vf; renderVouchers(); } });
    rowsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-va]"); if (!b) return;
      const idx = VOUCHERS.findIndex((x) => x.id === Number(b.dataset.id)); if (idx === -1) return;
      if (b.dataset.va === "toggle") {
        VOUCHERS[idx].status = VOUCHERS[idx].status === "active" ? "disabled" : "active";
        adToast(`Mã ${VOUCHERS[idx].code}: ${V_STATUS[VOUCHERS[idx].status].label}`);
      } else if (b.dataset.va === "del") {
        VOUCHERS.splice(idx, 1); adToast("Đã xóa mã giảm giá");
      }
      renderVouchers();
    });
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = form.vCode.value.trim().toUpperCase();
      if (!code) { adToast("Vui lòng nhập mã voucher", "error"); return; }
      VOUCHERS.unshift({
        id: Date.now(), code, type: form.vType.value, discount: Number(form.vDiscount.value || 0),
        min_order: Number(form.vMin.value || 0), max_uses: Number(form.vMaxUses.value || 100), used: 0,
        expires_at: form.vExpires.value || "2026-12-31", status: form.vActive.checked ? "active" : "disabled",
      });
      form.reset(); adToast(`Đã tạo mã ${code}`); renderVouchers();
    });
    renderVouchers();
  }

  // ============================================================
  // Trang Bếp trực tiếp (Live Kitchen — đọc /orders)
  // ============================================================
  async function setupKitchen() {
    const grid = document.getElementById("ad-kitchen-grid");
    const chips = document.getElementById("ad-kitchen-chips");
    const refreshBtn = document.getElementById("ad-kitchen-refresh");
    if (!grid) return;

    let kOrders = ORDERS;
    try {
      const res = await api.get("/orders");
      if (Array.isArray(res) && res.length) kOrders = res;
    } catch (_) {}

    let kf = "active";
    function drawKitchen() {
      const pend = kOrders.filter((o) => o.status === "pending");
      const ship = kOrders.filter((o) => o.status === "shipping");
      const active = [...pend, ...ship];
      if (chips) chips.innerHTML = `
        <button class="ad-chip ${kf==="active"?"is-active":""}" type="button" data-kf="active">Đang xử lý <b>${active.length}</b></button>
        <button class="ad-chip ${kf==="pending"?"is-active":""}" type="button" data-kf="pending">Chờ chế biến <b>${pend.length}</b></button>
        <button class="ad-chip ${kf==="shipping"?"is-active":""}" type="button" data-kf="shipping">Đang giao <b>${ship.length}</b></button>`;
      const list = kf === "pending" ? pend : kf === "shipping" ? ship : active;
      grid.innerHTML = list.map((o) => `
        <article class="ad-card">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <strong style="color:var(--ad-gold)">${esc(o.code)}</strong>
            ${badge(ORDER_STATUS, o.status)}
          </div>
          <p style="margin:0 0 8px;font-size:13px">${esc(o.customer_name || o.customer)}</p>
          <p style="margin:0 0 12px;color:var(--ad-gold);font-weight:600">${money(o.total)}</p>
          <button class="ad-btn ad-btn--sm ad-btn--gold" type="button" data-kact="${o.status==="pending"?"shipping":"done"}" data-code="${esc(o.code)}">
            ${o.status === "pending" ? "Xong món & Giao" : "Hoàn tất"}
          </button>
        </article>`).join("") || '<div class="ad-empty" style="grid-column:1/-1">Không có đơn cần xử lý.</div>';
    }
    chips?.addEventListener("click", (e) => { const b = e.target.closest("button[data-kf]"); if (b) { kf = b.dataset.kf; drawKitchen(); } });
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-kact]"); if (!b) return;
      const o = kOrders.find((x) => x.code === b.dataset.code); if (!o) return;
      o.status = b.dataset.kact; adToast(`Đơn ${o.code}: ${ORDER_STATUS[o.status].label}`); drawKitchen();
    });
    refreshBtn?.addEventListener("click", () => { drawKitchen(); adToast("Đã làm mới bếp"); });
    drawKitchen();
  }

  // ============================================================
  // Khởi động theo trang
  // ============================================================
  if (page === "dashboard")  renderDashboard();
  if (page === "analytics")  renderAnalytics();
  if (page === "users")      setupUsers();
  if (page === "products")   setupProducts();
  if (page === "orders")     setupOrders();
  if (page === "kitchen")    setupKitchen();
  if (page === "vouchers")   setupVouchers();
  if (page === "reviews")    setupReviews();
  if (page === "partners")   setupPartners();
  if (page === "promotions") setupPromotions();
  if (page === "feedback")   setupFeedback();
  if (page === "shippers")   setupShippers();
})();
