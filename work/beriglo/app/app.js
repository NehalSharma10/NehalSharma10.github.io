/* Beriglo prototype — hash router, pages, cart, guest + demo checkout, account. */

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const app = $("#app");
const rs = n => "Rs. " + n.toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ic = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const go = path => { location.hash = "#/" + path; };
const redirect = path => { location.replace("#/" + path); };
const ritualFull = r => r.steps.reduce((s, st) => s + P[st[1]].price, 0);
const duoFull = b => b.items.reduce((s, id) => s + P[id].price, 0);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// Responsive <img>. Fixed width/height reserve space (no layout shift); srcset lets phones load small files.
// Alt text: a product photo is named after its product unless the caller gives its own text.
const altFor = f => { for (const o of [...Object.values(P), ...Object.values(B), ...Object.values(R)]) if (o.img === f) return o.name; return ""; };
const pic = (f, {alt, sizes = "(min-width:1024px) 33vw, 50vw", eager = false, w = 800, h = 1000} = {}) =>
  `<img src="${img(f, 800)}" srcset="${srcset(f)}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt ?? altFor(f))}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

// Star rating drawn to the real value (4.53 → four and a half stars), with an accessible label.
const starRow = v => `<span class="stars" aria-hidden="true"><span class="stars-bg">${ic("star").repeat(5)}</span><span class="stars-fg" style="width:${(v / 5) * 100}%">${ic("star").repeat(5)}</span></span>`;
const ratingLine = (v, n) => `<span class="rating-line" role="img" aria-label="Rated ${v.toFixed(2)} out of 5 from ${n} reviews">${starRow(v)}<span class="small"><b>${v.toFixed(2)}</b> · ${n} reviews</span></span>`;

// Pick a column count per breakpoint that leaves no orphan card where possible.
function fit(n, options){
  let best = options[options.length - 1], bestEmpty = Infinity;
  for (const c of options){
    if (c > n && c !== options[options.length - 1]) continue;
    const empty = (c - (n % c)) % c;
    if (empty < bestEmpty){ best = c; bestEmpty = empty; }
  }
  return best;
}
const gridFor = (n, {sm = [1], md = [2, 1], lg = [3, 2], xl = lg} = {}) =>
  `--sm:${fit(n, sm)};--md:${fit(n, md)};--lg:${fit(n, lg)};--xl:${fit(n, xl)}`;
const PRODUCT_GRID = {sm:[2], md:[3,2], lg:[4,3], xl:[5,4,3]};
const BUNDLE_GRID  = {sm:[1], md:[2,1], lg:[3,2], xl:[4,3,2]};
const RITUAL_GRID  = {sm:[1], md:[1], lg:[2,1], xl:[2,1]};

/* ---------- Storage (per-browser, prototype only) ---------- */
const store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem("bg-" + k)) ?? d; } catch { return d; } },
  set(k, v){ try { localStorage.setItem("bg-" + k, JSON.stringify(v)); } catch {} },
};
let cart = store.get("cart", []).filter(l => P[l.id] || B[l.id] || R[l.id]);
let user = store.get("user", null);
let orders = store.get("orders", []);
let savedAddress = store.get("address", null);

function lookup(id){
  if (P[id]) return {name:P[id].name, price:P[id].price, img:P[id].img, sub:P[id].kind, href:`#/product/${id}`};
  if (B[id]) return {name:B[id].name, price:B[id].price, img:B[id].img, sub:B[id].items.map(i => P[i].name).join(" + "), href:`#/bundle/${id}`};
  if (R[id]) return {name:R[id].name, price:R[id].price, img:R[id].img, sub:R[id].steps.map(st => P[st[1]].name).join(" + "), href:`#/ritual/${id}`};
}
const inCart = id => cart.find(l => l.id === id)?.qty || 0;
const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
const cartTotal = () => cart.reduce((s, l) => s + lookup(l.id).price * l.qty, 0);
const saveCart = () => { store.set("cart", cart); updateHeader(); };
function setQty(id, qty){
  const line = cart.find(l => l.id === id);
  if (qty <= 0) cart = cart.filter(l => l.id !== id);
  else if (line) line.qty = Math.min(qty, 20);
  else cart.push({id, qty:Math.min(qty, 20)});
  saveCart();
}
const snapshot = () => JSON.parse(JSON.stringify(cart));
// Any change that removes something offers Undo.
function undoable(msg, before){
  toast(msg, {type:"info", action:{label:"Undo", fn(){ cart = before; saveCart(); refreshCartControls(); if (location.hash === "#/cart") render({keepScroll:true}); toast("Restored to your cart"); }}});
}

/* ---------- Shared components ---------- */
const crumbs = items => `<nav aria-label="Breadcrumb" class="container"><ol class="crumbs">${
  items.map(([label, href]) => `<li>${href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`}</li>`).join("")}</ol></nav>`;

/* Cart-aware add controls.
   Not in cart → "Add to cart" button. In cart → "− N +": − / + edit the cart, the number opens the cart page.
   They re-render whenever the cart changes, so the state is always visible and survives navigation. */
const stepper = (id, size) => `<div class="incart ${size}" role="group" aria-label="${esc(lookup(id).name)} in your cart">
  <button type="button" data-cdec="${id}" aria-label="Remove one ${esc(lookup(id).name)}">−</button>
  <a class="incart-n" href="#/cart" aria-label="${inCart(id)} in cart. View cart">${inCart(id)}</a>
  <button type="button" data-cinc="${id}" aria-label="Add one more ${esc(lookup(id).name)}">+</button></div>`;
const addCtlInner = (id, label, cls) => inCart(id)
  ? stepper(id, cls.includes("block") ? "block" : cls.includes("sm") ? "sm" : "")
  : `<button class="${cls}" data-add="${id}">${label}</button>`;
const addCtl = (id, label, cls) => `<span class="addctl" data-id="${id}" data-label="${esc(label)}" data-cls="${cls}">${addCtlInner(id, label, cls)}</span>`;
const qtyPicker = () => `<div class="qty" role="group" aria-label="Quantity"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><output id="qty">1</output><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>`;
const qtyValue = () => +($("#qty")?.textContent || 1);
const buyCtlInner = (id, label) => inCart(id)
  ? `<div class="buy-row in">${stepper(id, "lg")}<button class="btn" data-buy="${id}">Checkout now ${ic("arrow")}</button></div>`
  : `<div class="buy-row">${qtyPicker()}<button class="btn" data-add-qty="${id}">${label}</button><button class="btn ghost" data-buy="${id}">Buy now</button></div>`;
const buyCtl = (id, label) => `<div class="buyctl" data-id="${id}" data-label="${esc(label)}">${buyCtlInner(id, label)}</div>`;
function refreshCartControls(host, selector){
  document.querySelectorAll(".addctl").forEach(el => { el.innerHTML = addCtlInner(el.dataset.id, el.dataset.label, el.dataset.cls); });
  document.querySelectorAll(".buyctl").forEach(el => { el.innerHTML = buyCtlInner(el.dataset.id, el.dataset.label); });
  if (host){
    (host.querySelector(selector) || host.querySelector("button, a"))?.focus({preventScroll:true});
    host.querySelector(".incart")?.classList.add("pop");
  }
}

// Sticky bar for phones and tablets: keeps price + main action in reach once the main buttons scroll away.
const buyBar = (id, label) => { const it = lookup(id); return `
  <div class="buybar" id="buybar" aria-hidden="true"><div class="container buybar-in">
    <div class="bb-info"><b>${it.name}</b><span class="price">${rs(it.price)}</span></div>
    ${addCtl(id, label, "btn")}
  </div></div>`; };
function watchBar(target, untilSeen = false){
  const bar = $("#buybar"); if (!bar || !target) return;
  let queued = false;
  const update = () => {
    queued = false;
    const r = target.getBoundingClientRect();
    const show = r.bottom < 0 || (untilSeen && r.top > innerHeight);   // main buttons are above the screen (or, on the routine result, still below it)
    bar.classList.toggle("on", show); bar.setAttribute("aria-hidden", !show);
    document.body.classList.toggle("bar-on", show);
  };
  const onScroll = () => { if (!queued){ queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, {passive:true}); addEventListener("resize", onScroll);
  update();
  cleanup.push(() => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); document.body.classList.remove("bar-on"); });
}

const productCard = p => `
  <article class="pcard">
    <a class="ph" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">${pic(p.img)}<span class="kind">${p.kind}</span></a>
    <h3><a href="#/product/${p.id}">${p.name}</a></h3>
    ${ratingLine(p.rating, p.reviews)}
    <p class="desc">${p.short}</p>
    <div class="ingr" aria-label="Key ingredients">${p.ingr.slice(0, 3).map(i => `<span>${i}</span>`).join("")}</div>
    <div class="row"><span class="price">${rs(p.price)}</span>${addCtl(p.id, "Add to cart", "btn sm ghost")}</div>
  </article>`;

const bundleCard = b => `
  <article class="bcard"><div class="bcard-in">
    <a class="ph" href="#/bundle/${b.id}" tabindex="-1" aria-hidden="true">${pic(b.img, {sizes:"140px"})}</a>
    <div class="stack" style="--s:8px">
      <span class="eyebrow">Duo · ${CAT_NAME[b.cat]}</span>
      <h3><a href="#/bundle/${b.id}">${b.name}</a></h3>
      <p class="contains">${b.items.map(i => P[i].name).join(" + ")}</p>
      <div class="cluster" style="--s:8px"><span class="price">${rs(b.price)}</span><s class="muted small">${rs(duoFull(b))}</s><span class="save">Save ${rs(duoFull(b) - b.price)}</span></div>
      <div style="margin-top:auto">${addCtl(b.id, "Add to cart", "btn sm")}</div>
    </div>
  </div></article>`;

// compact: number + role + name + price. detailed: image + step + name + how-to.
const stepList = (r, detailed = false) => `<ol class="steplist${detailed ? " big" : ""}">${r.steps.map(([role, id, how], i) => `
  <li>${detailed ? pic(P[id].img, {sizes:"72px", w:72, h:90}) : `<span class="n">${i + 1}</span>`}
    <div><span class="what">${detailed ? `Step ${i + 1} · ` : ""}${role}</span><a href="#/product/${id}">${P[id].name}</a>${detailed && how ? `<span class="how">${how}</span>` : ""}</div>
    <span class="p">${rs(P[id].price)}</span></li>`).join("")}</ol>`;

const ritualPricing = r => {
  const full = ritualFull(r);
  return `<div class="pricing"><span class="now">${rs(r.price)}</span><s>${rs(full)}</s><span class="save">You save ${rs(full - r.price)}</span></div>`;
};
const duoPricing = b => `<div class="pricing"><span class="now">${rs(b.price)}</span><s>${rs(duoFull(b))}</s><span class="save">You save ${rs(duoFull(b) - b.price)}</span></div>`;

const ritualCard = r => `
  <article class="rcard"><div class="rcard-in">
    <a class="ph" href="#/ritual/${r.id}" tabindex="-1" aria-hidden="true">${pic(r.img, {sizes:"(min-width:1024px) 25vw, 100vw"})}</a>
    <div class="body">
      <div class="stack" style="--s:6px"><span class="eyebrow">${r.steps.length} steps · use in this order</span><h3><a href="#/ritual/${r.id}">${r.name}</a></h3></div>
      <p class="muted small">${r.desc}</p>
      ${stepList(r)}
      ${ritualPricing(r)}
      <div class="cluster">${addCtl(r.id, `Add ritual · ${rs(r.price)}`, "btn")}<a class="btn ghost" href="#/ritual/${r.id}">View ritual</a></div>
    </div>
  </div></article>`;

const grid = (items, card, spec) => `<div class="grid" style="${gridFor(items.length, spec)}">${items.map(card).join("")}</div>`;

// Store promises, worded to match beriglo.com's banner and policies.
const promise = () => `
  <section class="promise section tight" aria-label="Shopping with Beriglo"><div class="container">
    <ul class="grid" style="--sm:1;--md:2;--lg:4">
      <li>${ic("truck")}<div><b>Free shipping</b><span>Delivered across India in ${STORE.delivery}.</span></div></li>
      <li>${ic("cash")}<div><b>Cash on delivery</b><span>Pay when your order arrives.</span></div></li>
      <li>${ic("return")}<div><b>7-day returns</b><span>For damaged, leaked or defective items. <a href="#/">Refund policy</a></span></div></li>
      <li>${ic("chat")}<div><b>Easy support</b><span>Email <span class="nowrap">${STORE.support}</span></span></div></li>
    </ul>
  </div></section>`;

const facts = () => `<div class="facts">
  <div>${ic("truck")}<span><b>Free shipping</b>Estimated delivery ${STORE.delivery}.</span></div>
  <div>${ic("cash")}<span><b>Cash on delivery</b>Pay when your order arrives.</span></div>
  <div>${ic("return")}<span><b>7-day returns</b>${STORE.returns} <a href="#/">Refund policy</a></span></div>
