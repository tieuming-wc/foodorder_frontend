// Phiên đăng nhập dùng chung: lưu token + thông tin user, đọc role từ token.
// Token lưu ở localStorage với key "token" (giống gợi ý interceptor trong js/api.js),
// thông tin user lưu ở key "user".
//
// Lưu ý bảo mật: kiểm tra role ở frontend chỉ để điều hướng/ẩn giao diện.
// Backend vẫn phải tự kiểm tra quyền trên từng API quản trị.

(function () {
  const TOKEN_KEY = "token";
  const USER_KEY = "user";

  function decodeJwt(token) {
    try {
      const part = String(token).split(".")[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(json);
    } catch (error) {
      // Token không phải JWT (backend có thể phát token dạng chuỗi thường)
      return null;
    }
  }

  const SavorisAuth = {
    decodeJwt,

    token() {
      return localStorage.getItem(TOKEN_KEY) || "";
    },

    user() {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
      } catch (error) {
        return null;
      }
    },

    payload() {
      return this.token() ? decodeJwt(this.token()) : null;
    },

    role() {
      const user = this.user() || {};
      const payload = this.payload() || {};
      return String(user.role || payload.role || "").toUpperCase();
    },

    isAdmin() {
      return this.role() === "ADMIN";
    },

    isExpired() {
      const payload = this.payload();
      return Boolean(payload && payload.exp && payload.exp * 1000 <= Date.now());
    },

    setSession(token, user) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Xác thực lại token với backend qua GET /auth/me.
    // Kết quả:
    //   { ok: true, user }                -> token còn hiệu lực, cập nhật lại user
    //   { ok: true, offline: true }       -> không gọi được backend, giữ kiểm tra cục bộ
    //   { ok: false, reason: "expired" | "forbidden" | "unauthenticated" }
    async verifySession() {
      const token = this.token();
      if (!token) return { ok: false, reason: "unauthenticated" };

      // config.js khai báo `const CONFIG` nên đọc qua global binding, không phải window.CONFIG
      const config = window.CONFIG || (typeof CONFIG !== "undefined" ? CONFIG : null);
      const base = (config && config.API_BASE_URL ? String(config.API_BASE_URL) : "").replace(/\/+$/, "");
      if (!base || typeof fetch !== "function") return { ok: true, offline: true };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(`${base}/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401) return { ok: false, reason: "expired" };
        if (response.status === 403) return { ok: false, reason: "forbidden" };
        // 404 / 5xx: backend chưa có endpoint hoặc đang lỗi -> chưa xác thực lại được
        if (!response.ok) return { ok: true, offline: true };

        const data = await response.json().catch(() => null);
        const user = data && (data.user || data.user_info || data.account || data);
        if (!user || typeof user !== "object") return { ok: true, offline: true };

        const role = String(user.role || "").toUpperCase();
        this.setSession(null, user);

        if (role && role !== "ADMIN") return { ok: false, reason: "forbidden" };
        return { ok: true, user };
      } catch (error) {
        // CORS, mất mạng, timeout -> không kết luận token sai, dùng kiểm tra cục bộ
        return { ok: true, offline: true };
      } finally {
        clearTimeout(timer);
      }
    },

    clear() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    // Xoá phiên rồi chuyển trang (mặc định về trang đăng nhập)
    logout(redirectTo = "../pages/login.html?logout=1") {
      this.clear();
      window.location.replace(redirectTo);
    },
  };

  window.SavorisAuth = SavorisAuth;
})();
