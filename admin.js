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
let DAT = window.DATOS || null;   // datos.json: lo que Luciann edita en la pestaña Página
function refrescarObras(){ if (DAT) aplicarDatos(DAT, TX, "es"); OBRAS.forEach(o => Object.assign(o, { tecnica: "", inscripcion: "" }, (TX.obras || {})[o.slug])); }
refrescarObras();
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
/* Una venta puede tener varias piezas: cada una lleva su propio certificado y número.
   Los registros de una sola pieza (numero, inventarioDescontado: true/false) se siguen leyendo igual. */
const numerosDe = v => v.numeros && v.numeros.length ? v.numeros : [v.numero];
const descontadas = v => typeof v.inventarioDescontado === "number" ? v.inventarioDescontado : v.inventarioDescontado ? 1 : 0;
const edicionDe = (v, i) => v.edicion && typeof v.edicion === "object" ? { numero: v.edicion.numero + i, de: v.edicion.de } : v.edicion;
const rango = v => { const n = numerosDe(v); return n.length > 1 ? `${n[0]} a ${n[n.length - 1]}` : n[0]; };
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
  await Promise.all([cargarInventario(), cargarVentas(), cargarDatos()]);
  pintarObras(); pintarInventario(); pintarVentas(); pintarPagina();
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
    return `<div class="fila-inv"><img src="${esc(src(o.imagen))}" alt="" loading="lazy"><span class="t">${esc(o.titulo)}<small>${n === null ? "No se muestra" : n === 0 ? "Por encargo" : n === 1 ? "1 disponible" : n + " disponibles"}</small></span>
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
  alCambiarCantidad();
}
const cantidad = () => { const c = parseInt($("#vCantidad").value, 10); return c >= 1 ? c : 1; };
function alCambiarCantidad(){
  const o = porSlug($("#vObra").value); if (!o) return;
  const n = stock(o.slug), c = cantidad(), repro = $("input[name=tipo]:checked").value === "reproduccion", chk = $("#vDescontar");
  let nota = n === null ? "El inventario de esta obra no se muestra en la página." : n === 0 ? "No hay piezas listas: es una venta por encargo." : `Hay ${n} ${n === 1 ? "pieza lista" : "piezas listas"}.`;
  if (repro && n > 0 && c > n) nota += ` Se restan ${n} del inventario y ${c - n === 1 ? "la otra queda" : `las otras ${c - n} quedan`} por encargo.`;
  $("#vStockNota").textContent = nota;
  const puede = repro && n > 0; chk.disabled = !puede; chk.checked = puede; $("#lDescontar").classList.toggle("apagado", !puede);
  $("#lDescontarT").textContent = `Restar ${puede ? Math.min(c, n) : c} del inventario de la página`;
  $("#lEdN").textContent = c > 1 ? "Número de la primera pieza" : "Número";
  $("#btnVenta").textContent = c > 1 ? `Confirmar venta y preparar ${c} certificados` : "Confirmar venta y preparar certificado";
}
$("#vCantidad").addEventListener("input", alCambiarCantidad);
$("#cMenos").addEventListener("click", () => { $("#vCantidad").value = Math.max(1, cantidad() - 1); alCambiarCantidad(); });
$("#cMas").addEventListener("click", () => { $("#vCantidad").value = Math.min(50, cantidad() + 1); alCambiarCantidad(); });
$("#vObra").addEventListener("change", alCambiarObra);
$$("input[name=tipo]").forEach(r => r.addEventListener("change", () => { $("#fsRepro").hidden = $("input[name=tipo]:checked").value === "original"; alCambiarObra(); }));
$$("input[name=edicion]").forEach(r => r.addEventListener("change", () => { $("#edNumerada").hidden = $("input[name=edicion]:checked").value !== "numerada"; }));

async function cargarVentas(){ REG = (await leer(A.repoVentas, "registro.json")).datos || { ventas: [] }; REG.ventas = REG.ventas || []; }
$("#fVenta").addEventListener("submit", async ev => {
  ev.preventDefault();
  const err = $("#errVenta"); err.textContent = "";
  const o = porSlug($("#vObra").value), tipo = $("input[name=tipo]:checked").value, ed = $("input[name=edicion]:checked").value;
  const nombre = $("#vNombre").value.trim(), fecha = $("#vFecha").value, cv = $("#vCantidad").value.trim();
  if (!/^\d+$/.test(cv) || +cv < 1 || +cv > 50) return err.textContent = "La cantidad debe ser un número del 1 al 50.";
  const c = +cv;
  if (tipo === "original" && c > 1) return err.textContent = "Una obra original es una sola pieza: la cantidad debe ser 1.";
  if (!nombre) return err.textContent = "Escribe el nombre del comprador.";
  if (!fecha) return err.textContent = "Escribe la fecha de venta.";
  const edN = $("#vEdN").value.trim(), edDe = $("#vEdDe").value.trim();
  if (tipo === "reproduccion" && ed === "numerada" && (!/^\d+$/.test(edN) || !/^\d+$/.test(edDe) || +edN < 1 || +edN + c - 1 > +edDe))
    return err.textContent = c > 1 ? `Revisa la edición: ${c} piezas desde el N.º ${edN || "?"} no caben en una edición de ${edDe || "?"}.` : "Revisa el número de la edición (por ejemplo, 3 de 25).";
  const n = stock(o.slug), quiere = $("#vDescontar").checked && !$("#vDescontar").disabled, restar = quiere ? Math.min(c, n) : 0;
  const encargo = tipo === "reproduccion" && n !== null ? c - (n > 0 ? Math.min(c, n) : 0) : 0;
  const pzs = c === 1 ? "una pieza" : `${c} piezas`;
  if (!confirm(`¿Confirmar la venta de ${pzs} de «${o.titulo}» a ${nombre}?${restar ? `\nSe restará${restar > 1 ? "n" : ""} ${restar} del inventario de la página.` : ""}${encargo ? `\n${encargo === c ? (c === 1 ? "Es" : "Son") : encargo === 1 ? "1 queda" : `${encargo} quedan`} por encargo.` : ""}${c > 1 ? `\nSe prepararán ${c} certificados, uno por pieza.` : ""}`)) return;
  const venta = { numero: "", numeros: [], cantidad: c, creada: new Date().toISOString(), obra: o.slug, sku: o.sku, titulo: o.titulo, tipo,
    anio: $("#vAnio").value.trim(), tecnica: o.tecnica || "", medidasOriginal: medidas(o), inscripcion: o.inscripcion || "",
    material: tipo === "original" ? "" : $("#vMaterial").value.trim(), tamano: tipo === "original" ? "" : $("#vTamano").value.trim(),
    fechaImpresion: tipo === "original" ? "" : $("#vImpresion").value,
    edicion: tipo === "original" ? null : (ed === "numerada" ? { numero: +edN, de: +edDe } : "abierta"),
    comprador: nombre, contacto: $("#vContacto").value.trim(), fechaVenta: fecha,
    monto: $("#vMonto").value.trim(), referenciaPago: $("#vRef").value.trim(), notas: $("#vNotas").value.trim(),
    encargo: encargo > 0, piezasPorEncargo: encargo, inventarioDescontado: restar, anulada: false };
  $("#btnVenta").disabled = true;
  try {
    /* 1. Registro privado: un número de certificado por pieza, seguidos (SA-002-R-0001, -0002…) */
    REG = await actualizar(A.repoVentas, "registro.json", d => {
      d = d || { ventas: [] }; d.ventas = d.ventas || [];
      const pref = `${o.sku}-${tipo === "original" ? "O" : "R"}-`;
      const ult = d.ventas.flatMap(numerosDe).filter(x => x && x.startsWith(pref)).map(x => parseInt(x.slice(pref.length), 10)).reduce((a, b) => Math.max(a, b), 0);
      venta.numeros = Array.from({ length: c }, (_, i) => pref + String(ult + 1 + i).padStart(4, "0"));
      venta.numero = venta.numeros[0];
      d.ventas.push(venta); return d;
    }, `Venta registrada: ${o.sku} (${c} ${c === 1 ? "pieza" : "piezas"})`);
    /* 2. Inventario público (solo la cantidad) */
    if (restar){
      try { INV = await actualizar(A.repoSitio, "inventario.json", d => { d = d || { obras: {} }; d.obras = d.obras || {};
          const x = d.obras[o.slug]; if (Number.isInteger(x)) d.obras[o.slug] = Math.max(0, x - restar); return d; }, `Inventario: venta de «${o.titulo}»`); }
      catch (e) { alert("La venta quedó registrada, pero no se pudo actualizar el inventario. Ajústalo en la pestaña Inventario.\n\n" + e.message); }
    }
    $("#fVenta").reset(); $("#vFecha").value = hoy(); $("#vCantidad").value = 1; $("#fsRepro").hidden = false; $("#edNumerada").hidden = true;
    pintarObras(); pintarInventario(); pintarVentas();
    verCertificado(venta);
  } catch (e) { err.textContent = e.message; }
  finally { $("#btnVenta").disabled = false; }
});

/* ---------- Ventas ---------- */
function pintarVentas(){
  const vs = [...REG.ventas].reverse();
  $("#listaVentas").innerHTML = vs.length ? vs.map(v => { const c = numerosDe(v).length;
    return `<article class="tarjeta venta${v.anulada ? " anulada" : ""}">
      <p class="num">${esc(rango(v))}${v.anulada ? " · ANULADA" : ""}${v.encargo ? " · por encargo" : ""}</p>
      <h3>${esc(v.titulo)}${c > 1 ? ` <small>· ${c} piezas</small>` : ""}</h3>
      <p>${esc(v.comprador)} · ${esc(fechaLarga(v.fechaVenta))}${v.monto ? " · $" + esc(v.monto) : ""}${v.referenciaPago ? " · ATH " + esc(v.referenciaPago) : ""}</p>
      <div class="acc"><button class="btn linea" type="button" data-ver="${esc(v.numero)}">${c > 1 ? `Ver los ${c} certificados` : "Ver certificado"}</button>
      ${v.anulada ? "" : `<button class="enlace" type="button" data-anular="${esc(v.numero)}">Anular</button>`}</div></article>`; }).join("")
    : `<p class="lead">Todavía no hay ventas registradas.</p>`;
}
$("#listaVentas").addEventListener("click", async e => {
  const ver = e.target.closest("[data-ver]"), an = e.target.closest("[data-anular]");
  if (ver) return verCertificado(REG.ventas.find(v => v.numero === ver.dataset.ver));
  if (!an) return;
  const v = REG.ventas.find(x => x.numero === an.dataset.anular), c = numerosDe(v).length, r = descontadas(v);
  if (!confirm(`¿Anular la venta ${rango(v)}?${c > 1 ? `\nSe anulan los ${c} certificados.` : ""}${r ? `\n${r === 1 ? "La pieza vuelve" : `Las ${r} piezas vuelven`} al inventario.` : ""}\n${c > 1 ? "Los números no se vuelven" : "El número no se vuelve"} a usar.`)) return;
  an.disabled = true;
  try {
    REG = await actualizar(A.repoVentas, "registro.json", d => { const x = d.ventas.find(y => y.numero === v.numero); x.anulada = true; x.anuladaEl = new Date().toISOString(); return d; }, `Venta anulada: ${rango(v)}`);
    if (r) INV = await actualizar(A.repoSitio, "inventario.json", d => { d.obras = d.obras || {}; const n = d.obras[v.obra]; if (Number.isInteger(n)) d.obras[v.obra] = n + r; return d; }, `Inventario: venta anulada de «${v.titulo}»`);
    pintarVentas(); pintarInventario(); alCambiarObra(); aviso("Venta anulada.");
  } catch (er) { alert(er.message); an.disabled = false; }
});

/* ---------- Página: datos de la página pública (datos.json en el repositorio del sitio) ---------- */
async function cargarDatos(){ const d = (await leer(A.repoSitio, "datos.json")).datos; if (d){ DAT = d; refrescarObras(); } }
const DEF_DATOS = () => ({ contacto: {}, venta: {}, envio: { es: {}, en: {} }, politicas: { es: {}, en: {} }, obras: {} });
const pinta = v => v === undefined || v === null ? "" : String(v);
/* Campo en dos idiomas: español arriba, inglés debajo */
function bi(k, etq, es, en, op = {}){
  const caja = (l, v) => op.area ? `<textarea data-k="${k}" data-l="${l}" rows="${op.filas || 3}">${esc(v)}</textarea>` : `<input data-k="${k}" data-l="${l}" value="${esc(v)}">`;
  return `<div class="bi"><span class="etq">${etq}</span>${op.nota ? `<p class="nota">${op.nota}</p>` : ""}
    <label class="idi"><span>ES</span>${caja("es", pinta(es))}</label><label class="idi"><span>EN</span>${caja("en", pinta(en))}</label></div>`;
}
const leerBi = (f, ks) => { const r = { es: {}, en: {} }; ks.forEach(k => ["es", "en"].forEach(l => { const el = $(`[data-k="${k}"][data-l="${l}"]`, f); r[l][k] = el ? el.value.trim() : ""; })); return r; };
/* Si cambió el español y el inglés quedó igual, se avisa (en inglés, vacío = se muestra el español) */
function avisoIngles(antes, ahora, ks, nombres){
  const p = ks.filter(k => pinta((antes.es || {})[k]) !== ahora.es[k] && pinta((antes.en || {})[k]) === ahora.en[k] && ahora.es[k] !== "").map(k => nombres[k]);
  return p.length ? `Cambiaste en español: ${p.join(", ")}. Revisa la versión en inglés; si la dejas vacía, la página en inglés muestra tu texto en español.` : "";
}
$$("[data-sub]").forEach(b => b.addEventListener("click", () => {
  $$("[data-sub]").forEach(x => x.setAttribute("aria-pressed", x === b));
  $$("[data-subpanel]").forEach(p => p.hidden = p.dataset.subpanel !== b.dataset.sub);
}));
function pintarPagina(){ pintarListaObras(); pintarEnvio(); pintarContacto(); }

/* Obras */
const TXK = ["tecnica", "subtitulo", "descripcion", "declaracion", "inscripcion", "alt"];
const NOMBRES = { alt: "Descripción de la foto", tecnica: "Técnica", subtitulo: "Subtítulo", descripcion: "Descripción", declaracion: "Tus palabras sobre la obra", inscripcion: "Inscripción" };
const precioTxt = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
function resumenObra(o){
  const vs = o.variantes || [], p = vs.map(v => v.precio).filter(x => x > 0);
  return [o.anio || "Año por confirmar", vs.length ? `${vs.length} ${vs.length === 1 ? "tamaño" : "tamaños"}${p.length ? " · desde " + precioTxt(Math.min(...p)) : " · precio por confirmar"}` : "Sin tamaños de reproducción"].join(" · ");
}
function pintarListaObras(){
  $("#listaObras").innerHTML = `<div class="tarjeta">${OBRAS.map(o => `<button type="button" class="fila-obra" data-editar="${o.slug}">
    <img src="${esc(src(o.imagen))}" alt="" loading="lazy"><span class="t">${esc(o.titulo)}<small>${esc(resumenObra(o))}</small></span><span class="ir" aria-hidden="true">›</span></button>`).join("")}</div>`;
}
$("#listaObras").addEventListener("click", e => { const b = e.target.closest("[data-editar]"); if (b) editarObra(b.dataset.editar); });
const MATERIALES = ["lienzo", "papel de arte", "papel"], TIPOS = ["giclée"], ACABADOS = ["mate", "satinado", "brillo", "con bastidor", "sin bastidor", "enrollado"];
const lista = (id, xs) => `<datalist id="${id}">${xs.map(x => `<option value="${esc(x)}">`).join("")}</datalist>`;
function filaVariante(v = {}){
  return `<div class="variante" data-var>
    <div class="tres"><label>Ancho<input data-v="ancho" inputmode="decimal" value="${pinta(v.ancho)}"></label><label>Alto<input data-v="alto" inputmode="decimal" value="${pinta(v.alto)}"></label>
      <label>Unidad<select data-v="unidad"><option value="in"${v.unidad !== "cm" ? " selected" : ""}>pulg</option><option value="cm"${v.unidad === "cm" ? " selected" : ""}>cm</option></select></label></div>
    <div class="dos"><label>Material<input data-v="material" list="dlMat" value="${esc(pinta(v.material))}" placeholder="lienzo"></label><label>Tipo<input data-v="tipo" list="dlTipo" value="${esc(pinta(v.tipo))}" placeholder="giclée"></label></div>
    <div class="dos"><label>Acabado<input data-v="acabado" list="dlAcab" value="${esc(pinta(v.acabado))}" placeholder="mate"></label><label>Precio (USD)<input data-v="precio" inputmode="decimal" value="${v.precio ? pinta(v.precio) : ""}" placeholder="vacío = por confirmar"></label></div>
    <div class="var-pie"><label class="check"><input type="checkbox" data-v="disponible"${v.disponible === false ? "" : " checked"}> <span>Disponible para ordenar</span></label>
      <button type="button" class="enlace" data-quitar>Quitar este tamaño</button></div></div>`;
}
let EDITANDO = null;
function editarObra(slug){
  const o = porSlug(slug), d = ((DAT || {}).obras || {})[slug] || {}, t = d.textos || { es: {}, en: {} }, m = o.medidas || {};
  EDITANDO = { slug, variantes: JSON.parse(JSON.stringify(o.variantes || [])), textos: JSON.parse(JSON.stringify(t)) };
  const f = $("#fObra");
  f.innerHTML = `<p class="volver"><button type="button" class="enlace" data-cerrar-obra>← Todas las obras</button></p>
    <div class="cab-obra"><img src="${esc(src(o.imagen))}" alt=""><div><span class="num">${esc(o.sku)}</span><h2>${esc(o.titulo)}</h2></div></div>
    <fieldset><legend>Fotos y video</legend><div id="fotosObra"></div>
      <label for="oVideo">Video de la obra <span class="opc">(opcional)</span></label>
      <input id="oVideo" inputmode="url" autocapitalize="off" value="${esc(videoTxt(o.video))}" placeholder="Enlace de YouTube o de Instagram">
      <p class="nota">Pega el enlace del video en YouTube o en Instagram. Vacío = no se muestra video.</p>
      ${bi("alt", "Descripción de la foto principal", t.es && t.es.alt, t.en && t.en.alt, { area: true, filas: 2, nota: "Lo que se ve en la pintura, para personas ciegas que usan lectores de pantalla." })}
    </fieldset>
    <fieldset><legend>La obra original</legend>
      <label for="oTitulo">Título</label><input id="oTitulo" value="${esc(o.titulo)}">
      <p class="nota">El título es el mismo en los dos idiomas. La dirección de la página de la obra no cambia.</p>
      <label for="oAnio">Año</label><input id="oAnio" inputmode="numeric" value="${esc(pinta(o.anio))}" placeholder="Ej.: 2020">
      <span class="etq">Medidas de la pintura original</span>
      <div class="tres"><label>Ancho<input id="oAncho" inputmode="decimal" value="${pinta(m.ancho)}"></label><label>Alto<input id="oAlto" inputmode="decimal" value="${pinta(m.alto)}"></label>
        <label>Unidad<select id="oUnidad"><option value="in"${m.unidad !== "cm" ? " selected" : ""}>pulg</option><option value="cm"${m.unidad === "cm" ? " selected" : ""}>cm</option></select></label></div>
    </fieldset>
    <fieldset><legend>Textos</legend>
      ${bi("tecnica", "Técnica", t.es && t.es.tecnica, t.en && t.en.tecnica)}
      ${bi("subtitulo", "Subtítulo", t.es && t.es.subtitulo, t.en && t.en.subtitulo, { nota: "Opcional. Una frase corta debajo del título." })}
      ${bi("descripcion", "Descripción", t.es && t.es.descripcion, t.en && t.en.descripcion, { area: true, filas: 4 })}
      ${bi("declaracion", "Tus palabras sobre la obra", t.es && t.es.declaracion, t.en && t.en.declaracion, { area: true, filas: 4, nota: "Se muestran como una cita tuya. Si dejas el inglés vacío, la página en inglés muestra tu texto en español." })}
      ${bi("inscripcion", "Inscripción en la obra", t.es && t.es.inscripcion, t.en && t.en.inscripcion, { nota: "Si la pintura tiene palabras escritas." })}
    </fieldset>
    <fieldset><legend>Tamaños de reproducción a la venta</legend>
      <p class="nota">Cada tamaño aparece como una opción en la ficha. Sin precio, la página dice “por confirmar”.</p>
      <div id="variantes">${EDITANDO.variantes.map(filaVariante).join("")}</div>
      <button type="button" class="btn linea" data-anadir>+ Añadir un tamaño</button>
      ${lista("dlMat", MATERIALES)}${lista("dlTipo", TIPOS)}${lista("dlAcab", ACABADOS)}
    </fieldset>
    <button class="btn oro" type="submit" id="btnObra">Guardar cambios</button>
    <p class="error" id="errObra" role="alert"></p><p class="nota" id="notaObra"></p>`;
  $("#listaObras").hidden = true; f.hidden = false; pintarFotos(); scrollTo(0, 0);
}
$("#fObra").addEventListener("click", e => {
  if (e.target.closest("[data-cerrar-obra]")){ $("#fObra").hidden = true; $("#listaObras").hidden = false; EDITANDO = null; return; }
  if (e.target.closest("[data-anadir]")){ $("#variantes").insertAdjacentHTML("beforeend", filaVariante()); EDITANDO.variantes.push({}); return; }
  const q = e.target.closest("[data-quitar]");
  if (q){ const filas = $$("[data-var]", $("#variantes")), i = filas.indexOf(q.closest("[data-var]")); filas[i].remove(); EDITANDO.variantes.splice(i, 1); }
});
const num = s => { const t = String(s).trim().replace(",", "."); return t === "" ? null : /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
$("#fObra").addEventListener("submit", async ev => {
  ev.preventDefault();
  const f = $("#fObra"), err = $("#errObra"), slug = EDITANDO.slug; err.textContent = ""; $("#notaObra").textContent = "";
  const titulo = $("#oTitulo").value.trim(), anio = $("#oAnio").value.trim(), an = num($("#oAncho").value), al = num($("#oAlto").value);
  if (!titulo) return err.textContent = "La obra necesita un título.";
  if (anio && !/^\d{4}$/.test(anio)) return err.textContent = "Escribe el año con cuatro números (por ejemplo, 2020), o déjalo vacío.";
  if (Number.isNaN(an) || Number.isNaN(al) || (an === null) !== (al === null) || an === 0 || al === 0) return err.textContent = "Revisa las medidas: escribe el ancho y el alto con números, o deja los dos vacíos.";
  const variantes = [];
  for (const [i, fila] of $$("[data-var]", $("#variantes")).entries()){
    const g = k => $(`[data-v="${k}"]`, fila), a = num(g("ancho").value), h = num(g("alto").value), p = num(g("precio").value);
    if (a === null && h === null && !g("material").value.trim() && p === null) continue;   // fila vacía: se ignora
    if (!a || !h || Number.isNaN(a) || Number.isNaN(h)) return err.textContent = `Tamaño ${i + 1}: escribe el ancho y el alto con números.`;
    if (Number.isNaN(p)) return err.textContent = `Tamaño ${i + 1}: el precio debe ser un número, sin el signo $.`;
    variantes.push({ ...(EDITANDO.variantes[i] || {}), ancho: a, alto: h, unidad: g("unidad").value, material: g("material").value.trim(), tipo: g("tipo").value.trim(),
      acabado: g("acabado").value.trim(), precio: p || 0, disponible: g("disponible").checked });
  }
  const textos = leerBi(f, TXK), aviso2 = avisoIngles(EDITANDO.textos, textos, TXK, NOMBRES);
  const video = leerVideo($("#oVideo").value);
  if (video === null) return err.textContent = "El video debe ser un enlace de YouTube o de Instagram.";
  const nuevo = { titulo, anio, medidas: an === null ? null : { ancho: an, alto: al, unidad: $("#oUnidad").value }, variantes, textos, video };
  const o = porSlug(slug), cambiaTitulo = titulo !== o.titulo;
  $("#btnObra").disabled = true;
  try {
    if (cambiaTitulo){   /* el título sale en la imagen para compartir: se rehace en el mismo cambio */
      $("#notaObra").textContent = "Preparando la imagen para compartir con el título nuevo…";
      const base = lienzo(await cargarURL(src(o.imagen)), 0, 1600), st = sello();
      const og = { es: `og-${slug}-${st}.jpg`, en: `og-en-${slug}-${st}.jpg` };
      const ogEs = await aBlob(crearOG(base, titulo, "es")), ogEn = await aBlob(crearOG(base, titulo, "en"));
      DAT = await cambiarDatos(slug, x => ({ ...x, ...nuevo, og }), `Página: «${titulo}» actualizada desde la herramienta de Luciann`,
        [{ ruta: og.es, blob: ogEs }, { ruta: og.en, blob: ogEn }], x => viejas(x.og ? [x.og.es, x.og.en] : []));
    } else
    DAT = await actualizar(A.repoSitio, "datos.json", d => { d = d || DEF_DATOS(); d.obras = d.obras || {}; d.obras[slug] = { ...(d.obras[slug] || {}), ...nuevo }; return d; },
      `Página: «${titulo}» actualizada desde la herramienta de Luciann`);
    refrescarObras(); pintarObras(); pintarInventario(); pintarListaObras();
    EDITANDO.textos = textos; EDITANDO.variantes = variantes;
    $("#notaObra").textContent = aviso2; aviso("Guardado. La página se actualiza en uno o dos minutos.");
  } catch (e) { err.textContent = e.message; }
  finally { $("#btnObra").disabled = false; }
});

/* ---------- Fotos: se preparan en el teléfono (tamaño para la página, sin datos de ubicación) ----------
   Nunca se agranda una foto ni se recorta la pintura. Cada cambio de fotos es UN solo cambio en GitHub:
   las fotos nuevas, sus vistas previas y datos.json juntos, para que la página nunca muestre una foto que falta. */
const PREVIEW = {};                                   // fotos recién subidas: se ven aquí antes de que la página termine de publicarse
const src = r => PREVIEW[r] || r;
const sello = () => new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const versionada = r => /-\d{14}(-800)?\.jpg$/.test(r || "");         // solo se borran fotos subidas desde esta herramienta
const viejas = rs => rs.filter(versionada).flatMap(r => [r, r.replace(/\.jpg$/, "-800.jpg")]);
function videoTxt(v){ if (!v) return ""; return /^[\w-]{11}$/.test(v) ? "https://youtu.be/" + v : v; }
function leerVideo(t){
  t = t.trim(); if (!t) return "";
  let m = t.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i); if (m) return m[1];
  m = t.match(/^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|reels|tv)\/([\w-]+)/i); if (m) return `https://www.instagram.com/${m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase()}/${m[2]}/`;
  return null;
}
const cargarURL = u => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("No se pudo abrir la foto.")); i.src = u; });
function lienzo(img, giro, lado){
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, rot = giro % 180 !== 0, W = rot ? h0 : w0, H = rot ? w0 : h0, k = Math.min(1, lado / Math.max(W, H));
  const c = document.createElement("canvas"); c.width = Math.round(W * k); c.height = Math.round(H * k);
  const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.translate(c.width / 2, c.height / 2); g.rotate(giro * Math.PI / 180);
  const dw = rot ? c.height : c.width, dh = rot ? c.width : c.height; g.drawImage(img, -dw / 2, -dh / 2, dw, dh); return c;
}
const aBlob = (c, q = .86) => new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error("No se pudo preparar la foto.")), "image/jpeg", q));
const aB64 = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.readAsDataURL(b); });
/* Imagen para compartir en redes (1200 × 630), con el mismo diseño de las que ya tiene la página */
function crearOG(obra, titulo, l){
  const c = document.createElement("canvas"); c.width = 1200; c.height = 630; const g = c.getContext("2d");
  g.fillStyle = "#16110D"; g.fillRect(0, 0, 1200, 630);
  const rg = g.createRadialGradient(830, 315, 0, 830, 315, 640); rg.addColorStop(0, "#2E241A"); rg.addColorStop(1, "rgba(22,17,13,0)"); g.fillStyle = rg; g.fillRect(0, 0, 1200, 630);
  const hz = obra.width > obra.height, [x0, y0, x1, y1] = hz ? [470, 60, 1160, 570] : [640, 40, 1120, 590];
  const k = Math.min((x1 - x0 - 16) / obra.width, (y1 - y0 - 16) / obra.height), w = Math.round(obra.width * k), h = Math.round(obra.height * k);
  const px = Math.round((x0 + x1) / 2 - w / 2), py = Math.round((y0 + y1) / 2 - h / 2);
  g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 36; g.shadowOffsetY = 18; g.fillStyle = "#F6F0E4"; g.fillRect(px - 7, py - 7, w + 13, h + 13); g.restore();
  g.drawImage(obra, px, py, w, h);
  g.textBaseline = "top"; g.fillStyle = "#D6B778"; g.font = '30px "Bodoni Moda", Georgia, serif'; g.fillText("Soto’s Art", 70, 88);
  const maxW = (hz ? x0 : x0) - 110; let tam = hz ? 52 : 62, lineas;
  for (;;){ g.font = `${tam}px "Bodoni Moda", Georgia, serif`; const ps = titulo.split(/\s+/); lineas = [];
    let cur = ""; ps.forEach(p => { const t = cur ? cur + " " + p : p; if (g.measureText(t).width > maxW && cur){ lineas.push(cur); cur = p; } else cur = t; }); lineas.push(cur);
    if ((lineas.length <= 3 && lineas.every(x => g.measureText(x).width <= maxW)) || tam <= 34) break; tam -= 4; }
  g.fillStyle = "#F4ECDE"; let y = 200; lineas.forEach(x => { g.fillText(x, 68, y); y += tam + 10; });
  const [a, b] = l === "en" ? ["A painting by Luciann Soto", "High-quality reproductions"] : ["Una pintura de Luciann Soto", "Reproducciones de alta calidad"];
  g.font = "25px Karla, Helvetica, Arial, sans-serif"; g.fillStyle = "#D6CCBC"; g.fillText(a, 70, y + 22);
  g.font = "22px Karla, Helvetica, Arial, sans-serif"; g.fillStyle = "#B4A896"; g.fillText(b, 70, y + 60);
  return c;
}
/* Un solo cambio en GitHub con varios archivos (fotos + datos.json), usando la API de Git */
async function commitArchivos(repo, preparar, mensaje){
  for (let intento = 0; intento < 3; intento++){
    const ref = await gh(`/repos/${repo}/git/ref/heads/${A.rama}`), base = ref.object.sha, com = await gh(`/repos/${repo}/git/commits/${base}`);
    const leerEn = async ruta => { try { const j = await gh(`/repos/${repo}/contents/${ruta}?ref=${base}`); return JSON.parse(deb64(j.content)); } catch (e) { if (e.status === 404) return null; throw e; } };
    const cambios = await preparar(leerEn), arbol = [];
    for (const c of cambios){
      if (c.borrar){ arbol.push({ path: c.ruta, mode: "100644", type: "blob", sha: null }); continue; }
      const contenido = c.blob ? await aB64(c.blob) : b64(c.texto);
      const bl = await gh(`/repos/${repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content: contenido, encoding: "base64" }) });
      arbol.push({ path: c.ruta, mode: "100644", type: "blob", sha: bl.sha });
    }
    const tr = await gh(`/repos/${repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: com.tree.sha, tree: arbol }) });
    const nc = await gh(`/repos/${repo}/git/commits`, { method: "POST", body: JSON.stringify({ message: mensaje, tree: tr.sha, parents: [base] }) });
    try { await gh(`/repos/${repo}/git/refs/heads/${A.rama}`, { method: "PATCH", body: JSON.stringify({ sha: nc.sha, force: false }) }); return cambios; }
    catch (e) { if (e.status !== 422 && e.status !== 409) throw e; }
  }
  throw new ErrorGH(409, "Otro cambio se guardó al mismo tiempo. Vuelve a intentarlo.");
}
/* Cambia los datos de una obra junto con sus archivos; borrar(obraAntes) dice qué archivos viejos se retiran */
async function cambiarDatos(slug, cambiar, mensaje, archivos = [], borrar = () => []){
  let nuevo = null;
  await commitArchivos(A.repoSitio, async leerEn => {
    const d = (await leerEn("datos.json")) || DEF_DATOS(); d.obras = d.obras || {};
    const antes = d.obras[slug] || {}; d.obras[slug] = cambiar({ ...antes }); nuevo = d;
    const subidos = new Set(archivos.map(a => a.ruta)), retirar = borrar(antes).filter(r => !subidos.has(r));
    return [...archivos, ...retirar.map(r => ({ ruta: r, borrar: true })), { ruta: "datos.json", texto: JSON.stringify(d, null, 2) + "\n" }];
  }, mensaje);
  archivos.forEach(a => { if (a.blob) PREVIEW[a.ruta] = URL.createObjectURL(a.blob); });
  return nuevo;
}

