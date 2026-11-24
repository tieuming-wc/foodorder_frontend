const TOKEN_KEY = "token";
const LOGOUT_REDIRECT_DELAY = 1500;
const profileForm = document.querySelector("#profileForm");
const passwordForm = document.querySelector("#passwordForm");
const toast = document.querySelector("#toast");
let toastTimer;
let currentUser = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function roleLabel(role) {
  const labels = {
    customer: "Khách hàng",
    restaurant: "Nhà hàng",
    shipper: "Shipper",
    admin: "Quản trị viên",
  };
  return labels[role] || role || "Khách hàng";
}

function fillProfile(user) {
  currentUser = user;
  document.querySelector("#fullName").value = user.full_name || "";
  document.querySelector("#email").value = user.email || "";
  document.querySelector("#phone").value = user.phone || "";
  document.querySelector("#role").value = roleLabel(user.role);
  document.querySelector("#sidebarName").textContent =
    user.full_name || "Tài khoản Savoris";
  document.querySelector("#sidebarEmail").textContent = user.email || "";
  document.querySelector("#accountAvatar").textContent =
    (user.full_name || "S").trim().charAt(0).toUpperCase();
  document.querySelector("#accountLoading").hidden = true;
  document.querySelector("#profileSection").hidden = false;
}

async function loadProfile() {
  if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.assign("../index.html?auth=login");
    return;
  }

  try {
    const user = await api.get("/auth/me");
    fillProfile(user);
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign("../index.html?auth=login");
      return;
    }
    document.querySelector("#accountLoading").textContent =
      error.message || "Không thể tải thông tin tài khoản.";
  }
}

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) return;

  const button = document.querySelector("#saveProfile");
  button.disabled = true;

  try {
    const user = await api.put("/auth/me", {
      full_name: document.querySelector("#fullName").value.trim(),
      email: document.querySelector("#email").value.trim(),
      phone: document.querySelector("#phone").value.trim() || null,
    });
    fillProfile(user);
    showToast("Cập nhật thông tin thành công.");
  } catch (error) {
    showToast(error.message || "Không thể cập nhật thông tin.");
  } finally {
    button.disabled = false;
  }
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!passwordForm.reportValidity()) return;

  const newPassword = document.querySelector("#newPassword").value;
  const confirmPassword = document.querySelector("#confirmPassword").value;
  if (newPassword !== confirmPassword) {
    showToast("Mật khẩu xác nhận chưa khớp.");
    return;
  }

  const button = document.querySelector("#savePassword");
  button.disabled = true;

  try {
    await api.put("/auth/me/password", {
      current_password: document.querySelector("#currentPassword").value,
      new_password: newPassword,
    });
    passwordForm.reset();
    showToast("Đổi mật khẩu thành công.");
  } catch (error) {
    showToast(error.message || "Không thể đổi mật khẩu.");
  } finally {
    button.disabled = false;
  }
});

document.querySelectorAll("[data-account-section]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-account-section]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    const section = button.dataset.accountSection;
    document.querySelector("#profileSection").hidden = section !== "profile";
    document.querySelector("#passwordSection").hidden = section !== "password";
    document.querySelector("#ordersSection").hidden = section !== "orders";
    if (section === "orders") loadOrders();
  });
});

async function loadOrders() {
  const list = document.querySelector("#ordersList");
  if (!list) return;
  list.innerHTML = '<p class="muted">Đang tải lịch sử đặt hàng...</p>';

  try {
    const orders = await api.get("/orders");
    if (!orders.length) {
      list.innerHTML = '<p class="muted">Bạn chưa có đơn hàng nào.</p>';
      return;
    }

    list.innerHTML = orders.map((order) => {
      const date = new Date(order.created_at).toLocaleString("vi-VN");
      const itemText = order.items.map((item) =>
        `${item.item_name} × ${item.quantity}`
      ).join(" · ");
      const total = new Intl.NumberFormat("vi-VN").format(order.total_amount);

      return `
        <article class="order-card">
          <div class="order-card-header">
            <h2>Đơn hàng #${order.id}</h2>
            <span class="order-status">${escapeHtml(order.status)}</span>
          </div>
          <p class="muted">${escapeHtml(date)}</p>
          <div class="order-items">${escapeHtml(itemText)}</div>
          <div class="order-card-footer">
            <span>${order.payment_method === "bank" ? "Chuyển khoản" : "Thanh toán khi nhận hàng"}</span>
            <strong>${total}đ</strong>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message || "Không thể tải lịch sử đặt hàng.")}</p>`;
  }
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function openLogoutDialog() {
  document.querySelector("#logoutModal").hidden = false;
}

function closeLogoutDialog() {
  document.querySelector("#logoutModal").hidden = true;
}

async function logout() {
  const confirmButton = document.querySelector("#confirmLogout");
  const cancelButton = document.querySelector("#cancelLogout");
  confirmButton.disabled = true;
  cancelButton.disabled = true;

  try {
    await api.post("/auth/logout", {});
  } catch (error) {
    console.warn("Logout API error; clearing the local session:", error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("savoris-cart");
    sessionStorage.removeItem("savoris-return-url");
    showToast("Đăng xuất thành công.");
    window.setTimeout(() => {
      window.location.assign("../index.html");
    }, LOGOUT_REDIRECT_DELAY);
  }
}

document.querySelector("#headerLogout")?.addEventListener("click", openLogoutDialog);
document.querySelector("#cancelLogout")?.addEventListener("click", closeLogoutDialog);
document.querySelector("#confirmLogout")?.addEventListener("click", logout);
document.querySelector("#logoutModal")?.addEventListener("click", (event) => {
  if (event.target.id === "logoutModal") closeLogoutDialog();
});

loadProfile();
