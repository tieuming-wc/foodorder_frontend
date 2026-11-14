// Trang Đăng nhập: tài khoản lấy từ DB qua API backend (POST /api/auth/login).
// Token trả về được lưu bởi authStore (js/auth.js) và gửi kèm mọi request sau đó.

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("btn-login");

// Trang được quay lại sau khi đăng nhập (?next=...), chỉ nhận đường dẫn nội bộ
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

const backTo = nextPath() || "items.html";

// Đã đăng nhập rồi thì không cần hiện form nữa
if (authStore.isLoggedIn()) {
  window.location.replace(backTo);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;
  loginError.hidden = true;

  if (!username || !password) {
    loginError.textContent = "Vui lòng nhập đủ tên đăng nhập và mật khẩu.";
    loginError.hidden = false;
    return;
  }

  loginSubmit.disabled = true;
  try {
    // Kiểm tra tài khoản/mật khẩu với DB qua backend; sai thì server trả 401
    await authStore.login(username, password);
    showToast("Đăng nhập thành công");
    window.location.href = backTo;
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
  } finally {
    loginSubmit.disabled = false;
  }
});
