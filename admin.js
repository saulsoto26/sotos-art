/* =====================================================================
   SOTO’S ART — HERRAMIENTA DE LUCIANN
   · Registro de ventas → repositorio PRIVADO (CONFIG.admin.repoVentas, registro.json)
   · Inventario → repositorio del sitio (inventario.json): solo cantidades, nunca datos de compradores
   · Certificado de autenticidad listo para imprimir y firmar a mano
   Usa los mismos datos de la página (catalogo.js y textos-es.js): no hay que duplicar nada.
   ===================================================================== */
"use strict";
const A = CONFIG.admin, API = "https://api.github.com", LLAVE = "sa-admin-llave";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const TX = window.TEXTOS || {};
OBRAS.forEach(o => Object.assign(o, { tecnica: "", inscripcion: "" }, (TX.obras || {})[o.slug]));
const porSlug = s => OBRAS.find(o => o.slug === s);

/* ---------- Guardar la llave solo en este dispositivo ---------- */
const llave = { leer(){ try { return localStorage.getItem(LLAVE) || ""; } catch (e) { return ""; } },
  guardar(v){ try { localStorage.setItem(LLAVE, v); } catch (e) {} }, borrar(){ try { localStorage.removeItem(LLAVE); } catch (e) {} } };

/* ---------- GitHub ---------- */
class ErrorGH extends Error { constructor(st, msg){ super(msg); this.status = st; } }
async function gh(ruta, op = {}){
  let r;
  try {
    r = await fetch(API + ruta, { ...op, cache: "no-store", headers: { Authorization: "Bearer " + llave.leer(),
      Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(op.body ? { "Content-Type": "application/json" } : {}) } });
  } catch (e) { throw new ErrorGH(0, "No hay conexión a internet. Inténtalo de nuevo."); }
  if (!r.ok){
    const msg = { 401: "La llave no es válida o ya venció.", 403: "La llave no tiene permiso para esto.", 404: "No se encontró el repositorio o el archivo." }[r.status]
      || `GitHub respondió con un error (${r.status}).`;
    throw new ErrorGH(r.status, msg);
  }
  return r.status === 204 ? null : r.json();
}
const b64 = s => { const b = new TextEncoder().encode(s); let t = ""; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(t); };
const deb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), c => c.charCodeAt(0)));
async function leer(repo, ruta){
  try { const j = await gh(`/repos/${repo}/contents/${ruta}?ref=${A.rama}&t=${Date.now()}`); return { datos: JSON.parse(deb64(j.content)), sha: j.sha }; }
  catch (e) { if (e.status === 404) return { datos: null, sha: null }; throw e; }
}
/* Lee, cambia y guarda. Si otro cambio llegó primero (conflicto), vuelve a leer y lo intenta otra vez. */
async function actualizar(repo, ruta, cambiar, mensaje){
  for (let intento = 0; intento < 3; intento++){
    const { datos, sha } = await leer(repo, ruta), nuevo = cambiar(datos);
    const body = { message: mensaje, content: b64(JSON.stringify(nuevo, null, 2) + "\n"), branch: A.rama };
    if (sha) body.sha = sha;
    try { await gh(`/repos/${repo}/contents/${ruta}`, { method: "PUT", body: JSON.stringify(body) }); return nuevo; }
    catch (e) { if (e.status !== 409 && e.status !== 422) throw e; }
  }
  throw new ErrorGH(409, "Otro cambio se guardó al mismo tiempo. Vuelve a intentarlo.");
}

