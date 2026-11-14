// Phiên đăng nhập dùng chung cho mọi trang.
//
// Tài khoản lấy từ DB qua backend:
//   POST /api/auth/login  { username, password }  -> { access_token, user }
//   GET  /api/auth/me     (kèm Bearer token)      -> thông tin tài khoản
//
// Token được lưu trong localStorage với key "token" — js/api.js đọc key này để
// gắn header Authorization cho mọi request. Thông tin tài khoản lưu ở "ks25_user"
// để header hiện tên mà không phải gọi API mỗi lần tải trang.
//
// Cách dùng trong js/pages/*.js:
//   await authStore.login(username, password)   // sai tài khoản -> throw ApiError
//   authStore.isLoggedIn()                      // true / false
//   authStore.currentUser()                     // { id, username, full_name, ... } hoặc null
//   authStore.requireLogin()                    // chưa đăng nhập -> chuyển sang trang đăng nhập
//   authStore.logout()

const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "ks25_user";

const authStore = {
  token() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Người đang đăng nhập (đọc từ localStorage, không gọi API)
  currentUser() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
      return raw && raw.username ? raw : null;
    } catch (error) {
      return null;
    }
  },

  // Tên hiện trên header: ưu tiên họ tên, không có thì dùng username
  displayName() {
    const user = this.currentUser();
    if (!user) return "";
    return user.full_name || user.username;
  },

  isLoggedIn() {
    return Boolean(this.token());
  },

  // Đăng nhập bằng tài khoản trong DB. Sai tài khoản/mật khẩu thì server trả 401
  // -> ApiError có message dễ đọc, trang đăng nhập bắt và hiện lên.
  async login(username, password) {
    const data = await api.post("/auth/login", { username, password });
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    this.saveUser(data.user);
    return data.user;
  },

  // Hỏi lại server xem token còn hiệu lực không (token hết hạn -> xoá phiên).
  // Trả về user hoặc null.
  async refreshUser() {
    if (!this.isLoggedIn()) return null;
    try {
      const user = await api.get("/auth/me");
      this.saveUser(user);
      return user;
    } catch (error) {
      if (error.status === 401) this.logout();
      return null;
    }
  },

  saveUser(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || null));
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  // Trang cần đăng nhập thì gọi hàm này ở đầu trang.
  // Chưa đăng nhập -> chuyển sang trang đăng nhập và nhớ trang đang xem để quay lại.
  // Trả về true nếu đã đăng nhập (trang cứ chạy tiếp bình thường).
  requireLogin() {
    if (this.isLoggedIn()) return true;
    const here = window.location.pathname + window.location.search;
    window.location.href = authLoginUrl(here);
    return false;
  },
};

// Đường dẫn tới trang đăng nhập, tính theo data-root của body
// (trang gốc: "./pages/login.html", trang trong pages/: "../pages/login.html")
function authLoginUrl(nextPath) {
  const root = (document.body && document.body.dataset.root) || "./";
  const url = `${root}pages/login.html`;
  if (!nextPath) return url;
  return `${url}?next=${encodeURIComponent(nextPath)}`;
}
