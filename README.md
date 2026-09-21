# LUNA Lab website

Website of the **Lab for UI and Attention (LUNA)**, Kahlert School of Computing,
University of Utah. Plain HTML/CSS/JS — no build step. Papers and people are
stored as JSON, so most updates never touch HTML.

---

## Folder layout

```
lab-website/
├── index.html            About (homepage)
├── publications.html     Research — rendered from data/publications.json
├── team.html             Team     — rendered from data/members.json
├── join.html             Work with us
├── contact.html          Contact
│
├── data/                 ← CONTENT: edit these to update the site
│   ├── publications.json   papers (title, authors, links, cover image, video)
│   └── members.json        people (PI, current students, former students)
│
├── assets/               ← images used by the site (web-sized only)
│   ├── brand/              luna-logo.png (footer), luna-logo-transparent.png (nav)
│   ├── papers/             paper covers, named after the paper id (seekui.jpg, …)
│   ├── team/photos/        member photos, firstname-lastname.jpg
│   └── sponsors/           sponsor logos (transparent PNG)
│
├── css/styles.css        all styles (colour variables at the top)
├── js/main.js            navigation, accessibility helpers
├── js/animation.js       homepage / page-header block animation
├── fonts/                Factoria font files (see fonts/README.md)
├── scripts/add_paper.py  helper to add a paper from a DOI / arXiv id
│
└── _source/              ← NOT published (git-ignored): originals & archives
    ├── paper-originals/      full-size paper figures, PDFs, posters
    ├── team-photo-originals/ full-size photos
    ├── brand/                logo source files, Utah backgrounds
    ├── others/               raw downloads (sponsor logos, photos)
    ├── WorkshopCHI26/        workshop photos (≈ 640 MB)
    ├── UtahLogo/             university logo kit
    ├── backup-before-a11y/   copy of the pages before the accessibility pass
    └── notes/                old notes and generated reports
```

Rule of thumb: **anything the website shows lives in `assets/` or `data/`,
at web size. Anything else goes in `_source/`.**

---

## Common tasks

| I want to…                          | Do this                                                        |
|-------------------------------------|----------------------------------------------------------------|
| Add a paper                         | `python3 scripts/add_paper.py --doi <DOI>` or edit `data/publications.json` |
| Add a paper cover / video           | Put `<paper-id>.jpg` in `assets/papers/`, set `thumb` / `video` in the JSON |
| Add or edit a team member           | `data/members.json` (+ photo in `assets/team/photos/`)          |
| Add a sponsor logo                  | PNG in `assets/sponsors/` + two `<img>` lines in `index.html`   |
| Change recruiting text              | `join.html` (and the matching sentence in `index.html`)         |
| Change contact details              | `contact.html`                                                  |
| Colours, fonts, spacing             | `css/styles.css`                                                |

### 1. Papers — `data/publications.json`

**With the script** (looks up title, authors and year from Crossref / arXiv,
then asks for the rest):

```bash
python3 scripts/add_paper.py --doi 10.1145/3613904.3642000
python3 scripts/add_paper.py --arxiv 2310.04869
python3 scripts/add_paper.py --manual     # type everything by hand
python3 scripts/add_paper.py --check      # validate the JSON
```

Google Scholar has no public API, so a Scholar link can't be used as a source;
the DOI (on the ACM / IEEE page) or the arXiv id works for almost every paper.

**By hand** — copy an existing entry:

```json
{
  "id": "seekui",                      // short, unique, lowercase; also the cover file name
  "title": "SeekUI: Predicting Visual Search Behavior …",
  "authors": ["Zixin Guo*", "Yue Jiang*", "Luis A. Leiva", "Antti Oulasvirta"],
  "note": "*Equal Contribution",       // shown under the authors, or null
  "venue": "CHI 2026",                 // red label
  "venue_type": "ACM CHI",             // after the label: ACM CHI, TVCG Paper, Workshop, …
  "year": 2026,                        // used for grouping (newest first)
  "description": "One or two sentences.",
  "links": [{"label": "Paper", "url": "https://…"}, {"label": "Code", "url": "https://…"}],
  "tags": ["Eye Tracking", "Vision Language Models"],
  "thumb": "assets/papers/seekui.jpg", // cover image (optional)
  "video": "https://…"                 // YouTube or .mp4 (optional) — the cover becomes a play button
}
```

