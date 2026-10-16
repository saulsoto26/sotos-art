# Soto’s Art | Galería de Luciann Soto

Sitio estático (HTML, CSS y JavaScript, sin servidor) listo para GitHub Pages o Netlify.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página principal |
| `obra-*.html` | Una página por obra, con su vista previa para WhatsApp y Facebook |
| `catalogo.js` | **El único archivo que hay que editar**: precios, tamaños, pagos, políticas y textos |
| `app.js` | Lógica de la galería (no requiere edición) |
| `styles.css` | Estilos |
| `obra-*.jpg` | Fotos de las obras |
| `og*.jpg` | Imágenes de vista previa para redes (1200 × 630) |
| `artista.jpg`, `taller-*.jpg` | Fotos de Luciann y de su proceso |
| `generar-paginas.py` | Regenera las páginas de obra, el sitemap y la indexación |
| `sitemap.xml`, `robots.txt` | Para buscadores |
| `prototipo-v1.html` | Respaldo de la versión anterior |
| `PENDIENTES.md` | Lo que falta para vender |

Todos los archivos van en la raíz del repositorio, sin carpetas, para poder subirlos desde el teléfono.

## Publicar o actualizar en GitHub Pages (desde el celular)
1. En github.com, abre el repositorio `sotos-art`.
2. Toca **Add file → Upload files** y selecciona todos los archivos. Los que tengan el mismo nombre se reemplazan.
3. Toca **Commit changes**. En uno o dos minutos se actualiza https://saulsoto26.github.io/sotos-art/

## Cambiar precios, tamaños o enlaces de pago
Edita `catalogo.js` (en GitHub: abre el archivo, toca el lápiz, edita y confirma con Commit). No hace falta regenerar páginas.

Ejemplo de una variante dentro de `variantes:[ ]` de una obra:
```js
{ tamano:"16 × 20 pulg", ancho:16, alto:20, unidad:"in",
  material:"lienzo", tipo:"giclée", acabado:"mate",
  precio:120, disponible:true,
  enlaces:{ stripe:"https://buy.stripe.com/…", athMovil:"", paypal:"" } }
```
Con eso aparecen solos: el precio “desde” en la colección, el selector de tamaño, el botón de pago, el tamaño real en “Pruébala en tu pared” y los detalles de compra.

## Cambiar fotos
Sube la nueva foto con **el mismo nombre** (por ejemplo `obra-quebrantada.jpg`). Si cambian sus proporciones, actualiza `w` y `h` de esa obra en `catalogo.js`. Cuando las fotos sean definitivas, cambia `provisional:true` a `false`.

## Lanzamiento (quitar el noindex)
Desde una computadora: `python3 generar-paginas.py --lanzar` y sube `index.html`, las `obra-*.html` y `sitemap.xml`.

## Qué es real y qué no
- No hay checkout propio: los pagos se hacen en enlaces oficiales (ATH Móvil, Stripe o PayPal).
- Un clic en “Pagar” **no** es una venta. Las ventas se confirman en el panel del procesador de pagos.
- Los textos curatoriales están identificados como tales y no se atribuyen a Luciann.
- Las fotos de “Pruébala en tu pared” no salen del dispositivo del visitante.
