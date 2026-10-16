#!/usr/bin/env python3
"""
Genera una página por obra (obra-<slug>.html) con su vista previa para redes,
además de sitemap.xml y robots.txt. Lee los datos de catalogo.js.

Uso:  python3 generar-paginas.py            (prototipo: no indexar)
      python3 generar-paginas.py --lanzar   (lanzamiento: permitir buscadores)

Ejecutarlo de nuevo si cambian títulos, descripciones o la dirección del sitio.
Precios, tamaños y enlaces de pago NO requieren regenerar: se leen en vivo.
"""
import json, re, sys, html, pathlib

AQUI = pathlib.Path(__file__).parent
LANZAR = "--lanzar" in sys.argv
cat = (AQUI / "catalogo.js").read_text(encoding="utf-8")

sitio = re.search(r'sitioURL:\s*"([^"]+)"', cat).group(1)
obras = re.findall(r'\{ sku:"([^"]+)", slug:"([^"]+)", titulo:"([^"]+)".*?alt:"([^"]*)",\s*descripcion:"([^"]*)"', cat, re.S)

NOINDEX = '<meta name="robots" content="noindex, nofollow">'
robots_meta = "" if LANZAR else NOINDEX

PLANTILLA = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{titulo} | Luciann Soto | Soto’s Art</title>
<meta name="description" content="{desc}">
{robots}
<link rel="canonical" href="{url}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Soto’s Art">
<meta property="og:title" content="«{titulo}», de Luciann Soto">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{sitio}og-{slug}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{alt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14100C">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Karla:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body data-obra="{slug}">
<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Soto’s Art, Blessing Art, galería">
      <svg viewBox="0 0 40 40" aria-hidden="true"><path fill="#5FC3DD" d="M20 21c-3-9-11-14-15-11-4 4 2 11 9 12-6 1-9 6-6 9 4 3 9-2 12-10zm0 0c3-9 11-14 15-11 4 4-2 11-9 12 6 1 9 6 6 9-4 3-9-2-12-10z"/><path stroke="#2B6F80" stroke-width="1.6" d="M20 13v17"/></svg>
      Soto’s Art <i>Blessing Art</i>
    </a>
    <nav class="main" aria-label="Principal"><a href="index.html#obras">Colección</a><a href="index.html#artista">La artista</a><a href="index.html#comprar">Comprar</a></nav>
  </div>
</header>
<main class="page" id="obraPage"><noscript><p class="wrap">«{titulo}», de Luciann Soto. Activa JavaScript para ver tamaños y precio, o llama al 787-690-6865.</p></noscript></main>
<footer><div class="wrap"><a class="brand" href="index.html">Soto’s Art <i>Blessing Art</i></a><p id="footContact"></p><p>© <span id="yr"></span> Luciann Soto. Las imágenes de las obras no pueden reproducirse sin autorización.</p></div></footer>
<div class="toast" id="toast" role="status"></div>
<script src="catalogo.js"></script>
<script src="app.js"></script>
</body>
</html>
"""

urls = [sitio]
for sku, slug, titulo, alt, desc in obras:
    d = desc or f"«{titulo}», obra de la artista puertorriqueña Luciann Soto. Reproducciones de alta calidad."
    url = f"{sitio}obra-{slug}.html"; urls.append(url)
    (AQUI / f"obra-{slug}.html").write_text(PLANTILLA.format(
        titulo=html.escape(titulo), desc=html.escape(d), alt=html.escape(alt), slug=slug,
        url=url, sitio=sitio, robots=robots_meta), encoding="utf-8")

# Página principal: activar o desactivar indexación entre los marcadores
idx = AQUI / "index.html"; s = idx.read_text(encoding="utf-8")
s = re.sub(r"<!--INDEXACION-->.*?<!--/INDEXACION-->", f"<!--INDEXACION-->{robots_meta}<!--/INDEXACION-->", s, flags=re.S)
idx.write_text(s, encoding="utf-8")

(AQUI / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
# robots.txt siempre permite el acceso: así Facebook y WhatsApp pueden leer las vistas previas.
# Lo que evita que Google indexe el prototipo es la etiqueta noindex de cada página.
(AQUI / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {sitio}sitemap.xml\n", encoding="utf-8")
print(f"{len(obras)} páginas de obra generadas. Indexación: {'activada' if LANZAR else 'desactivada (prototipo)'}.")
