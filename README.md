# dareolson.com — Rebuild

Rebuilding dareolson.com from scratch in vanilla HTML/CSS/JS. No WordPress, no Elementor.

## Concept

Portfolio site for Derek Olson, Creative Director / Filmmaker.

### Homepage Character (The Frog)
- Animated SVG frog character (existing assets to be ported over)
- Eyes follow mouse cursor around the screen
- Periodic random blinking
- Custom fly cursor with animated flapping wings
- On click: frog tongue shoots toward fly cursor, catches it, then page navigates

### Positioning
- Creative Director, not freelancer
- Lead with career highlights: Disney, Olympics, Jackass Forever, Pepsi, Canon Japan
- Clean, fast, no bloat

### Pages
- Home (frog character, eye tracking, fly cursor)
- About (CD bio, career arc — not gear list)
- Client Work (video thumbnails that play on click)
- Original Works (Millennial Taekwondo Tortoises + other originals)
- Brand Deals
- Super Heroes (TBD — clarify purpose)

## Technical Plan

### Cursor
- Replace default cursor with SVG fly
- Wings flap via CSS animation
- Tracks mouse position via JS

### Eye Tracking
- Mouse position → calculate angle to each eyeball → move pupils
- ~20-30 lines of JS

### Blinking
- JS setInterval with randomized timing (3-7 seconds)
- Drops eyelids, raises them

### Tongue Catch (on click)
- Calculate angle from frog mouth to current mouse position
- Animate tongue extending toward fly
- Fly disappears mid-catch
- Tongue retracts
- Page navigates after brief delay

### Hosting
- GitHub Pages or Netlify (free)
- Custom domain: dareolson.com (DNS redirect)

## Assets Needed
- [ ] SVG frog character layers (head, body, legs, eyes, eyelids, pupils, tongue)
- [ ] Portrait photo (About page)
- [ ] Video thumbnails (Client Work, Original Works, Brand Deals)
- [ ] Client logos
- [ ] Logo/wordmark

## Status
- [ ] Assets downloaded from current site
- [ ] Site scaffolding
- [ ] Frog character + eye tracking
- [ ] Fly cursor
- [ ] Blinking
- [ ] Tongue catch transition
- [ ] All pages built out
- [ ] Deploy to GitHub Pages
- [ ] DNS pointed to dareolson.com
