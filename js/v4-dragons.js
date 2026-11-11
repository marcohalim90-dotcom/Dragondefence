/* Rancangan v4, tahap B2 Naga (Ledger Confirmed C56; user "go" 2026-11-10): docs/rancangan-v4/02-naga.md.
   - Stat sheet per dragon (G2 §2): its share of the stage's life ÷ its effective factor (Traits × Rage), life along its body
     0.6× at the front → 1.4× at the back, tail 2×, head 6×, special scales 1.3×; time from its portal to the wall 80 s (Swift 67 s,
     boss 95 s); bite 7 % of the base wall a second (boss 10 %, Venom ×1.25).
   - 10 Traits (G2 §7), one per lesser dragon from Stage 6, two on a boss; a second Trait for every lesser dragon from Stage 101.
   - 10 bosses (G2 §6): Kraken 80, Phoenix 90, Shogun 100 added; the list comes round every 100 stages, Rage every X × 0.9 per round
     (at most every 12 s).
   Behind the v4 switch (DD.V4; js/v4-core.js), on for everyone since B6 (?v3 = the old rules). Loaded after js/v4-core.js. */
(function () {
  if (!DD.V4) return;
  const V = DD.v4;

  /* ------------------------------------------------------------ Traits (G2 §7.2) */
  const TR = (V.TRAITS = {
    plated: { name: "Plated", text: "The first hit on each scale deals half damage.", f: 1.09 },
    regrowth: { name: "Regrowth", text: "A scale not hit for 3 s heals 4% of its life a second.", f: 1.05 },
    swift: { name: "Swift", text: "Moves 20% faster. Its scales have 17% less life.", f: 1.2 },
    shell: { name: "Shell", text: "Every 6th scale is a Shell: 3× life, 3× coins. The other scales have 40% less life.", f: 1.03 },
    phantom: { name: "Phantom", text: "Every 10 s, 4 scales turn to mist for 1.5 s: hits pass through them.", f: 1.04 },
    surge: { name: "Surge", text: "Every 15 s it surges 60% faster for 2 s.", f: 1.08 },
    venom: { name: "Venom", text: "Its bite hurts the wall 25% more.", f: 1.05 },
    rebirth: { name: "Rebirth", text: "The first time its head breaks, it comes back with 40% life.", f: 1.04 },
    prism: { name: "Prism", text: "After 5 hits of one element within 1 s, it takes 30% less from that element for 3 s.", f: 1.06 },
    drain: { name: "Drain", text: "While it bites the wall, its 3 front scales heal 10% of their life a second.", f: 1.04 },
  });
  const FAMILY = {
    plated: ["Ironhide Drake", "Rustscale Drake", "Titanscale Gladiator", "Pangolin Wyrm", "Siegeback Wyrm", "Shogun Wyrm"],
    regrowth: ["Moss Wyrm", "Thornback Drake", "Blossom Wyrm", "Harvest Wyrm", "Lotus Wyrm"],
    swift: ["Storm Wyvern", "Thunder Drake", "Plumed Storm Wyrm", "Coilspark Wyrm"],
    shell: ["Stonescale Drake", "Obsidian Wyrm", "Sand Wyrm", "Saltfossil Wyrm", "Shellback Wyrm"],
    phantom: ["Bone Wyrm", "Riftwing", "Ghostwyrm", "Eclipse Drake", "Wrapped Wyrm", "Chameleon Wyrm"],
    surge: ["Mistfin Lung", "Tide Serpent", "Drowned Wyrm", "Kraken Wyrm", "Leviathan"],
    venom: ["Sporecap Wyrm", "Venomscale Cobra", "Flytrap Wyrm"],
    rebirth: ["Ashscale Wyrm", "Blazefang", "Pumice Wyrm", "Cinder Axolotl", "Phoenix Wyrm"],
    prism: ["Frost Wyrm", "Crystal Wyvern", "Jade Wyrm", "Lantern Jelly Wyrm", "Runebound Wyrm"],
    drain: ["Bloodwing"],
  };
  V.TRAIT_OF = {};
  for (const [t, names] of Object.entries(FAMILY)) for (const n of names) V.TRAIT_OF[n] = t;
  /** the second Trait from Stage 101 (G2 §7.3) */
  V.TRAIT_PAIR = { plated: "surge", regrowth: "venom", swift: "phantom", shell: "prism", phantom: "swift", surge: "plated", venom: "regrowth", rebirth: "drain", prism: "shell", drain: "rebirth" };
  V.TRAIT_FROM = 6;

  /* ------------------------------------------------------------ the 10 bosses (G2 §6); rage = [every s, for s, speed ×] */
  V.BOSSES = [
    { name: "Ember Drake", world: "Ember Drake Nest", form: "ember", els: ["fire", "rock"], immune: ["fire"], rage: [45, 3, 1.6], traits: ["rebirth"] },
    { name: "Broodmother", world: "Broodmother Hive", form: "brood", els: ["nature", "poison"], immune: ["poison"], rage: [40, 4, 1.6], traits: ["regrowth", "venom"] },
    { name: "Elder Dragon", world: "Elder Dragon's Throne", form: "elder", els: ["fire", "holy"], immune: ["fire", "water"], rage: [35, 4, 1.7], traits: ["plated", "rebirth"] },
    { name: "Hellchain Wyrm", world: "Hellchain Pit", form: "hellchain", els: ["fire", "dark"], immune: ["fire", "holy"], rage: [30, 5, 1.7], traits: ["plated", "drain"] },
    { name: "Worldroot Wyrm", world: "Worldroot Wyrm Grove", form: "worldroot", els: ["nature", "rock"], immune: ["ice", "water"], rage: [25, 5, 1.8], traits: ["regrowth", "shell"] },
    { name: "Magma Wyrm", world: "Magma Wyrm Forge", form: "magma", els: ["fire", "rock"], immune: ["fire", "rock"], rage: [25, 6, 1.8], traits: ["shell", "rebirth"] },
    { name: "Hydra", world: "Hydra Mire", form: "hydra", els: ["nature", "poison"], immune: ["poison", "water"], rage: [22, 6, 1.9], traits: ["rebirth", "venom"] },
    // new (G2 §6): the three lesser dragons that look like bosses, in their lesser paintings until P-B1–P-B3 are painted
    { name: "Kraken", world: "Kraken Deep", form: "kraken", els: ["water", "dark"], immune: ["electric", "holy"], rage: [20, 6, 1.9], traits: ["surge", "phantom"] },
    { name: "Phoenix", world: "Phoenix Aerie", form: "phoenix", els: ["fire", "holy"], immune: ["water", "dark"], rage: [18, 7, 2], traits: ["rebirth", "swift"] },
    { name: "Shogun", world: "Shogun Citadel", form: "shogun", els: ["physical", "fire"], immune: ["water", "rock"], rage: [15, 7, 2], traits: ["plated", "surge"] },
  ];
  V.WALL_T = { lesser: 80, swift: 67, boss: 95 }; // s from the portal to the wall
  V.BITE_BOSS = 0.1 / 0.07; // a boss bites 10 % of the base wall a second, a lesser dragon 7 % (DD.WALL_BITE)
  const rageF = (r) => (r ? 1 + (r[1] / r[0]) * (r[2] - 1) : 1);
  /** a dragon's effective life factor: its Traits × its Rage (G2 §2); its life is divided by this, so the stage stays on the G1 curve */
  V.factorOf = (d, hard, n) => {
    let f = (d.traits || []).reduce((a, t) => a * (TR[t] ? TR[t].f : 1), 1) * rageF(d.rage);
    if (hard && !d.boss && DD.hardRage) f *= rageF(DD.hardRage(n, d.k || 0));
    return f;
  };

  /* ------------------------------------------------------------ the dragons of a stage */
  const sd0 = DD.stageDragons;
  DD.stageDragons = function (n) {
    const out = sd0(n).map((d) => ({ ...d }));
    if (DD.isBossStage(n) && out.length) {
      const i = (n / 10 - 1) % V.BOSSES.length, round = Math.floor((n / 10 - 1) / V.BOSSES.length), b = V.BOSSES[i], last = out[out.length - 1];
      out[out.length - 1] = { ...b, el: b.els[0], boss: true, k: last.k, share: last.share, traits: b.traits.slice(),
        rage: [Math.max(12, Math.round(b.rage[0] * Math.pow(0.9, round) * 10) / 10), b.rage[1], b.rage[2]] };
    }
    for (const d of out) {
      if (!d.boss) {
        const t = n >= V.TRAIT_FROM ? V.TRAIT_OF[d.name] : null;
        d.traits = t ? (n >= 101 ? [t, V.TRAIT_PAIR[t]] : [t]) : [];
      }
      d.factor = V.factorOf(d, false, n);
      d.wallT = d.boss ? V.WALL_T.boss : d.traits.includes("swift") ? V.WALL_T.swift : V.WALL_T.lesser;
      d.biteK = (d.boss ? V.BITE_BOSS : 1) * (d.traits.includes("venom") ? 1.25 : 1);
    }
    return out;
  };
  // boss stage names count rounds of 10 bosses (was 7): Kraken Deep, … Ember Drake Nest II at Stage 110
  const ROMAN = ["", "", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];
  const stage1 = DD.stage;
  DD.stage = function (n) {
    const s = stage1(n);
    const main = s.dragons && s.dragons[s.dragons.length - 1];
    if (main && main.boss) {
      const c = Math.floor((n / 10 - 1) / V.BOSSES.length) + 1, worldName = main.world + (c < ROMAN.length ? ROMAN[c] : " " + c);
      return { ...s, worldName, name: `${n}. ${worldName}` };
    }
    return s;
  };

  /* ------------------------------------------------------------ the Info box on Home: one entry per dragon (G2 §11) */
  const elName = (e) => (DD.ELEMENT_NAME && DD.ELEMENT_NAME[e]) || e;
  V.dragonLife = (st, d) => ((d.share || 0) * (st.v4T || 0)) / V.factorOf(d, st.hard, st.n);
  V.stageInfo = (st) => {
    const D = st.dragons || [];
    const rows = D.map((d) => {
      const parts = [(d.els || [d.el]).map(elName).join(" + ") + (d.boss ? " · Boss" : "")];
      if ((d.immune || []).length) parts.push(`Immune: ${d.immune.map(elName).join(", ")} (those hits deal 0)`);
      if (d.rage) parts.push(`Rage: every ${Math.round(d.rage[0])} s, ${Math.round((d.rage[2] - 1) * 100)}% faster for ${d.rage[1]} s`);
      for (const t of d.traits || []) parts.push(`<b>${TR[t].name}</b>: ${TR[t].text}`);
      parts.push(`Life ${DD.fmt(V.dragonLife(st, d))} · reaches the wall in ${d.wallT} s`);
      return [DD.skinDragon ? DD.skinDragon(d.form, "head") : null, d.name, parts.join("<br>")];
    });
    return [`Stage ${st.n}: ${D.length} dragons`, rows];
  };

  const B = DD.Battle && DD.Battle.prototype;
  if (!B) return;

  /* ------------------------------------------------------------ life of every scale (G2 §3.1, §8) */
  const build1 = B.buildDragon;
  B.buildDragon = function () {
    build1.call(this); // js/v4-core.js: the stage's life = v4T
    const st = this.stage, D = st.dragons;
    if (!st.v4T || !D || !D.length || !this.body.length) return;
    const segs = D.map(() => []);
    for (const e of this.body) (segs[e.d || 0] || segs[0]).push(e);
    D.forEach((d, k) => {
      const list = segs[k];
      if (!list.length) return;
      const life = ((d.share || 1 / D.length) * st.v4T) / V.factorOf(d, st.hard, st.n);
      const body = list.filter((e) => e.type !== "head"), m = body.length, shell = (d.traits || []).includes("shell");
      const w = new Map();
      for (const e of list) if (e.type === "head") w.set(e, 6);
      body.forEach((e, j) => {
        let x = 0.6 + 0.8 * (m > 1 ? j / (m - 1) : 0.5);
        if (e.tail) x *= 2;
        else if (e.special) x *= 1.3;
        if (shell && !e.tail) {
          if ((j + 1) % 6 === 0) { x *= 3; e.shell = true; e.coinMul = (e.coinMul || 1) * 3; e.r *= 1.1; } else x *= 0.6;
        }
        w.set(e, x);
      });
      let sum = 0;
      for (const x of w.values()) sum += x;
      for (const [e, x] of w) { e.hp = (life * x) / sum; e.max = e.hp; }
    });
    this.v4D = D;
    // the first battle with a Trait says where to read it (G2 §7.2)
    const P = DD.P, S = P && P.get && P.get();
    if (S && S.seen && !S.seen.v4trait && D.some((d) => (d.traits || []).length)) {
      S.seen.v4trait = true;
      P.save();
      this.v4hint = true;
    }
  };

  const state = (b) => (b.v4s = b.v4s || { spd: {}, surge: {}, mist: {}, prism: {} });
  // words over the head; each kind on its own height so two never print over each other
  const say = (b, e, txt, col, dy = 56) => { if (b.texts.length < 44) { const p = b.pos(e); b.texts.push({ x: p.x, y: p.y - dy, txt, t: 1.2, max: 1.2, sum: true, col }); } };

  /* ------------------------------------------------------------ every frame: speed, Surge, Phantom, Drain, Regrowth */
  const rage0 = B.stepRage;
  B.stepRage = function (dt) {
    rage0.call(this, dt);
    const D = this.v4D;
    if (!D) return;
    const T = this.time, s = state(this);
    if (this.v4hint && T > 2) {
      this.v4hint = false;
      if (this.texts.length < 44) this.texts.push({ x: this.W / 2, y: this.H * 0.42, txt: "This dragon has a trait: read it in Info on Home", t: 3.2, max: 3.2, sum: true, col: "#ffe27a" });
    }
    this.biteK = this.biteK || [];
    const fronts = new Map();
    for (const e of this.body) if (!fronts.has(e.d || 0)) fronts.set(e.d || 0, e);
    for (const [k, head] of fronts) {
      const d = D[k] || {}, tr = d.traits || [], P = this.pathOf(head), out = head.s > P.enter;
      // its own time from the portal to the wall: 80 s, Swift 67 s, boss 95 s, on every path shape
      if (s.spd[k] === undefined) s.spd[k] = (P.len - P.enter) / (DD.DRAGON_SPEED * (P.sc || 1)) / (d.wallT || V.WALL_T.lesser);
      let m = s.spd[k];
      if (tr.includes("surge") && out) {
        const g = (s.surge[k] = s.surge[k] || { next: T + 15, end: 0 });
        if (T >= g.next) { g.end = T + 2; g.next = T + 15; say(this, head, "SURGE!", "#7fd0ff"); }
        if (T < g.end) m *= 1.6;
      }
      this.rageK[k] = (this.rageK[k] || 1) * m;
      this.biteK[k] = d.biteK || 1;
      if (tr.includes("phantom") && out) {
        if (s.mist[k] === undefined) s.mist[k] = T + 10;
        if (T >= s.mist[k]) {
          s.mist[k] = T + 10;
          const pool = this.body.filter((e) => (e.d || 0) === k && e.s > this.enterOf(e) && !e.dead);
          for (let i = 0; i < 4 && pool.length; i++) pool.splice(Math.floor(this.rnd() * pool.length), 1)[0].mistT = T + 1.5;
          say(this, head, "MIST", "#c9b8ff", 84);
        }
      }
      if (tr.includes("drain") && head.s >= P.len - 0.5) {
        let c = 0;
        for (const e of this.body) { if ((e.d || 0) !== k) continue; if (c++ >= 3) break; e.hp = Math.min(e.max, e.hp + e.max * 0.1 * dt); }
      }
      if (tr.includes("regrowth")) for (const e of this.body) {
        if ((e.d || 0) !== k || e.hp >= e.max || e.s <= this.enterOf(e)) continue;
        if (T - (e.lastHitT === undefined ? -99 : e.lastHitT) >= 3) e.hp = Math.min(e.max, e.hp + e.max * 0.04 * dt);
      }
    }
    if (this.body[0]) this.rageMul = this.rageK[this.body[0].d || 0] || 1;
  };

  /* ------------------------------------------------------------ hits: Phantom, Plated, Prism; Regrowth's clock */
  const hit0 = B.hit;
  B.hit = function (h, e, base, quiet) {
    if (e && !e.dead && this.v4D) {
      if (e.mistT > this.time) return; // Phantom: the hit passes through the mist
      e.lastHitT = this.time;
      this.v4hit = e;
    }
    try { return hit0.call(this, h, e, base, quiet); } finally { this.v4hit = null; }
  };
  const deal0 = B.deal;
  B.deal = function (h, e, d) {
    if (e && this.v4D) e.lastHitT = this.time; // burning, poison … keep a Regrowth scale from healing
    return deal0.call(this, h, e, d);
  };
  const dmg0 = B.dmgOf;
  B.dmgOf = function (h, base, e) {
    const o = dmg0.call(this, h, base, e);
    if (!e || this.v4hit !== e || !this.v4D) return o;
    const k = e.d || 0, tr = (this.v4D[k] || {}).traits || [];
    if (tr.includes("plated") && !e.plated1) { e.plated1 = true; o.d *= 0.5; }
    if (tr.includes("prism")) {
      const el = this.elOf(h, e).el, P = (state(this).prism[k] = state(this).prism[k] || { log: {}, until: {} }), T = this.time;
      if (P.until[el] > T) o.d *= 0.7;
      const L = (P.log[el] = (P.log[el] || []).filter((t) => t > T - 1));
      L.push(T);
      if (L.length >= 5 && !(P.until[el] > T)) { P.until[el] = T + 3; say(this, e, `PRISM: ${elName(el)} −30%`, "#e6f3ff", 30); }
    }
    return o;
  };

  /* ------------------------------------------------------------ Rebirth: the head comes back once with 40 % life */
  const kill1 = B.kill;
  B.kill = function (e, h) {
    if (e && !e.dead && e.type === "head" && !e.reborn && this.v4D && ((this.v4D[e.d || 0] || {}).traits || []).includes("rebirth")) {
      e.reborn = true;
      e.hp = e.max * 0.4;
      say(this, e, "REBIRTH!", "#ffb050");
      return;
    }
    return kill1.call(this, e, h);
  };
})();
