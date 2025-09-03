document.addEventListener("DOMContentLoaded", () => {
  // Ano no rodapé
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ScrollSpy
  if (window.bootstrap && bootstrap.ScrollSpy) {
    new bootstrap.ScrollSpy(document.body, {
      target: "#navbarNav",
      offset: 100,
    });
  }

  // Voltar ao topo
  const backBtn = document.getElementById("backToTop");
  const toggleBackToTop = () => {
    if (window.scrollY > 450) backBtn.style.display = "inline-flex";
    else backBtn.style.display = "none";
  };
  window.addEventListener("scroll", toggleBackToTop);
  backBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // QR Code
  const qrEl = document.getElementById("qrcode");
  if (qrEl && typeof QRCode !== "undefined") {
    new QRCode(qrEl, {
      text: "https://forgedevapps.com/",
      width: 100,
      height: 100,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // Tooltips (ícones dos chips)
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll("[title]")
  );
  tooltipTriggerList.forEach((el) => {
    if (window.bootstrap && bootstrap.Tooltip)
      new bootstrap.Tooltip(el, { trigger: "hover focus" });
  });

  // ===== BUSCA + CATEGORIAS =====
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const noResults = document.getElementById("noResults");
  const catRadios = Array.from(document.querySelectorAll('input[name="cat"]'));
  const items = Array.from(document.querySelectorAll(".menu-item"));

  const norm = (s) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function matchesFilters(el) {
    const selectedCat = catRadios.find((r) => r.checked)?.value || "todas";
    const matchCat =
      selectedCat === "todas" ||
      el.getAttribute("data-category") === selectedCat;

    const q = norm(searchInput.value);
    if (!q) return matchCat;

    const title = norm(el.querySelector(".card-title")?.textContent || "");
    const desc = norm(el.querySelector(".card-text")?.textContent || "");
    const tags = norm(el.getAttribute("data-tags") || "");
    const textBlock = `${title} ${desc} ${tags}`;

    return matchCat && textBlock.includes(q);
  }

  function applyFilters() {
    let visible = 0;
    items.forEach((el) => {
      if (matchesFilters(el)) {
        el.classList.remove("d-none");
        visible++;
      } else {
        el.classList.add("d-none");
      }
    });
    if (noResults) noResults.classList.toggle("d-none", visible !== 0);
  }

  // Eventos
  ["input", "change"].forEach((evt) => {
    searchInput.addEventListener(evt, applyFilters);
    catRadios.forEach((r) => r.addEventListener(evt, applyFilters));
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("cat-todas").checked = true;
    applyFilters();
    searchInput.focus();
  });

  // Start
  applyFilters();
});
