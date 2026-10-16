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
  ubicacion: "Vega Alta, Puerto Rico",        // de su perfil de LinkedIn: CONFIRMAR
  telefono: "787-690-6865",                   // afiche y tarjeta oficiales
  whatsapp: "17876906865",                    // CONFIRMAR que este número usa WhatsApp
  correo: "l.sotosart@gmail.com",             // tarjeta oficial
  instagram: "sotosart_blessingart",
  facebook: "",                               // enlace completo de su página, pendiente

  /* Pagos: el botón de pago solo aparece si la variante tiene su enlace oficial.
     Aquí se indica qué métodos ofrece la artista en general. */
  metodosPago: { athMovil: false, stripe: false, paypal: false },

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

/* ---------------------------------------------------------------------
   OBRAS
   anio: año de la pintura original · medidas: del ORIGINAL (no de la reproducción);
   con medidas, el Modo museo muestra las obras a escala entre sí.
   variantes: una por cada combinación vendible. Ejemplo de formato
   (NO es un dato real):
   { tamano:"16 × 20 pulg", ancho:16, alto:20, unidad:"in",
     material:"lienzo", tipo:"giclée", acabado:"mate",
     precio:0, disponible:true,
     enlaces:{ stripe:"https://buy.stripe.com/...", athMovil:"", paypal:"" } }
   --------------------------------------------------------------------- */
const OBRAS = [
  { sku:"SA-001", slug:"quebrantada", titulo:"Quebrantada", imagen:"obra-quebrantada.jpg", w:211, h:256,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-002", slug:"restaurada", titulo:"Restaurada", imagen:"obra-restaurada.jpg", w:202, h:256,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-003", slug:"madre-naturaleza", titulo:"Madre Naturaleza", imagen:"obra-madre-naturaleza.jpg", w:1053, h:1400,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-004", slug:"sigo-en-victoria", titulo:"Sigo en Victoria", imagen:"obra-sigo-en-victoria.jpg", w:204, h:256,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-005", slug:"en-las-manos-del-alfarero", titulo:"En las manos del Alfarero", imagen:"obra-en-las-manos-del-alfarero.jpg", w:263, h:178,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-006", slug:"salmo-23", titulo:"Salmo 23", imagen:"obra-salmo-23.jpg", w:304, h:182,
    video:"", original:"", anio:"", medidas:{ ancho:0, alto:0, unidad:"in" }, disponibilidad:"", variantes:[], provisional:true }
];

/* ---------------------------------------------------------------------
   EXPERIENCIA: qué obras aparecen y en qué orden (igual en todos los idiomas).
   Sus textos están en textos-es.js.
   --------------------------------------------------------------------- */
const EXPERIENCIA = {
  museo: ["quebrantada", "restaurada", "en-las-manos-del-alfarero", "salmo-23", "sigo-en-victoria", "madre-naturaleza"],   // orden de la sala
  recorrido: ["quebrantada", "restaurada", "en-las-manos-del-alfarero", "salmo-23", "sigo-en-victoria", "madre-naturaleza"],
  queVes: ["sigo-en-victoria", "salmo-23", "en-las-manos-del-alfarero", "madre-naturaleza"]
};
