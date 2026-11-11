/* C55 (user no. 118: "serangan2 hero semua unique, masing2 punya arah serangan berbeda … bukan lempar2, atau 1 garis ke kiri kanan …
   efek … variasi lebih banyak … lebih liar"; Ledger Draft 45): the battle side of the 21 new attacks (data in js/heroes-c55.js).
   DD.ATK55[kind] = { fire(h, o, vis) → false when there is nothing to hit (the attack waits), step(o, dt, vis) → false when done,
   draw(g, o) }. js/battle-c43.js calls them for a hero whose kind is here and for every c43 object with an a55 kind.
   Shapes, one per hero: a debt seal that pays later · a shadow running along the spine · bubbles floating up in waves · one shot to
   the tail · an eruption from below · mines on the path · a cross of light · a tide rising from the wall · a totem on the field ·
   a spiral of vials · a figure-eight flight · a hawk's dive · fireworks · a glyph triangle · a rose of blades · chains from the
   corners · a black rift · time sigils · a rising cyclone · nightmares from inside the body · the dragon's own fire turned back from its head ·
   a meteor shower.
   Loaded after js/battle-c43.js. */
(function () {
  if (!DD.Battle) return;
  const P = DD.Battle.prototype;
  const BP = Object.getPrototypeOf(P); // js/battle-c43.js methods (hit, deal, dmgOf, rateOf …)
  const TOP = 120;
  const PI2 = Math.PI * 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  const baseOf = (h) => h.def.w.dmg || (h.def.w.dps ? h.def.w.dps * 0.4 : 30);
  const img = (p) => DD.img(p);
  const proj = (name) => img(`dd/fx_proj_${name}.webp`);
  const evo = (name) => img(`2a/fx/evo_${name}.webp`);
  const a55 = (name) => img(`2a/fx/c55_${name}.webp`); // C55 painted pieces (ChatGPT); until a file exists the attack is drawn
  const segD = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const sprite = (g, im, x, y, w, rot, a) => {
    if (!ready(im)) return false;
    const h = (w * im.naturalHeight) / im.naturalWidth;
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (a !== undefined) g.globalAlpha *= a; g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
    return true;
  };
  const halo = (g, x, y, r, col, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha *= a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, PI2); g.fill(); g.restore();
  };
  const progress = (b, e) => e.s / (b.pathOf(e).len || 1); // how far along its road a scale is (1 = at the wall)
  const front = (b, vis) => vis.reduce((a, e) => (!a || progress(b, e) > progress(b, a) ? e : a), null);
  // the toughest body scales (a head only when no body scale is left: its life is far bigger and a lone hero would never break a scale)
  const toughest = (vis, n, skip) => {
    const ok = vis.filter((e) => !e.dead && (!skip || !skip.has(e))), body = ok.filter((e) => e.type === "body");
    return (body.length ? body : ok).sort((a, c) => c.hp - a.hp).slice(0, n);
  };
  const push = (b, o) => { b.c43.obj.push(o); return o; };
  const line = (g, x1, y1, x2, y2, w, col, a) => { g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };
  const ring = (g, x, y, r, w, col, a, from, to) => { g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, from || 0, to === undefined ? PI2 : to); g.stroke(); g.restore(); };

  const X = (DD.ATK55 = {});

  /* ---------------------------------------------------------------- Ebenezer: Debt Seal */
  X.debt = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + st.count;
      const sealed = new Set(this.c43.obj.filter((x) => x.a55 === "debt").map((x) => x.e));
      // the body scales closest to the wall (a head only when no body scale is left: a lone Ebenezer must break scales, or no hero is called)
      const ok = vis.filter((e) => !e.dead && !sealed.has(e)), body = ok.filter((e) => e.type === "body");
      const list = (body.length ? body : ok).sort((a, b) => progress(this, b) - progress(this, a)).slice(0, n);
      if (!list.length) return false;
      for (const e of list) push(this, { a55: "debt", h, e, t: 0, delay: w.delay || 2, mult: 1 + 0.25 * (st.dur || 0) });
      return true;
    },
    step(o, dt) {
      const h = o.h, e = o.e;
      if (e.dead) return false;
      if ((o.t += dt) < o.delay) return true;
      let m = o.mult * (1 + 2 * Math.max(0, e.hp) / e.max);
      if (this.has(h, "taxman") && (h.cnt.tax = (h.cnt.tax || 0) + 1) % 10 === 0) m *= 5;
      const p = this.pos(e);
      this.hit(h, e, baseOf(h) * m);
      if (h.st.size > 0) for (const n of this.neighbours(e)) this.hit(h, n, baseOf(h) * m * Math.min(1.5, h.st.size), true);
      if (this.has(h, "jetRicochet")) for (const x of this.near(e, 3, 220)) { const q = this.pos(x); this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2, t: 0.2, max: 0.2, col: "#ffd84a" }); this.hit(h, x, baseOf(h) * m * 0.5, true); }
      this.fxImg("dd/fx_hit_flash.webp", p.x, p.y, 90, 0.3, { grow: 0.6 });
      this.burst(p.x, p.y, "#ffd84a", 10);
      return false;
    },
    draw(g, o) {
      if (o.e.dead) return;
      const p = this.pos(o.e), k = o.t / o.delay, y = p.y - 6;
      halo(g, p.x, y, 30, "rgba(255,200,60,0.55)", 0.6 + 0.4 * k);
      if (!sprite(g, a55("debt_seal"), p.x, y, 34)) {
        g.save(); g.fillStyle = "#8a1d1d"; g.strokeStyle = "#ffd84a"; g.lineWidth = 2; g.beginPath(); g.arc(p.x, y, 13, 0, PI2); g.fill(); g.stroke();
        g.fillStyle = "#ffd84a"; g.font = "700 14px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", p.x, y + 1); g.restore();
      }
      ring(g, p.x, y, 19, 3, "#ffd84a", 0.9, -Math.PI / 2, -Math.PI / 2 + PI2 * (1 - k));
    },
  };

  /* ---------------------------------------------------------------- Nim: Shadow Run (along the spine, tail → head) */
  X.spine = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + st.count;
      const by = new Map();
      for (const e of vis) by.set(e.d || 0, (by.get(e.d || 0) || 0) + 1);
      const d = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!d) return false;
      const idx = [];
      this.body.forEach((e, i) => { if ((e.d || 0) === d[0] && !e.dead && e.s > this.enterOf(e)) idx.push(i); });
      if (!idx.length) return false;
      for (let k = 0; k < n; k++) push(this, { a55: "spine", h, d: d[0], i: idx[Math.max(0, idx.length - 1 - k * 3)], acc: 0, back: false, trail: [] });
      return true;
    },
    step(o, dt) {
      const h = o.h, w = h.def.w, T = this.time;
      o.acc += dt * (w.speed || 9);
      while (o.acc >= 1) {
        o.acc -= 1;
        let e = this.body[o.i];
        if (!e || (e.d || 0) !== o.d || e.s <= this.enterOf(e) - 10) {
          if (!o.back && this.has(h, "returnDagger")) { o.back = true; o.i += 1; continue; }
          return false;
        }
        if (!e.dead) {
          const stabs = 1 + (w.pierce || 0) + (h.st.pierce || 0);
          for (let k = 0; k < stabs && !e.dead; k++) this.hit(h, e, baseOf(h), k > 0);
          if (!e.dead && e.pois >= 5 && e.poisT > T) { // Toxin: 5 Poisoned stacks burst
            e.pois = 0;
            const m = this.has(h, "venomBurst") ? 3 : 1, p = this.pos(e);
            for (const x of [e, ...this.neighbours(e)]) this.hit(h, x, baseOf(h) * m, true);
            this.fxImg("dd/fx_hit_flash.webp", p.x, p.y, 90, 0.3, { grow: 0.5 });
            this.burst(p.x, p.y, "#c46ae8", 12);
          }
          o.p = this.pos(e);
          o.trail.push({ x: o.p.x, y: o.p.y }); if (o.trail.length > 7) o.trail.shift();
        }
        o.i += o.back ? 1 : -1;
      }
      return true;
    },
    draw(g, o) {
      if (!o.p) return;
      o.trail.forEach((q, i) => halo(g, q.x, q.y, 18, "rgba(150,70,200,0.5)", (i + 1) / o.trail.length * 0.6));
      if (!sprite(g, a55("shadow"), o.p.x, o.p.y - 10, 44)) sprite(g, proj("dagger"), o.p.x, o.p.y, 30, o.back ? Math.PI / 2 : -Math.PI / 2);
    },
  };

  /* ---------------------------------------------------------------- Velis: Heart Bubbles (float up in waves, mend the wall) */
  X.bubbles = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 3) + (st.bounce || 0), m = this.muzzle(h);
      for (let i = 0; i < n; i++) {
        const x0 = Math.max(20, Math.min(this.W - 20, m.x + (i - (n - 1) / 2) * 26));
        push(this, { a55: "bubbles", h, x0, x: x0, y: m.y - 10 - i * 8, t: 0, ph: this.rnd() * 6, vy: 120 + this.rnd() * 40, pops: (w.multi || 2) + (st.multi || 0), r: 13 });
      }
      return true;
    },
    step(o, dt, vis) {
      const h = o.h;
      o.t += dt;
      o.y -= o.vy * dt;
      o.x = o.x0 + Math.sin(o.t * 3 + o.ph) * (o.child ? 18 : 32);
      if (o.y < TOP - 30) return false;
      for (const e of vis) {
        if (e.dead || dist(this.pos(e), o) > e.r + o.r) continue;
        for (let k = 0; k < o.pops && !e.dead; k++) this.hit(h, e, baseOf(h) * (o.child ? 0.5 : 1), k > 0);
        this.wall = Math.min(this.wallMax, this.wall + this.wallMax * 0.003); // Mend
        this.fx.push({ x: o.x, y: o.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#ff9fd0", ring: 26 });
        if (this.has(h, "twinHeart") && !o.child) for (const s of [-1, 1]) push(this, { a55: "bubbles", h, x0: o.x + s * 16, x: o.x, y: o.y - 6, t: 0, ph: s, vy: 160, pops: 1, r: 9, child: true });
        if (this.has(h, "charm") && this.danger()) this.frozen = Math.max(this.frozen, 0.3);
        return false;
      }
      return true;
    },
    draw(g, o) {
      if (sprite(g, a55("heart_bubble"), o.x, o.y, o.r * 2.6)) return;
      g.save();
      const gr = g.createRadialGradient(o.x - o.r * 0.35, o.y - o.r * 0.4, 1, o.x, o.y, o.r);
      gr.addColorStop(0, "rgba(255,255,255,0.85)"); gr.addColorStop(0.35, "rgba(255,170,215,0.35)"); gr.addColorStop(1, "rgba(120,200,255,0.25)");
      g.fillStyle = gr; g.strokeStyle = "rgba(255,210,235,0.9)"; g.lineWidth = 1.5; g.beginPath(); g.arc(o.x, o.y, o.r, 0, PI2); g.fill(); g.stroke(); g.restore();
      sprite(g, proj("heart"), o.x, o.y, o.r * 1.1);
    },
  };

  /* ---------------------------------------------------------------- Garran: Longshot (lock on the tail, one shot through the line) */
  X.longshot = {
    fire(h, o, vis) {
      const t = vis.filter((e) => !e.dead).reduce((a, e) => (!a || progress(this, e) < progress(this, a) ? e : a), null);
      if (!t) return false;
      push(this, { a55: "longshot", h, e: t, t: 0, aimT: h.def.w.aim || 0.45 });
      if (this.has(h, "doubleTap")) push(this, { a55: "longshot", h, e: t, t: -0.2, aimT: h.def.w.aim || 0.45 });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h;
      o.t += dt;
      if (!o.fired) {
        if (o.e.dead) { const n = vis.filter((e) => !e.dead).reduce((a, e) => (!a || progress(this, e) < progress(this, a) ? e : a), null); if (!n) return false; o.e = n; }
        o.m = this.muzzle(h); o.p = this.pos(o.e);
        if (o.t < o.aimT) return true;
        const ang = Math.atan2(o.p.y - o.m.y, o.p.x - o.m.x), x2 = o.m.x + Math.cos(ang) * 1000, y2 = o.m.y + Math.sin(ang) * 1000;
        const hits = vis.filter((e) => !e.dead && segD(this.pos(e).x, this.pos(e).y, o.m.x, o.m.y, x2, y2) < 12 + e.r * 0.6)
          .sort((a, b) => dist(this.pos(a), o.m) - dist(this.pos(b), o.m));
        hits.forEach((e, i) => this.hit(h, e, baseOf(h) * (1 + 0.1 * i), i > 0));
        o.line = { x1: o.m.x, y1: o.m.y, x2, y2 };
        o.fired = true; o.ft = 0;
        this.shake = Math.max(this.shake, 3);
        return true;
      }
      return (o.ft += dt) < 0.25;
    },
    draw(g, o) {
      if (o.t < 0) return;
      if (!o.fired && o.m && o.p) {
        const a = 0.35 + 0.5 * Math.min(1, o.t / o.aimT);
        line(g, o.m.x, o.m.y, o.p.x, o.p.y, 1.2, "#ff4a3a", a);
        ring(g, o.p.x, o.p.y, 16 - 6 * Math.min(1, o.t / o.aimT), 2, "#ff4a3a", a);
        line(g, o.p.x - 22, o.p.y, o.p.x - 10, o.p.y, 2, "#ff4a3a", a); line(g, o.p.x + 10, o.p.y, o.p.x + 22, o.p.y, 2, "#ff4a3a", a);
        line(g, o.p.x, o.p.y - 22, o.p.x, o.p.y - 10, 2, "#ff4a3a", a); line(g, o.p.x, o.p.y + 10, o.p.x, o.p.y + 22, 2, "#ff4a3a", a);
      } else if (o.line) {
        const a = 1 - o.ft / 0.25;
        line(g, o.line.x1, o.line.y1, o.line.x2, o.line.y2, 7, "rgba(255,190,90,0.5)", a);
        line(g, o.line.x1, o.line.y1, o.line.x2, o.line.y2, 2.5, "#fff3c8", a);
      }
    },
  };

  /* ---------------------------------------------------------------- Borrik: Tunnel Axe (under the field, up beneath the front scale) */
  X.tunnel = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + st.count, m = this.muzzle(h);
      const list = vis.filter((e) => !e.dead).sort((a, b) => progress(this, b) - progress(this, a)).slice(0, n);
      if (!list.length) return false;
      list.forEach((e, k) => push(this, { a55: "tunnel", h, e, t: -k * 0.12, dig: 0.35, x0: m.x, y0: m.y }));
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w;
      if ((o.t += dt) < 0) return true;
      if (o.e.dead && !o.done) { const n = front(this, vis.filter((e) => !e.dead)); if (!n) return false; o.e = n; }
      if (!o.done) o.p = this.pos(o.e);
      if (o.t >= o.dig && !o.done) {
        o.done = true;
        const p = o.p;
        this.hit(h, o.e, baseOf(h) * 2);
        this.shake = Math.max(this.shake, 4);
        this.fxImg("dd/fx_hit_shock.webp", p.x, p.y, 110, 0.35, { grow: 0.5 });
        const ns = (w.shards || 5) + Math.round((h.st.size || 0) * 5) + (this.has(h, "bigaxe") ? 4 : 0);
        for (let j = 0; j < ns; j++) {
          const a = -Math.PI / 2 + (j - (ns - 1) / 2) * 0.2;
          push(this, { a55: "shard", h, x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 0.8, hits: new Set(), left: 2, rot: a });
        }
        if (this.has(h, "quakeReturn")) { for (const e of vis.filter((x) => !x.dead).sort((a, b) => progress(this, b) - progress(this, a)).slice(0, 3)) this.hit(h, e, baseOf(h) * 1.5, true); if (this.danger()) this.knock(20); }
        if (this.has(h, "avalanche")) this.c43.zones.push({ x: p.x, y: p.y, r: 30, dps: baseOf(h), t: 2, tick: 0, hero: h, col: "#c49a62", rock: true });
      }
      return o.t < o.dig + 0.3;
    },
    draw(g, o) {
      if (o.t < 0 || !o.p) return;
      const u = Math.min(1, o.t / o.dig);
      for (let k = 0; k <= 6; k++) { // dust bumps along the tunnel under the field
        const v = (k / 6) * u, x = lerp(o.x0, o.p.x, v), y = lerp(o.y0, o.p.y, v);
        halo(g, x, y, 10 + 4 * Math.sin(this.time * 20 + k), "rgba(170,130,80,0.7)", 0.55);
      }
      if (!o.done) { g.save(); g.fillStyle = "#6b4a2a"; g.beginPath(); g.ellipse(o.p.x, o.p.y + 8, 16 * u, 6 * u, 0, 0, PI2); g.fill(); g.restore(); }
    },
  };
  X.shard = {
    step(o, dt, vis) {
      o.x += o.vx * dt; o.y += o.vy * dt;
      for (const e of vis) {
        if (e.dead || o.hits.has(e) || dist(this.pos(e), o) > e.r + 6) continue;
        o.hits.add(e);
        this.hit(o.h, e, baseOf(o.h) * 0.5, true);
        if (--o.left <= 0) return false;
      }
      return (o.life -= dt) > 0 && o.y > TOP - 40;
    },
    draw(g, o) {
      if (sprite(g, a55("rock_shard"), o.x, o.y, 18, o.rot + Math.PI / 2)) return;
      g.save(); g.translate(o.x, o.y); g.rotate(o.rot + Math.PI / 2); g.fillStyle = "#a07850"; g.strokeStyle = "#3a2614"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 5); g.lineTo(-6, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
    },
  };

  /* ---------------------------------------------------------------- Finnick: Clover Mines (on the path ahead of a head) */
  X.clover = {
    fire(h, o, vis) {
      const w = h.def.w, mine = this.c43.obj.filter((x) => x.a55 === "clover" && x.h === h);
      if (mine.length >= (w.max || 6)) mine.sort((a, b) => a.life - b.life)[0].life = 0;
      const heads = [];
      this.body.forEach((e, i) => { if (!e.dead && (i === 0 || (this.body[i - 1].d || 0) !== (e.d || 0)) && e.s > this.enterOf(e)) heads.push(e); });
      const hd = heads.sort((a, b) => progress(this, b) - progress(this, a))[0];
      if (!hd) return false;
      const len = this.pathOf(hd).len, plant = (s) => { if (s < len - 12) { const q = this.at(s, hd.d); push(this, { a55: "clover", h, d: hd.d || 0, x: q.x, y: q.y, life: 10, t: 0 }); } };
      const s = hd.s + 60 + this.rnd() * 120;
      plant(s);
      if (this.has(h, "twin")) plant(s + 60);
      return true;
    },
    step(o, dt, vis) {
      o.t += dt;
      if ((o.life -= dt) <= 0) return false;
      if (o.t < 0.25) return true;
      const h = o.h;
      for (const e of vis) {
        if (e.dead || (e.d || 0) !== o.d || dist(this.pos(e), o) > e.r + 10) continue;
        const jack = this.rnd() < (this.has(h, "luckyArc") ? 1 / 3 : 1 / 5), m = jack ? 5 : 1, p = this.pos(e);
        this.beams.push({ x1: p.x + 20, y1: TOP - 60, x2: p.x, y2: p.y, w: 3.5, t: 0.3, max: 0.3, col: jack ? "#ffd84a" : "#bfe8ff", zig: true });
        this.hit(h, e, baseOf(h) * m);
        let from = e;
        const done = new Set([e]);
        for (let j = 0; j < 1 + (h.st.bounce || 0); j++) {
          const nx = this.near(from, 6, 150).find((x) => !done.has(x));
          if (!nx) break;
          done.add(nx);
          const a = this.pos(from), b2 = this.pos(nx);
          this.beams.push({ x1: a.x, y1: a.y, x2: b2.x, y2: b2.y, w: 2.5, t: 0.22, max: 0.22, col: "#ffe24a", zig: true });
          this.hit(h, nx, baseOf(h) * m * 0.6, true);
          from = nx;
        }
        if (jack && this.texts.length < 48) this.texts.push({ x: p.x, y: p.y - 30, txt: "JACKPOT", t: 0.9, max: 0.9, crit: true });
        this.fxImg("dd/fx_hit_flash.webp", p.x, p.y, 80, 0.25, { grow: 0.5 });
        return false;
      }
      return true;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.25) * Math.min(1, o.life);
      halo(g, o.x, o.y, 22, "rgba(120,255,140,0.6)", a * (0.6 + 0.3 * Math.sin(this.time * 5)));
      if (sprite(g, a55("clover"), o.x, o.y, 26, 0, a)) return;
      g.save(); g.globalAlpha *= a; g.fillStyle = "#3fbf5a"; g.strokeStyle = "#0d4a1c"; g.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) { const an = (k * Math.PI) / 2 + Math.PI / 4; g.beginPath(); g.arc(o.x + Math.cos(an) * 6, o.y + Math.sin(an) * 6, 6, 0, PI2); g.fill(); g.stroke(); }
      g.restore();
    },
  };

  /* ---------------------------------------------------------------- Sera: Holy Cross (on the front scale; burns 2 s) */
  const inCross = (q, c, L, band) => (Math.abs(q.x - c.x) < band && Math.abs(q.y - c.y) < L) || (Math.abs(q.y - c.y) < band && Math.abs(q.x - c.x) < L);
  X.cross = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, f = front(this, vis.filter((e) => !e.dead));
      if (!f) return false;
      const cs = [this.pos(f)];
      if (this.has(h, "skyfall")) for (let k = 0; k < 2; k++) { const d = this.densest(70, vis.filter((e) => cs.every((c) => dist(this.pos(e), c) > 90))); if (d) cs.push(this.pos(d)); }
      const L = (w.arm || 90) * (1 + (st.size || 0));
      for (const c of cs) {
        for (const e of vis) if (!e.dead && inCross(this.pos(e), c, L, 16 + e.r * 0.6)) this.hit(h, e, baseOf(h));
        push(this, { a55: "cross", h, x: c.x, y: c.y, L, t: 2, max: 2, tick: 0.25 });
      }
      return true;
    },
    step(o, dt, vis) {
      if ((o.tick -= dt) <= 0) { o.tick = 0.25; for (const e of vis) if (!e.dead && inCross(this.pos(e), o, o.L, 14 + e.r * 0.5)) this.hit(o.h, e, baseOf(o.h) * 0.075, true); }
      return (o.t -= dt) > 0;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.5) * (o.t > o.max - 0.15 ? 1.4 : 1);
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha *= Math.min(1, a) * 0.85;
      for (const [w2, h2] of [[16, o.L * 2], [o.L * 2, 16]]) {
        const gr = g.createLinearGradient(o.x - w2 / 2, o.y - h2 / 2, o.x + w2 / 2, o.y + h2 / 2);
        gr.addColorStop(0, "rgba(255,230,150,0)"); gr.addColorStop(0.5, "rgba(255,245,200,0.95)"); gr.addColorStop(1, "rgba(255,230,150,0)");
        g.fillStyle = gr; g.fillRect(o.x - w2 / 2, o.y - h2 / 2, w2, h2);
      }
      g.restore();
      halo(g, o.x, o.y, 34, "rgba(255,240,180,0.9)", Math.min(1, a));
    },
  };

  /* ---------------------------------------------------------------- Aldous: Holy Tide (rises from the wall to the top) */
  X.tide = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, big = this.has(h, "crusade") && (h.cnt.tide = (h.cnt.tide || 0) + 1) % 4 === 0;
      const band = (w.band || 26) * (1 + (st.size || 0)) * (big ? 2 : 1);
      push(this, { a55: "tide", h, y: this.wallY - 6, band, hits: new Set(), last: [], delay: 0 });
      if (this.has(h, "splitsaw")) push(this, { a55: "tide", h, y: this.wallY - 6, band, hits: new Set(), last: [], delay: 0.5 });
      return true;
    },
    step(o, dt, vis) {
      if (o.delay > 0) { o.delay -= dt; return true; }
      const h = o.h, w = h.def.w;
      o.y -= (w.speed || 420) * dt;
      for (const e of vis) {
        if (e.dead || o.hits.has(e)) continue;
        const q = this.pos(e);
        if (Math.abs(q.y - o.y) > o.band + e.r * 0.5) continue;
        o.hits.add(e);
        this.hit(h, e, baseOf(h) * (1 + (h.st.size || 0)), o.hits.size > 1); // Tide Height: a taller tide hits harder
        if (h.st.dur > 0 && !e.dead) this.addDot(h, e, baseOf(h) * 0.3, h.st.dur);
        if (!e.dead && e.hp < e.max * 0.15) { this.deal(h, e, e.hp + 1); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 70, 0.25, { grow: 0.6 }); } // Execute
        o.last.push(q); if (o.last.length > 3) o.last.shift();
      }
      if (o.y < TOP - 30) {
        if (this.has(h, "consecrate")) for (const q of o.last) this.c43.zones.push({ x: q.x, y: q.y, r: 40, dps: baseOf(h) * 0.6, t: 3, tick: 0, hero: h, col: "#fff0b8", judge: true });
        return false;
      }
      return true;
    },
    draw(g, o) {
      if (o.delay > 0) return;
      g.save(); g.globalCompositeOperation = "lighter";
      const gr = g.createLinearGradient(0, o.y - o.band * 1.8, 0, o.y + o.band * 1.8);
      gr.addColorStop(0, "rgba(255,200,90,0)"); gr.addColorStop(0.45, "rgba(255,230,150,0.75)"); gr.addColorStop(0.55, "rgba(255,170,60,0.75)"); gr.addColorStop(1, "rgba(255,120,30,0)");
      g.fillStyle = gr; g.fillRect(0, o.y - o.band * 1.8, this.W, o.band * 3.6);
      g.restore();
      for (let x = 10; x < this.W; x += 26) halo(g, x + 8 * Math.sin(this.time * 9 + x), o.y - o.band * 0.6, 10, "rgba(255,210,120,0.9)", 0.5);
    },
  };

  /* ---------------------------------------------------------------- Tou'lak: Thunder Totem (beside the head; zaps; thunderclaps) */
  X.totem = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, mine = this.c43.obj.filter((x) => x.a55 === "totem" && x.h === h);
      if (mine.length >= 3) mine.sort((a, b) => a.life - b.life)[0].life = 0;
      const heads = [];
      this.body.forEach((e, i) => { if (!e.dead && (i === 0 || (this.body[i - 1].d || 0) !== (e.d || 0)) && e.s > this.enterOf(e)) heads.push(e); });
      const hd = heads.sort((a, b) => progress(this, b) - progress(this, a))[0] || front(this, vis);
      if (!hd) return false;
      const p = this.pos(hd), sx = p.x < this.W / 2 ? 1 : -1;
      push(this, { a55: "totem", h, x: Math.max(24, Math.min(this.W - 24, p.x + sx * 50)), y: Math.max(TOP + 30, Math.min(this.wallY - 60, p.y + 30)), life: (w.life || 3) + (st.dur || 0), zt: 0.15, zaps: 0, t: 0 });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w, T = this.time;
      o.t += dt;
      if ((o.zt -= dt) <= 0) {
        o.zt = w.zap || 0.5;
        const reach = (w.reach || 170) * (1 + (h.st.size || 0)), top = { x: o.x, y: o.y - 34 };
        const list = vis.filter((e) => !e.dead && dist(this.pos(e), o) < reach).sort((a, b) => dist(this.pos(a), o) - dist(this.pos(b), o)).slice(0, 2 + (h.st.count || 0) + Math.round((h.st.size || 0) * 5));
        for (const e of list) { const q = this.pos(e); this.beams.push({ x1: top.x, y1: top.y, x2: q.x, y2: q.y, w: 2.5, t: 0.18, max: 0.18, col: "#ffe24a", zig: true }); this.hit(h, e, baseOf(h), true); }
        if (list.length && (h.cnt.zap = (h.cnt.zap || 0) + 1) % 8 === 0) { // Static: the thunderclap (every 8th zap of the hero)
          for (const e of vis) if (!e.dead && dist(this.pos(e), o) < 110) this.hit(h, e, baseOf(h) * 1.5, true);
          this.fx.push({ x: o.x, y: o.y - 20, vx: 0, vy: 0, t: 0.35, max: 0.35, col: "#ffe24a", ring: 110 });
          this.shake = Math.max(this.shake, 3);
          if (this.has(h, "thunderRoar")) { for (const e of vis.filter((x) => !x.dead).sort((a, b) => progress(this, b) - progress(this, a)).slice(0, 5)) this.hit(h, e, baseOf(h), true); if (this.danger() && (this.roarCd || 0) <= T) { this.knock(10); this.roarCd = T + 1; } }
        }
      }
      if ((o.life -= dt) <= 0) {
        if (this.has(h, "boom")) { for (const e of vis) if (!e.dead && dist(this.pos(e), o) < 60 + e.r) this.hit(h, e, baseOf(h) * 2, true); this.fx.push({ x: o.x, y: o.y - 10, vx: 0, vy: 0, t: 0.35, max: 0.35, col: "#ffe24a", ring: 60 }); }
        return false;
      }
      return true;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.2) * Math.min(1, o.life / 0.3);
      if (sprite(g, a55("totem"), o.x, o.y - 18, 40, 0, a)) { halo(g, o.x, o.y - 36, 22, "rgba(255,230,80,0.8)", a * (0.6 + 0.4 * Math.sin(this.time * 12))); return; }
      g.save(); g.globalAlpha *= a; g.fillStyle = "#4a3b2a"; g.strokeStyle = "#1c140c"; g.lineWidth = 2; g.fillRect(o.x - 7, o.y - 30, 14, 40); g.strokeRect(o.x - 7, o.y - 30, 14, 40); g.restore();
      halo(g, o.x, o.y - 36, 22, "rgba(255,230,80,0.85)", a * (0.6 + 0.4 * Math.sin(this.time * 12)));
      sprite(g, proj("roar"), o.x, o.y - 36, 18, 0, a);
    },
  };

  /* ---------------------------------------------------------------- Pell: Elixir Spiral (vials of her elements spin outward) */
  X.spiral = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, cs = [];
      const d0 = this.densest(80);
      if (!d0) return false;
      cs.push(this.pos(d0));
      if (this.has(h, "triple")) for (let k = 0; k < 2; k++) { const d = this.densest(70, vis.filter((e) => cs.every((c) => dist(this.pos(e), c) > 90))); if (d) cs.push(this.pos(d)); }
      const kd = this.dk(null), els = h.els.filter((x) => !(this.dImm[kd] || []).includes(x));
      const n = (w.count || 6) + 2 * (st.count || 0);
      for (const c of cs) for (let j = 0; j < n; j++) push(this, { a55: "spiral", h, cx: c.x, cy: c.y, a0: (j * PI2) / n, t: 0, life: (w.life || 1.1) + 0.3 * (st.dur || 0), el: els[j % els.length] || h.hitEl, hits: new Set(), r: 12 * (1 + (st.size || 0)), x: c.x, y: c.y });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, T = this.time;
      o.t += dt;
      const rr = 10 + 150 * o.t, an = o.a0 + 3.2 * o.t;
      o.x = o.cx + Math.cos(an) * rr; o.y = o.cy + Math.sin(an) * rr * 0.8;
      for (const e of vis) {
        if (e.dead || o.hits.has(e) || dist(this.pos(e), o) > e.r + o.r) continue;
        o.hits.add(e);
        const had = e.st && e.stT > T, el0 = h._el, brew = this.has(h, "mixedBrew");
        h._el = o.el;
        if (brew) this.mods.react = (this.mods.react || 0) + 0.5;
        this.hit(h, e, baseOf(h), true);
        if (brew) this.mods.react -= 0.5;
        h._el = el0;
        if (had && !(e.st && e.stT > T) && this.has(h, "reactionCloud")) for (const n of this.neighbours(e)) this.hit(h, n, baseOf(h) * 0.6, true);
      }
      return o.t < o.life && o.y > TOP - 40 && o.y < this.fieldBottom + 20;
    },
    draw(g, o) {
      const col = (DD.EL_COL && DD.EL_COL[o.el]) || "#c46ae8";
      halo(g, o.x, o.y, o.r * 1.8, col, 0.8);
      if (!sprite(g, a55("vial_" + o.el), o.x, o.y, o.r * 2.2, o.t * 8)) sprite(g, proj("flask"), o.x, o.y, o.r * 1.8, o.t * 8);
    },
  };

  /* ---------------------------------------------------------------- Loeg: Elder Flight (a figure-eight; breath plants seeds) */
  X.flight = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = 1 + (st.count || 0) + (this.has(h, "twin") ? 1 : 0);
      for (let k = 0; k < n; k++) push(this, { a55: "flight", h, t: 0, life: (w.life || 8) + (st.dur || 0), ph: (k * Math.PI) / Math.max(1, n), bt: 0.2, x: this.W / 2, y: TOP + 40, ang: 0 });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w, T = this.time;
      o.t += dt;
      const cx = this.W / 2, cy = TOP + (this.fieldBottom - TOP) * 0.42, A = this.W * 0.38, B = (this.fieldBottom - TOP) * 0.3;
      const u = (o.t * PI2) / 4.5 + o.ph, nx = cx + A * Math.sin(u), ny = cy + (B * Math.sin(2 * u)) / 2;
      o.ang = Math.atan2(ny - o.y, nx - o.x); o.x = nx; o.y = ny;
      if ((o.bt -= dt) <= 0) {
        o.bt = (w.breath || 0.3) / (1 + (h.st.rate || 0));
        for (const e of vis) if (!e.dead && dist(this.pos(e), { x: o.x, y: o.y + 18 }) < 46 + e.r * 0.5) { this.hit(h, e, baseOf(h), true); if (!(e.seedT > T)) { e.seedT = T + 2; e.seedH = h; } }
      }
      return o.t < o.life;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.4) * Math.min(1, (o.life - o.t) / 0.5);
      halo(g, o.x, o.y + 14, 40, "rgba(140,255,160,0.55)", a * 0.7);
      if (!sprite(g, a55("elder_spirit"), o.x, o.y, 110, o.ang + Math.PI / 2, a * 0.92)) sprite(g, evo("elder"), o.x, o.y, 110, o.ang, a * 0.85);
    },
  };

  /* ---------------------------------------------------------------- Dace: Hawk Dive (a U-shaped dive from above) */
  X.dive = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + (st.count || 0);
      const list = toughest(this.upperVis(0.75).filter((e) => !e.dead), n);
      if (!list.length) return false;
      list.forEach((e, k) => { const a = this.time * 1.3 + k * 2; push(this, { a55: "dive", h, e, t: -k * 0.1, dur: 0.6, sx: this.W / 2 + Math.cos(a) * 130, sy: TOP - 20 }); });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w;
      if ((o.t += dt) < 0) return true;
      if (o.e.dead && !o.hit) { const n = toughest(vis.filter((e) => !e.dead), 1)[0]; if (!n) return false; o.e = n; }
      const u = Math.min(1, o.t / o.dur);
      if (!o.hit) o.p = this.pos(o.e);
      const ex = o.sx + (o.sx < this.W / 2 ? 150 : -150), x = (1 - u) * (1 - u) * o.sx + 2 * u * (1 - u) * o.p.x * 1 + u * u * ex;
      const y = (1 - u) * (1 - u) * o.sy + 2 * u * (1 - u) * (o.p.y * 2 - o.sy) * 0.5 + u * u * o.sy;
      o.ang = Math.atan2(y - (o.y || y), x - (o.x || x)); o.x = x; o.y = y;
      if (u >= 0.5 && !o.hit) {
        o.hit = true;
        const reach = 1 + (w.pierce || 0) + (h.st.pierce || 0) + (this.has(h, "split") ? 2 : 0), i = this.body.indexOf(o.e);
        this.hit(h, o.e, baseOf(h));
        for (let k = 1; k <= reach; k++) { const x2 = this.body[i + k]; if (x2 && !x2.dead && (x2.d || 0) === (o.e.d || 0)) this.hit(h, x2, baseOf(h), true); }
        this.fxImg("dd/fx_hit_flash.webp", o.p.x, o.p.y, 70, 0.22, { grow: 0.5 });
      }
      return u < 1;
    },
    draw(g, o) {
      if (o.t < 0 || o.x === undefined) return;
      if (!sprite(g, a55("hawk"), o.x, o.y, 48, o.ang + Math.PI / 2) && !sprite(g, evo("hawk"), o.x, o.y, 54, o.ang + Math.PI / 2)) {
        g.save(); g.translate(o.x, o.y); g.rotate(o.ang); g.fillStyle = "#6b4a2a"; g.beginPath(); g.moveTo(14, 0); g.lineTo(-10, -14); g.lineTo(-4, 0); g.lineTo(-10, 14); g.closePath(); g.fill(); g.restore();
      }
    },
  };

  /* ---------------------------------------------------------------- Klaus: Gift Fireworks (straight up, burst into stars) */
  X.fireworks = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + (st.count || 0) + (this.has(h, "triple") ? 2 : 0), m = this.muzzle(h);
      const d = this.densest(70);
      if (!d) return false;
      const c = this.pos(d);
      for (let k = 0; k < n; k++) {
        const big = this.has(h, "surpriseBox") && (h.cnt.gift = (h.cnt.gift || 0) + 1) % 6 === 0;
        push(this, { a55: "fireworks", h, x0: m.x + (k - (n - 1) / 2) * 14, y0: m.y - 16, tx: c.x + (this.rnd() - 0.5) * 70 * (k ? 1 : 0), ty: c.y + (this.rnd() - 0.5) * 50 * (k ? 1 : 0), t: -k * 0.12, fly: 0.55, big, x: m.x, y: m.y });
      }
      return true;
    },
    step(o, dt, vis) {
      if ((o.t += dt) < 0) return true;
      const u = Math.min(1, o.t / o.fly);
      o.x = lerp(o.x0, o.tx, u * u); o.y = lerp(o.y0, o.ty, 1 - (1 - u) * (1 - u));
      if (u < 1) return true;
      X.fireworks.burst.call(this, o.h, o.x, o.y, o.big ? 4 : 1, o.big ? 88 : 0);
      if (this.has(o.h, "secondBurst")) { const x = o.x, y = o.y; this.later(1, () => X.fireworks.burst.call(this, o.h, x, y, 0.6, 0)); }
      return false;
    },
    burst(h, x, y, mult, rad) {
      const w = h.def.w, R = rad || (w.radius || 40) * (1 + (h.st.size || 0)), r = this.rnd();
      let m = mult;
      if (r < 1 / 3) { this.coins += 2; if (this.texts.length < 48) this.texts.push({ x, y: y - 24, txt: "+2", t: 0.7, max: 0.7 }); }
      else if (r < 2 / 3) m *= 2;
      else this.frozen = Math.max(this.frozen, 0.2);
      for (const e of this.visible()) if (!e.dead && dist(this.pos(e), { x, y }) < R + e.r * 0.5) this.hit(h, e, baseOf(h) * m, true);
      const cols = ["#ff5a5a", "#ffd84a", "#7fd45a", "#5ab4ff", "#ffffff"];
      for (let k = 0; k < 10; k++) { const a = (k * PI2) / 10; this.fx.push({ x, y, vx: Math.cos(a) * R * 3, vy: Math.sin(a) * R * 3, t: 0.4, max: 0.4, col: cols[k % cols.length], size: 3.5 }); }
      this.fx.push({ x, y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#fff3c8", ring: R });
      if ((h.st.dur || 0) > 0) for (const e of this.visible()) if (!e.dead && dist(this.pos(e), { x, y }) < R) this.addDot(h, e, baseOf(h) * 0.2, h.st.dur);
    },
    draw(g, o) {
      if (o.t < 0) return;
      halo(g, o.x, o.y + 10, 12, "rgba(255,200,120,0.8)", 0.7);
      if (!sprite(g, a55("gift_rocket"), o.x, o.y, o.big ? 34 : 24)) sprite(g, proj("gift"), o.x, o.y, o.big ? 30 : 20);
    },
  };

  /* ---------------------------------------------------------------- Hobb: Glyph Triangle (links of light; Petrify inside) */
  const inTri = (p, a, b, c) => {
    const s = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  X.glyphs = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + (st.count || 0), live = vis.filter((e) => !e.dead).sort((a, b) => progress(this, b) - progress(this, a));
      if (!live.length) return false;
      const R = (w.r || 90) * (1 + (st.size || 0)) * (this.has(h, "bigaxe") ? 2 : 1);
      for (let k = 0; k < n; k++) {
        const e = live[Math.floor(((k + 1) / (n + 1)) * live.length)] || live[0], c = this.pos(e), rot = this.rnd() * PI2;
        const pts = [0, 1, 2].map((j) => ({ x: Math.max(14, Math.min(this.W - 14, c.x + Math.cos(rot + (j * PI2) / 3) * R)), y: Math.max(TOP, Math.min(this.fieldBottom, c.y + Math.sin(rot + (j * PI2) / 3) * R * 0.8)) }));
        push(this, { a55: "glyphs", h, pts, life: (w.life || 3) + (st.dur || 0), t: 0, tick: 0.1 });
      }
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, T = this.time, [a, b, c] = o.pts;
      o.t += dt;
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.25;
        for (const e of vis) {
          if (e.dead) continue;
          const q = this.pos(e), on = Math.min(segD(q.x, q.y, a.x, a.y, b.x, b.y), segD(q.x, q.y, b.x, b.y, c.x, c.y), segD(q.x, q.y, c.x, c.y, a.x, a.y)) < e.r * 0.6 + 6;
          const inside = inTri(q, a, b, c);
          if (on || inside) {
            this.hit(h, e, baseOf(h) * (on ? 1 : 0.4), true);
            if ((e.discN = (e.discN || 0) + 1) >= 5) { e.discN = 0; e.stoneT = T + 2; } // Petrify
          }
        }
      }
      if ((o.life -= dt) <= 0) {
        if (this.has(h, "relicShards")) for (const p of o.pts) { for (const e of vis) if (!e.dead && dist(this.pos(e), p) < 50 + e.r) this.hit(h, e, baseOf(h) * 1.5, true); this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#e8c27a", ring: 50 }); }
        return false;
      }
      return true;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.25) * Math.min(1, o.life / 0.3), [p, q, r] = o.pts;
      g.save(); g.globalAlpha *= a * 0.22; g.fillStyle = "#e8c27a"; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.lineTo(r.x, r.y); g.closePath(); g.fill(); g.restore();
      for (const [u, v] of [[p, q], [q, r], [r, p]]) { line(g, u.x, u.y, v.x, v.y, 6, "rgba(255,210,120,0.45)", a); line(g, u.x, u.y, v.x, v.y, 2, "#fff0c0", a); }
      for (const s of o.pts) { halo(g, s.x, s.y, 20, "rgba(255,200,110,0.8)", a); if (!sprite(g, a55("glyph"), s.x, s.y, 26, 0, a)) { g.save(); g.globalAlpha *= a; g.fillStyle = "#6b5a44"; g.strokeStyle = "#ffe1a0"; g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, 9, 0, PI2); g.fill(); g.stroke(); g.restore(); } }
    },
  };

  /* ---------------------------------------------------------------- Tristan: Ember Rose (blades trace a rose; 3 hits → embers) */
  X.rose = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = 1 + (st.count || 0), list = toughest(vis, n);
      if (!list.length) return false;
      for (const e of list) {
        const cnt = (h.cnt.rose = (h.cnt.rose || 0) + 1), p = this.pos(e);
        push(this, { a55: "rose", h, e, c: p, t: 0, dur: 0.8, R: w.R || 80, petals: (w.petals || 4) * (this.has(h, "double") ? 2 : 1), hits: new Map(), tz: 0, pts: [] });
        if (this.has(h, "tornado") && cnt % 5 === 0) this.c43.obj.push({ type: "tornado", h, x: p.x, y: p.y + 30, life: 2, tick: 0, r: 34 });
      }
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, T = this.time;
      o.t += dt;
      if (!o.e.dead) o.c = this.pos(o.e);
      o.pts = [];
      for (let k = 0; k < o.petals; k++) {
        const th = (o.t / o.dur) * Math.PI + (k * Math.PI) / o.petals, r = o.R * Math.sin(2 * th);
        o.pts.push({ x: o.c.x + Math.cos(th) * r, y: o.c.y + Math.sin(th) * r * 0.85, a: th });
      }
      for (const pt of o.pts) for (const e of vis) {
        if (e.dead || dist(this.pos(e), pt) > e.r + 10 || (o.hits.get(e) || -9) > o.t - 0.15) continue;
        o.hits.set(e, o.t);
        this.hit(h, e, baseOf(h), true);
        if (!e.dead && (e.ember = (e.ember || 0) + 1) >= 3) { // Embers
          e.ember = 0;
          const q = this.pos(e);
          for (const x of vis) if (!x.dead && dist(this.pos(x), q) < 40 + x.r * 0.5) this.hit(h, x, baseOf(h) * 1.5, true);
          this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 80, 0.25, { grow: 0.5 });
          this.burst(q.x, q.y, "#ff8a3a", 10);
        }
      }
      if (this.has(h, "fireLine") && (o.tz -= dt) <= 0 && this.c43.zones.length < 40) { o.tz = 0.12; for (const pt of o.pts) this.c43.zones.push({ x: pt.x, y: pt.y, r: 12, dps: baseOf(h) * 0.4, t: 2, tick: 0, hero: h, col: "#ff8a3a" }); }
      return o.t < o.dur;
    },
    draw(g, o) {
      for (const pt of o.pts) {
        halo(g, pt.x, pt.y, 18, "rgba(255,140,50,0.85)", 0.7);
        if (!sprite(g, a55("ember_blade"), pt.x, pt.y, 30, pt.a + Math.PI / 2)) sprite(g, proj("slash"), pt.x, pt.y, 26, pt.a);
      }
    },
  };

  /* ---------------------------------------------------------------- Bertrand: Binding Contract (chains from the top corners; Soul Link) */
  X.chains = {
    fire(h, o, vis) {
      const w = h.def.w, n = this.has(h, "murder") ? 5 : w.binds || 3, list = toughest(vis, n);
      if (!list.length) return false;
      const gid = (this.linkG = (this.linkG || 0) + 1), T = this.time;
      for (const e of list) { this.hit(h, e, baseOf(h)); e.linkT = T + (w.t || 3); e.linkG = gid; e.linkH = h; }
      push(this, { a55: "chains", h, es: list, t: 0, life: w.t || 3, gid });
      return true;
    },
    step(o, dt) { return (o.t += dt) < o.life && o.es.some((e) => !e.dead); },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.15) * Math.min(1, (o.life - o.t) / 0.3), reach = Math.min(1, o.t / 0.18);
      o.es.forEach((e, k) => {
        if (e.dead) return;
        const p = this.pos(e), s = { x: k % 2 ? this.W + 10 : -10, y: TOP - 50 }, x2 = lerp(s.x, p.x, reach), y2 = lerp(s.y, p.y, reach);
        line(g, s.x, s.y, x2, y2, 6, "rgba(90,40,120,0.85)", a);
        const L = Math.hypot(x2 - s.x, y2 - s.y), an = Math.atan2(y2 - s.y, x2 - s.x);
        g.save(); g.globalAlpha *= a; g.strokeStyle = "#c9a4ff"; g.lineWidth = 1.5;
        for (let d = 0; d < L; d += 12) { g.beginPath(); g.ellipse(s.x + Math.cos(an) * d, s.y + Math.sin(an) * d, 5, 3, an + (d / 12) % 2 * Math.PI / 2, 0, PI2); g.stroke(); }
        g.restore();
        ring(g, p.x, p.y, e.r * 0.9, 2.5, "#b07aff", a * (0.6 + 0.4 * Math.sin(this.time * 10)));
      });
    },
  };

  /* ---------------------------------------------------------------- Szopin: Void Rift (black hole; closer = harder) */
  X.rift = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 1) + (st.count || 0), cs = [];
      for (let k = 0; k < n; k++) { const d = this.densest(80, k ? vis.filter((e) => cs.every((c) => dist(this.pos(e), c) > 100)) : undefined); if (d) cs.push(this.pos(d)); }
      if (!cs.length) return false;
      for (const c of cs) push(this, { a55: "rift", h, x: c.x, y: c.y, life: (w.life || 2) + (st.dur || 0), t: 0, tick: 0.05, hook: 0.5, R: (w.r || 70) * (1 + (st.size || 0)) });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h;
      o.t += dt;
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.2;
        for (const e of vis) { if (e.dead) continue; const d = dist(this.pos(e), o); if (d < o.R + e.r * 0.5) this.hit(h, e, baseOf(h) * (1 + (1 - Math.min(1, d / o.R))), true); }
      }
      if (this.has(h, "chainHook") && (o.hook -= dt) <= 0) {
        o.hook = 0.4;
        const t = vis.filter((e) => !e.dead && dist(this.pos(e), o) > o.R).sort((a, b) => dist(this.pos(a), o) - dist(this.pos(b), o))[0];
        if (t) { const q = this.pos(t); this.beams.push({ x1: o.x, y1: o.y, x2: q.x, y2: q.y, w: 3, t: 0.2, max: 0.2, col: "#7a3ab0" }); this.hit(h, t, baseOf(h), true); }
      }
      if ((o.life -= dt) <= 0) {
        if (this.has(h, "boom")) { for (const e of vis) if (!e.dead && dist(this.pos(e), o) < o.R + e.r) this.hit(h, e, baseOf(h) * 2, true); this.fx.push({ x: o.x, y: o.y, vx: 0, vy: 0, t: 0.4, max: 0.4, col: "#b07aff", ring: o.R }); }
        return false;
      }
      return true;
    },
    draw(g, o) {
      const a = Math.min(1, o.t / 0.25) * Math.min(1, o.life / 0.3), R = o.R;
      const im = a55("void_rift").complete && a55("void_rift").naturalWidth ? a55("void_rift") : img("2a/fx/portal_soft.webp");
      g.save(); g.globalAlpha *= a; g.translate(o.x, o.y); g.rotate(-this.time * 2.5);
      if (ready(im)) g.drawImage(im, -R, -R, R * 2, R * 2);
      g.restore();
      g.save(); g.globalAlpha *= a;
      const gr = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, R * 0.6);
      gr.addColorStop(0, "rgba(0,0,0,0.95)"); gr.addColorStop(0.7, "rgba(20,0,30,0.7)"); gr.addColorStop(1, "rgba(20,0,30,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(o.x, o.y, R * 0.6, 0, PI2); g.fill(); g.restore();
      for (let k = 0; k < 6; k++) { const an = this.time * 3 + k, rr = R * (1 - ((this.time * 1.5 + k / 6) % 1)); halo(g, o.x + Math.cos(an) * rr, o.y + Math.sin(an) * rr, 6, "rgba(190,120,255,0.9)", a * 0.8); }
    },
  };

  /* ---------------------------------------------------------------- Granny: Time Sigils (replay half the damage taken meanwhile) */
  X.sigil = {
    fire(h, o, vis) {
      const w = h.def.w, n = this.has(h, "skyfall") ? 6 : w.n || 3, T = this.time, d = this.densest(90);
      if (!d) return false;
      const c = this.pos(d), list = vis.filter((e) => !e.dead && !(e.sigilT > T)).sort((a, b) => dist(this.pos(a), c) - dist(this.pos(b), c)).slice(0, n);
      if (!list.length) return false;
      for (const e of list) { e.sigilT = T + (w.delay || 1.5); e.sigilSum = 0; this.hit(h, e, baseOf(h), true); push(this, { a55: "sigil", h, e, t: 0, delay: w.delay || 1.5 }); }
      return true;
    },
    step(o, dt) {
      const e = o.e;
      if (e.dead) return false;
      if ((o.t += dt) < o.delay) return true;
      const sum = e.sigilSum || 0;
      e.sigilT = 0; e.sigilSum = 0;
      if (sum > 0) { this.deal(o.h, e, sum * 0.5 * (1 + (o.h.st.size || 0))); const p = this.pos(e); if (this.texts.length < 48) this.texts.push({ x: p.x, y: p.y - 18, txt: DD.fmt(sum * 0.5 * (1 + (o.h.st.size || 0))), t: 0.8, max: 0.8, crit: true }); this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#bfe8ff", ring: 34 }); }
      return false;
    },
    draw(g, o) {
      if (o.e.dead) return;
      const p = this.pos(o.e), k = o.t / o.delay;
      if (!sprite(g, a55("clock_sigil"), p.x, p.y, 44, 0, 0.9)) {
        ring(g, p.x, p.y, 18, 2, "#ffe7a0", 0.9);
        for (let j = 0; j < 12; j++) { const an = (j * PI2) / 12; line(g, p.x + Math.cos(an) * 14, p.y + Math.sin(an) * 14, p.x + Math.cos(an) * 18, p.y + Math.sin(an) * 18, 1.5, "#ffe7a0", 0.9); }
      }
      const an = -Math.PI / 2 + k * PI2;
      line(g, p.x, p.y, p.x + Math.cos(an) * 14, p.y + Math.sin(an) * 14, 2.5, "#bfe8ff", 1);
      halo(g, p.x, p.y, 26, "rgba(170,220,255,0.6)", 0.5 + 0.4 * k);
    },
  };

  /* ---------------------------------------------------------------- Rusk: Frost Cyclone (climbs up his lane; Shred) */
  X.cyclone = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, m = this.muzzle(h), n = (w.count || 1) + (st.count || 0);
      for (let k = 0; k < n; k++) push(this, { a55: "cyclone", h, x: m.x + (k - (n - 1) / 2) * 40, y: m.y - 10, vx: 0, r: (w.r || 26) * (1 + (st.size || 0)), age: 0, life: (w.life || 2.2) + (st.dur || 0), tick: 0, split: this.has(h, "splitsaw") });
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w, T = this.time;
      o.age += dt; o.y -= ((w.speed || 200) / (1 + 0.35 * (h.st.dur || 0))) * dt; o.x += o.vx * dt; o.r *= 1 + 0.25 * dt;
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.2;
        let any = false;
        for (const e of vis) {
          if (e.dead || dist(this.pos(e), o) > o.r + e.r * 0.5) continue;
          any = true;
          if (!(e.shredT > T)) e.shred = 0;
          e.shred = Math.min(10, (e.shred || 0) + 1); e.shredT = T + 2;
          this.hit(h, e, baseOf(h) * (1 + 0.05 * e.shred) * (this.has(h, "berserk") ? 1 + Math.min(1, 0.1 * o.age) : 1), true);
        }
        if (any && o.split && !o.didSplit) { o.didSplit = true; for (const s of [-1, 1]) push(this, { a55: "cyclone", h, x: o.x, y: o.y, vx: s * 90, r: o.r * 0.7, age: 0, life: o.life - o.age, tick: 0.1, split: false }); }
      }
      return o.age < o.life && o.y > TOP - 40;
    },
    draw(g, o) {
      const a = Math.min(1, o.age / 0.2) * Math.min(1, (o.life - o.age) / 0.3);
      halo(g, o.x, o.y, o.r * 1.4, "rgba(170,230,255,0.6)", a * 0.7);
      if (sprite(g, a55("frost_cyclone"), o.x, o.y, o.r * 2.6, Math.sin(this.time * 6) * 0.15, a)) return;
      g.save(); g.globalAlpha *= a; g.strokeStyle = "rgba(220,245,255,0.9)";
      for (let k = 0; k < 4; k++) { g.lineWidth = 3 - k * 0.5; g.beginPath(); g.ellipse(o.x, o.y - k * o.r * 0.25, o.r * (1 - k * 0.18), o.r * 0.35, 0, this.time * 8 + k, this.time * 8 + k + 4.4); g.stroke(); }
      g.restore();
    },
  };

  /* ---------------------------------------------------------------- Dreamwalker: Nightmare Bloom (Sleep; tendrils from inside) */
  X.nightmare = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 3) + (st.count || 0), T = this.time;
      const pool = this.upperVis(0.9).filter((e) => !e.dead && !(e.sleepT > T)), list = [];
      while (list.length < n && pool.length) list.push(pool.splice(Math.floor(this.rnd() * pool.length), 1)[0]);
      if (!list.length) return false;
      const deep = this.has(h, "widejet"), t = ((w.t || 2) + (st.dur || 0)) * (deep ? 2 : 1);
      for (const e of list) { this.hit(h, e, baseOf(h)); e.sleepT = T + t; if (deep) e.deepT = T + t; push(this, { a55: "nightmare", h, e, t: 0, lines: null }); }
      return true;
    },
    step(o, dt) {
      const h = o.h;
      o.t += dt;
      if (o.t >= 1 && !o.lines) {
        o.lines = [];
        if (!o.e.dead) {
          const i = this.body.indexOf(o.e), reach = 1 + (this.has(h, "nightmare") ? 1 : 0) + Math.round((h.st.size || 0) * 2.5), p = this.pos(o.e);
          for (let k = 1; k <= reach; k++) for (const j of [i - k, i + k]) {
            const x = this.body[j];
            if (!x || x.dead || (x.d || 0) !== (o.e.d || 0) || x.s <= this.enterOf(x)) continue;
            this.hit(h, x, baseOf(h) * 0.6, true);
            o.lines.push({ a: p, b: this.pos(x) });
          }
        }
      }
      return o.t < 1.45;
    },
    draw(g, o) {
      if (o.e.dead && !o.lines) return;
      const p = o.e.dead ? null : this.pos(o.e);
      if (p && !o.lines) for (let k = 0; k < 3; k++) { const an = this.time * 4 + (k * PI2) / 3; halo(g, p.x + Math.cos(an) * 16, p.y + Math.sin(an) * 12, 8, "rgba(160,110,255,0.9)", 0.8); }
      if (o.lines) {
        const a = Math.max(0, 1 - (o.t - 1) / 0.45);
        for (const l of o.lines) {
          g.save(); g.globalAlpha *= a; g.strokeStyle = "#7a4ad0"; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(l.a.x, l.a.y);
          const mx = (l.a.x + l.b.x) / 2 + Math.sin(this.time * 20) * 10, my = (l.a.y + l.b.y) / 2 + Math.cos(this.time * 17) * 10;
          g.quadraticCurveTo(mx, my, l.b.x, l.b.y); g.stroke(); g.strokeStyle = "#d8c4ff"; g.lineWidth = 1.5; g.stroke(); g.restore();
        }
      }
      if (p && !sprite(g, a55("nightmare"), p.x, p.y - 4, 40, 0, 0.85)) halo(g, p.x, p.y, 24, "rgba(110,60,200,0.7)", 0.6);
    },
  };

  /* ---------------------------------------------------------------- Dragon Kael: Dragonfall (a meteor shower; burning craters) */
  /* ---------------------------------------------------------------- Ysmay: Backdraft (the dragon's own fire, from its head back along its body) */
  // C55 (user no. 118: no line sweeping left and right; Ysmay's old flame swept 120° to and fro): she turns the dragon's fire
  // against it. A cone of flame pours out of the head nearest the wall back along its own body; the head is never burnt by it.
  const headsOf = (b) => { const hs = []; b.body.forEach((e, i) => { if (!e.dead && (i === 0 || (b.body[i - 1].d || 0) !== (e.d || 0)) && e.s > b.enterOf(e)) hs.push(e); }); return hs; };
  const angGap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  X.backdraft = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st;
      const hs = headsOf(this).sort((a, b) => progress(this, b) - progress(this, a));
      const busy = new Set(this.c43.obj.filter((x) => x.a55 === "backdraft" && x.h === h).map((x) => x.e));
      const hd = hs.find((e) => !busy.has(e)) || hs[0];
      if (!hd) return false;
      const dur = (w.dur || 2.2) + (st.dur || 0), i = this.body.indexOf(hd);
      push(this, { a55: "backdraft", h, e: hd, head: true, t: dur, dur, tick: 0, emit: 0, a: null, o: null, ang: 0 });
      // Dragon Fury (Evo): two more cones pour back along the body from the 6th and the 12th scale behind the head
      if (this.has(h, "triple")) for (const k of [6, 12]) { const x = this.body[i + k]; if (x && !x.dead && (x.d || 0) === (hd.d || 0)) push(this, { a55: "backdraft", h, e: x, t: dur, dur, tick: 0.05, emit: 0, a: null, o: null, ang: 0 }); }
      return true;
    },
    step(o, dt, vis) {
      const h = o.h, w = h.def.w, st = h.st;
      if (o.e.dead || (o.t -= dt) <= 0) return false;
      const i = this.body.indexOf(o.e), p = this.pos(o.e);
      // the cone points from the head back along its own body (toward the 4th scale behind it), turning smoothly with it
      let back = null;
      for (let k = 4; k >= 1 && !back; k--) { const x = this.body[i + k]; if (x && !x.dead && (x.d || 0) === (o.e.d || 0) && x.s > this.enterOf(x)) back = x; } // only scales already out of the portal
      if (!back && o.a === null) return true; // nothing of its body is out yet: the fire waits in its mouth
      const q = back ? this.pos(back) : { x: p.x + Math.cos(o.a) * 100, y: p.y + Math.sin(o.a) * 100 }, want = Math.atan2(q.y - p.y, q.x - p.x);
      o.a = o.a === null ? want : o.a + Math.atan2(Math.sin(want - o.a), Math.cos(want - o.a)) * Math.min(1, dt * 8);
      o.o = p; o.ang = o.a;
      const len = (w.len || 230) * (1 + 0.5 * (st.size || 0)), half = (w.angle || 0.4) * (1 + (st.size || 0));
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.1;
        for (const e of vis) {
          if (e.dead || e === o.e || e.type === "head") continue; // its own fire never burns a head
          const r = this.pos(e), L = Math.hypot(r.x - p.x, r.y - p.y);
          if (L > len + e.r * 0.5) continue;
          const an = Math.atan2(r.y - p.y, r.x - p.x), pad = Math.atan2(e.r * 0.5, Math.max(1, L));
          if (angGap(an, o.a) < half + pad) this.hit(h, e, (w.dps || 19) * 0.1, true);
        }
      }
      // the fire on screen: puffs leave the mouth and billow back along the live cone (they ride it as the dragon moves)
      o.emit += dt * 44;
      while (o.emit >= 1) {
        o.emit--;
        if (this.fx.length >= 300) { o.emit = 0; break; }
        const off = (this.rnd() * 2 - 1) * half * 0.85, sp = 300 + this.rnd() * 160, life = ((len - 10) / sp) * (0.75 + this.rnd() * 0.25);
        this.fx.push({ img: this.rnd() < 0.55 ? "dd/fx_hit_fire_l.webp" : "dd/fx_hit_fire_s.webp", x: p.x, y: p.y, vx: 0, vy: 0,
          wv: o, off, u: 10, sp, size: 22, grow: 2.8, t: life, max: life, rot: this.rnd() * 6, spin: (this.rnd() - 0.5) * 5, add: true, flow: true });
      }
      return true;
    },
    draw(g, o) {
      if (o.e.dead || o.a === null) return;
      const p = this.pos(o.e), k = Math.max(0, Math.min(1, (o.dur - o.t) / 0.2, o.t / 0.3));
      // Ysmay's hold on the dragon's fire: two burning rings turning around the head, and the glow of the mouth it pours from
      const s = o.head ? 1 : 0.65;
      ring(g, p.x, p.y, 30 * s, 2.5, "#ffb347", 0.8 * k, this.time * 3, this.time * 3 + Math.PI * 1.4);
      ring(g, p.x, p.y, 37 * s, 1.5, "#ff6a2a", 0.55 * k, -this.time * 2, -this.time * 2 + Math.PI);
      halo(g, p.x + Math.cos(o.a) * 16, p.y + Math.sin(o.a) * 16, 48, "rgba(255,150,40,0.85)", 0.7 * k);
    },
  };

  X.meteor = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = (w.count || 3) + (st.count || 0), d = this.densest(70);
      if (!d) return false;
      const c = this.pos(d), r = (w.r || 34) + 12 * ((st.pierce || 0) + (w.pierce || 0));
      for (let k = 0; k < n; k++) {
        const an = this.rnd() * PI2, rr = k ? 20 + this.rnd() * 45 : 0;
        push(this, { a55: "meteor", h, tx: c.x + Math.cos(an) * rr, ty: c.y + Math.sin(an) * rr * 0.8, t: 0, fall: 0.35 + k * 0.07, r, mult: 1 });
      }
      return true;
    },
    step(o, dt, vis) {
      const h = o.h;
      o.t += dt;
      if (o.t >= o.fall && !o.done) {
        o.done = true;
        for (const e of vis) if (!e.dead && dist(this.pos(e), { x: o.tx, y: o.ty }) < o.r + e.r * 0.5) this.hit(h, e, baseOf(h) * o.mult, true);
        if (o.mult >= 1) this.c43.zones.push({ x: o.tx, y: o.ty, r: o.r * 0.8, dps: baseOf(h) * 0.3, t: 1.5, tick: 0, hero: h, col: "#ff6a2a", lava: true });
        this.fxImg("dd/fx_hit_shock.webp", o.tx, o.ty, o.r * 3, 0.3, { grow: 0.5 });
        this.shake = Math.max(this.shake, o.mult >= 1 ? 4 : 2);
        if (this.has(h, "split") && o.mult >= 1) for (let k = 0; k < 3; k++) { const an = (k * PI2) / 3; push(this, { a55: "meteor", h, tx: o.tx + Math.cos(an) * 40, ty: o.ty + Math.sin(an) * 32, t: 0.2, fall: 0.35, r: o.r * 0.6, mult: 0.5 }); }
      }
      return o.t < o.fall + 0.05;
    },
    draw(g, o) {
      if (o.done) return;
      const u = Math.min(1, o.t / o.fall), x = lerp(o.tx + 150, o.tx, u), y = lerp(o.ty - 420, o.ty, u), s = o.mult >= 1 ? 1 : 0.6;
      halo(g, x, y, 30 * s, "rgba(255,140,40,0.9)", 0.8);
      if (!sprite(g, a55("dragon_meteor"), x, y, 52 * s, 0) && !sprite(g, evo("meteor"), x, y, 50 * s, Math.atan2(420, -150))) halo(g, x, y, 14 * s, "#ffd0a0", 1);
      ring(g, o.tx, o.ty, o.r * (0.4 + 0.6 * u), 2, "rgba(255,120,40,0.8)", 0.5 * u);
    },
  };

  /* ---------------------------------------------------------------- shared rules the new attacks bring */
  // Soul Link (Bertrand) and the Time Sigils (Granny) watch every hit and every tick of damage
  const watch = (b, e, dealt) => {
    if (dealt <= 0) return;
    const T = b.time;
    if (e.sigilT > T) e.sigilSum = (e.sigilSum || 0) + dealt;
    if (e.linkT > T && !b._linking) {
      b._linking = true;
      for (const x of b.body) if (x !== e && !x.dead && x.linkG === e.linkG && x.linkT > T) b.deal(e.linkH, x, dealt * 0.3);
      b._linking = false;
    }
  };
  P.hit = function (h, e, base, quiet) {
    const hp0 = e.dead ? 0 : e.hp, r = BP.hit.call(this, h, e, base, quiet);
    if (hp0 > 0) watch(this, e, e.dead ? hp0 : hp0 - e.hp);
    return r;
  };
  P.deal = function (h, e, d) {
    const hp0 = e.dead ? 0 : e.hp, r = BP.deal.call(this, h, e, d);
    if (hp0 > 0) watch(this, e, e.dead ? hp0 : hp0 - e.hp);
    return r;
  };
  // Deep Sleep (Dreamwalker): sleeping scales take +20% from every hero
  P.dmgOf = function (h, base, e) {
    const r = BP.dmgOf.call(this, h, base, e);
    if (e && e.deepT > this.time && e.sleepT > this.time) r.d *= 1.2;
    if (e && e.stoneT > this.time && this.anyHas("petrify")) { const el = this.elOf(h, e).el; if (el === "physical" || el === "rock") r.d *= 1.5; } // Petrify Evo: ×3 in all
    return r;
  };
  // War Drums (Tou'lak): while 2 or more of his totems stand, every hero attacks 20% faster
  P.rateOf = function (h) {
    let r = BP.rateOf.call(this, h);
    if (this.c43 && this.c43.obj.filter((x) => x.a55 === "totem" && this.has(x.h, "warDrums")).length >= 2) r *= 1.2;
    return r;
  };
  // Seeds (Loeg): bloom 2 s after the breath; a bloom on a scale that breaks plants 2 more (Hatchery)
  const step0 = BP.stepC43;
  P.stepC43 = function (dt) {
    if (step0) step0.call(this, dt);
    const T = this.time;
    for (const e of this.body) {
      if (!e.seedT || e.seedT > T) continue;
      const h = e.seedH;
      e.seedT = 0;
      if (e.dead || !h) continue;
      const p = this.pos(e);
      this.hit(h, e, baseOf(h) * 1.5, true);
      for (const n of this.neighbours(e)) { this.hit(h, n, baseOf(h) * 0.5, true); if (e.dead && this.has(h, "hatchery") && !n.dead && !(n.seedT > T)) { n.seedT = T + 2; n.seedH = h; } }
      this.fxImg("dd/fx_hit_nature_l.webp", p.x, p.y, 70, 0.3, { grow: 0.5 });
    }
  };
})();
