#!/usr/bin/env python3
"""
Construye el sitio publicable en la carpeta _site/ (GitHub lo hace solo en cada subida).

  /                         elige el idioma guardado del visitante (o el predeterminado)
  /es/                      portada en español
  /es/obras/<slug>/         una página por obra, con su vista previa para redes
  /en/ ...                  lo mismo por cada idioma activado en CONFIG.idiomas
  /obra-<slug>.html         redirección para los enlaces antiguos ya compartidos
  sitemap.xml, robots.txt   con las versiones de cada idioma enlazadas entre sí

Uso local:  python3 construir.py            (crea _site/)
Lee catalogo.js y textos-<idioma>.js con Node.js. No hay que editar este archivo.
"""
import json, re, sys, html, shutil, subprocess, pathlib

AQUI = pathlib.Path(__file__).resolve().parent
SALIDA = AQUI / (sys.argv[sys.argv.index("--salida") + 1] if "--salida" in sys.argv else "_site")
ARCHIVOS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp3", ".m4a", ".mp4", ".webm", ".pdf", ".css", ".ico"}
SCRIPTS = {"catalogo.js", "app.js"}
COPIAR_HTML = {"prototipo-v1.html"}

def leer(idioma):
    js = (AQUI / "catalogo.js").read_text(encoding="utf-8") + "\n" + (AQUI / f"textos-{idioma}.js").read_text(encoding="utf-8")
    js = "const window = {};\n" + js + "\n;console.log(JSON.stringify({CONFIG, OBRAS, TEXTOS: window.TEXTOS}));"
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if r.returncode: sys.exit(f"Error al leer catalogo.js o textos-{idioma}.js:\n{r.stderr}")
    return json.loads(r.stdout)

def og(l, s=""):
    """Imagen para redes del idioma (og-en.jpg, og-en-<obra>.jpg); si no existe, la del idioma predeterminado"""
    n = ("og" + (f"-{l}" if l != DEF else "") + (f"-{s}" if s else "")) + ".jpg"
    return SITIO + (n if (AQUI / n).exists() else ("og" + (f"-{s}" if s else "") + ".jpg"))

def fmt(s, **v): return re.sub(r"\{(\w+)\}", lambda m: str(v.get(m.group(1), m.group(0))), s)
e = lambda s: html.escape(str(s), quote=True)

base = leer("es"); CONFIG, OBRAS = base["CONFIG"], base["OBRAS"]
SITIO = CONFIG["sitioURL"]; IDIOMAS = CONFIG.get("idiomas") or ["es"]; DEF = IDIOMAS[0]
INDEXAR = bool(CONFIG.get("publicarEnBuscadores"))
TX = {l: (base if l == "es" else leer(l))["TEXTOS"] for l in IDIOMAS}
ruta_obras = lambda l: TX[l]["ui"]["ruta.obras"]
URL = {"inicio": lambda l: f"{SITIO}{l}/", "obra": lambda l, s: f"{SITIO}{l}/{ruta_obras(l)}/{s}/"}

