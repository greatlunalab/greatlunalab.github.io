/**
 * LUNA Lab — Logo-Block Monogram Animation
 *
 * L, U, N, A are drawn exactly as in the LUNA logo: rounded square blocks on a
 * 3 × 3 cell grid (N and A also use the logo's half-width / half-height blocks).
 * Letters are tiled in the same staggered monogram repeat as before, and every
 * block keeps its own slow, calm flicker rhythm.
 *
 * Tile layout (odd rows shift right by 2 units — half the LUNA period):
 *   Row 0:  L  U  N  A  L  U  N  A  …
 *   Row 1:        N  A  L  U  N  A  L  …
 *   Row 2:  L  U  N  A  L  U  N  A  …
 *
 * The bottom edge of the hero is cut by the LUNA crescent mark (the vertical
 * L-U-N-A block stack from the logo): small copies, same block size as the tiles,
 * sit on the boundary and the page background is carved in along their outer
 * contour — so the dark cover ends in logo building blocks rather than a straight
 * line. One mark sits in each bottom corner (mirrored, tips pointing toward the
 * scroll cue); set EDGE_REPEAT to tile it along the whole edge. The blocks are drawn in the hero's own
 * light tones (white / accent), not the logo's grey and red.
 *
 * The same cover is reused, smaller, in the header of every sub-page: tiles only on
 * the right, one mirrored mark in the bottom-right corner (see the bottom of this file).
 *
 * Honors prefers-reduced-motion: renders one calm static frame instead of looping.
 */

