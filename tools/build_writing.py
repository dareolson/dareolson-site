#!/usr/bin/env python3
"""Build the Writing section from writing-src/*.md.

Each source file: front matter (title, dek, date, outlet, archive, live) then the story text.
Output: pages/writing/<slug>.html and pages/writing/index.html. Run from the repo root:
    python3 tools/build_writing.py
"""
import re, os, glob, json, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "writing-src")
OUT = os.path.join(ROOT, "pages", "writing")
SHOW_DATES = True            # set False to hide dates on article pages and the index
COVER_MIN_WORDS = 2000       # stories this long ran as OC Weekly cover stories
SITE = "https://dareolson.com"

NAV = """<nav id="main-nav">
    <a href="{r}index.html">HOME</a>
    <a href="{r}pages/builds/index.html">BUILDS</a>
    <a href="{r}pages/work/index.html">FILM</a>
    <a href="{r}pages/writing/index.html"{wa}>WRITING</a>
    <a href="{r}pages/about.html">ABOUT</a>
    <a href="{r}pages/contact.html">CONTACT</a>
  </nav>"""

def esc(s): return html.escape(s, quote=True)

def parse(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n\n(.*)", t, re.S)
    fm = {}
    for line in m.group(1).split("\n"):
        k, _, v = line.partition(": ")
        fm[k] = json.loads(v) if v.startswith('"') else v.strip()
    body = m.group(2).strip()
    fm["slug"] = os.path.splitext(os.path.basename(path))[0]
    fm["blocks"] = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]
    return fm

def clean_blocks(blocks):
    out = []
    for b in blocks:
        if b.startswith("*[") and b.endswith("]*"): continue                  # photo captions (images held back)
        if re.fullmatch(r"(?i)[a-z]+@[a-z.]*ocweekly\.com", b): continue       # byline email
        if re.fullmatch(r"[•\s\d]*(Next)?", b): continue                        # leftover pagination
        if re.fullmatch(r"[\*\s]+", b) or b == "* * *": out.append("<hr>"); continue
        out.append(b)
    while out and out[-1] == "<hr>": out.pop()
    return out

def para_html(b):
    if b == "<hr>": return '<hr class="break" aria-hidden="true">'
    lines = [esc(l.strip()) for l in b.split("\n") if l.strip()]
    return "<p>" + "<br>".join(lines) + "</p>"

def fmt_date(iso, short=False):
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%b %Y") if short else d.strftime("%B %-d, %Y")

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐸</text></svg>">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="author" content="Derek Olson">
  <link rel="canonical" href="{url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="{ogtype}">
  <meta property="og:image" content="{site}/img/og-image.png">
{jsonld}  <link rel="stylesheet" href="{r}css/style.css">
  <link rel="stylesheet" href="{r}css/work.css">
  <link rel="stylesheet" href="{r}css/writing.css">
  <link rel="preload" href="{r}fonts/newsreader-400-latin.woff2" as="font" type="font/woff2" crossorigin>
</head>
<body class="interior">
  {nav}
"""

TAIL = """
  <script src="{r}js/main.js?v=3"></script>
  <script data-goatcounter="https://dareolson.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
