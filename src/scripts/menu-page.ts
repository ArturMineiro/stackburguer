/**
 * Interatividade do cardápio (≈3 KB): busca, navegação por categorias com
 * destaque da seção atual, detalhes dos itens em <dialog> (com botão "voltar"
 * do celular fechando o detalhe), mesa vinda do QR Code e botão de voltar ao topo.
 */
import { matchesTokens, tokenize } from '../lib/search.ts';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');
const urlWithoutHash = () => `${location.pathname}${location.search}`;

function initSearch(): void {
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const clear = document.querySelector<HTMLButtonElement>('[data-search-clear]');
  const status = document.querySelector<HTMLElement>('[data-search-status]');
  const empty = document.querySelector<HTMLElement>('[data-search-empty]');
  const main = document.getElementById('cardapio');
  if (!input || !clear || !status || !empty || !main) return;

  const items = [...document.querySelectorAll<HTMLElement>('[data-menu-item]')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const navLinks = new Map(
    [...document.querySelectorAll<HTMLElement>('[data-nav-link]')].map((link) => [link.dataset.navLink, link]),
  );
  let statusTimer: number | undefined;

  const apply = () => {
    const query = input.value.trim();
    const tokens = tokenize(query);
    const searching = tokens.length > 0;
    let visible = 0;

    for (const item of items) {
      const show = !searching || matchesTokens(item.dataset.search ?? '', tokens);
      item.hidden = !show;
      if (show) visible += 1;
    }
    for (const section of sections) {
      const hasItems = section.querySelector('[data-menu-item]:not([hidden])') !== null;
      section.hidden = !hasItems;
      navLinks.get(section.dataset.section)?.toggleAttribute('data-empty', !hasItems);
    }

    main.classList.toggle('is-searching', searching);
    clear.hidden = input.value.length === 0;
    empty.hidden = !searching || visible > 0;

    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (!searching) status.textContent = '';
      else if (visible === 0) status.textContent = `Nenhum item encontrado para “${query}”.`;
      else
        status.textContent = `${visible} ${visible === 1 ? 'item encontrado' : 'itens encontrados'} para “${query}”.`;
    }, 250);

    document.dispatchEvent(new CustomEvent('menu:filtered'));
  };

  const reset = (focus = true) => {
    input.value = '';
    apply();
    if (focus) input.focus();
  };

  input.addEventListener('input', apply);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      reset();
    } else if (event.key === 'Enter') {
      input.blur(); // fecha o teclado no celular
    }
  });
  clear.addEventListener('click', () => reset());
  document.querySelector('[data-search-reset]')?.addEventListener('click', () => reset());
  document.addEventListener('menu:reset-search', () => reset(false));

  // Valor restaurado pelo navegador (voltar/avançar).
  if (input.value) apply();
}