def cabeza(l, titulo, desc, url, og_tipo, og_titulo, og_desc, og_img, og_alt, alternos, extra=""):
    m = TX[l]["meta"]
    lineas = ['<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        f"<title>{e(titulo)}</title>", f'<meta name="description" content="{e(desc)}">']
    if not INDEXAR: lineas.append('<meta name="robots" content="noindex, nofollow">')
    lineas.append(f'<link rel="canonical" href="{url}">')
    lineas += [f'<link rel="alternate" hreflang="{a}" href="{u}">' for a, u in alternos]
    lineas += [f'<meta property="og:type" content="{og_tipo}">', '<meta property="og:site_name" content="Soto’s Art">',
        f'<meta property="og:locale" content="{m["ogLocale"]}">']
    lineas += [f'<meta property="og:locale:alternate" content="{TX[o]["meta"]["ogLocale"]}">' for o in IDIOMAS if o != l]
    lineas += [f'<meta property="og:title" content="{e(og_titulo)}">', f'<meta property="og:description" content="{e(og_desc)}">',
        f'<meta property="og:url" content="{url}">', f'<meta property="og:image" content="{og_img}">',
        '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']
    if og_alt: lineas.append(f'<meta property="og:image:alt" content="{e(og_alt)}">')
    lineas += ['<meta name="twitter:card" content="summary_large_image">', '<meta name="theme-color" content="#14100C">',
        '<link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Karla:wght@400;500;700&display=swap" rel="stylesheet">',
        '<link rel="stylesheet" href="{{R}}styles.css">']
    return "\n".join(lineas) + extra

GLOBO = ('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/>'
         '<path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg>')

def selector(l, R, destino):
    """Selector de idioma: enlaces reales a la misma página en cada idioma (funciona sin JavaScript)"""
    if len(IDIOMAS) < 2: return ""
    items = "".join(f'<li><a href="{R}{destino(o)}" hreflang="{o}" lang="{o}" data-cambio-idioma' + (' aria-current="true"' if o == l else "")
                    + f'>{e(TX[o]["nombre"])}</a></li>' for o in IDIOMAS)
    return (f'<details class="idioma" data-idioma><summary aria-label="{e(TX[l]["ui"]["idioma.etiqueta"])}: {e(TX[l]["nombre"])}">'
            f'{GLOBO}<span aria-hidden="true">{l.upper()}</span></summary><ul class="idioma-menu">{items}</ul></details>')

def alternos_json(l, R, destino):
    """Datos para sugerir el idioma del navegador, cada uno escrito en su propio idioma"""
    d = [{"idioma": o, "nombre": TX[o]["nombre"], "url": R + destino(o), "pregunta": TX[o]["ui"]["idioma.pregunta"],
          "etiqueta": TX[o]["ui"]["idioma.etiqueta"], "ver": TX[o]["ui"]["idioma.ver"]} for o in IDIOMAS if o != l]
    return '\n<script type="application/json" id="idiomas">' + json.dumps(d, ensure_ascii=False).replace("</", "<\\/") + "</script>"

def llenar(plantilla, l, R, I, **v):
    t = TX[l]
    if not (t.get("aprobacion") or {}).get("palabrasArtista", True):
        plantilla = re.sub(r"<!--voz-artista-->.*?<!--/voz-artista-->", "", plantilla, flags=re.S)
    plantilla = re.sub(r"<!--/?voz-artista-->", "", plantilla)
    def rep(m):
        tipo, k = m.group(1), m.group(2)
        fuente = {"t": t["pagina"], "ui": t["ui"], "m": t["meta"]}[tipo]
        if k not in fuente: sys.exit(f"Falta la clave «{k}» en textos-{l}.js")
        return fuente[k]
    s = plantilla.replace("{{HEAD}}", v.pop("HEAD"))
    s = s.replace("{{HTML}}", f'<html lang="{l}" data-raiz="{R}" data-inicio="{I}">')
    for k, x in v.items(): s = s.replace("{{" + k + "}}", x)
    s = s.replace("{{R}}", R).replace("{{I}}", I).replace("{{LANG}}", l)
    s = re.sub(r"\{\{(t|ui|m):([\w.]+)\}\}", rep, s)
    if "{{" in s: sys.exit("Quedó un marcador sin llenar: " + s[s.index("{{"):][:40])
    return s

def escribir(rel, contenido):
    p = SALIDA / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(contenido, encoding="utf-8")

def redireccion(destino_js, respaldo, canonical, titulo, extra_head=""):
    """Página mínima que lleva al idioma guardado del visitante (o al predeterminado), conservando ?… y #…"""
    js = ("(function(){var L=%s,d=%s,p;try{p=localStorage.getItem('sa-idioma')}catch(e){}"
          "var l=L.indexOf(p)>=0?p:d;location.replace(%s+location.search+location.hash)})();") % (
          json.dumps(IDIOMAS), json.dumps(DEF), destino_js)
    robots = "" if INDEXAR else '<meta name="robots" content="noindex, nofollow">\n'
    return (f'<!DOCTYPE html>\n<html lang="{DEF}">\n<head>\n<meta charset="utf-8">\n<title>{e(titulo)}</title>\n{robots}'
            f'{canonical}{extra_head}<script>{js}</script>\n<noscript><meta http-equiv="refresh" content="0; url={respaldo}"></noscript>\n'
            f'</head>\n<body><p>' + " · ".join(f'<a href="{l}/" lang="{l}">{e(TX[l]["nombre"])}</a>' for l in IDIOMAS) + "</p></body>\n</html>\n")

# ---------- construir ----------
if SALIDA.exists(): shutil.rmtree(SALIDA)
SALIDA.mkdir()
for f in AQUI.iterdir():
    if f.is_file() and (f.suffix.lower() in ARCHIVOS or f.name in SCRIPTS or f.name in COPIAR_HTML or re.fullmatch(r"textos-[a-z]{2}\.js", f.name)):
        shutil.copy2(f, SALIDA / f.name)

P_INICIO = (AQUI / "plantilla-inicio.html").read_text(encoding="utf-8")
P_OBRA = (AQUI / "plantilla-obra.html").read_text(encoding="utf-8")
sitemap = []
alt_inicio = [(l, URL["inicio"](l)) for l in IDIOMAS] + [("x-default", SITIO)]
for l in IDIOMAS:
    m = TX[l]["meta"]
    ld = {"@context": "https://schema.org", "@type": "Person", "name": CONFIG["nombreLegal"], "jobTitle": m["oficio"], "url": URL["inicio"](l),
          "sameAs": [f"https://www.instagram.com/{CONFIG['instagram']}/"], "address": {"@type": "PostalAddress", "addressLocality": "Vega Alta", "addressCountry": "PR"}}
    extra = '\n<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False) + "\n</script>"
    dest = lambda o: f"{o}/"
    head = cabeza(l, m["titulo"], m["descripcion"], URL["inicio"](l), "website", m["titulo"], m["ogDescripcion"], og(l), "", alt_inicio, extra + alternos_json(l, "../", dest))
    escribir(f"{l}/index.html", llenar(P_INICIO, l, "../", "", HEAD=head, SELECTOR=selector(l, "../", dest)))
    if l == DEF: sitemap.append(alt_inicio)
    for o in OBRAS:
        s, tx_o = o["slug"], TX[l]["obras"].get(o["slug"], {})
        desc = tx_o.get("descripcion") or fmt(m["obraDescripcion"], titulo=o["titulo"])
        alternos = [(a, URL["obra"](a, s)) for a in IDIOMAS] + [("x-default", URL["obra"](DEF, s))]
        ld = {"@context": "https://schema.org", "@type": "VisualArtwork", "name": o["titulo"], "image": SITIO + o["imagen"],
              "description": desc, "creator": {"@type": "Person", "name": CONFIG["nombreLegal"]}, "url": URL["obra"](l, s), "inLanguage": l}
        dest = lambda a, s=s: f"{a}/{ruta_obras(a)}/{s}/"
        extra = '\n<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False) + "\n</script>" + alternos_json(l, "../../../", dest)
        head = cabeza(l, fmt(m["obraTitulo"], titulo=o["titulo"]), desc, URL["obra"](l, s), "product", fmt(m["obraOgTitulo"], titulo=o["titulo"]),
                      desc, og(l, s), tx_o.get("alt", ""), alternos, extra)
        escribir(f"{l}/{ruta_obras(l)}/{s}/index.html", llenar(P_OBRA, l, "../../../", "../../", HEAD=head, SLUG=s, SELECTOR=selector(l, "../../../", dest),
                 NOSCRIPT=e(fmt(m["obraNoscript"], titulo=o["titulo"], telefono=CONFIG["telefono"]))))
        if l == DEF: sitemap.append(alternos)

# Portada raíz y enlaces antiguos
hreflang = lambda alts: "".join(f'<link rel="alternate" hreflang="{a}" href="{u}">\n' for a, u in alts)
mD = TX[DEF]["meta"]
og_raiz = (f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Soto’s Art">\n<meta property="og:title" content="{e(mD["titulo"])}">\n'
           f'<meta property="og:description" content="{e(mD["ogDescripcion"])}">\n<meta property="og:url" content="{SITIO}">\n<meta property="og:image" content="{SITIO}og.jpg">\n'
           '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n')
escribir("index.html", redireccion("l+'/'", f"{DEF}/", hreflang(alt_inicio), mD["titulo"], og_raiz))
for o in OBRAS:
    s = o["slug"]
    # Cada idioma usa su propia carpeta de obras ("obras", "artworks"…)
    destino = "({%s})[l]" % ",".join(f"{json.dumps(l)}:{json.dumps(l + '/' + ruta_obras(l) + '/' + s + '/')}" for l in IDIOMAS)
    og = (f'<meta property="og:type" content="product">\n<meta property="og:title" content="{e(fmt(mD["obraOgTitulo"], titulo=o["titulo"]))}">\n'
          f'<meta property="og:url" content="{URL["obra"](DEF, s)}">\n<meta property="og:image" content="{SITIO}og-{s}.jpg">\n<meta name="twitter:card" content="summary_large_image">\n')
    pagina = redireccion(destino, f"{DEF}/{ruta_obras(DEF)}/{s}/", f'<link rel="canonical" href="{URL["obra"](DEF, s)}">\n', fmt(mD["obraTitulo"], titulo=o["titulo"]), og)
    escribir(f"obra-{s}.html", pagina)

# Revisión de traducciones: español e inglés lado a lado (privada: noindex, sin enlaces)
def planos(d, pre=""):
    if isinstance(d, dict):
        for k, x in d.items(): yield from planos(x, f"{pre}.{k}" if pre else k)
    elif isinstance(d, list):
        for i, x in enumerate(d): yield from planos(x, f"{pre}[{i}]")
    else: yield pre, d
SECCIONES = [("pagina", "Portada"), ("obras", "Obras (los títulos se conservan en español)"), ("recorrido", "Recorrido (curatorial)"),
             ("queVes", "¿Qué ves tú? (curatorial)"), ("dosObras", "Dos obras, una historia (curatorial)"), ("contenido", "Políticas y textos de imágenes"),
             ("ui", "Botones y mensajes"), ("meta", "Buscadores y vistas previas")]
if len(IDIOMAS) > 1:
    filas = []
    for o in IDIOMAS[1:]:
        filas.append(f'<h1>Revisión: {e(TX[DEF]["nombre"])} → {e(TX[o]["nombre"])}</h1><p>Estado del archivo <code>textos-{o}.js</code>: <b>{e(TX[o].get("estado", ""))}</b>. '
                     'Sus propias palabras (declaraciones y la cita) solo se publican en este idioma cuando se marca '
                     f'<code>palabrasArtista: true</code>. Ahora: <b>{"publicadas" if (TX[o].get("aprobacion") or {}).get("palabrasArtista", True) else "ocultas hasta su aprobación"}</b>.</p>')
        for sec, nombre in SECCIONES:
            orig = dict(planos(TX[DEF].get(sec, {}))); trad = dict(planos(TX[o].get(sec, {})))
            filas.append(f"<h2>{e(nombre)}</h2><table><tr><th>Clave</th><th lang='{DEF}'>{e(TX[DEF]['nombre'])}</th><th lang='{o}'>{e(TX[o]['nombre'])}</th></tr>")
            for k in sorted(set(orig) | set(trad), key=lambda k: list(orig).index(k) if k in orig else 1e9):
                a, b = orig.get(k, ""), trad.get(k, "")
                if a in ("", None) and b in ("", None) or isinstance(a, bool): continue
                cls = ' class="falta"' if (a and not b) else ""
                filas.append(f"<tr{cls}><td><code>{e(k)}</code></td><td lang='{DEF}'>{e(a)}</td><td lang='{o}'>{e(b)}</td></tr>")
            filas.append("</table>")
    escribir("revision-traducciones.html", '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="robots" content="noindex, nofollow"><title>Revisión de traducciones · Soto’s Art</title><style>'
        'body{font:15px/1.5 system-ui,sans-serif;margin:1rem;color:#222;background:#fbf8f2}h1{font-size:1.3rem}h2{font-size:1.05rem;margin-top:2rem}'
        'table{border-collapse:collapse;width:100%;background:#fff}td,th{border:1px solid #ddd;padding:.45rem;vertical-align:top;text-align:left}'
        'th{background:#f1ebe0}td:first-child{width:16%;color:#888;font-size:.8rem;word-break:break-all}.falta td{background:#fff2f0}</style></head><body>'
        + "".join(filas) + "</body></html>\n")

# Sitemap multilingüe y robots
urls = "".join("  <url><loc>%s</loc>\n%s  </url>\n" % (dict(a)[DEF], "".join(f'    <xhtml:link rel="alternate" hreflang="{h}" href="{u}"/>\n' for h, u in a)) for a in sitemap)
escribir("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls + "</urlset>\n")
# robots.txt siempre permite el acceso, para que WhatsApp y Facebook lean las vistas previas.
escribir("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITIO}sitemap.xml\n")
escribir(".nojekyll", "")
print(f"Sitio listo en {SALIDA.name}/: idiomas {', '.join(IDIOMAS)}, {len(OBRAS)} obras. Buscadores: {'activados' if INDEXAR else 'desactivados (prototipo)'}.")
