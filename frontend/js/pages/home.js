const homePage = document.querySelector("#homePage");
const authPage = document.querySelector("#authPage");
const authTitle = document.querySelector("#authTitle");
const authSubtitle = document.querySelector("#authSubtitle");
const authSwitch = document.querySelector("#authSwitch");
const submitButton = document.querySelector("#submitButton");
const authForm = document.querySelector("#authForm");
const toast = document.querySelector("#toast");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const favoriteDishes = document.querySelector("#favoriteDishes");
const favoriteSubtitle = document.querySelector("#favoriteSubtitle");

const RETURN_URL_KEY = "savoris-return-url";
const ITEMS_PAGE_URL = "./pages/items.html";
const CART_KEY = "savoris-cart";
const TOAST_DURATION = 2500;
const AUTH_REDIRECT_DELAY = 1500;
const AUTH_TOKEN_KEY = "token";

let isSignup = false;
let toastTimer;
let redirectTimer;
let currentUser = null;
let authCheckPending = true;
let isLoggingOut = false;

function showToast(message) {
  console.log("Toast:", message);

  if (!toast) {
    window.alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, TOAST_DURATION);
}

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    if (!Array.isArray(cart)) return 0;

    const validCart = cart.filter((item) => {
      const id = Number(item?.id);
      const quantity = Number(item?.quantity);
      return Number.isInteger(id) && id > 0 && Number.isInteger(quantity) && quantity > 0;
    });
    if (validCart.length !== cart.length) {
      localStorage.setItem(CART_KEY, JSON.stringify(validCart));
    }

    return validCart.reduce((total, item) => total + Number(item.quantity), 0);
  } catch {
    return 0;
  }
}

function updateCartCount() {
  const element = document.querySelector("#cartCount");

  if (element) {
    element.textContent = String(getCartCount());
  }
}

async function validateCartItems() {
  try {
    const menuItems = await api.get("/items");
    const validIds = new Set(
      menuItems
        .filter((item) => item.is_available !== false)
        .map((item) => Number(item.id)),
    );
    const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const cart = Array.isArray(savedCart) ? savedCart : [];
    const validCart = cart.filter((item) => validIds.has(Number(item?.id)));

    if (validCart.length !== cart.length || !Array.isArray(savedCart)) {
      localStorage.setItem(CART_KEY, JSON.stringify(validCart));
    }
    updateCartCount();
  } catch (error) {
    console.error("Could not validate saved cart against menu:", error);
  }
}

function getSafeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function renderPopularDishes(popularDishes) {
  if (!favoriteDishes || popularDishes.length === 0) return;

  const cards = popularDishes.map(({ item, sold_quantity }, index) => {
    const card = document.createElement("article");
    card.className = "dish-card";

    const image = document.createElement("img");
    const imageUrl = getSafeImageUrl(item.image_url);
    if (imageUrl) {
      image.src = imageUrl;
    } else {
      image.hidden = true;
    }
    image.alt = item.name;
    card.appendChild(image);

    const info = document.createElement("div");
    info.className = "dish-info";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = `SAVORIS KITCHEN · ${item.delivery_time || "25–35 phút"}${
      index === 0 ? " · BÁN CHẠY NHẤT" : ""
    }`;
    info.appendChild(eyebrow);

    const name = document.createElement("h3");
    name.textContent = item.name;
    info.appendChild(name);

    const rating = document.createElement("p");
    rating.className = "dish-rating";
    rating.textContent = `★ ${Number(item.rating).toFixed(1)} · Đã mua ${sold_quantity} phần`;
    info.appendChild(rating);

    const bottom = document.createElement("div");
    bottom.className = "dish-bottom";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `${new Intl.NumberFormat("vi-VN").format(Number(item.price))}đ`;
    bottom.appendChild(price);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-button";
    addButton.dataset.itemId = String(item.id);
    addButton.setAttribute("aria-label", `Thêm ${item.name} vào giỏ hàng`);
    addButton.textContent = "+";
    bottom.appendChild(addButton);

    info.appendChild(bottom);
    card.appendChild(info);
    return card;
  });

  favoriteDishes.replaceChildren(...cards);
  if (favoriteSubtitle) {
    favoriteSubtitle.textContent =
      "Xếp theo số lượng đã đặt · món bán chạy nhất đứng đầu.";
  }
}

async function loadPopularDishes() {
  try {
    const popularDishes = await api.get("/items/popular");
    if (Array.isArray(popularDishes)) {
      renderPopularDishes(popularDishes);
    }
  } catch (error) {
    console.error("Could not load popular dishes:", error);
  }
}

