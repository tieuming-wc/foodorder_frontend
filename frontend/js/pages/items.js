let products = [];

const PAGE_SIZE = 8;
const SHIPPING_FEE = 30000;
const RETURN_URL_KEY = "savoris-return-url";
const HOME_PAGE_URL = "../index.html";
const AUTH_TOKEN_KEY = "token";
const CART_KEY = "savoris-cart";

const menuGrid = document.querySelector("#menuGrid");
const pagination = document.querySelector("#pagination");
const toast = document.querySelector("#toast");

let selectedCategory = "Tất cả";
let searchQuery = "";
let currentPage = 1;
let activeCoupon = "";
let selectedProductId = null;
let toastTimer;
let searchTimer;
let currentUser = null;
let authCheckPending = true;
let isLoggingOut = false;
let productsLoading = false;
let productsError = "";
let productRequestId = 0;
let productsLoaded = false;
let sortMode = 0;
let priceFilter = 0;
let recommendedOnly = false;

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value, window.location.href);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return "";
  }

  return "";
}

function formatPrice(amount) {
  const price = Number(amount);

  return `${new Intl.NumberFormat("vi-VN").format(
    Number.isFinite(price) ? price : 0,
  )}đ`;
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function normalizeProduct(item) {
  return {
    id: item.id,
    name: item.name ?? "Món ăn",
    description: item.description ?? "",
    price: Number(item.price ?? 0),
    category: item.category ?? item.category_name ?? "Chưa phân loại",
    image: item.image ?? item.image_url ?? null,
    deliveryTime: item.delivery_time ?? "25–35 phút",
    rating: Number(item.rating ?? 0),
  };
}

async function refreshAuthState() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    currentUser = null;
    authCheckPending = false;
    updateAuthButtons();
    openCartFromUrlIfRequested();
    return;
  }

  try {
    const response = await api.get("/auth/me");
    currentUser = response?.user ?? response;
    const nameInput = document.querySelector("#recipientName");
    const phoneInput = document.querySelector("#recipientPhone");
    if (nameInput && !nameInput.value) nameInput.value = currentUser.full_name || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || "";
  } catch (error) {
    currentUser = null;

    if (error.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  authCheckPending = false;
  updateAuthButtons();
  openCartFromUrlIfRequested();
}

function updateAuthButtons() {
  document.querySelectorAll(".auth-button, #loginButton").forEach((button) => {
    button.textContent = currentUser ? "Tài khoản" : "Đăng nhập";
    button.disabled = authCheckPending || isLoggingOut;
  });
}

function redirectToLogin(returnUrl) {
  sessionStorage.setItem(
    RETURN_URL_KEY,
    returnUrl ||
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );

  window.location.assign(`${HOME_PAGE_URL}?auth=login`);
}

function handleAuthButtonClick() {
  if (authCheckPending || isLoggingOut) return;

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  window.location.assign("./account.html");
}

async function loadProducts(query = "") {
  const requestId = ++productRequestId;

  productsLoading = true;
  productsError = "";
  renderMenu();

  try {
    const response = await api.get(
      "/items",
      query ? { q: query } : undefined,
    );

    if (requestId !== productRequestId) return;

    if (!Array.isArray(response)) {
      throw new Error("Dữ liệu danh sách món ăn không đúng định dạng.");
    }

    products = response.map(normalizeProduct);
    if (!query) {
      productsLoaded = true;
      const cleanCart = getCart();
      localStorage.setItem(CART_KEY, JSON.stringify(cleanCart));
    }
  } catch (error) {
    if (requestId !== productRequestId) return;

    products = [];
    productsError = error.message || "Không thể tải danh sách món ăn.";
  } finally {
    if (requestId === productRequestId) {
      productsLoading = false;
      currentPage = 1;
      renderMenu();
      renderCart();
      updateCartCounts();
    }
  }
}

function getCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("savoris-cart") || "[]");
    if (!Array.isArray(savedCart)) return [];

    const cartById = new Map();
    savedCart.forEach((item) => {
      const id = Number(item?.id);
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1) {
        return;
      }
      if (productsLoaded && !products.some((product) => product.id === id)) return;
      cartById.set(id, (cartById.get(id) || 0) + quantity);
    });

    return [...cartById].map(([id, quantity]) => ({ id, quantity }));
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("savoris-cart", JSON.stringify(cart));
  updateCartCounts();
  renderCart();
}