</div>`;

const details = items => `<div class="accordion">${items.filter(([, body]) => body).map(([title, body], i) => `
  <details ${i === 0 ? "open" : ""}><summary>${title}${ic("chev")}</summary><div class="acc-body">${body}</div></details>`).join("")}</div>`;

/* ---------- Pages ---------- */
const pages = {};
let cleanup = [];

pages.home = () => {
  const featured = ["smoothing-shampoo","anti-hairfall-serum","radiance-serum","advanced-uv-protection-spf-moisturizer"].map(id => P[id]);
  const bundles = ["smoothing-hair-care-duo","hairfall-care-duo","daily-skin-duo","daily-glow-duo"].map(id => B[id]);
  return {title:"Beriglo", html:`
  <div class="hero">
    <img src="${img(HERO)}" sizes="100vw" width="2000" height="1125" alt="A woman walking down a sunlit city street with a coffee" fetchpriority="high">
    <div class="container stack" style="--s:24px">
      <h1>Take care of it. <em>Then get on with your day.</em></h1>
      <p>Simple hair and skin routines, built around real life. Tell us what you want to fix and we'll show you exactly what to use.</p>
      <div class="hero-actions">
        <a class="btn light" href="#/routine">Find your routine ${ic("arrow")}</a>
        <span class="hero-links">or shop <a href="#/shop/hair">Hair Care</a> · <a href="#/shop/skin">Skin Care</a></span>
      </div>
    </div>
  </div>

  <section class="section"><div class="container split">
    <div class="stack">
      <span class="eyebrow">Why Beriglo</span>
      <h2>Personal care shouldn’t be another thing to figure out.</h2>
      <p class="lead">Thoughtful hair and skin care designed around real life, with simple routines that are easier to understand and keep up with.</p>
    </div>
    <div class="stack" style="--s:24px">
      ${["hair","skin"].map(cat => `<div class="stack" style="--s:12px">
        <span class="eyebrow">What would you like help with? · ${CAT_NAME[cat]}</span>
        <div class="cluster" style="--s:10px">${CONCERNS[cat].map((c, i) => `<a class="chip" href="#/routine/${cat}/${i}">${c.label}${ic("arrow")}</a>`).join("")}</div>
      </div>`).join("")}
    </div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    <div class="grid" style="--sm:1;--md:2;--lg:2">
      <a class="tile" href="#/shop/hair">${pic(R["anti-hairfall-ritual"].img, {sizes:"(min-width:640px) 50vw, 100vw"})}<div class="stack"><span class="eyebrow on-dark">4 products · 3 duos · 2 rituals</span><h3>Hair Care</h3><span class="link">Shop hair care ${ic("arrow")}</span></div></a>
      <a class="tile" href="#/shop/skin">${pic(R["radiance-face-ritual"].img, {sizes:"(min-width:640px) 50vw, 100vw"})}<div class="stack"><span class="eyebrow on-dark">6 products · 4 duos · 4 rituals</span><h3>Skin Care</h3><span class="link">Shop skin care ${ic("arrow")}</span></div></a>
    </div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    <div class="sec-head"><div class="stack"><span class="eyebrow">Shop</span><h2>Featured products</h2></div>
      <div class="cluster"><a class="link" href="#/shop/hair">All hair care ${ic("arrow")}</a><a class="link" href="#/shop/skin">All skin care ${ic("arrow")}</a></div></div>
    ${grid(featured, productCard, PRODUCT_GRID)}
  </div></section>

  <section class="section dark"><div class="container split" style="align-items:center">
    <div class="stack">
      <span class="eyebrow on-dark">Find your routine · 3 quick steps</span>
      <h2>Not sure where to start?</h2>
      <p class="lead on-dark">Pick hair or skin, tell us what's bothering you, and we'll match you to the routine made for it, with every step in order.</p>
      <div class="cluster"><a class="btn light" href="#/routine">Start now ${ic("arrow")}</a></div>
    </div>
    <div class="grid" style="--sm:2;--md:2;--lg:2">
      <a class="choice on-dark-card" href="#/routine/hair">${pic(R["salon-finish-ritual"].img, {sizes:"25vw"})}<div class="stack"><b>Hair</b><span class="small on-dark">3 concerns</span></div></a>
      <a class="choice on-dark-card" href="#/routine/skin">${pic(R["anti-acne-face-ritual"].img, {sizes:"25vw"})}<div class="stack"><b>Skin</b><span class="small on-dark">5 concerns</span></div></a>
    </div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><div class="stack"><span class="eyebrow">Rituals</span><h2>Complete routines, in order</h2><p class="lead">Every product you need, numbered in the order you use them. Buy the full ritual and save about 30%.</p></div>
      <div class="cluster"><a class="link" href="#/shop/hair/rituals">Hair rituals ${ic("arrow")}</a><a class="link" href="#/shop/skin/rituals">Skin rituals ${ic("arrow")}</a></div></div>
    ${grid([R["anti-hairfall-ritual"], R["radiance-face-ritual"]], ritualCard, RITUAL_GRID)}
  </div></section>

  <section class="section band"><div class="container">
    <div class="sec-head"><div class="stack"><span class="eyebrow">Bundles</span><h2>Make it easier.</h2><p class="lead">Two products that work together, for less than buying them separately.</p></div>
      <div class="cluster"><a class="link" href="#/shop/hair/bundles">Hair duos ${ic("arrow")}</a><a class="link" href="#/shop/skin/bundles">Skin duos ${ic("arrow")}</a></div></div>
    ${grid(bundles, bundleCard, {sm:[1], md:[2], lg:[2], xl:[4,2]})}
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><div class="stack"><span class="eyebrow">Reviews</span><h2>Real experiences</h2></div>
      <div class="cluster" style="--s:14px" role="img" aria-label="Rated ${STORE.rating} out of 5 from ${STORE.reviews} reviews across all products">
        <span class="big-rating" aria-hidden="true">${STORE.rating}</span><div aria-hidden="true">${starRow(STORE.rating)}<div class="small muted">${STORE.reviews} reviews across all products</div></div></div></div>
    <div class="grid" style="--sm:1;--md:2;--lg:3">${REVIEWS.map(([q, who, pid]) => `
      <figure class="review"><blockquote>“${q}”</blockquote>
        <figcaption><b>${who}</b><br><span class="muted">on <a href="#/product/${pid}">${P[pid].name}</a></span></figcaption></figure>`).join("")}</div>
  </div></section>

  ${promise()}

  <section class="section closing"><div class="container stack">
    <h2>Go take care of yourself.</h2>
    <p class="lead">Simple routines for hair and skin, designed to fit into real life.</p>
    <a class="btn" href="#/routine">Find your routine ${ic("arrow")}</a>
  </div></section>`};
};

/* Sort menu: a button + listbox, so the list always opens right under the control. */
const SORTS = {featured:"Featured", rating:"Top rated", low:"Price: low to high", high:"Price: high to low"};
let sortBy = "featured";
const sortMenu = () => `
  <div class="dd" id="sortMenu">
    <button type="button" class="dd-btn" id="sortBtn" aria-haspopup="listbox" aria-expanded="false" aria-controls="sortList">
      <span class="dd-key">Sort</span><span class="dd-val" id="sortVal">${SORTS[sortBy]}</span>${ic("chev")}
    </button>
    <ul class="dd-menu" id="sortList" role="listbox" aria-label="Sort by" tabindex="-1" hidden>
      ${Object.entries(SORTS).map(([k, v]) => `<li role="option" id="sort-${k}" data-v="${k}" aria-selected="${k === sortBy}">${v}${ic("check")}</li>`).join("")}
    </ul>
  </div>`;
function bindSortMenu(onChange){
  const wrap = $("#sortMenu"), btn = $("#sortBtn"), list = $("#sortList"), opts = [...list.children];
  let active = 0;
  const highlight = i => { active = (i + opts.length) % opts.length; opts.forEach((o, j) => o.classList.toggle("active", j === active)); list.setAttribute("aria-activedescendant", opts[active].id); };
  const open = viaKeyboard => {
    list.hidden = false; list.classList.toggle("kbd", !!viaKeyboard);
    btn.setAttribute("aria-expanded", "true"); highlight(opts.findIndex(o => o.dataset.v === sortBy));
    list.focus({preventScroll:true}); document.addEventListener("pointerdown", outside);
  };
  const close = (focus = true) => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); document.removeEventListener("pointerdown", outside); if (focus) btn.focus({preventScroll:true}); };
  const outside = e => { if (!wrap.contains(e.target)) close(false); };
  const choose = i => {
    sortBy = opts[i].dataset.v;
    opts.forEach((o, j) => o.setAttribute("aria-selected", j === i));
    $("#sortVal").textContent = SORTS[sortBy];
    close(); onChange();
  };
  btn.onclick = e => list.hidden ? open(e.detail === 0) : close();
  btn.onkeydown = e => { if (["ArrowDown","ArrowUp"].includes(e.key)){ e.preventDefault(); open(true); } };
  list.onkeydown = e => {
    list.classList.add("kbd");
    if (e.key === "ArrowDown"){ e.preventDefault(); highlight(active + 1); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); highlight(active - 1); }
    else if (e.key === "Home"){ e.preventDefault(); highlight(0); }
    else if (e.key === "End"){ e.preventDefault(); highlight(opts.length - 1); }
    else if (e.key === "Enter" || e.key === " "){ e.preventDefault(); choose(active); }
    else if (e.key === "Escape" || e.key === "Tab"){ e.stopPropagation(); close(e.key === "Escape"); }
  };
  opts.forEach((o, i) => { o.onclick = () => choose(i); o.onpointermove = () => highlight(i); });
  cleanup.push(() => document.removeEventListener("pointerdown", outside));
}

// Every product, duo and ritual carries the concerns Beriglo says it is for.
const productsOf = item => P[item.id] ? [item.id] : B[item.id] ? item.items : item.steps.map(s => s[1]);
const matchesConcern = (item, key) => !key || item.concerns.includes(key);
const ratingOf = item => P[item.id] ? item.rating : 0;
let concernFilter = null;

pages.shop = (cat, section = "products") => {
  if (!CAT_NAME[cat]) return pages.notFound();
  if (!["products","bundles","rituals"].includes(section)) section = "products";
  if (concernFilter && !CONCERNS[cat].some(c => c.key === concernFilter)) concernFilter = null;
  const sets = {products:PRODUCTS, bundles:BUNDLES, rituals:RITUALS};
  const label = {products:"Products", bundles:"Bundles", rituals:"Rituals"};
  const leads = {
    products:"Everything we make, one product at a time.",
    bundles:"Two products that work together, for less than buying them separately.",
    rituals:"Complete routines with every step in order, about 30% less than buying separately.",
  };
  const items = () => {
    const list = sets[section].filter(i => i.cat === cat && matchesConcern(i, concernFilter));
    if (sortBy === "low") list.sort((a, b) => a.price - b.price);
    if (sortBy === "high") list.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") list.sort((a, b) => ratingOf(b) - ratingOf(a));
    return list;
  };
  const listHtml = () => {
    const list = items();
    $("#shopCount") && ($("#shopCount").textContent = plural(list.length, label[section].toLowerCase().replace(/s$/, "")));
    if (!list.length) return `<div class="empty"><p class="muted">No ${label[section].toLowerCase()} for this concern yet.</p><button class="btn ghost" data-filter="">Show all ${label[section].toLowerCase()}</button></div>`;
    const card = {products:productCard, bundles:bundleCard, rituals:ritualCard}[section];
    const spec = {products:PRODUCT_GRID, bundles:BUNDLE_GRID, rituals:RITUAL_GRID}[section];
    return grid(list, card, spec);
  };
  const chips = () => `<div class="filters" role="group" aria-label="Filter by concern">
    <span class="small muted">Filter by concern</span>
    <button class="fchip" data-filter="" aria-pressed="${!concernFilter}">All</button>
    ${CONCERNS[cat].map(c => `<button class="fchip" data-filter="${c.key}" aria-pressed="${concernFilter === c.key}">${c.label}</button>`).join("")}</div>`;
  return {title:`${CAT_NAME[cat]} ${label[section]} – Beriglo`, html:`
    ${crumbs([["Home","#/"],[CAT_NAME[cat], `#/shop/${cat}`],[label[section]]])}
    <div class="container page-head stack" style="--s:20px">
      <div class="stack" style="--s:8px"><span class="eyebrow">Shop</span><h1>${CAT_NAME[cat]}</h1><p class="lead">${leads[section]}</p></div>
      <div class="cluster between">
        <nav class="seg" aria-label="${CAT_NAME[cat]} sections">${Object.keys(label).map(s => `<a href="#/shop/${cat}/${s}" ${s === section ? 'aria-current="page"' : ""}>${label[s]}</a>`).join("")}</nav>
        <div class="shop-tools">
          <span class="small muted" id="shopCount" aria-live="polite">${plural(items().length, label[section].toLowerCase().replace(/s$/, ""))}</span>
          ${sortMenu()}
        </div>
      </div>
      <div id="chipRow">${chips()}</div>
    </div>
    <section class="container" style="padding-bottom:var(--section)" id="shopList">${listHtml()}</section>
    <section class="section" style="background:var(--sand)"><div class="container cluster between">
      <div class="stack" style="--s:6px"><h2 style="font-size:var(--h3)">Not sure which one?</h2><p class="muted">Answer two questions and we'll pick for you.</p></div>
      <a class="btn" href="#/routine/${cat}">Find my ${cat} routine ${ic("arrow")}</a></div></section>`,
    after(){
      const update = () => { $("#shopList").innerHTML = listHtml(); $("#chipRow").innerHTML = chips(); };
      bindSortMenu(update);
      const onFilter = e => {
        const f = e.target.closest("[data-filter]"); if (!f) return;
        concernFilter = f.dataset.filter || null; update();
        $(`[data-filter="${concernFilter || ""}"]`)?.focus({preventScroll:true});
      };
      app.addEventListener("click", onFilter);
      cleanup.push(() => app.removeEventListener("click", onFilter));
    }};
};

pages.product = id => {
  const p = P[id]; if (!p) return pages.notFound();
  const inRituals = RITUALS.filter(r => r.steps.some(s => s[1] === id));
  const inDuos = BUNDLES.filter(b => b.items.includes(id));
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== id).slice(0, 4);
  return {title:`${p.name} – Beriglo`, html:`
    ${crumbs([["Home","#/"],[CAT_NAME[p.cat], `#/shop/${p.cat}`],[p.name]])}
    <section class="container" style="padding-block:24px var(--section)"><div class="split detail">
      <div class="detail-media"><div class="gallery">${pic(p.img, {alt:p.name, sizes:"(min-width:768px) 50vw, 100vw", eager:true})}</div></div>
      <div class="stack" style="--s:20px">
        <div class="stack" style="--s:8px"><span class="eyebrow">${p.kind} · ${CAT_NAME[p.cat]}</span><h1>${p.name}</h1>${ratingLine(p.rating, p.reviews)}</div>
        <p class="price" style="font-size:26px">${rs(p.price)}</p>
        <p class="lead">${p.desc}</p>
        ${buyCtl(p.id, "Add to cart")}
        <p class="ship-line">${ic("truck")} Estimated delivery ${STORE.delivery} · Cash on delivery available</p>
        ${details([
          ["What it does", `<p>${p.does}</p>`],
          ["Who it's for", `<p>${p.who}</p>`],
          ["How to use", `<p>${p.how}</p>`],
          ["Key ingredients", `<div class="ingr">${p.ingr.map(i => `<span>${i}</span>`).join("")}</div>`],
        ])}
        ${inRituals.length ? `<div class="notice">${ic("leaf")}<span>Part of the ${inRituals.map(r => `<a href="#/ritual/${r.id}">${r.name}</a>`).join(" and ")}. Buying a ritual saves up to ${rs(Math.max(...inRituals.map(r => ritualFull(r) - r.price)))}.</span></div>` : ""}
        ${facts()}
      </div>
    </div></section>
    ${inRituals.length ? `<section class="section band"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Complete the routine</span><h2>Rituals with ${p.name}</h2></div></div>
      ${grid(inRituals, ritualCard, RITUAL_GRID)}</div></section>` : ""}
    ${inDuos.length ? `<section class="section"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Pair it</span><h2>Duos with ${p.name}</h2></div></div>
      ${grid(inDuos, bundleCard, BUNDLE_GRID)}</div></section>` : ""}
    <section class="section ${inDuos.length ? "band" : ""}"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">More ${CAT_NAME[p.cat].toLowerCase()}</span><h2>You may also like</h2></div><a class="link" href="#/shop/${p.cat}">View all ${ic("arrow")}</a></div>
      ${grid(related, productCard, {sm:[2], md:[3,2], lg:[4,3], xl:[4,3]})}</div></section>`,
    bar: buyBar(p.id, "Add to cart"),
    after(){ watchBar(app.querySelector(".buyctl")); }};
};

pages.bundle = id => {
  const b = B[id]; if (!b) return pages.notFound();
  const rituals = RITUALS.filter(r => r.cat === b.cat && b.items.every(i => r.steps.some(s => s[1] === i)));
  const more = BUNDLES.filter(x => x.cat === b.cat && x.id !== id);
  return {title:`${b.name} – Beriglo`, html:`
    ${crumbs([["Home","#/"],[CAT_NAME[b.cat], `#/shop/${b.cat}`],["Bundles", `#/shop/${b.cat}/bundles`],[b.name]])}
    <section class="container" style="padding-block:24px var(--section)"><div class="split detail">
      <div class="detail-media"><div class="gallery">${pic(b.img, {alt:b.name, sizes:"(min-width:768px) 50vw, 100vw", eager:true})}</div></div>
      <div class="stack" style="--s:20px">
        <div class="stack" style="--s:8px"><span class="eyebrow">Duo · 2 products · ${CAT_NAME[b.cat]}</span><h1>${b.name}</h1><span class="small muted">No reviews yet</span></div>
        ${duoPricing(b)}
        <p class="lead">${b.desc}</p>
        ${buyCtl(b.id, "Add to cart")}
        <p class="ship-line">${ic("truck")} Estimated delivery ${STORE.delivery} · Cash on delivery available</p>
        <div class="stack" style="--s:10px"><span class="eyebrow">What's inside · use in this order</span>
          ${stepList({steps:b.items.map(i => [P[i].kind, i])}, true)}</div>
        ${details([["Why these together", `<p>${b.why}</p>`], ["How to use", `<p>${b.how}</p>`]])}
        ${rituals.length ? `<div class="notice info">${ic("info")}<span>Want the full routine? The ${rituals.map(r => `<a href="#/ritual/${r.id}">${r.name}</a>`).join(" or ")} includes both of these plus ${rituals[0].steps.length - 2 === 1 ? "one more step" : "two more steps"}, for ${rs(rituals[0].price)}.</span></div>` : ""}
        ${facts()}
      </div>
    </div></section>
    ${rituals.length ? `<section class="section band"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Go further</span><h2>Rituals that include this duo</h2></div></div>
      ${grid(rituals, ritualCard, RITUAL_GRID)}</div></section>` : ""}
    <section class="section"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">More bundles</span><h2>Other duos</h2></div></div>
      ${grid(more, bundleCard, BUNDLE_GRID)}</div></section>`,
    bar: buyBar(b.id, "Add to cart"),
    after(){ watchBar(app.querySelector(".buyctl")); }};
};

pages.ritual = id => {
  const r = R[id]; if (!r) return pages.notFound();
  const others = RITUALS.filter(x => x.cat === r.cat && x.id !== id);
  return {title:`${r.name} – Beriglo`, html:`
    ${crumbs([["Home","#/"],[CAT_NAME[r.cat], `#/shop/${r.cat}`],["Rituals", `#/shop/${r.cat}/rituals`],[r.name]])}
    <section class="container" style="padding-block:24px var(--section)"><div class="split detail">
      <div class="detail-media"><div class="gallery">${pic(r.img, {alt:`${r.name}: ${r.steps.map(s => P[s[1]].name).join(", ")}`, sizes:"(min-width:768px) 50vw, 100vw", eager:true})}</div></div>
      <div class="stack" style="--s:20px">
        <div class="stack" style="--s:8px"><span class="eyebrow">Ritual · ${r.steps.length} steps · ${CAT_NAME[r.cat]}</span><h1>${r.name}</h1></div>
        <p class="lead">${r.desc}</p>
        ${ritualPricing(r)}
        ${buyCtl(r.id, "Add ritual to cart")}
        <p class="ship-line">${ic("truck")} Estimated delivery ${STORE.delivery} · Cash on delivery available</p>
        <div class="stack" style="--s:10px"><span class="eyebrow">How to follow it · in this order</span>${stepList(r, true)}</div>
        ${details([["Who it's for", `<p>${r.who}</p>`], ["Why these together", `<p>${r.why}</p>`]])}
        ${facts()}
      </div>
    </div></section>
    <section class="section band"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Shop separately</span><h2>The products in this ritual</h2></div></div>
      ${grid(r.steps.map(s => P[s[1]]), productCard, PRODUCT_GRID)}</div></section>
    ${others.length ? `<section class="section"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Compare</span><h2>Other ${CAT_NAME[r.cat].toLowerCase()} rituals</h2></div></div>
      ${grid(others, ritualCard, RITUAL_GRID)}</div></section>` : ""}`,
    bar: buyBar(r.id, `Add ritual · ${rs(r.price)}`),
    after(){ watchBar(app.querySelector(".buyctl")); }};
};

/* Routine finder: category → up to two concerns → result (with the reasoning shown). */
const progress = step => `<div class="stack" style="--s:8px"><span class="eyebrow">Step ${step} of 3</span><div class="progress" aria-hidden="true">${[1,2,3].map(i => `<span class="${i <= step ? "on" : ""}"></span>`).join("")}</div></div>`;
const matchItem = key => R[key] || B[key];
pages.routine = (cat, picks) => {
  if (!cat) return {title:"Find your routine – Beriglo", html:`
    ${crumbs([["Home","#/"],["Find your routine"]])}
    <section class="container page-head stack narrow" style="--s:28px;--w:960px">
      ${progress(1)}
      <div class="stack" style="--s:10px"><h1>What are you shopping for?</h1><p class="lead">Two quick questions and we'll show you the routine that fits.</p></div>
      <div class="grid" style="--sm:1;--md:2;--lg:2">
        <a class="choice pick" href="#/routine/hair">${pic(R["anti-hairfall-ritual"].img, {sizes:"(min-width:640px) 50vw, 100vw"})}<div class="stack"><h2 style="font-size:var(--h3)">Hair</h2><span class="muted small">Hair fall, buildup, frizz</span><span class="link">Choose hair ${ic("arrow")}</span></div></a>
        <a class="choice pick" href="#/routine/skin">${pic(R["radiance-face-ritual"].img, {sizes:"(min-width:640px) 50vw, 100vw"})}<div class="stack"><h2 style="font-size:var(--h3)">Skin</h2><span class="muted small">Dullness, acne, pigmentation, blackheads</span><span class="link">Choose skin ${ic("arrow")}</span></div></a>
      </div>
    </section><div style="height:var(--section)"></div>`};
  if (!CONCERNS[cat]) return pages.notFound();
  if (picks === undefined) return {title:"Your concerns – Beriglo", html:`
    ${crumbs([["Home","#/"],["Find your routine","#/routine"],[CAT_NAME[cat]]])}
    <section class="container page-head stack narrow" style="--s:28px;--w:720px">
      ${progress(2)}
      <div class="stack" style="--s:10px"><h1>What's bothering your ${cat}?</h1><p class="lead">Pick one, or two if you have a second concern.</p></div>
      <div class="stack" style="--s:10px" role="group" aria-label="Concerns">${CONCERNS[cat].map((c, i) => `
        <button type="button" class="option" data-pick="${i}" aria-pressed="false">${c.label}<span class="tickbox" aria-hidden="true">${ic("check")}</span></button>`).join("")}</div>
      <p class="small muted" id="pickHint" aria-live="polite">Choose at least one.</p>
      <div class="cluster between">
        <a class="link" href="#/routine">${ic("back")} Back</a>
        <button class="btn" id="seeRoutine" disabled>See my routine ${ic("arrow")}</button>
      </div>
    </section><div style="height:var(--section)"></div>`,
    after(){
      let chosen = [];
      const btns = [...app.querySelectorAll("[data-pick]")];
      const sync = () => {
        btns.forEach(b => {
          const on = chosen.includes(+b.dataset.pick);
          b.setAttribute("aria-pressed", on);
          b.disabled = !on && chosen.length >= 2;
        });
        $("#seeRoutine").disabled = !chosen.length;
        $("#pickHint").textContent = !chosen.length ? "Choose at least one." : chosen.length === 1 ? "You can add one more concern." : "Two concerns chosen.";
      };
      btns.forEach(b => b.onclick = () => {
        const i = +b.dataset.pick;
        chosen = chosen.includes(i) ? chosen.filter(x => x !== i) : [...chosen, i].slice(0, 2);
        sync();
      });
      $("#seeRoutine").onclick = () => go(`routine/${cat}/${chosen.join(",")}`);
    }};
  const idx = String(picks).split(",").map(Number).filter(i => CONCERNS[cat][i]);
  if (!idx.length) return pages.notFound();
  const [c1, c2] = idx.map(i => CONCERNS[cat][i]);
  const m = matchItem(c1.match), isRitual = !!R[m.id];
  const second = c2 && c2.match !== c1.match ? matchItem(c2.match) : null;
  const alts = [...RITUALS, ...BUNDLES].filter(x => x.cat === cat && x.id !== m.id && x.id !== second?.id).slice(0, 3);
  return {title:`Your routine for ${c1.label.toLowerCase()} – Beriglo`, html:`
    ${crumbs([["Home","#/"],["Find your routine","#/routine"],[CAT_NAME[cat], `#/routine/${cat}`],["Your match"]])}
    <section class="container page-head stack" style="--s:28px">
      ${progress(3)}
      <div class="stack" style="--s:10px"><span class="tag">Best match for ${c1.label.toLowerCase()}</span><h1>${m.name}</h1></div>
      <div class="split">
        <div class="gallery">${pic(m.img, {alt:m.name, sizes:"(min-width:1024px) 50vw, 100vw", eager:true})}</div>
        <div class="stack" style="--s:20px">
          <p class="lead">${m.desc}</p>
          <div class="why"><span class="eyebrow">Why we picked this</span><p>${isRitual ? m.who : m.why}</p></div>
          <div class="stack" style="--s:10px"><span class="eyebrow">${isRitual ? "Your steps · use in this order" : "What's inside · use in this order"}</span>
            ${stepList(isRitual ? m : {steps:m.items.map(i => [P[i].kind, i])}, true)}</div>
          ${isRitual ? ritualPricing(m) : duoPricing(m)}
          <div class="stack" style="--s:10px">
            ${addCtl(m.id, `Add ${isRitual ? "full ritual" : "duo"} to cart · ${rs(m.price)}`, "btn block")}
            <a class="btn ghost block" href="${isRitual ? `#/ritual/${m.id}` : `#/bundle/${m.id}`}">See full details</a>
          </div>
          <a class="link" href="#/routine/${cat}">${ic("back")} Change my answers</a>
        </div>
      </div>
    </section>
    ${second ? `<section class="section band"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">For your second concern</span><h2>${c2.label}</h2></div></div>
      ${R[second.id] ? grid([second], ritualCard, RITUAL_GRID) : grid([second], bundleCard, {sm:[1], md:[1], lg:[1]})}
    </div></section>` : ""}
    <section class="section ${second ? "" : "band"}"><div class="container">
      <div class="sec-head"><div class="stack"><span class="eyebrow">Also consider</span><h2>Other ${cat} routines</h2></div></div>
      <div class="grid" style="${gridFor(alts.length, {sm:[1], md:[1], lg:[3,2], xl:[3]})}">${alts.map(a => R[a.id] ? ritualCard(a) : bundleCard(a)).join("")}</div>
    </div></section>`,
    bar: buyBar(m.id, `Add ${isRitual ? "ritual" : "duo"} · ${rs(m.price)}`),
    after(){ watchBar(app.querySelector(".page-head .addctl")?.parentElement, true); }};
};

pages.discover = () => ({title:"Discover – Beriglo", html:`
  ${crumbs([["Home","#/"],["Discover"]])}
  <div class="container page-head stack" style="--s:8px"><span class="eyebrow">Discover</span><h1>Care that fits into real life</h1>
    <p class="lead">Every Beriglo skin ritual follows the same simple order. Learn the steps once and every product makes sense.</p></div>
  <section class="container" style="padding-bottom:var(--section)">
    <ol class="grid plain" style="--sm:1;--md:2;--lg:4">
      ${[["Cleanse","dew-face-wash"],["Treat","radiance-serum"],["Hydrate","spesh-hydra-gel-moisturiser"],["Protect","advanced-uv-protection-spf-moisturizer"]].map(([t, id], i) => `
        <li class="choice static">${pic(P[id].img, {sizes:"(min-width:1024px) 25vw, 50vw"})}<div class="stack">
          <span class="eyebrow">Step ${i + 1}</span><h2 style="font-size:var(--h3)">${t}</h2><p class="muted small">${P[id].short}</p>
          <a class="link small" href="#/product/${id}">${P[id].name} ${ic("arrow")}</a></div></li>`).join("")}
    </ol>
  </section>
  <section class="section band"><div class="container">
    <div class="sec-head"><div class="stack"><span class="eyebrow">Shop by concern</span><h2>Start with what's bothering you</h2></div></div>
    <div class="grid" style="--sm:1;--md:2;--lg:4;--xl:4">${["hair","skin"].flatMap(cat => CONCERNS[cat].map((c, i) => {
      const m = matchItem(c.match);
      return `<a class="choice" href="#/routine/${cat}/${i}">${pic(m.img, {sizes:"(min-width:1024px) 25vw, 50vw"})}<div class="stack"><span class="eyebrow">${CAT_NAME[cat]}</span><b>${c.label}</b><span class="small muted">${m.name}</span></div></a>`;
    })).join("")}</div>
  </div></section>
  ${promise()}`});

pages.search = (q = "") => {
  const INDEX = [
    ...PRODUCTS.map(p => ({...p, type:"Product", href:`#/product/${p.id}`, text:`${p.name} ${p.kind} ${p.desc} ${p.who} ${p.ingr.join(" ")} ${p.cat}`})),
    ...BUNDLES.map(b => ({...b, type:"Duo", href:`#/bundle/${b.id}`, text:`${b.name} ${b.desc} ${b.items.map(i => P[i].name).join(" ")} bundle duo ${b.cat}`})),
    ...RITUALS.map(r => ({...r, type:"Ritual", href:`#/ritual/${r.id}`, text:`${r.name} ${r.desc} ${r.who} ritual routine ${r.cat}`})),
  ];
  const results = q => {
    q = q.trim().toLowerCase();
    if (!q) return `<div class="stack" style="--s:12px"><span class="eyebrow">Popular searches</span><div class="cluster">${["Hair fall","Acne","Serum","Shampoo","SPF","Niacinamide","Vitamin C"].map(s => `<a class="chip" href="#/search/${encodeURIComponent(s)}">${s}</a>`).join("")}</div></div>`;
    const words = q.split(/\s+/);
    const hits = INDEX.filter(i => words.every(w => i.text.toLowerCase().includes(w)));
    if (!hits.length) return `<div class="empty">${ic("search")}<h2 style="font-size:var(--h3)">No matches for “${esc(q)}”</h2><p class="muted">Try a concern like “hair fall” or an ingredient like “vitamin C”.</p><a class="btn" href="#/routine">Find your routine instead</a></div>`;
    return `<p class="small muted" style="margin-bottom:16px">${plural(hits.length, "result")}</p>
      <div class="grid" style="--sm:1;--md:2;--lg:3">${hits.map(h => `<a class="option hit" href="${h.href}">
        ${pic(h.img, {sizes:"56px", w:56, h:70})}
        <span class="stack" style="--s:2px"><b>${h.name}</b><span class="small muted">${h.type} · ${rs(h.price)}</span></span></a>`).join("")}</div>`;
  };
  return {title:"Search – Beriglo", html:`
    <section class="container page-head stack" style="--s:28px;padding-top:40px">
      <form class="searchbar" role="search" id="searchForm">${ic("search")}
        <label for="q" class="sr-only">Search products, bundles and rituals</label>
        <input id="q" type="search" placeholder="Search shampoo, serum, acne…" value="${esc(q)}" autocomplete="off"></form>
      <div id="hits" aria-live="polite">${results(q)}</div>
    </section><div style="height:var(--section)"></div>`,
    after(){
      const input = $("#q"); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
      input.oninput = () => { $("#hits").innerHTML = results(input.value); history.replaceState(null, "", "#/search/" + encodeURIComponent(input.value)); };
      $("#searchForm").onsubmit = e => e.preventDefault();
    }, keepFocus:true};
};

