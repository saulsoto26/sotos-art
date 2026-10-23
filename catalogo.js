/* =====================================================================
   SOTO’S ART — CATÁLOGO CONFIGURABLE
   Aquí van los datos que NO dependen del idioma: obras, precios, tamaños,
   enlaces de pago y contacto. Los textos (políticas, descripciones,
   lecturas curatoriales, interfaz) están en textos-es.js y en cada
   archivo de idioma.
   Regla: un campo vacío ("" o 0 o []) NO se inventa en la página;
   se oculta o se muestra como "por confirmar".
   ===================================================================== */

const CONFIG = {
  /* Sitio */
  sitioURL: "https://saulsoto26.github.io/sotos-art/",   // con "/" final. Cambiar si se usa otro dominio.
  idiomas: ["es", "en"],           // idiomas publicados; el primero es el predeterminado. Cada uno necesita su textos-xx.js
  publicarEnBuscadores: false,     // false = prototipo (noindex). Cambiar a true el día del lanzamiento.

  /* Vendedora (datos verificables) */
  artista: "Luciann Soto",
  nombreLegal: "Luciann Soto Soto",          // nombre que aparece en su tarjeta y LinkedIn
  marca: "Soto’s Art – Blessing Art",
  ubicacion: "Puerto Rico",                  // identificación pública pedida por Luciann. Nunca publicar su dirección postal.
  telefono: "787-690-6865",                   // afiche y tarjeta oficiales
  whatsapp: "17876906865",                    // CONFIRMAR que este número usa WhatsApp
  correo: "l.sotosart@gmail.com",             // tarjeta oficial
  instagram: "sotosart_blessingart",
  facebook: "",                               // enlace completo de su página, pendiente

  /* Pagos: el botón de pago solo aparece si la variante tiene su enlace oficial.
     Aquí se indica qué métodos ofrece la artista en general. */
  metodosPago: { athMovil: false, stripe: false, paypal: false },   // pago EN LÍNEA (enlaces oficiales)
  /* ATH Móvil al número de Luciann: el visitante confirma su orden con ella y luego envía el pago.
     El sitio no procesa ni confirma pagos; la orden queda confirmada cuando Luciann recibe el pago. */
  athMovilNumero: "787-690-6865",
  /* Certificado de autenticidad firmado por la artista con cada pieza. El sitio solo lo anuncia:
     no genera ni muestra el certificado real. false = no se menciona. */
  certificado: true,
  /* Herramienta privada de Luciann (/admin/): registra ventas, imprime certificados y actualiza el inventario.
     repoSitio: este repositorio (público): solo guarda cantidades (inventario.json), nunca datos de compradores.
     repoVentas: repositorio PRIVADO con el registro de ventas (registro.json). */
  admin: { repoSitio: "saulsoto26/sotos-art", repoVentas: "saulsoto26/sotos-art-ventas", rama: "main" },

  /* Envío y políticas: sus textos están en textos-es.js (sección contenido) */

  /* Par Quebrantada + Restaurada (solo si la artista lo ofrece) */
  par: { disponible: false, precio: 0, enlacePago: "" },

  /* Voz de la artista (todo opcional; se muestra solo si existe) */
  declaracionAudio: "",       // archivo .mp3 o .m4a subido al sitio
  videoArtista: "",           // archivo .mp4 subido al sitio, o ID de YouTube
  /* “Detrás de cada pincelada”: foto real del proceso y, cuando exista, la obra terminada */
  pincelada: {
    titulo: "Paz inigualable",
    proceso: "taller-paz.jpg",
    foco: { x: 0.46, y: 0.34 },      // punto del acercamiento (mano y pincel), 0 a 1
    terminada: "",                    // foto de la obra terminada, cuando exista
    provisional: true                 // es una captura de pantalla: pedir el archivo original
  },
  /* Exploración de técnicas (portafolio, no se vende desde aquí). Títulos y textos en textos-es.js, en el mismo orden */
  exploracion: [
    { imagen: "taller-pastel.jpg", provisional: true },
    { imagen: "obra-lagrima-desde-los-cielos.jpg", provisional: true }
  ],
  /* Testimonios y fotos del producto: en textos-es.js (sección contenido) */

  /* Medición respetuosa de la privacidad (opcional, sin cookies).
     proveedor: "goatcounter" (codigo = su subdominio) o "plausible" (codigo = dominio del sitio) */
  analitica: { proveedor: "", codigo: "" }
};