function lunaCover(canvas, edge, opts = {}) {
  const O = Object.assign({
    tileCell: 9,          // px per tile block
    sides: 'both',        // corner marks: 'both' (homepage) or 'right' (sub-pages)
    markRatio: 0.60,      // mark height as a share of the cover height
    widthCap: 0.26,       // …but never wider than this share of the width
    minPitch: 6,          // px — smallest mark block pitch
    fillBg: true,         // paint the dark background inside the canvas
    cueVar: false,        // publish --hero-cue for the scroll arrow
    fadeRatio: 0.20,      // bottom fade height as a share of the cover height…
    fadeRows: 0,          // …or, if > 0, this many mark rows (1 = the height of the bottom tip block)
    feather: 0.9,         // softness of the carved edge, in mark blocks
    lift: 0.55,           // raise the marks by this share of the fade height…
    alignTo: null,        // …or align the marks' top with this element's top (e.g. the title)
  }, opts);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasRoundRect = typeof ctx.roundRect === 'function';
  // Retina / HiDPI: draw at the screen's real resolution so blocks stay crisp
  let DPR = 1, CW = 0, CH = 0;                      // device-pixel ratio, canvas size in CSS px
  function fitCanvas(cv, c2d, w, h) {
    cv.width  = Math.round(w * DPR);
    cv.height = Math.round(h * DPR);
    c2d.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ── Block config (proportions taken from the logo: gap ≈ 15% of a block) ──
  const CELL   = O.tileCell;                      // canvas px per full logo block
  const GAP    = Math.max(1, Math.round(CELL * 0.22));   // px between blocks (2 at CELL 9)
  const PITCH  = CELL + GAP;
  const RADIUS = Math.max(1, Math.round(CELL * 0.18)); // rounded corner like the logo
  const H_GAP  = Math.round(CELL * 1.45);   // horizontal spacing between letter instances (13 at CELL 9)
  const V_GAP  = Math.round(CELL * 1.45);   // vertical spacing between letter instances

  const LETTER_W = 3 * PITCH - GAP;   // 3 cells wide
  const LETTER_H = 3 * PITCH - GAP;   // 3 cells tall (L and U sit on the baseline)
  const TILE_W = LETTER_W + H_GAP;
  const TILE_H = LETTER_H + V_GAP;

  const STAGGER = 2;  // odd rows shift right by 2 tile widths

  // ── Logo glyphs: blocks as [col, row, width, height] in cell units ──────
  //    (half blocks are 0.5 wide/tall and hug the cell edge, as in the logo)
  const GLYPHS = {
    L: [[0,1,1,1], [0,2,1,1], [1,2,1,1], [2,2,1,1]],
    U: [[0,1,1,1], [2,1,1,1], [0,2,1,1], [1,2,1,1], [2,2,1,1]],
    N: [[0,0,1,1], [1,0,0.5,1], [2,0,1,1],
        [0,1,1,1], [1,1,1,1],   [2,1,1,1],
        [0,2,1,1], [1.5,2,0.5,1], [2,2,1,1]],
    A: [[1,0,1,1],
        [0,1,1,1], [1,1.5,1,0.5], [2,1,1,1],
        [0,2,1,1], [2,2,1,1]],
  };

  const ORDER = ['L','U','N','A'];

  // Precompute pixel rects for each glyph block
  const BLOCKS = {};
  for (const [letter, blocks] of Object.entries(GLYPHS)) {
    BLOCKS[letter] = blocks.map(([c, r, w, h]) => ({
      x: Math.floor(c) * PITCH + (c - Math.floor(c)) * CELL,
      y: Math.floor(r) * PITCH + (r - Math.floor(r)) * CELL,
      w: w * CELL,
      h: h * CELL,
    }));
  }

  // ── Colors: state 0 = invisible → 4 = flash  (unchanged) ────────────────
  const COLORS = [
    null,
    'rgba(110,  5,  5, 0.18)',  // 1 – ghost
    'rgba(148,  0,  0, 0.50)',  // 2 – medium  (#940000)
    'rgba(190, 22, 22, 0.72)',  // 3 – bright
    'rgba(255, 88, 88, 0.92)',  // 4 – flash   (#ff5858)
  ];

  // ── The crescent mark (as in the LUNA logo, _source/brand/luna-logo-source/), in cell units ──
  //    6 columns × 11 rows; [col, row, w, h, tone]  tone: 'g' = grey letter, 'r' = red letter
  //    Listed in the order the blocks appear: letters top → bottom, and inside each
  //    letter the way it is written by hand.
  const MARK = [
    [4,0,1,1,'g'],                                            // top tip
    [1,1,1,1,'g'], [1,2,1,1,'g'], [2,2,1,1,'g'], [3,2,1,1,'g'],           // L: down, then across
    [0,3,1,1,'r'], [0,4,1,1,'r'], [1,4,1,1,'r'], [2,4,1,1,'r'], [2,3,1,1,'r'],  // U: down, across, up
    [0,5,1,1,'g'], [0,6,1,1,'g'], [0,7,1,1,'g'],              // N: left stroke down,
    [1,5,0.5,1,'g'], [1,6,1,1,'g'], [1.5,7,0.5,1,'g'],        //    diagonal down,
    [2,7,1,1,'g'], [2,6,1,1,'g'], [2,5,1,1,'g'],              //    right stroke up
    [2,9,1,1,'r'], [2,8,1,1,'r'], [3,7,1,1,'r'],              // A: up to the apex,
    [4,8,1,1,'r'], [4,9,1,1,'r'],                             //    down the other leg,
    [3,8.5,1,0.5,'r'],                                        //    then the crossbar
    [5,10,1,1,'g'],                                           // bottom tip → points inward
  ];
  const MARK_COLS = 6, MARK_ROWS = 11;
  // Corner-mark block size scales with the screen (independent of the small tiles)
  let EC = 26, EG = 4, EP = 30, EW = 0, EH = 0, FADE_H = 0, EDGE_W = 0, LIFT = 0, EDGE_H = 0;     // cell, gap, pitch, mark width/height (px)
  // Proportions follow Astrid's sketch: the mark stands ~60% of the hero's height (O.markRatio),
  // flush with the screen edge; on narrow screens it is capped by O.widthCap.
  function sizeMarks(w, h) {
    EP = Math.max(O.minPitch, Math.floor(Math.min(O.markRatio * h / MARK_ROWS, O.widthCap * w / MARK_COLS)));
    EG = Math.max(2, Math.round(EP * 0.13));               // gap ≈ 15% of a block, as in the logo
    EC = EP - EG;
    if (EC % 2) { EC -= 1; EG += 1; }                      // even cell → half blocks land on whole pixels
    EW = MARK_COLS * EP - EG;
    EH = MARK_ROWS * EP;                                   // blocks + one gap below the tip
  }
  const EDGE_REPEAT  = false;                       // true: repeat the mark along the whole bottom edge
  const EDGE_CLEAR   = 60;                          // px kept free either side of the scroll cue
  const PAGE_BG      = '#ffffff';                   // colour carved into the edge (= page background)
  const TONE = { g: 'rgba(255,255,255,0.92)', r: 'rgba(255,88,88,0.92)' };   // light blocks, accent blocks

  // Per column: bottom of the lowest block (cell units); per row: leftmost block column
  const COL_BOTTOM = Array.from({ length: MARK_COLS }, (_, c) =>
    Math.max(...MARK.filter(b => b[0] < c + 1 && b[0] + b[2] > c).map(b => b[1] + b[3])));
  // Staircase the page is carved along: never rises again from the outer edge toward the
  // centre, so the A's legs stay embedded in the dark cover (as in the sketch).
  const ENVELOPE = COL_BOTTOM.map((_, c) => Math.max(...COL_BOTTOM.slice(0, c + 1)));   // [8,8,10,10,10,11]

  const ectx = edge ? edge.getContext('2d') : null;
  let marks = [];   // [{ mirror, x, corner }]

  function buildMarks() {
    if (!edge) return;
    sizeMarks(edge.offsetWidth, edge.parentElement.offsetHeight);
    const EDGE_SPACING = 3 * EP;                    // between repeated marks (when EDGE_REPEAT)
    const EDGE_MARGIN  = 0;                         // mark sits flush with the screen edge
    FADE_H = O.fadeRows > 0 ? Math.round(O.fadeRows * EP)          // dark → white fade along the bottom
                            : Math.round(edge.parentElement.offsetHeight * O.fadeRatio);
    LIFT = Math.round(FADE_H * O.lift);            // marks sit this far above the bottom edge
    const target = O.alignTo && edge.parentElement.querySelector(O.alignTo);
    if (target) {                                   // top of the mark level with the top of the title
      const coverH = edge.parentElement.offsetHeight;
      const top = target.getBoundingClientRect().top - edge.parentElement.getBoundingClientRect().top;
      const lifted = Math.round(coverH - top - EH);
      if (lifted >= 0) LIFT = lifted;
    }
    // the band under the lifted marks is page white — let the next section slide up into it
    edge.parentElement.style.marginBottom = LIFT ? -LIFT + 'px' : '';
    EDGE_H = EH + LIFT;
    if (O.cueVar) edge.parentElement.style.setProperty('--hero-cue', Math.round(LIFT + FADE_H + 10) + 'px');   // scroll cue just above the fade
    edge.style.height = EDGE_H + 'px';
    EDGE_W = edge.offsetWidth;
    fitCanvas(edge, ectx, EDGE_W, EDGE_H);
    const w = EDGE_W, half = w / 2;
    marks = [];
    // One mark in each bottom corner (set EDGE_REPEAT = true to tile them along the whole edge)
    for (let x = EDGE_MARGIN, k = 0; x + EW <= half - EDGE_CLEAR; x += EW + EDGE_SPACING, k++) {
      if (O.sides === 'both') marks.push({ mirror: false, x, corner: k === 0 });
      marks.push({ mirror: true, x: w - x - EW, corner: k === 0 });
      if (!EDGE_REPEAT) break;
    }
    drawMarks();
  }

  function markTick() { /* the edge is static; the tiles behind it carry the motion */ }


  // Outline of the white carved in under one mark (canvas coords): a staircase that keeps
  // a one-gap dark margin around the blocks, with corners concentric to the blocks'.
  function carveOutline(m, H) {
    const X = (lx) => m.mirror ? m.x + EW - lx : m.x + lx;
    const out = EP * 2;                                  // extend past the canvas so outer corners stay square
    const pts = [[-out, ENVELOPE[0] * EP]];
    for (let c = 1; c < MARK_COLS && ENVELOPE[c - 1] < MARK_ROWS; c++) {
      if (ENVELOPE[c] !== ENVELOPE[c - 1]) {
        pts.push([c * EP - EG, ENVELOPE[c - 1] * EP]);   // one gap before the deeper column
        pts.push([c * EP - EG, ENVELOPE[c] * EP]);
      }
    }
    const lastX = pts[pts.length - 1][0];
    pts.push([lastX, H + out], [-out, H + out]);         // down and back along the bottom
    return pts.map(([x, y]) => [X(x), y]);
  }

  const fadeCanvas   = document.createElement('canvas');   // offscreen: the bottom fade
  const staticCanvas = document.createElement('canvas');   // offscreen: carved page + soft edge
  let edgeReady = false, EDGE_B = 0, FADE_FH = 0;

  // Write-on animation of the marks: blocks appear one by one in MARK (writing) order,
  // hold, dissolve in the same order, rest, repeat.
  const WRITE = { step: 85, pop: 300, hold: 6500, outStep: 30, out: 240, rest: 900 };
  const N_BLOCKS = MARK.length;
  const WRITE_END = (N_BLOCKS - 1) * WRITE.step + WRITE.pop;
  const OUT_END = (N_BLOCKS - 1) * WRITE.outStep + WRITE.out;
  const CYCLE_MS = WRITE_END + WRITE.hold + OUT_END + WRITE.rest;
  let t0 = null;
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const easeOut = (v) => 1 - Math.pow(1 - v, 3);
  function blockProgress(i, now) {
    if (now == null) return 1;                       // reduced motion: fully written
    if (t0 == null) t0 = now;
    const t = (now - t0) % CYCLE_MS;
    if (t < WRITE_END) return easeOut(clamp01((t - i * WRITE.step) / WRITE.pop));
    if (t < WRITE_END + WRITE.hold) return 1;
    const u = t - WRITE_END - WRITE.hold;
    if (u < OUT_END) return 1 - clamp01((u - i * WRITE.outStep) / WRITE.out);
    return 0;
  }

  function drawMarks() {
    if (!ectx) return;
    const W = EDGE_W, H = EDGE_H;                   // one mark tall + the lift below it
    const sctx = staticCanvas.getContext('2d');
    fitCanvas(staticCanvas, sctx, W, H);
    sctx.clearRect(0, 0, W, H);
    const rad = Math.max(2, Math.round(EC * 0.18));
    const corner = rad + EG;
    const trace = (P, dx = 0) => {
      sctx.beginPath();
      sctx.moveTo(P[0][0] + dx, P[0][1]);
      for (let i = 1; i < P.length; i++) {
        const nxt = P[(i + 1) % P.length];
        if (i >= P.length - 2) sctx.lineTo(P[i][0] + dx, P[i][1]);        // outside the canvas: sharp
        else sctx.arcTo(P[i][0] + dx, P[i][1], nxt[0] + dx, nxt[1], corner);
      }
      sctx.closePath();
    };

    const outlines = marks.map(m => carveOutline(m, H));
    // The cover ends one gap below the marks' tips: from there down it's page, so the
    // edge turns at the tip's bottom and runs straight across (lifted marks included).
    const B = MARK_ROWS * EP;

    // 1a. soft white glow spilling from the carved staircase into the dark (blurred shadow)
    const soft = EP * O.feather;
    const off = 20000;
    if (soft > 0) {
    sctx.save();
    sctx.shadowColor = 'rgba(255,255,255,0.95)';
    sctx.shadowBlur = soft * DPR;
    sctx.shadowOffsetX = off * DPR;                 // shadow offsets ignore the transform
    sctx.fillStyle = '#000';
    for (const P of outlines) { trace(P, -off); sctx.fill(); }
    sctx.beginPath(); sctx.rect(-off, B, W, H - B + EP); sctx.fill();
    sctx.restore();
    }

    // 1b. the carved page itself, crisp
    sctx.fillStyle = PAGE_BG;
    for (const P of outlines) { trace(P); sctx.fill(); }
    sctx.fillRect(0, B, W, H - B);

    // 3. (prepared) the bottom fade, laid over everything each frame
    FADE_FH = 0;
    if (FADE_H > 0) {
      const fh = Math.min(FADE_H, B);
      const f = fadeCanvas.getContext('2d');
      fitCanvas(fadeCanvas, f, W, fh);
      const v = f.createLinearGradient(0, 0, 0, fh);
      for (let i = 0; i <= 12; i++) {               // eased curve: starts imperceptibly, lands softly on white
        const t = i / 12, e = Math.pow(t * t * (3 - 2 * t), 1.6);
        v.addColorStop(t, `rgba(255,255,255,${e.toFixed(3)})`);
      }
      f.fillStyle = v; f.fillRect(0, 0, W, fh);
      FADE_FH = fh;
    }
    EDGE_B = B;
    edgeReady = true;
    paintEdge(motionQuery.matches ? null : performance.now());
  }

  // Per frame: static layer → blocks (write-on) → bottom fade on top, so the blocks
  // dissolve into the page together with the dark cover.
  function paintEdge(now) {
    if (!ectx || !edgeReady) return;
    const W = EDGE_W, H = EDGE_H;
    ectx.clearRect(0, 0, W, H);
    ectx.drawImage(staticCanvas, 0, 0, W, H);
    const rad = Math.max(2, Math.round(EC * 0.18));
    for (const m of marks) {
      const X = (lx) => m.mirror ? m.x + EW - lx : m.x + lx;
      MARK.forEach(([c, r, bw, bh, tone], i) => {
        const p = blockProgress(i, now);
        if (p <= 0) return;
        const lx = Math.floor(c) * EP + (c - Math.floor(c)) * EC;
        const y  = Math.floor(r) * EP + (r - Math.floor(r)) * EC;
        const w = bw * EC, h = bh * EC;
        const x = m.mirror ? X(lx) - w : X(lx);
        const k = 0.55 + 0.45 * p;                   // pops from 55% to full size, centred
        const sw = w * k, sh = h * k, sx = x + (w - sw) / 2, sy = y + (h - sh) / 2;
        ectx.globalAlpha = p;
        ectx.fillStyle = TONE[tone];
        if (hasRoundRect) { ectx.beginPath(); ectx.roundRect(sx, sy, sw, sh, Math.min(rad * k, sw / 2, sh / 2)); ectx.fill(); }
        else ectx.fillRect(sx, sy, sw, sh);
      });
    }
    ectx.globalAlpha = 1;
    if (FADE_FH > 0) ectx.drawImage(fadeCanvas, 0, EDGE_B - FADE_FH, W, FADE_FH);
  }


  // ── State grid ──────────────────────────────────────────────────
  const EXTRA = STAGGER + 2;  // extra tile columns each side for stagger
  let tileCols, tileRows, tiles;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    CW = canvas.offsetWidth; CH = canvas.offsetHeight;
    fitCanvas(canvas, ctx, CW, CH);
    buildMarks();
    const nc = Math.ceil(CW / TILE_W) + EXTRA * 2;
    const nr = Math.ceil(CH / TILE_H) + 3;
    if (nc === tileCols && nr === tileRows) return;
    tileCols = nc; tileRows = nr;

    tiles = [];
    for (let tr = 0; tr < tileRows; tr++) {
      for (let tc = 0; tc < tileCols; tc++) {
        const letter = ORDER[(tc + tr * STAGGER) % 4];
        tiles.push({
          letter,
          pixels: BLOCKS[letter].map(() => ({
            state: 0,
            timer: (Math.random() * 300) | 0,  // stagger initial wakeups
          })),
        });
      }
    }
  }

  // ── Per-block state machine (same slow, calm pulsing rhythm as before) ──
  // Logo glyphs have fewer blocks per letter than the old dot-matrix, so the
  // wake-up chance from dark is nudged up slightly to keep the same on-screen
  // density; all durations are unchanged.
  function step(state) {
    const r = Math.random();
    // returns [nextState, minFrames, maxFrames]
    switch (state) {
      case 0:  // mostly dark, rarely lights up
        return r < 0.16 ? [1, 80, 220]
             : r < 0.02 ? [2, 60, 150]
             :             [0, 100, 320];
      case 1:  // ghost → medium or fade
        return r < 0.28 ? [2, 50, 130]
             : r < 0.55 ? [0, 60, 170]
             :             [1, 30,  90];
      case 2:  // medium → bright or decay
        return r < 0.20 ? [3, 25, 75]
             : r < 0.45 ? [1, 35, 90]
             : r < 0.62 ? [0, 45, 110]
             :             [2, 20,  55];
      case 3:  // bright → flash or decay
        return r < 0.10 ? [4,  8, 20]
             : r < 0.50 ? [2, 20, 60]
             : r < 0.75 ? [1, 25, 70]
             :             [3, 12, 40];
      case 4:  // flash → quickly back
        return r < 0.65 ? [2, 10, 28]
             :             [1, 12, 30];
      default: return [0, 100, 300];
    }
  }

  // ── Tick ────────────────────────────────────────────────────────
  let frame = 0;

  function tick() {
    frame++;
    markTick();

    for (const tile of tiles)
      for (const px of tile.pixels)
        if (--px.timer <= 0) {
          const [s, tMin, tMax] = step(px.state);
          px.state = s;
          px.timer = (tMin + Math.random() * (tMax - tMin)) | 0;
        }

    // Cluster burst every ~110 frames (≈ 1.8 s @ 60 fps)
    if (frame % 110 === 0) {
      const cx  = (Math.random() * tileCols) | 0;
      const cy  = (Math.random() * tileRows) | 0;
      const rad = 1 + (Math.random() * 3.5) | 0;
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++) {
          if (dx*dx + dy*dy > rad*rad) continue;
          const tx = cx+dx, ty = cy+dy;
          if (tx < 0 || tx >= tileCols || ty < 0 || ty >= tileRows) continue;
          for (const px of tiles[ty*tileCols+tx].pixels)
            if (Math.random() < 0.45) {
              px.state = Math.random() < 0.18 ? 3 : 2;
              px.timer = (10 + Math.random() * 24) | 0;
            }
        }
    }
  }

  // ── Draw ────────────────────────────────────────────────────────

  function block(x, y, w, h) {
    const r = Math.min(RADIUS, w / 2, h / 2);
    if (hasRoundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  function draw() {
    if (O.fillBg) { ctx.fillStyle = '#050000'; ctx.fillRect(0, 0, CW, CH); }
    else ctx.clearRect(0, 0, CW, CH);

    for (let tr = 0; tr < tileRows; tr++) {
      const xShift = (tr % 2) * STAGGER * TILE_W;  // LV stagger

      for (let tc = 0; tc < tileCols; tc++) {
        const xBase = (tc - EXTRA) * TILE_W + xShift;
        const yBase = (tr - 1)     * TILE_H;

        // Cull off-screen tiles
        if (xBase + LETTER_W < 0 || xBase > CW)  continue;
        if (yBase + LETTER_H < 0 || yBase > CH) continue;

        const tile   = tiles[tr * tileCols + tc];
        const blocks = BLOCKS[tile.letter];

        for (let i = 0; i < blocks.length; i++) {
          const px = tile.pixels[i];
          if (px.state === 0) continue;
          const color = COLORS[px.state];
          if (!color) continue;
          const b = blocks[i];
          ctx.fillStyle = color;
          block(xBase + b.x, yBase + b.y, b.w, b.h);
        }
      }
    }

  }

  // ── Loop / reduced-motion ───────────────────────────────────────
  let rafId = null;

  function loop(now) { tick(); draw(); paintEdge(now ?? performance.now()); rafId = requestAnimationFrame(loop); }

  function staticFrame() {
    // Advance the simulation silently, then paint a single calm frame.
    for (let i = 0; i < 400; i++) tick();
    draw();
    paintEdge(null);
  }

  function start() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    if (motionQuery.matches) staticFrame();
    else loop();
  }

  resize();
  window.addEventListener('resize', () => { resize(); if (motionQuery.matches) staticFrame(); });
  // web fonts can shift the title slightly after load — re-align the marks once they're in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => buildMarks());
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', start);
  start();
}

// ── Homepage hero ─────────────────────────────────────────────────
lunaCover(document.getElementById('luna-grid-canvas'), document.getElementById('luna-edge-canvas'), {
  sides: 'both', markRatio: 0.40, widthCap: 0.22, cueVar: true, alignTo: '.luna-hero-content h1', fadeRows: 1,
});

// ── Sub-page headers: same cover, smaller — tiles on the right, one mark bottom-right ──
document.querySelectorAll('.page-header').forEach((header) => {
  lunaCover(header.querySelector('.page-grid-canvas'), header.querySelector('.page-edge-canvas'), {
    tileCell: 7, sides: 'right', markRatio: 0.62, widthCap: 0.12, fillBg: false, fadeRatio: 0, feather: 0, lift: 0,
  });
});
