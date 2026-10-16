/* =====================================================================
   SOTO’S ART — CATÁLOGO CONFIGURABLE
   Este es el único archivo que hace falta editar para actualizar precios,
   tamaños, enlaces de pago, políticas y textos.
   Regla: un campo vacío ("" o 0 o []) NO se inventa en la página;
   se oculta o se muestra como "por confirmar".
   ===================================================================== */

const CONFIG = {
  /* Sitio */
  sitioURL: "https://saulsoto26.github.io/sotos-art/",   // con "/" final. Cambiar si se usa otro dominio.

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
  lema: "Arte para sanar, embellecer y bendecir.",   // tarjeta oficial

  /* Pagos: el botón de pago solo aparece si la variante tiene su enlace oficial.
     Aquí se indica qué métodos ofrece la artista en general. */
  metodosPago: { athMovil: false, stripe: false, paypal: false },

  /* Envío y políticas: escribir el texto final aprobado por la artista */
  envio: { destinos: "", costo: "", preparacion: "", entrega: "", recogido: "" },
  politicas: { cancelaciones: "", devoluciones: "", danos: "", privacidad: "", marco: "", confirmacion: "" },

  /* Par Quebrantada + Restaurada (solo si la artista lo ofrece) */
  par: { disponible: false, precio: 0, enlacePago: "", nota: "" },

  /* Voz de la artista (todo opcional; se muestra solo si existe) */
  declaracion: "",            // texto escrito por Luciann
  declaracionAudio: "",       // archivo .mp3 o .m4a subido al sitio
  videoArtista: "",           // archivo .mp4 subido al sitio, o ID de YouTube
  /* “Detrás de cada pincelada”: foto real del proceso y, cuando exista, la obra terminada */
  pincelada: {
    titulo: "Paz inigualable",
    proceso: "taller-paz.jpg",
    procesoAlt: "La mano de Luciann pinta con pincel el rostro de una figura de barba que sostiene una paloma, en rojos, naranjas y azules.",
    foco: { x: 0.46, y: 0.34 },      // punto del acercamiento (mano y pincel), 0 a 1
    terminada: "",                    // foto de la obra terminada, cuando exista
    terminadaAlt: "",
    provisional: true                 // es una captura de pantalla: pedir el archivo original
  },
  /* Exploración de técnicas (portafolio, no se vende desde aquí) */
  exploracion: [
    { imagen: "taller-pastel.jpg", titulo: "Retrato en pastel", tecnica: "Pastel sobre papel. Título por confirmar.", provisional: true,
      alt: "Retrato en pastel de un hombre de barba blanca con sombrero, sobre papel oscuro, rodeado de barras de pastel." },
    { imagen: "obra-lagrima-desde-los-cielos.jpg", titulo: "Lágrima desde los cielos", tecnica: "Acrílico, 16 × 20 (unidad por confirmar).", provisional: true,
      alt: "Rostro de mujer de cabello rojo con una lágrima, envuelto en nubes junto a un ala de plumas oscuras." }
  ],
  testimonios: [],            // { texto, nombre, permiso: true } — solo reales y con permiso
  fotosProducto: [],          // fotos reales de la reproducción impresa: { imagen, texto, alt }

  /* Medición respetuosa de la privacidad (opcional, sin cookies).
     proveedor: "goatcounter" (codigo = su subdominio) o "plausible" (codigo = dominio del sitio) */
  analitica: { proveedor: "", codigo: "" }
};

/* ---------------------------------------------------------------------
   OBRAS
   variantes: una por cada combinación vendible. Ejemplo de formato
   (NO es un dato real):
   { tamano:"16 × 20 pulg", ancho:16, alto:20, unidad:"in",
     material:"lienzo", tipo:"giclée", acabado:"mate",
     precio:0, disponible:true,
     enlaces:{ stripe:"https://buy.stripe.com/...", athMovil:"", paypal:"" } }
   --------------------------------------------------------------------- */