- Names in `settings.highlight_names` are shown in bold automatically.
- Years before `settings.earlier_work_before` are grouped under "Selected Earlier Work".
- **Cover images:** about 960 px wide, JPG (PNG only if it needs transparency),
  named `<id>.jpg`. 16:9 fills the frame exactly; other shapes are shown whole
  on white. Keep the full-size original in `_source/paper-originals/`.
  Without a `thumb`, a generated LUNA pixel pattern is shown.
- Keep the file valid JSON (commas between entries, none after the last one).

### 2. People — `data/members.json`

Groups: `pi`, `phd_students` (shown as **Current Students** — PhD students and
research assistants), `masters_students`, `undergrad_researchers`,
`visiting_researchers`, and `alumni` (shown as **Former Students**).

Current member:

```json
{
  "name": "Jane Smith",
  "role": "Research Assistant",
  "flag": "🇺🇸",                               // optional, shown after the role
  "photo": "assets/team/photos/jane-smith.jpg",
  "bio": "",                                   // optional
  "email": "", "homepage": "https://…", "scholar": "https://…",
  "linkedin": "", "cv": "",                    // empty fields are hidden
  "interests": ["Eye Tracking", "UI Agents"],  // shown as tags
  "years": "2026–"                              // optional; a year or range
}
```

For an ongoing appointment, `"start_year": 2026` is also supported and is
displayed as `2026–`. Use `years` when you want exact text such as `2024–2026`.

Former student (compact list):

```json
{ "name": "Kaden Salem", "role": "Research Assistant", "flag": "🇺🇸",
  "years": "2025", "next": "Software Engineer @ Goldman Sachs",
  "homepage": "", "scholar": "", "linkedin": "https://www.linkedin.com/in/…" }   // links shown as small buttons
```

**Photos:** square, about 600 × 600 px (under ~100 KB), face roughly centred,
saved as `assets/team/photos/firstname-lastname.jpg`. Originals go in
`_source/team-photo-originals/`.

### 3. Sponsors — `assets/sponsors/`

Logos are transparent PNGs, about 150 px tall. To add one, drop the file in
`assets/sponsors/` and add a `<div class="sponsor-logo">…</div>` block in
`index.html` in **both** "Set 1" and "Set 2". With only a few sponsors the row
is static and centred; add `class="scrolling"` to `.sponsors-track` to turn the
scrolling marquee back on.

---

## Preview locally

`fetch()` does not work from `file://`, so run a small server:

```bash
cd lab-website
python3 -m http.server 8000     # then open http://localhost:8000
```

If an edit doesn't show up, hard-refresh the browser (Cmd + Shift + R).

## Publish (GitHub Pages)

The lab site lives in a GitHub **organisation** (each member uses their own
GitHub account). The repository is named `<org>.github.io`; Pages serves the
`main` branch from the root.

```bash
git add -A
git commit -m "Add paper: <short title>"
git push
```

The site redeploys within a minute or two. `_source/` is listed in
`.gitignore`, so originals and archives never get uploaded.

---

## Please keep (accessibility)

- Every image needs `alt` text (`alt=""` for purely decorative images).
- Links that open a new tab use `target="_blank" rel="noopener"`; `main.js` adds
  the "(opens in a new tab)" hint for screen readers automatically.
- Headings go in order (h1 → h2 → h3); the JSON renderers already do this.
- Don't remove the "Skip to main content" link, the `:focus-visible` styles,
  or the `prefers-reduced-motion` block in `css/styles.css`.
