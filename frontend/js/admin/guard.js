// Admin Guard — chạy TRƯỚC khi trang quản trị hiển thị.
// Nạp trong <head> của mọi trang admin, theo thứ tự:
//   <script src="../js/config.js"></script>
//   <script src="../js/auth.js"></script>
//   <script src="../js/admin/guard.js"></script>
//
// Kiểm tra hai lớp:
//   1. Cục bộ: có token, token chưa hết hạn, role === ADMIN.
//   2. Với backend: gọi GET /auth/me để xác thực lại token (không tin mỗi JWT
//      giải mã ở client, vì token có thể bị giả hoặc quyền đã bị thu hồi).
// Nếu không gọi được backend (chưa chạy, CORS, timeout) thì giữ kết quả lớp 1
// để không chặn nhầm khi phát triển.
// Vi phạm => chuyển ngay sang trang 403, không lộ nội dung quản trị.
// Trang chỉ được hiện khi guard gọi reveal().

(function () {
  const root = document.documentElement;
  root.style.visibility = "hidden"; // không nháy nội dung admin trong lúc kiểm tra

  const FORBIDDEN_PAGE = "../pages/403.html";

  function reveal() {
    root.style.visibility = "";
  }

  function block(reason, clearSession) {
    if (clearSession && window.SavorisAuth) SavorisAuth.clear();
    const next = window.location.pathname + window.location.search;
    window.location.replace(`${FORBIDDEN_PAGE}?reason=${reason}&next=${encodeURIComponent(next)}`);
  }

  async function check() {
    if (!window.SavorisAuth) {
      block("error", false);
      return;
    }

    // 1. Chưa đăng nhập
    if (!SavorisAuth.token()) {
      block("unauthenticated", false);
      return;
    }

    // 2. Token là JWT đã hết hạn
    if (SavorisAuth.isExpired()) {
      block("expired", true);
      return;
    }

    // 3. Không đọc được role -> coi như token không hợp lệ
    if (!SavorisAuth.role()) {
      block("unauthenticated", true);
      return;
    }

    // 4. Đã đăng nhập nhưng không phải ADMIN (khách hàng, shipper, đối tác...)
    if (!SavorisAuth.isAdmin()) {
      block("forbidden", false);
      return;
    }

    // 5. Xác thực lại token với backend (/auth/me)
    const result = await SavorisAuth.verifySession();

    if (!result.ok) {
      // 401 -> phiên hết hạn, xoá token. 403 -> token hợp lệ nhưng mất quyền.
      block(result.reason, result.reason !== "forbidden");
      return;
    }

    if (result.offline) {
      console.warn("[Admin Guard] Chưa gọi được /auth/me nên chỉ kiểm tra token cục bộ.");
    }

    reveal();
  }

  // Các script khác (layout, pages) có thể chờ guard xác thực xong nếu cần
  window.SavorisGuard = { ready: check() };

  window.SavorisGuard.ready.catch(() => block("error", false));
})();
