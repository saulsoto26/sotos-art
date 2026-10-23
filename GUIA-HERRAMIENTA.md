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
- **Nueva venta:** después de confirmar el pago, escoge la obra y escribe los datos del comprador. Al confirmar, la venta se guarda en el repositorio privado, el inventario baja en uno y se abre el certificado listo para imprimir y firmar a mano.
- **Ventas:** lista de ventas, con botones para volver a imprimir un certificado o anular una venta. Al anularla, la pieza vuelve al inventario y el número no se vuelve a usar.

Cada cambio de inventario se ve en la página en uno o dos minutos, que es lo que tarda en publicarse.

## Qué se guarda y dónde
| Dato | Dónde |
|---|---|
| Cantidad disponible por obra | `inventario.json`, en el repositorio público |
| Comprador, contacto, monto, referencia de ATH, notas | `registro.json`, en el repositorio privado `sotos-art-ventas` |
| La llave | Solo en el teléfono de Luciann |

Los cambios quedan registrados en GitHub a nombre de la cuenta dueña de la llave.