/* ---------- Utilidades ---------- */
const hoy = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const fechaLarga = iso => { if (!iso) return ""; const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m - 1]} de ${a}`; };
const cm = x => (x * 2.54).toFixed(1).replace(".", ",");
function medidas(o){
  const m = o.medidas; if (!m || !m.ancho || !m.alto) return "";
  const [a, b] = [m.ancho, m.alto].sort((x, y) => x - y);
  return m.unidad === "in" ? `${a} × ${b} pulg (${cm(a)} × ${cm(b)} cm)` : `${a} × ${b} cm`;
}
function aviso(t){ const el = $("#aviso"); el.textContent = t; el.classList.add("on"); clearTimeout(aviso.t); aviso.t = setTimeout(() => el.classList.remove("on"), 4200); }
const mostrar = id => $$(".vista").forEach(v => v.hidden = v.id !== id);

let INV = null, REG = null;
const stock = s => { const n = INV && INV.obras ? INV.obras[s] : null; return Number.isInteger(n) && n >= 0 ? n : null; };

/* ---------- Conectar ---------- */
async function verificar(){
  const [sitio, ventas] = await Promise.all([gh(`/repos/${A.repoSitio}`), gh(`/repos/${A.repoVentas}`)]);
  if (!ventas.private) throw new ErrorGH(0, `El repositorio ${A.repoVentas} debe ser privado: guarda datos de compradores.`);
  if (!(sitio.permissions && sitio.permissions.push && ventas.permissions && ventas.permissions.push))
    throw new ErrorGH(403, "La llave puede leer, pero no guardar. Dale permiso de “Contents: Read and write”.");
}
async function entrar(){
  mostrar("vPrincipal");
  await Promise.all([cargarInventario(), cargarVentas()]);
  pintarObras(); pintarInventario(); pintarVentas();
}
$("#btnConectar").addEventListener("click", async () => {
  const v = $("#llave").value.trim(), err = $("#errConectar"); err.textContent = "";
  if (!v) return err.textContent = "Escribe o pega la llave.";
  llave.guardar(v); $("#btnConectar").disabled = true;
  try { await verificar(); $("#llave").value = ""; await entrar(); aviso("Conectada. Ya puedes registrar ventas."); }
  catch (e) { llave.borrar(); err.textContent = e.message; }
  finally { $("#btnConectar").disabled = false; }
});
$("#btnSalir").addEventListener("click", () => { if (!confirm("¿Desconectar este dispositivo? Tendrás que pegar la llave otra vez.")) return; llave.borrar(); mostrar("vConectar"); });

/* ---------- Pestañas ---------- */
$$("[data-tab]").forEach(b => b.addEventListener("click", () => {
  $$("[data-tab]").forEach(x => x.setAttribute("aria-selected", x === b));
  $$("[data-panel]").forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
}));

/* ---------- Inventario ---------- */
async function cargarInventario(){ INV = (await leer(A.repoSitio, "inventario.json")).datos || { obras: {} }; INV.obras = INV.obras || {}; }
function pintarInventario(){
  $("#listaInv").innerHTML = OBRAS.map(o => { const n = stock(o.slug);
    return `<div class="fila-inv"><img src="${esc(o.imagen)}" alt="" loading="lazy"><span class="t">${esc(o.titulo)}<small>${n === null ? "No se muestra" : n === 0 ? "Por encargo" : n === 1 ? "1 disponible" : n + " disponibles"}</small></span>
      <span class="ctr"><button type="button" data-menos="${o.slug}" aria-label="Restar una pieza de ${esc(o.titulo)}">−</button>
      <input inputmode="numeric" data-inv="${o.slug}" value="${n === null ? "" : n}" aria-label="Piezas disponibles de ${esc(o.titulo)}">
      <button type="button" data-mas="${o.slug}" aria-label="Sumar una pieza a ${esc(o.titulo)}">+</button></span></div>`; }).join("");
}
$("#listaInv").addEventListener("click", e => {
  const b = e.target.closest("[data-menos],[data-mas]"); if (!b) return;
  const s = b.dataset.menos || b.dataset.mas, inp = $(`[data-inv="${s}"]`), n = parseInt(inp.value, 10) || 0;
  inp.value = Math.max(0, n + (b.dataset.mas ? 1 : -1));
});
$("#btnInv").addEventListener("click", async () => {
  const err = $("#errInv"); err.textContent = "";
  const nuevos = {};
  for (const inp of $$("[data-inv]")){
    const v = inp.value.trim();
    if (v !== "" && !/^\d+$/.test(v)) return err.textContent = "Usa solo números enteros, o deja el espacio vacío.";
    nuevos[inp.dataset.inv] = v === "" ? null : parseInt(v, 10);
  }
  $("#btnInv").disabled = true;
  try { INV = await actualizar(A.repoSitio, "inventario.json", d => ({ ...(d || {}), obras: { ...((d || {}).obras || {}), ...nuevos } }), "Inventario actualizado desde la herramienta de Luciann");
    pintarInventario(); pintarObras(); aviso("Inventario guardado. La página se actualiza en uno o dos minutos."); }
  catch (e) { err.textContent = e.message; }
  finally { $("#btnInv").disabled = false; }
});

/* ---------- Nueva venta ---------- */
function pintarObras(){
  const sel = $("#vObra"), actual = sel.value;
  sel.innerHTML = OBRAS.map(o => `<option value="${o.slug}">${esc(o.titulo)} (${esc(o.sku)})</option>`).join("");
  if (actual) sel.value = actual; alCambiarObra();
}
function alCambiarObra(){
  const o = porSlug($("#vObra").value); if (!o) return;
  $("#vAnio").value = o.anio || "";
  const n = stock(o.slug), repro = $("input[name=tipo]:checked").value === "reproduccion", chk = $("#vDescontar");
  $("#vStockNota").textContent = n === null ? "El inventario de esta obra no se muestra en la página." : n === 0 ? "No hay piezas listas: es una venta por encargo." : `Hay ${n} ${n === 1 ? "pieza lista" : "piezas listas"}.`;
  const puede = repro && n > 0; chk.disabled = !puede; chk.checked = puede; $("#lDescontar").classList.toggle("apagado", !puede);
}
$("#vObra").addEventListener("change", alCambiarObra);
$$("input[name=tipo]").forEach(r => r.addEventListener("change", () => { $("#fsRepro").hidden = $("input[name=tipo]:checked").value === "original"; alCambiarObra(); }));
$$("input[name=edicion]").forEach(r => r.addEventListener("change", () => { $("#edNumerada").hidden = $("input[name=edicion]:checked").value !== "numerada"; }));

async function cargarVentas(){ REG = (await leer(A.repoVentas, "registro.json")).datos || { ventas: [] }; REG.ventas = REG.ventas || []; }
$("#fVenta").addEventListener("submit", async ev => {
  ev.preventDefault();
  const err = $("#errVenta"); err.textContent = "";
  const o = porSlug($("#vObra").value), tipo = $("input[name=tipo]:checked").value, ed = $("input[name=edicion]:checked").value;
  const nombre = $("#vNombre").value.trim(), fecha = $("#vFecha").value;
  if (!nombre) return err.textContent = "Escribe el nombre del comprador.";
  if (!fecha) return err.textContent = "Escribe la fecha de venta.";
  const edN = $("#vEdN").value.trim(), edDe = $("#vEdDe").value.trim();
  if (tipo === "reproduccion" && ed === "numerada" && (!/^\d+$/.test(edN) || !/^\d+$/.test(edDe) || +edN > +edDe || +edN < 1))
    return err.textContent = "Revisa el número de la edición (por ejemplo, 3 de 25).";
  const descontar = $("#vDescontar").checked && !$("#vDescontar").disabled;
  if (!confirm(`¿Confirmar la venta de «${o.titulo}» a ${nombre}?${descontar ? "\nSe restará 1 del inventario de la página." : ""}`)) return;
  const venta = { numero: "", creada: new Date().toISOString(), obra: o.slug, sku: o.sku, titulo: o.titulo, tipo,
    anio: $("#vAnio").value.trim(), tecnica: o.tecnica || "", medidasOriginal: medidas(o), inscripcion: o.inscripcion || "",
    material: tipo === "original" ? "" : $("#vMaterial").value.trim(), tamano: tipo === "original" ? "" : $("#vTamano").value.trim(),
    fechaImpresion: tipo === "original" ? "" : $("#vImpresion").value,
    edicion: tipo === "original" ? null : (ed === "numerada" ? { numero: +edN, de: +edDe } : "abierta"),
    comprador: nombre, contacto: $("#vContacto").value.trim(), fechaVenta: fecha,
    monto: $("#vMonto").value.trim(), referenciaPago: $("#vRef").value.trim(), notas: $("#vNotas").value.trim(),
    encargo: tipo === "reproduccion" && stock(o.slug) === 0, inventarioDescontado: descontar, anulada: false };
  $("#btnVenta").disabled = true;
  try {
    /* 1. Registro privado, con el siguiente número de certificado de esa obra (SA-002-R-0001) */
    REG = await actualizar(A.repoVentas, "registro.json", d => {
      d = d || { ventas: [] }; d.ventas = d.ventas || [];
      const pref = `${o.sku}-${tipo === "original" ? "O" : "R"}-`;
      const ult = d.ventas.filter(v => v.numero.startsWith(pref)).map(v => parseInt(v.numero.slice(pref.length), 10)).reduce((a, b) => Math.max(a, b), 0);
      venta.numero = pref + String(ult + 1).padStart(4, "0");
      d.ventas.push(venta); return d;
    }, `Venta registrada: ${o.sku}`);
    /* 2. Inventario público (solo la cantidad) */
    if (descontar){
      try { INV = await actualizar(A.repoSitio, "inventario.json", d => { d = d || { obras: {} }; d.obras = d.obras || {};
          const n = d.obras[o.slug]; if (Number.isInteger(n) && n > 0) d.obras[o.slug] = n - 1; return d; }, `Inventario: venta de «${o.titulo}»`); }
      catch (e) { alert("La venta quedó registrada, pero no se pudo actualizar el inventario. Ajústalo en la pestaña Inventario.\n\n" + e.message); }
    }
    $("#fVenta").reset(); $("#vFecha").value = hoy(); $("#fsRepro").hidden = false; $("#edNumerada").hidden = true;
    pintarObras(); pintarInventario(); pintarVentas();
    verCertificado(venta);
  } catch (e) { err.textContent = e.message; }
  finally { $("#btnVenta").disabled = false; }
});

/* ---------- Ventas ---------- */
function pintarVentas(){
  const vs = [...REG.ventas].reverse();
  $("#listaVentas").innerHTML = vs.length ? vs.map(v => `<article class="tarjeta venta${v.anulada ? " anulada" : ""}">
      <p class="num">${esc(v.numero)}${v.anulada ? " · ANULADA" : ""}${v.encargo ? " · por encargo" : ""}</p>
      <h3>${esc(v.titulo)}</h3>
      <p>${esc(v.comprador)} · ${esc(fechaLarga(v.fechaVenta))}${v.monto ? " · $" + esc(v.monto) : ""}${v.referenciaPago ? " · ATH " + esc(v.referenciaPago) : ""}</p>
      <div class="acc"><button class="btn linea" type="button" data-ver="${esc(v.numero)}">Ver certificado</button>
      ${v.anulada ? "" : `<button class="enlace" type="button" data-anular="${esc(v.numero)}">Anular</button>`}</div></article>`).join("")
    : `<p class="lead">Todavía no hay ventas registradas.</p>`;
}
$("#listaVentas").addEventListener("click", async e => {
  const ver = e.target.closest("[data-ver]"), an = e.target.closest("[data-anular]");
  if (ver) return verCertificado(REG.ventas.find(v => v.numero === ver.dataset.ver));
  if (!an) return;
  const v = REG.ventas.find(x => x.numero === an.dataset.anular);
  if (!confirm(`¿Anular la venta ${v.numero}?${v.inventarioDescontado ? "\nLa pieza vuelve al inventario." : ""}\nEl número no se vuelve a usar.`)) return;
  an.disabled = true;
  try {
    REG = await actualizar(A.repoVentas, "registro.json", d => { const x = d.ventas.find(y => y.numero === v.numero); x.anulada = true; x.anuladaEl = new Date().toISOString(); return d; }, `Venta anulada: ${v.numero}`);
    if (v.inventarioDescontado) INV = await actualizar(A.repoSitio, "inventario.json", d => { const n = d.obras[v.obra]; if (Number.isInteger(n)) d.obras[v.obra] = n + 1; return d; }, `Inventario: venta anulada de «${v.titulo}»`);
    pintarVentas(); pintarInventario(); alCambiarObra(); aviso("Venta anulada.");
  } catch (er) { alert(er.message); an.disabled = false; }
});

/* ---------- Certificado ---------- */
const linea = (etq, valor, ancho = "") => `<div class="c-campo ${ancho}"><span class="c-etq">${etq}</span><span class="c-val">${valor ? esc(valor) : "&nbsp;"}</span></div>`;
const casilla = (t, on) => `<span class="c-casilla${on ? " on" : ""}"><i></i>${t}</span>`;
function verCertificado(v){
  const o = porSlug(v.obra) || {}, repro = v.tipo === "reproduccion", ed = v.edicion;
  const edicion = !repro ? "" : ed === "abierta" ? `${casilla("Edición abierta", true)}` : ed ? `N.º <b>${ed.numero}</b> de <b>${ed.de}</b>` : "";
  const pie = (p) => `<footer class="c-pie"><span>SOTO’S ART · Certificado de autenticidad · ${esc(v.numero)}</span><span>Página ${p} de 2</span></footer>`;
  $("#cert").innerHTML = `${v.anulada ? `<p class="c-anulado-aviso">Esta venta fue anulada. El certificado no es válido.</p>` : ""}
  <article class="c-hoja${v.anulada ? " c-anulado" : ""}"><div class="c-marco">
    <img class="c-logo" src="admin-logo.jpg" alt="Soto’s Art – Blessing Art">
    <h1>Certificado de autenticidad</h1><p class="c-sub">Registro de la pieza</p><hr class="c-filete">
    <p class="c-declara">Por medio de este documento, certifico que la pieza descrita a continuación corresponde a una obra original creada por mí o a una reproducción autorizada, revisada y firmada por mí, según se indica en «Tipo de pieza».</p>
    <div class="c-cabeza"><div><span class="c-etq">Número de certificado</span><span class="c-numero">${esc(v.numero)}</span></div>
      <div><span class="c-etq">Tipo de pieza</span>${casilla("Obra original", !repro)} ${casilla("Reproducción autorizada", repro)}</div></div>
    <h2 class="c-seccion"><span>La obra original</span></h2>
    <div class="c-obra"><figure><img src="${esc(o.imagen || "")}" alt=""><figcaption>Imagen de referencia de la obra</figcaption></figure>
      <div>${linea("Título de la obra", v.titulo)}${linea("Artista", CONFIG.nombreLegal)}${linea("Técnica y materiales", v.tecnica)}
        ${linea("Dimensiones de la obra original", v.medidasOriginal)}${linea("Año de creación", v.anio, "medio")}${v.inscripcion ? linea("Inscripción", "«" + v.inscripcion + "»") : ""}</div></div>
    ${repro ? `<h2 class="c-seccion"><span>La pieza que recibes</span></h2>
    <div class="c-rejilla">${linea("Material de impresión", v.material)}${linea("Tamaño de la pieza", v.tamano)}
      ${linea("Fecha de impresión", fechaLarga(v.fechaImpresion))}<div class="c-campo"><span class="c-etq">Edición</span><span class="c-val">${edicion || "&nbsp;"}</span></div></div>` : ""}
    <div class="c-rejilla">${linea("Nombre del comprador", v.comprador)}${linea("Fecha de venta", fechaLarga(v.fechaVenta))}</div>
    ${pie(1)}</div></article>
  <article class="c-hoja${v.anulada ? " c-anulado" : ""}"><div class="c-marco">
    <h2 class="c-titulo2">Derechos de autor y uso de la obra</h2>
    <p>La compra de la pieza física transfiere la propiedad de esa pieza, pero no transfiere los derechos de autor. La artista conserva los derechos de autor sobre la obra, conforme a la legislación aplicable, salvo acuerdo escrito distinto.</p>
    <p>No se autoriza copiar, calcar, reproducir, fabricar réplicas o crear obras derivadas basadas sustancialmente en esta pieza, ni utilizar imágenes de la obra con fines comerciales, sin autorización previa y por escrito de la artista, excepto cuando la ley lo permita.</p>
    <p>El comprador puede exhibir la pieza adquirida en espacios privados o públicos y compartir fotografías de ella para uso personal y no comercial, siempre que no se presente como autor de la obra ni se elimine o altere la firma o identificación de la artista. Este certificado identifica la pieza descrita; no sustituye un contrato de licencia ni una cesión escrita de derechos.</p>
    <h2 class="c-titulo2">Cuidado y documentación</h2>
    <p>Se recomienda conservar este certificado junto con la factura o comprobante de compra y guardar fotografías de la obra. Para limpieza, transporte o conservación, utilice métodos adecuados a los materiales empleados y consulte a la artista si tiene dudas.</p>
    <div class="c-firmas"><div><span class="c-raya"></span><b>Firma de la artista</b><small>${esc(CONFIG.nombreLegal)} · Soto’s Art</small></div>
      <div><span class="c-raya"></span><b>Fecha de emisión</b></div></div>
    <div class="c-contacto"><span class="c-etq">Contacto de la artista</span>
      <p>${esc(CONFIG.correo)}  ·  Instagram: @${esc(CONFIG.instagram)}</p>
      <small>Para verificar este certificado, escribe a la artista con el número ${esc(v.numero)}.</small></div>
    <div class="c-sello"><i>Soto’s Art</i><span>BLESSING ART</span></div>
    ${pie(2)}</div></article>`;
  mostrar("vCert"); escalar(); scrollTo(0, 0);
}
/* En pantalla, la hoja carta se reduce para caber en el teléfono; al imprimir sale a tamaño real */
function escalar(){ const z = Math.min(1, ($("#cert").clientWidth || innerWidth - 36) / 816); $$(".c-hoja").forEach(h => h.style.zoom = z); }
addEventListener("resize", escalar);
$("#btnVolver").addEventListener("click", () => { mostrar("vPrincipal"); $$("[data-tab]").find(b => b.getAttribute("aria-selected") === "true").click(); });
$("#btnImprimir").addEventListener("click", () => print());

/* ---------- Arranque ---------- */
$("#vFecha").value = hoy();
(async () => {
  if (!llave.leer()) return mostrar("vConectar");
  try { await entrar(); }
  catch (e) { mostrar("vConectar"); $("#errConectar").textContent = e.message; if (e.status === 401) llave.borrar(); }
})();
