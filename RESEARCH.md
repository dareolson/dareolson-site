# dareolson.com — Portfolio Research & Design Reference

Compiled 2026-03-26. Research into best filmmaker/cinematographer/creative director portfolio sites.

---

## Core Philosophy

- The site IS the experience, not a container for work
- Specificity over breadth: 6-8 deep projects beats 15+ thumbnails (reportedly 40% more inquiries)
- Every design decision should feel like a directorial decision — intentional, cinematic, authored

---

## Homepage Patterns (Best to Consider)

1. **Full-screen muted video hero** — dominant among cinematographers. Looping clip, no copy, minimal nav. Signals confidence immediately.
2. **Showreel-forward** — single embedded reel centered, everything else below the fold
3. **Hover-to-preview grid** — project thumbnails that play video on hover (Pirmin Henseler model)
4. **Bio-first** — less common but good if background/POV is a differentiator (relevant for journalism angle)

---

## Visual Design

### Color
- **Dark backgrounds dominate** — black, charcoal, midnight blue. Cinematic imagery reads better on dark.
- **Single accent color** — warm amber or orange works well (ties to Grain & Thunder brand orange)
- Black and white is a strong option for cinematographers positioning as film aesthetes

### Typography
- **Oversized headlines** (120px+) as visual design elements — not just labels
- Minimal nav labels: WORK. ABOUT. CONTACT.
- Monospace or retro typefaces for distinctive identity
- Serif + sans-serif pairing common in CD portfolios
- Editorial serif headlines nod to journalism background — specific to Derek

### Motion & Interaction
- **Hover video previews** on project grids — single most effective UX pattern for film portfolios
- Smooth scroll transitions, micro-interactions as standard
- Scroll-based animation (GSAP) — content animates in as you scroll
- **Avoid:** motion overload, gamified navigation, splash screens, loading animations

---

## Content Strategy

### Must Include
- **Focused showreel** — 90 seconds to 3 minutes MAX. Best 5 seconds lead.
- **Two separate reels**: one commercial (Pepsi/Disney/Canon), one narrative/documentary (Cannes, festivals)
- **Project pages with context**: role, year, synopsis, stills, credits, awards — drives 40% more inquiries
- **Client logos on homepage**: Pepsi, Beyond Meat, DC Shoes, Disney Channel, Disney+, Canon, Wolfgang Puck, JCPenney — social proof above the fold
- **Recognition section**: American Pavilion Cannes (2013), Las Vegas Film Festival (2017), Jerome IFF (2023), FOX Animation evaluation
- **Artist statement** — unusual career arc (journalism → film → web dev → teaching → production) is a differentiator for CD roles
- **Tight bio** — 2-3 paragraphs, highlight the rare combo
- **Always-visible contact** — sticky or pinned

### Exclude
- Work that isn't demonstrably strong (quality over quantity)
- Generic skills lists ("Adobe Creative Suite, Microsoft Office")
- Auto-playing audio
- Splash screens / loading animations
- Lengthy client lists without recognizable names

---

## Recommended Site Architecture

```
/ (Home)
  — Full-screen muted video hero (best 30-second cut)
  — Name + "filmmaker / cinematographer / creative director"
  — Scroll indicator

/work
  — Two showreels: "Commercial + Branded" / "Documentary + Narrative"
  — Project grid with hover-to-preview
  — Filter tabs: Branded | Documentary | Narrative | Animation

/project/[slug]
  — Full clip or embed
  — Role, year, client
  — Short context paragraph
  — Selected stills
  — Credits, awards, festival selections

/about
  — Cinematic photo (not headshot)
  — 2-3 paragraph bio (lean into unusual career arc)
  — Client logo grid
  — Recognition: Cannes, Las Vegas FF, Jerome IFF, FOX evaluation

/contact
  — Simple form + email + Vimeo/LinkedIn links
```

---

## Design Direction Recommendation

- **Dark palette + warm amber/orange accent** (ties to Grain & Thunder brand)
- **Editorial serif or monospace headlines** — journalist-meets-filmmaker sensibility
- **Hover-to-preview** on project grid — non-negotiable given volume of video work
- Consider **"aperture settings" dark/light mode toggle** (Giulia Gartner approach) — filmmaker metaphor baked into the UI, shows conceptual thinking
- Build in **vanilla JS** (current plan) or add **GSAP** for scroll animations

---

## Standout Portfolio Examples to Study

| Name | Why It's Worth Studying |
|------|------------------------|
| **Pirmin Henseler** | Showreel on landing, hover-to-preview grid, deep project pages |
| **Kirill Groshev** | Orange-on-black monospace — site design IS his visual voice |
| **Simon Tonev** | Showreel preview, project context, personality in microcopy |
| **Giulia Gartner** | Dark/light mode as "aperture settings" — filmmaker metaphor in UI |
| **Natascha Vavrina** | Parallax scrolling, categories for range |
| **Cai Thomas** | Bio-first, artist statement prominent |
| **Modhura Palit** | Multiple showreels by category, one-pager with depth |
| **Jessica Walsh / &Walsh** | CD reference: commercial + personal, narrative case studies |

---

## Technical Notes

- Lazy-load video thumbnails — only load on hover, not on page load (performance)
- Vimeo Pro over YouTube embeds — cleaner, no related video bleed-through
- Mobile-first — 50%+ of portfolio visits are mobile
- Password-protected pages for NDA'd client work ("password available on request")
- Sticky contact CTA — don't make people hunt
- SEO keywords: "filmmaker North Dakota," "cinematographer documentary," "branded content director"
- Portfolios updated regularly get 55% more views

---

## Notes on Current Concept (Frog Character)

The frog/fly cursor interaction is memorable and shows technical range — keep it. However, consider:
- Make sure it doesn't delay access to the work. The tongue-catch navigation is clever but if it adds more than 1-2 seconds to getting to the portfolio, test whether it hurts bounce rate.
- The character gives the site personality that separates it from standard filmmaker portfolios — that's valuable, especially for CD positioning (shows you think beyond just cinematography).
- Consider whether the frog lives only on the homepage and the interior pages are clean/cinematic.
