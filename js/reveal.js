/* DREAMDYSIS: Dragon Defence — the card opening (Recruit and Limited), C35 (2026-11-03).
   User no. 77: "seharusnya ada animasi saat pembukaan kartu, buat background shrine, dan sebuah lonceng suci bergerak, cahaya
   turun dan muncul kartu. kartu di putar setelahnya" · "saat mythic yang keluar, animasi seperti ini, tapi cahayanya merah".
   User no. 79 on the first build: "ANIMASI PADA SAAT BUKA KARTU TERLALU JELEK.. HANYANYA JUGA SANGAT JELEK.. SEMUA KASAR.."
   So no drawn lines, rectangles or flat flashes any more: every light is a painted effect (2a/reveal/*.webp, light on black)
   laid on with screen blending, every particle a soft round glow, every move eased, one clock drives it all.
   Order: the shrine fades in and the camera pushes in slowly · the holy bell drops in and rings three times (a golden wave
   from its mouth each time) · its light falls on the altar · sparks of the best grade's colour gather into an orb · the orb
   bursts and the card(s) appear in a frame of flames · each card turns over; a better grade waits a little longer first
   (0 / 120 / 320 / 650 ms) · a Mythic comes last: the shrine goes dark red, a red vortex, red lightning, embers, the card shakes
   and burns, a flash, then it turns. First tap = 4 x speed, second = the end, third = close; Skip = the end. */