/* Cart: spots duplicates (a ritual/duo plus its own products) and offers cheaper swaps. */
function cartAdvice(){
  const tips = [];
  const has = id => inCart(id) > 0;
  const covered = new Set();
  for (const k of [...RITUALS, ...BUNDLES].filter(x => has(x.id))){
    const dupes = productsOf(k).filter(has);
    dupes.forEach(d => covered.add(d));
    if (dupes.length) tips.push({kind:"dupe", html:`Your <b>${k.name}</b> already includes ${dupes.map(d => `<b>${P[d].name}</b>`).join(" and ")}.`,
      action:`<button class="btn sm ghost" data-dedupe="${dupes.join(",")}">Remove the extra${dupes.length > 1 ? "s" : ""}</button>`});
  }
  for (const k of [...RITUALS, ...BUNDLES].filter(x => !has(x.id))){
    const parts = productsOf(k);
    if (parts.every(p => has(p) && !covered.has(p))){
      const full = parts.reduce((s, p) => s + P[p].price, 0);
      tips.push({kind:"swap", html:`You have every product in the <b>${k.name}</b>. Switch to it and save <b>${rs(full - k.price)}</b>.`,
        action:`<button class="btn sm" data-swap="${k.id}">Switch and save</button>`});
      parts.forEach(p => covered.add(p));
    }
  }
  return tips;
}
pages.cart = () => {
  if (!cart.length) return {title:"Cart – Beriglo", html:`
    ${crumbs([["Home","#/"],["Cart"]])}
    <section class="container empty"><svg aria-hidden="true"><use href="#i-bag"/></svg><h1 style="font-size:var(--h2)">Your cart is empty</h1>
      <p class="muted">Not sure where to begin? Our routine finder takes less than a minute.</p>
      <div class="cluster" style="justify-content:center"><a class="btn" href="#/routine">Find your routine</a><a class="btn ghost" href="#/shop/hair">Shop Hair Care</a><a class="btn ghost" href="#/shop/skin">Shop Skin Care</a></div>
    </section>`};
  const tips = cartAdvice();
  return {title:"Cart – Beriglo", html:`
    ${crumbs([["Home","#/"],["Cart"]])}
    <div class="container page-head stack" style="--s:16px"><h1>Your cart</h1>
      ${tips.map(t => `<div class="notice ${t.kind === "dupe" ? "info" : ""} tip">${ic(t.kind === "dupe" ? "info" : "leaf")}<span>${t.html}</span>${t.action}</div>`).join("")}
    </div>
    <section class="container" style="padding-bottom:var(--section)"><div class="split aside">
      <div>
        <div style="border-top:1px solid var(--ink-line)">${cart.map(l => { const it = lookup(l.id); return `
          <div class="line"><a href="${it.href}" tabindex="-1" aria-hidden="true">${pic(it.img, {sizes:"110px", w:110, h:138})}</a>
            <div><div class="top"><div><a href="${it.href}">${it.name}</a><div class="small muted">${it.sub} · ${rs(it.price)} each</div></div><span class="price">${rs(it.price * l.qty)}</span></div>
              <div class="ctrl"><div class="qty" role="group" aria-label="Quantity for ${it.name}"><button data-dec="${l.id}" aria-label="Decrease ${it.name}">−</button><output>${l.qty}</output><button data-inc="${l.id}" aria-label="Increase ${it.name}">+</button></div>
                <button class="remove" data-rm="${l.id}">Remove</button></div></div></div>`; }).join("")}</div>
        <a class="link" href="#/" style="margin-top:20px">${ic("back")} Continue shopping</a>
      </div>
      <aside class="panel stack sticky" style="--s:14px" aria-label="Order summary">
        <h2 style="font-size:var(--h3)">Order summary</h2>
        <div class="sumrow"><span>Subtotal (${plural(cartCount(), "item")})</span><span>${rs(cartTotal())}</span></div>
        <div class="sumrow"><span>Shipping</span><span class="teal-text">Free</span></div>
        <div class="sumrow total"><span>Total</span><span>${rs(cartTotal())}</span></div>
        <a class="btn block" id="checkoutBtn" href="#/checkout">Checkout ${ic("arrow")}</a>
        <p class="small muted">No account needed. Cash on delivery · Estimated delivery ${STORE.delivery}.</p>
      </aside>
    </div></section>`,
    bar:`<div class="buybar" id="buybar" aria-hidden="true"><div class="container buybar-in">
      <div class="bb-info"><span class="small muted">Total · ${plural(cartCount(), "item")}</span><b class="price">${rs(cartTotal())}</b></div>
      <a class="btn" href="#/checkout">Checkout ${ic("arrow")}</a></div></div>`,
    after(){
      watchBar($("#checkoutBtn"));
      app.querySelectorAll("[data-inc],[data-dec],[data-rm]").forEach(b => b.onclick = () => {
        const id = b.dataset.inc || b.dataset.dec || b.dataset.rm, before = snapshot(), n = inCart(id), name = lookup(id).name;
        if (b.dataset.inc) setQty(id, n + 1);
        else if (b.dataset.dec && n > 1) setQty(id, n - 1);
        else { setQty(id, 0); undoable(`${name} removed from cart`, before); }
        render({keepScroll:true});
        app.querySelector(`[data-${b.dataset.inc ? "inc" : "dec"}="${id}"]`)?.focus({preventScroll:true});
      });
      app.querySelectorAll("[data-dedupe]").forEach(b => b.onclick = () => {
        const before = snapshot(); b.dataset.dedupe.split(",").forEach(id => setQty(id, 0));
        undoable("Removed the duplicate products", before); render({keepScroll:true});
      });
      app.querySelectorAll("[data-swap]").forEach(b => b.onclick = () => {
        const k = R[b.dataset.swap] || B[b.dataset.swap], before = snapshot();
        productsOf(k).forEach(p => setQty(p, inCart(p) - 1)); setQty(k.id, inCart(k.id) + 1);
        undoable(`Switched to the ${k.name}`, before); render({keepScroll:true});
      });
    }};
};