function getCartQuantity() {
  return getCart().reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

function updateCartCounts() {
  const count = getCartQuantity();

  document
    .querySelectorAll("#menuCartCount, .detailCartCount, .cartCount")
    .forEach((element) => {
      element.textContent = count;
    });
}

function getFilteredProducts() {
  const query = searchQuery.toLocaleLowerCase("vi");

  return products.filter((product) => {
    const categoryText = product.category ?? "";
    const matchesCategory =
      selectedCategory === "Tất cả" ||
      categoryText === selectedCategory;
    const matchesPrice =
      priceFilter === 0 ||
      (priceFilter === 1 && product.price < 150000) ||
      (priceFilter === 2 && product.price >= 150000 && product.price < 300000) ||
      (priceFilter === 3 && product.price >= 300000);
    const matchesRecommendation = !recommendedOnly || product.rating >= 4.8;

    const matchesSearch =
      !query ||
      product.name.toLocaleLowerCase("vi").includes(query) ||
      categoryText.toLocaleLowerCase("vi").includes(query) ||
      product.description.toLocaleLowerCase("vi").includes(query);

    return matchesCategory && matchesPrice && matchesRecommendation && matchesSearch;
  }).sort((first, second) => {
    if (sortMode === 1) return first.price - second.price;
    if (sortMode === 2) return second.rating - first.rating;

    const firstMinutes = Number.parseInt(first.deliveryTime, 10) || Number.MAX_SAFE_INTEGER;
    const secondMinutes = Number.parseInt(second.deliveryTime, 10) || Number.MAX_SAFE_INTEGER;
    return firstMinutes - secondMinutes;
  });
}

function renderMenu() {
  if (!menuGrid || !pagination) return;

  menuGrid.innerHTML = "";
  pagination.innerHTML = "";

  if (productsLoading) {
    menuGrid.innerHTML =
      '<p class="cart-empty">Đang tải danh sách món ăn...</p>';
    return;
  }

  if (productsError) {
    menuGrid.innerHTML =
      `<p class="cart-empty">${escapeHtml(productsError)}</p>`;
    return;
  }

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  if (totalPages === 0) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = filteredProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  if (pageProducts.length === 0) {
    menuGrid.innerHTML =
      '<p class="cart-empty">Không tìm thấy món ăn phù hợp.</p>';
  } else {
    pageProducts.forEach((product) => {
      const card = document.createElement("article");
      card.className = "menu-card";

      const productId = escapeHtml(String(product.id ?? ""));
      const productName = escapeHtml(product.name);
      const productImage = safeImageUrl(product.image);
      const categoryLabel = product.category || "Chưa phân loại";

      let allergyWarn = "";
      try {
        const prof = JSON.parse(localStorage.getItem("savoris-taste-profile") || "{}");
        const hay = `${product.name} ${product.description || ""} ${categoryLabel}`.toLowerCase();
        const rules = {
          "Hải sản": ["cá hồi", "tôm", "mực", "hải sản", "cua"],
          "Đậu phộng": ["đậu phộng", "lạc"],
          "Sữa & Phô mai": ["phô mai", "kem", "burrata", "mascarpone", "tiramisu", "bơ"],
          "Gluten / Bột mì": ["mỳ", "mì", "pizza", "bánh mì", "tart"],
        };
        const hits = (prof.allergies || []).filter((a) => (rules[a] || []).some((kw) => hay.includes(kw)));
        if (hits.length) {
          allergyWarn = `<p style="margin:6px 0 0;font-size:10.5px;color:#e2726a;letter-spacing:.03em">⚠ Lưu ý dị ứng: ${escapeHtml(hits.join(", "))}</p>`;
        }
      } catch (_) {}

      const imageMarkup = productImage
        ? `<img
            src="${escapeHtml(productImage)}"
            alt="${productName}"
            style="width:100%;height:100%;object-fit:cover"
            loading="lazy"
          />`
        : '<span class="cart-empty">Chưa có hình ảnh</span>';

      card.innerHTML = `
        <button
          class="menu-card-image"
          type="button"
          data-action="detail"
          data-id="${productId}"
          aria-label="Xem ${productName}"
        >
          ${imageMarkup}
        </button>

        <div class="menu-card-info">
          <p class="eyebrow">
            SAVORIS KITCHEN · ${escapeHtml(categoryLabel)}
          </p>
          <h2>${productName}</h2>
          <p class="menu-card-meta">
            ${escapeHtml(product.description || "Chưa có mô tả")}
          </p>
          ${allergyWarn}

          <div class="menu-card-bottom">
            <strong class="menu-card-price">${formatPrice(product.price)}</strong>
            <button
              class="menu-card-add"
              type="button"
              data-action="add"
              data-id="${productId}"
              aria-label="Thêm ${productName} vào giỏ"
            >+</button>
          </div>
        </div>
      `;

      menuGrid.appendChild(card);
    });
  }

  renderPagination(totalPages);

  const countElement = document.querySelector("#dishCount");
  if (countElement) {
    countElement.textContent = `${filteredProducts.length} món ngon`;
  }
}

function renderPagination(totalPages) {
  if (!pagination || totalPages <= 1) return;

  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "←";
  previous.disabled = currentPage === 1;
  previous.setAttribute("aria-label", "Trang trước");

  previous.addEventListener("click", () => {
    currentPage -= 1;
    renderMenu();
  });

  pagination.appendChild(previous);

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(page);
    button.classList.toggle("active", page === currentPage);
    button.setAttribute("aria-label", `Trang ${page}`);

    button.addEventListener("click", () => {
      currentPage = page;
      renderMenu();
    });

    pagination.appendChild(button);
  }

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "→";
  next.disabled = currentPage === totalPages;
  next.setAttribute("aria-label", "Trang tiếp");

  next.addEventListener("click", () => {
    currentPage += 1;
    renderMenu();
  });

  pagination.appendChild(next);
}

