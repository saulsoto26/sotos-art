/* Soto’s Art — lógica de la galería. Lee todo de catalogo.js; no requiere edición. */
"use strict";

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const money = n => new Intl.NumberFormat("es-PR", { style:"currency", currency:"USD" }).format(n);
const bySlug = s => OBRAS.find(o => o.slug === s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const telHref = () => "tel:+1" + CONFIG.telefono.replace(/\D/g, "");
const waLink = msg => CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}` : "";
const obraURL = o => (CONFIG.sitioURL || "") + "obra-" + o.slug + ".html";
const prop = o => (o.w && o.h) ? o.w / o.h : .8;
const listJoin = a => a.length > 1 ? a.slice(0, -1).join(", ") + " y " + a.at(-1) : (a[0] || "");
const minPrice = o => { const p = o.variantes.map(v => v.precio).filter(Boolean); return p.length ? Math.min(...p) : 0; };
function toast(m){ const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2200); }

/* ---------- Medición respetuosa (solo si está configurada) ---------- */
(function loadAnalytics(){
  const a = CONFIG.analitica || {};
  if (!a.proveedor || !a.codigo) return;
  const s = document.createElement("script"); s.async = true;
  if (a.proveedor === "goatcounter"){ s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = `https://${a.codigo}.goatcounter.com/count`; }
  else if (a.proveedor === "plausible"){
    window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments); };
    s.defer = true; s.src = "https://plausible.io/js/script.js"; s.dataset.domain = a.codigo;
  } else return;
  document.head.appendChild(s);
})();
function track(evento, etiqueta){
  const a = CONFIG.analitica || {};
  try {
    if (a.proveedor === "goatcounter" && window.goatcounter?.count)
      window.goatcounter.count({ path: evento + (etiqueta ? "/" + etiqueta : ""), title: evento, event: true });
    else if (a.proveedor === "plausible" && window.plausible)
      window.plausible(evento, { props: etiqueta ? { obra: etiqueta } : {} });
  } catch (e) { /* la medición nunca debe romper la página */ }
}
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]"); if (!a) return;
  const h = a.getAttribute("href");
  if (h.startsWith("https://wa.me")) track("clic_whatsapp", a.dataset.obra);
  else if (h.startsWith("tel:")) track("clic_llamar", a.dataset.obra);
  else if (a.dataset.pago) track("clic_pago", a.dataset.obra);
});

/* ---------- Ajustar una obra dentro de su marco sin recortarla ---------- */
function fitPiece(piece, o){
  const img = $("img", piece), pw = piece.clientWidth, ph = piece.clientHeight, p = prop(o);
  let w = pw, h = pw / p; if (h > ph){ h = ph; w = ph * p; }
  img.style.width = Math.round(w) + "px"; img.style.height = Math.round(h) + "px";
}

/* ---------- Puntillismo: el polvo se convierte en la obra ----------
   Homenaje a Seurat. La fotografía real aparece encima, sin alterarse, y el
   lienzo se detiene por completo cuando termina (no consume batería). */
class Puntillismo {
  constructor(canvas, host, fromBelow){
    this.cv = canvas; this.host = host; this.ctx = canvas.getContext("2d");
    this.N = 0; this.running = false; this.phase = "idle"; this.vis = false; this.fromBelow = fromBelow;
    this.size();
    new IntersectionObserver(([e]) => { this.vis = e.isIntersecting; if (this.vis) this.kick(); }).observe(host);
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => this.size(), 150); });
  }
  size(){
    const r = this.host.getBoundingClientRect(); this.W = Math.round(r.width); this.H = Math.round(r.height);
    if (!this.W || !this.H) return;
    this.cv.width = this.W; this.cv.height = this.H;
    this.buf = this.ctx.createImageData(this.W, this.H); this.u32 = new Uint32Array(this.buf.data.buffer);
    const wide = this.W >= 900, n = lite ? (wide ? 2600 : 1700) : (wide ? 4400 : 2800);
    if (n !== this.N){
      this.N = n;
      [this.X, this.Y, this.VX, this.VY, this.TX, this.TY, this.R, this.G, this.B, this.TR, this.TG, this.TB, this.A, this.DL] = Array.from({ length:14 }, () => new Float32Array(n));
      for (let i = 0; i < n; i++){
        this.X[i] = Math.random() * this.W; this.Y[i] = this.fromBelow ? this.H + Math.random() * this.H * .4 : Math.random() * this.H;
        this.R[i] = this.TR[i] = 224; this.G[i] = this.TG[i] = 196; this.B[i] = this.TB[i] = 142; this.A[i] = 0;
      }
    }
  }
  form(imgEl, onShow){
    const hr = this.host.getBoundingClientRect(), ir = imgEl.getBoundingClientRect();
    const box = { x: ir.left - hr.left, y: ir.top - hr.top, w: ir.width, h: ir.height };
    let pts;
    try { pts = this.sample(imgEl, box); } catch (e) { onShow(); return; }   // p. ej. archivo abierto sin servidor
    const N = this.N;
    for (let k = 0; k < N; k++){
      if (k < pts.length){ const q = pts[k];
        this.TX[k] = q[0]; this.TY[k] = q[1]; this.TR[k] = q[2]; this.TG[k] = q[3]; this.TB[k] = q[4]; this.A[k] = 255;
        this.DL[k] = ((q[1] - box.y) / box.h) * 650 + ((q[0] - box.x) / box.w) * 200 + Math.random() * 220;
      } else { const a = Math.random() * 6.283, rr = .55 + Math.random() * .35;
        this.TX[k] = box.x + box.w / 2 + Math.cos(a) * box.w * rr; this.TY[k] = box.y + box.h / 2 + Math.sin(a) * box.h * rr;
        this.TR[k] = 232; this.TG[k] = 206; this.TB[k] = 150; this.A[k] = 110; this.DL[k] = Math.random() * 900; }
    }
    this.onShow = onShow; this.shown = false; this.phase = "form"; this.t0 = performance.now();
    this.cv.classList.remove("done"); this.kick();
  }
  sample(imgEl, b){
    const step = Math.max(3, Math.sqrt(b.w * b.h / (this.N * .82)));
    this.DS = Math.min(4, Math.max(2, Math.round(step * .68)));
    const cw = Math.max(1, Math.round(b.w / step)), ch = Math.max(1, Math.round(b.h / step));
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const x = c.getContext("2d"); x.drawImage(imgEl, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data, pts = [];
    for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++){ const k = (yy * cw + xx) * 4;
      pts.push([b.x + (xx + .5) * b.w / cw, b.y + (yy + .5) * b.h / ch, d[k], d[k + 1], d[k + 2]]); }
    for (let j = pts.length - 1; j > 0; j--){ const r = Math.random() * (j + 1) | 0; [pts[j], pts[r]] = [pts[r], pts[j]]; }
    return pts;
  }
  release(){
    this.phase = "release"; this.t0 = performance.now(); this.cv.classList.remove("done");
    const cx = this.W / 2, cy = this.H / 2;
    for (let k = 0; k < this.N; k++){ const a = Math.atan2(this.Y[k] - cy, this.X[k] - cx) + (Math.random() - .5) * 1.2, f = 4 + Math.random() * 9;
      this.VX[k] += Math.cos(a) * f; this.VY[k] += Math.sin(a) * f - 2; }
    this.kick();
  }
  kick(){ if (!this.running && this.vis && this.phase !== "rest" && this.phase !== "idle"){ this.running = true; requestAnimationFrame(this.frame); } }
  frame = now => {
    if (!this.vis){ this.running = false; return; }
    const el = now - this.t0, { N, W, H, X, Y, VX, VY, TX, TY, R, G, B, TR, TG, TB, A, DL, u32 } = this, DS = this.DS || 2;
    u32.fill(0);
    for (let k = 0; k < N; k++){
      if (this.phase === "form" && el > DL[k]){ VX[k] += (TX[k] - X[k]) * .035; VY[k] += (TY[k] - Y[k]) * .035; VX[k] *= .82; VY[k] *= .82;
        R[k] += (TR[k] - R[k]) * .08; G[k] += (TG[k] - G[k]) * .08; B[k] += (TB[k] - B[k]) * .08; }
      else { VX[k] = VX[k] * .95 + Math.cos(k * 1.7 + now / 900) * .08; VY[k] = VY[k] * .95 + Math.sin(k * 1.3 + now / 1100) * .08 - .02; }
      X[k] += VX[k]; Y[k] += VY[k];
      const ds = A[k] > 200 ? DS : 2, xi = X[k] | 0, yi = Y[k] | 0;
      if (xi < 0 || yi < 0 || xi >= W - ds || yi >= H - ds) continue;
      const col = ((A[k] | 0) << 24) | ((B[k] | 0) << 16) | ((G[k] | 0) << 8) | (R[k] | 0);
      for (let yy = 0; yy < ds; yy++){ const o = (yi + yy) * W + xi; for (let xx = 0; xx < ds; xx++) u32[o + xx] = col; }
    }
    this.ctx.putImageData(this.buf, 0, 0);
    if (this.phase === "form"){
      if (!this.shown && el > 2000){ this.shown = true; this.onShow && this.onShow(); }
      if (el > 3200) this.cv.classList.add("done");
      if (el > 4300){ this.phase = "rest"; this.running = false; this.ctx.clearRect(0, 0, W, H); return; }
    }
    requestAnimationFrame(this.frame);
  };
}