/* Checkout: guest by default; signed-in shoppers get their details filled in. */
pages.checkout = () => {
  if (!cart.length) { redirect("cart"); return null; }
  const a = savedAddress || {};
  const f = (id, label, attrs = "", cls = "", value = "") => `<div class="field ${cls}"><label for="${id}">${label}</label><input id="${id}" name="${id}" ${attrs} value="${esc(value)}"><span class="err" id="${id}-err" aria-live="polite"></span></div>`;
  return {title:"Checkout – Beriglo", html:`
    ${crumbs([["Home","#/"],["Cart","#/cart"],["Checkout"]])}
    <div class="container page-head stack" style="--s:8px"><h1>Checkout</h1></div>
    <section class="container" style="padding-bottom:var(--section)"><div class="split aside">
      <form id="checkoutForm" class="stack" style="--s:32px" novalidate>
        <fieldset class="stack" style="--s:12px"><legend class="eyebrow">1 · Contact</legend>
          ${user
            ? `<p>Signed in as <b>${esc(user.email)}</b>. <button type="button" class="textbtn" id="notMe">Not you?</button></p>`
            : `<div class="form-grid">${f("email","Email for order updates",'type="email" autocomplete="email" required placeholder="you@example.com"', "", a.email || "")}</div>
               <p class="small muted">Checking out as a guest. Have an account? <a href="#/login/checkout">Log in</a></p>`}
        </fieldset>
        <fieldset class="stack" style="--s:16px"><legend class="eyebrow">2 · Delivery address</legend>
          ${savedAddress ? `<p class="small muted">${ic("check").replace("<svg", '<svg class="inline-ic"')} Filled in from your last order.</p>` : ""}
          <div class="form-grid two">
            ${f("name","Full name",'autocomplete="name" required',"full", a.name || user?.name || "")}
            ${f("phone","Mobile number",'type="tel" inputmode="numeric" autocomplete="tel-national" required placeholder="10-digit number" maxlength="14"', "", a.phone || "")}
            ${f("pin","PIN code",'inputmode="numeric" autocomplete="postal-code" required placeholder="6 digits" maxlength="6"', "", a.pin || "")}
            ${f("address","House no., street, area",'autocomplete="street-address" required',"full", a.address || "")}
            ${f("city","City",'autocomplete="address-level2" required', "", a.city || "")}
            <div class="field"><label for="state">State</label><select id="state" autocomplete="address-level1" required>
              <option value="">Select your state</option>${STATES.map(s => `<option ${s === a.state ? "selected" : ""}>${s}</option>`).join("")}</select><span class="err" id="state-err" aria-live="polite"></span></div>
          </div>
          <label class="check"><input type="checkbox" id="saveAddr" checked> Save this address for next time</label>
          <p class="ship-line">${ic("truck")} Estimated delivery ${STORE.delivery}</p>
        </fieldset>
        <fieldset class="stack" style="--s:12px"><legend class="eyebrow">3 · Payment</legend>
          <label class="radio"><input type="radio" name="pay" checked><span><b>Cash on delivery</b><br><span class="small muted">Pay when your order arrives.</span></span></label>
          ${PROTOTYPE ? `<div class="notice info">${ic("info")}<span><b>Demo store.</b> Please use made-up details. No order is placed and nothing is charged.</span></div>` : ""}
        </fieldset>
        <button class="btn block" type="submit">Place order · ${rs(cartTotal())}</button>
      </form>
      <aside class="panel stack sticky" style="--s:14px" aria-label="Order summary">
        <div class="cluster between"><h2 style="font-size:var(--h3)">Your order</h2><a class="textlink" href="#/cart">Edit cart</a></div>
        ${cart.map(l => { const it = lookup(l.id); return `<div class="mini-line">${pic(it.img, {sizes:"56px", w:56, h:70})}<div><b class="small">${it.name}</b><span class="small muted">Qty ${l.qty}</span></div><span class="price small">${rs(it.price * l.qty)}</span></div>`; }).join("")}
        <div class="sumrow"><span>Subtotal</span><span>${rs(cartTotal())}</span></div>
        <div class="sumrow"><span>Shipping</span><span class="teal-text">Free</span></div>
        <div class="sumrow total"><span>Total</span><span>${rs(cartTotal())}</span></div>
      </aside>
    </div></section>`,
    after(){
      const rules = {
        ...(user ? {} : {email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter an email like name@example.com."}),
        name: v => v.trim().length >= 2 || "Enter your full name.",
        phone: v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "")) || "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
        pin: v => /^[1-9]\d{5}$/.test(v.trim()) || "PIN code is 6 digits and can't start with 0.",
        address: v => v.trim().length >= 5 || "Enter your house number, street and area.",
        city: v => v.trim().length >= 2 || "Enter your city.",
        state: v => !!v || "Select your state.",
      };
      // Validate a field when the shopper leaves it, then live while they fix it.
      const check = k => {
        const input = $("#" + k), ok = rules[k](input.value);
        input.closest(".field").classList.toggle("invalid", ok !== true);
        input.setAttribute("aria-invalid", ok !== true);
        $(`#${k}-err`).textContent = ok === true ? "" : ok;
        return ok === true;
      };
      Object.keys(rules).forEach(k => {
        const input = $("#" + k);
        input.addEventListener("blur", () => { if (input.value) check(k); });
        input.addEventListener("input", () => { if (input.closest(".field").classList.contains("invalid")) check(k); });
        input.addEventListener("change", () => { if (input.tagName === "SELECT") check(k); });
      });
      $("#pin").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, ""); });
      $("#notMe")?.addEventListener("click", () => { user = null; store.set("user", null); updateHeader(); render(); });
      $("#checkoutForm").onsubmit = e => {
        e.preventDefault();
        const bad = Object.keys(rules).filter(k => !check(k));
        if (bad.length) return $("#" + bad[0]).focus();
        const no = "BG" + Date.now().toString().slice(-6);
        const address = Object.fromEntries(["name","phone","pin","address","city","state"].map(k => [k, $("#" + k).value.trim()]));
        const email = user ? user.email : $("#email").value.trim().toLowerCase();
        if ($("#saveAddr").checked){ savedAddress = {...address, email}; store.set("address", savedAddress); }
        orders.unshift({no, date:new Date().toISOString(), email, guest:!user, total:cartTotal(),
          items:cart.map(l => ({id:l.id, qty:l.qty, price:lookup(l.id).price})), address});
        store.set("orders", orders);
        cart = []; saveCart();
        go("order/" + no);
      };
    }};
};