function renderProductDetail(productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId),
  );

  if (!product) {
    showToast("Không tìm thấy thông tin món ăn.");
    return false;
  }

  const detailPage = document.querySelector("#detailPage");
  if (!detailPage) return false;

  const image = detailPage.querySelector(".detail-image");
  const title = detailPage.querySelector(".detail-info h1");
  const price = detailPage.querySelector(".detail-price");
  const description = detailPage.querySelector(".detail-description");
  const eyebrow = detailPage.querySelector(".detail-info .eyebrow");
  const breadcrumbTitle =
    detailPage.querySelector(".breadcrumb span:last-child");
  const metaItems = detailPage.querySelectorAll(".detail-meta span");

  if (title) title.textContent = product.name;
  if (price) price.textContent = formatPrice(product.price);
  if (description) {
    description.textContent =
      product.description || "Chưa có mô tả cho món ăn này.";
  }

  if (eyebrow) {
    eyebrow.textContent =
      `SAVORIS KITCHEN · ${product.category || "MÓN ĂN"}`;
  }

  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = product.name;
  }

  if (metaItems[0]) {
    metaItems[0].textContent =
      product.rating > 0
        ? `★ ${product.rating.toFixed(1)}`
        : "Chưa có đánh giá";
  }
  if (metaItems[1]) {
    metaItems[1].textContent = product.deliveryTime;
  }

  if (image) {
    const imageUrl = safeImageUrl(product.image);

    if (imageUrl) {
      image.src = imageUrl;
      image.alt = product.name;
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute("src");
      image.alt = "";
    }
  }

  return true;
}

