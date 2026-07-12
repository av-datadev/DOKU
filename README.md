# DOKU

A marketplace for one-of-one objects — every item is genuinely unique and rare in its own way.

---

## Logo Design Brief

Everything below is pulled from the site's existing design system (`design.md`) and brand rules (`CLAUDE.md`), so a logo can extend what's already live rather than contradict it. There is no separate logo yet — the wordmark below *is* the current identity.

### What DOKU is
A premium marketplace for one-of-one objects. Every item exists exactly once — sold once, never restocked. The identity has to make that scarcity feel real, not marketed.

### The one sentence to design against
**"Only one. So are you."** — the site's hero line. The emotional hook isn't scarcity-as-FOMO, it's *resemblance*: a DOKU object mirrors the kind of person who buys it — someone who's built or found something once, without a template. A logo that reads as urgent, discounted, or mass-market breaks this on contact.

### Brand voice — the identity should feel like it was designed by someone held to this standard
| Trait | Meaning |
|---|---|
| **Clarity** | Compress the thought. Fewer marks wins. |
| **Presence** | Comfortable with silence. Negative space is content. |
| **Precision** | One exact shape over three approximate ones. |
| **Frame** | Control the angle, don't just decorate. |
| **Observation** | A detail the viewer hadn't noticed. |
| **Restraint** | Stop before it over-designs. |

### Emotional register
Museum-quiet. The silence of a rare object in a lit case. No bounce, no urgency, no "sale" energy, nothing playful.

### What already exists — the logo should extend this, not clash with it

**Current wordmark** (Fraunces set wide, no icon yet):
| Context | Spec |
|---|---|
| Nav bar | Fraunces, 22px, weight 500, letter-spacing 0.14em (0.18em once scrolled), ivory on dark |
| Hero | Fraunces, weight 200, `clamp(52px, 8vw, 108px)`, letter-spacing 0.16em, ivory — paired with a thin gold uppercase tagline beneath (`Archivo`, 0.36em spacing) |
| Footer | Fraunces, 18px, weight 500, letter-spacing 0.18em |

**Color palette**
| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0E0C0A` | Near-black background — the logo will live on this most of the time |
| `--ivory` | `#EDE6D6` | Primary wordmark color on dark |
| `--gold` | `#B08D57` | Accent — the only color the identity spends |
| `--hairline` | `#2B2620` | Structural, low-contrast dividers |
| `--claimed` | `#6B6258` | Desaturated warm gray, used for "gone" states |

**Typography** — Fraunces (serif, display) + Archivo (sans, everything else). Never Inter or Roboto — that exclusion was deliberate, made explicitly to avoid the most common "unstyled" default on the web. A logo built in a geometric grotesk instead of something with the same warmth as Fraunces will fight the rest of the site.

**Existing signature device — the closest thing to a proto-mark today:** a gold corner-bracket "vitrine" frame (four thin gold corner brackets, like a museum display case) wraps every product that doesn't have real photography yet. It's used constantly across the site. Worth treating as source material for an actual logomark, or deliberately rejecting — but not ignoring, since visitors already associate that shape with DOKU.

**Motion feel** (for any animated/favicon treatment): `cubic-bezier(.16,1,.3,1)` — slow-out, deliberate. Nothing bouncy, nothing spring-loaded.

### What to avoid
- Anything that reads as generic e-commerce/marketplace (shopping bag, tag, cart iconography)
- Bright color, gradients, or more than one accent color — gold is the entire palette
- Geometric sans wordmarks (Inter/Roboto-coded) — explicitly rejected elsewhere in the system
- Playful, rounded, or bouncy forms — the brand's motion and voice rules both forbid this register
- Anything that implies mass production, speed, or a sale — the whole brand argues against those

### Deliverables to design toward
1. **Wordmark** — a refined version of "DOKU," likely still Fraunces-based given how load-bearing that typeface already is
2. **Standalone mark/monogram** — for favicon, social avatar, and anywhere the full wordmark won't fit; the vitrine corner-bracket motif is the natural starting point to consider
3. **Single-color variants** — full gold, full ivory, and a version that works at favicon size (16–32px) against `#0E0C0A`
4. Nothing needs to work on light backgrounds — the site is dark-mode-only by design

### Reference files in this repo
- [`design.md`](design.md) — full living design system (colors, type scale, motion, every component)
- [`CLAUDE.md`](CLAUDE.md) — brand voice, hard rules, data model
- `web/src/components/Header.astro`, `web/src/styles/shell.css` — the live site's wordmark (`.logo`) and hero (`web/src/pages/index.astro`, `web/src/styles/hero.css`, `.hero-brand`) in context. The live site itself is at [discoverdoku.com](https://discoverdoku.com). (`doku-site_9.html` at the repo root is the pre-migration version — no longer what's deployed, kept for reference only.)
