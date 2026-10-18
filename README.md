# Soto’s Art | Galería de Luciann Soto

Sitio estático (HTML, CSS y JavaScript, sin servidor). GitHub lo construye y publica solo cada vez que subes un archivo.

## Archivos que editas
| Archivo | Qué contiene |
|---|---|
| `catalogo.js` | Datos que no dependen del idioma: obras, tamaños, precios en USD, enlaces de pago, contacto, idiomas activos y si el sitio aparece en buscadores |
| `textos-es.js` | Todos los textos en español: portada, botones, fichas, lecturas curatoriales, biografía, envío, políticas y preguntas frecuentes |
| `textos-en.js` | Los mismos textos en inglés, con **las mismas claves**. Hoy es un borrador pendiente de la revisión de Luciann |

## Archivos que no hace falta tocar
| Archivo | Para qué sirve |
|---|---|
| `app.js`, `styles.css` | Lógica y estilos de la galería |
| `plantilla-inicio.html`, `plantilla-obra.html` | Moldes de la portada y de las páginas de obra |
| `construir.py` | Crea el sitio publicable: carpetas por idioma, páginas de obra, sitemap y redirecciones |
| `.github/workflows/publicar.yml` | Ejecuta `construir.py` y publica en GitHub Pages en cada subida |
| `obra-*.jpg`, `artista.jpg`, `taller-*.jpg` | Imágenes |
| `og*.jpg`, `og-en*.jpg` | Vistas previas al compartir, en español y en inglés |
| `prototipo-v1.html` | Respaldo de la primera versión |
| `PENDIENTES.md` | Lo que falta para vender |

Los archivos `index.html`, `obra-*.html`, `sitemap.xml`, `robots.txt` y `generar-paginas.py` que queden en el repositorio ya no se usan; GitHub genera los suyos. Puedes borrarlos cuando quieras.

## Direcciones del sitio
- `https://saulsoto26.github.io/sotos-art/` lleva al idioma elegido por el visitante (o a español).
- `…/es/` es la portada en español; `…/es/obras/quebrantada/` es la página de cada obra.
- `…/en/` y `…/en/artworks/quebrantada/` son las mismas páginas en inglés.
- Los enlaces antiguos (`…/obra-quebrantada.html`) siguen funcionando y llevan a la nueva dirección.

## Idiomas
- El selector (globo + código, sin banderas) está en el encabezado y dentro de cada ficha. Lleva a la misma página en el otro idioma, conserva la obra abierta o la sección donde estaba el visitante y recuerda su elección.
- Si el navegador está en otro idioma activo, se sugiere una sola vez con una barra discreta; nunca se cambia solo.
- Los títulos de las obras se conservan en español. Un subtítulo interpretativo se publica solo si se escribe en `subtitulo`; las propuestas están en `subtituloPropuesto`.
- **Revisión de Luciann:** `…/revision-traducciones.html` muestra cada texto en español e inglés lado a lado. No está enlazada ni aparece en buscadores.
- Sus propias palabras (la cita y sus declaraciones) no se muestran en inglés hasta que en `textos-en.js` se cambie `palabrasArtista: false` a `true`.
- Para agregar otro idioma: copiar `textos-en.js` como `textos-pt.js`, traducir y añadir `"pt"` a `idiomas` en `catalogo.js`.

## Trayectoria y exposiciones
- Está en “Conoce a Luciann”, después de su biografía: cuatro momentos destacados y un desplegable con la trayectoria completa.
- Las exposiciones (nombres oficiales, sin traducir) están en `catalogo.js` → `TRAYECTORIA`. Los textos de enseñanza, formación y reconocimientos están en cada `textos-xx.js` → `trayectoria`.
- Un dato con `revisar` está pendiente de confirmar: no se publica la parte en duda.
- Nunca se publica la dirección postal de Luciann; su ubicación pública es “Puerto Rico”.

## Modo museo / Museum View
- Se entra desde “Entrar al Modo museo”, en la colección, o desde el botón “Modo museo” de cada ficha. Cada obra tiene su enlace: `…/es/#/museo/quebrantada`.
- El orden de la sala está en `catalogo.js` → `EXPERIENCIA.museo`.
- La cartela muestra el título, el año, la técnica y las medidas del original, la lectura curatorial (separada de las palabras de Luciann) y los botones “Ver tamaños y precio” y “Ver en mi espacio”.
- Con `anio` y `medidas` del original en `catalogo.js`, y la `tecnica` en cada `textos-xx.js`, la sala deja de decir “por confirmar”. Cuando todas las obras tienen medidas, se muestran a escala entre sí.
- El marco es opcional y la sala aclara que es solo de presentación.

## Compartir
- En cada ficha (“Comparte esta historia”), en el Modo museo y en el pie de página (“Compartir esta galería”) se abre un panel con el código QR, “Enviar por WhatsApp”, “Copiar enlace” y, en teléfonos, “Más opciones”.
- “Guardar el código QR” crea una imagen con el nombre de la obra, lista para imprimir o reenviar.
- El código lleva siempre a la página en el idioma del visitante. `qr.js` genera los códigos en el propio teléfono: no se envía nada a otros servicios.

## Actualizar el sitio (desde el celular)
1. En github.com abre el repositorio `sotos-art`.
2. **Add file → Upload files**, elige los archivos y toca **Commit changes**. Los que tienen el mismo nombre se reemplazan.
3. En la pestaña **Actions** verás “Publicar galería” en curso. En uno o dos minutos el sitio queda actualizado. Si aparece una ✗ roja, ábrela: el mensaje dice qué archivo tiene el error.

## Cambiar precios, tamaños o enlaces de pago
En `catalogo.js`, dentro de `variantes:[ ]` de cada obra:
```js
{ tamano:"16 × 20 pulg", ancho:16, alto:20, unidad:"in",
  material:"lienzo", tipo:"giclée", acabado:"mate",
  precio:120, disponible:true,
  enlaces:{ stripe:"https://buy.stripe.com/…", athMovil:"", paypal:"" } }
```
Con eso aparecen solos el precio “desde”, el selector de tamaño, el botón de pago, el tamaño real en “Pruébala en tu pared” y los detalles de compra, en todos los idiomas.

## Cambiar un texto
Busca el texto en `textos-es.js` (o `textos-en.js`), cámbialo entre las comillas y súbelo. No cambies lo que está a la izquierda de los dos puntos (la clave) ni lo que va entre llaves, como `{titulo}` o `{precio}`: el sitio lo reemplaza solo.

## Cambiar fotos
Sube la nueva foto con **el mismo nombre** (por ejemplo `obra-quebrantada.jpg`). Si cambian sus proporciones, actualiza `w` y `h` de esa obra en `catalogo.js`. Cuando las fotos sean definitivas, cambia `provisional:true` a `false`.

## Lanzamiento
En `catalogo.js` cambia `publicarEnBuscadores: false` a `true`. Eso retira el “noindex” de todas las páginas.