function addToCart(productId, quantity = 1) {
  if (authCheckPending) {
    showToast("Đang kiểm tra trạng thái đăng nhập. Vui lòng thử lại.");
    return;
  }

  if (!currentUser) {
    showToast("Vui lòng đăng nhập để thêm món vào giỏ hàng.");
    redirectToLogin();
    return;
  }

  const product = products.find(
    (item) => String(item.id) === String(productId),
  );

  if (!product) return;

  const cart = getCart();
  const existingItem = cart.find(
    (item) => String(item.id) === String(productId),
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  saveCart(cart);
  showToast(`Đã thêm ${product.name} vào giỏ.`);
}

function renderCart() {
  const cartItemsList = document.querySelector("#cartItemsList");
  if (!cartItemsList) return;

  const cart = getCart();
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    cartItemsList.innerHTML =
      '<p class="cart-empty">Giỏ hàng đang trống. Hãy chọn món bạn yêu thích nhé!</p>';
  } else {
    cart.forEach((cartItem) => {
      const product = products.find(
        (item) => String(item.id) === String(cartItem.id),
      );

      if (!product) return;

      const itemElement = document.createElement("article");
      itemElement.className = "cart-item";

      const productImage = safeImageUrl(product.image);
      const imageMarkup = productImage
        ? `<img src="${escapeHtml(productImage)}" alt="${escapeHtml(product.name)}" />`
        : "";

      itemElement.innerHTML = `
        ${imageMarkup}
        <div class="cart-item-main">
          <h2>${escapeHtml(product.name)}</h2>
          <p class="cart-item-dish">
            ${escapeHtml(product.category || "Chưa phân loại")} · Savoris Kitchen
          </p>
          <strong>${formatPrice(product.price)}</strong>
        </div>
        <div class="cart-item-controls">
          <button
            type="button"
            data-cart-action="decrease"
            data-id="${escapeHtml(String(product.id))}"
            aria-label="Giảm số lượng ${escapeHtml(product.name)}"
          >−</button>
          <span class="item-quantity">${Number(cartItem.quantity) || 0}</span>
          <button
            type="button"
            data-cart-action="increase"
            data-id="${escapeHtml(String(product.id))}"
            aria-label="Tăng số lượng ${escapeHtml(product.name)}"
          >+</button>
          <button
            type="button"
            data-cart-action="remove"
            data-id="${escapeHtml(String(product.id))}"
            aria-label="Xóa ${escapeHtml(product.name)} khỏi giỏ"
          >×</button>
        </div>
      `;

      cartItemsList.appendChild(itemElement);
    });
  }

  renderTotals();
}

function calculateDiscount(subtotal) {
  if (activeCoupon === "SAVORIS10") {
    return Math.min(Math.round(subtotal * 0.1), 200000);
  }

  if (activeCoupon === "WELCOME15" && subtotal >= 300000) {
    return Math.min(Math.round(subtotal * 0.15), 300000);
  }

  return 0;
}

function renderTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((total, item) => {
    const product = products.find(
      (dish) => String(dish.id) === String(item.id),
    );

    return product
      ? total + product.price * (Number(item.quantity) || 0)
      : total;
  }, 0);

  const discount = calculateDiscount(subtotal);
  const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const subtotalElement = document.querySelector("#subtotal");
  const shippingElement = document.querySelector("#shippingFee");
  const discountElement = document.querySelector("#discountAmount");
  const totalElement = document.querySelector("#cartTotal");

  if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
  if (shippingElement) shippingElement.textContent = formatPrice(shipping);

  if (discountElement) {
    discountElement.textContent = `−${formatPrice(discount)}`;
  }

  if (totalElement) {
    totalElement.textContent = formatPrice(total);
  }

  const status = document.querySelector("#couponStatus");

  if (status) {
    if (activeCoupon && discount > 0) {
      status.textContent =
        `Đã áp dụng ${activeCoupon}: giảm ${formatPrice(discount)}.`;
    } else if (activeCoupon === "WELCOME15" && subtotal < 300000) {
      status.textContent = "Mã WELCOME15 áp dụng cho đơn từ 300.000đ.";
    } else {
      status.textContent = "";
    }
  }
}

function changeCartQuantity(productId, amount) {
  const cart = getCart();
  const item = cart.find(
    (entry) => String(entry.id) === String(productId),
  );

  if (!item) return;

  item.quantity += amount;

  const updatedCart = cart.filter(
    (entry) => Number(entry.quantity) > 0,
  );

  saveCart(updatedCart);
}