/* ---------- Ficha de obra (ventana o página propia) ---------- */
function variantLabel(v){ return v.tamano || (v.ancho && v.alto ? `${v.ancho} × ${v.alto} ${v.unidad === "cm" ? "cm" : "pulg"}` : ""); }
function receiveText(v){
  if (!v) return "Material, tamaño y acabado de la reproducción por confirmar.";
  const bits = [v.tipo && "reproducción " + v.tipo, v.material && "en " + v.material, variantLabel(v) && "de " + variantLabel(v), v.acabado && "acabado " + v.acabado].filter(Boolean);
  return bits.length ? "Recibirás una " + bits.join(", ") + "." : "Detalles de la reproducción por confirmar.";
}
function renderFicha(o, mount, opts = {}){
  const vs = o.variantes, sizes = [...new Set(vs.map(variantLabel))], finishes = [...new Set(vs.map(v => v.acabado).filter(Boolean))];
  const falta = [!o.descripcion && "descripción", !vs.length && "tamaños", !vs.length && "precio"].filter(Boolean);
  const onWall = !!$("#wall");
  mount.innerHTML = `<div class="sheet-in">
    <figure class="sheet-fig">${opts.page ? "" : '<button class="close" aria-label="Cerrar" data-close>×</button>'}
      <img src="${esc(o.imagen)}" alt="${esc(o.alt)}" style="--p:${prop(o)}"></figure>
    <div class="sheet-body">
      <span class="sku">${esc(o.sku)}</span>
      ${opts.page ? `<h1 id="sheetTitle">${esc(o.titulo)}</h1>` : `<h2 id="sheetTitle">${esc(o.titulo)}</h2>`}
      ${o.descripcion ? `<p class="lead">${esc(o.descripcion)}</p>` : ""}
      ${o.declaracion ? `<blockquote class="voice">${esc(o.declaracion)}<cite>Luciann Soto</cite></blockquote>` : ""}
      ${o.video ? mediaHTML(o.video, "Luciann habla de " + o.titulo) : ""}
      <p class="price" id="price"></p>
      <p class="receive" id="receive"></p>
      ${o.provisional ? '<p class="small">Imagen provisional de la obra. La fotografía final se publicará con mayor calidad.</p>' : ""}
      ${vs.length ? `<div class="opts">
        <label>Tamaño<select id="selT">${sizes.map(t => `<option ${t === opts.tamano ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
        ${finishes.length > 1 ? `<label>Acabado<select id="selA">${finishes.map(t => `<option>${esc(t)}</option>`).join("")}</select></label>` : ""}
      </div>` : ""}
      <div class="actions"><button class="btn dark" data-review>Ordenar</button>
        ${onWall ? '<button class="btn line" data-wall>Pruébala en tu pared</button>' : `<a class="btn line" href="index.html?pared=${o.slug}#espacio">Pruébala en tu pared</a>`}
</div>
      <div id="details"></div>
      <div id="review"></div>
      <div class="sharebox"><p>¿Te recordó a alguien especial?</p><button class="btn line" data-share>Comparte esta historia</button></div>
      ${falta.length ? `<p class="small pendline">Por confirmar: ${listJoin(falta)}.</p>` : ""}
      ${opts.page ? '<p><a class="btn line" href="index.html#obras">Ver toda la colección</a></p>' : ""}
    </div></div>`;
  const current = () => { const t = $("#selT", mount)?.value, a = $("#selA", mount)?.value;
    return vs.find(v => variantLabel(v) === t && (!a || v.acabado === a)) || vs.find(v => variantLabel(v) === t) || null; };
  const paint = () => { const v = current();
    $("#price", mount).innerHTML = v && v.precio ? money(v.precio) : "<span>Reproducción de alta calidad</span><small>Precio por confirmar</small>";
    $("#receive", mount).textContent = receiveText(v) + (v && v.disponible === false ? " No disponible en este momento." : "");
    const env = CONFIG.envio, pol = CONFIG.politicas, pc = "Por confirmar";
    const metodos = [CONFIG.metodosPago.athMovil && "ATH Móvil Business", CONFIG.metodosPago.stripe && "tarjeta", CONFIG.metodosPago.paypal && "PayPal"].filter(Boolean);
    const rows = [
      ["Obra", `«${esc(o.titulo)}», ${esc(o.sku)}`],
      ["Qué recibes", "Reproducción de la pintura original" + (o.original ? ` (original: ${esc(o.original)})` : "")],
      ["Tamaño", v ? esc(variantLabel(v)) : pc],
      ["Material y acabado", v && (v.material || v.acabado) ? esc([v.tipo, v.material, v.acabado].filter(Boolean).join(", ")) : pc],
      ["Precio", v && v.precio ? money(v.precio) + " USD" : pc],
      ["Envío", env.costo ? esc(env.costo) : pc],
      ["Preparación", env.preparacion ? esc(env.preparacion) : pc],
      ["Entrega estimada", env.entrega ? esc(env.entrega) : pc],
      ["Cancelación y devolución", pol.devoluciones || pol.cancelaciones ? '<a href="index.html#comprar">Ver políticas</a>' : pc],
      ["Pago", metodos.length ? "En línea con " + listJoin(metodos) + ", o directamente con la artista" : "Directamente con la artista; el pago en línea aún no está activo"],
      ["Artista", `${esc(CONFIG.nombreLegal)}, <a href="${telHref()}">${esc(CONFIG.telefono)}</a>`]
    ];
    $("#details", mount).innerHTML = `<details class="soft"><summary>Detalles de compra</summary><dl class="spec">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join("")}</dl></details>`;
    $("#review", mount).innerHTML = ""; };
  paint(); $$("select", mount).forEach(s => s.addEventListener("change", paint));
  mount.onclick = e => {
    if (e.target === mount || e.target.closest("[data-close]")) return mount.close && mount.close();
    if (e.target.closest("[data-share]")) return share(o);
    if (e.target.closest("[data-review]")){ track("clic_ordenar", o.slug); return review(o, current(), mount); }
    if (e.target.closest("[data-wall]")){ mount.close && mount.close(); return Pared.show(o.slug, variantLabel(current() || {})); }
  };
}
function review(o, v, mount){
  const sel = v || {}, links = sel.enlaces || {};
  const pay = [["athMovil", "Pagar con ATH Móvil"], ["stripe", "Pagar con tarjeta"], ["paypal", "Pagar con PayPal"]]
    .filter(([k]) => links[k] && sel.disponible !== false)
    .map(([k, n]) => `<a class="btn gold" href="${esc(links[k])}" target="_blank" rel="noopener" data-pago="${k}" data-obra="${o.slug}">${n}</a>`).join("");
  const label = variantLabel(sel);
  const msg = `Hola, Luciann. Me interesa una reproducción de «${o.titulo}» (${o.sku})` + (label ? `, tamaño ${label}` : "") + (sel.acabado ? `, acabado ${sel.acabado}` : "") + ". ¿Me puedes dar información para ordenarla?";
  const env = CONFIG.envio, envio = [env.costo, env.destinos && "a " + env.destinos, env.entrega && "entrega en " + env.entrega].filter(Boolean).join(", ");
  $("#review", mount).innerHTML = `<div class="review fade-in"><h3>Tu orden</h3>
    <dl class="spec">
      <dt>Obra</dt><dd>«${esc(o.titulo)}»${label ? ", " + esc(label) : ""}${sel.acabado ? ", " + esc(sel.acabado) : ""}</dd>
      <dt>Precio</dt><dd>${sel.precio ? money(sel.precio) : "Por confirmar"}</dd>
      <dt>Envío</dt><dd>${envio ? esc(envio) : "Por confirmar con la artista"}</dd>
      ${env.recogido ? `<dt>Recogido</dt><dd>${esc(env.recogido)}</dd>` : ""}
    </dl>
    <div class="actions">${pay}
      ${CONFIG.whatsapp ? `<a class="btn ${pay ? "line" : "gold"}" href="${waLink(msg)}" target="_blank" rel="noopener" data-obra="${o.slug}">Ordenar por WhatsApp</a>` : ""}
      <a class="btn line" href="${telHref()}" data-obra="${o.slug}">Llamar</a></div>
    <p class="small">Vende ${esc(CONFIG.nombreLegal)}, ${esc(CONFIG.marca)}. ${pay ? "El pago se procesa en la plataforma oficial; este sitio no recibe datos de tarjetas." : "El pago en línea aún no está activo: Luciann coordina contigo el pago y la entrega."}
      ${CONFIG.politicas.confirmacion ? esc(CONFIG.politicas.confirmacion) + " " : ""}<a href="index.html#comprar">Políticas</a></p></div>`;
  $("#review", mount).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
}
function share(o){
  const url = obraURL(o), data = { title: o.titulo + " | Soto’s Art", text: "Mira «" + o.titulo + "» de Luciann Soto", url };
  track("compartir", o.slug);
  if (navigator.share) navigator.share(data).catch(() => {});
  else (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Enlace copiado"), () => toast("No se pudo copiar. Mantén presionado para copiar."));
}
function mediaHTML(src, title){
  if (/\.(mp4|webm|mov)$/i.test(src)) return `<video class="video" controls preload="none" playsinline src="${esc(src)}" title="${esc(title)}"></video>`;
  if (/\.(mp3|m4a|wav|ogg)$/i.test(src)) return `<audio controls preload="none" src="${esc(src)}" style="width:100%"></audio>`;
  return `<iframe class="video" src="https://www.youtube-nocookie.com/embed/${esc(src)}" title="${esc(title)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}
function openWork(slug, fromEl, tamano){
  const o = bySlug(slug), sheet = $("#sheet"); if (!o || !sheet) return;
  renderFicha(o, sheet, { tamano });
  if (!sheet.open) sheet.showModal();
  $(".sheet-in", sheet).scrollTop = 0;
  track("ver_obra", o.slug);
  if (location.hash !== "#/obra/" + o.slug) history.replaceState(null, "", "#/obra/" + o.slug);
  document.title = o.titulo + " | Soto’s Art";
  if (fromEl && !reduce){
    const t = $(".sheet-fig img", sheet), a = fromEl.getBoundingClientRect(), b = t.getBoundingClientRect();
    if (a.width && b.width) t.animate([{ transform:`translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width})`, transformOrigin:"0 0" }, { transform:"none", transformOrigin:"0 0" }], { duration:520, easing:"cubic-bezier(.2,.7,.2,1)" });
  }
}

/* =====================================================================
   PÁGINA PRINCIPAL
   ===================================================================== */
/* ---------- Apertura: el umbral de las emociones ----------
   El vacío → la forma (vasija) → la fractura → la luz (costuras de oro) → la vida (mariposa).
   Formas originales y abstractas: no reproducen ninguna pintura. */
const UMBRAL_SIMBOLOS = [
  { palabra: "Esperanza", forma: "brote", colores: ["#B9D29A", "#E3EBC9", "#E0C48E", "#8DB27A", "#9FC48A"] },
  { palabra: "Restauración", forma: "vasija", colores: ["#EEE6D6", "#E0C48E", "#E8D6B0", "#FFD98A", "#E8D6B0"] },
  { palabra: "Fortaleza", forma: "raiz", colores: ["#D9B36F", "#EEE6D6", "#E0C48E", "#FFD98A", "#C9A46A"] },
  { palabra: "Vida", forma: "flor", colores: ["#5FC3DD", "#A7E3F0", "#E0C48E", "#F2D3A0", "#7FD0E4"] }
];
const UMBRAL_FORMAS = {
  vasija(c){
    c.beginPath(); c.moveTo(72,28); c.lineTo(128,28); c.lineTo(124,36); c.quadraticCurveTo(116,44,118,62);
    c.bezierCurveTo(150,72,172,100,166,130); c.bezierCurveTo(160,162,136,180,124,186); c.lineTo(76,186);
    c.bezierCurveTo(64,180,40,162,34,130); c.bezierCurveTo(28,100,50,72,82,62); c.quadraticCurveTo(84,44,76,36); c.closePath(); c.fill();
    c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(84,48); c.bezierCurveTo(40,40,36,86,58,84);
    c.moveTo(116,48); c.bezierCurveTo(160,40,164,86,142,84); c.stroke();
  },
  mariposa(c){
    c.save(); c.translate(100,100);
    [-1,1].forEach(s => { c.beginPath(); c.ellipse(s*44,-26,50,32,s*-0.62,0,7); c.fill(); c.beginPath(); c.ellipse(s*30,34,32,21,s*0.8,0,7); c.fill(); });
    c.beginPath(); c.ellipse(0,4,5,46,0,0,7); c.fill();
    c.lineWidth = 4; c.beginPath(); c.moveTo(-2,-40); c.quadraticCurveTo(-10,-70,-22,-78); c.moveTo(2,-40); c.quadraticCurveTo(10,-70,22,-78); c.stroke();
    c.globalCompositeOperation = "destination-out";
    [[-58,-38,10],[58,-38,10],[-34,38,6],[34,38,6]].forEach(([x,y,r]) => { c.beginPath(); c.arc(x,y,r,0,7); c.fill(); });
    c.restore();
  },
  brote(c){
    c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(100,184); c.quadraticCurveTo(96,140,102,92); c.stroke();
    c.beginPath(); c.ellipse(70,104,36,15,-0.55,0,7); c.fill(); c.beginPath(); c.ellipse(136,76,44,18,-2.55,0,7); c.fill();
    c.beginPath(); c.ellipse(102,186,58,7,0,0,7); c.fill();
  },
  raiz(c){
    c.lineCap = "round"; c.beginPath(); c.moveTo(92,40); c.lineTo(108,40); c.lineTo(112,120); c.lineTo(88,120); c.closePath(); c.fill();
    c.lineWidth = 6; c.beginPath();
    [[100,118,60,150,30,190],[100,118,84,160,66,192],[100,118,116,160,134,192],[100,118,140,150,170,190],[100,120,100,160,100,194]].forEach(([a,b,c1,d,e,f]) => { c.moveTo(a,b); c.quadraticCurveTo(c1,d,e,f); });
    c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(100,60); c.quadraticCurveTo(70,40,58,18); c.moveTo(100,70); c.quadraticCurveTo(132,48,146,24); c.stroke();
  },
  flor(c){
    c.save(); c.translate(100,86);
    for (let i = 0; i < 6; i++){ c.save(); c.rotate(i*Math.PI/3); c.beginPath(); c.ellipse(0,-34,15,30,0,0,7); c.fill(); c.restore(); }
    c.restore(); c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(100,86,14,0,7); c.fill();
    c.globalCompositeOperation = "source-over"; c.beginPath(); c.arc(100,86,9,0,7); c.fill();
    c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(100,120); c.quadraticCurveTo(104,160,98,194); c.stroke();
    c.beginPath(); c.ellipse(118,166,22,9,-0.5,0,7); c.fill();
  }
};
function umbralSample(draw, step){
  const c = document.createElement("canvas"); c.width = c.height = 200;
  const x = c.getContext("2d"); x.fillStyle = x.strokeStyle = "#000"; draw(x);
  const d = x.getImageData(0, 0, 200, 200).data, pts = [];
  const A = (x, y) => (x < 0 || y < 0 || x > 199 || y > 199) ? 0 : d[((y | 0) * 200 + (x | 0)) * 4 + 3];
  for (let y = 0; y < 200; y += step) for (let xx = 0; xx < 200; xx += step) if (A(xx, y) > 128)
    pts.push([xx, y, A(xx - 3, y) < 128 || A(xx + 3, y) < 128 || A(xx, y - 3) < 128 || A(xx, y + 3) < 128]);
  for (let j = pts.length - 1; j > 0; j--){ const r = Math.random() * (j + 1) | 0; [pts[j], pts[r]] = [pts[r], pts[j]]; }
  return pts;
}
const hex3 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

function initUmbral(){
  const hero = $("#inicio"); if (!hero) return;
  const cv = $("canvas.umbral", hero), stage = $(".umbral-stage", hero), word = $(".umbral-word", hero), hit = $(".umbral-hit", hero);
  const lines = $$("h1 span", hero);
  if (reduce) return;                                   // composición fija (SVG) + texto + botones
  let ctx; try { ctx = cv.getContext("2d"); if (!ctx) return; } catch (e) { return; }
  hero.classList.add("seq");
  const t0 = performance.now();
  setTimeout(() => lines[0] && lines[0].classList.add("on"), 1000);
  setTimeout(() => lines[1] && lines[1].classList.add("on"), 4600);
  setTimeout(() => lines.forEach(l => l.classList.add("on")), 9000);   // por si algo se retrasa

  /* Formas */
  let vas, mar, sym = {};
  try {
    const raw = umbralSample(UMBRAL_FORMAS.vasija, 2.2);
    const seeds = [[86,52],[118,58],[56,112],[146,108],[100,118],[78,166],[124,164]];
    const frags = seeds.map(() => ({ sx: 0, sy: 0, n: 0 }));
    vas = raw.map(([x, y, edge]) => {
      let d1 = 1e9, d2 = 1e9, k = 0;
      seeds.forEach(([a, b], i) => { const d = Math.hypot(x - a, y - b); if (d < d1){ d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; });
      frags[k].sx += x; frags[k].sy += y; frags[k].n++;
      return { rx: (x - 100) / 200, ry: (y - 107) / 200, f: k, seam: d2 - d1 < 2.4, edge };
    });
    frags.forEach((f, i) => { f.cx = (f.sx / f.n - 100) / 200; f.cy = (f.sy / f.n - 107) / 200;
      const L = Math.hypot(f.cx, f.cy) || 1; f.dx = f.cx / L; f.dy = f.cy / L; f.rot = (i % 2 ? 1 : -1) * 0.16; });
    vas.frags = frags;
    mar = umbralSample(UMBRAL_FORMAS.mariposa, 2.6).map(([x, y]) => [(x - 100) / 200, (y - 100) / 200]);
    ["brote", "raiz", "flor"].forEach(k => sym[k] = umbralSample(UMBRAL_FORMAS[k], 2.4).map(([x, y]) => [(x - 100) / 200, (y - 107) / 200]));
  } catch (e) { return; }

  /* Partículas */
  const DPR = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0;
  const wideNow = () => innerWidth >= 900;
  const N = Math.round((wideNow() ? 2600 : 1500) * (lite ? .65 : 1));
  const nA = Math.round(N * .18), nF = N - nA;
  const seamPts = vas.filter(p => p.seam), bodyPts = vas.filter(p => !p.seam && !p.edge), edgePts = vas.filter(p => !p.seam && p.edge);
  const nS = Math.min(seamPts.length, Math.round(nF * .12)), nB = Math.round(nF * .42);
  const F = n => new Float32Array(n);
  const X = F(N), Y = F(N), VX = F(N), VY = F(N), AL = F(N), TA = F(N), SZ = F(N), SD = F(N), RX = F(N), RY = F(N), SX = F(N), SY = F(N), BX = F(N), BY = F(N), ST = F(N);
  const MODE = new Uint8Array(N), GR = new Uint8Array(N), FRG = new Uint8Array(N), SEAM = new Uint8Array(N), BUT = new Uint8Array(N);
  /* grupos: 0 y 1 cuerpo, 2 y 5 cuerpo que será mariposa, 3 costuras, 4 motas */
  const G = 6, col = Array.from({ length: G }, () => [224, 196, 142]), tcol = col.map(c => c.slice());
  const pal = (arr) => { for (let g = 0; g < 4; g++) tcol[g] = hex3(arr[g]); tcol[5] = hex3(arr[4] || arr[2]); };
  pal(["#EEE6D6", "#E0C48E", "#E8D6B0", "#FFD98A", "#E8D6B0"]); tcol[4] = hex3("#E0C48E");
  for (let g = 0; g < G; g++) col[g] = tcol[g].slice();

  function size(){
    const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const hr = r, sr = stage.getBoundingClientRect();
    V.cx = sr.left - hr.left + sr.width / 2; V.cy = sr.top - hr.top + sr.height / 2; V.s = Math.min(sr.width, sr.height) * .98;
    /* La mariposa se posa sobre la boca de la vasija restaurada (queda a la vista y no tapa el texto) */
    const rs = Math.max(56, Math.min(110, V.s * .26));
    REST.cx = V.cx; REST.cy = V.cy - V.s * .43; REST.s = rs;
    if (phase === "rest" && !symbolOn){ Bf.tcx = REST.cx; Bf.tcy = REST.cy; Bf.ts = REST.s; }
    Sy.cx = V.cx; Sy.cy = V.cy - V.s * .04; Sy.s = V.s * .82;
    placeHit();
  }
  const V = { cx: 0, cy: 0, s: 0 }, REST = { cx: 0, cy: 0, s: 0 }, Bf = { cx: 0, cy: 0, s: 0, tcx: 0, tcy: 0, ts: 0 }, Sy = { cx: 0, cy: 0, s: 0 };
  let phase = "void", fr = 0, frT = 0, seamA = 0, seamT = 0, glow = 0, symbolOn = -1, symbolIdx = -1, last = performance.now(), running = false, vis = true;
  const ripples = []; let pointer = null;

  size();
  for (let i = 0; i < N; i++){
    X[i] = Math.random() * W; Y[i] = Math.random() * H; SD[i] = Math.random(); AL[i] = 0; TA[i] = .12 + SD[i] * .3;
    SZ[i] = 1.1 + Math.random() * 1.3; MODE[i] = 0; GR[i] = 4;
  }
  /* asignación fija de la vasija y la mariposa */
  for (let k = 0; k < nF; k++){
    const i = nA + k;
    if (k < nS){ const p = seamPts[k % seamPts.length]; RX[i] = p.rx; RY[i] = p.ry; FRG[i] = p.f; SEAM[i] = 1; }
    else { const p = (k % 5 < 2 && edgePts.length) ? edgePts[k % edgePts.length] : bodyPts[k % bodyPts.length]; RX[i] = p.rx; RY[i] = p.ry; FRG[i] = p.f; }
    if (k >= nS && k < nS + nB){ BUT[i] = 1; const q = mar[(k - nS) % mar.length]; BX[i] = q[0]; BY[i] = q[1]; }
  }

  /* Escenas */
  function forma(){
    phase = "forma";
    for (let i = nA; i < N; i++){ MODE[i] = 1; ST[i] = performance.now() + Math.random() * 700 + (RY[i] + .5) * 400;
      GR[i] = SEAM[i] ? 3 : BUT[i] ? (i % 2 ? 2 : 5) : (i % 2 ? 0 : 1); SZ[i] = SEAM[i] ? 2.2 : 1.5 + Math.random() * 1.1; }
    seamT = .12;
  }
  const grieta = () => { seamT = 1; phase = "grieta"; };
  const fractura = () => { frT = 1; seamT = 0; phase = "fractura"; };
  const restaura = () => { frT = 0; phase = "luz"; };
  const oro = () => { seamT = 1; glow = 1; for (let i = nA; i < N; i++) if (SEAM[i]) SZ[i] = 2.8; };
  function vida(){
    phase = "vida";
    pal(["#EEE6D6", "#E0C48E", "#5FC3DD", "#FFD98A", "#A7E3F0"]);
    Bf.cx = Bf.tcx = V.cx; Bf.cy = Bf.tcy = V.cy - V.s * .36; Bf.s = Bf.ts = V.s * .1;
    Bf.ts = V.s * .46; Bf.tcy = V.cy - V.s * .08;
    for (let i = nA; i < N; i++){
      if (BUT[i]){ MODE[i] = 2; SZ[i] = 1.4 + Math.random() * .9; }
      else if (SEAM[i]){ SZ[i] = 1.8; }   /* las costuras de oro permanecen, tenues: lo restaurado queda */
      else { MODE[i] = 0; TA[i] = SD[i] < .22 ? .32 : .05; VX[i] += (Math.random() - .5) * 2.4; VY[i] -= Math.random() * 1.6; }
    }
  }
  function vuelo(){ phase = "vuelo"; seamT = .3; Bf.tcx = REST.cx; Bf.tcy = REST.cy; Bf.ts = REST.s; }
  function reposo(){ phase = "rest"; last = performance.now(); placeHit(); hit.hidden = false;
    if (symbolIdx < 0){ word.innerHTML = '<span class="hint">Toca la mariposa</span>'; word.classList.add("on"); } }
  const timeline = [[1000, forma], [2300, grieta], [2700, fractura], [3600, restaura], [4300, oro], [5200, vida], [6600, vuelo], [8000, reposo]];

  /* Símbolos al tocar la mariposa */
  function showSymbol(){
    symbolIdx = (symbolIdx + 1) % UMBRAL_SIMBOLOS.length; const S = UMBRAL_SIMBOLOS[symbolIdx]; symbolOn = symbolIdx;
    pal(S.colores);
    if (S.forma === "vasija"){
      for (let i = nA; i < N; i++){ MODE[i] = 1; ST[i] = 0; GR[i] = SEAM[i] ? 3 : (i % 2 ? 0 : 1); }
      fr = frT = 0; seamT = 1; glow = .8; Vsave = { ...V }; V.cx = Sy.cx; V.cy = Sy.cy; V.s = Sy.s;
    } else {
      const pts = sym[S.forma]; seamT = 0;
      for (let i = nA, k = 0; i < N; i++, k++){ MODE[i] = 3; const q = pts[k % pts.length]; SX[i] = q[0]; SY[i] = q[1]; GR[i] = k % 3 === 0 ? 2 : k % 3 === 1 ? 0 : 1; }
    }
    word.innerHTML = `<b>${S.palabra}</b><a href="#obras">Encuéntrala en la colección</a>`; word.classList.add("on");
    hit.setAttribute("aria-label", `${S.palabra}. Tocar para volver a la mariposa`);
    track("umbral_simbolo", S.palabra); placeHit();
  }
  let Vsave = null;
  function backToButterfly(){
    symbolOn = -1; if (Vsave){ Object.assign(V, Vsave); Vsave = null; } size();
    pal(["#EEE6D6", "#E0C48E", "#5FC3DD", "#FFD98A", "#A7E3F0"]); seamT = .3; fr = frT = 0;
    Bf.tcx = REST.cx; Bf.tcy = REST.cy; Bf.ts = REST.s; Bf.cx = Sy.cx; Bf.cy = Sy.cy; Bf.s = Sy.s * .6;
    for (let i = nA; i < N; i++){
      if (BUT[i]){ MODE[i] = 2; GR[i] = i % 2 ? 2 : 5; }
      else if (SEAM[i]){ MODE[i] = 1; GR[i] = 3; }
      else { MODE[i] = 0; TA[i] = SD[i] < .22 ? .32 : .05; }
    }
    word.classList.remove("on"); hit.setAttribute("aria-label", "Tocar la mariposa"); placeHit();
  }
  function placeHit(){
    if (symbolOn >= 0){ hit.style.left = Sy.cx + "px"; hit.style.top = Sy.cy + "px"; hit.style.width = hit.style.height = Sy.s * .7 + "px"; hit.style.margin = -Sy.s * .35 + "px 0 0 " + -Sy.s * .35 + "px"; }
    else { hit.style.left = REST.cx + "px"; hit.style.top = REST.cy + "px"; hit.style.width = hit.style.height = ""; hit.style.margin = ""; }
  }
  hit.addEventListener("click", e => { e.stopPropagation(); last = performance.now(); symbolOn >= 0 ? backToButterfly() : showSymbol(); kick(); });

  /* Interacción: la luz del dedo atrae; tocar el fondo deja una onda */
  const pos = e => { const r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  hero.addEventListener("pointermove", e => { pointer = pos(e); last = performance.now(); kick(); });
  hero.addEventListener("pointerleave", () => pointer = null);
  hero.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") setTimeout(() => pointer = null, 400); });
  hero.addEventListener("click", e => {
    if (e.target.closest("a,button")) return;
    const p = pos(e); ripples.push({ x: p.x, y: p.y, t: performance.now() }); last = performance.now();
    for (let i = 0; i < N; i++){ const dx = X[i] - p.x, dy = Y[i] - p.y, d = Math.hypot(dx, dy); if (d < 120 && d > 0){ const f = (120 - d) / 120 * 3; VX[i] += dx / d * f; VY[i] += dy / d * f; } }
    kick();
  });

  /* Bucle */
  function kick(){ if (!running && vis && !document.hidden){ running = true; requestAnimationFrame(frame); } }
  function frame(now){
    if (!vis || document.hidden){ running = false; return; }
    const el = now - t0;
    while (timeline.length && el >= timeline[0][0]) timeline.shift()[1]();
    fr += (frT - fr) * .07; seamA += (seamT - seamA) * .09; glow *= .965;
    for (let g = 0; g < G; g++) for (let k = 0; k < 3; k++) col[g][k] += (tcol[g][k] - col[g][k]) * .05;
    Bf.cx += (Bf.tcx - Bf.cx) * .035; Bf.cy += (Bf.tcy - Bf.cy) * .035; Bf.s += (Bf.ts - Bf.s) * .05;
    const flying = Math.hypot(Bf.tcx - Bf.cx, Bf.tcy - Bf.cy) > 6;
    const flap = flying ? .45 + .55 * Math.abs(Math.cos(now / 170)) : .78 + .22 * Math.cos(now / 650);
    const bob = flying ? Math.sin(now / 260) * 10 : 0;
    const frags = vas.frags;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    if (glow > .02){
      const gr = ctx.createRadialGradient(V.cx, V.cy, 0, V.cx, V.cy, V.s * .75);
      gr.addColorStop(0, `rgba(255,217,138,${.32 * glow})`); gr.addColorStop(1, "rgba(255,217,138,0)");
      ctx.fillStyle = gr; ctx.fillRect(V.cx - V.s, V.cy - V.s, V.s * 2, V.s * 2);
    }
    let settled = true;
    for (let g = 0; g < G; g++){
      const c = col[g]; ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      for (let i = 0; i < N; i++){
        if (GR[i] !== g) continue;
        const m = MODE[i];
        let tx, ty, active = m !== 0 && now >= ST[i];
        if (active){
          if (m === 1){
            let px = RX[i], py = RY[i];
            if (fr > .002 && !SEAM[i]){ const f = frags[FRG[i]], a = f.rot * fr, ca = Math.cos(a), sa = Math.sin(a), dx = px - f.cx, dy = py - f.cy;
              px = f.cx + dx * ca - dy * sa + f.dx * fr * .2; py = f.cy + dx * sa + dy * ca + f.dy * fr * .2; }
            tx = V.cx + px * V.s; ty = V.cy + py * V.s; TA[i] = SEAM[i] ? seamA : 1;
          } else if (m === 2){ tx = Bf.cx + BX[i] * Bf.s * flap; ty = Bf.cy + BY[i] * Bf.s + bob; TA[i] = 1; }
          else { tx = Sy.cx + SX[i] * Sy.s; ty = Sy.cy + SY[i] * Sy.s; TA[i] = 1; }
          VX[i] += (tx - X[i]) * .05; VY[i] += (ty - Y[i]) * .05; VX[i] *= .82; VY[i] *= .82;
          if (Math.abs(tx - X[i]) + Math.abs(ty - Y[i]) > 1.2) settled = false;
        } else {
          VX[i] = VX[i] * .975 + Math.cos(SD[i] * 40 + now / 1900) * .012; VY[i] = VY[i] * .975 + Math.sin(SD[i] * 30 + now / 2300) * .012 - .004;
          if (Math.abs(VX[i]) + Math.abs(VY[i]) > .25) settled = false;
        }
        if (pointer){ const dx = pointer.x - X[i], dy = pointer.y - Y[i], d2 = dx * dx + dy * dy;
          if (d2 < 12000){ const f = (1 - d2 / 12000) * (m === 0 ? .03 : .008); VX[i] += dx * f * .1; VY[i] += dy * f * .1; if (m === 0) AL[i] = Math.min(.8, AL[i] + .02); settled = false; } }
        X[i] += VX[i]; Y[i] += VY[i];
        if (m === 0){ if (X[i] < -5) X[i] = W + 5; else if (X[i] > W + 5) X[i] = -5; if (Y[i] < -5) Y[i] = H + 5; else if (Y[i] > H + 5) Y[i] = -5; }
        AL[i] += (TA[i] - AL[i]) * .06;
        const a = AL[i] * (m === 0 ? .7 + .3 * Math.sin(SD[i] * 20 + now / 900) : 1);
        if (a < .02) continue;
        ctx.globalAlpha = a; const s = SZ[i]; ctx.fillRect(X[i] - s / 2, Y[i] - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    for (let r = ripples.length - 1; r >= 0; r--){ const R = ripples[r], k = (now - R.t) / 800;
      if (k >= 1){ ripples.splice(r, 1); continue; }
      ctx.strokeStyle = `rgba(224,196,142,${.45 * (1 - k)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(R.x, R.y, 8 + k * 70, 0, 7); ctx.stroke(); settled = false; }
    ctx.globalCompositeOperation = "source-over";
    if (!hero.classList.contains("live")) hero.classList.add("live");
    /* En reposo, sin interacción durante 15 s: se detiene por completo */
    if (phase === "rest" && now - last > 15000 && !flying){ running = false; return; }
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { size(); kick(); }, 150); });
  kick();
}

function initRecorrido(){
  const sec = $("#recorrido"); if (!sec) return;
  const piece = $(".piece", sec), img = $("img", piece), ROM = ["I", "II", "III", "IV", "V", "VI"];
  let cur = -1, eng = null, tok = 0, started = false;
  $(".rec-dots", sec).innerHTML = RECORRIDO.map((r, i) => `<button aria-label="Capítulo ${ROM[i]}: ${esc(bySlug(r[0]).titulo)}"></button>`).join("");
  const dots = $$(".rec-dots button", sec);
  const tone = im => { try {
      const c = document.createElement("canvas"); c.width = c.height = 12; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 12, 12);
      const d = x.getImageData(0, 0, 12, 12).data; let r = 0, g = 0, b = 0, br = [0, 0, 0, 0];
      for (let i = 0; i < d.length; i += 4){ r += d[i]; g += d[i + 1]; b += d[i + 2]; const l = d[i] + d[i + 1] + d[i + 2]; if (l > br[3]) br = [d[i], d[i + 1], d[i + 2], l]; }
      const n = d.length / 4, mix = (a, w) => Math.round(a / n * .28 + w * .72);
      return { bg:`rgb(${mix(r, 20)},${mix(g, 16)},${mix(b, 12)})`, glow:`rgba(${br[0]},${br[1]},${br[2]},.32)` };
    } catch (e) { return null; } };
  function go(i){
    if (i === cur) return; cur = i; const t = ++tok;
    const [slug, phrase, line] = RECORRIDO[i], o = bySlug(slug);
    sec.classList.add("swap"); piece.classList.remove("on");
    if (eng) eng.release();
    track("recorrido_capitulo", String(i + 1));
    setTimeout(() => {
      if (t !== tok) return;
      $(".rec-num", sec).innerHTML = `<b>${ROM[i]}</b>de VI`; $("h3", sec).textContent = phrase; $(".rec-line", sec).textContent = line;
      $(".rec-title", sec).textContent = "«" + o.titulo + "»";
      dots.forEach((d, k) => { d.setAttribute("aria-current", k === i); d.classList.toggle("seen", k < i); });
      $("[data-prev]", sec).disabled = i === 0;
      const last = i === RECORRIDO.length - 1;
      $("[data-next]", sec).hidden = last; $("[data-end]", sec).hidden = !last;
      sec.classList.remove("swap");
      img.onload = () => {
        fitPiece(piece, o);
        const tn = tone(img); if (tn){ sec.style.setProperty("--rbg", tn.bg); sec.style.setProperty("--rglow", tn.glow); }
        const show = () => piece.classList.add("on");
        if (reduce) return show();
        if (!eng) eng = new Puntillismo($("canvas", sec), sec, false);
        eng.vis = true; requestAnimationFrame(() => eng.form(img, show));
      };
      img.src = o.imagen; img.alt = o.alt;
      if (last) track("recorrido_completo");
    }, cur === 0 && !eng ? 0 : 450);
  }
  const step = d => go(Math.max(0, Math.min(RECORRIDO.length - 1, cur + d)));
  $("[data-prev]", sec).addEventListener("click", () => step(-1));
  $("[data-next]", sec).addEventListener("click", () => step(1));
  dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
  $(".piece button.open", sec).addEventListener("click", () => openWork(RECORRIDO[cur][0], img));
  $(".rec-skip", sec).addEventListener("click", () => track("recorrido_salida", String(cur + 1)));
  sec.addEventListener("keydown", e => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
  let sx = null;
  piece.addEventListener("pointerdown", e => sx = e.clientX);
  piece.addEventListener("pointerup", e => { if (sx !== null && Math.abs(e.clientX - sx) > 40){ step(e.clientX < sx ? 1 : -1); } sx = null; });
  addEventListener("resize", () => cur >= 0 && fitPiece(piece, bySlug(RECORRIDO[cur][0])));
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !started){ started = true; go(0); } }, { threshold: .25 }).observe(sec);
}

function renderSalon(){
  const card = o => {
    const p = minPrice(o);
    return `<a class="work" href="obra-${o.slug}.html" data-slug="${o.slug}"><div class="frame"><img src="${esc(o.imagen)}" alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy" decoding="async"></div>
      <h3>${esc(o.titulo)}</h3><span class="meta">${p ? "Reproducciones desde " + money(p) : "Precio por confirmar"}</span></a>`;
  };
  $("#salon").innerHTML = OBRAS.map(card).join("");
  ["#salon"].forEach(id => $(id).addEventListener("click", e => {
    const a = e.target.closest(".work"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); openWork(a.dataset.slug, $("img", a));
  }));
}

function initDosObras(){
  const root = $("#dos-obras"); if (!root) return;
  const Q = bySlug("quebrantada"), R = bySlug("restaurada");
  const fig = (o, cls = "") => `<figure class="${cls}"><img src="${esc(o.imagen)}" alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy"><figcaption>«${esc(o.titulo)}»</figcaption></figure>`;
  const seam = `<svg class="seam" viewBox="0 0 14 200" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M7 0 L4 28 L10 52 L5 84 L9 118 L4 148 L9 176 L7 200"/></svg>`;
  const stage = $(".two-stage", root), panel = $(".two-panel", root);
  function step1(){
    stage.className = "two-stage"; stage.innerHTML = fig(Q);
    panel.innerHTML = `<h3>¿Qué sentimiento despierta esta imagen en ti?</h3>
      <div class="choices" role="group" aria-label="Sentimiento">${Object.keys(DOS_OBRAS.sentimientos).map(k => `<button class="choice" aria-pressed="false">${k}</button>`).join("")}</div>
      <div id="r1" aria-live="polite"></div>`;
    $(".choices", panel).onclick = e => {
      const b = e.target.closest(".choice"); if (!b) return;
      $$(".choice", panel).forEach(c => c.setAttribute("aria-pressed", c === b)); track("dos_obras_sentimiento", b.textContent);
      $("#r1", panel).innerHTML = `<div class="fade-in"><p class="reflect">${DOS_OBRAS.sentimientos[b.textContent]}</p>
        <p class="note">Lectura curatorial, no palabras de la artista.</p>
        <div class="ctas"><button class="btn gold" data-step2>Revelar la segunda obra</button></div></div>`;
      $("[data-step2]", panel).onclick = step2;
    };
  }
  function step2(){
    stage.className = "two-stage both"; stage.innerHTML = fig(Q) + seam + fig(R, "reveal");
    panel.innerHTML = `<h3>¿Cuál de estas dos obras conecta más con tu historia?</h3>
      <div class="choices" role="group" aria-label="Obra">
        <button class="choice" data-c="quebrantada" aria-pressed="false">Quebrantada</button>
        <button class="choice" data-c="restaurada" aria-pressed="false">Restaurada</button>
        <button class="choice" data-c="las-dos" aria-pressed="false">Las dos</button></div>
      <div id="r2" aria-live="polite"></div>`;
    stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    $(".choices", panel).onclick = e => {
      const b = e.target.closest(".choice"); if (!b) return;
      $$(".choice", panel).forEach(c => c.setAttribute("aria-pressed", c === b)); track("dos_obras_eleccion", b.dataset.c);
      const par = CONFIG.par, pairMsg = "Hola, Luciann. Me interesan las reproducciones de «Quebrantada» y «Restaurada» juntas. ¿Me puedes dar información?";
      const pairBtn = par.disponible && par.precio
        ? (par.enlacePago ? `<a class="btn gold" href="${esc(par.enlacePago)}" target="_blank" rel="noopener" data-pago="par">Ordenar las dos, ${money(par.precio)}</a>` : `<a class="btn gold" href="${waLink(pairMsg)}" target="_blank" rel="noopener" data-obra="par">Ordenar las dos, ${money(par.precio)}</a>`)
        : (CONFIG.whatsapp ? `<a class="btn ghost" href="${waLink(pairMsg)}" target="_blank" rel="noopener" data-obra="par">Preguntar por las dos juntas</a>` : "");
      $("#r2", panel).innerHTML = `<div class="fade-in"><p class="reflect">${DOS_OBRAS.eleccion[b.dataset.c]}</p>
        <p class="note">Lectura curatorial, no palabras de la artista.</p>
        <div class="ctas">
          <button class="btn gold" data-o="quebrantada">Ver «Quebrantada»</button>
          <button class="btn gold" data-o="restaurada">Ver «Restaurada»</button>
          <button class="btn ghost" data-pair-wall>Verlas juntas en mi pared</button>
          ${pairBtn}</div>
        ${par.disponible && par.precio ? (par.nota ? `<p class="note">${esc(par.nota)}</p>` : "") : '<p class="note">La compra de las dos en conjunto está por confirmar con la artista.</p>'}
        <button class="linkbtn" data-restart>Empezar de nuevo</button></div>`;
      $("#r2", panel).onclick = ev => {
        const o = ev.target.closest("[data-o]"); if (o) return openWork(o.dataset.o);
        if (ev.target.closest("[data-pair-wall]")) return Pared.pair();
        if (ev.target.closest("[data-restart]")) step1();
      };
    };
  }
  step1();
}

function renderArtista(){
  const voz = $("#voz"); if (!voz) return; const parts = [];
  if (CONFIG.declaracion) parts.push(`<blockquote class="quote">${esc(CONFIG.declaracion)}<cite>Declaración de Luciann Soto</cite></blockquote>`);
  if (CONFIG.declaracionAudio) parts.push(mediaHTML(CONFIG.declaracionAudio, "Declaración de Luciann Soto"));
  if (CONFIG.videoArtista) parts.push(mediaHTML(CONFIG.videoArtista, "Luciann Soto habla de su obra"));
  voz.innerHTML = parts.join(""); voz.hidden = !parts.length;
  const t = CONFIG.testimonios.filter(x => x.permiso && x.texto && x.nombre);
  $("#testimonios").innerHTML = t.length ? `<h3 class="more-title">Lo que dicen quienes tienen su obra</h3>` + t.map(x => `<div class="testi"><p>${esc(x.texto)}</p><span class="small">${esc(x.nombre)}</span></div>`).join("") : "";
}

function initQueVes(){
  const root = $("#que-ves"); if (!root) return;
  let i = 0;
  const art = $(".feel-art", root), choices = $(".choices", root), out = $(".feel-out", root);
  function paint(){
    const o = bySlug(QUE_VES.obras[i]);
    art.innerHTML = `<img src="${esc(o.imagen)}" alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy">
      <p class="small">Una obra de la colección. <button class="linkbtn" data-other>Probar con otra obra</button></p>`;
    choices.innerHTML = Object.keys(QUE_VES.emociones).map(k => `<button class="choice" aria-pressed="false">${k}</button>`).join("");
    out.innerHTML = "";
  }
  art.addEventListener("click", e => { if (e.target.closest("[data-other]")){ i = (i + 1) % QUE_VES.obras.length; paint(); } });
  choices.addEventListener("click", e => {
    const b = e.target.closest(".choice"); if (!b) return; const o = bySlug(QUE_VES.obras[i]);
    $$(".choice", choices).forEach(c => c.setAttribute("aria-pressed", c === b)); track("que_ves", b.textContent);
    out.innerHTML = `<div class="fade-in"><p class="reflect">${QUE_VES.emociones[b.textContent]}</p>
      <p class="note">Lectura curatorial, no palabras de la artista. Lo que tú sientes es igual de válido.</p>
      <p class="kicker">Tal vez esta obra tiene algo que decirte.</p>
      <div class="ctas"><button class="btn gold" data-o="${o.slug}">Conocer «${esc(o.titulo)}»</button></div></div>`;
  });
  out.addEventListener("click", e => { const b = e.target.closest("[data-o]"); if (b) openWork(b.dataset.o, $("img", art)); });
  paint();
}

function initPincelada(){
  const root = $("#pincelada"); if (!root) return;
  const P = CONFIG.pincelada, frame = $("#brushFrame"), img = $("#brushImg");
  frame.style.setProperty("--fx", P.foco.x * 100 + "%"); frame.style.setProperty("--fy", P.foco.y * 100 + "%");
  let showingFinal = false;
  function paint(){
    img.src = showingFinal ? P.terminada : P.proceso; img.alt = showingFinal ? P.terminadaAlt : P.procesoAlt;
    $("#brushCap").textContent = showingFinal ? `«${P.titulo}», terminada.` : `«${P.titulo}», en proceso. Su mano, el pincel y el color que todavía está fresco.`;
    const zoomed = frame.classList.contains("zoom");
    $("#brushCtas").innerHTML = (!showingFinal ? `<button class="btn gold" data-zoom aria-pressed="${zoomed}">${zoomed ? "Alejarse" : "Acercarse a la pincelada"}</button>` : "")
      + (P.terminada ? `<button class="btn ghost" data-final>${showingFinal ? "Volver al proceso" : "Ver la obra terminada"}</button>` : "");
    $("#brushNote").textContent = P.provisional ? "Imagen provisional tomada de una publicación; pendiente el archivo original." : "";
  }
  $("#brushCtas").addEventListener("click", e => {
    if (e.target.closest("[data-zoom]")){ frame.classList.toggle("zoom"); track("pincelada_acercar"); paint(); }
    if (e.target.closest("[data-final]")){
      frame.classList.remove("zoom"); img.classList.add("fade");
      setTimeout(() => { showingFinal = !showingFinal; paint(); img.onload = () => img.classList.remove("fade"); }, reduce ? 0 : 600);
    }
  });
  paint();
  $("#explore").innerHTML = CONFIG.exploracion.map(x => `<figure><img src="${esc(x.imagen)}" alt="${esc(x.alt)}" loading="lazy">
    <figcaption><b>${esc(x.titulo)}</b>${esc(x.tecnica)}${x.provisional ? " Imagen provisional." : ""}</figcaption></figure>`).join("");
}

/* ---------- Pruébala en tu pared ---------- */
const Pared = (() => {
  const wall = $("#wall"); if (!wall) return { show(){}, pair(){} };
  const photo = $("#wallPhoto"), SC = { a:{ x:.3, y:.78 }, b:{ x:.7, y:.78 }, unit:"in" };
  const toCm = (n, u) => u === "in" ? n * 2.54 : n, fromCm = (n, u) => u === "in" ? n / 2.54 : n;
  const fmt = n => (Math.round(n * 10) / 10).toString().replace(".", ",");
  let items = [], act = 0, url = null;
  const A = () => items[act];
  function make(slug, x, y){
    const el = document.createElement("img"); el.className = "wall-art"; el.draggable = false; el.tabIndex = 0;
    const tag = document.createElement("span"); tag.className = "wall-tag"; tag.hidden = true;
    wall.insertBefore(tag, $("#wallMeasure")); wall.insertBefore(el, tag);
    const it = { slug, x, y, pct: 30, cm: 0, label: "", el, tag };
    el.addEventListener("pointerdown", e => { e.stopPropagation(); act = items.indexOf(it); el.setPointerCapture(e.pointerId); drag.set(e.pointerId, { x:e.clientX, y:e.clientY, it }); sync(); });
    el.addEventListener("keydown", e => { const m = { ArrowLeft:[-.02, 0], ArrowRight:[.02, 0], ArrowUp:[0, -.02], ArrowDown:[0, .02] }[e.key];
      if (m){ e.preventDefault(); it.x = Math.max(0, Math.min(1, it.x + m[0])); it.y = Math.max(0, Math.min(1, it.y + m[1])); place(); } });
    el.addEventListener("focus", () => { act = items.indexOf(it); sync(); });
    items.push(it); setSlug(it, slug); return it;
  }
  function setSlug(it, slug, label){
    const o = bySlug(slug); it.slug = slug; it.el.src = o.imagen; it.el.alt = "Simulación de " + o.titulo + " en la pared";
    const vs = o.variantes.filter(v => v.ancho && v.alto), v = vs.find(x => variantLabel(x) === label) || vs[0];
    if (v){ it.cm = toCm(v.ancho, v.unidad || "in"); it.cmH = toCm(v.alto, v.unidad || "in"); it.label = variantLabel(v); } else { it.cm = 0; it.cmH = 0; it.label = ""; }
  }
  function pxPerCm(){
    const ref = toCm(+$("#refLen").value || 0, SC.unit), W = wall.clientWidth, H = wall.clientHeight;
    const L = Math.hypot((SC.b.x - SC.a.x) * W, (SC.b.y - SC.a.y) * H);
    const it = A(), hasSize = it && it.label;
    return (!photo.hidden && hasSize && ref > 0 && L > 10) ? L / ref : 0;
  }
  function place(){
    const W = wall.clientWidth, k = pxPerCm();
    items.forEach((it, i) => {
      const o = bySlug(it.slug), w = k ? it.cm * k : W * it.pct / 100;
      Object.assign(it.el.style, { width: w + "px", left: it.x * 100 + "%", top: it.y * 100 + "%" });
      it.el.classList.toggle("active", items.length > 1 && i === act);
      it.tag.hidden = !k;
      if (k){ it.tag.textContent = `${fmt(fromCm(it.cm, SC.unit))} × ${fmt(fromCm(it.cmH || it.cm / prop(o), SC.unit))} ${SC.unit === "in" ? "pulg" : "cm"}`;
        it.tag.style.left = it.x * 100 + "%"; it.tag.style.top = `calc(${it.y * 100}% + ${w / prop(o) / 2 + 8}px)`; }
    });
    $(".wall-size").hidden = !!k;
    const hasSize = !!(A() && A().label);
    if (!photo.hidden && hasSize) $("#wallMeasure").removeAttribute("hidden"); else $("#wallMeasure").setAttribute("hidden", "");
    $("#scalePanel .scale-row").hidden = !hasSize; $("#scalePanel > p.small").hidden = !hasSize;
    if (A()) $("#wallSize").value = A().pct;
    $("#scaleMsg").textContent = photo.hidden || !(A() && A().label) ? "" : (k ? "Listo: la obra se muestra a tamaño aproximado real. Puedes moverla." : "Escribe la medida del objeto para activar el tamaño real.");
    const W2 = wall.clientWidth, H2 = wall.clientHeight, s = (el, p) => { el.setAttribute("cx", p.x * W2); el.setAttribute("cy", p.y * H2); };
    s($("#mA"), SC.a); s($("#mB"), SC.b);
    const l = $("#mLine"); l.setAttribute("x1", SC.a.x * W2); l.setAttribute("y1", SC.a.y * H2); l.setAttribute("x2", SC.b.x * W2); l.setAttribute("y2", SC.b.y * H2);
  }
  function sizes(){
    const it = A(); if (!it) return; const o = bySlug(it.slug), vs = o.variantes.filter(v => v.ancho && v.alto);
    const row = $("#sizeRow");
    if (vs.length){
      row.innerHTML = `<span class="small">Tamaño de «${esc(o.titulo)}»</span>` + vs.map((v, i) => `<button class="chip" data-v="${i}" aria-pressed="${variantLabel(v) === it.label}">${esc(variantLabel(v))}</button>`).join("");
      row.onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; const v = vs[+b.dataset.v]; it.cm = toCm(v.ancho, v.unidad || "in"); it.cmH = toCm(v.alto, v.unidad || "in"); it.label = variantLabel(v); sizes(); place(); };
      const v = vs.find(x => variantLabel(x) === it.label);
      row.insertAdjacentHTML("beforeend", v ? `<span class="small" style="flex-basis:100%">${v.precio ? "Precio de este tamaño: " + money(v.precio) : "Precio por confirmar"}</span>` : "");
    } else {
      row.innerHTML = `<span class="small">Los tamaños de «${esc(o.titulo)}» aún no están confirmados. Cuando la artista los defina, aquí podrás elegirlos y ver la obra a escala real. Mientras tanto, ajusta el tamaño a mano.</span>`;
      row.onclick = null;
    }
  }
  function sync(){
    $("#roomPick").innerHTML = OBRAS.map(o => `<button aria-pressed="${A() && o.slug === A().slug}" data-w="${o.slug}" aria-label="${esc(o.titulo)}"><img src="${esc(o.imagen)}" alt="" loading="lazy"></button>`).join("");
    $("#wallAdd").hidden = items.length >= 3; $("#wallRemove").hidden = items.length < 2;
    sizes(); place();
  }
  /* Arrastre y pellizco */
  const drag = new Map(); let pinch = null;
  wall.addEventListener("pointerdown", e => drag.set(e.pointerId, { x:e.clientX, y:e.clientY }));
  addEventListener("pointerup", e => { drag.delete(e.pointerId); pinch = null; });
  addEventListener("pointercancel", e => { drag.delete(e.pointerId); pinch = null; });
  wall.addEventListener("pointermove", e => {
    const d = drag.get(e.pointerId); if (!d) return; const r = wall.getBoundingClientRect();
    if (drag.size >= 2 && A()){
      const [p, q] = [...drag.values()], dist = Math.hypot(p.x - q.x, p.y - q.y) || 1;
      if (!pinch) pinch = { d: dist, pct: A().pct }; A().pct = Math.max(10, Math.min(85, pinch.pct * dist / pinch.d));
    } else if (d.it){ d.it.x = Math.max(0, Math.min(1, d.it.x + (e.clientX - d.x) / r.width)); d.it.y = Math.max(0, Math.min(1, d.it.y + (e.clientY - d.y) / r.height)); }
    d.x = e.clientX; d.y = e.clientY; place();
  });
  ["mA", "mB"].forEach(id => { const c = $("#" + id), key = id === "mA" ? "a" : "b";
    c.addEventListener("pointerdown", e => { e.stopPropagation(); c.setPointerCapture(e.pointerId); c.dataset.drag = "1"; });
    c.addEventListener("pointermove", e => { if (!c.dataset.drag) return; const r = wall.getBoundingClientRect();
      SC[key] = { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; place(); });
    c.addEventListener("pointerup", () => delete c.dataset.drag); });
  /* Controles */
  $("#roomPick").addEventListener("click", e => { const b = e.target.closest("[data-w]"); if (b && A()){ setSlug(A(), b.dataset.w); sync(); } });
  $("#wallSize").addEventListener("input", e => { if (A()){ A().pct = +e.target.value; place(); } });
  $("#refLen").addEventListener("input", place);
  $(".unit").addEventListener("click", e => { const b = e.target.closest("[data-u]"); if (!b || b.dataset.u === SC.unit) return;
    const ref = $("#refLen"); if (+ref.value) ref.value = Math.round(fromCm(toCm(+ref.value, SC.unit), b.dataset.u) * 10) / 10;
    SC.unit = b.dataset.u; $$(".unit button").forEach(x => x.setAttribute("aria-pressed", x === b)); sizes(); place(); });
  $("#wallAdd").addEventListener("click", () => { const used = items.map(i => i.slug), next = OBRAS.find(o => !used.includes(o.slug)) || OBRAS[0];
    make(next.slug, Math.min(.85, A().x + .22), A().y); act = items.length - 1; sync(); });
  $("#wallRemove").addEventListener("click", () => { const it = items.splice(act, 1)[0]; it.el.remove(); it.tag.remove(); act = 0; sync(); });
  $("#wallFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); photo.src = url;
    photo.onload = () => { wall.style.aspectRatio = String(photo.naturalWidth / photo.naturalHeight); photo.hidden = false; $("#wallEmpty").hidden = true; wall.classList.add("photo");
      $("#wallReset").hidden = false; $("#scalePanel").hidden = false; track("pared_foto"); place(); };
    e.target.value = "";
  });
  $("#wallReset").addEventListener("click", () => { photo.hidden = true; photo.removeAttribute("src"); if (url){ URL.revokeObjectURL(url); url = null; }
    wall.style.aspectRatio = ""; $("#wallEmpty").hidden = false; wall.classList.remove("photo"); $("#wallReset").hidden = true; $("#scalePanel").hidden = true; $("#wallMeasure").setAttribute("hidden", ""); place(); });
  $("#roomBuy").addEventListener("click", () => { if (A()){ track("pared_ordenar", A().slug); openWork(A().slug, A().el, A().label); } });
  addEventListener("resize", place);
  function reset(list){ items.forEach(it => { it.el.remove(); it.tag.remove(); }); items = []; act = 0; list.forEach(([s, x, y, l]) => make(s, x, y)); list.forEach(([, , , l], i) => l && setSlug(items[i], items[i].slug, l)); sync(); }
  reset([[OBRAS[0].slug, .5, .4]]);
  const goTo = () => $("#espacio").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  return {
    show(slug, label){ reset([[slug, .5, .4, label]]); goTo(); },
    pair(){ reset([["quebrantada", .3, .4], ["restaurada", .7, .4]]); items.forEach(it => it.pct = 26); place(); goTo(); }
  };
})();

function renderConfianza(){
  const box = $("#seller"); if (!box) return;
  box.innerHTML = `<div><p class="big">Compras directamente a la artista.</p>
    <dl><dt>Artista</dt><dd>${esc(CONFIG.nombreLegal)}</dd><dt>Marca</dt><dd>${esc(CONFIG.marca)}</dd>
      ${CONFIG.ubicacion ? `<dt>Ubicación</dt><dd>${esc(CONFIG.ubicacion)}</dd>` : ""}
      <dt>Teléfono</dt><dd><a href="${telHref()}">${esc(CONFIG.telefono)}</a></dd>
      <dt>Correo</dt><dd><a href="mailto:${esc(CONFIG.correo)}">${esc(CONFIG.correo)}</a></dd>
      <dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(CONFIG.instagram)}/" target="_blank" rel="noopener">@${esc(CONFIG.instagram)}</a></dd></dl></div>
    <div class="ctas">${CONFIG.whatsapp ? `<a class="btn gold" href="${waLink("Hola, Luciann. Me interesa una reproducción de Soto’s Art.")}" target="_blank" rel="noopener">Escribir por WhatsApp</a>` : ""}
      <a class="btn ghost" href="${telHref()}">Llamar</a></div>`;
  const P = [["athMovil", "ATH Móvil Business"], ["stripe", "Tarjeta (Stripe Checkout)"], ["paypal", "PayPal Business"]];
  $("#paygrid").innerHTML = P.map(([k, n]) => `<div class="pay"><b>${n}</b><small>${CONFIG.metodosPago[k] ? "Disponible mediante enlace oficial" : "Aún no activado"}</small></div>`).join("");
  const pol = CONFIG.politicas, env = CONFIG.envio, pc = "Por confirmar con la artista.";
  const item = (t, b) => `<details><summary>${t}</summary><p>${b}</p></details>`;
  $("#policies").innerHTML = item("Envío y entrega", [env.destinos && "Destinos: " + esc(env.destinos), env.costo && "Costo: " + esc(env.costo), env.preparacion && "Preparación: " + esc(env.preparacion), env.entrega && "Entrega: " + esc(env.entrega), env.recogido && "Recogido: " + esc(env.recogido)].filter(Boolean).join("<br>") || pc)
    + item("Daños durante el envío", pol.danos ? esc(pol.danos) : pc)
    + item("Cancelaciones y devoluciones", [pol.cancelaciones, pol.devoluciones].filter(Boolean).map(esc).join("<br>") || pc)
    + item("Confirmación de tu orden", pol.confirmacion ? esc(pol.confirmacion) : "Si pagas en línea, la plataforma de pago te envía la confirmación. Si ordenas por WhatsApp o teléfono, Luciann confirma contigo el pedido directamente.")
    + item("Privacidad", pol.privacidad ? esc(pol.privacidad) : "Este sitio no pide crear cuenta ni guarda datos de pago. Las fotos que uses en “Pruébala en tu pared” no salen de tu dispositivo.");
  $("#faq").innerHTML = item("¿Compro la pintura original?", "No. Se ofrecen reproducciones de alta calidad de las pinturas originales. Si te interesa una obra original, pregúntale directamente a Luciann.")
    + item("¿Incluye marco?", pol.marco ? esc(pol.marco) : "Por confirmar. Las simulaciones muestran la obra sin marco.")
    + item("¿Los colores son idénticos a la pintura?", "Las reproducciones buscan fidelidad de color, pero pueden variar según tu pantalla y el proceso de impresión.")
    + item("¿Sirve como regalo?", "Sí, las obras se pueden regalar. Las opciones de envolver o enviar a otra persona están por confirmar.")
    + item("¿Necesito crear una cuenta?", "No. Puedes explorar y ordenar sin registrarte.");
}
function renderFooter(){
  const f = $("#footContact"); if (!f) return;
  f.innerHTML = `<em class="lema">${esc(CONFIG.lema)}</em><br>Teléfono: <a href="${telHref()}">${esc(CONFIG.telefono)}</a><br>Correo: <a href="mailto:${esc(CONFIG.correo)}">${esc(CONFIG.correo)}</a><br>Instagram: <a href="https://www.instagram.com/${esc(CONFIG.instagram)}/" target="_blank" rel="noopener">@${esc(CONFIG.instagram)}</a>${CONFIG.facebook ? ` &nbsp; <a href="${esc(CONFIG.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ""}`;
  $("#yr").textContent = new Date().getFullYear();
}

/* ---------- Arranque ---------- */
(function boot(){
  renderFooter();
  const page = document.body.dataset.obra;
  if (page){ const o = bySlug(page), m = $("#obraPage"); if (o && m){ renderFicha(o, m, { page: true }); track("ver_obra", o.slug); } return; }
  initUmbral(); renderSalon(); initRecorrido(); initQueVes(); initDosObras(); renderArtista(); initPincelada(); renderConfianza();
  const sheet = $("#sheet");
  sheet.addEventListener("close", () => { history.replaceState(null, "", location.pathname + location.search); document.title = "Soto’s Art | Galería de Luciann Soto"; });
  const params = new URLSearchParams(location.search), p = params.get("pared");
  if (p && bySlug(p)) setTimeout(() => Pared.show(p), 300);
  const m = location.hash.match(/^#\/obra\/([\w-]+)/); if (m && bySlug(m[1])) openWork(m[1]);
})();
