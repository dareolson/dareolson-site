# dareolson.com — Site Overview

Live at: https://www.dareolson.com
Repo: https://github.com/dareolson/dareolson-site
Hosted: GitHub Pages, custom domain via CNAME

---

## Architecture

Static HTML/CSS/JS site. No framework, no build step, no dependencies.
Pages are plain `.html` files. Styles are plain `.css`. All JS is vanilla.
Deployments happen automatically on `git push` to `main`.

---

## File Structure

```
dareolson-site/
├── index.html                  # Homepage — frog animation, identity text, nav
├── CNAME                       # Custom domain: www.dareolson.com
├── sitemap.xml                 # Submitted to Google Search Console
├── llms.txt                    # AI crawler context (Perplexity, ChatGPT, etc.)
├── google2822d2d00e118445.html # Google Search Console verification file
│
├── pages/
│   ├── work/index.html         # Work/portfolio page — video grid with lightbox
│   ├── about.html              # About page
│   └── contact.html            # Contact page
│
├── css/
│   ├── style.css               # Global: reset, tokens, nav, hero, typography
│   ├── frog.css                # Frog animation layers, fly cursor, tongue wrapper
│   ├── work.css                # Work page: grid, cards, lightbox, filter tabs
│   ├── about.css               # About page styles
│   └── contact.css             # Contact page styles
│
├── js/
│   ├── frog.js                 # All frog behavior (eye tracking, blink, eat, fly wander)
│   ├── main.js                 # Page transitions (fade in/out), nav active state
│   ├── filter.js               # Work page filter tabs (All / Branded / Doc / etc.)
│   └── lightbox.js             # Work page video lightbox (YouTube embed)
│
├── FrogFix/                    # Frog artwork — 1920x1080 PNG layers, filter:invert(1)
│   ├── body-static.png         # Body, legs, nose — baked into one static layer
│   ├── Mouth-1.png             # Mouth closed (resting)
│   ├── Mouth-2.png             # Mouth opening
│   ├── Mouth-3.png             # Mouth open mid
│   ├── Mouth-4.png             # Mouth fully open
│   ├── Tongue-2.png            # Tongue extending (frame 2 of 2-3-2 sequence)
│   ├── Tongue-3.png            # Tongue fully extended (frame 3)
│   ├── L-eyeball.png           # Left eyeball (moved by JS to track fly)
│   ├── R-eyeball.png           # Right eyeball
│   ├── L-eyelid-1.png          # Left eyelid open
│   ├── L-eyelid-blink-1.png    # Left eyelid half closed
│   ├── L-eyelid-blink-2.png    # Left eyelid fully closed
│   ├── R-eyelid-1.png          # Right eyelid open
│   ├── R-eyelid-blink-1.png    # Right eyelid half closed
│   └── R-eyelid-blink-2.png    # Right eyelid fully closed
│
├── assets/
│   └── emoji/fly.png           # Fly cursor image
│
└── img/
    ├── og-image.png            # Open Graph image (social share preview)
    └── thumbs/                 # YouTube video thumbnails (named by video ID)
```

---

## Homepage Frog Animation

The frog is built from stacked 1920x1080 PNG layers inside a `#frog` container.
All artwork was drawn in Photoshop in black on transparent — `filter: invert(1)` in CSS
makes them render white on the dark site background.

`#frog` is scaled to 80% via `transform: scale(0.8)` — all coordinate math in frog.js
accounts for this FROG_SCALE factor.

**Layer stack (bottom to top):**
1. `body-static.png` — static, never changes
2. `layer-mouth` — swapped during eat animation (frames 1-4)
3. `layer-r-eyeball` / `layer-l-eyeball` — translated by JS to follow fly
4. `layer-r-eyelid` / `layer-l-eyelid` — swapped during blink animation
5. `#tongue-wrapper` div — rotated/scaled by JS; contains `layer-tongue` img (src swapped)

**Why the tongue is a wrapper div, not a direct img transform:**
Browsers reset `transformOrigin` when an `<img>` src changes. The wrapper div holds
the rotation and scaleX — the inner img only has its src swapped, so the pivot never drifts.

**Tongue pivot coords:** x:925, y:320 in the 1920x1080 canvas (`MOUTH_FRAC = {x:0.482, y:0.296}`)

---

## Frog Behaviors

| Behavior | Trigger | Notes |
|---|---|---|
| Eye tracking | mousemove (desktop) / fly wander position (mobile) | EYE_RANGE: 14px desktop, 7px mobile |
| Blink | Automatic — first blink at 1.5s, then random 2-6s intervals | Half → closed → half → open |
| Eat | Click empty space or text selection (desktop) / tap (mobile) | Tongue sequence: 2→3→2 |
| Fly wander | Mobile: always. Desktop: after eating until mouse moves | lerp toward random targets |
| Spawn new fly | After eating — enters from random screen edge | Desktop: lands at random spot, wanders autonomously |
| Nav eat | Clicking any nav link triggers eat first, then navigates | Uses `navigateWithFade()` |

---

## SEO and Discoverability

- Meta title, description, canonical URL on all pages
- Open Graph tags for social sharing
- JSON-LD structured data (`Person` schema) on homepage
- `sitemap.xml` submitted to Google Search Console
- `llms.txt` at site root — plain-language context file for AI crawlers
- Google Search Console verified (HTML file method)
- Domain: `www.dareolson.com` is canonical; `dareolson.com` redirects via GitHub Pages

---

## Analytics

GoatCounter — privacy-friendly, no cookies, no GDPR banner required.
Dashboard: https://dareolson.goatcounter.com
Installed on all 4 pages (homepage, work, about, contact).

---

## Page Transitions

`main.js` handles fade in/out between pages. Body starts at `opacity:0`.
On load, `.page-visible` class is added to fade in. On nav click, class is removed
to fade out before navigating. The frog's eat animation fires before navigation.

---

## Deployment Notes

- Push to `main` → GitHub Pages auto-deploys (usually 30–60 seconds)
- JS files use cache-busting query strings: `frog.js?v=65`
- Bump the `?v=` number whenever frog.js changes so browsers don't serve stale JS
- HTTPS enforced via GitHub Pages settings