function removeFromCart(productId) {
  const updatedCart = getCart().filter(
    (item) => String(item.id) !== String(productId),
  );

  saveCart(updatedCart);
  showToast("Đã xóa món khỏi giỏ hàng.");
}

function showPage(pageName) {
  if (pageName === "cart") {
    if (authCheckPending) {
      showToast("Đang kiểm tra đăng nhập. Vui lòng thử lại.");
      return;
    }

    if (!currentUser) {
      showToast("Vui lòng đăng nhập để xem giỏ hàng.");
      redirectToLogin(`${window.location.pathname}#cart`);
      return;
    }
  }

  const pages = {
    menu: document.querySelector("#menuPage"),
    detail: document.querySelector("#detailPage"),
    cart: document.querySelector("#cartPage"),
  };

  Object.entries(pages).forEach(([name, page]) => {
    if (page) page.hidden = name !== pageName;
  });

  if (pageName === "cart") {
    renderCart();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openCartFromUrlIfRequested() {
  if (window.location.hash === "#cart" && !authCheckPending) {
    showPage("cart");
  }
}

document.querySelectorAll(".auth-button, #loginButton").forEach((button) => {
  button.addEventListener("click", handleAuthButtonClick);
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const pageLink = event.target.closest("[data-page]");

  if (pageLink) {
  event.preventDefault();
  showPage(pageLink.dataset.page);
}

  const menuAction = event.target.closest("[data-action]");

  if (menuAction) {
    const { action, id } = menuAction.dataset;

    if (action === "add") {
      addToCart(id);
    }

    if (action === "detail") {
      if (renderProductDetail(id)) {
        selectedProductId = id;
        showPage("detail");
      }
    }
  }

  const cartAction = event.target.closest("[data-cart-action]");

  if (cartAction) {
    const { cartAction: action, id } = cartAction.dataset;

    if (action === "increase") changeCartQuantity(id, 1);
    if (action === "decrease") changeCartQuantity(id, -1);
    if (action === "remove") removeFromCart(id);
  }
});

document.querySelector("#searchForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  searchQuery =
    document.querySelector("#searchInput")?.value.trim() || "";
  currentPage = 1;
  renderMenu();
});

document.querySelector("#searchInput")?.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim();

  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    currentPage = 1;
    renderMenu();
  }, 300);
});

document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) return;

    document.querySelectorAll(".category").forEach((categoryButton) => {
      categoryButton.classList.remove("active");
    });

    button.classList.add("active");
    selectedCategory = button.dataset.category || "Tất cả";
    currentPage = 1;
    renderMenu();
  });
});

document.querySelector("#applyCoupon")?.addEventListener("submit", (event) => {
  event.preventDefault();
});

document.querySelector("#applyCoupon")?.addEventListener("click", () => {
  const couponInput = document.querySelector("#couponInput");
  const coupon = couponInput?.value.trim().toUpperCase() || "";

  if (coupon === "SAVORIS10" || coupon === "WELCOME15") {
    activeCoupon = coupon;
    renderTotals();

    const subtotal = getCart().reduce((total, item) => {
      const product = products.find(
        (dish) => String(dish.id) === String(item.id),
      );

      return product
        ? total + product.price * (Number(item.quantity) || 0)
        : total;
    }, 0);

    if (coupon === "WELCOME15" && subtotal < 300000) {
      showToast("Mã WELCOME15 áp dụng cho đơn hàng từ 300.000đ.");
    } else {
      showToast(`Áp dụng mã ${coupon} thành công.`);
    }

    return;
  }

  activeCoupon = "";
  renderTotals();
  showToast("Mã giảm giá không hợp lệ.");
});

document.querySelector("#increaseQuantity")?.addEventListener("click", () => {
  const quantityElement = document.querySelector("#detailQuantity");

  if (quantityElement) {
    quantityElement.textContent = String(
      Number(quantityElement.textContent) + 1,
    );
  }
});

document.querySelector("#decreaseQuantity")?.addEventListener("click", () => {
  const quantityElement = document.querySelector("#detailQuantity");

  if (quantityElement) {
    quantityElement.textContent = String(
      Math.max(1, Number(quantityElement.textContent) - 1),
    );
  }
});

