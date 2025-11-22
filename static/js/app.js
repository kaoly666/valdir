// Camelo Danger - Carrinho e utilidades
(function(){
  const STORAGE_KEY = 'camelo_cart_v1';
  let products = []; // Will be loaded from API

  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

    // Load products from API
  async function loadProducts() {
    console.log('Iniciando carregamento de produtos...');
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        products = await response.json();
        // Convert price strings to numbers if needed
        products = products.map(p => ({
          ...p,
          preco: typeof p.preco === 'string' ? parseFloat(p.preco) : p.preco,
          img: p.imagem || '/static/images/placeholder.jpeg'
        }));

        console.log('Produtos carregados da API:', products);
        // Update cart prices for existing items
        updateCartPrices();
      } else {
        console.error('Falha ao carregar produtos da API');
        // Fallback to static products if API fails
        products = [
          { id: 1, nome: 'League of Legends', preco: 0, img: '/static/images/1.jpeg' },
          { id: 2, nome: 'Resident Evil 4 Remake', preco: 199.90, img: '/static/images/2.jpeg' },
          { id: 3, nome: 'GTA V', preco: 59.90, img: '/static/images/3.jpeg' },
          { id: 4, nome: 'Minecraft', preco: 49.90, img: '/static/images/4.jpeg' },
          { id: 5, nome: 'Call of Duty: Black Ops 6', preco: 179.90, img: '/static/images/5.jpeg' },
          { id: 6, nome: 'GTA 6 (Pré-venda)', preco: 80.00, img: '/static/images/6.jpeg' },
          { id: 7, nome: 'Monitor Gamer', preco: 1500.00, img: '/static/images/7.jpeg' },
          { id: 8, nome: 'Mousepad Grande', preco: 50.00, img: '/static/images/8.jpeg' }
        ];
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Fallback to static products
      products = [
        { id: 1, nome: 'League of Legends', preco: 0, img: '/static/images/1.jpeg' },
        { id: 2, nome: 'Resident Evil 4 Remake', preco: 199.90, img: '/static/images/2.jpeg' },
        { id: 3, nome: 'GTA V', preco: 59.90, img: '/static/images/3.jpeg' },
        { id: 4, nome: 'Minecraft', preco: 49.90, img: '/static/images/4.jpeg' },
        { id: 5, nome: 'Call of Duty: Black Ops 6', preco: 179.90, img: '/static/images/5.jpeg' },
        { id: 6, nome: 'GTA 6 (Pré-venda)', preco: 80.00, img: '/static/images/6.jpeg' },
        { id: 7, nome: 'Monitor Gamer', preco: 1500.00, img: '/static/images/7.jpeg' },
        { id: 8, nome: 'Mousepad Grande', preco: 50.00, img: '/static/images/8.jpeg' }
      ];
    }
  }

  // Update cart prices when products are loaded
  function updateCartPrices() {
    // Force re-render of cart UI with updated prices
    renderCartUI();
    renderCartPageIfNeeded();
    renderCheckoutPageIfNeeded();
    updateBadges();
  }

  // Cart state
  let cart = loadCart();
  function loadCart(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { items: [] };
    } catch(e){ return { items: [] }; }
  }
  function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function findProduct(id){ return products.find(p => p.id === id); }
  function formatBRL(v){
    if (typeof v !== 'number') return v || '';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function cartCount(){ return cart.items.reduce((s,i)=>s+i.qty,0); }
  function cartTotal(){ return cart.items.reduce((s,i)=> s + i.qty * (findProduct(i.id)?.preco || 0), 0); }

  function addToCart(id, qty=1){
    const numId = parseInt(id, 10); // Ensure ID is a number
    const item = cart.items.find(i=>i.id===numId);
    if(item){ item.qty += qty; }
    else { cart.items.push({ id: numId, qty }); }
    saveCart();
    renderCartUI();
    renderCartPageIfNeeded();
    updateBadges();
    // Notify user
    try {
      const p = findProduct(numId);
      const name = p ? p.nome : `Produto ${numId}`;
      if (window.showNotification) showNotification(`${name} adicionado ao carrinho!`, 'success');
    } catch(e){ /* ignore */ }
  }

  // Expose helper functions globally so inline onclick handlers (older templates)
  // or feature scripts can call them directly (e.g. onclick="addToCart(id)").
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.setCartQty = setQty;
  function removeFromCart(id){
    const numId = parseInt(id, 10);
    cart.items = cart.items.filter(i=>i.id!==numId);
    saveCart(); renderCartUI(); renderCartPageIfNeeded(); updateBadges();
  }
  function setQty(id, qty){
    const numId = parseInt(id, 10);
    const it = cart.items.find(i=>i.id===numId);
    if(!it) return;
    it.qty = Math.max(1, qty|0);
    saveCart(); renderCartUI(); renderCartPageIfNeeded(); updateBadges();
  }
  function clearCart(){ cart.items = []; saveCart(); renderCartUI(); renderCartPageIfNeeded(); updateBadges(); }

  // UI wiring
  function updateBadges(){
    qsa('[data-cart-badge]').forEach(b => b.textContent = cartCount());
  }

  function createCartSidebar(){
    if (qs('.cart-sidebar')) return;
    const aside = document.createElement('aside');
    aside.className = 'cart-sidebar';
    aside.innerHTML = `
      <div class="cart-header">
        <h3>Seu carrinho</h3>
        <button class="btn" data-close-cart>&times;</button>
      </div>
      <div class="cart-items" data-cart-items></div>
      <div class="cart-footer">
        <div class="cart-total">Total: <span data-cart-total></span></div>
        <div class="cart-actions">
          <button class="btn" data-clear-cart>Limpar</button>
          <button class="btn" data-checkout>Finalizar compra</button>
        </div>
      </div>
    `;
    document.body.appendChild(aside);

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'cart-toggle';
    toggle.setAttribute('aria-label','Abrir carrinho');
    toggle.innerHTML = 'Carrinho<span class="badge" data-cart-badge>0</span>';
    toggle.addEventListener('click', ()=> aside.classList.toggle('open'));
    document.body.appendChild(toggle);

    aside.addEventListener('click', (e)=>{
      const t = e.target;
      if (t.matches('[data-close-cart]')) aside.classList.remove('open');
      if (t.matches('[data-clear-cart]')) clearCart();
      if (t.matches('[data-checkout]')) checkout();
      if (t.matches('[data-inc]')) setQty(t.dataset.id, getQty(t.dataset.id)+1);
      if (t.matches('[data-dec]')) setQty(t.dataset.id, getQty(t.dataset.id)-1);
      if (t.matches('[data-remove]')) removeFromCart(t.dataset.id);
    });
  }

  function getQty(id){ const numId = parseInt(id, 10); const it = cart.items.find(i=>i.id===numId); return it?it.qty:0; }

  // Render util para reutilizar UI de itens do carrinho
  function fillCartList(target, { controls=false }={}){
    target.innerHTML = '';
    if(cart.items.length === 0){
      // Use a richer empty state for the sidebar to match the main cart page
      if (target.closest('.cart-sidebar')) {
        target.innerHTML = `
          <div class="cart-empty-state sidebar-empty">
            <div class="empty-cart-icon"></div>
            <h3>Seu carrinho está vazio</h3>
            <p>Adicione alguns produtos incríveis ao seu carrinho!</p>
            <a href="/produtos" class="btn btn-primary">Continuar Comprando</a>
          </div>`;
      } else {
        target.innerHTML = '<p class="empty">Seu carrinho está vazio.</p>';
      }
      return;
    }
    cart.items.forEach(({id, qty})=>{
      const p = findProduct(id); if(!p) return;
      const div = document.createElement('div');
      div.className = 'cart-item';
      const controlsHTML = controls ? `
            <div style=\"display:flex; gap:6px; margin-top:6px;\">
              <button class=\"btn\" data-dec data-id=\"${p.id}\">-</button>
              <span>${qty}</span>
              <button class=\"btn\" data-inc data-id=\"${p.id}\">+</button>
              <button class=\"btn\" data-remove data-id=\"${p.id}\">Remover</button>
            </div>` : '';
      div.innerHTML = `
        <img src=\"${p.img}\" alt=\"${p.nome}\">
        <div class=\"cart-item-info\">
          <div style=\"font-weight:bold\">${p.nome}</div>
          <div>${formatBRL(p.preco)} x ${qty} = <b>${formatBRL(p.preco*qty)}</b></div>
          ${controlsHTML}
        </div>
      `;
      target.appendChild(div);
    });
  }

  function renderCartUI(){
    const list = qs('[data-cart-items]');
    const totalEl = qs('[data-cart-total]');
    if(!list || !totalEl) return;

    fillCartList(list, { controls:true });
    totalEl.textContent = formatBRL(cartTotal());
  }

  function checkout(){
    // Redireciona para página interna de checkout
    window.location.href = '/checkout';
  }

  // Delegação global para botões de compra/adicionar (compacta listeners)
  document.addEventListener('click', (e)=>{
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) { addToCart(addBtn.dataset.productId, 1); }
    const buyBtn = e.target.closest('[data-buy-now]');
    if (buyBtn) { addToCart(buyBtn.dataset.productId, 1); window.location.href = '/checkout'; }
  });

  function renderCatalogIfNeeded(){
    const grid = qs('[data-catalog]');
    if(!grid) return; // not on catalog page
    grid.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'produto';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.nome}">
        <h2>${p.nome}</h2>
        ${p.precoDe ? `<p class="preco">${formatBRL(p.precoDe)}</p>` : ''}
        <p class="valor">${p.promoLabel ? p.promoLabel : formatBRL(p.preco)}</p>
        <button class="btn" data-add-to-cart data-product-id="${p.id}">Adicionar ao carrinho</button>
      `;
      grid.appendChild(card);
    });
  }

  function renderCartPageIfNeeded(){
    const page = qs('[data-cart-page]');
    if(!page) return; // not on cart page
    // If server-side provided a richer empty-state markup and the cart is empty,
    // prefer to keep that server-rendered UI instead of overwriting it here.
    // This prevents the undesired "flash then revert" behavior where the
    // page initially shows the server markup and then the client script
    // replaces it with an older/simpler layout.
    if (cart.items.length === 0 && qs('.cart-empty-state', page)) {
      return; // keep server-provided empty state
    }
    page.innerHTML = '';
    // Create a card/panel container so the JS-rendered cart page matches the
    // server-provided rounded/card UI instead of producing a square block.
    const card = document.createElement('div');
    card.className = 'cart-panel';

    const title = document.createElement('h2');
    title.textContent = 'Meu Carrinho';
    card.appendChild(title);

    const list = document.createElement('div');
    card.appendChild(list);
    fillCartList(list, { controls:true });

    const bar = document.createElement('div');
    // Use existing cart-footer class so we don't rely on the deprecated
    // page-action-bar class which is being removed.
    bar.className = 'cart-footer';
    bar.innerHTML = `
      <div class="cart-total">Total: <span>${formatBRL(cartTotal())}</span></div>
      <div class="cart-actions" style="justify-content:center;">
        <button class="btn" data-clear-cart>Limpar</button>
        <button class="btn" data-checkout>Finalizar compra</button>
      </div>`;
    card.appendChild(bar);
    page.appendChild(card);
  }

  function renderCheckoutPageIfNeeded(){
    const container = qs('[data-checkout-page]');
    if(!container) return; // not on checkout page
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'checkout';
    wrap.innerHTML = `
      <h2>Finalizar compra</h2>
      <div class="checkout-grid">
        <div class="summary" data-checkout-summary></div>
        <div class="form-card">
          <form data-checkout-form>
            <div class="form-row">
              <label for="nome">Nome completo</label>
              <input id="nome" name="nome" required>
            </div>
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required>
            </div>
            <div class="form-row">
              <label for="endereco">Endereço</label>
              <textarea id="endereco" name="endereco" rows="3" required></textarea>
            </div>
            <div class="form-row">
              <label for="pagamento">Forma de pagamento</label>
              <select id="pagamento" name="pagamento" required>
                <option value="pix">PIX</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" data-keep-shopping>Continuar comprando</button>
              <button type="submit" class="btn btn-primary">Finalizar pedido</button>
            </div>
          </form>
        </div>
      </div>
      <div data-checkout-result></div>
    `;
    container.appendChild(wrap);

    renderCheckoutSummary();

    const form = qs('[data-checkout-form]');
    const result = qs('[data-checkout-result]');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(cart.items.length === 0){
        alert('Seu carrinho está vazio.');
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      const orderId = 'CD-' + Math.random().toString(36).slice(2,8).toUpperCase();
      result.innerHTML = `
        <div class="summary" style="margin-top:16px;">
          <h3>Pedido confirmado!</h3>
          <p>Obrigado, <b>${data.nome}</b>. Enviamos a confirmação para <b>${data.email}</b>.</p>
          <p><b>Nº do pedido:</b> ${orderId}</p>
          <p><b>Total pago:</b> ${formatBRL(cartTotal())}</p>
        </div>
      `;
      clearCart();
      form.reset();
      renderCheckoutSummary();
    });
    qs('[data-keep-shopping]').addEventListener('click', ()=>{ window.location.href = '/'; });
  }

  function renderCheckoutSummary(){
    const box = qs('[data-checkout-summary]');
    if(!box) return;
    box.innerHTML = '';
    fillCartList(box, { controls:false });
    const totals = document.createElement('div');
    totals.className = 'totals';
    totals.innerHTML = `
      <div>Subtotal: ${formatBRL(cartTotal())}</div>
      <div>Frete: ${formatBRL(0)}</div>
      <div>Total: <b>${formatBRL(cartTotal())}</b></div>
    `;
    box.appendChild(totals);
  }

  // Delegação de eventos para a página de carrinho (evita duplicar com o sidebar)
  document.addEventListener('click', (e) => {
    const container = e.target.closest('[data-cart-page]');
    if (!container) return; // só trata eventos dentro da página de carrinho
    const t = e.target;
    if (t.matches('[data-clear-cart]')) { clearCart(); }
    if (t.matches('[data-checkout]')) { checkout(); }
    if (t.matches('[data-inc]')) { setQty(t.dataset.id, getQty(t.dataset.id)+1); }
    if (t.matches('[data-dec]')) { setQty(t.dataset.id, getQty(t.dataset.id)-1); }
    if (t.matches('[data-remove]')) { removeFromCart(t.dataset.id); }
  });

  function markActiveNav(){
    const path = location.pathname;
    qsa('.navbar a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if ((href.endsWith('index.html') || href === '/' || href === './') && (path === '/' || path.endsWith('/index.html'))) {
        a.classList.add('active');
      } else if ((href.endsWith('carrinho.html') || href.endsWith('/carrinho')) && (path.endsWith('/carrinho.html') || path.endsWith('/carrinho'))) {
        a.classList.add('active');
      } else if ((href.endsWith('checkout.html') || href.endsWith('/checkout')) && (path.endsWith('/checkout.html') || path.endsWith('/checkout'))) {
        a.classList.add('active');
      } else if ((href === './' || href === '/') && (path === '/' || path.endsWith('/index.html'))) {
        a.classList.add('active');
      }
    });
  }

  // Startup
  document.addEventListener('DOMContentLoaded', () => {
    createCartSidebar();
    // Load products first, then render UI
    loadProducts().then(() => {
      renderCartUI();
      updateBadges();
      renderCatalogIfNeeded();
      renderCartPageIfNeeded();
      renderCheckoutPageIfNeeded();
      markActiveNav();
    });
  });
})();