const buyAgain = o => {
  o.items.forEach(i => setQty(i.id, inCart(i.id) + i.qty)); bumpBadge(); refreshCartControls();
  toast(`${plural(o.items.reduce((s, i) => s + i.qty, 0), "item")} added to your cart`, {action:{label:"View cart", fn(){ go("cart"); }}});
};

pages.order = no => {
  const o = orders.find(x => x.no === no); if (!o) return pages.notFound();
  const a = o.address;
  return {title:"Order placed – Beriglo", html:`
    <section class="container page-head stack narrow" style="--s:24px;--w:760px;padding-top:48px">
      <span class="done-ic">${ic("check")}</span>
      <div class="stack" style="--s:8px"><span class="eyebrow">Order ${o.no}</span><h1>Thank you, ${esc(a.name.split(" ")[0])}.</h1>
        <p class="lead">Your order is placed. You'll pay ${rs(o.total)} in cash on delivery. Estimated delivery ${STORE.delivery}. Updates go to ${esc(o.email)}.</p></div>
      ${PROTOTYPE ? `<div class="notice info">${ic("info")}<span><b>This was a demo order.</b> Nothing will be delivered or charged.</span></div>` : ""}
      ${o.guest && !user ? `<div class="notice tip">${ic("user")}<span><b>Save your details for next time.</b> Create an account to track this order and check out faster.</span><a class="btn sm" href="#/signup/account" data-prefill="${esc(o.email)}">Create account</a></div>` : ""}
      <div class="panel stack" style="--s:14px">
        ${o.items.map(i => { const it = lookup(i.id); return `<div class="mini-line">${pic(it.img, {sizes:"56px", w:56, h:70})}<div><a href="${it.href}"><b class="small">${it.name}</b></a><span class="small muted">Qty ${i.qty}</span></div><span class="price small">${rs(i.price * i.qty)}</span></div>`; }).join("")}
        <div class="sumrow total"><span>Total</span><span>${rs(o.total)}</span></div>
      </div>
      <div class="grid" style="--sm:1;--md:2;--lg:2">
        <div class="panel stack" style="--s:6px"><span class="eyebrow">Delivering to</span><p>${esc(a.name)}<br>${esc(a.address)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pin)}<br>${esc(a.phone)}</p></div>
        <div class="panel stack" style="--s:6px"><span class="eyebrow">Payment</span><p>Cash on delivery<br><span class="muted small">Problem with an item? ${STORE.returns}</span></p></div>
      </div>
      <div class="cluster">${user ? `<a class="btn" href="#/account">View my orders</a>` : ""}<a class="btn ${user ? "ghost" : ""}" href="#/">Continue shopping</a></div>
    </section><div style="height:var(--section)"></div>`,
    after(){ app.querySelector("[data-prefill]")?.addEventListener("click", e => { sessionStorage.setItem("bg-prefill", e.currentTarget.dataset.prefill); }); }};
};