"""

def article_page(a, prev, nxt):
    blocks = clean_blocks(a["blocks"])
    words = sum(len(b.split()) for b in blocks if b != "<hr>")
    mins = max(1, round(words / 230))
    cover = words >= COVER_MIN_WORDS
    url = "%s/pages/writing/%s.html" % (SITE, a["slug"])
    desc = a["dek"] or re.sub(r"\s+", " ", blocks[0])[:155]
    ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": a["title"], "description": desc,
          "author": {"@type": "Person", "name": "Derek Olson", "url": SITE}, "publisher": {"@type": "Organization", "name": "OC Weekly"},
          "datePublished": a["date"], "mainEntityOfPage": url}
    if a.get("archive"): ld["isBasedOn"] = a["archive"]
    jsonld = '  <script type="application/ld+json">\n  %s\n  </script>\n' % json.dumps(ld, ensure_ascii=False)
    h = HEAD.format(title=esc(a["title"] + " | Derek Olson"), desc=esc(desc), url=url, ogtype="article", site=SITE, jsonld=jsonld,
                    r="../../", nav=NAV.format(r="../../", wa=' class="nav-active"'))
    meta = ["By Derek Olson", "OC Weekly"]
    if SHOW_DATES: meta.append(fmt_date(a["date"]))
    meta.append("%d min read" % mins)
    h += '  <main id="story-page">\n    <a class="back-link" href="index.html">&larr; All writing</a>\n'
    if cover: h += '    <p class="story-tag">Cover story</p>\n'
    h += '    <h1 class="story-title">%s</h1>\n' % esc(a["title"])
    if a["dek"]: h += '    <p class="story-dek">%s</p>\n' % esc(a["dek"])
    h += '    <p class="story-meta">%s</p>\n    <article class="story-body">\n' % " &middot; ".join(esc(m) for m in meta)
    h += "\n".join("      " + para_html(b) for b in blocks) + "\n    </article>\n"
    h += '    <aside class="story-source">\n      <h2>Original publication</h2>\n      <p>First published in OC Weekly. This is the author\'s copy of the full text.</p>\n      <ul>\n'
    if a.get("archive"): h += '        <li><a href="%s" target="_blank" rel="noopener">Read the archived original on the Wayback Machine <span aria-hidden="true">&#8599;</span></a></li>\n' % esc(a["archive"])
    if a.get("live"): h += '        <li><a href="%s" target="_blank" rel="noopener">Also on OC Weekly&rsquo;s current site <span aria-hidden="true">&#8599;</span></a></li>\n' % esc(a["live"])
    h += "      </ul>\n    </aside>\n"
    nav = []
    if prev: nav.append('<a href="%s.html"><span class="dir">Previous</span><span class="t">%s</span></a>' % (prev["slug"], esc(prev["title"])))
    if nxt: nav.append('<a href="%s.html"><span class="dir">Next</span><span class="t">%s</span></a>' % (nxt["slug"], esc(nxt["title"])))
    if nav: h += '    <nav class="story-nav" aria-label="More stories">' + "".join(nav) + "</nav>\n"
    h += "  </main>\n" + TAIL.format(r="../../")
    return h, words, cover

def index_page(stories):
    url = SITE + "/pages/writing/"
    desc = "Cover stories and features by Derek Olson from his years as a reporter at OC Weekly, with links to the archived originals."
    h = HEAD.format(title="Writing | Derek Olson", desc=esc(desc), url=url, ogtype="website", site=SITE, jsonld="", r="../../",
                    nav=NAV.format(r="../../", wa=' class="nav-active"'))
    h += '''  <main id="writing-page">
    <header class="writing-hero">
      <div class="writing-hero-text">
        <h1 class="page-title">Writing</h1>
        <p class="lede">Before I picked up a camera, I covered crime, politics, and the people in between for OC Weekly. These are the cover stories and features, full text, each with a link to the archived original.</p>
      </div>
      <figure class="writing-hero-photo"><img src="../../img/writing/derek-journalist.webp" width="1200" height="1200" alt="Derek Olson at a desk in a dim room, on the phone, with an old rotary telephone and a desk lamp" decoding="async" fetchpriority="high"></figure>
    </header>
'''
    def row(s):
        when = fmt_date(s["date"], short=True) if SHOW_DATES else ""
        return ('        <li><a class="story-row" href="%s.html"><span class="when">%s</span><span class="what"><strong>%s</strong>%s<span class="read">%d min read</span></span></a></li>\n'
                % (s["slug"], when, esc(s["title"]), ('<span class="sub">%s</span>' % esc(s["dek"])) if s["dek"] else "", s["mins"]))
    covers = [s for s in stories if s["cover"]]; rest = [s for s in stories if not s["cover"]]
    h += '    <section class="writing-section">\n      <h2>Cover stories</h2>\n      <ul class="story-list">\n' + "".join(row(s) for s in covers) + "      </ul>\n    </section>\n"
    h += '    <section class="writing-section">\n      <h2>Features and news</h2>\n      <ul class="story-list">\n' + "".join(row(s) for s in rest) + "      </ul>\n    </section>\n"
    h += "  </main>\n" + TAIL.format(r="../../")
    return h

def main():
    os.makedirs(OUT, exist_ok=True)
    arts = sorted((parse(p) for p in glob.glob(os.path.join(SRC, "*.md"))), key=lambda a: a["date"], reverse=True)
    stories = []
    for i, a in enumerate(arts):
        prev = arts[i + 1] if i + 1 < len(arts) else None   # older
        nxt = arts[i - 1] if i > 0 else None                 # newer
        page, words, cover = article_page(a, prev, nxt)
        open(os.path.join(OUT, a["slug"] + ".html"), "w", encoding="utf-8").write(page)
        stories.append({"slug": a["slug"], "title": a["title"], "dek": a["dek"], "date": a["date"], "cover": cover, "words": words,
                        "mins": max(1, round(words / 230))})
        print("%-62s %5d words  %s" % (a["slug"][:62], words, "cover" if cover else ""))
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(index_page(stories))
    # sitemap fragment
    frag = "".join("  <url>\n    <loc>%s/pages/writing/%s.html</loc>\n    <lastmod>%s</lastmod>\n    <priority>0.6</priority>\n  </url>\n" % (SITE, s["slug"], datetime.date.today().isoformat()) for s in stories)
    open(os.path.join(ROOT, "tools", "sitemap_writing.xml.frag"), "w").write(frag)

if __name__ == "__main__":
    main()
