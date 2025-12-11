(function () {
  const shotsPath = "assets/img/shots/";
  const grid = document.getElementById("shots-grid");
  const modal = document.getElementById("shot-modal");
  const modalImg = document.getElementById("shot-modal-img");

  function createCard(src) {
    const card = document.createElement("div");
    card.className = "shot-card";
    card.tabIndex = 0;

    // meta strip (timestamp + url) placed above image but will be hidden by CSS
    const meta = document.createElement("div");
    meta.className = "meta";
    const timeSpan = document.createElement("span");
    timeSpan.className = "meta-time";
    timeSpan.textContent = new Date().toISOString();
    const urlSpan = document.createElement("span");
    urlSpan.className = "meta-url";
    urlSpan.textContent = shotsPath + src;
    meta.appendChild(timeSpan);
    meta.appendChild(document.createTextNode(" "));
    meta.appendChild(urlSpan);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "تصویر محیط برنامه";
    img.src = shotsPath + src;

    // append meta (hidden via CSS) then the thumbnail image
    card.appendChild(meta);
    card.appendChild(img);

    // open modal on click or Enter
    function open() {
      const modalBody = modal.querySelector(".modal-body");
      // reset sizing
      modalBody.style.width = "";
      modalBody.style.height = "";

      modalImg.src = shotsPath + src;
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("open");
      // prevent body scroll while open
      document.body.style.overflow = "hidden";

      // once image loads, size modal to fit image while respecting 80vw/80vh
      modalImg.onload = function () {
        try {
          const natW = modalImg.naturalWidth || modalImg.width;
          const natH = modalImg.naturalHeight || modalImg.height;
          const maxW = Math.floor(window.innerWidth * 0.8);
          const maxH = Math.floor(window.innerHeight * 0.8);
          // don't upscale small images; only shrink if needed
          const scale = Math.min(1, maxW / natW, maxH / natH);
          const targetW = Math.max(200, Math.round(natW * scale));
          const targetH = Math.max(200, Math.round(natH * scale));

          modalBody.style.width = targetW + "px";
          modalBody.style.height = targetH + "px";
        } catch (e) {
          // fallback: use defaults (CSS handles sizing)
          modalBody.style.width = "";
          modalBody.style.height = "";
        }
      };
      modalImg.onerror = function () {
        // in case of error, clear sizes so default modal applies
        const modalBody = modal.querySelector(".modal-body");
        modalBody.style.width = "";
        modalBody.style.height = "";
      };
    }
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    return card;
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    document.body.style.overflow = "";
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // fetch images.json, fallback to embedded list if fetch fails
  fetch(shotsPath + "images.json")
    .then((r) => {
      if (!r.ok) throw new Error("no json");
      return r.json();
    })
    .catch(() => {
      // fallback array (same as compiled list)
      return [
        "building-management.png",
        "charts-analytics.png",
        "classroom-settings.png",
        "dashboard-overview.png",
        "dashboard-statistics.png",
        "data-import.png",
        "exam-schedule.png",
        "notifications-panel.png",
        "proctor-assignment.png",
        "proctor-attendance.png",
        "proctor-colleagues.png",
        "proctor-dashboard.png",
        "proctor-help.png",
        "proctor-module-1.png",
        "proctor-module-2.png",
        "proctor-module-3.png",
        "proctor-notifications.png",
        "proctor-overview.png",
        "proctor-profile.png",
        "proctor-reports.png",
        "proctor-schedule.png",
        "proctor-sessions.png",
        "proctor-tasks.png",
        "proctor-violations.png",
        "reports-panel.png",
        "session-list.png",
        "session-management-1.png",
        "session-management-2.png",
        "session-management-3.png",
        "settings-page.png",
        "student-search.png",
        "system-config.png",
        "user-management.png",
      ];
    })
    .then((list) => {
      if (!Array.isArray(list)) return;
      // create cards array
      const cards = list.map((name) => ({ name, card: createCard(name) }));

      // masonry columnizer: decide column count based on viewport
      function columnsCount() {
        const w = window.innerWidth;
        if (w < 600) return 1;
        if (w < 900) return 2;
        return 3;
      }

      // build column containers
      function buildColumns(n) {
        grid.innerHTML = "";
        const container = document.createElement("div");
        container.className = "masonry-container";
        grid.appendChild(container);
        const cols = [];
        for (let i = 0; i < n; i++) {
          const c = document.createElement("div");
          c.className = "masonry-column";
          c.dataset.height = "0";
          container.appendChild(c);
          cols.push(c);
        }
        return cols;
      }

      // helper to find shortest column
      function shortestColumn(cols) {
        return cols.reduce(
          (min, c) =>
            parseFloat(c.dataset.height) < parseFloat(min.dataset.height)
              ? c
              : min,
          cols[0]
        );
      }

      // place cards by measuring natural aspect ratio
      function placeCards(cols) {
        const colWidth = Math.floor(
          (grid.clientWidth - (cols.length - 1) * 18) / cols.length
        );
        cards.forEach(({ name, card }) => {
          const img = card.querySelector("img");
          // preload to get natural dimensions if necessary
          const probe = new Image();
          probe.src = img.src;
          probe.onload = function () {
            const ratio = probe.naturalHeight / probe.naturalWidth || 1;
            const estimatedHeight = Math.round(colWidth * ratio) + 20; // card padding
            const target = shortestColumn(cols);
            target.appendChild(card);
            // update column height metric
            const h = parseFloat(target.dataset.height) + estimatedHeight;
            target.dataset.height = h;
          };
          probe.onerror = function () {
            // on error just append to shortest
            const target = shortestColumn(cols);
            target.appendChild(card);
            target.dataset.height = parseFloat(target.dataset.height) + 200;
          };
        });
      }

      // initialize
      function initMasonry() {
        const n = columnsCount();
        const cols = buildColumns(n);
        placeCards(cols);
      }

      initMasonry();

      // reflow on resize
      let resizeTimer = null;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          initMasonry();
        }, 200);
      });
    })
    .catch((err) => {
      console.error("Failed to load shots list", err);
      const p = document.createElement("p");
      p.style.color = "var(--text-muted)";
      p.textContent = "تصاویری برای نمایش وجود ندارد.";
      grid.appendChild(p);
    });
})();