/* ---------- Auth (prototype: nothing leaves the browser) ---------- */
function signIn(u, next){
  user = {name:u.name, email:u.email.toLowerCase(), demo:u.email.toLowerCase() === DEMO_ACCOUNT.email};
  store.set("user", user); updateHeader();
  toast(`Signed in as ${user.email}`);
  go(next || "account");
}
const authField = (id, label, type, attrs = "") => `<div class="field"><label for="${id}">${label}</label>${type === "password"
  ? `<div class="pw"><input id="${id}" type="password" ${attrs}><button type="button" data-toggle="${id}" aria-label="Show password">Show</button></div>`
  : `<input id="${id}" type="${type}" ${attrs}>`}<span class="err" id="${id}-err" aria-live="polite"></span></div>`;
function bindAuth(form, fields, onOk){
  app.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
    const i = $("#" + b.dataset.toggle), show = i.type === "password";
    i.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show"; b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
  const check = id => {
    const i = $("#" + id), ok = fields[id](i.value);
    i.closest(".field").classList.toggle("invalid", ok !== true); i.setAttribute("aria-invalid", ok !== true);
    $(`#${id}-err`).textContent = ok === true ? "" : ok;
    return ok === true;
  };
  Object.keys(fields).forEach(id => {
    const i = $("#" + id);
    i.addEventListener("blur", () => { if (i.value) check(id); });
    i.addEventListener("input", () => { if (i.closest(".field").classList.contains("invalid")) check(id); });
  });
  $(form).onsubmit = e => {
    e.preventDefault();
    const bad = Object.keys(fields).filter(id => !check(id));
    bad.length ? $("#" + bad[0]).focus() : onOk();
  };
}
const emailRule = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter an email like name@example.com.";
const pwRule = v => v.length >= 6 || "Password must be at least 6 characters.";
const nameFromEmail = e => e.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const demoNotice = text => PROTOTYPE ? `<div class="notice info">${ic("info")}<span><b>Prototype.</b> ${text}</span></div>` : "";

