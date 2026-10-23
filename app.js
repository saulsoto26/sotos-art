/* Soto’s Art — lógica de la galería.
   Lee los datos de catalogo.js y los textos de textos-<idioma>.js; no requiere edición.
   tr("clave") devuelve el texto de la interfaz en el idioma de la página. */
"use strict";

/* ---------- Idioma, textos y rutas ---------- */
const TX = window.TEXTOS || {};
const IDIOMA = document.documentElement.lang || "es";
const RAIZ = document.documentElement.dataset.raiz || "";      // de esta página a la raíz del sitio
const INICIO = document.documentElement.dataset.inicio || "";  // de esta página a la portada del idioma
function tr(k, v){
  let s = (TX.ui || {})[k];
  if (s == null){ console.warn("Falta el texto:", k); s = ""; }
  return v ? s.replace(/\{(\w+)\}/g, (m, n) => n in v ? v[n] : m) : s;
}
(function aplicarTextos(){
  if (window.DATOS && typeof aplicarDatos === "function") aplicarDatos(window.DATOS, TX, IDIOMA);   // datos.json (herramienta de Luciann)
  const C = TX.contenido || {};
  Object.assign(CONFIG, { lema: C.lema || "", declaracion: C.declaracion || "",
    envio: { ...C.envio }, politicas: { ...C.politicas }, testimonios: C.testimonios || [], fotosProducto: C.fotosProducto || [] });
  CONFIG.par.nota = (C.par || {}).nota || "";
  Object.assign(CONFIG.pincelada, C.pincelada);
  CONFIG.exploracion.forEach((x, i) => Object.assign(x, (C.exploracion || [])[i]));
  OBRAS.forEach(o => Object.assign(o, { alt: "", descripcion: "", declaracion: "", subtitulo: "", inscripcion: "" }, (TX.obras || {})[o.slug]));
  /* Los archivos viven en la raíz del sitio: se ajusta su ruta desde esta página */
  const ruta = f => f && !/^(https?:|data:|\/)/.test(f) && /\.\w{2,4}$/.test(f) ? RAIZ + f : f;
  OBRAS.forEach(o => { o.imagen = ruta(o.imagen); o.video = ruta(o.video); [o.ambiente, o.enmarcada, ...(o.fotos || [])].forEach(x => { if (x) x.imagen = ruta(x.imagen); }); });
  const P = CONFIG.pincelada; P.proceso = ruta(P.proceso); P.terminada = ruta(P.terminada);
  CONFIG.exploracion.forEach(x => x.imagen = ruta(x.imagen));
  CONFIG.fotosProducto.forEach(x => x.imagen = ruta(x.imagen));
  CONFIG.declaracionAudio = ruta(CONFIG.declaracionAudio); CONFIG.videoArtista = ruta(CONFIG.videoArtista);
})();
const cita = x => tr("cita.abre") + x + tr("cita.cierra");                 // «Título» o “Title”
const val = x => (TX.valores || {})[x] || x;                               // “lienzo” → “canvas”
const vozArtista = () => !TX.aprobacion || TX.aprobacion.palabrasArtista !== false; // sus palabras solo si están aprobadas en este idioma
if (!vozArtista()){ CONFIG.declaracion = ""; OBRAS.forEach(o => o.declaracion = ""); }
const RECORRIDO = EXPERIENCIA.recorrido.map(slug => [slug, TX.recorrido[slug].titulo, TX.recorrido[slug].linea]);
const QUE_VES = { obras: EXPERIENCIA.queVes, emociones: TX.queVes };
const DOS_OBRAS = TX.dosObras;

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const money = n => new Intl.NumberFormat(tr("formato.region"), { style:"currency", currency:"USD" }).format(n);
const bySlug = s => OBRAS.find(o => o.slug === s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const telHref = () => "tel:+1" + CONFIG.telefono.replace(/\D/g, "");
const waLink = msg => CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}` : "";
const obraHref = slug => INICIO + tr("ruta.obras") + "/" + slug + "/";
const obraURL = o => (CONFIG.sitioURL || "") + IDIOMA + "/" + tr("ruta.obras") + "/" + o.slug + "/";
const prop = o => (o.w && o.h) ? o.w / o.h : .8;
const srcs = (o, sizes) => {          // la versión “-800” mide 800 px en su lado mayor
  const w8 = o.w >= o.h ? 800 : Math.round(800 * o.w / o.h);
  return Math.max(o.w, o.h) > 800 ? `src="${esc(o.imagen)}" srcset="${esc(o.imagen.replace(/\.jpg$/, "-800.jpg"))} ${w8}w, ${esc(o.imagen)} ${o.w}w" sizes="${sizes}"` : `src="${esc(o.imagen)}"`;
};
/* Capítulos (lectura curatorial): a cuál pertenece una obra y su nombre en este idioma */
/* Medidas de la pintura ORIGINAL, en la notación de su ficha (medida menor primero) y en centímetros */
function medidasOriginal(o){
  const m = o.medidas; if (!m || !m.ancho || !m.alto) return "";
  const a = Math.min(m.ancho, m.alto), b = Math.max(m.ancho, m.alto);
  if (m.unidad === "cm") return `${a} × ${b} cm`;
  const c = n => (Math.round(n * 25.4) / 10).toString().replace(".", tr("formato.decimal"));
  return `${a} × ${b} ${tr("unidad.pulg")} (${c(a)} × ${c(b)} cm)`;
}
/* Tamaño en pantalla a partir del original: la medida mayor da la escala y la FOTO da la forma (nunca se deforma la obra) */
function ladosCm(o, f){
  const m = o.medidas, c = m.unidad === "cm" ? 1 : 2.54, L = Math.max(m.ancho, m.alto) * c, p = prop(f || o);
  return p >= 1 ? [L, L / p] : [L * p, L];
}
const capDe = slug => EXPERIENCIA.capitulos.findIndex(c => c.obras.includes(slug));
const capNombre = k => (TX.capitulos || {})[(EXPERIENCIA.capitulos[k] || {}).clave] || "";
const listJoin = a => a.length > 1 ? a.slice(0, -1).join(", ") + " " + tr("lista.y") + " " + a.at(-1) : (a[0] || "");
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
function variantLabel(v){ return v.ancho && v.alto ? `${v.ancho} × ${v.alto} ${v.unidad === "cm" ? "cm" : tr("unidad.pulg")}` : (v.tamano || ""); }
function receiveText(v){
  if (!v) return tr("recibe.pendiente");
  const bits = [v.tipo ? tr("recibe.tipo", { x: val(v.tipo) }) : (v.material || variantLabel(v) || v.acabado) && tr("recibe.sinTipo"), v.material && tr("recibe.material", { x: val(v.material) }), variantLabel(v) && tr("recibe.tamano", { x: variantLabel(v) }), v.acabado && tr("recibe.acabado", { x: val(v.acabado) })].filter(Boolean);
  return bits.length ? tr("recibe.frase", { lista: bits.join(", ") }) : tr("recibe.detallesPendientes");
}
function renderFicha(o, mount, opts = {}){
  const vs = o.variantes, sizes = [...new Set(vs.map(variantLabel))], finishes = [...new Set(vs.map(v => v.acabado).filter(Boolean))];
  const falta = [!o.descripcion && tr("falta.descripcion"), !vs.length && tr("falta.tamanos"), !vs.length && tr("falta.precio")].filter(Boolean);
  const onWall = !!$("#wall");
  mount.innerHTML = `<div class="sheet-in">
    <figure class="sheet-fig">${opts.page ? "" : `<button class="close" aria-label="${tr("cerrar")}" data-close>×</button>`}
      <img ${srcs(o, "(min-width:900px) 50vw, 100vw")} alt="${esc(o.alt)}" style="--p:${prop(o)}">${o.enmarcada ? `<figcaption class="small">${tr("ficha.enmarcadaNota")}</figcaption>` : ""}</figure>
    <div class="sheet-body">
      <span class="sku">${esc(o.sku)}</span>
      ${opts.page ? `<h1 id="sheetTitle">${esc(o.titulo)}</h1>` : `<h2 id="sheetTitle">${esc(o.titulo)}</h2>`}
      ${o.subtitulo ? `<p class="subt">${esc(o.subtitulo)}</p>` : ""}
      ${o.tecnica || medidasOriginal(o) ? `<p class="original-linea"><span>${tr("ficha.originalFila")}</span>${[o.tecnica, medidasOriginal(o)].filter(Boolean).map(esc).join("<br>")}</p>` : ""}
      ${o.descripcion ? `<p class="lead">${esc(o.descripcion)}</p>` : ""}
      ${o.declaracion ? `<blockquote class="voice">${esc(o.declaracion)}<cite>Luciann Soto</cite></blockquote>` : ""}
      ${o.video ? mediaHTML(o.video, tr("media.obra", { titulo: o.titulo })) : ""}
      <p class="price" id="price"></p>
      <p class="receive" id="receive"></p>
      <div class="stock" data-stock="${o.slug}" hidden></div>
      ${o.provisional ? `<p class="small">${tr("ficha.provisional")}</p>` : ""}
      ${vs.length ? `<div class="opts">
        <label>${tr("ficha.tamano")}<select id="selT">${sizes.map(t => `<option ${t === opts.tamano ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
        ${finishes.length > 1 ? `<label>${tr("ficha.acabado")}<select id="selA">${finishes.map(t => `<option value="${esc(t)}">${esc(val(t))}</option>`).join("")}</select></label>` : ""}
      </div>` : ""}
      <div class="actions"><button class="btn dark" data-review data-slug="${o.slug}">${tr("ficha.ordenar")}</button>
        ${onWall ? `<button class="btn line" data-wall>${tr("ficha.pared")}</button>` : `<a class="btn line" href="${INICIO}?pared=${o.slug}#espacio">${tr("ficha.pared")}</a>`}
        ${$("#museo") ? `<button class="btn line" data-museo-obra>${tr("museo.nombre")}</button>` : ""}
</div>
      <div id="details"></div>
      <div id="review"></div>
      ${o.ambiente ? `<figure class="ambiente"><img src="${esc(o.ambiente.imagen)}" alt="${esc(tr("ficha.ambiente"))}: ${esc(cita(o.titulo))}" width="${o.ambiente.w}" height="${o.ambiente.h}" loading="lazy">
        <figcaption><b>${tr("ficha.ambiente")}</b> ${tr("ficha.ambienteNota")}</figcaption></figure>` : ""}
      ${(o.fotos || []).length ? `<section class="mas-fotos" aria-label="${esc(tr("fotos.titulo"))}"><h3>${tr("fotos.titulo")}</h3><div class="mas-fotos-rejilla">
        ${o.fotos.map((f, i) => `<figure><button type="button" class="mas-foto" data-foto="${i}" aria-label="${esc(tr("fotos.ver"))}: ${esc(tr("fotos." + f.tipo))}">
          <img src="${esc(f.imagen.replace(/\.jpg$/, "-800.jpg"))}" alt="${esc(fotoAlt(o, f))}" width="${f.w}" height="${f.h}" loading="lazy"></button>
          <figcaption><b>${tr("fotos." + f.tipo)}</b>${f.pie ? " " + esc(f.pie) : ""}${f.tipo === "espacio" ? `<span>${tr("fotos.espacioNota")}</span>` : ""}</figcaption></figure>`).join("")}
      </div></section>` : ""}
      <div class="sharebox"><p>${tr("compartir.pregunta")}</p><button class="btn line" data-share>${tr("compartir.boton")}</button></div>
      ${!opts.page && ALTERNOS.length ? `<p class="small ficha-idioma">${ALTERNOS.map(a => `<a href="${esc(a.url)}" hreflang="${a.idioma}" lang="${a.idioma}" data-cambio-idioma>${esc(a.ver)}</a>`).join(" · ")}</p>` : ""}
      ${falta.length ? `<p class="small pendline">${tr("falta.frase", { lista: listJoin(falta) })}</p>` : ""}
      ${opts.page ? `<p><a class="btn line" href="${INICIO}#obras">${tr("ficha.verColeccion")}</a></p>` : ""}
    </div></div>`;
  pintarStock(mount);
  const current = () => { const t = $("#selT", mount)?.value, a = $("#selA", mount)?.value;
    return vs.find(v => variantLabel(v) === t && (!a || v.acabado === a)) || vs.find(v => variantLabel(v) === t) || null; };
  const paint = () => { const v = current();
    $("#price", mount).innerHTML = v && v.precio ? money(v.precio) : `<span>${tr("ficha.altaCalidad")}</span><small>${tr("precio.pendiente")}</small>`;
    $("#receive", mount).textContent = receiveText(v) + (v && v.disponible === false ? " " + tr("ficha.noDisponible") : "");
    const env = CONFIG.envio, pol = CONFIG.politicas, pc = tr("pendiente");
    const metodos = [CONFIG.metodosPago.athMovil && "ATH Móvil Business", CONFIG.metodosPago.stripe && tr("pago.tarjeta"), CONFIG.metodosPago.paypal && "PayPal"].filter(Boolean);
    const rows = [
      [tr("ficha.obra"), `${cita(esc(o.titulo))}, ${esc(o.sku)}`],
      [tr("ficha.queRecibes"), tr("ficha.reproduccion") + (o.original ? " " + tr("ficha.original", { x: esc(o.original) }) : "")],
      [tr("ficha.originalFila"), [o.tecnica, medidasOriginal(o), o.anio].filter(Boolean).map(esc).join(" · ") || tr("ficha.originalPendiente")],
      [tr("ficha.tamano"), v ? esc(variantLabel(v)) : pc],
      [tr("ficha.materialAcabado"), v && (v.material || v.acabado) ? esc([v.tipo, v.material, v.acabado].filter(Boolean).map(val).join(", ")) : pc],
      [tr("ficha.marco"), pol.marco ? esc(pol.marco) : pc],
      [tr("ficha.precio"), v && v.precio ? money(v.precio) + " USD" : pc],
      [tr("ficha.envio"), env.costo ? esc(env.costo) : pc],
      [tr("ficha.preparacion"), env.preparacion ? esc(env.preparacion) : pc],
      [tr("ficha.entrega"), env.entrega ? esc(env.entrega) : pc],
      [tr("ficha.cancelacion"), pol.devoluciones || pol.cancelaciones ? `<a href="${INICIO}#comprar">${tr("ficha.verPoliticas")}</a>` : pc],
      ...(CONFIG.certificado ? [[tr("cert.titulo"), tr("cert.fila")]] : []),
      [tr("ficha.pago"), [metodos.length && tr("ficha.pagoEnLinea", { lista: listJoin(metodos) }), CONFIG.athMovilNumero && tr("ath.fila", { numero: esc(CONFIG.athMovilNumero) })].filter(Boolean).join("<br>") || tr("ficha.pagoDirecto")],
      [tr("ficha.artista"), `${esc(CONFIG.nombreLegal)}, <a href="${telHref()}">${esc(CONFIG.telefono)}</a>`]
    ];
    $("#details", mount).innerHTML = `<details class="soft"><summary>${tr("ficha.detalles")}</summary><dl class="spec">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join("")}</dl></details>`;
    $("#review", mount).innerHTML = ""; };
  paint(); $$("select", mount).forEach(s => s.addEventListener("change", paint));
  mount.onclick = e => {
    if (e.target === mount || e.target.closest("[data-close]")) return mount.close && mount.close();
    if (e.target.closest("[data-share]")) return share(o);
    const fb = e.target.closest("[data-foto]"); if (fb) return verFoto(o, +fb.dataset.foto);
    if (e.target.closest("[data-copiar-ath]")){ track("ath_numero_copiado", o.slug);
      return (navigator.clipboard ? navigator.clipboard.writeText(CONFIG.athMovilNumero.replace(/\D/g, "")) : Promise.reject()).then(() => toast(tr("ath.copiado")), () => toast(CONFIG.athMovilNumero)); }
    if (e.target.closest("[data-review]")){ track("clic_ordenar", o.slug); return review(o, current(), mount); }
    if (e.target.closest("[data-wall]")){ mount.close && mount.close(); return Pared.show(o.slug, variantLabel(current() || {})); }
    if (e.target.closest("[data-museo-obra]")){ mount.close && mount.close(); return Museo.abrir(o.slug); }
  };
}
function review(o, v, mount){
  const sel = v || {}, links = sel.enlaces || {};
  const pay = [["athMovil", tr("pago.conAth")], ["stripe", tr("pago.conTarjeta")], ["paypal", tr("pago.conPaypal")]]
    .filter(([k]) => links[k] && sel.disponible !== false)
    .map(([k, n]) => `<a class="btn gold" href="${esc(links[k])}" target="_blank" rel="noopener" data-pago="${k}" data-obra="${o.slug}">${n}</a>`).join("");
  const label = variantLabel(sel), encargo = stockDe(o.slug) === 0;
  const msg = tr("wa.obra", { titulo: o.titulo, sku: o.sku, detalle: (label ? tr("wa.tamano", { x: label }) : "") + (sel.acabado ? tr("wa.acabado", { x: val(sel.acabado) }) : "") }) + (encargo ? tr("wa.encargo") : "");
  const env = CONFIG.envio, envio = [env.costo, env.destinos && tr("orden.destino", { x: env.destinos }), env.entrega && tr("orden.entregaEn", { x: env.entrega })].filter(Boolean).join(", ");
  $("#review", mount).innerHTML = `<div class="review fade-in"><h3>${tr("orden.titulo")}</h3>
    <dl class="spec">
      <dt>${tr("ficha.obra")}</dt><dd>${cita(esc(o.titulo))}${label ? ", " + esc(label) : ""}${sel.acabado ? ", " + esc(val(sel.acabado)) : ""}</dd>
      <dt>${tr("ficha.precio")}</dt><dd>${sel.precio ? money(sel.precio) : tr("pendiente")}</dd>
      <dt>${tr("ficha.envio")}</dt><dd>${envio ? esc(envio) : tr("pendienteArtista")}</dd>
      ${env.recogido ? `<dt>${tr("orden.recogido")}</dt><dd>${esc(env.recogido)}</dd>` : ""}
    </dl>
    ${encargo ? `<p class="encargo-orden">${tr("inv.ordenEncargo")}</p>` : ""}
    <div class="actions">${pay}
      ${CONFIG.whatsapp ? `<a class="btn ${pay ? "line" : "gold"}" href="${waLink(msg)}" target="_blank" rel="noopener" data-obra="${o.slug}">${tr("orden.whatsapp")}</a>` : ""}
      <a class="btn line" href="${telHref()}" data-obra="${o.slug}">${tr("llamar")}</a></div>
    ${CONFIG.athMovilNumero ? `<div class="ath"><p class="ath-t">${tr("ath.titulo")}</p>
      <p class="ath-num"><span>${esc(CONFIG.athMovilNumero)}</span><button class="btn line" type="button" data-copiar-ath>${tr("ath.copiar")}</button></p>
      <ol><li>${tr("ath.paso1")}</li><li>${tr("ath.paso2", { numero: esc(CONFIG.athMovilNumero) })}</li><li>${tr("ath.paso3")}</li></ol>
      <p class="small">${tr("ath.soloPR")}</p></div>` : ""}
    ${CONFIG.certificado ? `<p class="cert-orden">${tr("cert.orden")}</p>` : ""}
    <p class="small">${tr("orden.vende", { nombre: esc(CONFIG.nombreLegal), marca: esc(CONFIG.marca) })} ${pay ? tr("orden.pagoOficial") : CONFIG.athMovilNumero ? "" : tr("orden.pagoInactivo")}
      ${CONFIG.politicas.confirmacion ? esc(CONFIG.politicas.confirmacion) + " " : ""}<a href="${INICIO}#comprar">${tr("orden.politicas")}</a></p></div>`;
  $("#review", mount).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
}
/* ---------- Compartir: código QR, WhatsApp, copiar enlace y opciones del teléfono ---------- */
const datosObra = o => ({ id: o.slug, url: obraURL(o), titulo: cita(o.titulo), nombre: o.titulo,
  texto: tr("compartir.texto", { titulo: o.titulo }), pie: tr("compartir.qrObra") });
const datosGaleria = () => ({ id: "galeria", url: (CONFIG.sitioURL || location.origin + "/") + IDIOMA + "/", titulo: "Soto’s Art", nombre: tr("compartir.galeriaNombre"),
  texto: tr("compartir.textoGaleria"), pie: tr("compartir.qrGaleria") });
function share(o){ Compartir.abrir(datosObra(o)); }
const Compartir = (() => {
  let dlg = null, actual = null, cargando = null;
  const cargarQR = () => window.qrcode ? Promise.resolve() : (cargando = cargando || new Promise((ok, no) => {
    const sc = document.createElement("script"); sc.src = RAIZ + "qr.js"; sc.onload = ok; sc.onerror = () => { cargando = null; no(); }; document.head.appendChild(sc); }));
  const matriz = url => { const q = qrcode(0, "M"); q.addData(url); q.make(); return q; };
  function svg(url, etiqueta){
    const q = matriz(url), n = q.getModuleCount(), m = 4; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" role="img" aria-label="${esc(etiqueta)}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#14100C"/></svg>`;
  }
  /* Imagen para guardar o enviar: el código con el nombre de la obra, lista para imprimir o reenviar */
  function imagen(dt){
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), q = matriz(dt.url), n = q.getModuleCount(), lado = 720, k = lado / n, x0 = (W - lado) / 2, y0 = 250;
    g.fillStyle = "#F7F1E6"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff"; g.fillRect(x0 - 50, y0 - 50, lado + 100, lado + 100);
    g.fillStyle = "#14100C";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(Math.floor(x0 + c * k), Math.floor(y0 + r * k), Math.ceil(k), Math.ceil(k));
    g.textAlign = "center"; g.fillStyle = "#8A6A3B"; g.font = "italic 54px 'Bodoni Moda', Georgia, serif"; g.fillText("Soto’s Art", W / 2, 150);
    g.fillStyle = "#1E1812"; g.font = "italic 60px 'Bodoni Moda', Georgia, serif"; g.fillText(dt.titulo === "Soto’s Art" ? dt.nombre : dt.titulo, W / 2, y0 + lado + 150, W - 120);
    g.fillStyle = "#5A4C3E"; g.font = "36px Karla, Helvetica, Arial, sans-serif"; g.fillText(dt.pie, W / 2, y0 + lado + 215, W - 120);
    g.font = "28px Karla, Helvetica, Arial, sans-serif"; g.fillStyle = "#8C7E6E"; g.fillText(dt.url.replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, H - 70, W - 120);
    return cv;
  }
  function crear(){
    dlg = document.createElement("dialog"); dlg.className = "compartir"; dlg.setAttribute("aria-labelledby", "compTitulo");
    dlg.innerHTML = `<button class="close" data-cerrar aria-label="${esc(tr("cerrar"))}">×</button>
      <h2 id="compTitulo">${esc(tr("compartir.titulo"))}</h2><p class="comp-que"></p>
      <figure class="comp-qr"><div class="comp-codigo" aria-live="polite"></div><figcaption>${esc(tr("compartir.escanea"))}</figcaption></figure>
      <div class="comp-acciones">
        <a class="btn gold" data-accion="whatsapp" target="_blank" rel="noopener">${esc(tr("compartir.whatsapp"))}</a>
        <button class="btn line" data-accion="copiar">${esc(tr("compartir.copiar"))}</button>
        ${navigator.share ? `<button class="btn line" data-accion="nativo">${esc(tr("compartir.mas"))}</button>` : ""}
        <button class="linkbtn" data-accion="guardar">${esc(tr("compartir.guardar"))}</button>
      </div>
      <p class="comp-url"><input readonly aria-label="${esc(tr("compartir.enlace"))}"></p>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", e => {
      if (e.target === dlg || e.target.closest("[data-cerrar]")) return dlg.close();
      const b = e.target.closest("[data-accion]"); if (!b || !actual) return;
      const a = b.dataset.accion; track("compartir_" + a, actual.id);
      if (a === "copiar"){
        const ok = () => toast(tr("compartir.copiado"));
        (navigator.clipboard ? navigator.clipboard.writeText(actual.url) : Promise.reject()).then(ok, () => {
          const inp = $(".comp-url input", dlg); inp.focus(); inp.select();
          try { document.execCommand("copy") ? ok() : toast(tr("compartir.error")); } catch (er) { toast(tr("compartir.error")); } });
      }
      if (a === "nativo") navigator.share({ title: actual.nombre + " | Soto’s Art", text: actual.texto, url: actual.url }).catch(() => {});
      if (a === "guardar") cargarQR().then(() => imagen(actual).toBlob(bl => {
        const nombre = `sotos-art-qr-${actual.id}.png`, f = new File([bl], nombre, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: actual.nombre }).catch(() => {});
        const u = URL.createObjectURL(bl), l = document.createElement("a"); l.href = u; l.download = nombre; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
      }, "image/png"), () => toast(tr("compartir.qrError")));
    });
  }
  function abrir(dt){
    if (!dlg) crear(); actual = dt;
    $(".comp-que", dlg).textContent = dt.titulo === "Soto’s Art" ? dt.nombre : dt.titulo;
    $("[data-accion=whatsapp]", dlg).href = "https://wa.me/?text=" + encodeURIComponent(dt.texto + "\n" + dt.url);
    $(".comp-url input", dlg).value = dt.url;
    const box = $(".comp-codigo", dlg); box.innerHTML = "";
    cargarQR().then(() => { if (actual === dt) box.innerHTML = svg(dt.url, tr("compartir.qrAlt", { titulo: dt.nombre })); }, () => { box.innerHTML = `<p class="small">${esc(tr("compartir.qrError"))}</p>`; });
    if (!dlg.open) dlg.showModal(); track("compartir", dt.id);
  }
  return { abrir };
})();
function mediaHTML(src, title){
  if (/^https:\/\/(www\.)?instagram\.com\//i.test(src)) return `<p><a class="btn line" href="${esc(src)}" target="_blank" rel="noopener">${tr("media.instagram")}</a></p>`;
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
  { id: "esperanza", palabra: tr("umbral.esperanza"), forma: "brote", colores: ["#B9D29A", "#E3EBC9", "#E0C48E", "#8DB27A", "#9FC48A"] },
  { id: "restauracion", palabra: tr("umbral.restauracion"), forma: "vasija", colores: ["#EEE6D6", "#E0C48E", "#E8D6B0", "#FFD98A", "#E8D6B0"] },
  { id: "fortaleza", palabra: tr("umbral.fortaleza"), forma: "raiz", colores: ["#D9B36F", "#EEE6D6", "#E0C48E", "#FFD98A", "#C9A46A"] },
  { id: "vida", palabra: tr("umbral.vida"), forma: "flor", colores: ["#5FC3DD", "#A7E3F0", "#E0C48E", "#F2D3A0", "#7FD0E4"] }
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
  if (reduce || CAMBIO_IDIOMA) return;                  // composición fija (SVG) + texto + botones
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
    if (symbolIdx < 0){ word.innerHTML = `<span class="hint">${tr("umbral.toca")}</span>`; word.classList.add("on"); } }
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
    word.innerHTML = `<b>${S.palabra}</b><a href="#obras">${tr("umbral.encuentrala")}</a>`; word.classList.add("on");
    hit.setAttribute("aria-label", tr("umbral.volver", { palabra: S.palabra }));
    track("umbral_simbolo", S.id); placeHit();
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
    word.classList.remove("on"); hit.setAttribute("aria-label", tr("umbral.tocar")); placeHit();
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
  $(".rec-dots", sec).innerHTML = RECORRIDO.map((r, i) => `<button aria-label="${tr("museo.contador", { n: i + 1, total: RECORRIDO.length })}: ${esc(bySlug(r[0]).titulo)}"></button>`).join("");
  const dots = $$(".rec-dots button", sec), caps = $(".rec-caps", sec);
  if (caps){
    caps.innerHTML = EXPERIENCIA.capitulos.map((c, k) => `<button data-cap="${k}">${ROM[k]}. ${esc(capNombre(k))}</button>`).join("");
    caps.addEventListener("click", e => { const b = e.target.closest("[data-cap]"); if (b){ track("recorrido_capitulo_elegido", b.dataset.cap); go(RECORRIDO.findIndex(r => r[0] === EXPERIENCIA.capitulos[+b.dataset.cap].obras[0])); } });
  }
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
      const k = capDe(slug);
      $(".rec-num", sec).innerHTML = `<b>${ROM[k]}</b>${esc(capNombre(k))}`;
      if (caps) $$("[data-cap]", caps).forEach(b => b.setAttribute("aria-current", +b.dataset.cap === k)); $("h3", sec).textContent = phrase; $(".rec-line", sec).textContent = line;
      $(".rec-title", sec).textContent = cita(o.titulo);
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
    return `<a class="work" href="${obraHref(o.slug)}" data-slug="${o.slug}"><div class="frame"><img ${srcs(o, "(min-width:900px) 30vw, 50vw")} alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy" decoding="async"></div>
      <h3>${esc(o.titulo)}</h3><span class="meta">${p ? tr("precio.desde", { precio: money(p) }) : tr("precio.pendiente")}</span></a>`;
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
  const fig = (o, cls = "") => `<figure class="${cls}"><img ${srcs(o, "(min-width:900px) 340px, 45vw")} alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy"><figcaption>${cita(esc(o.titulo))}</figcaption></figure>`;
  const seam = `<svg class="seam" viewBox="0 0 14 200" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M7 0 L4 28 L10 52 L5 84 L9 118 L4 148 L9 176 L7 200"/></svg>`;
  const stage = $(".two-stage", root), panel = $(".two-panel", root);
  function step1(){
    stage.className = "two-stage"; stage.innerHTML = fig(Q);
    panel.innerHTML = `<h3>${tr("dos.pregunta1")}</h3>
      <div class="choices" role="group" aria-label="${tr("dos.sentimiento")}">${Object.entries(DOS_OBRAS.sentimientos).map(([k, x]) => `<button class="choice" data-k="${k}" aria-pressed="false">${x.etiqueta}</button>`).join("")}</div>
      <div id="r1" aria-live="polite"></div>`;
    $(".choices", panel).onclick = e => {
      const b = e.target.closest(".choice"); if (!b) return;
      $$(".choice", panel).forEach(c => c.setAttribute("aria-pressed", c === b)); track("dos_obras_sentimiento", b.dataset.k);
      $("#r1", panel).innerHTML = `<div class="fade-in"><p class="reflect">${DOS_OBRAS.sentimientos[b.dataset.k].texto}</p>
        <p class="note">${tr("nota.curatorial")}</p>
        <div class="ctas"><button class="btn gold" data-step2>${tr("dos.revelar")}</button></div></div>`;
      $("[data-step2]", panel).onclick = step2;
    };
  }
  function step2(){
    stage.className = "two-stage both"; stage.innerHTML = fig(Q) + `<div class="puente" aria-hidden="true">${seam}<span class="luz"></span></div>` + fig(R, "reveal");
    panel.innerHTML = `<h3>${tr("dos.pregunta2")}</h3>
      <div class="choices" role="group" aria-label="${tr("ficha.obra")}">
        <button class="choice" data-c="quebrantada" aria-pressed="false">${esc(Q.titulo)}</button>
        <button class="choice" data-c="restaurada" aria-pressed="false">${esc(R.titulo)}</button>
        <button class="choice" data-c="las-dos" aria-pressed="false">${tr("dos.lasDos")}</button></div>
      <div id="r2" aria-live="polite"></div>`;
    stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    $(".choices", panel).onclick = e => {
      const b = e.target.closest(".choice"); if (!b) return;
      $$(".choice", panel).forEach(c => c.setAttribute("aria-pressed", c === b)); track("dos_obras_eleccion", b.dataset.c);
      const par = CONFIG.par, pairMsg = tr("wa.par");
      const pairBtn = par.disponible && par.precio
        ? (par.enlacePago ? `<a class="btn gold" href="${esc(par.enlacePago)}" target="_blank" rel="noopener" data-pago="par">${tr("dos.ordenarPar", { precio: money(par.precio) })}</a>` : `<a class="btn gold" href="${waLink(pairMsg)}" target="_blank" rel="noopener" data-obra="par">${tr("dos.ordenarPar", { precio: money(par.precio) })}</a>`)
        : "";   /* no se presentan como producto conjunto hasta que Luciann lo confirme */
      $("#r2", panel).innerHTML = `<div class="fade-in"><p class="reflect">${DOS_OBRAS.eleccion[b.dataset.c]}</p>
        <p class="note">${tr("nota.curatorial")}</p>
        <div class="ctas">
          <button class="btn gold" data-o="quebrantada">${tr("dos.ver", { titulo: esc(Q.titulo) })}</button>
          <button class="btn gold" data-o="restaurada">${tr("dos.ver", { titulo: esc(R.titulo) })}</button>
          <button class="btn ghost" data-pair-wall>${tr("dos.parPared")}</button>
          ${pairBtn}</div>
        ${par.disponible && par.precio && par.nota ? `<p class="note">${esc(par.nota)}</p>` : ""}
        <button class="linkbtn" data-restart>${tr("dos.reiniciar")}</button></div>`;
      $("#r2", panel).onclick = ev => {
        const o = ev.target.closest("[data-o]"); if (o) return openWork(o.dataset.o);
        if (ev.target.closest("[data-pair-wall]")) return Pared.pair();
        if (ev.target.closest("[data-restart]")) step1();
      };
    };
  }
  step1();
}

/* La voz de Luciann: su declaración literal. Si en este idioma su traducción no está aprobada,
   se muestra el original en español con una nota (nunca una traducción sin aprobar). */
function renderVoz(){
  const root = $("#voz-luciann"); if (!root) return;
  const propia = vozArtista() && CONFIG.declaracion, texto = propia ? CONFIG.declaracion : DECLARACION_ORIGINAL, lang = propia ? IDIOMA : "es";
  const frases = texto.match(/[^.]+\./g) || [texto], frase = (frases[DECLARACION_DESTACADA] || frases.at(-1)).trim();
  $("#vozFrase").innerHTML = `<p lang="${lang}">${esc(frase)}</p>`;
  $("#vozTexto").innerHTML = `<p lang="${lang}">${esc(texto)}</p>`;
  const nota = !propia && tr("voz.original"); $("#vozOrig").textContent = nota || ""; $("#vozOrig").hidden = !nota;
  $("#vozAudio").innerHTML = CONFIG.declaracionAudio ? `<p class="kicker">${tr("voz.escuchar")}</p>` + mediaHTML(CONFIG.declaracionAudio, tr("artista.declaracion")) : "";
  $(".voz-completa", root).addEventListener("toggle", e => e.target.open && track("voz_declaracion_completa"));
}

function renderArtista(){
  const voz = $("#voz"); if (!voz) return; const parts = [];
  if (CONFIG.videoArtista) parts.push(mediaHTML(CONFIG.videoArtista, tr("media.artista")));
  voz.innerHTML = parts.join(""); voz.hidden = !parts.length;
  const t = CONFIG.testimonios.filter(x => x.permiso && x.texto && x.nombre);
  $("#testimonios").innerHTML = t.length ? `<h3 class="more-title">${tr("artista.testimonios")}</h3>` + t.map(x => `<div class="testi"><p>${esc(x.texto)}</p><span class="small">${esc(x.nombre)}</span></div>`).join("") : "";
}

function initQueVes(){
  const root = $("#que-ves"); if (!root) return;
  let i = 0;
  const art = $(".feel-art", root), choices = $(".choices", root), out = $(".feel-out", root);
  function paint(){
    const o = bySlug(QUE_VES.obras[i]);
    art.innerHTML = `<img ${srcs(o, "(min-width:900px) 45vw, 92vw")} alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" loading="lazy">
      <p class="small">${tr("queVes.unaObra")} <button class="linkbtn" data-other>${tr("queVes.otra")}</button></p>`;
    choices.innerHTML = Object.entries(QUE_VES.emociones).map(([k, x]) => `<button class="choice" data-k="${k}" aria-pressed="false">${x.etiqueta}</button>`).join("");
    out.innerHTML = "";
  }
  art.addEventListener("click", e => { if (e.target.closest("[data-other]")){ i = (i + 1) % QUE_VES.obras.length; paint(); } });
  choices.addEventListener("click", e => {
    const b = e.target.closest(".choice"); if (!b) return; const o = bySlug(QUE_VES.obras[i]);
    $$(".choice", choices).forEach(c => c.setAttribute("aria-pressed", c === b)); track("que_ves", b.dataset.k);
    out.innerHTML = `<div class="fade-in"><p class="reflect">${QUE_VES.emociones[b.dataset.k].texto}</p>
      <p class="note">${tr("queVes.nota")}</p>
      <p class="kicker">${tr("queVes.invitacion")}</p>
      <div class="ctas"><button class="btn gold" data-o="${o.slug}">${tr("queVes.conocer", { titulo: esc(o.titulo) })}</button></div></div>`;
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
    $("#brushCap").textContent = showingFinal ? tr("pincelada.terminada", { titulo: P.titulo }) : tr("pincelada.proceso", { titulo: P.titulo });
    const zoomed = frame.classList.contains("zoom");
    $("#brushCtas").innerHTML = (!showingFinal ? `<button class="btn gold" data-zoom aria-pressed="${zoomed}">${zoomed ? tr("pincelada.alejarse") : tr("pincelada.acercarse")}</button>` : "")
      + (P.terminada ? `<button class="btn ghost" data-final>${showingFinal ? tr("pincelada.volver") : tr("pincelada.verTerminada")}</button>` : "");
    $("#brushNote").textContent = P.provisional ? tr("pincelada.provisional") : "";
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
    <figcaption><b>${esc(x.titulo)}</b>${esc(x.tecnica)}${x.provisional ? " " + tr("explora.provisional") : ""}</figcaption></figure>`).join("");
}

/* ---------- Pruébala en tu pared ---------- */
const Pared = (() => {
  const wall = $("#wall"); if (!wall) return { show(){}, pair(){}, actual(){ return ""; } };
  const photo = $("#wallPhoto"), SC = { a:{ x:.3, y:.78 }, b:{ x:.7, y:.78 }, unit:"in" };
  const toCm = (n, u) => u === "in" ? n * 2.54 : n, fromCm = (n, u) => u === "in" ? n / 2.54 : n;
  const fmt = n => (Math.round(n * 10) / 10).toString().replace(".", tr("formato.decimal"));
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
    const o = bySlug(slug); it.slug = slug; it.el.src = o.imagen; it.el.alt = tr("pared.simulacion", { titulo: o.titulo });
    const vs = o.variantes.filter(v => v.ancho && v.alto), v = vs.find(x => variantLabel(x) === label) || vs[0];
    it.ref = false;
    if (v){ it.cm = toCm(v.ancho, v.unidad || "in"); it.cmH = toCm(v.alto, v.unidad || "in"); it.label = variantLabel(v); }
    else if (medidasOriginal(o)){ [it.cm, it.cmH] = ladosCm(o); it.label = "ref"; it.ref = true; }
    else { it.cm = 0; it.cmH = 0; it.label = ""; }
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
      if (k && it.ref){ it.tag.textContent = `${medidasOriginal(o)} · ${tr("pared.refCorta")}`; it.tag.style.left = it.x * 100 + "%"; it.tag.style.top = `calc(${it.y * 100}% + ${w / prop(o) / 2 + 8}px)`; }
      else if (k){ it.tag.textContent = `${fmt(fromCm(it.cm, SC.unit))} × ${fmt(fromCm(it.cmH || it.cm / prop(o), SC.unit))} ${SC.unit === "in" ? tr("unidad.pulg") : "cm"}`;
        it.tag.style.left = it.x * 100 + "%"; it.tag.style.top = `calc(${it.y * 100}% + ${w / prop(o) / 2 + 8}px)`; }
    });
    $(".wall-size").hidden = !!k;
    const hasSize = !!(A() && A().label);
    if (!photo.hidden && hasSize) $("#wallMeasure").removeAttribute("hidden"); else $("#wallMeasure").setAttribute("hidden", "");
    $("#scalePanel .scale-row").hidden = !hasSize; $("#scalePanel > p.small").hidden = !hasSize;
    if (A()) $("#wallSize").value = A().pct;
    $("#scaleMsg").textContent = photo.hidden || !(A() && A().label) ? "" : (k ? tr("pared.listo") : tr("pared.escribeMedida"));
    const W2 = wall.clientWidth, H2 = wall.clientHeight, s = (el, p) => { el.setAttribute("cx", p.x * W2); el.setAttribute("cy", p.y * H2); };
    s($("#mA"), SC.a); s($("#mB"), SC.b);
    const l = $("#mLine"); l.setAttribute("x1", SC.a.x * W2); l.setAttribute("y1", SC.a.y * H2); l.setAttribute("x2", SC.b.x * W2); l.setAttribute("y2", SC.b.y * H2);
  }
  function sizes(){
    const it = A(); if (!it) return; const o = bySlug(it.slug), vs = o.variantes.filter(v => v.ancho && v.alto);
    const row = $("#sizeRow");
    if (vs.length){
      row.innerHTML = `<span class="small">${tr("pared.tamanoDe", { titulo: esc(o.titulo) })}</span>` + vs.map((v, i) => `<button class="chip" data-v="${i}" aria-pressed="${variantLabel(v) === it.label}">${esc(variantLabel(v))}</button>`).join("");
      row.onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; const v = vs[+b.dataset.v]; it.cm = toCm(v.ancho, v.unidad || "in"); it.cmH = toCm(v.alto, v.unidad || "in"); it.label = variantLabel(v); sizes(); place(); };
      const v = vs.find(x => variantLabel(x) === it.label);
      row.insertAdjacentHTML("beforeend", v ? `<span class="small" style="flex-basis:100%">${v.precio ? tr("pared.precioTamano", { precio: money(v.precio) }) : tr("precio.pendiente")}</span>` : "");
    } else {
      row.innerHTML = medidasOriginal(o)
        ? `<button class="chip" aria-pressed="true" disabled>${tr("pared.refChip")}: ${esc(medidasOriginal(o))}</button><span class="small" style="flex-basis:100%">${tr("pared.refNota")}</span>`
        : `<span class="small">${tr("pared.sinTamanos", { titulo: esc(o.titulo) })}</span>`;
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
  $("#roomBuy").addEventListener("click", () => { if (A()){ track("pared_ordenar", A().slug); openWork(A().slug, A().el, A().ref ? "" : A().label); } });
  addEventListener("resize", place);
  function reset(list){ items.forEach(it => { it.el.remove(); it.tag.remove(); }); items = []; act = 0; list.forEach(([s, x, y, l]) => make(s, x, y)); list.forEach(([, , , l], i) => l && setSlug(items[i], items[i].slug, l)); sync(); }
  reset([[OBRAS[0].slug, .5, .4]]);
  const goTo = () => $("#espacio").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  return {
    show(slug, label){ reset([[slug, .5, .4, label]]); goTo(); },
    actual(){ return A() ? A().slug : ""; },
    pair(){ reset([["quebrantada", .3, .4], ["restaurada", .7, .4]]); items.forEach(it => it.pct = 26); place(); goTo(); }
  };
})();

function renderConfianza(){
  const box = $("#seller"); if (!box) return;
  box.innerHTML = `<div><p class="big">${tr("confianza.titulo")}</p>
    <dl><dt>${tr("ficha.artista")}</dt><dd>${esc(CONFIG.nombreLegal)}</dd><dt>${tr("confianza.marca")}</dt><dd>${esc(CONFIG.marca)}</dd>
      ${CONFIG.ubicacion ? `<dt>${tr("confianza.ubicacion")}</dt><dd>${esc(CONFIG.ubicacion)}</dd>` : ""}
      <dt>${tr("confianza.telefono")}</dt><dd><a href="${telHref()}">${esc(CONFIG.telefono)}</a></dd>
      <dt>${tr("confianza.correo")}</dt><dd><a href="mailto:${esc(CONFIG.correo)}">${esc(CONFIG.correo)}</a></dd>
      <dt>Instagram</dt><dd><a href="https://www.instagram.com/${esc(CONFIG.instagram)}/" target="_blank" rel="noopener">@${esc(CONFIG.instagram)}</a></dd></dl></div>
    <div class="ctas">${CONFIG.whatsapp ? `<a class="btn gold" href="${waLink(tr("wa.general"))}" target="_blank" rel="noopener">${tr("confianza.whatsapp")}</a>` : ""}
      <a class="btn ghost" href="${telHref()}">${tr("llamar")}</a></div>`;
  const P = [["athMovil", "ATH Móvil Business"], ["stripe", tr("pago.stripe")], ["paypal", "PayPal Business"]];
  $("#paygrid").innerHTML = P.map(([k, n]) => k === "athMovil" && CONFIG.athMovilNumero && !CONFIG.metodosPago.athMovil
      ? `<div class="pay"><b>ATH Móvil</b><small>${tr("ath.grid", { numero: esc(CONFIG.athMovilNumero) })}</small></div>`
      : `<div class="pay"><b>${n}</b><small>${CONFIG.metodosPago[k] ? tr("pago.disponible") : tr("pago.inactivo")}</small></div>`).join("");
  const cert = $("#certificado");
  if (cert) cert.outerHTML = CONFIG.certificado ? `<div class="certificado" id="certificado"><svg class="cert-sello" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="24" cy="20" r="9.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M19.5 20.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 31l-3 12 6-3 4 5 1-12M32 31l3 12-6-3-4 5-1-12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <div><h3>${tr("cert.titulo")}</h3><p>${tr("cert.texto")}</p><p class="small">${tr("cert.derechos")}</p></div></div>` : "";
  const pol = CONFIG.politicas, env = CONFIG.envio, pc = tr("pendienteArtista") + ".";
  const item = (t, b) => `<details><summary>${t}</summary><p>${b}</p></details>`;
  $("#policies").innerHTML = item(tr("pol.envio"), [env.destinos && tr("pol.destinos") + " " + esc(env.destinos), env.costo && tr("pol.costo") + " " + esc(env.costo), env.preparacion && tr("pol.preparacion") + " " + esc(env.preparacion), env.entrega && tr("pol.entrega") + " " + esc(env.entrega), env.recogido && tr("pol.recogido") + " " + esc(env.recogido)].filter(Boolean).join("<br>") || pc)
    + item(tr("pol.danos"), pol.danos ? esc(pol.danos) : pc)
    + item(tr("pol.devoluciones"), [pol.cancelaciones, pol.devoluciones].filter(Boolean).map(esc).join("<br>") || pc)
    + item(tr("pol.confirmacion"), pol.confirmacion ? esc(pol.confirmacion) : tr("pol.confirmacionTexto"))
    + item(tr("pol.privacidad"), pol.privacidad ? esc(pol.privacidad) : tr("pol.privacidadTexto"));
  $("#faq").innerHTML = item(tr("faq.original"), tr("faq.originalR"))
    + item(tr("faq.marco"), pol.marco ? esc(pol.marco) : tr("faq.marcoR"))
    + item(tr("faq.colores"), tr("faq.coloresR"))
    + item(tr("faq.regalo"), tr("faq.regaloR"))
    + (CONFIG.certificado ? item(tr("faq.certificado"), tr("faq.certificadoR")) : "")
    + item(tr("faq.cuenta"), tr("faq.cuentaR"));
}
function renderFooter(){
  const f = $("#footContact"); if (!f) return;
  f.innerHTML = `<em class="lema">${esc(CONFIG.lema)}</em><br>${tr("pie.telefono")} <a href="${telHref()}">${esc(CONFIG.telefono)}</a><br>${tr("pie.correo")} <a href="mailto:${esc(CONFIG.correo)}">${esc(CONFIG.correo)}</a><br>Instagram: <a href="https://www.instagram.com/${esc(CONFIG.instagram)}/" target="_blank" rel="noopener">@${esc(CONFIG.instagram)}</a>${CONFIG.facebook ? ` &nbsp; <a href="${esc(CONFIG.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ""}`;
  $("#yr").textContent = new Date().getFullYear();
  f.insertAdjacentHTML("afterend", `<p><button class="btn line pie-compartir" type="button" data-compartir-galeria>${tr("compartir.galeria")}</button></p>`);
  /* Encabezado y pie: en una página de obra comparten esa obra; en la portada, la galería */
  $$("[data-compartir-galeria]").forEach(b => b.addEventListener("click", () => Compartir.abrir(document.body.dataset.obra ? datosObra(bySlug(document.body.dataset.obra)) : datosGaleria())));
}

/* ---------- Idioma: selector, preferencia y sugerencia ---------- */
const CLAVE_IDIOMA = "sa-idioma", CLAVE_SUGERENCIA = "sa-sugerencia-idioma";
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leerClave = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const CAMBIO_IDIOMA = (() => { try { const v = sessionStorage.getItem("sa-cambio-idioma"); sessionStorage.removeItem("sa-cambio-idioma"); return !!v; } catch (e) { return false; } })();
const ALTERNOS = (() => { try { return JSON.parse($("#idiomas").textContent); } catch (e) { return []; } })();

/* Lo que el visitante está viendo, para llevarlo al otro idioma sin perderlo */
function estadoActual(){
  if (document.body.dataset.obra) return "";
  const mu = $("#museo"), mm = location.hash.match(/^#\/museo\/[\w-]+/);
  if (mu && mu.open && mm) return mm[0];
  const s = $("#sheet"), m = location.hash.match(/^#\/obra\/[\w-]+/);
  if (s && s.open && m) return m[0];
  const secs = ["obras", "recorrido", "que-ves", "dos-obras", "artista", "pincelada", "espacio", "comprar"].map(id => $("#" + id)).filter(Boolean);
  let cur = null; secs.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .4) cur = el; });
  if (!cur || scrollY < innerHeight * .5) return "";
  if (cur.id === "espacio" && Pared.actual()) return "?pared=" + Pared.actual() + "#espacio";
  return "#" + cur.id;
}
function initIdioma(){
  const box = $("[data-idioma]");
  if (box){
    const sum = $("summary", box);
    const cerrar = () => { box.open = false; };
    box.addEventListener("toggle", () => sum.setAttribute("aria-expanded", box.open));
    box.addEventListener("keydown", e => {
      const links = $$("a", box), i = links.indexOf(document.activeElement);
      if (e.key === "Escape" && box.open){ cerrar(); sum.focus(); }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && box.open){ e.preventDefault(); const n = links.length; links[(i + (e.key === "ArrowDown" ? 1 : -1) + n) % n].focus(); }
    });
    document.addEventListener("click", e => { if (box.open && !box.contains(e.target)) cerrar(); });
  }
  /* Cualquier enlace a otro idioma guarda la elección y lleva consigo lo que se está viendo */
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-cambio-idioma]"); if (!a) return;
    const l = a.getAttribute("hreflang"); guardar(CLAVE_IDIOMA, l);
    if (l === IDIOMA){ e.preventDefault(); if (box) box.open = false; return; }
    try { sessionStorage.setItem("sa-cambio-idioma", "1"); } catch (er) {}
    track("cambio_idioma", l);
    const extra = estadoActual(); if (extra){ e.preventDefault(); location.href = a.href.split(/[?#]/)[0] + extra; }
  });
  /* Sugerir el idioma del navegador una sola vez, sin cambiar nada por sí sola */
  if (leerClave(CLAVE_IDIOMA) || leerClave(CLAVE_SUGERENCIA) || !ALTERNOS.length) return;
  const pref = (navigator.languages || [navigator.language || ""]).map(x => String(x).slice(0, 2).toLowerCase())
    .find(x => x === IDIOMA || ALTERNOS.some(a => a.idioma === x));
  const alt = pref && pref !== IDIOMA && ALTERNOS.find(a => a.idioma === pref);
  if (!alt) return;
  const bar = document.createElement("div"); bar.className = "idioma-sugerencia"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", alt.etiqueta);
  bar.innerHTML = `<p lang="${alt.idioma}">${esc(alt.pregunta)}</p>
    <div><a class="btn gold" href="${esc(alt.url)}" lang="${alt.idioma}" hreflang="${alt.idioma}" data-cambio-idioma>${esc(alt.nombre)}</a>
    <button class="btn line" type="button">${esc(tr("idioma.seguir"))}</button></div>`;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add("on"));
  guardar(CLAVE_SUGERENCIA, "1");
  $("button", bar).addEventListener("click", () => { guardar(CLAVE_IDIOMA, IDIOMA); bar.remove(); });
}

/* ---------- Modo museo: una sala digital para contemplar la colección ----------
   Ligera: sin 3D, una obra por pared, solo se cargan la actual y sus vecinas. */
const Museo = (() => {
  const dlg = $("#museo"); if (!dlg) return { abrir(){}, abierto(){ return false; } };
  const orden = (EXPERIENCIA.museo || OBRAS.map(o => o.slug)).filter(bySlug);
  const conMedidas = orden.every(s => { const m = bySlug(s).medidas; return m && m.ancho && m.alto; });
  const cm = m => (m.unidad === "cm" ? 1 : 2.54);
  let i = 0, marco = false, zoom = false, previo = null;
  dlg.innerHTML = `<div class="museo-in">
    <header class="museo-top">
      <button class="museo-x" data-cerrar aria-label="${esc(tr("museo.cerrar"))}">×</button>
      <p class="museo-nombre">${esc(tr("museo.nombre"))}</p>
      <p class="museo-cuenta" aria-hidden="true"></p>
      ${ALTERNOS.map(a => `<a class="museo-idioma" href="${esc(a.url)}" hreflang="${a.idioma}" lang="${a.idioma}" data-cambio-idioma>${a.idioma.toUpperCase()}</a>`).join("")}
    </header>
    <div class="museo-sala">
      <div class="museo-pared">
        <figure class="museo-obra"><div class="museo-lienzo"><img alt="" draggable="false"></div></figure>
        <button class="museo-flecha prev" data-paso="-1" aria-label="${esc(tr("museo.anterior"))}">‹</button>
        <button class="museo-flecha next" data-paso="1" aria-label="${esc(tr("museo.siguiente"))}">›</button>
        <button class="museo-marco-btn" data-marco aria-pressed="false">${esc(tr("museo.marco"))}</button>
        <p class="museo-acasa" aria-hidden="true">${esc(tr("museo.aCasa"))}</p>
      </div>
      <aside class="museo-cartela" aria-live="polite"></aside>
    </div>
    <p class="museo-sueno">${esc(tr("museo.sueno"))}</p>
  </div>`;
  const pared = $(".museo-pared", dlg), obra = $(".museo-obra", dlg), lienzo = $(".museo-lienzo", dlg), img = $("img", dlg), cartela = $(".museo-cartela", dlg);
  function medir(){
    const o = bySlug(orden[i]), W = pared.clientWidth, H = pared.clientHeight, f = o.enmarcada || o;
    const maxW = W * (innerWidth >= 900 ? .62 : .74), maxH = H * .7, m = o.medidas;
    let w, h;
    if (conMedidas){
      /* escala común: la obra más grande de la sala ocupa el espacio disponible */
      const k = Math.min(...orden.map(s => { const b = bySlug(s), [x, y] = ladosCm(b, b.enmarcada); return Math.min(maxW / x, maxH / y); }));
      const [x, y] = ladosCm(o, f); w = x * k; h = y * k;
    } else { const p = prop(f); w = Math.min(maxW, maxH * p); h = w / p; }
    lienzo.style.width = Math.round(w) + "px"; lienzo.style.height = Math.round(h) + "px";
    /* el acercamiento nunca pasa de lo que permite la resolución real de la foto */
    lienzo.style.setProperty("--zs", Math.max(1.3, Math.min(2.4, f.w / w * 1.1)).toFixed(2));
  }
  function cartelaHTML(o){
    const m = o.medidas, rec = (TX.recorrido || {})[o.slug];
    const medidas = medidasOriginal(o) || tr("museo.medidasPendientes");
    const k = capDe(o.slug);
    return `<p class="museo-n">${tr("museo.contador", { n: i + 1, total: orden.length })}${k >= 0 ? " · " + esc(tr("rec.capituloNombre", { n: ["I", "II", "III", "IV"][k], nombre: capNombre(k) })) : ""}</p>
      <h2 class="museo-titulo">${esc(o.titulo)}</h2>
      ${o.subtitulo ? `<p class="museo-subt">${esc(o.subtitulo)}</p>` : ""}
      <dl class="museo-datos"><dt class="sr-only">${tr("ficha.artista")}</dt><dd>Luciann Soto${o.anio ? ", " + esc(o.anio) : ""}</dd>
        <dt class="sr-only">${tr("museo.tecnica")}</dt><dd>${o.tecnica ? esc(o.tecnica) : tr("museo.tecnicaPendiente")}</dd>
        <dt class="sr-only">${tr("museo.medidas")}</dt><dd>${esc(medidas)}${medidasOriginal(o) ? `<span class="museo-orig"> · ${tr("museo.original")}</span>` : ""}${conMedidas ? "" : ` · ${tr("museo.escala")}`}</dd></dl>
      ${o.inscripcion ? `<p class="museo-insc"><span class="museo-etq">${tr("museo.inscripcion")}</span>${cita(esc(o.inscripcion))}</p>` : ""}
      ${o.enmarcada ? `<p class="small">${tr("museo.enmarcada")}</p>` : ""}
      ${rec || o.descripcion ? `<details class="museo-lectura"><summary class="museo-etq">${tr("museo.lecturaPosible")}</summary>
        ${rec ? `<p class="museo-frase">${esc(rec.titulo)}</p><p>${esc(rec.linea)}</p>` : ""}${o.descripcion ? `<p>${esc(o.descripcion)}</p>` : ""}<p class="small">${tr("nota.curatorial")}</p></details>` : ""}
      ${o.declaracion ? `<blockquote class="museo-voz"><p class="museo-etq">${tr("museo.palabras")}</p>${esc(o.declaracion)}</blockquote>` : ""}
      ${o.provisional ? `<p class="small">${tr("explora.provisional")}</p>` : ""}
      <div class="museo-acciones"><button class="btn gold" data-ir="ficha">${tr("museo.verPrecio")}</button><button class="btn line" data-ir="pared">${tr("museo.verEspacio")}</button><button class="btn line" data-compartir-museo>${tr("compartir.titulo")}</button></div>
      ${marco ? `<p class="small museo-marco">${tr("museo.marcoNota")}</p>` : ""}
      <p class="small museo-ayuda">${tr("museo.ayuda")}</p>
      ${$("#trayectoria") ? `<p class="museo-tray"><button class="linkbtn" data-ir="trayectoria">${tr("museo.trayectoria")}</button></p>` : ""}`;
  }
  function pintar(nuevo){
    const o = bySlug(orden[i]);
    const poner = () => {
      const f = o.enmarcada || o; img.alt = o.alt; zoom = false;
      /* si la foto enmarcada no carga, se muestra la imagen de la obra: nunca un recuadro vacío */
      img.onerror = () => { if (o.enmarcada && img.src.endsWith(o.enmarcada.imagen.split("/").pop())){ img.src = o.imagen; $("[data-marco]", dlg).hidden = false; } };
      img.src = f.imagen;
      $("[data-marco]", dlg).hidden = !!o.enmarcada; obra.classList.remove("zoom"); lienzo.style.setProperty("--ox", "50%"); lienzo.style.setProperty("--oy", "50%");
      img.title = tr("museo.acercar"); obra.classList.toggle("marco", marco && !o.enmarcada);
      $(".museo-cuenta", dlg).textContent = `${i + 1} / ${orden.length}`; cartela.innerHTML = cartelaHTML(o); medir();
      if (nuevo) { $(".museo-sala", dlg).scrollTop = 0; cartela.scrollTop = 0; }
      [orden[(i + 1) % orden.length], orden[(i - 1 + orden.length) % orden.length]].forEach(s => { const x = new Image(), b = bySlug(s); x.src = (b.enmarcada || b).imagen; });
      const h = "#/museo/" + o.slug; if (location.hash !== h) history.replaceState(null, "", h);
      document.title = o.titulo + " · " + tr("museo.nombre") + " | Soto’s Art";
      requestAnimationFrame(() => pared.classList.remove("cambio"));
    };
    if (!nuevo || reduce){ poner(); return; }
    pared.classList.add("cambio"); setTimeout(poner, 320);
  }
  const ir = d => { i = (i + d + orden.length) % orden.length; track("museo_obra", orden[i]); pintar(true); };
  function abrir(slug){
    previo = document.activeElement; i = Math.max(0, orden.indexOf(slug)); if (i < 0) i = 0;
    document.documentElement.classList.add("museo-abierto");
    if (!dlg.open) dlg.showModal(); pintar(false); track("museo_abrir", orden[i]);
    $("[data-cerrar]", dlg).focus();
  }
  dlg.addEventListener("close", () => {
    document.documentElement.classList.remove("museo-abierto");
    if (/^#\/museo\//.test(location.hash)){ history.replaceState(null, "", location.pathname + location.search); document.title = TX.meta.titulo; }
    if (previo && previo.focus && !$("#sheet").open) previo.focus();
  });
  dlg.addEventListener("click", e => {
    if (e.target.closest("[data-cerrar]")) return dlg.close();
    const p = e.target.closest("[data-paso]"); if (p) return ir(+p.dataset.paso);
    if (e.target.closest("[data-compartir-museo]")) return Compartir.abrir(datosObra(bySlug(orden[i])));
    const mb = e.target.closest("[data-marco]");
    if (mb){ marco = !marco; mb.setAttribute("aria-pressed", marco); obra.classList.toggle("marco", marco); cartela.innerHTML = cartelaHTML(bySlug(orden[i])); track("museo_marco", marco ? "si" : "no"); return medir(); }
    const d = e.target.closest("[data-ir]");
    if (d){
      const s = orden[i];
      if (d.dataset.ir === "trayectoria"){ dlg.close(); $("#trayectoria").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); track("museo_trayectoria", s); return; }
      if (d.dataset.ir === "ficha"){ dlg.close(); return openWork(s); }
      /* De la sala al hogar: la luz de la sala se apaga y se enciende la pared del visitante */
      const llegar = () => { dlg.classList.remove("a-casa"); dlg.close(); Pared.show(s); const e2 = $("#espacio"); if (e2 && !reduce){ e2.classList.remove("llega"); void e2.offsetWidth; e2.classList.add("llega"); } };
      if (reduce) return llegar();
      $(".museo-sala", dlg).scrollTo({ top: 0, behavior: "smooth" }); dlg.classList.add("a-casa"); return setTimeout(llegar, 1300);
    }
  });
  /* Examinar detalles: tocar acerca en ese punto; arrastrar recorre; tocar otra vez aleja */
  let sx = null, sy = null, movido = false;
  lienzo.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; movido = false; lienzo.setPointerCapture(e.pointerId); });
  lienzo.addEventListener("pointermove", e => {
    if (sx === null) return; if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) movido = true;
    if (zoom){ const r = lienzo.getBoundingClientRect(); lienzo.style.setProperty("--ox", Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) + "%"); lienzo.style.setProperty("--oy", Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) + "%"); }
  });
  lienzo.addEventListener("pointerup", e => {
    const dx = e.clientX - sx; sx = null;
    if (!zoom && movido && Math.abs(dx) > 40) return ir(dx < 0 ? 1 : -1);
    if (movido && zoom) return;
    const r = lienzo.getBoundingClientRect(); zoom = !zoom; obra.classList.toggle("zoom", zoom);
    lienzo.style.setProperty("--ox", (e.clientX - r.left) / r.width * 100 + "%"); lienzo.style.setProperty("--oy", (e.clientY - r.top) / r.height * 100 + "%");
    img.title = tr(zoom ? "museo.alejar" : "museo.acercar"); if (zoom) track("museo_detalle", orden[i]);
  });
  lienzo.tabIndex = 0; lienzo.setAttribute("role", "button");
  lienzo.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); zoom = !zoom; obra.classList.toggle("zoom", zoom); } });
  const etiqueta = () => lienzo.setAttribute("aria-label", tr("museo.acercar"));
  etiqueta();
  dlg.addEventListener("keydown", e => { if (e.target.closest("input,select,textarea")) return; if (e.key === "ArrowRight") ir(1); if (e.key === "ArrowLeft") ir(-1); });
  addEventListener("resize", () => dlg.open && medir());
  $$("[data-museo]").forEach(b => b.addEventListener("click", () => abrir(orden[0])));
  return { abrir, abierto: () => dlg.open };
})();