const TIPOS_FOTO = { detalle: "Detalle de la pintura", proceso: "En proceso", espacio: "La obra original en un espacio" };
function pintarFotos(){
  const o = porSlug(EDITANDO.slug), d = ((DAT || {}).obras || {})[o.slug] || {}, fotos = d.fotos || [];
  $("#fotosObra").innerHTML = `
    <div class="foto-slot"><img src="${esc(src(o.imagen))}" alt=""><div><b>Foto principal</b><small>${o.w} × ${o.h} px${o.enmarcada ? " · el Modo museo usa la foto con marco" : ""}</small>
      <button type="button" class="btn linea" data-elegir="principal">Cambiar la foto</button></div></div>
    <div class="foto-slot">${o.ambiente ? `<img src="${esc(src(o.ambiente.imagen))}" alt="">` : `<span class="foto-vacia" aria-hidden="true">+</span>`}
      <div><b>La obra original en un hogar</b><small>Se muestra como inspiración, nunca como la reproducción.</small>
      <button type="button" class="btn linea" data-elegir="ambiente">${o.ambiente ? "Cambiar" : "Añadir"}</button>${o.ambiente ? ` <button type="button" class="enlace" data-quitar-ambiente>Quitar</button>` : ""}</div></div>
    <span class="etq">Más fotos de la obra</span>
    ${fotos.map((f, i) => `<div class="foto-extra" data-extra="${i}"><img src="${esc(src(f.imagen))}" alt="">
      <div><label>Tipo<select data-fx="tipo">${Object.entries(TIPOS_FOTO).map(([k, n]) => `<option value="${k}"${f.tipo === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="idi"><span>ES</span><input data-fx="es" value="${esc((f.pie || {}).es || "")}" placeholder="Pie de foto (opcional)"></label>
      <label class="idi"><span>EN</span><input data-fx="en" value="${esc((f.pie || {}).en || "")}" placeholder="Caption (optional)"></label>
      <div class="var-pie"><button type="button" class="btn linea" data-guardar-extra="${i}">Guardar</button><button type="button" class="enlace" data-quitar-extra="${i}">Quitar esta foto</button></div></div></div>`).join("")}
    <button type="button" class="btn linea" data-elegir="extra">+ Añadir una foto</button>
    <div id="nuevaFoto" hidden></div>
    <input type="file" id="archivoFoto" accept="image/*" hidden>
    <p class="error" id="errFoto" role="alert"></p>`;
}
let ELEGIDA = null;
$("#fObra").addEventListener("click", async e => {
  const el = e.target.closest("[data-elegir]");
  if (el){ ELEGIDA = { modo: el.dataset.elegir, giro: 0 }; $("#archivoFoto").value = ""; $("#archivoFoto").click(); return; }
  if (e.target.closest("[data-girar]")){ ELEGIDA.giro = (ELEGIDA.giro + (+e.target.closest("[data-girar]").dataset.girar) + 360) % 360; return vistaPrevia(); }
  if (e.target.closest("[data-cancelar-foto]")){ ELEGIDA = null; $("#nuevaFoto").hidden = true; return; }
  if (e.target.closest("[data-publicar-foto]")) return publicarFoto(e.target.closest("[data-publicar-foto]"));
  const qa = e.target.closest("[data-quitar-ambiente]"), qx = e.target.closest("[data-quitar-extra]"), gx = e.target.closest("[data-guardar-extra]");
  if (!qa && !qx && !gx) return;
  const o = porSlug(EDITANDO.slug), errF = $("#errFoto"); errF.textContent = "";
  try {
    if (qa){ if (!confirm("¿Quitar la foto de la obra en un hogar?")) return; qa.disabled = true;
      DAT = await cambiarDatos(o.slug, x => ({ ...x, ambiente: null }), `Fotos: se quitó la foto en un hogar de «${o.titulo}»`, [], x => x.ambiente ? [x.ambiente.imagen].filter(versionada) : []); }
    if (qx){ const i = +qx.dataset.quitarExtra, f = ((DAT.obras[o.slug] || {}).fotos || [])[i]; if (!f || !confirm("¿Quitar esta foto de la página?")) return; qx.disabled = true;
      DAT = await cambiarDatos(o.slug, x => ({ ...x, fotos: (x.fotos || []).filter(y => y.imagen !== f.imagen) }), `Fotos: se quitó una foto de «${o.titulo}»`, [], () => viejas([f.imagen])); }
    if (gx){ const i = +gx.dataset.guardarExtra, caja = $(`[data-extra="${i}"]`), f = DAT.obras[o.slug].fotos[i], g = k => $(`[data-fx="${k}"]`, caja).value.trim(); gx.disabled = true;
      DAT = await actualizar(A.repoSitio, "datos.json", d => { const y = ((d.obras[o.slug] || {}).fotos || []).find(z => z.imagen === f.imagen); if (y){ y.tipo = g("tipo"); y.pie = { es: g("es"), en: g("en") }; } return d; },
        `Fotos: pie de foto de «${o.titulo}»`); }
    refrescarObras(); pintarFotos(); pintarListaObras(); aviso("Guardado. La página se actualiza en uno o dos minutos.");
  } catch (x) { errF.textContent = x.message; }
});
$("#fObra").addEventListener("change", async e => {
  if (e.target.id !== "archivoFoto" || !e.target.files[0]) return;
  const errF = $("#errFoto"); errF.textContent = "";
  try { ELEGIDA.img = await cargarURL(URL.createObjectURL(e.target.files[0])); vistaPrevia(); }
  catch (x) { errF.textContent = "No se pudo abrir esa foto. Prueba con otra o hazle una captura de pantalla primero."; }
});
function vistaPrevia(){
  const E = ELEGIDA, o = porSlug(EDITANDO.slug), c = lienzo(E.img, E.giro, 640), W = E.giro % 180 ? E.img.naturalHeight : E.img.naturalWidth, H = E.giro % 180 ? E.img.naturalWidth : E.img.naturalHeight, lado = Math.max(W, H);
  const titulo = { principal: "Foto principal nueva", ambiente: "La obra original en un hogar", extra: "Foto nueva" }[E.modo];
  const chica = lado < 600, regular = lado < 1200;
  const caja = $("#nuevaFoto"); caja.hidden = false;
  caja.innerHTML = `<div class="nueva-foto"><b>${titulo}</b>
    <div class="nf-previa"></div>
    <div class="nf-girar"><button type="button" class="btn linea" data-girar="-90" aria-label="Girar a la izquierda">⟲ Girar</button><button type="button" class="btn linea" data-girar="90" aria-label="Girar a la derecha">Girar ⟳</button></div>
    <p class="nota">Mide ${W} × ${H} px. ${lado > 1600 ? "Se reducirá a 1600 px para la página; la pintura no se recorta." : "Se usará en su tamaño; nunca se agranda."} Esta copia es para la página: no sirve para imprimir reproducciones.</p>
    ${chica ? `<p class="error">La foto es muy pequeña (menos de 600 px). Busca una de mayor tamaño.</p>` : regular ? `<p class="aviso-amarillo">La foto es pequeña: puede verse algo borrosa en pantallas grandes. Si tienes una de mayor tamaño, mejor.</p>` : ""}
    ${E.modo === "principal" && o.enmarcada ? `<label class="check"><input type="checkbox" id="nfMarco" checked> <span>Usar esta foto también en el Modo museo, en lugar de la foto con marco</span></label>` : ""}
    ${E.modo === "extra" ? `<label>Tipo<select id="nfTipo">${Object.entries(TIPOS_FOTO).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
      <label class="idi"><span>ES</span><input id="nfPieEs" placeholder="Pie de foto (opcional)"></label><label class="idi"><span>EN</span><input id="nfPieEn" placeholder="Caption (optional)"></label>` : ""}
    <div class="nf-acciones"><button type="button" class="btn oro" data-publicar-foto${chica ? " disabled" : ""}>Publicar esta foto</button><button type="button" class="enlace" data-cancelar-foto>Cancelar</button></div></div>`;
  c.className = "nf-lienzo"; $(".nf-previa", caja).appendChild(c);
  caja.scrollIntoView({ block: "start", behavior: "smooth" });
}
async function publicarFoto(btn){
  const E = ELEGIDA, o = porSlug(EDITANDO.slug), errF = $("#errFoto"), st = sello(); errF.textContent = ""; btn.disabled = true; btn.textContent = "Preparando la foto…";
  try {
    if (E.modo === "principal"){
      const c = lienzo(E.img, E.giro, 1600), c8 = lienzo(E.img, E.giro, 800), img = `obra-${o.slug}-${st}.jpg`, og = { es: `og-${o.slug}-${st}.jpg`, en: `og-en-${o.slug}-${st}.jpg` };
      await document.fonts.load('62px "Bodoni Moda"').catch(() => {}); await document.fonts.load("25px Karla").catch(() => {});
      const arch = [{ ruta: img, blob: await aBlob(c) }, { ruta: img.replace(/\.jpg$/, "-800.jpg"), blob: await aBlob(c8) },
        { ruta: og.es, blob: await aBlob(crearOG(c, o.titulo, "es")) }, { ruta: og.en, blob: await aBlob(crearOG(c, o.titulo, "en")) }];
      const quitarMarco = !!($("#nfMarco") && $("#nfMarco").checked); btn.textContent = "Publicando…";
      DAT = await cambiarDatos(o.slug, x => ({ ...x, imagen: img, w: c.width, h: c.height, og, ...(quitarMarco ? { enmarcada: null } : {}) }),
        `Fotos: foto principal nueva de «${o.titulo}»`, arch, x => viejas([x.imagen, ...(x.og ? [x.og.es, x.og.en] : [])]));
    } else if (E.modo === "ambiente"){
      const c = lienzo(E.img, E.giro, 1400), img = `ambiente-${o.slug}-${st}.jpg`; btn.textContent = "Publicando…";
      DAT = await cambiarDatos(o.slug, x => ({ ...x, ambiente: { imagen: img, w: c.width, h: c.height } }), `Fotos: foto en un hogar de «${o.titulo}»`,
        [{ ruta: img, blob: await aBlob(c) }], x => x.ambiente ? [x.ambiente.imagen].filter(versionada) : []);
    } else {
      const c = lienzo(E.img, E.giro, 1600), c8 = lienzo(E.img, E.giro, 800), img = `foto-${o.slug}-${st}.jpg`;
      const f = { imagen: img, w: c.width, h: c.height, tipo: $("#nfTipo").value, pie: { es: $("#nfPieEs").value.trim(), en: $("#nfPieEn").value.trim() } };
      btn.textContent = "Publicando…";
      DAT = await cambiarDatos(o.slug, x => ({ ...x, fotos: [...(x.fotos || []), f] }), `Fotos: foto nueva de «${o.titulo}»`,
        [{ ruta: img, blob: await aBlob(c) }, { ruta: img.replace(/\.jpg$/, "-800.jpg"), blob: await aBlob(c8) }]);
    }
    ELEGIDA = null; refrescarObras(); pintarFotos(); pintarListaObras(); pintarInventario(); pintarObras();
    aviso("Foto publicada. La página se actualiza en uno o dos minutos.");
  } catch (x) { errF.textContent = x.message; btn.disabled = false; btn.textContent = "Publicar esta foto"; }
}

/* Envío y políticas */
const ENV = ["destinos", "costo", "preparacion", "entrega", "recogido"], POL = ["cancelaciones", "devoluciones", "danos", "marco", "confirmacion", "privacidad"];
const N_ENV = { destinos: "A dónde envías", costo: "Costo de envío", preparacion: "Tiempo de preparación", entrega: "Tiempo de entrega", recogido: "Recogido en persona" };
const N_POL = { cancelaciones: "Cancelaciones", devoluciones: "Devoluciones", danos: "Si la pieza llega dañada", marco: "Marco", confirmacion: "Confirmación de la orden", privacidad: "Privacidad" };
const AYUDA = { destinos: "Ej.: Puerto Rico y Estados Unidos.", costo: "Ej.: $15 en Puerto Rico.", preparacion: "Ej.: 5 a 7 días laborables.", recogido: "Si se puede recoger en persona y dónde (sin dirección exacta).",
  marco: "Si la reproducción incluye marco o no.", confirmacion: "Cómo y cuándo confirmas cada orden." };
let ENV_ANTES = null;
function pintarEnvio(){
  const d = DAT || DEF_DATOS(), e = d.envio || {}, p = d.politicas || {};
  ENV_ANTES = { es: { ...(e.es || {}), ...(p.es || {}) }, en: { ...(e.en || {}), ...(p.en || {}) } };
  $("#fEnvio").innerHTML = `<p class="nota">Vacío = la página dice “por confirmar”.</p>
    <fieldset><legend>Envío</legend>${ENV.map(k => bi("e_" + k, N_ENV[k], (e.es || {})[k], (e.en || {})[k], { area: true, filas: 2, nota: AYUDA[k] })).join("")}</fieldset>
    <fieldset><legend>Políticas</legend>${POL.map(k => bi("p_" + k, N_POL[k], (p.es || {})[k], (p.en || {})[k], { area: true, filas: 3, nota: AYUDA[k] })).join("")}</fieldset>
    <button class="btn oro" type="submit" id="btnEnvio">Guardar envío y políticas</button>
    <p class="error" id="errEnvio" role="alert"></p><p class="nota" id="notaEnvio"></p>`;
}
$("#fEnvio").addEventListener("submit", async ev => {
  ev.preventDefault(); const f = $("#fEnvio"), err = $("#errEnvio"); err.textContent = "";
  const e = leerBi(f, ENV.map(k => "e_" + k)), p = leerBi(f, POL.map(k => "p_" + k)), quita = (o, pre) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.slice(pre.length), v]));
  const envio = { es: quita(e.es, "e_"), en: quita(e.en, "e_") }, politicas = { es: quita(p.es, "p_"), en: quita(p.en, "p_") };
  const ahora = { es: { ...envio.es, ...politicas.es }, en: { ...envio.en, ...politicas.en } }, aviso2 = avisoIngles(ENV_ANTES, ahora, [...ENV, ...POL], { ...N_ENV, ...N_POL });
  $("#btnEnvio").disabled = true;
  try { DAT = await actualizar(A.repoSitio, "datos.json", d => ({ ...(d || DEF_DATOS()), envio, politicas }), "Página: envío y políticas actualizados desde la herramienta de Luciann");
    ENV_ANTES = ahora; $("#notaEnvio").textContent = aviso2; aviso("Guardado. La página se actualiza en uno o dos minutos."); }
  catch (x) { err.textContent = x.message; } finally { $("#btnEnvio").disabled = false; }
});

/* Contacto y pago */
function pintarContacto(){
  const c = { telefono: CONFIG.telefono, whatsapp: CONFIG.whatsapp, correo: CONFIG.correo, instagram: CONFIG.instagram, facebook: CONFIG.facebook, ...((DAT || {}).contacto || {}) };
  const v = { athMovilNumero: CONFIG.athMovilNumero, certificado: CONFIG.certificado, ...((DAT || {}).venta || {}) };
  const campo = (id, etq, val, nota = "", extra = "") => `<label for="${id}">${etq}</label><input id="${id}" value="${esc(pinta(val))}" ${extra}>${nota ? `<p class="nota">${nota}</p>` : ""}`;
  $("#fContacto").innerHTML = `<fieldset><legend>Contacto para compradores</legend>
      ${campo("cTel", "Teléfono", c.telefono, "Ej.: 787-690-6865", 'inputmode="tel"')}
      ${campo("cWa", "WhatsApp", c.whatsapp, "Solo números, con el 1 delante: 17876906865. Vacío = no se muestra el botón de WhatsApp.", 'inputmode="numeric"')}
      ${campo("cCorreo", "Correo", c.correo, "", 'inputmode="email" autocapitalize="off"')}
      ${campo("cIg", "Instagram", c.instagram, "Sin la @.", 'autocapitalize="off"')}
      ${campo("cFb", "Facebook", c.facebook, "El enlace completo de tu página, o vacío.", 'inputmode="url" autocapitalize="off"')}</fieldset>
    <fieldset><legend>Pago y certificado</legend>
      ${campo("cAth", "Número de ATH Móvil", v.athMovilNumero, "Vacío = no se muestra el pago por ATH Móvil.", 'inputmode="tel"')}
      <label class="check"><input type="checkbox" id="cCert"${v.certificado ? " checked" : ""}> <span>Anunciar el certificado de autenticidad en la página</span></label></fieldset>
    <button class="btn oro" type="submit" id="btnContacto">Guardar contacto y pago</button>
    <p class="error" id="errContacto" role="alert"></p>`;
}
$("#fContacto").addEventListener("submit", async ev => {
  ev.preventDefault(); const err = $("#errContacto"); err.textContent = "";
  const g = id => $("#" + id).value.trim();
  const contacto = { telefono: g("cTel"), whatsapp: g("cWa").replace(/\D/g, ""), correo: g("cCorreo"), instagram: g("cIg").replace(/^@/, ""), facebook: g("cFb") };
  if (contacto.whatsapp && !/^1\d{10}$/.test(contacto.whatsapp)) return err.textContent = "WhatsApp: escribe 11 números, empezando con 1 (por ejemplo, 17876906865).";
  if (contacto.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contacto.correo)) return err.textContent = "Revisa el correo.";
  if (contacto.facebook && !/^https:\/\//.test(contacto.facebook)) return err.textContent = "Facebook: pega el enlace completo, que empieza con https://";
  const venta = { athMovilNumero: g("cAth"), certificado: $("#cCert").checked };
  $("#btnContacto").disabled = true;
  try { DAT = await actualizar(A.repoSitio, "datos.json", d => ({ ...(d || DEF_DATOS()), contacto, venta: { ...((d || {}).venta || {}), ...venta } }), "Página: contacto y pago actualizados desde la herramienta de Luciann");
    refrescarObras(); aviso("Guardado. La página se actualiza en uno o dos minutos."); }
  catch (x) { err.textContent = x.message; } finally { $("#btnContacto").disabled = false; }
});

/* ---------- Certificado ---------- */
const linea = (etq, valor, ancho = "") => `<div class="c-campo ${ancho}"><span class="c-etq">${etq}</span><span class="c-val">${valor ? esc(valor) : "&nbsp;"}</span></div>`;
const casilla = (t, on) => `<span class="c-casilla${on ? " on" : ""}"><i></i>${t}</span>`;
function verCertificado(v){
  const nums = numerosDe(v);
  $("#cert").innerHTML = (v.anulada ? `<p class="c-anulado-aviso">Esta venta fue anulada. ${nums.length > 1 ? "Los certificados no son válidos." : "El certificado no es válido."}</p>` : "")
    + (nums.length > 1 ? `<p class="nota cert-cuantos">${nums.length} certificados, uno por pieza: ${esc(rango(v))}.</p>` : "")
    + nums.map((num, i) => hojas(v, num, edicionDe(v, i))).join("");
  mostrar("vCert"); escalar(); scrollTo(0, 0);
}
function hojas(v, numero, ed){
  const o = porSlug(v.obra) || {}, repro = v.tipo === "reproduccion";
  const edicion = !repro ? "" : ed === "abierta" ? `${casilla("Edición abierta", true)}` : ed ? `N.º <b>${ed.numero}</b> de <b>${ed.de}</b>` : "";
  const pie = (p) => `<footer class="c-pie"><span>SOTO’S ART · Certificado de autenticidad · ${esc(numero)}</span><span>Página ${p} de 2</span></footer>`;
  return `<article class="c-hoja${v.anulada ? " c-anulado" : ""}"><div class="c-marco">
    <img class="c-logo" src="admin-logo.jpg" alt="Soto’s Art – Blessing Art">
    <h1>Certificado de autenticidad</h1><p class="c-sub">Registro de la pieza</p><hr class="c-filete">
    <p class="c-declara">Por medio de este documento, certifico que la pieza descrita a continuación corresponde a una obra original creada por mí o a una reproducción autorizada, revisada y firmada por mí, según se indica en «Tipo de pieza».</p>
    <div class="c-cabeza"><div><span class="c-etq">Número de certificado</span><span class="c-numero">${esc(numero)}</span></div>
      <div><span class="c-etq">Tipo de pieza</span>${casilla("Obra original", !repro)} ${casilla("Reproducción autorizada", repro)}</div></div>
    <h2 class="c-seccion"><span>La obra original</span></h2>
    <div class="c-obra"><figure><img src="${esc(src(o.imagen || ""))}" alt=""><figcaption>Imagen de referencia de la obra</figcaption></figure>
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
      <small>Para verificar este certificado, escribe a la artista con el número ${esc(numero)}.</small></div>
    <div class="c-sello"><i>Soto’s Art</i><span>BLESSING ART</span></div>
    ${pie(2)}</div></article>`;
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
