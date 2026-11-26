// SAVORIS — Editorial "No-Button" Scroll-to-Order
// Nhấn giữ ảnh 1.5 giây (vòng tròn ánh vàng + rung nhẹ) hoặc nhấn đúp để đưa món vào giỏ kèm hoạt ảnh bay vào giỏ.
(function () {
  "use strict";

  const HOLD_MS = 1500;
  const CIRCUMFERENCE = 2 * Math.PI * 26; // r = 26

  let holdTimer = null;
  let activeCard = null;
  let ringEl = null;
  let suppressNextClick = false;
  let lastTapTime = 0;
  let lastTapCard = null;

  function createRing() {
    const wrap = document.createElement("div");
    wrap.className = "ed-ring-overlay";
    wrap.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle class="ed-ring-track" cx="32" cy="32" r="26" />
        <circle class="ed-ring-fill" cx="32" cy="32" r="26"
          stroke-dasharray="${CIRCUMFERENCE}"
          stroke-dashoffset="${CIRCUMFERENCE}" />
      </svg>
      <span class="ed-ring-label">Giữ 1.5s</span>`;
    return wrap;
  }

  function clearHold() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (activeCard) {
      activeCard.classList.remove("is-pressing");
      activeCard = null;
    }
    if (ringEl) {
      ringEl.remove();
      ringEl = null;
    }
  }

  function getCartTarget() {
    const mobileNav = document.querySelector('#luxMobileNav [data-lux-nav="cart"]');
    if (mobileNav && window.getComputedStyle(document.getElementById("luxMobileNav")).display !== "none") {
      return mobileNav;
    }
    return (
      document.querySelector(".page:not([hidden]) .cart-button") ||
      document.querySelector("#cartButton") ||
      document.querySelector(".cart-button")
    );
  }

  function flyToCart(imgEl) {
    const target = getCartTarget();
    if (!imgEl || !target) return;

    const srcRect = imgEl.getBoundingClientRect();
    const dstRect = target.getBoundingClientRect();
    if (!srcRect.width || !dstRect.width) return;

    const clone = document.createElement("img");
    clone.src = imgEl.currentSrc || imgEl.src;
    clone.className = "ed-fly-img";
    clone.style.left = `${srcRect.left + srcRect.width / 2 - 32}px`;
    clone.style.top = `${srcRect.top + srcRect.height / 2 - 32}px`;
    document.body.appendChild(clone);

    const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
    const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);

    requestAnimationFrame(() => {
      clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.32)`;
      clone.style.opacity = "0.15";
    });

    setTimeout(() => {
      clone.remove();
      target.classList.remove("ed-cart-pulse");
      void target.offsetWidth;
      target.classList.add("ed-cart-pulse");
      setTimeout(() => target.classList.remove("ed-cart-pulse"), 600);
    }, 760);
  }

  function confirmOrder(card) {
    if (!card) return;
    if (navigator.vibrate) {
      try { navigator.vibrate([32]); } catch (_) {}
    }

    const img = card.querySelector("img");
    const addBtn = card.querySelector(".menu-card-add, .add-button, [data-som-add]");
    if (addBtn) {
      addBtn.click();
    }
    if (img) {
      flyToCart(img);
    }
  }

  function startHold(card, e) {
    if (e.button && e.button !== 0) return;
    clearHold();
    activeCard = card;
    card.classList.add("is-pressing");

    const host = card.querySelector(".menu-card-image") || card;
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    ringEl = createRing();
    host.appendChild(ringEl);

    const circle = ringEl.querySelector(".ed-ring-fill");
    requestAnimationFrame(() => {
      if (circle) {
        circle.style.transition = `stroke-dashoffset ${HOLD_MS}ms linear`;
        circle.style.strokeDashoffset = "0";
      }
    });

    holdTimer = setTimeout(() => {
      suppressNextClick = true;
      const targetCard = activeCard;
      clearHold();
      confirmOrder(targetCard);
      setTimeout(() => { suppressNextClick = false; }, 350);
    }, HOLD_MS);
  }

  document.addEventListener("pointerdown", (e) => {
    const card = e.target.closest(".dish-card, .menu-card");
    if (!card || e.target.closest(".menu-card-add, .add-button")) return;
    startHold(card, e);
  });

  document.addEventListener("pointerup", (e) => {
    if (holdTimer) {
      // Released before 1.5s -> check double-tap on touch
      const card = activeCard;
      clearHold();
      if (e.pointerType === "touch" && card) {
        const now = Date.now();
        if (lastTapCard === card && now - lastTapTime < 320) {
          suppressNextClick = true;
          lastTapTime = 0;
          lastTapCard = null;
          confirmOrder(card);
          setTimeout(() => { suppressNextClick = false; }, 350);
        } else {
          lastTapTime = now;
          lastTapCard = card;
        }
      }
    }
  });

  document.addEventListener("pointercancel", clearHold);
  document.addEventListener("scroll", clearHold, { passive: true });

  document.addEventListener("dblclick", (e) => {
    const card = e.target.closest(".dish-card, .menu-card");
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    clearHold();
    suppressNextClick = true;
    confirmOrder(card);
    setTimeout(() => { suppressNextClick = false; }, 350);
  }, true);

  // Suppress accidental detail-page navigation immediately after hold/dblclick
  document.addEventListener("click", (e) => {
    if (!suppressNextClick) return;
    if (e.target.closest(".dish-card, .menu-card")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
})();