async function refreshAuthState() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    currentUser = null;
    authCheckPending = false;
    updateAuthButtons();
    return;
  }

  try {
    const response = await api.get("/auth/me");
    currentUser = response?.user ?? response;
  } catch (error) {
    console.error("Auth check failed:", error);
    currentUser = null;

    if (error.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  authCheckPending = false;
  updateAuthButtons();
}

function updateAuthButtons() {
  document.querySelectorAll(".login-open").forEach((button) => {
    button.textContent =
      isLoggingOut
        ? "Đang đăng xuất..."
        : currentUser
          ? "Tài khoản"
          : "Đăng nhập";

    button.disabled = authCheckPending || isLoggingOut;
  });
}

function showAuth(mode = "login") {
  if (!homePage || !authPage) return;

  isSignup = mode === "signup";
  homePage.hidden = true;
  authPage.hidden = false;
  updateAuthMode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  if (!homePage || !authPage) return;

  authPage.hidden = true;
  homePage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveAuthResponse(data) {
  const token = data?.access_token ?? data?.token;

  if (!token) {
    console.error("Login response:", data);
    throw new Error("Phản hồi API không có access_token.");
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  currentUser = data.user ?? null;
  if (currentUser) {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }
}

async function completeAuthentication() {
  const email = document.querySelector("#email")?.value.trim();
  const password = document.querySelector("#password")?.value;

  if (!email || !password) {
    showToast("Vui lòng nhập email và mật khẩu.");
    return;
  }

  try {
    const response = isSignup
      ? await api.post("/auth/register", {
          full_name: document.querySelector("#fullName")?.value.trim(),
          phone: document.querySelector("#phone")?.value.trim(),
          email,
          password,
        })
      : await api.post("/auth/login", {
          email,
          password,
        });

    saveAuthResponse(response);

    if (!currentUser) {
      try {
        const me = await api.get("/auth/me");
        currentUser = me?.user ?? me;
        if (currentUser) {
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (error) {
        console.warn("Không thể lấy thông tin user:", error);
      }
    }

    authCheckPending = false;
    updateAuthButtons();
    showToast(isSignup ? "Đăng ký thành công." : "Đăng nhập thành công.");

    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);

    const isAdminUser = String(currentUser?.role || "").toUpperCase() === "ADMIN";
    const targetUrl = isAdminUser ? "./admin/index.html" : (returnUrl || ITEMS_PAGE_URL);

    window.clearTimeout(redirectTimer);
    redirectTimer = window.setTimeout(() => {
      window.location.assign(targetUrl);
    }, AUTH_REDIRECT_DELAY);
  } catch (error) {
    console.error("Authentication error:", error);
    showToast(error.message || "Không thể thực hiện xác thực.");
  }
}

function openLogoutModal() {
  const logoutModal = document.querySelector("#logoutModal");
  if (logoutModal) logoutModal.hidden = false;
}

function cancelLogout() {
  const logoutModal = document.querySelector("#logoutModal");
  if (logoutModal) logoutModal.hidden = true;
}

async function logout() {
  if (isLoggingOut) return;

  const confirmButton = document.querySelector("#confirmLogout");
  const cancelButton = document.querySelector("#cancelLogout");

  isLoggingOut = true;
  updateAuthButtons();

  if (confirmButton) confirmButton.disabled = true;
  if (cancelButton) cancelButton.disabled = true;

  showToast("Đang đăng xuất...");

  let resultMessage = "Đăng xuất thành công.";

  try {
    await api.post("/auth/logout", {});
  } catch (error) {
    console.warn("Logout API error:", error);
  } finally {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CART_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    currentUser = null;
    isLoggingOut = false;
    updateCartCount();

    cancelLogout();
    updateAuthButtons();

    if (confirmButton) confirmButton.disabled = false;
    if (cancelButton) cancelButton.disabled = false;

    showToast(resultMessage);

    window.setTimeout(() => {
      showHome();
    }, AUTH_REDIRECT_DELAY);
  }
}

function updateAuthMode() {
  if (!authTitle || !authSubtitle || !submitButton || !authSwitch) return;

  authTitle.textContent = isSignup
    ? "Bắt đầu hành trình vị giác."
    : "Chào mừng trở lại.";

  authSubtitle.textContent = isSignup
    ? "Tạo tài khoản, nhận ưu đãi dành riêng cho bạn."
    : "Đăng nhập để tiếp tục tận hưởng cùng Savoris.";

  document.querySelectorAll(".signup-only").forEach((element) => {
    element.hidden = !isSignup;

    const input = element.querySelector("input");
    if (input) input.required = isSignup;
  });

  document.querySelectorAll(".login-only").forEach((element) => {
    element.hidden = isSignup;
  });

  const passwordInput = document.querySelector("#password");

  if (passwordInput) {
    passwordInput.autocomplete = isSignup
      ? "new-password"
      : "current-password";
  }

  submitButton.innerHTML = isSignup
    ? 'Tạo tài khoản <span aria-hidden="true">→</span>'
    : 'Đăng nhập <span aria-hidden="true">→</span>';

  authSwitch.innerHTML = isSignup
    ? 'Đã có tài khoản? <button type="button" id="modeSwitch">Đăng nhập</button>'
    : 'Chưa có tài khoản? <button type="button" id="modeSwitch">Đăng ký ngay</button>';
}

document.querySelectorAll(".login-open").forEach((button) => {
  button.addEventListener("click", () => {
    if (authCheckPending || isLoggingOut) return;

    if (currentUser) {
      window.location.assign("./pages/account.html");
      return;
    }

    sessionStorage.setItem(RETURN_URL_KEY, ITEMS_PAGE_URL);
    showAuth("login");
  });
});

document.querySelectorAll("[data-home]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
  });
});

authSwitch?.addEventListener("click", (event) => {
  if (event.target.closest("#modeSwitch")) {
    isSignup = !isSignup;
    updateAuthMode();
  }
});

document.querySelectorAll(".role-option").forEach((button) => {
  button.addEventListener("click", () => {
    showToast("Vai trò tài khoản do hệ thống phân quyền.");
  });
});

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";

    button.setAttribute(
      "aria-label",
      showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
    );
  });
});

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!authForm.reportValidity()) return;

  if (isSignup) {
    const password = document.querySelector("#password")?.value;
    const confirmPassword =
      document.querySelector("#confirmPassword")?.value;
    const termsAccepted = document.querySelector("#terms")?.checked;

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    if (!termsAccepted) {
      showToast("Vui lòng đồng ý với điều khoản và chính sách bảo mật.");
      return;
    }
  }

  if (submitButton) submitButton.disabled = true;

  try {
    await completeAuthentication();
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

document.querySelector("#forgotPassword")?.addEventListener("click", (event) => {
  event.preventDefault();
  showToast("Tính năng khôi phục mật khẩu sẽ sớm có mặt.");
});

document.querySelector("#googleButton")?.addEventListener("click", () => {
  showToast("Đăng nhập Google cần được kết nối với hệ thống xác thực.");
});

favoriteDishes?.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest(".add-button");
  if (!(button instanceof HTMLButtonElement)) return;

  if (authCheckPending) return;

  if (!currentUser) {
    sessionStorage.setItem(RETURN_URL_KEY, ITEMS_PAGE_URL);
    showAuth("login");
    showToast("Vui lòng đăng nhập để thêm món vào giỏ hàng.");
    return;
  }

  const dishName = button.closest(".dish-card")?.querySelector("h3")?.textContent.trim();
  if (!dishName) return;

  button.disabled = true;
  try {
    const menuItems = await api.get("/items");
    const menuItem = menuItems.find((item) =>
      button.dataset.itemId
        ? Number(item.id) === Number(button.dataset.itemId)
        : item.name === dishName,
    );
    if (!menuItem) {
      showToast("Món này hiện không có trong thực đơn.");
      return;
    }

    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const items = Array.isArray(cart)
      ? cart.filter((item) =>
          Number.isInteger(Number(item?.id)) &&
          Number(item.id) > 0 &&
          Number.isInteger(Number(item?.quantity)) &&
          Number(item.quantity) > 0
        )
      : [];
    const existing = items.find((item) => Number(item.id) === menuItem.id);
    if (existing) {
      existing.quantity = Number(existing.quantity) + 1;
    } else {
      items.push({ id: menuItem.id, quantity: 1 });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount();
    showToast(`Đã thêm ${menuItem.name} vào giỏ hàng.`);
  } catch (error) {
    showToast(error.message || "Không thể thêm món vào giỏ hàng.");
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#cartButton")?.addEventListener("click", () => {
  if (authCheckPending) {
    showToast("Đang kiểm tra đăng nhập. Vui lòng thử lại.");
    return;
  }

  if (!currentUser) {
    sessionStorage.setItem(RETURN_URL_KEY, `${ITEMS_PAGE_URL}#cart`);
    showAuth("login");
    showToast("Vui lòng đăng nhập để xem giỏ hàng.");
    return;
  }

  window.location.assign(`${ITEMS_PAGE_URL}#cart`);
});

menuToggle?.addEventListener("click", () => {
  if (!mainNav) return;

  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#cancelLogout")?.addEventListener("click", cancelLogout);

document.querySelector("#confirmLogout")?.addEventListener("click", logout);

document.querySelector("#logoutModal")?.addEventListener("click", (event) => {
  if (event.target.id === "logoutModal") {
    cancelLogout();
  }
});

const params = new URLSearchParams(window.location.search);

if (params.get("auth") === "login") {
  showAuth("login");
}

if (params.get("logout") === "true") {
  showHome();
  openLogoutModal();
}

updateCartCount();
refreshAuthState();
validateCartItems();
loadPopularDishes();