/* Declaración de artista: texto literal del documento oficial de Luciann. No se edita. */
const DECLARACION_ORIGINAL = "Mi trabajo artístico se caracteriza por el expresionismo, a través del cual exploro el color, la forma y la textura para expresar emociones y significados simbólicos. Mis obras abordan temas relacionados con la espiritualidad, la fe, la naturaleza y las experiencias humanas. Mediante la experimentación y la intuición, integro elementos figurativos y abstractos, así como diversos materiales, incluyendo los ecoamigables. En cada obra busco crear un espacio de conexión y reflexión, invitando al espectador a sentir, interpretar y descubrir su propia relación con la obra.";
const DECLARACION_DESTACADA = 3;   // oración que se muestra en grande (0 = primera)

/* ---------------------------------------------------------------------
   OBRAS
   IMPORTANTE: título, año, medidas y variantes de cada obra, y sus textos (técnica, subtítulo,
   descripción, palabras de Luciann, inscripción), se editan ahora en datos.json desde la
   herramienta de Luciann (pestaña Página). Lo que diga datos.json manda sobre lo de aquí.
   anio: año de la pintura original · medidas: de la PINTURA ORIGINAL (ficha de Luciann), no de la reproducción.
   w y h: solo la proporción de la fotografía en pantalla. variantes: los tamaños que se venden.
   con medidas, el Modo museo muestra las obras a escala entre sí.
   imagen: foto de la obra sin pared ni marco (1600 px). Junto a ella va la versión
   “-800.jpg” para teléfonos; ninguna sirve como archivo maestro de impresión.
   ambiente: foto real de la obra ORIGINAL en un hogar (inspiración, no es el producto).
   enmarcada: foto de la obra con su marco, cuando es la única que existe.
   variantes: una por cada combinación vendible. Ejemplo de formato
   (NO es un dato real):
   { tamano:"16 × 20 pulg", ancho:16, alto:20, unidad:"in",
     material:"lienzo", tipo:"giclée", acabado:"mate",
     precio:0, disponible:true,
     enlaces:{ stripe:"https://buy.stripe.com/...", athMovil:"", paypal:"" } }
   --------------------------------------------------------------------- */