pages.login = next => {
  if (user) { redirect(next || "account"); return null; }
  return {title:"Log in – Beriglo", html:`
    <section class="container page-head" style="padding-top:48px"><div class="auth stack" style="--s:24px">
      <div class="stack" style="--s:8px"><span class="eyebrow">${next === "checkout" ? "Almost there" : "Welcome back"}</span><h1 style="font-size:var(--h2)">Log in</h1>
        <p class="muted">${next === "checkout" ? "Log in to use your saved details. You can also check out as a guest." : "See your orders and check out faster."}</p></div>
      ${demoNotice("Use the demo account, or any made-up email with a password of 6+ characters. Nothing is sent anywhere.")}
      ${PROTOTYPE ? `<button class="btn teal block" id="demoLogin">Continue with demo account</button><div class="divider">or log in with email</div>` : ""}
      <form id="loginForm" class="stack" novalidate>
        ${authField("email","Email","email",'autocomplete="username" placeholder="you@example.com" required')}
        ${authField("password","Password","password",'autocomplete="current-password" required')}
        <a class="textlink end" href="#/reset">Forgot password?</a>
        <button class="btn block" type="submit">Log in</button>
      </form>
      <p class="small muted center">New to Beriglo? <a href="#/signup${next ? "/" + next : ""}">Create an account</a>${next === "checkout" ? ` · <a href="#/checkout">Check out as a guest</a>` : ""}</p>
    </div></section><div style="height:var(--section)"></div>`,
    after(){
      $("#demoLogin")?.addEventListener("click", () => signIn(DEMO_ACCOUNT, next));
      bindAuth("#loginForm", {email:emailRule, password:pwRule}, () => {
        const email = $("#email").value.trim();
        signIn({name: email.toLowerCase() === DEMO_ACCOUNT.email ? DEMO_ACCOUNT.name : nameFromEmail(email), email}, next);
      });
    }};
};

pages.signup = next => {
  if (user) { redirect(next || "account"); return null; }
  const prefill = sessionStorage.getItem("bg-prefill") || "";
  return {title:"Create account – Beriglo", html:`
    <section class="container page-head" style="padding-top:48px"><div class="auth stack" style="--s:24px">
      <div class="stack" style="--s:8px"><span class="eyebrow">New here</span><h1 style="font-size:var(--h2)">Create an account</h1><p class="muted">Track orders and check out faster.</p></div>
      ${demoNotice("Use a made-up email. The account only exists in this browser.")}
      <form id="signupForm" class="stack" novalidate>
        ${authField("sname","Full name","text",`autocomplete="name" required value="${esc(savedAddress?.email === prefill ? savedAddress.name : "")}"`)}
        ${authField("email","Email","email",`autocomplete="email" placeholder="you@example.com" required value="${esc(prefill)}"`)}
        ${authField("password","Password","password",'autocomplete="new-password" required')}
        <button class="btn block" type="submit">Create account</button>
      </form>
      <p class="small muted center">Already have an account? <a href="#/login${next ? "/" + next : ""}">Log in</a></p>
    </div></section><div style="height:var(--section)"></div>`,
    after(){
      bindAuth("#signupForm", {sname:v => v.trim().length >= 2 || "Enter your name.", email:emailRule, password:pwRule},
        () => { sessionStorage.removeItem("bg-prefill"); signIn({name:$("#sname").value.trim(), email:$("#email").value.trim()}, next); });
    }};
};

pages.reset = () => ({title:"Reset password – Beriglo", html:`
  <section class="container page-head" style="padding-top:48px"><div class="auth stack" style="--s:24px" id="resetBox">
    <div class="stack" style="--s:8px"><h1 style="font-size:var(--h2)">Reset your password</h1><p class="muted">Enter the email you signed up with and we'll send you a link to set a new password.</p></div>
    <form id="resetForm" class="stack" novalidate>
      ${authField("email","Email","email",'autocomplete="email" placeholder="you@example.com" required')}
      <button class="btn block" type="submit">Send reset link</button>
    </form>
    <a class="textlink center" href="#/login">${ic("back")} Back to log in</a>
  </div></section><div style="height:var(--section)"></div>`,
  after(){
    bindAuth("#resetForm", {email:emailRule}, () => {
      const email = esc($("#email").value.trim());
      $("#resetBox").innerHTML = `<span class="done-ic">${ic("check")}</span>
        <div class="stack" style="--s:8px"><h1 style="font-size:var(--h2)" tabindex="-1" id="resetDone">Check your email</h1>
        <p class="muted">If an account exists for <b>${email}</b>, a reset link is on its way.</p></div>
        ${demoNotice("No email is actually sent in this prototype.")}
        <a class="btn block" href="#/login">Back to log in</a>`;
      $("#resetDone").focus();
    });
  }});