/* ---------- Fotos adicionales: se ven en grande sin salir de la ficha ---------- */
const fotoAlt = (o, f) => `${tr("fotos." + f.tipo)}: ${cita(o.titulo)}${f.pie ? ". " + f.pie : ""}`;
function verFoto(o, i){
  let dlg = $("#fotoGrande");
  if (!dlg){ dlg = document.createElement("dialog"); dlg.id = "fotoGrande"; dlg.className = "foto-grande"; document.body.appendChild(dlg);
    dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-cerrar-foto]")) dlg.close(); }); }
  const f = o.fotos[i];
  dlg.innerHTML = `<button class="close" data-cerrar-foto aria-label="${esc(tr("cerrar"))}">×</button>
    <figure><img src="${esc(f.imagen)}" alt="${esc(fotoAlt(o, f))}" width="${f.w}" height="${f.h}"><figcaption><b>${tr("fotos." + f.tipo)}</b>${f.pie ? " " + esc(f.pie) : ""}</figcaption></figure>`;
  if (!dlg.open) dlg.showModal(); track("ver_foto", o.slug);
}

/* ---------- Inventario (inventario.json, lo actualiza la herramienta de Luciann) ----------
   null o sin dato: no se muestra nada · 0: se prepara por encargo (la orden se recibe igual) · n: n disponibles */
