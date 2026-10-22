# Soto’s Art: pendientes para activar ventas

Estado: **prototipo navegable**. No está listo para vender hasta completar la Prioridad 1 y validar un pago real.

## Prioridad 1: imprescindible para vender

### Fotografías
- [ ] Fotos originales en alta resolución de las seis obras: de frente, con luz natural, sin marco, al menos 2000 px en el lado mayor. Las actuales son recortes del afiche (unos 200 px) y capturas de LinkedIn.
- [ ] Fotos reales de la reproducción impresa (producto terminado, detalle del material y del borde).
- [ ] Archivo original de la foto «Paz inigualable» en proceso y, si existe, la foto de la obra terminada.
- [ ] Archivos originales del retrato en pastel y de «Lágrima desde los cielos».

### Catálogo (por obra, en `catalogo.js` → `variantes`)
- [ ] Tamaños reales que se venden: ancho, alto y unidad (pulgadas o cm).
- [ ] Material y tipo de reproducción (por ejemplo, giclée en lienzo o papel de arte).
- [ ] Acabado (mate, brillo, con o sin bastidor).
- [ ] Precio final en USD por variante.
- [ ] Disponibilidad.
- [ ] Descripción breve de cada obra, escrita o aprobada por Luciann (en `textos-es.js` → `obras`).

### Pagos
- [x] ATH Móvil: pagos al 787-690-6865 después de confirmar la orden con Luciann (número en `athMovilNumero`, catalogo.js).
- [ ] Opcional: ATH Móvil Business, si Luciann quiere recibos de negocio o un enlace de pago por obra.
- [ ] Pago con tarjeta para compradores fuera de Puerto Rico (ATH Móvil solo funciona con bancos de Puerto Rico).
- [ ] Procesador de tarjetas (por ejemplo, Stripe Payment Links o PayPal Business) con un enlace por variante.
- [ ] Prueba de una compra real de bajo monto, de principio a fin, antes del lanzamiento.

### Envío y políticas (textos en `textos-es.js` → `contenido`)
- [ ] Destinos de envío y costo.
- [ ] Tiempo de preparación y de entrega.
- [ ] Opción de recogido, si existe.
- [ ] Política de daños, cancelaciones y devoluciones.
- [ ] Cómo se confirma cada orden (procesador o mensaje de Luciann).
- [ ] Si el marco está incluido o se vende aparte.
- [ ] Si se venden juntas «Quebrantada» y «Restaurada», y a qué precio.

### Datos de contacto y biografía
- [ ] Confirmar que el 787-690-6865 usa WhatsApp.
- [ ] Autorización para publicar teléfono, correo, Instagram y ubicación (Luciann pidió presentarse como artista de Puerto Rico, sin municipio).
- [ ] Enlace de su página de Facebook.
- [ ] Revisión y aprobación de la biografía y la línea de tiempo (tomadas de su perfil de LinkedIn).

## Prioridad 2: mayor impacto emocional
- [ ] Declaración artística de Luciann, escrita o grabada.
- [ ] Videos breves sobre el origen de las obras (opcional).
- [ ] Sus propias palabras para el recorrido, “¿Qué ves tú?” y “Dos obras, una historia” (hoy son lecturas curatoriales identificadas como tales).
- [ ] Testimonios reales, solo con permiso escrito.
- [ ] Fotos de obras colgadas en hogares reales, con permiso.

## Trayectoria (confirmar con Luciann antes de la versión definitiva)
- [ ] Año de la maestría: el documento de 2026 dice 2025 y una captura anterior decía 2023. Hoy se publica sin año.
- [ ] Concentración del bachillerato de 2019: “Gerencia de Medios” (documento de 2026) o “Comunicación Digital y Contenidos Multimedia” (captura anterior). Hoy se publica sin concentración.
- [ ] ¿Incluir “Voces para Cristo” (2020) y el XIX Iberoamericano de la voz (2001)? Están en el documento, pero se dejaron fuera por ser de canto.
- [ ] Confirmar que teléfono, correo e Instagram son los canales autorizados para compradores.
- [ ] Fotos auténticas de las exposiciones (opcional): se agregan en `foto:` de cada exposición en `catalogo.js`.

## Modo museo (fase 2)
- [x] Técnica y medidas de cada pintura original (ficha de Luciann: pintura acrílica sobre lienzo).
- [ ] Medir los lienzos: en tres obras la medida no coincide con la forma de la foto. En las manos del Alfarero (14 × 16″, corregida por Luciann; la foto es más alargada), Sigo en Victoria (18 × 30″) y Madre Naturaleza (16 × 20″). En pantalla la forma siempre sale de la foto, para no deformar las obras.
- [ ] Año de cada pintura original.
- [ ] Fotos en alta resolución: en la sala, al acercarse a los detalles, las imágenes actuales se ven borrosas.
- [ ] Aprobación de Luciann de la frase sobre su futura galería-estudio familiar.

## Galería bilingüe (fase 1)
- [ ] Revisión y aprobación de Luciann de cada texto en inglés, en especial su biografía y sus propias palabras.
- [ ] Aprobar o descartar los subtítulos interpretativos en inglés de cada obra (los títulos se conservan en español).

## Prioridad 3: perfeccionamiento
- [ ] Configurar la medición sin cookies (GoatCounter o Plausible) en `CONFIG.analitica`.
- [ ] Dominio propio (opcional).
- [ ] Al lanzar: cambiar `publicarEnBuscadores` a `true` en `catalogo.js` para retirar el noindex.

## Mensaje sobre su situación personal
No aparece en el sitio. Solo se preparará un texto breve y respetuoso si Luciann lo autoriza expresamente.

## Fotografías nuevas y declaración de artista (fase 3)
- [ ] **Archivos maestros de impresión.** Las fotos actuales (de 967 a 1600 px) sirven para el sitio, no para imprimir: un 16 × 20 necesita unos 4800 × 6000 px. Pedir a Luciann los originales del teléfono enviados **como documento** o por correo (WhatsApp los comprime), o una digitalización profesional.
- [ ] **«Salmo 23» sin marco.** Solo existe la foto enmarcada; en el catálogo se retiró el marco con un recorte, sin tocar la pintura. Una foto sin marco mostraría los bordes completos del lienzo.
- [ ] **Años de las obras.** Las firmas parecen decir: Quebrantada 2020, Restaurada 2015, En las manos del Alfarero 2025, Sigo en Victoria 2025 y Salmo 23 «26». Madre Naturaleza no se lee. Confirmar con Luciann y escribirlos en `anio` (catalogo.js).
- [ ] **Traducción de su declaración al inglés.** Está en `textos-en.js` → `contenido.declaracion` y en la página de revisión. Mientras `palabrasArtista` sea `false`, en inglés se muestra el original en español con una nota.
- [ ] **Capítulos del recorrido.** «La herida y las manos», «El camino» y «La vida que sostiene» son una lectura de la galería: confirmar que Luciann se siente representada.
- [ ] **Obra del ave negra y amarilla** que aparece en su PDF: título, año y si quiere incluirla.
- [ ] **Venta de Quebrantada y Restaurada juntas.** El botón para pedirlas en conjunto se quitó hasta que lo confirme.
- [ ] **Opcional: palabras de la apertura.** Hoy son Esperanza, Restauración, Fortaleza y Vida. Podrían alinearse con sus temas declarados (fe, naturaleza, espiritualidad, experiencias humanas).
- [ ] **Audio de la declaración.** Si Luciann la graba, subir el archivo y escribir su nombre en `declaracionAudio` (catalogo.js); aparece solo en «La voz de Luciann».
