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
{extras}{jsonld}  <link rel="stylesheet" href="../../css/style.css">
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

PERSON_ID = SITE + "/#derek"
ORG_ID = SITE + "/#grain-and-thunder"
# One identity, used on every page, so search engines connect the byline, the company, and the awards to the same person.
PERSON = {
    "@type": "Person", "@id": PERSON_ID, "name": "Derek Olson", "alternateName": ["Dare Olson", "Derek \u201cDare\u201d Olson"],
    "url": SITE + "/pages/about.html", "mainEntityOfPage": SITE + "/pages/about.html",
    "jobTitle": "Founder and Creative Director, Grain and Thunder; journalist; filmmaker; developer",
    "description": "Derek \u201cDare\u201d Olson is a journalist, filmmaker, and developer in Minot, North Dakota. He is the founder of Grain and Thunder and a former investigative reporter at OC Weekly.",
    "worksFor": {"@id": ORG_ID},
    "award": [
        "Bronze, 47th Annual Telly Awards, for the animated pilot Millennial Taekwondo Tortoises",
        "Honorable mention, Entertainment Feature, Los Angeles Press Club Southern California Journalism Awards",
        "First place, Best Feature Story, Nevada Press Association Better Newspaper Contest",
    ],
    "knowsAbout": ["investigative journalism", "documentary film", "cinematography", "web development"],
    "address": {"@type": "PostalAddress", "addressLocality": "Minot", "addressRegion": "ND", "addressCountry": "US"},
    "sameAs": ["https://grainandthunder.com", "https://www.grainandthunder.com/press/telly-47", "https://www.linkedin.com/in/dareolson",
               "https://github.com/dareolson", "https://www.youtube.com/@dareolson"],
}
ORG_GT = {"@type": "Organization", "@id": ORG_ID, "name": "Grain and Thunder", "url": "https://grainandthunder.com",
          "description": "A documentary and commercial production company in Minot, North Dakota, founded by Derek Olson.",
          "founder": {"@id": PERSON_ID}, "sameAs": ["https://www.youtube.com/@GrainAndThunder"]}
PUBLISHER = {"@type": "NewsMediaOrganization", "name": "OC Weekly", "url": "https://www.ocweekly.com"}
BUILD_DATE = datetime.date.today().isoformat()
PORTRAIT = "img/writing/derek-journalist.webp"


def trim(t, n=155):
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) <= n:
        return t
    cut = t[:n].rsplit(" ", 1)[0].rstrip(",;:\u2014-")
    return cut + "\u2026"


def seo_extras(url, title, desc, image, image_alt, article=None):
    """Open Graph, Twitter card, robots, and article tags."""
    x = '  <meta property="og:site_name" content="Derek Olson">\n  <meta property="og:locale" content="en_US">\n'
    x += '  <meta property="og:image:alt" content="%s">\n' % esc(image_alt)
    x += '  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="%s">\n  <meta name="twitter:description" content="%s">\n  <meta name="twitter:image" content="%s">\n' % (esc(title), esc(desc), image)
    x += '  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">\n'
    if article:
        x += '  <meta property="article:published_time" content="%s">\n  <meta property="article:modified_time" content="%s">\n' % (article["date"], BUILD_DATE)
        x += '  <meta property="article:author" content="%s/pages/about.html">\n  <meta property="article:section" content="%s">\n' % (SITE, esc(article["section"]))
    return x


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
    desc = trim(blurb(s) or s["dek"] or s["blocks"][0])
    img = SITE + "/" + (s["cover_img"] or PORTRAIT)
    imgs = [img] + ([SITE + "/" + PORTRAIT] if s["cover_img"] else [])
    section = "Cover story" if s["cover_story"] else "Features and news"
    long_tag = s["title"] + " | Derek Olson, OC Weekly"
    ttl = long_tag if len(long_tag) <= 64 else EDITORIAL.get("seo_titles", {}).get(s["slug"], s["title"]) + " | Derek Olson"
    article = {
        "@type": "NewsArticle", "@id": url + "#article", "url": url, "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "headline": s["title"][:110], "name": s["title"], "description": desc, "inLanguage": "en-US", "isAccessibleForFree": True,
        "datePublished": s["date"], "dateModified": BUILD_DATE, "wordCount": s["words"], "articleSection": section,
        "author": dict(PERSON), "creator": {"@id": PERSON_ID}, "publisher": PUBLISHER, "image": imgs,
    }
    if s["archive"]:
        article["isBasedOn"] = s["archive"]
        article["sameAs"] = [s["archive"]] + ([s["live"]] if s["live"] else [])
    crumbs = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Derek Olson", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Writing", "item": SITE + "/pages/writing/"},
        {"@type": "ListItem", "position": 3, "name": s["title"], "item": url}]}
    ld = {"@context": "https://schema.org", "@graph": [article, crumbs, ORG_GT]}
    jsonld = '  <script type="application/ld+json">\n  %s\n  </script>\n' % json.dumps(ld, ensure_ascii=False)
    extras = seo_extras(url, ttl, desc, img, (s["cover_meta"] or {}).get("alt", "Derek Olson, journalist"), {"date": s["date"], "section": section})
    h = HEAD.format(title=esc(ttl), desc=esc(desc), url=url, ogtype="article", ogimage=img, extras=extras, jsonld=jsonld, nav=NAV.format(r="../../"))
    byline = '<span>By <a rel="author" href="../about.html">Derek Olson</a></span>'
    meta = [byline, "OC Weekly"]
    if SHOW_DATES:
        meta.append('<time datetime="%s">%s</time>' % (s["date"], fmt_date(s["date"])))
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
    h += '        <p class="story-meta">%s</p>\n      </div>\n' % " &middot; ".join(meta)
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