let INV = null;
const stockDe = slug => { const n = INV && INV.obras ? INV.obras[slug] : null; return Number.isInteger(n) && n >= 0 ? n : null; };
function pintarStock(root = document){
  $$("[data-stock]", root).forEach(el => {
    const n = stockDe(el.dataset.stock);
    if (n === null){ el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false; el.classList.toggle("encargo", n === 0);
    el.innerHTML = n > 0 ? `<b>${n === 1 ? tr("inv.uno") : tr("inv.varios", { n })}</b>`
      : `<b>${tr("inv.encargo")}</b><span>${tr("inv.encargoNota")}</span>`;
  });
  $$("[data-review][data-slug]", root).forEach(b => { b.textContent = stockDe(b.dataset.slug) === 0 ? tr("inv.solicitar") : tr("ficha.ordenar"); });
}
fetch(RAIZ + "inventario.json?t=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : null)
  .then(d => { INV = d; pintarStock(); }).catch(() => {});

/* ---------- Arranque ---------- */
(function boot(){
  renderFooter(); initIdioma();
  const page = document.body.dataset.obra;
  if (page){ const o = bySlug(page), m = $("#obraPage"); if (o && m){ renderFicha(o, m, { page: true }); track("ver_obra", o.slug); } return; }
  initUmbral(); renderSalon(); initRecorrido(); initQueVes(); initDosObras(); renderVoz(); renderArtista(); initPincelada(); renderConfianza();
  const sheet = $("#sheet");
  sheet.addEventListener("close", () => { if (/^#\/obra\//.test(location.hash)){ history.replaceState(null, "", location.pathname + location.search); document.title = TX.meta.titulo; } });
  /* Enlaces internos a una obra o a la sala (#/obra/…, #/museo/…) también funcionan sin recargar */
  addEventListener("hashchange", () => {
    const a = location.hash.match(/^#\/(obra|museo)\/([\w-]+)/); if (!a || !bySlug(a[2])) return;
    if (a[1] === "museo"){ if (sheet.open) sheet.close(); Museo.abrir(a[2]); } else { if (Museo.abierto()) $("#museo").close(); openWork(a[2]); }
  });
  const params = new URLSearchParams(location.search), p = params.get("pared");
  if (p && bySlug(p)) setTimeout(() => Pared.show(p), 300);
  const m = location.hash.match(/^#\/obra\/([\w-]+)/); if (m && bySlug(m[1])) openWork(m[1]);
  const mu = location.hash.match(/^#\/museo\/([\w-]+)/); if (mu && bySlug(mu[1])) Museo.abrir(mu[1]);
})();
