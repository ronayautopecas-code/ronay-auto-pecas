// Fundo de bolinhas que perseguem o mouse (efeito tipo Google Antigravity).
// Para usar em outra página: colocar <script src="particulas.js"></script> antes do </body>
// (ajustando o caminho, ex.: "../particulas.js" dentro das pastas; cores: ver CORES abaixo).
// O conteúdo da página precisa ter "position: relative; z-index: 1" para ficar na frente.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Cores: padrão = cores dos 3 catálogos + cinza (tela inicial escura).
  // Outra página pode trocar assim: <script src="../particulas.js" data-cores="#1d4ed8,#dc2626,#eab308"></script>
  const tag = document.currentScript;
  const CORES = tag && tag.dataset.cores
    ? tag.dataset.cores.split(",").map(function (c) { return c.trim(); })
    : ["#38bdf8", "#fbbf24", "#f87171", "#94a3b8"];
  const DENSIDADE = 5200;   // quanto MAIOR, MENOS bolinhas na tela
  const SEGUIDORAS = 0.35;  // fração das bolinhas que perseguem o mouse (0.35 = 35%)
  const ANEL_MIN = 25;      // distância mínima das seguidoras até o mouse
  const ANEL_MAX = 120;     // distância máxima das seguidoras até o mouse
  const EXPLOSAO_RAIO = 260;   // até que distância do clique a explosão empurra
  const EXPLOSAO_FORCA = 22;   // velocidade inicial das bolinhas na explosão
  const EXPLOSAO_TEMPO = 550;  // quanto tempo (ms) elas ficam soltas antes de voltar
  const ESPERA_LINK = 350;     // ms de espera antes de abrir um link, para dar tempo de ver a explosão

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "0"
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let W, H, parts = [];
  const mouse = { x: 0, y: 0, ativo: false };

  let largBase, altBase; // tamanho da tela quando as bolinhas foram espalhadas

  function tamanho() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function criar() {
    tamanho();
    largBase = W;
    altBase = H;

    const n = Math.round((W * H) / DENSIDADE);
    parts = [];
    for (let i = 0; i < n; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      parts.push({
        hx: x, hy: y, x: x, y: y, vx: 0, vy: 0,
        fase: Math.random() * Math.PI * 2,
        tam: 1.2 + Math.random() * 1.6, // raio da bolinha em pixels
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        segue: Math.random() < SEGUIDORAS,
        // cada seguidora tem seu lugar no anel e seu "motor" (velocidade e agilidade)
        orbita: ANEL_MIN + Math.random() * (ANEL_MAX - ANEL_MIN),
        giro: (Math.random() < 0.5 ? -1 : 1) * (0.0004 + Math.random() * 0.0008),
        velMax: 6 + Math.random() * 12,
        agil: 0.05 + Math.random() * 0.1
      });
    }
  }

  // Computador: segue o mouse
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.ativo = true;
  });
  document.addEventListener("pointerleave", function () { mouse.ativo = false; });
  window.addEventListener("blur", function () { mouse.ativo = false; });

  // Explosão: ao clicar/tocar, empurra para longe as bolinhas perto do ponto
  function explodir(x, y) {
    const agora = performance.now();
    for (const p of parts) {
      const dx = p.x - x, dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > EXPLOSAO_RAIO) continue;
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6; // um pouco de desordem
      const f = EXPLOSAO_FORCA * (1 - d / EXPLOSAO_RAIO) * (0.6 + Math.random() * 0.8);
      p.vx = Math.cos(a) * f;
      p.vy = Math.sin(a) * f;
      p.solta = agora + EXPLOSAO_TEMPO * (0.7 + Math.random() * 0.6);
    }
  }
  window.addEventListener("pointerdown", function (e) { explodir(e.clientX, e.clientY); });

  // Links que abrem na mesma aba: espera um instante antes de trocar de página,
  // senão a explosão nem aparece. Ctrl/Shift/clique do meio continuam normais.
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (link.target && link.target !== "_self") return;
    e.preventDefault();
    setTimeout(function () { window.location.href = link.href; }, ESPERA_LINK);
  });

  // Celular: segue o dedo, inclusive enquanto a pessoa rola a página
  // ("passive" garante que a rolagem continua normal); ao soltar, as bolinhas voltam
  let soltou;
  function toque(e) {
    const dedo = e.touches[0];
    if (!dedo) return;
    clearTimeout(soltou);
    mouse.x = dedo.clientX;
    mouse.y = dedo.clientY;
    mouse.ativo = true;
  }
  window.addEventListener("touchstart", toque, { passive: true });
  window.addEventListener("touchmove", toque, { passive: true });
  function soltar() {
    clearTimeout(soltou);
    soltou = setTimeout(function () { mouse.ativo = false; }, 1200);
  }
  window.addEventListener("touchend", soltar, { passive: true });
  window.addEventListener("touchcancel", soltar, { passive: true });

  // No celular a barra de endereço aparece/some ao rolar e muda a altura da tela;
  // por isso só reespalha as bolinhas se a largura mudar ou a altura mudar bastante
  // (ex.: girar o celular); nos outros casos só ajusta o tamanho da tela de desenho
  let espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      if (window.innerWidth !== largBase || Math.abs(window.innerHeight - altBase) > 150) criar();
      else tamanho();
    }, 150);
  });

  function quadro(t) {
    ctx.clearRect(0, 0, W, H);

    for (const p of parts) {
      let tx, ty, alfa;

      if (p.segue && mouse.ativo) {
        // alvo: um ponto girando em volta do mouse
        const a = p.fase + t * p.giro;
        tx = mouse.x + Math.cos(a) * p.orbita;
        ty = mouse.y + Math.sin(a) * p.orbita;
        alfa = 0.85;
      } else {
        // lugar de descanso com leve flutuação
        tx = p.hx + Math.sin(t * 0.0006 + p.fase) * 6;
        ty = p.hy + Math.cos(t * 0.0005 + p.fase) * 6;
        alfa = 0.3;
      }

      if (p.solta > t) {
        // logo depois da explosão: voa solta, só perdendo velocidade
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else {
        // pilotagem "teleguiada": corrige a direção aos poucos rumo ao alvo,
        // acelera quando está longe e freia ao chegar
        const dx = tx - p.x, dy = ty - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const vel = Math.min(p.velMax, d * 0.12);
        p.vx += ((dx / d) * vel - p.vx) * p.agil;
        p.vy += ((dy / d) * vel - p.vy) * p.agil;
      }
      p.x += p.vx;
      p.y += p.vy;

      ctx.globalAlpha = alfa;
      ctx.fillStyle = p.cor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(quadro);
  }

  criar();
  requestAnimationFrame(quadro);
})();