def blurb(s):
    return EDITORIAL.get("blurbs", {}).get(s["slug"], s["dek"])


def card_title(s):
    return EDITORIAL.get("cards", {}).get(s["slug"], {}).get("title") or EDITORIAL.get("titles", {}).get(s["slug"]) or s["title"]


def kicker(s, label="Cover story"):
    return "%s%s" % (label, (" &middot; " + fmt_date(s["date"], short=True)) if SHOW_DATES else "")


def read_line(s):
    return '<p class="feat-more"><span>%d min read</span><a href="%s.html">Read the story <span aria-hidden="true">&rarr;</span></a></p>' % (s["mins"], s["slug"])


def cover_img(s, eager=False, sizes=""):
    c = s["cover_meta"] or {}
    return '<img src="../../%s" alt="%s" %sdecoding="async">' % (s["cover_img"], esc(c.get("alt", s["title"])), 'fetchpriority="high" ' if eager else 'loading="lazy" ')


def quote_html(s, i=0, cls="feat-quote"):
    if len(s["quotes"]) <= i:
        return ""
    q = s["quotes"][i]
    return '<blockquote class="%s"><p>\u201c%s\u201d</p><footer>%s</footer></blockquote>' % (cls, esc(q["text"]), esc(q["who"]))


def feature_lead(s):
    return ('      <article class="feat feat-lead">\n        <a class="feat-cover" href="%s.html">%s</a>\n        <div class="feat-text">\n'
            '          <p class="kicker">%s</p>\n          <h3><a href="%s.html">%s</a></h3>\n          <p class="blurb">%s</p>\n          %s\n          %s\n        </div>\n      </article>\n'
            % (s["slug"], cover_img(s, True), kicker(s), s["slug"], esc(card_title(s)), esc(blurb(s)), quote_html(s, 0), read_line(s)))


def feature_card(s, cls=""):
    return ('        <article class="feat feat-card %s">\n          <a class="feat-cover" href="%s.html">%s</a>\n          <p class="kicker">%s</p>\n          <h3><a href="%s.html">%s</a></h3>\n          <p class="blurb">%s</p>\n          %s\n        </article>\n'
            % (cls, s["slug"], cover_img(s), kicker(s), s["slug"], esc(card_title(s)), esc(blurb(s)), read_line(s)))


def feature_wide(s, reverse=False):
    return ('      <article class="feat feat-wide%s">\n        <a class="feat-cover" href="%s.html">%s</a>\n        <div class="feat-text">\n'
            '          <p class="kicker">%s</p>\n          <h3><a href="%s.html">%s</a></h3>\n          <p class="blurb">%s</p>\n          %s\n          %s\n        </div>\n      </article>\n'
            % (" reverse" if reverse else "", s["slug"], cover_img(s), kicker(s), s["slug"], esc(card_title(s)), esc(blurb(s)), quote_html(s, 0), read_line(s)))


