(function () {
  "use strict";

  const CART_KEY = "savoris-cart";
  const PROFILE_KEY = "savoris-taste-profile";
  const toastEl = document.getElementById("toast");
  let dishes = [];
  let wheelDishes = [];
  let wheelAngle = 0;
  let spinning = false;
  let lastWinner = null;

  const state = { mood: "alert", time: "quick", budget: "all" };
  let weatherInfo = { temp: null, isRain: false, isCold: false, isHot: false };

  function money(v) {
    return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
  }

  function syncCartCount() {
    const count = getCart().reduce((s, it) => s + Number(it?.quantity || 0), 0);
    const el = document.getElementById("somCartCount");
    if (el) el.textContent = String(count);
  }

  function addToCart(dish) {
    const cart = getCart();
    const idx = cart.findIndex((c) => Number(c.id) === Number(dish.id));
    if (idx >= 0) cart[idx].quantity += 1;
    else cart.push({ id: dish.id, name: dish.name, price: Number(dish.price), image: dish.image_url || dish.image, quantity: 1 });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    syncCartCount();
    showToast(`Đã thêm "${dish.name}" vào giỏ hàng.`);
  }

  // ── Allergy helper ───────────────────────────────────────
  const ALLERGY_RULES = {
    "Hải sản": ["cá hồi", "tôm", "mực", "hải sản", "cua"],
    "Đậu phộng": ["đậu phộng", "lạc"],
    "Sữa & Phô mai": ["phô mai", "kem", "burrata", "mascarpone", "tiramisu", "bơ"],
    "Gluten / Bột mì": ["mỳ", "mì", "pizza", "bánh mì", "tart"],
  };

  function getProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{"allergies":[],"prefs":[]}'); }
    catch { return { allergies: [], prefs: [] }; }
  }

  function dishAllergies(dish) {
    const prof = getProfile();
    const hay = `${dish.name} ${dish.description || ""} ${dish.category || ""}`.toLowerCase();
    return (prof.allergies || []).filter((a) => (ALLERGY_RULES[a] || []).some((kw) => hay.includes(kw)));
  }

  // ── 1. Weather & Context Advisor ─────────────────────────
  function renderContextDishes() {
    const grid = document.getElementById("somWeatherDishes");
    const titleEl = document.getElementById("somContextTitle");
    const timeEl = document.getElementById("somTimeBadge");
    if (!grid || !dishes.length) return;

    const hour = new Date().getHours();
    const isLate = hour >= 21 || hour < 6;
    const isMorning = hour >= 6 && hour < 11;
    const avail = dishes.filter((d) => d.is_available !== false);

    let reason = "Cân bằng hương vị trong ngày";
    let scored = avail.map((d) => {
      let score = Number(d.rating || 4.5);
      const hay = `${d.name} ${d.description || ""} ${d.category || ""}`.toLowerCase();
      if (weatherInfo.isRain || weatherInfo.isCold) {
        reason = "Trời se lạnh / mưa — ưu tiên món nóng hổi, đậm đà";
        if (/phở|bún|bít tết|mỳ|nước dùng|nướng/.test(hay)) score += 3;
      } else if (weatherInfo.isHot) {
        reason = "Trời nắng ấm — ưu tiên món thanh mát & đồ uống giải nhiệt";
        if (/trà|cá hồi|gỏi|tiramisu|đồ uống/.test(hay)) score += 3;
      } else if (isLate) {
        reason = "Buổi tối muộn — ưu tiên món thanh nhẹ, dễ tiêu hóa";
        if (/cá hồi|phở|trà|tiramisu/.test(hay)) score += 2.5;
      } else if (isMorning) {
        reason = "Buổi sáng năng lượng — khởi đầu tinh tế";
        if (/phở|bánh mì|cơm/.test(hay)) score += 2.5;
      }
      if (dishAllergies(d).length) score -= 5;
      return { d, score };
    }).sort((a, b) => b.score - a.score).slice(0, 4);

    if (titleEl) titleEl.textContent = reason;
    if (timeEl) timeEl.textContent = `Khung giờ hiện tại: ${String(hour).padStart(2, "0")}:00`;

    grid.innerHTML = scored.map(({ d }) => {
      const hits = dishAllergies(d);
      return `
        <article class="dish-card">
          <img src="${d.image_url || d.image || ""}" alt="${d.name}" loading="lazy" />
          <div class="dish-info">
            <p class="eyebrow">${d.category || "Savoris"} · ${d.delivery_time || "25–35 phút"}</p>
            <h3>${d.name}</h3>
            <p class="dish-rating">${hits.length ? `<span style="color:#e2726a;padding:0">⚠ Dị ứng: ${hits.join(", ")}</span>` : `★ ${Number(d.rating || 4.8).toFixed(1)} · Phù hợp lúc này`}</p>
            <div class="dish-bottom">
              <span class="price">${money(d.price)}</span>
              <button class="add-button" type="button" data-som-add="${d.id}" aria-label="Thêm ${d.name}">+</button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  async function detectWeather() {
    const locEl = document.getElementById("somWeatherLoc");
    const tempEl = document.getElementById("somWeatherTemp");
    const descEl = document.getElementById("somWeatherDesc");
    const advEl = document.getElementById("somWeatherAdvice");

    if (!navigator.geolocation) {
      if (locEl) locEl.textContent = "TRÌNH DUYỆT KHÔNG HỖ TRỢ VỊ TRÍ";
      return;
    }
    if (locEl) locEl.textContent = "ĐANG XIN QUYỀN VỊ TRÍ…";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}&current_weather=true`
          );
          const data = await res.json();
          const cw = data.current_weather;
          const temp = Math.round(cw.temperature);
          const code = Number(cw.weathercode);
          const isRain = code >= 51;
          weatherInfo = { temp, isRain, isCold: temp <= 23, isHot: temp >= 31 };

          if (locEl) locEl.textContent = `VỊ TRÍ HIỆN TẠI (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          if (tempEl) tempEl.textContent = `${temp}°C`;
          if (descEl) descEl.textContent = isRain ? "Có mưa nhẹ · Không khí ẩm" : temp >= 31 ? "Trời nắng ấm" : "Thời tiết dịu mát";
          if (advEl) advEl.textContent = isRain || temp <= 23
            ? "Sommelier đề xuất các món nước nóng và bít tết ấm vị."
            : "Sommelier đề xuất các món thanh nhẹ kèm trà ủ lạnh.";
          renderContextDishes();
        } catch {
          if (locEl) locEl.textContent = "KHÔNG LẤY ĐƯỢC DỮ LIỆU THỜI TIẾT";
        }
      },
      () => {
        if (locEl) locEl.textContent = "CHƯA CẤP QUYỀN VỊ TRÍ";
        if (descEl) descEl.textContent = "Đang gợi ý theo khung giờ hiện tại";
        renderContextDishes();
      },
      { timeout: 8000 }
    );
  }

  // ── 2. "Ăn gì hôm nay?" Combo Builder ────────────────────
  function renderCombos() {
    const box = document.getElementById("somComboResults");
    if (!box || !dishes.length) return;
    const avail = dishes.filter((d) => d.is_available !== false);

    let mains = avail.filter((d) => d.category !== "Đồ uống" && d.category !== "Tráng miệng");
    if (state.budget === "low") mains = mains.filter((d) => d.price < 100000);
    else if (state.budget === "mid") mains = mains.filter((d) => d.price >= 100000 && d.price <= 250000);
    else if (state.budget === "high") mains = mains.filter((d) => d.price > 250000);
    if (!mains.length) mains = avail.filter((d) => d.category !== "Đồ uống");

    mains = mains
      .map((d) => {
        let s = Number(d.rating || 4.5);
        const hay = `${d.name} ${d.category}`.toLowerCase();
        if (state.mood === "alert" && /bít tết|phở|bánh mì/.test(hay)) s += 2;
        if (state.mood === "tired" && /phở|bún|cơm|mỳ/.test(hay)) s += 2;
        if (state.mood === "party" && /pizza|bít tết|cá hồi/.test(hay)) s += 2;
        if (state.time === "quick" && /bánh mì|cơm|phở/.test(hay)) s += 1.5;
        if (state.time === "late" && /cá hồi|phở|mỳ/.test(hay)) s += 1.5;
        if (dishAllergies(d).length) s -= 6;
        return { d, s };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 2)
      .map((x) => x.d);

    const drink = avail.find((d) => d.category === "Đồ uống") || avail.find((d) => d.category === "Tráng miệng") || avail[0];

    box.innerHTML = mains.map((m, idx) => {
      const pair = drink && drink.id !== m.id ? drink : avail[(idx + 1) % avail.length];
      const total = Number(m.price) + Number(pair.price);
      return `
        <article class="som-combo-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <p class="eyebrow" style="margin:0">COMBO ĐỀ XUẤT 0${idx + 1} · FOOD &amp; DRINK PAIRING</p>
            <strong style="color:var(--gold);font-variant-numeric:tabular-nums">${money(total)}</strong>
          </div>
          <div class="som-combo-pair">
            <div class="som-mini-dish">
              <img src="${m.image_url || m.image || ""}" alt="${m.name}" />
              <div class="som-mini-dish__body">
                <h4>${m.name}</h4>
                <span class="price">${money(m.price)}</span>
              </div>
            </div>
            <div class="som-mini-dish">
              <img src="${pair.image_url || pair.image || ""}" alt="${pair.name}" />
              <div class="som-mini-dish__body">
                <h4>${pair.name}</h4>
                <span class="price">${money(pair.price)}</span>
              </div>
            </div>
          </div>
          <button class="button button-gold" type="button" data-combo-add="${m.id},${pair.id}">
            Thêm cả combo vào giỏ <span aria-hidden="true">→</span>
          </button>
        </article>`;
    }).join("");
  }

  // ── 3. Taste & Allergy Profile ───────────────────────────
  function loadProfileUI() {
    const prof = getProfile();
    document.querySelectorAll("#somAllergyList input").forEach((cb) => {
      cb.checked = (prof.allergies || []).includes(cb.value);
    });
    document.querySelectorAll("#somPrefList input").forEach((cb) => {
      cb.checked = (prof.prefs || []).includes(cb.value);
    });
  }

  function saveProfileUI() {
    const allergies = Array.from(document.querySelectorAll("#somAllergyList input:checked")).map((c) => c.value);
    const prefs = Array.from(document.querySelectorAll("#somPrefList input:checked")).map((c) => c.value);
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ allergies, prefs }));
    showToast("Đã lưu hồ sơ vị giác & tự đồng bộ sang Thực đơn.");
    renderContextDishes();
    renderCombos();
    buildWheel();
  }

  // ── 4. Luxury Lucky Wheel ────────────────────────────────
  function buildWheel() {
    const safeOnly = document.getElementById("somWheelSafeOnly")?.checked;
    wheelDishes = dishes.filter((d) => d.is_available !== false && (!safeOnly || dishAllergies(d).length === 0));
    if (!wheelDishes.length) wheelDishes = dishes.filter((d) => d.is_available !== false);
    drawWheel(wheelAngle);
  }

  function drawWheel(angle) {
    const canvas = document.getElementById("somWheelCanvas");
    if (!canvas || !wheelDishes.length) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 8;
    const n = wheelDishes.length;
    const arc = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    wheelDishes.forEach((d, i) => {
      const start = angle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#161513" : "#1f1c16";
      ctx.fill();
      ctx.strokeStyle = "rgba(197, 160, 89, 0.32)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = i % 2 === 0 ? "#eae6df" : "#dcc084";
      ctx.font = "500 11.5px Inter, sans-serif";
      const label = d.name.length > 18 ? d.name.slice(0, 17) + "…" : d.name;
      ctx.fillText(label, r - 18, 4);
      ctx.restore();
    });

    // Center medallion
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#0d0d0d";
    ctx.fill();
    ctx.strokeStyle = "#c5a059";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#c5a059";
    ctx.font = "600 10px Playfair Display, serif";
    ctx.textAlign = "center";
    ctx.fillText("SAVORIS", cx, cy + 4);
  }

  function spinWheel() {
    if (spinning || !wheelDishes.length) return;
    spinning = true;
    const addBtn = document.getElementById("somWheelAddBtn");
    if (addBtn) addBtn.hidden = true;

    const extra = Math.PI * 2 * (5 + Math.random() * 3);
    const startAngle = wheelAngle;
    const duration = 3800;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 4);
      wheelAngle = startAngle + extra * ease;
      drawWheel(wheelAngle);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        const n = wheelDishes.length;
        const arc = (Math.PI * 2) / n;
        const pointer = (Math.PI * 1.5 - (wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(pointer / arc) % n;
        lastWinner = wheelDishes[idx];
        document.getElementById("somWheelWinner").textContent = lastWinner.name;
        document.getElementById("somWheelDesc").textContent = `${lastWinner.description || ""} · Giá ${money(lastWinner.price)}`;
        if (addBtn) addBtn.hidden = false;
        showToast(`Vòng quay chọn: ${lastWinner.name}`);
      }
    }
    requestAnimationFrame(frame);
  }

  // ── Init & Event Wiring ──────────────────────────────────
  async function init() {
    syncCartCount();
    loadProfileUI();
    try {
      dishes = await api.get("/items");
    } catch {
      dishes = [];
    }
    renderContextDishes();
    renderCombos();
    buildWheel();
    detectWeather();
  }

  document.querySelectorAll(".som-pills").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".som-pill");
      if (!btn) return;
      group.querySelectorAll(".som-pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state[group.dataset.filterGroup] = btn.dataset.val;
      renderCombos();
    });
  });

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-som-add]");
    if (addBtn) {
      const d = dishes.find((x) => Number(x.id) === Number(addBtn.dataset.somAdd));
      if (d) addToCart(d);
    }
    const comboBtn = e.target.closest("[data-combo-add]");
    if (comboBtn) {
      comboBtn.dataset.comboAdd.split(",").forEach((id) => {
        const d = dishes.find((x) => Number(x.id) === Number(id));
        if (d) addToCart(d);
      });
    }
  });

  document.getElementById("somLocateBtn")?.addEventListener("click", detectWeather);
  document.getElementById("somSaveProfileBtn")?.addEventListener("click", saveProfileUI);
  document.getElementById("somWheelSafeOnly")?.addEventListener("change", buildWheel);
  document.getElementById("somSpinBtn")?.addEventListener("click", spinWheel);
  document.getElementById("somWheelAddBtn")?.addEventListener("click", () => {
    if (lastWinner) addToCart(lastWinner);
  });

  init();
})();
