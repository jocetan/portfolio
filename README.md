# Tan Jocelyn — portfolio

A static site. No build step, no dependencies, no package manager. Open
`index.html` in a browser and it works.

## Deploying to GitHub Pages

1. Create a repository. Name it `yourusername.github.io` to serve at the root
   domain, or anything else to serve at `yourusername.github.io/repo-name`.
2. Put **the contents of this folder** at the repository root — not the folder
   itself. `index.html` must sit at the top level or Pages returns a 404.
3. Repository → **Settings** → **Pages** → Source: *Deploy from a branch* →
   Branch `main`, folder `/ (root)` → **Save**.
4. Wait a minute or two, then open the URL Pages shows you.

```bash
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/YOURNAME/YOURREPO.git
git push -u origin main
```

Keep `.nojekyll`. It is an empty file, but without it Pages runs everything
through Jekyll and ignores any directory beginning with an underscore.
It is hidden, so if you copy files in Finder or Explorer rather than with
`git`, check it came across.

## What is here

```
index.html                              Home — hero with interactive skill
                                        markers, then the work mosaic
about.html                              About — drawing space, work timeline,
                                        skills, contact
work/screenxpert-4/index.html           Case study, with the drag comparison slider
work/duo-insights-portal/index.html     Case study
work/my-m1-plus-mobile-app/index.html   Case study
work/m1-agent-console/index.html        Case study
work/m1-hotline-maxine/index.html       Case study
work/screenxpert-2-3/index.html         Case study
css/styles.css                          All styling. Design tokens in :root
js/main.js                              Scroll reveal, skill markers, back to
                                        top, comparison slider
assets/work/                            Home page tiles
assets/case-*/                          Case study imagery
.nojekyll                               Stops Pages running Jekyll
```

8 pages, 42 images, about 20 MB. Link-checked: no broken references, no
unused files.

## Editing

**Design tokens** are at the top of `css/styles.css`:

| Token | Value | Controls |
|---|---|---|
| `--ink` | `#1A1A1A` | Headings, body, nav |
| `--ink-muted` | `#6E6E6E` | Captions, meta labels |
| `--band` | `#E6E6E6` | Case study header band |
| `--band-deep` | `#28458E` | Quote band on DUO |
| `--lavender` | `#BFDAF8` | Hero text highlight |
| `--purple` | `#006CE1` | Cursor, selected nav, links |
| `--tile-gap` | `8px` | Between home page tiles |
| `--media-gap` | `8px` | Between case study images |
| `--section-gap` | `clamp(56px, 7vw, 96px)` | Between case study sections |
| `--flight` | `0.40s` | Hero marker entrance |

**Fonts.** The site is set in **Figtree**, matching the Figma file. It loads
from Google Fonts via a `<link>` in each page's `<head>`, with a system
sans-serif stack behind it as a fallback. The family is declared once, as
`--font-sans` at the top of `css/styles.css`.

To self-host it instead of relying on Google — worth doing if you want the
site to work offline or load without a third-party request — download the
Figtree `.woff2` files, put them in `assets/fonts/`, add an `@font-face`
block at the top of the stylesheet, and delete the Google Fonts `<link>`
from all eight pages.

**Hero skill markers.** Each marker in `index.html` carries its own position
(`--x`, `--y`), size (`--scale`), tone (`--tone`) and flight-in start point
(`data-fx`, `data-fy`). `data-pin` keeps a marker at its authored position;
remove it and the marker is placed randomly on each load. The curve on the
About page works the same way: `--lx/--ly/--lw/--lr` position it, and each
role card is pinned to a marker with `--mx/--my` plus a `--dx/--dy` offset.

**Image rows.** `.media-pair` and `.media-trio` give every image in a row an
identical block — same width, same height — with the images cropped to fill.
Set `--fit-ar` on the row to change the block's shape, and `object-position`
on an image to choose which part of it shows.

**Adding a case study.** Copy an existing folder under `work/`, change the copy
and images, add a tile to the grid in `index.html`, and update the
`next-project` link on the page that should point to it.

## Notes

- Scroll reveal uses Intersection Observer, respects `prefers-reduced-motion`,
  and shows content anyway if JavaScript fails.
- The comparison slider works with mouse, touch and keyboard, and does not
  trap vertical scrolling on mobile.
- Breakpoints: 860px (case study hero stacks, four columns become two) and
  680px (everything single column).
