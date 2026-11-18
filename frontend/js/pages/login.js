// Đăng nhập cho khu vực quản trị: POST /auth/login -> lưu token + user -> kiểm tra role.
// Backend trả token dạng nào cũng nhận: access_token / token / accessToken.

(function () {
  const form = document.getElementById("login-form");
  const button = document.getElementById("login-submit");
  const notice = document.getElementById("login-notice");
  const guestLink = document.getElementById("login-guest-link");
  const API = CONFIG.API_BASE_URL;

  function setNotice(message, type = "info") {
    notice.hidden = false;
    notice.className = "sv-auth__notice" + (type === "error" ? " is-error" : "");
    notice.textContent = message;
  }

  function apiMessage(error) {
    if (error && error.response) {
      const detail = error.response.data && error.response.data.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.map((item) => item.msg).join("; ");
      return `Đăng nhập thất bại (lỗi ${error.response.status}).`;
    }
    return "Không kết nối được backend. Kiểm tra backend đã chạy và CONFIG.API_BASE_URL trong js/config.js.";
  }

  // Đã có phiên ADMIN còn hạn thì vào thẳng bảng điều khiển
  if (SavorisAuth.isAdmin() && !SavorisAuth.isExpired()) {
    window.location.replace("../admin/index.html");
    return;
  }

  if (new URLSearchParams(window.location.search).has("logout")) {
    setNotice("Bạn đã đăng xuất khỏi khu vực quản trị.");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      setNotice("Vui lòng nhập đầy đủ email và mật khẩu.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Đang kiểm tra…";

    try {
      const response = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { timeout: 10000, headers: { "Content-Type": "application/json" } },
      );

      const data = response.data || {};
      const token = data.access_token || data.token || data.accessToken || "";
      if (!token) throw new Error("Phản hồi đăng nhập không có token.");

      let user = data.user || data.user_info || data.account || null;
      if (!user) {
        try {
          const me = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          });
          user = me.data;
        } catch (error) {
          user = null; // vẫn còn role trong token để kiểm tra
        }
      }

      SavorisAuth.setSession(token, user || {});

      if (SavorisAuth.isAdmin()) {
        window.location.replace("../admin/index.html");
        return;
      }

      // Tài khoản khách/shipper/đối tác: không vào được admin
      setNotice("Tài khoản này không có quyền quản trị. Bạn vẫn có thể đặt món ở trang khách.", "error");
      guestLink.hidden = false;
    } catch (error) {
      setNotice(error.message && !error.response ? error.message : apiMessage(error), "error");
    } finally {
      button.disabled = false;
      button.textContent = "Đăng nhập";
    }
  });
})();