const OBRAS = [
  { sku:"SA-001", slug:"quebrantada", titulo:"Quebrantada", imagen:"obra-quebrantada.jpg", w:1029, h:1281,
    video:"", original:"", anio:"", medidas:{ ancho:16, alto:20, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false },
  { sku:"SA-002", slug:"restaurada", titulo:"Restaurada", imagen:"obra-restaurada.jpg", w:967, h:1211,
    ambiente:{ imagen:"ambiente-restaurada.jpg", w:1050, h:1400 },
    video:"", original:"", anio:"", medidas:{ ancho:16, alto:20, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false },
  { sku:"SA-003", slug:"madre-naturaleza", titulo:"Madre Naturaleza", imagen:"obra-madre-naturaleza.jpg", w:1118, h:1495,
    video:"", original:"", anio:"", medidas:{ ancho:16, alto:20, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false },
  { sku:"SA-004", slug:"sigo-en-victoria", titulo:"Sigo en Victoria", imagen:"obra-sigo-en-victoria.jpg", w:1600, h:788,
    ambiente:{ imagen:"ambiente-sigo-en-victoria.jpg", w:1400, h:653 },
    video:"", original:"", anio:"", medidas:{ ancho:30, alto:18, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false },
  { sku:"SA-005", slug:"en-las-manos-del-alfarero", titulo:"En las manos del Alfarero", imagen:"obra-en-las-manos-del-alfarero.jpg", w:1600, h:1041,
    video:"", original:"", anio:"", medidas:{ ancho:16, alto:14, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false },
  { sku:"SA-006", slug:"salmo-23", titulo:"Salmo 23", imagen:"obra-salmo-23.jpg", w:1482, h:1045,
    enmarcada:{ imagen:"obra-salmo-23-enmarcada.jpg", w:1600, h:1157 },   // única foto disponible: la obra con su marco
    video:"", original:"", anio:"", medidas:{ ancho:28, alto:20, unidad:"in" }, disponibilidad:"", variantes:[], provisional:false }
];

/* ---------------------------------------------------------------------
   TRAYECTORIA: exposiciones documentadas en “Luciann Trayectoria Artística 2026”.
   nombre y lugar se conservan como en la fuente (oficiales, no se traducen).
   tipo: "colectiva" solo cuando la fuente lo dice; "murales"; "" = exposición.
   Fotos: solo auténticas, en foto:"archivo.jpg" (vacío = no se muestra).
   --------------------------------------------------------------------- */
const TRAYECTORIA = {
  exposiciones: [
    { anio:"2026", nombre:"Segundo Encuentro en MUSA", lugar:"", tipo:"", foto:"" },
    { anio:"2025", nombre:"“Celebra”", lugar:"Pop Up de Incubadora Creativa, Antiguo Edificio de la Bolsa, Mayagüez", tipo:"colectiva", foto:"" },
    { anio:"2025", nombre:"“Junte Creativo del Norte al Sur”", lugar:"Ex Centralinos", tipo:"colectiva", foto:"" },
    { anio:"2018", nombre:"Colectivo de Murales", lugar:"Vega Alta", tipo:"murales", foto:"" },
    { anio:"2014", nombre:"Exposición Colectiva de Ex Centralinos", lugar:"Biblioteca Conrado, Recinto de Ciencias Médicas", tipo:"colectiva", foto:"" },
    { anio:"2009", nombre:"Bajo Las Sábanas", lugar:"Museo de Dorado", tipo:"", foto:"" }
  ]
};

/* ---------------------------------------------------------------------
   EXPERIENCIA: qué obras aparecen y en qué orden (igual en todos los idiomas).
   Sus textos están en textos-es.js.
   --------------------------------------------------------------------- */
const EXPERIENCIA = {
  /* Tres capítulos (lectura curatorial propuesta, no de la artista). Se pueden visitar en cualquier orden.
     Sus nombres están en textos-es.js → capitulos. El recorrido y la sala siguen este orden. */
  capitulos: [
    { clave: "herida", obras: ["quebrantada", "en-las-manos-del-alfarero", "restaurada"] },
    { clave: "camino", obras: ["salmo-23", "sigo-en-victoria"] },
    { clave: "vida",   obras: ["madre-naturaleza"] }
  ],
  queVes: ["sigo-en-victoria", "salmo-23", "en-las-manos-del-alfarero", "madre-naturaleza"]
};

/* Orden derivado de los capítulos (no editar) */
EXPERIENCIA.recorrido = EXPERIENCIA.capitulos.flatMap(c => c.obras);
EXPERIENCIA.museo = EXPERIENCIA.recorrido;

/* =====================================================================
   DATOS EDITABLES DESDE LA HERRAMIENTA DE LUCIANN (datos.json)
   Lo que está en datos.json manda sobre los valores de este archivo y de textos-*.js:
   contacto, número de ATH Móvil, certificado, envío, políticas y, por obra, título, año,
   medidas, tamaños de reproducción (variantes), sus textos en cada idioma, la foto principal
   (imagen, w, h), la foto en un espacio (ambiente), la foto con marco (enmarcada; null = no se usa),
   las fotos adicionales (fotos), el video (enlace de YouTube o Instagram) y sus vistas previas (og).
   El constructor publica datos.json como datos.js (window.DATOS), que se carga antes que este archivo.
   En inglés, un campo vacío muestra el texto en español.
   ===================================================================== */
function aplicarDatos(D, T, idioma){
  if (!D) return;
  const hay = x => x !== undefined && x !== null;
  const txt = b => { const es = (b || {}).es || {}, lo = (b || {})[idioma] || {}, r = {};
    new Set([...Object.keys(es), ...Object.keys(lo)]).forEach(k => { r[k] = hay(lo[k]) && lo[k] !== "" ? lo[k] : (hay(es[k]) ? es[k] : ""); }); return r; };
  Object.entries(D.contacto || {}).forEach(([k, v]) => { if (hay(v)) CONFIG[k] = v; });
  const V = D.venta || {};
  if (hay(V.athMovilNumero)) CONFIG.athMovilNumero = V.athMovilNumero;
  if (hay(V.certificado)) CONFIG.certificado = !!V.certificado;
  if (T){ T.contenido = T.contenido || {};
    if (D.envio) T.contenido.envio = { ...(T.contenido.envio || {}), ...txt(D.envio) };
    if (D.politicas) T.contenido.politicas = { ...(T.contenido.politicas || {}), ...txt(D.politicas) }; }
  OBRAS.forEach(o => { const d = (D.obras || {})[o.slug]; if (!d) return;
    ["titulo", "anio"].forEach(k => { if (hay(d[k])) o[k] = d[k]; });
    if (d.medidas !== undefined) o.medidas = d.medidas;
    ["imagen", "w", "h", "video"].forEach(k => { if (hay(d[k])) o[k] = d[k]; });
    ["ambiente", "enmarcada"].forEach(k => { if (d[k] !== undefined){ if (d[k]) o[k] = d[k]; else delete o[k]; } });
    if (d.og) o.og = d.og;
    if (Array.isArray(d.fotos)) o.fotos = d.fotos.map(f => ({ imagen: f.imagen, w: f.w, h: f.h, tipo: f.tipo || "detalle",
      pie: (f.pie || {})[idioma] || (f.pie || {}).es || "" }));
    if (Array.isArray(d.variantes)) o.variantes = d.variantes;
    if (T && d.textos){ T.obras = T.obras || {}; T.obras[o.slug] = { ...(T.obras[o.slug] || {}), ...txt(d.textos) }; } });
}