pages.account = tab => {
  if (!user) { redirect("login/account"); return null; }
  const mine = orders.filter(o => o.email === user.email);
  const nav = `<nav class="acct-nav" aria-label="Account">
    <a href="#/account" ${tab !== "details" ? 'aria-current="page"' : ""}>Orders</a>
    <a href="#/account/details" ${tab === "details" ? 'aria-current="page"' : ""}>Account details</a>
    <button id="signOut">Sign out</button></nav>`;
  const body = tab === "details"
    ? `<div class="panel stack" style="--s:16px;max-width:560px">
        <h2 style="font-size:var(--h3)">Account details</h2>
        <div class="stack" style="--s:2px"><span class="eyebrow">Name</span><p>${esc(user.name)}</p></div>
        <div class="stack" style="--s:2px"><span class="eyebrow">Email</span><p>${esc(user.email)}</p></div>
        ${savedAddress ? `<div class="stack" style="--s:2px"><span class="eyebrow">Saved address</span><p>${esc(savedAddress.address)}, ${esc(savedAddress.city)}, ${esc(savedAddress.state)} ${esc(savedAddress.pin)}</p></div>` : ""}
        ${user.demo ? `<span class="tag">Demo account</span>` : ""}
      </div>`
    : mine.length
      ? `<div class="stack">${mine.map(o => `<article class="order stack" style="--s:14px">
          <div class="cluster between"><div><b>Order ${o.no}</b><div class="small muted">${new Date(o.date).toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"})} · ${plural(o.items.reduce((s, i) => s + i.qty, 0), "item")} · ${rs(o.total)}</div></div><span class="status">Placed · Cash on delivery</span></div>
          <div class="thumbs">${o.items.map(i => `<a href="${lookup(i.id).href}" aria-label="${lookup(i.id).name}">${pic(lookup(i.id).img, {sizes:"56px", w:56, h:70})}</a>`).join("")}</div>
          <div class="cluster"><button class="btn sm" data-again="${o.no}">Buy again</button><a class="btn sm ghost" href="#/order/${o.no}">View order</a></div></article>`).join("")}</div>`
      : `<div class="empty" style="padding-block:40px">${ic("bag")}<h2 style="font-size:var(--h3)">No orders yet</h2><p class="muted">When you place an order it will show up here.</p><a class="btn" href="#/routine">Find your routine</a></div>`;
  return {title:"My account – Beriglo", html:`
    ${crumbs([["Home","#/"],["My account"]])}
    <div class="container page-head stack" style="--s:8px"><span class="eyebrow">My account</span><h1>Hi, ${esc(user.name.split(" ")[0])}</h1></div>
    <section class="container" style="padding-bottom:var(--section)"><div class="acct-layout stack" style="--s:24px">${nav}<div>${body}</div></div></section>`,
    after(){
      $("#signOut").onclick = () => { user = null; store.set("user", null); updateHeader(); toast("Signed out"); go(""); };
      app.querySelectorAll("[data-again]").forEach(b => b.onclick = () => buyAgain(orders.find(o => o.no === b.dataset.again)));
    }};
};

pages.notFound = () => ({title:"Page not found – Beriglo", html:`
  <section class="container empty"><h1 style="font-size:var(--h2)">We couldn't find that page</h1>
    <p class="muted">The link may be out of date.</p>
    <div class="cluster" style="justify-content:center"><a class="btn" href="#/">Go to the homepage</a><a class="btn ghost" href="#/search">Search</a></div></section>`});

/* ---------- Router ---------- */
function route(){
  const [head = "", ...rest] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  switch (head){
    case "": return pages.home();
    case "shop": return pages.shop(...rest);
    case "product": return pages.product(rest[0]);
    case "bundle": return pages.bundle(rest[0]);
    case "ritual": return pages.ritual(rest[0]);
    case "routine": return pages.routine(rest[0], rest[1]);
    case "discover": return pages.discover();
    case "search": return pages.search(rest.join("/"));
    case "cart": return pages.cart();
    case "checkout": return pages.checkout();
    case "order": return pages.order(rest[0]);
    case "login": return pages.login(rest[0]);
    case "signup": return pages.signup(rest[0]);
    case "reset": return pages.reset();
    case "account": return pages.account(rest[0]);
    default: return pages.notFound();
  }
}
function render({keepScroll = false} = {}){
  closeMenu();
  cleanup.forEach(fn => fn()); cleanup = [];
  const page = route();
  if (!page) return; // redirected
  document.title = page.title.replace(/Beriglo$/, "Beriglo concept · Nehal Sharma");
  const y = scrollY;
  app.innerHTML = `<div class="page${keepScroll ? " still" : ""}">${page.html}</div>`;
  $("#barSlot").innerHTML = page.bar || "";
  window.scrollTo(0, keepScroll ? y : 0);
  page.after?.();
  if (!keepScroll && !page.keepFocus){
    const h = app.querySelector("h1");
    if (h){ h.setAttribute("tabindex", "-1"); h.focus({preventScroll:true}); }
  }
  const path = location.hash.replace(/^#\/?/, "");
  document.querySelectorAll("[data-nav]").forEach(a => a.toggleAttribute("aria-current", path.startsWith(a.dataset.nav)));
  document.querySelectorAll("[data-nav][aria-current]").forEach(a => a.setAttribute("aria-current", "page"));
}
// The router manages scroll itself; stop the browser restoring an old position on reload.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", () => render());

/* ---------- Global cart actions ---------- */
function bumpBadge(){ const b = $("#cartCount"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
document.addEventListener("click", e => {
  const t = e.target.closest("[data-add],[data-add-qty],[data-cinc],[data-cdec],[data-buy],[data-step]");
  if (!t) return;
  const host = t.closest(".addctl, .buyctl");
  if (t.dataset.step){
    const o = $("#qty"); o.value = o.textContent = Math.max(1, Math.min(10, +o.textContent + +t.dataset.step));
    return;
  }
  if (t.dataset.buy){ if (!inCart(t.dataset.buy)) setQty(t.dataset.buy, qtyValue()); go("checkout"); return; }
  const id = t.dataset.add || t.dataset.addQty || t.dataset.cinc || t.dataset.cdec;
  const name = lookup(id).name;
  if (t.dataset.cdec){
    const before = snapshot(), n = inCart(id) - 1;
    setQty(id, n);
    n ? toast(`${name}: ${n} in cart`) : undoable(`${name} removed from cart`, before);
    refreshCartControls(host, n ? "[data-cdec]" : "[data-add],[data-add-qty]");
    return;
  }
  const q = t.dataset.addQty ? qtyValue() : 1;
  setQty(id, inCart(id) + q); bumpBadge();
  toast(t.dataset.cinc ? `${name}: ${inCart(id)} in cart` : `${q > 1 ? q + " × " : ""}${name} added to cart`, {action:{label:"View cart", fn(){ go("cart"); }}});
  refreshCartControls(host, "[data-cinc]");
});

/* ---------- Header, drawer, toast ---------- */
function updateHeader(){
  const n = cartCount(), c = $("#cartCount");
  c.textContent = n; c.dataset.n = n;
  $("#cartLink").setAttribute("aria-label", `Cart, ${plural(n, "item")}`);
  const a = $("#acctLink");
  a.href = user ? "#/account" : "#/login";
  a.setAttribute("aria-label", user ? `My account (${user.name})` : "Log in");
  a.innerHTML = user ? `<span class="avatar">${esc(user.name[0].toUpperCase())}</span>` : ic("user");
  $("#drawerAcct").href = user ? "#/account" : "#/login";
  $("#drawerAcct").textContent = user ? `My account · ${user.name}` : "Log in";
}
function openMenu(){
  $("#menuDrawer").classList.add("on"); $("#menuDrawer").setAttribute("aria-hidden", "false");
  $("#scrim").classList.add("on"); $("#openMenu").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden"; setTimeout(() => $("#closeMenu").focus(), 50);
}
function closeMenu(){
  if (!$("#menuDrawer").classList.contains("on")) return;
  $("#menuDrawer").classList.remove("on"); $("#menuDrawer").setAttribute("aria-hidden", "true");
  $("#scrim").classList.remove("on"); $("#openMenu").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}
$("#openMenu").onclick = openMenu;
$("#closeMenu").onclick = closeMenu;
$("#scrim").onclick = closeMenu;
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMenu();
  if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)){ e.preventDefault(); go("search"); }
});

// Toast: type "ok" (tick) or "info"; optional action button (View cart / Undo). Stays longer when it offers Undo.
let tt, toastFn = null;
function toast(msg, {type = "ok", action} = {}){
  $("#toastMsg").textContent = msg;
  $("#toastIcon").innerHTML = `<use href="#i-${type === "ok" ? "check" : "info"}"/>`;
  $("#toast").dataset.type = type;
  const btn = $("#toastAction");
  btn.hidden = !action; toastFn = action?.fn || null;
  if (action) btn.textContent = action.label;
  $("#toast").classList.add("on");
  clearTimeout(tt); tt = setTimeout(() => $("#toast").classList.remove("on"), action ? 6000 : 3200);
}
$("#toastAction").addEventListener("click", () => { $("#toast").classList.remove("on"); toastFn?.(); });
$("#toast").addEventListener("mouseenter", () => clearTimeout(tt));
$("#toast").addEventListener("mouseleave", () => { tt = setTimeout(() => $("#toast").classList.remove("on"), 2000); });

/* ---------- Title Case for headings, buttons and action links ----------
   "Add to cart" → "Add to Cart", "Featured products" → "Featured Products".
   Main words get a capital; short joining words stay lowercase unless they start the text
   or follow ":" / "·". Existing capitals (SPF, UV, AHA, product names) are never lowered.
   A MutationObserver applies it to everything the router or cart controls render later. */
const TITLE_SELECTOR = [
  "h1", "h2", "h3", ".btn", ".link", ".textlink", ".textbtn", ".remove", ".chip", ".fchip",
  "button.option", "a.option b", ".seg a", ".dd-val", ".dd-menu li", ".accordion summary",
  ".nav-top", ".menu b", ".mnav summary", ".mnav .sub a", ".mnav > li > a", ".site-foot li > a",
  ".hero-links a", ".toast-action", ".acct-nav a", ".acct-nav button", ".crumbs a", ".crumbs span",
].join(",");
const MINOR = new Set(["a","an","the","and","but","or","nor","for","so","yet","to","of","in","on","at","by","with","as","per","via","vs","from","into"]);
function titleCaseEl(el){
  if (el.closest("input, textarea, .price, .bb-info")) return;
  // Pass 1: collect the words across all text nodes, so the first and last word are known.
  const nodes = [], words = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode());){
    if (node.parentElement.closest(".price, .sr-only")) continue;
    const parts = node.nodeValue.split(/(\s+)/);
    nodes.push({node, parts});
    parts.forEach((tok, i) => { if (/[A-Za-z]/.test(tok)) words.push({parts, i}); });
  }
  // Pass 2: capitalise.
  let afterBreak = false;
  words.forEach(({parts, i}, n) => {
    const tok = parts[i], m = tok.match(/^([^A-Za-z]*)([A-Za-z])(.*)$/);
    const [, pre, ch, rest] = m, word = (ch + rest).replace(/[^A-Za-z']+$/, "").toLowerCase();
    const edge = n === 0 || n === words.length - 1 || afterBreak;
    const keepLower = !edge && MINOR.has(word) && ch === ch.toLowerCase();
    parts[i] = pre + (keepLower ? ch : ch.toUpperCase()) + rest.replace(/-([a-z])/g, (_, c) => "-" + c.toUpperCase());
    afterBreak = /[:·]$/.test(tok) || /^[:·]$/.test(parts[i + 2] || "");
  });
  nodes.forEach(({node, parts}) => { const out = parts.join(""); if (out !== node.nodeValue) node.nodeValue = out; });
}
function applyTitleCase(root = document){
  if (root.matches?.(TITLE_SELECTOR)) titleCaseEl(root);
  root.querySelectorAll?.(TITLE_SELECTOR).forEach(titleCaseEl);
}
new MutationObserver(list => {
  for (const m of list){
    const el = m.type === "characterData" ? m.target.parentElement : m.target;
    if (!el) continue;
    const host = el.closest(TITLE_SELECTOR);
    host ? titleCaseEl(host) : applyTitleCase(el);
  }
}).observe(document.body, {childList:true, subtree:true, characterData:true});

/* Image retry (portfolio build): if the host drops an image request while many load at once,
   try it again a few times with a growing pause instead of leaving a broken picture. */
document.addEventListener("error", e => {
  const im = e.target;
  if (!(im instanceof HTMLImageElement)) return;
  const tries = +(im.dataset.retry || 0);
  if (tries >= 5) return;
  im.dataset.retry = tries + 1;
  const src = im.getAttribute("src");
  im.removeAttribute("srcset");
  setTimeout(() => { im.src = ""; im.src = src; }, 400 * (tries + 1) + Math.random() * 300);
}, true);

/* Prototype label: small, collapsible, remembered per visitor. */
if (PROTOTYPE){
  document.body.insertAdjacentHTML("beforeend", `<div class="proto-pill" id="protoPill">
    <button type="button" class="proto-min" id="protoMin" aria-expanded="true" aria-controls="protoText"><span class="proto-dot" aria-hidden="true"></span></button>
    <span class="proto-text" id="protoText">${CREDIT} · not affiliated with Beriglo · <a href="../index.html" target="_top">See the case study</a></span></div>`);
  const pill = $("#protoPill"), btn = $("#protoMin");
  const setMin = min => { pill.classList.toggle("min", min); btn.setAttribute("aria-expanded", !min); btn.setAttribute("aria-label", min ? "Show prototype label" : "Hide prototype label"); };
  try { setMin(localStorage.getItem("bg-pill") === "min"); } catch { setMin(false); }
  btn.onclick = () => { const min = !pill.classList.contains("min"); setMin(min); try { localStorage.setItem("bg-pill", min ? "min" : "open"); } catch {} };
}

updateHeader();
render();
applyTitleCase();
