#!/usr/bin/env python3
"""Build the Writing section ("Back Issues") from writing-src/.

Inputs
  writing-src/<slug>.md        front matter (title, dek, date, outlet, archive, live) + story text
  writing-src/_editorial.json  publication name, lead story, ranking, covers, pull quotes
  img/writing/covers/<slug>.webp   cover art (optional per story)
  img/writing/art/<slug>.webp      illustration for the story header (optional; drop-in, e.g. from Codex)

Output
  pages/writing/<slug>.html and pages/writing/index.html

Run from the repo root:  python3 tools/build_writing.py
"""
import re, os, glob, json, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "writing-src")
OUT = os.path.join(ROOT, "pages", "writing")
SITE = "https://dareolson.com"
SHOW_DATES = True          # False hides dates on story pages and in the index
COVER_MIN_WORDS = 2000     # stories this long ran as OC Weekly cover stories

EDITORIAL = json.load(open(os.path.join(SRC, "_editorial.json"), encoding="utf-8"))
PUB = EDITORIAL["publication"]

NAV = """<nav id="main-nav">
    <a href="{r}index.html">HOME</a>
    <a href="{r}pages/builds/index.html">BUILDS</a>
    <a href="{r}pages/work/index.html">FILM</a>
    <a href="{r}pages/writing/index.html" class="nav-active">WRITING</a>
    <a href="{r}pages/about.html">ABOUT</a>
    <a href="{r}pages/contact.html">CONTACT</a>
  </nav>"""

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
  <meta property="og:image" content="{ogimage}">
{jsonld}  <link rel="stylesheet" href="../../css/style.css">
  <link rel="stylesheet" href="../../css/work.css">
  <link rel="stylesheet" href="../../css/writing.css">
  <link rel="preload" href="../../fonts/newsreader-400-latin.woff2" as="font" type="font/woff2" crossorigin>
</head>
<body class="interior">
  {nav}
"""

TAIL = """
  <script src="../../js/main.js?v=3"></script>
  <script data-goatcounter="https://dareolson.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
