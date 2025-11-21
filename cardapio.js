document.addEventListener("DOMContentLoaded", () => {
  // Ano no rodapé — o footer é carregado dinamicamente, então checar existência
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Back to top
  const backBtn = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    backBtn.style.display = window.scrollY > 450 ? "inline-flex" : "none";
  });
  backBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // Tooltips
  document.querySelectorAll("[title]").forEach((el) => {
    if (window.bootstrap?.Tooltip)
      new bootstrap.Tooltip(el, { trigger: "hover focus" });
  });

  // Iniciar filtros
  iniciarFiltros();

  // Carregar cardápio
  carregarCardapio();
});

// ---------------------------
//  FILTROS
// ---------------------------
function iniciarFiltros() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const noResults = document.getElementById("noResults");

  const catRadios = [...document.querySelectorAll('input[name="cat"]')];

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  window.applyFilters = () => {
    const items = [...document.querySelectorAll(".menu-item")];
    const query = normalize(searchInput.value);
    const categoriaSelecionada =
      catRadios.find((r) => r.checked)?.value || "todas";

    let visiveis = 0;

    items.forEach((el) => {
      const cat = el.dataset.category;
      const text =
        normalize(el.querySelector(".card-title").textContent) +
        " " +
        normalize(el.querySelector(".card-text").textContent) +
        " " +
        normalize(el.dataset.tags);

      const matchCat =
        categoriaSelecionada === "todas" || categoriaSelecionada === cat;

      const matchText = !query || text.includes(query);

      if (matchCat && matchText) {
        el.classList.remove("d-none");
        visiveis++;
      } else {
        el.classList.add("d-none");
      }
    });

    noResults.classList.toggle("d-none", visiveis !== 0);
  };

  ["input", "change"].forEach((ev) => {
    searchInput.addEventListener(ev, applyFilters);
    catRadios.forEach((r) => r.addEventListener(ev, applyFilters));
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("cat-todas").checked = true;
    applyFilters();
    searchInput.focus();
  });
}

// ---------------------------
//  CARREGAR CARDÁPIO VIA JSON
// ---------------------------

  function gerarQRCode() {
    new QRCode(document.getElementById("qrcode"), {
      text: "https://steakburger.forgedevapps.com/",
      width: 100,
      height: 100,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  // Gera ao carregar página
  document.addEventListener("DOMContentLoaded", gerarQRCode);

async function carregarCardapio() {
  const resposta = await fetch("cardapio.json");
  const data = await resposta.json();

  const modalsArea = document.getElementById("modals-area");

  Object.keys(data).forEach((categoria) => {
    console.log(`Carregando categoria: ${categoria}`);
    const lista = document.getElementById(`lista-${categoria}`);
    if (!lista) return;

    data[categoria].forEach((item) => {
      // CARD
      lista.innerHTML += `
        <div class="col-lg-6 col-md-12 d-flex justify-content-center menu-item"
          data-category="${categoria}"
          data-tags="${item.tags}">
          <article class="card card-menu h-100">
            <div class="row g-0">
              <div class="col-4 d-flex align-items-center">
                <img src="${item.imagem}" class="image-card" alt="${item.nome}" />
              </div>
              <div class="col-8">
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <h5 class="card-title mb-1">${item.nome}</h5>
                    <span class="price-chip">${item.preco}</span>
                  </div>
                  <p class="card-text">${item.descricao}</p>

                  <div class="d-flex gap-2 flex-wrap">
                    ${item.badges
                      .map(
                        (b) =>
                          `<span class="badge bg-${b.cor}-subtle text-${b.cor} border">${b.texto}</span>`
                      )
                      .join("")}
                  </div>

                  <button type="button" class="btn btn-primary mt-2"
                    data-bs-toggle="modal"
                    data-bs-target="#modal-${item.id}">
                    Ver mais detalhes
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      `;

      // MODAL
      modalsArea.innerHTML += `
        <div class="modal fade" id="modal-${item.id}">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content modal-elevated">
              <div class="modal-header">
                <h5 class="modal-title w-100 text-center fw-bold">${item.nome}</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
              </div>

              <div class="modal-body">
                <div class="row g-4">
                  <div class="col-md-6">
                    <img src="${item.imagem}" class="img-fluid rounded-3 w-100" />
                  </div>
                  <div class="col-md-6">
                    <p><strong>Descrição:</strong> ${item.descricao}</p>
                    <ul class="modal-list">
                      ${item.opcoes
                        .map(
                          (op) =>
                            `<li>${op.titulo} <span class="pill-price">${op.preco}</span></li>`
                        )
                        .join("")}
                    </ul>
                    <div class="modal-note">${item.nota}</div>
                  </div>
                </div>
              </div>

              <div class="modal-footer modal-footer-soft">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  });

  // Ativar filtros após carregar os itens
  applyFilters();
}

//footer.js
// Carrega o footer
fetch("footer.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("footer-container").innerHTML = html;

    // Atualiza ano automático
    document.getElementById("year").textContent = new Date().getFullYear();

    // Gera o QR Code
    const qr = document.getElementById("qrcode");
    if (qr) {
      new QRCode(qr, {
        text: "https://steakburger.forgedevapps.com/",
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  });