def feature_type(s):
    q = s["quotes"][1] if len(s["quotes"]) > 1 else (s["quotes"][0] if s["quotes"] else None)
    qh = ""
    if q:
        qh = '<blockquote class="type-quote"><p>\u201c%s\u201d</p><footer>%s</footer></blockquote>' % (esc(q["text"]), esc(q["who"]))
    return ('      <article class="feat feat-type">\n        <div class="type-body">\n          <p class="kicker">%s</p>\n          %s\n'
            '          <h3><a href="%s.html">%s</a></h3>\n          <p class="blurb">%s</p>\n          %s\n        </div>\n      </article>\n'
            % (kicker(s), qh, s["slug"], esc(card_title(s)), esc(blurb(s)), read_line(s)))


def brief_card(s):
    return ('        <li><a class="brief" href="%s.html"><span class="kicker">%s</span><strong>%s</strong><span class="blurb">%s</span><span class="read">%d min read</span></a></li>\n'
            % (s["slug"], fmt_date(s["date"], short=True) if SHOW_DATES else "", esc(card_title(s)), esc(blurb(s)), s["mins"]))


def index_page(stories):
    by = {s["slug"]: s for s in stories}
    brief = sorted([s for s in stories if not s["cover_story"]], key=lambda s: s["date"], reverse=True)
    url = SITE + "/pages/writing/"
    intro = PUB["standfirst"]
    ttl = "Writing | Derek Olson: investigative and feature journalism"
    desc = "Cover stories and features by Derek Olson, a former investigative reporter at OC Weekly, in full, with links to the archived originals."
    img = SITE + "/" + PORTRAIT
    items = sorted(stories, key=lambda x: x["date"], reverse=True)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "@id": url + "#page", "url": url, "name": "Writing by Derek Olson", "description": desc, "inLanguage": "en-US",
         "isPartOf": {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE, "name": "Derek Olson"},
         "about": {"@id": PERSON_ID}, "author": dict(PERSON), "primaryImageOfPage": {"@type": "ImageObject", "url": img},
         "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "url": "%s/pages/writing/%s.html" % (SITE, st["slug"]), "name": st["title"]} for i, st in enumerate(items)]}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Derek Olson", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Writing", "item": url}]},
        ORG_GT]}
    jsonld = '  <script type="application/ld+json">\n  %s\n  </script>\n' % json.dumps(ld, ensure_ascii=False)
    extras = seo_extras(url, ttl, desc, img, "Derek Olson at a desk on an old rotary phone, with a desk lamp beside him")
    h = HEAD.format(title=esc(ttl), desc=esc(desc), url=url, ogtype="website", ogimage=img, extras=extras, jsonld=jsonld, nav=NAV.format(r="../../"))
    h += '  <main id="writing-page">\n'
    h += '    <header class="writing-hero">\n      <div class="writing-hero-text">\n        <h1 class="page-title">Writing</h1>\n        <p class="lede">%s</p>\n      </div>\n' % esc(intro)
    h += '      <figure class="writing-hero-photo"><img src="../../img/writing/derek-journalist.webp" width="1200" height="1200" alt="Derek Olson at a desk in a dim room, on the phone, with an old rotary telephone and a desk lamp" decoding="async" fetchpriority="high"></figure>\n    </header>\n'
    h += '    <section class="writing-section features">\n      <h2>Cover stories</h2>\n'
    h += feature_lead(by["spare-the-child"])
    h += '      <div class="duo">\n' + feature_card(by["roll-player"]) + feature_card(by["sparring-with-shadows"], "drop") + "      </div>\n"
    h += feature_wide(by["get-in-the-cage"], reverse=True)
    h += feature_type(by["against-the-wall"])
    h += '      <div class="trio">\n' + feature_card(by["house-of-pain"]) + feature_card(by["chicken-babies-bondage-nights"], "drop") + feature_card(by["did-crimes-kamran-mashayekhi-witnessed-put-his-life-in-danger"], "drop2") + "      </div>\n"
    h += "    </section>\n"
    h += '    <section class="writing-section">\n      <h2>More reporting</h2>\n      <ul class="brief-grid">\n' + "".join(brief_card(s) for s in brief) + "      </ul>\n    </section>\n"
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
    # sitemap for the writing pages (submit https://dareolson.com/sitemap-writing.xml in Search Console)
    rows = [("%s/pages/writing/" % SITE, "0.9")] + [("%s/pages/writing/%s.html" % (SITE, st["slug"]), "0.8" if st["cover_story"] else "0.6") for st in stories]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for loc, pr in rows:
        xml += "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>%s</priority>\n  </url>\n" % (loc, BUILD_DATE, pr)
    open(os.path.join(ROOT, "sitemap-writing.xml"), "w", encoding="utf-8").write(xml + "</urlset>\n")


if __name__ == "__main__":
    main()
