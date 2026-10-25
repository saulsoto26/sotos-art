# Herramienta de Luciann: cómo ponerla a funcionar

La herramienta está en **https://saulsoto26.github.io/sotos-art/admin.html**. No aparece en el menú ni en buscadores, y sin la llave no puede leer ni cambiar nada.

## 1. Crear el repositorio privado (una sola vez)
1. En github.com toca **+** → **New repository**.
2. Nombre: `sotos-art-ventas`.
3. Marca **Private**.
4. Marca **Add a README file** (hace falta para que el repositorio empiece con algo).
5. Toca **Create repository**.

Aquí se guardará el registro de ventas (`registro.json`) con los datos de los compradores. Nunca lo hagas público.

## 2. Crear la llave de acceso (una sola vez)
1. Foto de perfil → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name:** `Herramienta Luciann`.
3. **Expiration:** 1 año. Pon un recordatorio para renovarla.
4. **Repository access:** *Only select repositories* → `sotos-art` y `sotos-art-ventas`.
5. **Permissions → Repository permissions → Contents:** *Read and write*.
6. **Generate token** y copia la llave. GitHub la muestra una sola vez.

## 3. Conectar el teléfono de Luciann
1. Envíale la llave por un medio privado (no en un grupo). Después borra el mensaje.
2. Ella abre `admin.html` en Safari, pega la llave y toca **Conectar**.
3. Recomendado: **Compartir → Añadir a pantalla de inicio**, para abrirla como una app.

Si pierde el teléfono: borra la llave en GitHub (paso 2, botón **Delete**) y crea una nueva.

## Cómo la usa Luciann
- **Inventario:** cuántas reproducciones tiene listas por obra. Con 0, la página dice “Se prepara por encargo” y el botón cambia a “Solicitar pedido a la artista”. Vacío: la página no muestra nada.
- **Nueva venta:** después de confirmar el pago, escoge la obra, la **cantidad de piezas** y escribe los datos del comprador. Al confirmar, la venta se guarda en el repositorio privado, el inventario baja según la cantidad y se abren los certificados listos para imprimir y firmar a mano.
- **Varias piezas en una venta:** cada pieza recibe su propio certificado y número, seguidos (por ejemplo, SA-002-R-0001 a SA-002-R-0004). Si la edición es numerada, se escribe el número de la primera pieza y los demás siguen solos. Si hay menos piezas listas que las pedidas, se restan las que hay y el resto queda por encargo. Una obra original siempre es una sola pieza.
- **Certificado en PDF:** en la vista del certificado, **Preparar el PDF** crea un PDF tamaño carta, una hoja por página, sin márgenes ni la dirección de la página. En el iPhone se abre el menú de compartir: desde ahí se imprime, se guarda en Archivos o se envía. Si una venta tiene varias piezas, todos sus certificados van en el mismo PDF.
- **Ventas:** lista de ventas, con botones para volver a imprimir los certificados o anular una venta. Al anularla, se anulan todos sus certificados, las piezas vuelven al inventario y los números no se vuelven a usar.
- **Página:** cambia lo que se muestra en la página pública, sin tocar el diseño.
  - **Obras:** título, año, medidas, técnica, subtítulo, descripción, sus palabras sobre la obra, inscripción y los tamaños de reproducción a la venta (medidas, material, tipo, acabado, precio y si está disponible).
  - **Obras nuevas:** «+ Añadir una obra nueva» pide el título, la foto y el capítulo. Al crearla se publica su página en español e inglés, su imagen para compartir y su lugar en el inventario, con el código siguiente (SA-007, SA-008…). Después se completan medidas, textos, precios y más fotos en su ficha.
  - **Mostrar u ocultar:** cualquier obra puede ocultarse de la página sin borrarla (por ejemplo, si se vendió el original y no se ofrecen reproducciones). Una obra creada desde la herramienta también se puede borrar, siempre que no tenga ventas registradas.
  - **Recorrido:** cada obra puede estar en uno de los capítulos o solo en la colección, y tener su frase y su pregunta para el recorrido. El conteo «Seis obras, tres capítulos» se ajusta solo. Si se oculta «Quebrantada» o «Restaurada», la sección «Dos obras» deja de mostrarse.
  - **Envío y políticas:** destinos, costo, tiempos, recogido, cancelaciones, devoluciones, daños, marco, confirmación y privacidad.
  - **Contacto y pago:** teléfono, WhatsApp, correo, Instagram, Facebook, número de ATH Móvil y el aviso del certificado.
  - **Fotos y video** (dentro de cada obra): cambiar la foto principal, añadir o cambiar la foto de la obra original en un hogar, y añadir fotos de detalle, del proceso o de la obra en un espacio, con su pie de foto. Antes de publicar se puede girar la foto. La herramienta la reduce al tamaño de la página (nunca la agranda ni recorta la pintura), le quita los datos de ubicación del teléfono y prepara sola las imágenes para compartir en redes. Una foto de menos de 600 px no se acepta.
  - **Video:** se pega el enlace de YouTube o de Instagram. Los videos no se suben a la página: pesan mucho y los del iPhone guardan la ubicación donde se grabaron.
  - Cada texto tiene su versión en español (ES) y en inglés (EN). Si el inglés queda vacío, la página en inglés muestra el español. Si cambias el español y no el inglés, la herramienta te avisa.

Cada cambio de inventario se ve en la página en uno o dos minutos, que es lo que tarda en publicarse.

## Qué se guarda y dónde
| Dato | Dónde |
|---|---|
| Cantidad disponible por obra | `inventario.json`, en el repositorio público |
| Datos de la página (obras, precios, envío, contacto) | `datos.json`, en el repositorio público |
| Comprador, contacto, monto, referencia de ATH, notas | `registro.json`, en el repositorio privado `sotos-art-ventas` |
| La llave | Solo en el teléfono de Luciann |

Los cambios quedan registrados en GitHub a nombre de la cuenta dueña de la llave.

## Si algo sale mal
Cada cambio queda guardado en GitHub. Para volver atrás: abre el archivo (`datos.json` o `inventario.json`) en el repositorio `sotos-art`, toca **History**, escoge la versión anterior y cópiala. Si el constructor encuentra un error en los datos, no publica nada y la página anterior sigue en línea.