"""


def esc(s):
    return html.escape(s, quote=True)


def norm(s):
    s = s.lower().replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s)


def parse(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n\n(.*)", t, re.S)
    fm = {}
    for line in m.group(1).split("\n"):
        k, _, v = line.partition(": ")
        fm[k] = json.loads(v) if v.startswith('"') else v.strip()
    fm["slug"] = os.path.splitext(os.path.basename(path))[0]
    fm["blocks"] = [b.strip() for b in re.split(r"\n\s*\n", m.group(2).strip()) if b.strip()]
    return fm


PHOTOGRAPHERS = ("John Gilhooley", "Jennie Warren", "Jonathan Ho")


def is_web_junk(b):
    """Leftovers from the old OC Weekly pages: photo captions, page jumps, widget fragments, dead links."""
    if re.fullmatch(r"[\[\]•\s]+", b):
        return True
    if re.fullmatch(r"(?i)continued (from|on) page \d+\.?", b):
        return True
    if re.fullmatch(r"(?i)contact\s+us about this article\.?", b):
        return True
    if re.search(r"(?i)audio slideshow", b) and len(b) < 120:
        return True
    if len(b) < 260 and re.search(r"\b[Pp]hotos? by\b", b):
        return True
    if any(b.startswith(p + "\n") for p in PHOTOGRAPHERS) and len(b) < 220:
        return True
    return False


def clean_blocks(blocks):
    out = []
    for b in blocks:
        if is_web_junk(b):
            continue
        if b.startswith("*[") and b.endswith("]*"):
            continue
        if re.fullmatch(r"(?i)[a-z]+@[a-z.]*ocweekly\.com", b):
            continue
        if re.fullmatch(r"[•\s\d]*(Next)?", b):
            continue
        if re.fullmatch(r"[\*\s]+", b):
            out.append("<hr>")
            continue
        out.append(b)
    while out and out[-1] == "<hr>":
        out.pop()
    return out


def fmt_date(iso, short=False):
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%b %Y") if short else d.strftime("%B %-d, %Y")


def has(path):
    return os.path.exists(os.path.join(ROOT, path))


def cover_path(slug):
    p = "img/writing/covers/%s.webp" % slug
    return p if has(p) else None


def issue_label(c):
    return "OC Weekly &middot; Vol. %d, No. %d" % (c["vol"], c["no"]) if c else ""


def para_html(b):
    if b == "<hr>":
        return '<hr class="break" aria-hidden="true">'
    lines = [esc(l.strip()) for l in b.split("\n") if l.strip()]
    return "<p>" + "<br>".join(lines) + "</p>"


def pullquote_html(q):
    return ('<aside class="pullquote"><blockquote><p>“%s”</p></blockquote><p class="who">%s</p></aside>'
            % (esc(q["text"]), esc(q["who"])))


def place_quotes(blocks, quotes, slug):
    """Return list of (block_index, quote) so each quote follows the paragraph it came from."""
    placed = []
    last = -99
    for q in quotes:
        needle = norm(q["text"])[:48].replace("[", "").replace("]", "")
        idx = None
        for i, b in enumerate(blocks):
            if b != "<hr>" and needle in norm(b).replace("[", "").replace("]", ""):
                idx = i
                break
        if idx is None:
            print("  WARNING: quote not found in %s: %s" % (slug, q["text"][:50]))
            continue
        idx = idx + 4                      # a few paragraphs after the source line, so it never repeats it back to back
        idx = max(idx, last + 8)
        idx = min(idx, len(blocks) - 3)
        placed.append((idx, q))
        last = idx
    return placed


def story_meta(a):
    ed = EDITORIAL["stories"].get(a["slug"], {})
    blocks = clean_blocks(a["blocks"])
    words = sum(len(b.split()) for b in blocks if b != "<hr>")
    return {
        "slug": a["slug"], "title": a["title"], "dek": a["dek"] or EDITORIAL.get("deks", {}).get(a["slug"], ""), "date": a["date"], "blocks": blocks,
        "words": words, "mins": max(1, round(words / 230)), "cover_story": words >= COVER_MIN_WORDS,
        "cover_meta": ed.get("cover"), "cover_img": cover_path(a["slug"]), "quotes": ed.get("quotes", []),
        "archive": a.get("archive", ""), "live": a.get("live", ""),
        "start_here": a["slug"] in EDITORIAL.get("start_here", []),
        "art": ("img/writing/art/%s.webp" % a["slug"]) if has("img/writing/art/%s.webp" % a["slug"]) else None,
    }


def story_page(s, older, newer):
    url = "%s/pages/writing/%s.html" % (SITE, s["slug"])
    desc = s["dek"] or re.sub(r"\s+", " ", s["blocks"][0])[:155]
    og = SITE + "/" + (s["cover_img"] or "img/og-image.png")
    ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": s["title"], "description": desc,
          "author": {"@type": "Person", "name": "Derek Olson", "url": SITE}, "publisher": {"@type": "Organization", "name": "OC Weekly"},
          "datePublished": s["date"], "mainEntityOfPage": url, "image": og}
    if s["archive"]:
        ld["isBasedOn"] = s["archive"]
    jsonld = '  <script type="application/ld+json">\n  %s\n  </script>\n' % json.dumps(ld, ensure_ascii=False)
    h = HEAD.format(title=esc(s["title"] + " | " + PUB["name"] + ", Derek Olson"), desc=esc(desc), url=url, ogtype="article",
                    ogimage=og, jsonld=jsonld, nav=NAV.format(r="../../"))
    meta = ["By Derek Olson", "OC Weekly"]
    if SHOW_DATES:
        meta.append(fmt_date(s["date"]))
    meta.append("%d min read" % s["mins"])
    tags = []
    if s["cover_story"]:
        tags.append("Cover story")
    if s["start_here"]:
        tags.append("Start here")
    h += '  <main id="story-page">\n    <a class="back-link" href="index.html">&larr; %s</a>\n' % esc(PUB["name"])
    h += '    <header class="story-head%s">\n      <div class="story-head-text">\n' % (" has-cover" if s["cover_img"] else "")
    if tags:
        h += '        <p class="story-tag">%s</p>\n' % " &middot; ".join(tags)
    h += '        <h1 class="story-title">%s</h1>\n' % esc(s["title"])
    if s["dek"]:
        h += '        <p class="story-dek">%s</p>\n' % esc(s["dek"])
    h += '        <p class="story-meta">%s</p>\n      </div>\n' % " &middot; ".join(esc(m) for m in meta)
    if s["cover_img"]:
        c = s["cover_meta"] or {}
        h += ('      <figure class="story-cover"><img src="../../%s" alt="%s" decoding="async" fetchpriority="high"><figcaption>%s</figcaption></figure>\n'
              % (s["cover_img"], esc(c.get("alt", s["title"] + " cover")), issue_label(c) if c else ""))
    h += "    </header>\n"
    if s["art"]:
        h += '    <figure class="story-art"><img src="../../%s" alt="Illustration for %s" loading="lazy" decoding="async"></figure>\n' % (s["art"], esc(s["title"]))
    placed = dict((i, q) for i, q in place_quotes(s["blocks"], s["quotes"], s["slug"]))
    h += '    <article class="story-body">\n'
    for i, b in enumerate(s["blocks"]):
        h += "      " + para_html(b) + "\n"
        if i in placed:
            h += "      " + pullquote_html(placed[i]) + "\n"
    h += "    </article>\n"
    h += '    <aside class="story-source">\n      <h2>Original publication</h2>\n      <p>First published in OC Weekly. This is the author\'s copy of the full text.</p>\n      <ul>\n'
    if s["archive"]:
        h += '        <li><a href="%s" target="_blank" rel="noopener">Read the archived original on the Wayback Machine <span aria-hidden="true">&#8599;</span></a></li>\n' % esc(s["archive"])
    if s["live"]:
        h += '        <li><a href="%s" target="_blank" rel="noopener">Also on OC Weekly&rsquo;s current site <span aria-hidden="true">&#8599;</span></a></li>\n' % esc(s["live"])
    h += "      </ul>\n    </aside>\n"
    nav = []
    if older:
        nav.append('<a href="%s.html"><span class="dir">Previous</span><span class="t">%s</span></a>' % (older["slug"], esc(older["title"])))
    if newer:
        nav.append('<a href="%s.html"><span class="dir">Next</span><span class="t">%s</span></a>' % (newer["slug"], esc(newer["title"])))
    if nav:
        h += '    <nav class="story-nav" aria-label="More stories">' + "".join(nav) + "</nav>\n"
    return h + "  </main>\n" + TAIL


def cover_card(s):
    c = s["cover_meta"]
    if s["cover_img"]:
        art = '<img src="../../%s" alt="%s" loading="lazy" decoding="async">' % (s["cover_img"], esc((c or {}).get("alt", s["title"])))
        label = "Vol. %d &middot; No. %d" % (c["vol"], c["no"]) if c else ""
    else:
        art = '<span class="typo-cover" aria-hidden="true"><span class="typo-mast">OC WEEKLY</span><span class="typo-title">%s</span></span>' % esc(s["title"])
        label = "Cover story"
    badge = '<span class="badge">Start here</span>' if s["start_here"] else ""
    card = EDITORIAL.get("cards", {}).get(s["slug"], {})
    return ('        <li><a class="cover-card" href="%s.html"><span class="cover-art">%s%s</span><span class="cover-label">%s</span>'
            '<strong>%s</strong><span class="cover-dek">%s</span></a></li>\n'
            % (s["slug"], art, badge, label, esc(card.get("title", s["title"])), esc(card.get("dek", s["dek"]))))


def index_page(stories):
    by = {s["slug"]: s for s in stories}
    lead = by[EDITORIAL["lead"]]
    order = [by[x] for x in EDITORIAL["order"] if x in by]
    wall = [s for s in order if s["slug"] != lead["slug"]]
    brief = sorted([s for s in stories if not s["cover_story"]], key=lambda s: s["date"], reverse=True)
    url = SITE + "/pages/writing/"
    desc = "%s: %s" % (PUB["name"], PUB["standfirst"])
    h = HEAD.format(title=esc(PUB["name"] + " | Stories by Derek Olson"), desc=esc(desc), url=url, ogtype="website",
                    ogimage=SITE + "/" + (lead["cover_img"] or "img/og-image.png"), jsonld="", nav=NAV.format(r="../../"))
    h += '  <main id="writing-page">\n'
    h += ('    <header class="pub-mast">\n      <p class="pub-kicker">%s</p>\n      <h1 class="pub-name">%s</h1>\n      <p class="pub-standfirst">%s</p>\n    </header>\n'
          % (esc(PUB["tagline"]), esc(PUB["name"]), esc(PUB["standfirst"])))
    lq = lead["quotes"][0] if lead["quotes"] else None
    h += '    <section class="pub-lead" aria-label="Lead story">\n'
    if lead["cover_img"]:
        c = lead["cover_meta"]
        h += '      <a class="lead-cover" href="%s.html"><img src="../../%s" alt="%s" fetchpriority="high" decoding="async"></a>\n' % (lead["slug"], lead["cover_img"], esc(c["alt"]))
    h += '      <div class="lead-text">\n        <p class="story-tag">Cover story &middot; Start here</p>\n'
    h += '        <h2 class="lead-title"><a href="%s.html">%s</a></h2>\n        <p class="lead-dek">%s</p>\n' % (lead["slug"], esc(lead["title"]), esc(lead["dek"]))
    if lq:
        h += '        <blockquote class="lead-quote"><p>“%s”</p><footer>%s</footer></blockquote>\n' % (esc(lq["text"]), esc(lq["who"]))
    h += '        <p class="lead-meta">%d min read &middot; <a href="%s.html">Read the story <span aria-hidden="true">&rarr;</span></a></p>\n      </div>\n    </section>\n' % (lead["mins"], lead["slug"])
    h += '    <section class="pub-wall" aria-labelledby="wall-h">\n      <h2 id="wall-h" class="sec-h">More cover stories</h2>\n      <ul class="cover-grid">\n'
    h += "".join(cover_card(s) for s in wall) + "      </ul>\n    </section>\n"
    band = by.get("roll-player")
    if band and band["quotes"]:
        q = band["quotes"][0]
        h += ('    <figure class="quote-band"><blockquote><p>“%s”</p></blockquote><figcaption>%s, in <a href="roll-player.html">Roll Player</a></figcaption></figure>\n'
              % (esc(q["text"]), esc(q["who"])))
    h += '    <section class="pub-brief">\n      <h2 class="sec-h">Features and news</h2>\n      <ul class="story-list">\n'
    for s in brief:
        when = fmt_date(s["date"], short=True) if SHOW_DATES else ""
        h += ('        <li><a class="story-row" href="%s.html"><span class="when">%s</span><span class="what"><strong>%s</strong><span class="read">%d min read</span></span></a></li>\n'
              % (s["slug"], when, esc(s["title"]), s["mins"]))
    h += "      </ul>\n    </section>\n"
    h += '''    <section class="pub-writer">
      <figure class="writer-photo"><img src="../../img/writing/derek-journalist.webp" width="1200" height="1200" alt="Derek Olson at a desk on an old rotary phone, with a desk lamp beside him" loading="lazy" decoding="async"></figure>
      <div class="writer-text">
        <h2 class="sec-h">About the writer</h2>
        <p>Derek Olson covered crime and politics as a reporter and studied at the Poynter Institute before he picked up a camera. His reporting won a Los Angeles Press Club honorable mention and a Nevada Press Association first place for feature writing. He is a filmmaker and developer in Minot, North Dakota.</p>
        <p><a href="../about.html">More about Derek <span aria-hidden="true">&rarr;</span></a></p>
      </div>
    </section>
'''
    return h + "  </main>\n" + TAIL


def main():
    os.makedirs(OUT, exist_ok=True)
    arts = sorted((parse(p) for p in glob.glob(os.path.join(SRC, "*.md"))), key=lambda a: a["date"], reverse=True)
    stories = [story_meta(a) for a in arts]
    for i, s in enumerate(stories):
        older = stories[i + 1] if i + 1 < len(stories) else None
        newer = stories[i - 1] if i > 0 else None
        open(os.path.join(OUT, s["slug"] + ".html"), "w", encoding="utf-8").write(story_page(s, older, newer))
        print("%-62s %5d words  %s%s%s" % (s["slug"][:62], s["words"], "cover " if s["cover_story"] else "", "[cover art] " if s["cover_img"] else "", "[art] " if s["art"] else ""))
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(index_page(stories))


if __name__ == "__main__":
    main()
