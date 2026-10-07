// Monta a grade de produtos do catálogo a partir do objeto "produtos" (produtos.js da pasta).
// Para adicionar um produto basta criar o bloco no produtos.js e colocar a foto em img/.
// Campo opcional "nomeCard": nome curto exibido no cartão e no WhatsApp (se faltar, usa "titulo").
(function () {
  const WHATSAPP = "5511985823312";
  const grade = document.getElementById("grade");

  Object.keys(produtos).forEach(function (id) {
    const item = produtos[id];
    const nome = item.nomeCard || item.titulo;
    const semEstoque = item.status === "Sem estoque";

    const card = document.createElement("div");
    card.className = "product-card";

    const link = document.createElement("a");
    link.href = "produto.html?id=" + encodeURIComponent(id);
    link.target = "_blank";
    link.className = "product-link";

    const imageBox = document.createElement("div");
    imageBox.className = "image-box";
    const img = document.createElement("img");
    img.src = item.imagem;
    img.alt = nome;
    img.loading = "lazy";
    imageBox.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";
    const titulo = document.createElement("div");
    titulo.className = "product-title";
    titulo.textContent = nome;
    const badge = document.createElement("span");
    badge.className = "badge-status";
    if (semEstoque) {
      badge.textContent = "✖ Fora de Estoque";
      badge.style.backgroundColor = "#ffebee";
      badge.style.color = "#c62828";
    } else {
      badge.textContent = "✔ Pronta Entrega";
    }
    body.appendChild(titulo);
    body.appendChild(badge);

    link.appendChild(imageBox);
    link.appendChild(body);

    const rodape = document.createElement("div");
    rodape.style.padding = "0 0.85rem 0.85rem";
    const zap = document.createElement("a");
    zap.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent("Olá! Gostaria de cotar o " + nome);
    zap.target = "_blank";
    zap.className = "btn-zap";
    zap.textContent = "Cotar no WhatsApp";
    rodape.appendChild(zap);

    card.appendChild(link);
    card.appendChild(rodape);
    grade.appendChild(card);
  });
})();