function initCategoryNav(): void {
  const list = document.querySelector<HTMLElement>('[data-nav-list]');
  const nav = document.querySelector<HTMLElement>('.catnav');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  if (!list || !nav || links.length === 0) return;

  let current: string | undefined;
  let ticking = false;

  const setCurrent = (id: string | undefined) => {
    if (id === current) return;
    current = id;
    for (const link of links) {
      if (link.dataset.navLink === id) {
        link.setAttribute('aria-current', 'true');
        if (list.scrollWidth > list.clientWidth) {
          const left = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
          list.scrollTo({ left, behavior: scrollBehavior() });
        }
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };

  // O cabeçalho da seção é a referência (a seção tem respiro acima do título).
  const headOf = (section: HTMLElement) => section.querySelector<HTMLElement>('.section-head') ?? section;

  const update = () => {
    ticking = false;
    const line = nav.getBoundingClientRect().height + 48;
    const visible = sections.filter((section) => !section.hidden);
    let active: string | undefined;
    for (const section of visible) {
      if (headOf(section).getBoundingClientRect().top <= line) active = section.dataset.section;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom && visible.length > 0) active = visible[visible.length - 1]?.dataset.section;
    setCurrent(active);
  };

  const schedule = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('menu:filtered', schedule);
  update();

  for (const link of links) {
    link.addEventListener('click', (event) => {
      const id = link.dataset.navLink;
      const section = id ? document.getElementById(id) : null;
      if (!section) return;
      event.preventDefault();
      if (section.hidden) document.dispatchEvent(new CustomEvent('menu:reset-search'));
      headOf(section).scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      history.replaceState(history.state, '', `${urlWithoutHash()}#${id}`);
      section.querySelector<HTMLElement>('.section-title')?.focus({ preventScroll: true });
    });
  }
}

type OpenMode = 'push' | 'history' | 'deeplink';

function initItemDialogs(): void {
  const supported = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;
  const dialogs = new Map(
    [...document.querySelectorAll<HTMLDialogElement>('dialog[data-item-dialog]')].map((dialog) => [
      dialog.dataset.itemDialog,
      dialog,
    ]),
  );
  if (!supported || dialogs.size === 0) return;

  // true quando existe uma entrada no histórico só para o detalhe aberto
  let ownsHistoryEntry = false;

  const open = (id: string, mode: OpenMode) => {
    const dialog = dialogs.get(id);
    if (!dialog || dialog.open) return;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    for (const scroller of dialog.querySelectorAll<HTMLElement>('.sheet-card, .sheet-main')) scroller.scrollTop = 0;

    if (mode === 'push') {
      history.pushState({ dialog: id }, '', `${urlWithoutHash()}#item-${id}`);
      ownsHistoryEntry = true;
    } else {
      ownsHistoryEntry = mode === 'history';
    }
  };

  const close = (dialog: HTMLDialogElement) => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reducedMotion()) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    window.setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, 200);
  };

  for (const dialog of dialogs.values()) {
    dialog.addEventListener('close', () => {
      if (ownsHistoryEntry) {
        ownsHistoryEntry = false;
        history.back();
      } else if (location.hash === `#item-${dialog.dataset.itemDialog}`) {
        history.replaceState(history.state, '', urlWithoutHash());
      }
    });
    // Esc: fecha com animação.
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close(dialog);
    });
    // Toque fora do cartão (no fundo escurecido).
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close(dialog);
    });
    for (const button of dialog.querySelectorAll('[data-close-dialog]')) {
      button.addEventListener('click', () => close(dialog));
    }
  }

  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-open-item]');
    const id = trigger?.dataset.openItem;
    if (id) open(id, 'push');
  });

  // Botão "voltar" do celular/navegador fecha o detalhe; "avançar" reabre.
  window.addEventListener('popstate', (event) => {
    const openDialog = [...dialogs.values()].find((dialog) => dialog.open);
    const stateId = (event.state as { dialog?: string } | null)?.dialog;
    if (openDialog) {
      ownsHistoryEntry = false;
      close(openDialog);
    } else if (stateId) {
      open(stateId, 'history');
    }
  });

  // Link direto para um item: /#item-batata-frita
  const match = /^#item-([a-z0-9-]+)$/.exec(location.hash);
  if (match?.[1] && dialogs.has(match[1])) open(match[1], 'deeplink');
}

function initTableWelcome(): void {
  const raw = new URLSearchParams(location.search).get('mesa');
  if (!raw || !/^\d{1,3}$/.test(raw) || Number(raw) < 1) return;
  const banner = document.querySelector<HTMLElement>('[data-table-welcome]');
  const number = banner?.querySelector<HTMLElement>('[data-table-number]');
  if (!banner || !number) return;
  number.textContent = `mesa ${String(Number(raw)).padStart(2, '0')}`;
  banner.hidden = false;
}

function initBackToTop(): void {
  const button = document.querySelector<HTMLElement>('[data-back-to-top]');
  const hero = document.querySelector('.hero');
  if (!button || !hero || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    button.classList.toggle('is-visible', entry ? !entry.isIntersecting : false);
  }).observe(hero);

  button.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    history.replaceState(history.state, '', urlWithoutHash());
  });
}

function initYear(): void {
  const year = String(new Date().getFullYear());
  for (const element of document.querySelectorAll('[data-year]')) element.textContent = year;
}

initSearch();
initCategoryNav();
initItemDialogs();
initTableWelcome();
initBackToTop();
initYear();