document.querySelector("#addDetailToCart")?.addEventListener("click", () => {
  const quantityElement = document.querySelector("#detailQuantity");
  const quantity = quantityElement
    ? Number(quantityElement.textContent) || 1
    : 1;

  if (selectedProductId !== null) {
    addToCart(selectedProductId, quantity);
  } else {
    showToast("Vui lòng chọn món trước.");
  }
});

document.querySelector("#checkoutButton")?.addEventListener("click", () => {
  if (authCheckPending) {
    showToast("Đang kiểm tra trạng thái đăng nhập. Vui lòng thử lại.");
    return;
  }

  if (!currentUser) {
    showToast("Vui lòng đăng nhập để tiếp tục thanh toán.");
    redirectToLogin();
    return;
  }

  if (getCart().length === 0) {
    showToast("Giỏ hàng đang trống.");
    return;
  }

  const form = document.querySelector("#checkoutForm");
  if (!form?.reportValidity()) return;

  const button = document.querySelector("#checkoutButton");
  const originalLabel = button ? button.innerHTML : "";
  if (button) {
    button.disabled = true;
    button.innerHTML = 'Đang xử lý đơn…';
  }

  api.post("/orders", {
    recipient_name: document.querySelector("#recipientName")?.value.trim(),
    phone_number: document.querySelector("#recipientPhone")?.value.trim(),
    address_line: document.querySelector("#deliveryAddress")?.value.trim(),
    note: document.querySelector("#orderNote")?.value.trim() || null,
    coupon_code: activeCoupon || null,
    payment_method: document.querySelector("#paymentMethod")?.value || "cod",
    items: getCart().map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
    })),
  }).then((order) => {
    saveCart([]);
    activeCoupon = "";
    form.reset();
    showToast(`Đặt hàng thành công. Mã đơn ${order.code || "#" + order.id}.`);
  }).catch((error) => {
    showToast(error.message || "Không thể tạo đơn hàng.");
  }).finally(() => {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  });
});

document.querySelector("#sortButton")?.addEventListener("click", (event) => {
  sortMode = (sortMode + 1) % 3;
  event.currentTarget.innerHTML = [
    'Giao nhanh <span>⌄</span>',
    'Giá thấp trước <span>⌄</span>',
    'Đánh giá cao <span>⌄</span>',
  ][sortMode];
  renderMenu();
});

document.querySelector("#filterButton")?.addEventListener("click", (event) => {
  priceFilter = (priceFilter + 1) % 4;
  event.currentTarget.innerHTML = [
    'Khoảng giá: tất cả <span>⌄</span>',
    'Dưới 150.000đ <span>⌄</span>',
    '150.000–300.000đ <span>⌄</span>',
    'Từ 300.000đ <span>⌄</span>',
  ][priceFilter];
  currentPage = 1;
  renderMenu();
});

document.querySelector("#ratingButton")?.addEventListener("click", (event) => {
  recommendedOnly = !recommendedOnly;
  event.currentTarget.innerHTML = recommendedOnly
    ? 'Đánh giá từ 4.8 ★ <span>⌄</span>'
    : 'Đề xuất cho bạn <span>⌄</span>';
  currentPage = 1;
  renderMenu();
});

const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

menuToggle?.addEventListener("click", () => {
  if (!mainNav) return;

  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

// Tự động điền ghi chú bếp từ Hồ sơ vị giác (nếu có)
(function applyTasteProfileToOrderNote() {
  try {
    const raw = localStorage.getItem("savoris-taste-profile");
    if (!raw) return;
    const p = JSON.parse(raw);
    const parts = [];
    if (Array.isArray(p.prefs) && p.prefs.length) parts.push(p.prefs.join(", "));
    if (Array.isArray(p.allergies) && p.allergies.length) parts.push("Dị ứng: " + p.allergies.join(", "));
    const noteInput = document.querySelector("#orderNote");
    if (noteInput && !noteInput.value && parts.length) {
      noteInput.value = parts.join(" · ");
    }
  } catch (_) {}
})();

refreshAuthState();
renderCart();
updateCartCounts();
loadProducts();