const OBRAS = [
  { sku:"SA-001", slug:"quebrantada", titulo:"Quebrantada", imagen:"obra-quebrantada.jpg", w:211, h:256,
    alt:"Rostro de mujer en forma de vasija de barro agrietada, con los ojos cerrados, sobre agua azul bajo rayos de luz.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-002", slug:"restaurada", titulo:"Restaurada", imagen:"obra-restaurada.jpg", w:202, h:256,
    alt:"Rostro sereno de mujer en forma de vasija de barro, sobre un pedestal.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-003", slug:"madre-naturaleza", titulo:"Madre Naturaleza", imagen:"obra-madre-naturaleza.jpg", w:1053, h:1400,
    alt:"Cascada en un bosque verde que cae sobre un estanque, con una flor roja en primer plano.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-004", slug:"sigo-en-victoria", titulo:"Sigo en Victoria", imagen:"obra-sigo-en-victoria.jpg", w:204, h:256,
    alt:"Persona de espaldas en silla de ruedas, con los brazos en alto, sobre una colina rosada con flores.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-005", slug:"en-las-manos-del-alfarero", titulo:"En las manos del Alfarero", imagen:"obra-en-las-manos-del-alfarero.jpg", w:263, h:178,
    alt:"Manos que sostienen y moldean un rostro de barro, junto a una figura vestida de azul.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true },
  { sku:"SA-006", slug:"salmo-23", titulo:"Salmo 23", imagen:"obra-salmo-23.jpg", w:304, h:182,
    alt:"Mujer vestida de blanco que danza con un manto amarillo en un camino hacia la luz.",
    descripcion:"", declaracion:"", video:"", original:"", disponibilidad:"", variantes:[], provisional:true }
];

/* ---------------------------------------------------------------------
   TEXTOS CURATORIALES (lecturas de la galería, NO palabras de la artista).
   Luciann puede reemplazarlos por los suyos.
   --------------------------------------------------------------------- */
const RECORRIDO = [
  ["quebrantada", "Lo que se rompe", "Toda historia empieza en una grieta."],
  ["restaurada", "Lo que se reconstruye", "Pieza a pieza, lo roto encuentra su forma otra vez."],
  ["en-las-manos-del-alfarero", "Lo que se moldea", "Hay manos que sostienen mientras dan forma."],
  ["salmo-23", "Lo que danza", "Aun en el camino oscuro, el alma se mueve hacia la luz."],
  ["sigo-en-victoria", "Lo que vence", "La victoria también se siente con los brazos en alto."],
  ["madre-naturaleza", "Lo que florece", "Y la vida, otra vez, vuelve a fluir."]
];

/* “¿Qué ves tú?”: reflexiones generales por emoción (curatoriales) */
const QUE_VES = {
  obras: ["sigo-en-victoria", "salmo-23", "en-las-manos-del-alfarero", "madre-naturaleza"],
  emociones: {
    "Fortaleza": "La fuerza no siempre está en el gesto. A veces está en lo que una imagen sostiene en silencio.",
    "Paz": "Hay obras que no piden nada. Solo te invitan a respirar un poco más despacio.",
    "Esperanza": "La esperanza rara vez grita. Suele esconderse en un detalle que aparece cuando la mirada se detiene.",
    "Nostalgia": "A veces una pintura nos devuelve a un lugar, o a una persona, que llevamos dentro."
  }
};

const DOS_OBRAS = {
  sentimientos: {
    "Fortaleza": "Lo que se rompe no siempre termina. A veces es justo ahí donde algo aprende a sostenerse.",
    "Tristeza": "La tristeza también sabe mirar. Quedarse frente a una obra que duele es una forma de honrar lo vivido.",
    "Esperanza": "La esperanza rara vez grita. Suele esconderse en un detalle que aparece cuando la mirada se detiene.",
    "Transformación": "Nada de lo que atraviesa una herida vuelve a ser igual. Y no ser igual puede ser otra forma de belleza."
  },
  eleccion: {
    "quebrantada": "Quizás estás en el capítulo de la grieta. Mirarla de frente también es parte de sanar.",
    "restaurada": "Quizás ya reconoces lo que se ha vuelto a unir en ti. La serenidad también es una conquista.",
    "las-dos": "Quizás tu historia tiene las dos: lo que se rompió y lo que se restauró. Juntas cuentan el camino completo."
  }
};