(function () {
  const RANK = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
  const TINT = { common: "#a9b1bc", rare: "#4fa3ff", epic: "#b47aff", legendary: "#ffbf47", mythic: "#ff3a2c" };
  const WAIT = { common: 0, rare: 120, epic: 320, legendary: 650, mythic: 0 }; // anticipation before a card turns
  const RAYS = { common: 0, rare: 0.28, epic: 0.5, legendary: 0.78, mythic: 0.9 };
  const GEMS = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const outCubic = (k) => 1 - Math.pow(1 - k, 3);
  const inOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const outBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
  const inQuad = (k) => k * k;
  // smooth noise for the shake (never a new random jump each frame)
  const noise = (t, seed) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.1 + seed * 2.3) * 0.3 + Math.sin(t * 5.3 + seed * 4.1) * 0.2;

  const IMG = {};
  const load = (src) => IMG[src] || (IMG[src] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  const TINTED = new Map();
  /** A light painted on black, recoloured to a grade's colour (its brightness kept, so a white-hot core stays white). */
  function tinted(img, color, sx = 0, sy = 0, sw = img.width, sh = img.height) {
    const key = img.src + color + sx + "," + sy;
    if (TINTED.has(key)) return TINTED.get(key);
    const c = document.createElement("canvas");
    c.width = Math.min(sw, 768); c.height = Math.round((sh * c.width) / sw);
    const g = c.getContext("2d");
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (color) { g.globalCompositeOperation = "color"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); }
    TINTED.set(key, c);
    return c;
  }
  let DOT = null; // one soft round glow, the only particle shape
  const dot = () => {
    if (DOT) return DOT;
    DOT = document.createElement("canvas"); DOT.width = DOT.height = 64;
    const g = DOT.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.65)"); r.addColorStop(0.6, "rgba(255,255,255,0.14)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return DOT;
  };
  const DOTS = new Map();
  const dotOf = (color) => { if (!DOTS.has(color)) { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.drawImage(dot(), 0, 0); g.globalCompositeOperation = "source-atop"; g.fillStyle = color; g.globalAlpha = 0.7; g.fillRect(0, 0, 64, 64); DOTS.set(color, c); } return DOTS.get(color); };

  /**
   * list: [{ id, tier, result: "new" | "shard" }] in pull order; o: { title, A (asset path), text, cream, esc, snd, sfx, done }.
   */
  DD.revealPulls = async function (list, o) {
    const app = document.getElementById("app");
    const A = o.A;
    const many = list.length > 1;
    const best = list.reduce((m, x) => (RANK[x.tier] > RANK[m] ? x.tier : m), "common");
    const mythic = list.findIndex((x) => x.tier === "mythic");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.createElement("div");
    root.className = `rv ${many ? "rv--many" : "rv--one"}`;
    root.innerHTML = `<div class="rv__cam"><img class="rv__bg" alt=""><div class="rv__dim"></div><canvas class="rv__fx rv__fx--back"></canvas>` +
      `<div class="rv__bellw"><img class="rv__bell" alt=""></div><div class="rv__cards"></div><canvas class="rv__fx rv__fx--front"></canvas></div>` +
      `<div class="rv__flash"></div><div class="rv__ui"><div class="rv__title">${o.text("label", o.esc(o.title || "Recruit"))}</div>` +
      `<button class="rv__skip" aria-label="Skip">${o.text("label", "Skip")}</button><div class="rv__hint">${o.cream("Tap to continue")}</div></div>`;
    app.appendChild(root);
    const $ = (s) => root.querySelector(s);
    const W = root.clientWidth, H = root.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cvs = [$(".rv__fx--back"), $(".rv__fx--front")].map((c) => { c.width = W * dpr; c.height = H * dpr; const g = c.getContext("2d"); g.scale(dpr, dpr); return g; });
    const [gb, gf] = cvs;

    // the art: the shrine, the bell, the card back, the painted lights
    const P = (f) => A("2a/reveal/" + f);
    const [bg, bell, back, beam, burst, flare, ring, bolts, vortex, frames] = await Promise.all([
      load(A("2a/shrine/bg.webp")), load(A("2a/shrine/bell.webp")), load(A("2a/shrine/card_back.webp")),
      load(P("beam.webp")), load(P("burst.webp")), load(P("flare.webp")), load(P("ring.webp")), load(P("bolts.webp")), load(P("vortex.webp")), load(P("frames.webp")),
    ]);
    if (bg) $(".rv__bg").src = bg.src;
    if (bell) $(".rv__bell").src = bell.src;

    // where things stand: the shrine painting covers the screen, its altar top sits at 70 % of the painting
    // (the painting fills the camera layer, 14 px bigger than the screen on every side so a shake never shows its edge)
    const sBg = Math.max((W + 28) / 1024, (H + 28) / 1536), imgH = 1536 * sBg, offY = (H + 28 - imgH) * 0.6;
    const altarY = offY + 0.7 * imgH - 14;
    const bellW = 118, bellH = bell ? (bellW * bell.height) / bell.width : 157, bellTop = 52, bellMouth = bellTop + bellH * 0.86;
    const C = { x: W / 2, y: Math.max(bellMouth + 120, altarY - 190) }; // where the light gathers
    // the cards: one = big on the altar; ten = rows of 4 / 3 / 3 over the altar
    const ratio = 1417 / 937;
    const cards = [];
    if (!many) {
      const cw = Math.min(236, W * 0.62, (altarY - 84) / ratio), ch = cw * ratio;
      cards.push({ x: W / 2, y: altarY - ch / 2 - 4, w: cw, h: ch });
      C.y = cards[0].y;
    } else {
      const cw = Math.min(82, (W - 24 - 30) / 4), ch = cw * ratio, rowH = ch + 30, gridH = rowH * 3 + 2 * 8;
      const top = Math.max(84, Math.min(altarY + 40 - gridH, H - 60 - gridH));
      const rows = [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]];
      rows.forEach((r, ri) => r.forEach((i, ci) => { if (i < list.length) cards[i] = { x: W / 2 + (ci - (r.length - 1) / 2) * (cw + 10), y: top + ri * (rowH + 8) + ch / 2, w: cw, h: ch }; }));
    }
    // the card elements
    const box = $(".rv__cards");
    list.forEach((x, i) => {
      const h = DD.HERO[x.id], c = cards[i];
      const art = many ? `<img src="${A(`heroes/${x.id}/bust.webp`)}" alt="">`
        : `<img class="rvc__land" src="${A(`2a/bg/${h.el}.webp`)}" alt=""><img class="rvc__hero" src="${A(`2a/heroes/profile_${x.id}.webp`)}" alt="">`;
      const el = document.createElement("div");
      el.className = `rvc rvc--${x.tier}`;
      el.style.width = c.w + "px"; el.style.height = c.h + "px";
      el.innerHTML = `<div class="rvc__in"><div class="rvc__back">${back ? `<img src="${back.src}" alt="">` : ""}<i class="rvc__sheen"></i></div>` +
        `<div class="rvc__face gfc gfc--${x.tier === "common" ? "common" : x.tier}"><span class="gfc__win">${art}</span>` +
        (x.result === "new" ? `<span class="rvc__new">${o.text("tag", "New")}</span>` : "") + `</div></div>` +
        (many ? `<div class="rvc__info">${o.text("tag", o.esc(h.short), "rvc__name")}</div>`
          : `<div class="rvc__info"><span class="rvc__plate">${o.text("title", o.esc(h.name))}</span>` +
            `<span class="rvc__gems">${Array.from({ length: GEMS[x.tier] }, () => `<i></i>`).join("")}</span>` +
            o.cream(`${DD.TIER_NAME[x.tier]} · ${DD.ELEMENT_NAME[h.el]} · ${x.result === "new" ? "New Hero" : "+1 Card"}`, "rvc__line") + `</div>`);
      box.appendChild(el);
      c.el = el; c.inner = el.querySelector(".rvc__in"); c.info = el.querySelector(".rvc__info"); c.tier = x.tier;
    });

    // ---- the timeline (ms). Everything below is a pure function of T, except the particles and the sounds.
    const T0 = { bg: 0, bell: 200, ring: [850, 1300, 1750], beam: 1500, gather: 2000, burst: 2700 };
    const flips = []; // { i, at } turn start per card
    let t = many ? 3550 : 3200, stormAt = -1, stormI = -1, focusAt = -1, backAt = -1;
    const order = list.map((x, i) => i).sort((a, b) => (list[a].tier === "mythic") - (list[b].tier === "mythic"));
    for (const i of order) {
      if (list[i].tier === "mythic") {
        if (many) { focusAt = t + 100; t += 700; }
        stormAt = t; stormI = i; t += 2400;
        flips[i] = t; t += 450 + (many ? 1300 : 0);
        if (many) backAt = t - 900;
      } else { t += WAIT[list[i].tier]; flips[i] = t; t += many ? 160 : 0; }
    }
    const END = Math.max(Math.max(...flips) + 450 + 700, backAt >= 0 ? backAt + 600 + 400 : 0); // a Mythic among ten is back in its place first
    const FLIP = many ? 380 : 480;

    // particles: { x, y, vx, vy, life, max, size, color, kind } on the back or front canvas
    const parts = [];
    const add = (p) => { if (parts.length < 420) parts.push(p); };
    const dust = Array.from({ length: still ? 10 : 28 }, (_, k) => ({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 4, sp: 6 + Math.random() * 14, ph: Math.random() * 6.28, k }));
    const sparks = (x, y, n, color, speed = 260, front = true) => { for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8); add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0, max: 450 + Math.random() * 450, size: 6 + Math.random() * 10, color, drag: 2.6, g: 120, front }); } };
    const bolts4 = bolts ? [0, 1, 2, 3].map((k) => ({ sx: (bolts.width / 4) * k, sw: bolts.width / 4 })) : [];
    const strikes = [];

    // ---- sounds and one-off bursts fire when the clock passes their time (skipped ones stay quiet)
    const cues = [];
    const cue = (at, fn) => cues.push({ at, fn, done: false });
    cue(T0.bell + 120, () => o.snd("shrine_beam"));
    T0.ring.forEach((r, k) => cue(r, () => { if (k === 0) o.snd("shrine_bell"); }));
    cue(T0.beam, () => o.snd("shrine_beam"));
    cue(T0.burst, () => { o.snd("chest_open"); sparks(C.x, C.y, many ? 40 : 34, TINT[best === "mythic" ? "legendary" : best]); trauma = Math.max(trauma, 0.35); });
    if (many) cards.forEach((c, i) => cue(T0.burst + 60 * i + 480, () => sparks(c.x, c.y, 6, TINT[list[i].tier === "mythic" ? "legendary" : list[i].tier], 140)));
    flips.forEach((f, i) => cue(f + FLIP / 2, () => {
      const c = cards[i], tier = list[i].tier;
      o.snd(tier === "common" ? "pull" : "reveal_" + tier);
      sparks(c.x, c.y, many ? (tier === "common" ? 8 : 14) : 40, TINT[tier], many ? 180 : 300);
      if (RANK[tier] >= 3) trauma = Math.max(trauma, tier === "mythic" ? 0.7 : 0.4);
      if (RANK[tier] >= 3 && (!many || tier === "mythic")) o.sfx(`audio/roar_${list[i].id}.mp3`, 0.6);
    }));
    if (stormAt >= 0) { cue(stormAt, () => o.snd("mythic_storm")); cue(stormAt + 1200, () => o.snd("mythic_storm")); }

    // ---- the loop
    let T = 0, speed = still ? 2 : 1, last = performance.now(), raf = 0, trauma = 0, closed = false;
    const cam = $(".rv__cam"), bgEl = $(".rv__bg"), dim = $(".rv__dim"), bellW8 = $(".rv__bellw"), flashEl = $(".rv__flash");
    const finish = () => { T = END; parts.length = 0; strikes.length = 0; for (const c of cues) c.done = true; trauma = 0; const b = list.reduce((m, x) => (RANK[x.tier] > RANK[m.tier] ? x : m), list[0]); o.snd(b.tier === "common" ? "pull" : "reveal_" + b.tier); };
    const close = () => { if (closed) return; closed = true; cancelAnimationFrame(raf); root.remove(); o.done(); };
    let taps = 0;
    root.addEventListener("click", () => { if (T >= END) return close(); taps++; if (taps === 1 && !still) speed = 4; else finish(); });
    $(".rv__skip").onclick = (e) => { e.stopPropagation(); if (T >= END) close(); else finish(); };

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      T = Math.min(END, T + dt * 1000 * speed);
      for (const c of cues) if (!c.done && T >= c.at) { c.done = true; c.fn(); }
      const k = (a, b) => seg(T, a, b);
      // storm state (Mythic)
      const inStorm = stormAt >= 0 && T >= stormAt && T < flips[stormI];
      const storm = stormAt >= 0 ? k(stormAt, stormAt + 600) * (1 - k(flips[stormI] - 150, flips[stormI] + 500)) : 0;
      const stormK = stormAt >= 0 ? k(stormAt, flips[stormI]) : 0;
      // camera: a slow push in, a shake from trauma (real time), more in the storm
      trauma = Math.max(0, trauma - dt * 1.4);
      const tr = still ? 0 : Math.min(1, trauma + (inStorm ? 0.18 + stormK * 0.42 : 0));
      const sh = tr * tr, tt = now / 1000;
      const push = 1 + 0.06 * outCubic(k(0, END * 0.8));
      cam.style.transform = `translate(${(10 * sh * noise(tt * 16, 1)).toFixed(2)}px, ${(10 * sh * noise(tt * 16, 7)).toFixed(2)}px) rotate(${(0.02 * sh * noise(tt * 14, 3)).toFixed(4)}rad)`;
      bgEl.style.transform = `scale(${push.toFixed(4)})`;
      root.style.opacity = String(outCubic(k(0, 450)));
      dim.style.opacity = String(0.25 * k(T0.burst - 300, T0.burst + 400) + 0.55 * storm);
      dim.style.background = storm > 0.02 ? `radial-gradient(70% 55% at 50% 45%, rgba(90,0,0,${0.3 + 0.3 * storm}), rgba(8,0,0,0.9))` : "";
      // the bell: drops in on a spring, rings three times, lifts away when the cards come
      const drop = outBack(k(T0.bell, T0.bell + 550), 1.4), lift = inOutCubic(k(T0.burst + 100, T0.burst + 700));
      const swingT = (T - T0.ring[0]) / 1000;
      const ang = T > T0.ring[0] ? 15 * Math.exp(-swingT * 1.9) * Math.sin(swingT * 2 * Math.PI * 1.15) : 0;
      bellW8.style.transform = `translate(-50%, ${(-260 * (1 - drop) - 300 * lift).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
      bellW8.style.opacity = String(1 - lift);
      // the cards
      cards.forEach((c, i) => {
        const tier = list[i].tier, f = flips[i];
        let x = c.x, y = c.y, s = 1, op = 1, rot = 0;
        if (!many) {
          const app2 = k(T0.burst, T0.burst + 420);
          s = lerp(0.55, 1, outBack(app2, 1.6)); op = outCubic(k(T0.burst, T0.burst + 160));
          y += Math.sin(tt * 1.6) * 4 * (T < f ? 1 : 0.6);
        } else {
          const st = T0.burst + 60 * i, p = outCubic(k(st, st + 480));
          const mx = (C.x + c.x) / 2 + (c.x - C.x) * 0.2, my = Math.min(C.y, c.y) - 60; // a bowed path out of the light
          x = (1 - p) * (1 - p) * C.x + 2 * (1 - p) * p * mx + p * p * c.x;
          y = (1 - p) * (1 - p) * C.y + 2 * (1 - p) * p * my + p * p * c.y;
          s = lerp(0.35, 1, p); op = outCubic(k(st, st + 120));
          if (i === stormI && focusAt >= 0) { // the Mythic comes to the middle, big, for its storm, then goes back
            const go = inOutCubic(k(focusAt, focusAt + 600)) * (1 - inOutCubic(k(backAt, backAt + 600)));
            const big = Math.min(2.6, (W * 0.58) / c.w);
            x = lerp(x, W / 2, go); y = lerp(y, Math.min(H * 0.48, altarY - (c.h * big) / 2), go); s = lerp(s, big, go);
          }
        }
        if (i === stormI && inStorm) { const a = 1.5 + 5 * stormK; x += a * noise(tt * 30, i); y += a * noise(tt * 30, i + 9); rot = 1.2 * stormK * noise(tt * 22, i + 3); }
        const fp = inOutCubic(k(f, f + FLIP));
        const lift2 = Math.sin(fp * Math.PI) * (many ? 0.08 : 0.07);
        c.el.style.transform = `translate(${(x - c.w / 2).toFixed(1)}px, ${(y - c.h / 2).toFixed(1)}px) scale(${(s * (1 + lift2)).toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
        c.el.style.opacity = String(op);
        c.inner.style.transform = `rotateY(${(180 * fp).toFixed(1)}deg)`;
        c.el.classList.toggle("is-open", fp >= 0.5);
        c.el.classList.toggle("is-dim", many && focusAt >= 0 && i !== stormI && T > focusAt && T < backAt + 600);
        c.el.style.zIndex = many && i === stormI && T > focusAt && T < backAt + 600 ? "5" : ""; // the Mythic in the middle stays in front
        c.info.style.opacity = String(outCubic(k(f + FLIP * 0.6, f + FLIP + 260)));
        c.info.style.transform = `translateY(${(8 * (1 - outCubic(k(f + FLIP * 0.6, f + FLIP + 260)))).toFixed(1)}px)`;
        c.cx = x; c.cy = y; c.s = s * (1 + lift2); c.fp = fp;
      });
      flashEl.style.opacity = String(stormAt >= 0 ? 0.6 * (k(flips[stormI] - 120, flips[stormI]) * (1 - k(flips[stormI] + 40, flips[stormI] + 380))) : 0);

      // ---- the painted lights
      for (const g of cvs) { g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, W, H); g.globalCompositeOperation = "lighter"; }
      const red = storm > 0.02;
      const beamTint = red ? TINT.mythic : null;
      // dust in the shrine's light
      for (const d of dust) {
        d.y -= d.sp * dt; d.x += Math.sin(tt * 0.6 + d.ph) * 4 * dt; if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        gb.globalAlpha = (0.25 + 0.25 * Math.sin(tt * 2 + d.ph)) * outCubic(k(0, 800));
        gb.drawImage(dotOf(red ? "#ff6040" : "#ffd27a"), d.x - d.s * 2, d.y - d.s * 2, d.s * 4, d.s * 4);
      }
      // the bell's golden waves
      if (ring) T0.ring.forEach((r) => { const p = k(r, r + 800); if (p <= 0 || p >= 1) return; const R = lerp(30, 230, outCubic(p)); gb.globalAlpha = 0.75 * (1 - p); gb.drawImage(tinted(ring, null), W / 2 - R, bellTop + bellH * 0.8 - R * 0.5, R * 2, R); });
      // the light falling from the bell to the altar
      if (beam) {
        const p = inOutCubic(k(T0.beam, T0.beam + 520));
        if (p > 0) {
          const y0 = bellMouth - 10 - 300 * inOutCubic(k(T0.burst + 100, T0.burst + 700)), y1 = altarY + 40, bw = W * (many ? 0.95 : 0.8);
          const img = tinted(beam, beamTint);
          gb.save(); gb.beginPath(); gb.rect(0, y0, W, (y1 - y0) * p + 20); gb.clip();
          gb.globalAlpha = (0.78 + 0.08 * Math.sin(tt * 3.1)) * (1 - 0.35 * k(T0.burst, T0.burst + 900));
          gb.drawImage(img, W / 2 - bw / 2, y0, bw, y1 - y0 + 60);
          gb.restore();
          // the altar lights up where the light lands
          gb.globalAlpha = 0.55 * p; gb.drawImage(dotOf(red ? "#ff4030" : "#ffd88a"), W / 2 - W * 0.42, altarY - 26, W * 0.84, 60);
        }
      }
      // the gathering: sparks spiral into an orb of the best grade's colour
      const gTint = TINT[best === "mythic" ? "legendary" : best];
      if (T >= T0.gather && T < T0.burst) {
        if (!still && Math.random() < 0.9) { const a = Math.random() * 6.28, r0 = 120 + Math.random() * 90; add({ orbit: true, a, r: r0, r0, life: 0, max: 700, size: 7 + Math.random() * 8, color: gTint, front: false }); }
        const p = k(T0.gather, T0.burst), R = 14 + 40 * p + 4 * Math.sin(tt * 18);
        gb.globalAlpha = 0.9; gb.drawImage(dotOf(gTint), C.x - R * 2, C.y - R * 2, R * 4, R * 4);
        gb.globalAlpha = 0.9; gb.drawImage(dot(), C.x - R, C.y - R, R * 2, R * 2);
      }
      // the burst
      if (burst) { const p = k(T0.burst, T0.burst + 700); if (p > 0 && p < 1) { const R = lerp(80, Math.max(W, H) * 0.9, outCubic(p)); gf.globalAlpha = 0.9 * (1 - p); gf.drawImage(tinted(burst, gTint), C.x - R, C.y - R, R * 2, R * 2); } }
      if (ring) { const p = k(T0.burst, T0.burst + 650); if (p > 0 && p < 1) { const R = lerp(40, W * 0.85, outCubic(p)); gf.globalAlpha = 0.8 * (1 - p); gf.drawImage(tinted(ring, gTint), C.x - R, C.y - R, R * 2, R * 2); } }
      if (flare) { const p = k(T0.burst - 60, T0.burst + 360); if (p > 0 && p < 1) { const R = lerp(60, 260, outCubic(p)); gf.globalAlpha = Math.sin(p * Math.PI); gf.drawImage(flare, C.x - R * 1.5, C.y - R * 1.5, R * 3, R * 3); } }

      // per card: the frame of flames before it turns, the grade's light after
      cards.forEach((c, i) => {
        const tier = list[i].tier, f = flips[i], cw = c.w * c.s, ch = c.h * c.s;
        const showing = T >= T0.burst + (many ? 60 * i + 200 : 120);
        if (!showing) return;
        // the flames around the hidden card (the grade's colour, gold for a hidden Mythic until its storm)
        if (frames && c.fp < 0.5) {
          const fr = tier === "mythic" && (inStorm || T >= stormAt) && stormAt >= 0 ? tinted(frames, null, frames.width / 2, 0, frames.width / 2, frames.height)
            : tinted(frames, tier === "mythic" ? TINT.legendary : TINT[tier], 0, 0, frames.width / 2, frames.height);
          const a = (many ? 0.55 : 0.85) * (tier === "common" ? 0.55 : 1) * (1 - c.fp * 2) * (0.85 + 0.15 * Math.sin(tt * 9 + i));
          const fw = cw * 1.42, fh = ch * 1.3;
          gb.globalAlpha = a; gb.drawImage(fr, c.cx - fw / 2, c.cy - fh / 2 + 2 * Math.sin(tt * 7 + i), fw, fh);
        }
        // a better grade waits with a growing glow before it turns
        const w0 = f - WAIT[tier];
        if (WAIT[tier] && T > w0 - 100 && T < f + FLIP) { const p = k(w0 - 100, f); gb.globalAlpha = 0.6 * p; const R = cw * (0.7 + 0.25 * p); gb.drawImage(dotOf(TINT[tier]), c.cx - R, c.cy - R, R * 2, R * 2); }
        // the light behind an open card
        if (c.fp >= 0.5) {
          const op = outCubic(k(f + FLIP / 2, f + FLIP + 300));
          const R = Math.max(cw, ch) * (many ? 0.95 : 1.15);
          gb.globalAlpha = (many ? 0.45 : 0.6) * op * (tier === "common" ? 0.4 : 1);
          gb.drawImage(dotOf(TINT[tier]), c.cx - R, c.cy - R, R * 2, R * 2);
          if (burst && RAYS[tier]) {
            gb.save(); gb.translate(c.cx, c.cy); gb.rotate(tt * (tier === "mythic" ? 0.35 : 0.2));
            gb.globalAlpha = RAYS[tier] * op * (many ? 0.55 : 0.8); const Rr = R * (many ? 1.1 : 1.35);
            gb.drawImage(tinted(burst, TINT[tier]), -Rr, -Rr, Rr * 2, Rr * 2); gb.restore();
          }
          // the turn's flash: a streak of light across the card at the moment it shows its face
          const p = k(f + FLIP * 0.35, f + FLIP * 0.95);
          if (flare && p > 0 && p < 1) { const R2 = cw * (many ? 1.3 : 1.6); gf.globalAlpha = Math.sin(p * Math.PI) * 0.9; gf.drawImage(tinted(flare, tier === "common" ? null : TINT[tier]), c.cx - R2, c.cy - R2, R2 * 2, R2 * 2); }
          if (ring && RANK[tier] >= 2) { const pr = k(f + FLIP / 2, f + FLIP / 2 + 600); if (pr > 0 && pr < 1) { const R3 = lerp(cw * 0.4, cw * (many ? 1.6 : 2.2), outCubic(pr)); gf.globalAlpha = 0.7 * (1 - pr); gf.drawImage(tinted(ring, TINT[tier]), c.cx - R3, c.cy - R3, R3 * 2, R3 * 2); } }
        }
      });

      // the Mythic storm: the red vortex behind the card, lightning thrown out of it, embers rising off the burning card
      if (stormAt >= 0 && storm > 0) {
        const c = cards[stormI], cw = c.w * c.s;
        if (vortex) {
          const R = cw * lerp(0.9, 1.9, stormK) * (1 - 0.8 * inQuad(k(flips[stormI] - 260, flips[stormI])));
          gb.save(); gb.translate(c.cx, c.cy); gb.rotate(-tt * (1.2 + 3 * stormK)); gb.globalAlpha = 0.95 * storm;
          gb.drawImage(vortex, -R, -R, R * 2, R * 2); gb.rotate(tt * 2.1); gb.globalAlpha = 0.5 * storm; gb.drawImage(vortex, -R * 0.7, -R * 0.7, R * 1.4, R * 1.4); gb.restore();
        }
        if (inStorm && !still) {
          if (bolts && Math.random() < 0.12 + 0.25 * stormK) strikes.push({ b: bolts4[(Math.random() * 4) | 0], a: Math.random() * Math.PI * 2, len: Math.hypot(W, H) * (0.4 + Math.random() * 0.4), life: 0, max: 160 + Math.random() * 120 });
          for (let n = 0; n < 3; n++) add({ x: c.cx + (Math.random() - 0.5) * c.w * c.s, y: c.cy + (Math.random() - 0.2) * c.h * c.s * 0.8, vx: (Math.random() - 0.5) * 50, vy: -60 - Math.random() * 140, life: 0, max: 700 + Math.random() * 600, size: 5 + Math.random() * 9, color: Math.random() < 0.5 ? "#ff5a2a" : "#ffb04a", drag: 0.6, g: -30, front: true });
        }
        for (let n = strikes.length - 1; n >= 0; n--) {
          const s = strikes[n]; s.life += dt * 1000; if (s.life > s.max) { strikes.splice(n, 1); continue; }
          const a = 1 - s.life / s.max, b = s.b, w = s.len * (b.sw / bolts.height) * 1.1;
          gf.save(); gf.translate(c.cx, c.cy); gf.rotate(s.a - Math.PI / 2); gf.globalAlpha = a * a;
          gf.drawImage(bolts, b.sx, 0, b.sw, bolts.height, -w / 2, 0, w, s.len); gf.restore();
          gb.globalAlpha = 0.18 * a; gb.drawImage(dotOf("#ff3020"), 0, 0, W, H); // the shrine lights up red with each strike
        }
      }

      // particles
      for (let n = parts.length - 1; n >= 0; n--) {
        const p = parts[n]; p.life += dt * 1000; if (p.life >= p.max) { parts.splice(n, 1); continue; }
        const q = p.life / p.max; const g = p.front ? gf : gb;
        if (p.orbit) { p.r = p.r0 * (1 - inQuad(q)); p.a += dt * (3 + 6 * q); p.x = C.x + Math.cos(p.a) * p.r; p.y = C.y + Math.sin(p.a) * p.r * 0.8; }
        else { p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
        g.globalAlpha = (1 - q) * (p.orbit ? q * 2 : 1); const sz = p.size * (1 - q * 0.5);
        g.drawImage(dotOf(p.color), p.x - sz, p.y - sz, sz * 2, sz * 2);
        g.globalAlpha *= 0.8; g.drawImage(dot(), p.x - sz * 0.35, p.y - sz * 0.35, sz * 0.7, sz * 0.7);
      }
      for (const g of cvs) g.globalAlpha = 1;
      root.classList.toggle("is-done", T >= END);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  };
})();
