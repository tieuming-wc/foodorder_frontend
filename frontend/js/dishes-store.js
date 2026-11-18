// Nguồn dữ liệu món dùng chung cho CẢ trang quản trị (Danh mục & món)
// và trang Thực đơn của khách.
//
// Mọi thao tác thêm / sửa / tạm ngưng / xoá món đều đi qua đây nên hai bên
// luôn đọc cùng một danh sách: admin tạm ngưng món thì khách không thấy món đó.
// Dữ liệu lưu ở localStorage; khi backend có API thực đơn thì chỉ cần thay
// phần đọc/ghi localStorage bằng api.get/api.post.
//
// Món có dạng:
// { id, name, note, category, price, image, status: "selling" | "paused", sales }
// Trường image là đường dẫn tính từ thư mục frontend/.

(function () {
  const KEY = "savoris_dishes_v1";
  const LEGACY_KEY = "savoris_admin_dishes_v1"; // dữ liệu của bản admin trước đây
  const FALLBACK_IMAGE = "assets/images/dishes/dish.svg";

  const DEFAULT_DISHES = [
    {
      id: "bit-tet-wagyu",
      name: "Bít tết bò Wagyu",
      note: "Chín vừa · Sốt tiêu đen",
      category: "Món chính",
      price: 1250000,
      image: "assets/images/dishes/bit-tet-wagyu.jpg",
      status: "selling",
      sales: 128,
    },
    {
      id: "my-y-nam-truffle",
      name: "Mỳ ý nấm Truffle",
      note: "Sốt kem truffle",
      category: "Mỳ & Pasta",
      price: 285000,
      image: "assets/images/dishes/my-y-nam-truffle.jpg",
      status: "selling",
      sales: 214,
    },
    {
      id: "pizza-ga-nuong",
      name: "Pizza gà nướng Napoli",
      note: "Đế mỏng · Phô mai mozzarella",
      category: "Món chính",
      price: 320000,
      image: "assets/images/dishes/pizza.jpg",
      status: "selling",
      sales: 96,
    },
    {
      id: "ca-hoi-ap-chao",
      name: "Cá hồi áp chảo",
      note: "Sốt chanh dây · Rau củ nướng",
      category: "Hải sản",
      price: 395000,
      image: "assets/images/dishes/ca-hoi-ap-chao.jpg",
      status: "selling",
      sales: 74,
    },
    {
      id: "com-gao-lut-ca-hoi",
      name: "Cơm gạo lứt cá hồi nướng",
      note: "Đậu que · Sốt mè rang",
      category: "Món chính",
      price: 215000,
      image: "assets/images/dishes/com-gao-lut-ca-hoi.jpg",
      status: "paused",
      sales: 52,
    },
    {
      id: "tart-chanh-day",
      name: "Bánh tart chanh dây",
      note: "Meringue cháy cạnh · Dùng lạnh",
      category: "Tráng miệng",
      price: 95000,
      image: "assets/images/dishes/tart-chanh-day.jpg",
      status: "selling",
      sales: 168,
    },
  ];

  function normalize(dish, base) {
    const source = base || {};
    return {
      id: String(dish.id || source.id || ""),
      name: String(dish.name || source.name || "Món chưa đặt tên"),
      note: String(dish.note ?? source.note ?? ""),
      category: String(dish.category || source.category || "Món chính"),
      price: Number(dish.price ?? source.price) || 0,
      image: String(dish.image || source.image || FALLBACK_IMAGE),
      status: dish.status === "paused" ? "paused" : "selling",
      sales: Number(dish.sales ?? source.sales) || 0,
    };
  }

  function defaults() {
    return DEFAULT_DISHES.map((dish) => ({ ...dish }));
  }

  function readStored(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (error) {
      return null;
    }
  }

  function write(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  // Đọc danh sách món. Lần đầu chạy sẽ chuyển dữ liệu cũ của trang admin sang.
  function load() {
    const stored = readStored(KEY);
    if (stored) return stored.map((dish) => normalize(dish));

    const legacy = readStored(LEGACY_KEY);
    if (legacy && legacy.length) {
      const migrated = legacy.map((dish) => {
        const base = DEFAULT_DISHES.find((item) => item.id === dish.id);
        return normalize(dish, base);
      });
      write(migrated);
      return migrated;
    }

    return defaults();
  }

  function save(list) {
    write(list);
    window.dispatchEvent(new CustomEvent("savoris:dishes-changed", { detail: list }));
    return list;
  }

  const SavorisDishes = {
    imageFallback: FALLBACK_IMAGE,

    // Toàn bộ món (kể cả món đang tạm ngưng) — dùng cho trang quản trị
    all() {
      return load();
    },

    // Chỉ món đang bán — dùng cho thực đơn của khách
    selling() {
      return load().filter((dish) => dish.status === "selling");
    },

    find(id) {
      return load().find((dish) => dish.id === id) || null;
    },

    categories() {
      const list = load().map((dish) => dish.category);
      return [...new Set(list)];
    },

    add(dish) {
      const list = load();
      const created = normalize({ ...dish, sales: dish.sales || 0 });
      if (!created.id) {
        created.id = created.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString().slice(-4);
      }
      list.push(created);
      save(list);
      return created;
    },

    update(id, patch) {
      const list = load();
      const index = list.findIndex((dish) => dish.id === id);
      if (index === -1) return null;
      list[index] = normalize({ ...list[index], ...patch });
      save(list);
      return list[index];
    },

    // Đổi trạng thái bán / tạm ngưng. Trả về món sau khi đổi.
    toggle(id) {
      const dish = this.find(id);
      if (!dish) return null;
      return this.update(id, { status: dish.status === "selling" ? "paused" : "selling" });
    },

    remove(id) {
      const list = load().filter((dish) => dish.id !== id);
      save(list);
      return list;
    },

    // Khôi phục thực đơn gốc
    reset() {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
      window.dispatchEvent(new CustomEvent("savoris:dishes-changed", { detail: defaults() }));
    },

    // Lắng nghe thay đổi trong cùng tab và ở tab khác (admin sửa, khách mở song song)
    subscribe(handler) {
      const onLocal = (event) => handler(event.detail || load());
      const onStorage = (event) => {
        if (event.key === KEY) handler(load());
      };
      window.addEventListener("savoris:dishes-changed", onLocal);
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener("savoris:dishes-changed", onLocal);
        window.removeEventListener("storage", onStorage);
      };
    },
  };

  window.SavorisDishes = SavorisDishes;
})();
