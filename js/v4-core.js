/* Rancangan v4, tahap B1 (Ledger Confirmed C56, 2026-11-10; user: "ya lanjutkan"): the number foundation of docs/rancangan-v4/01-fondasi-kurva.md.
   - Global (no switch): numbers on screen K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, then aa, ab …; three significant digits; what the
     player owns rounds down (DD.fmt), what a price asks rounds up (DD.fmtCost) (G1 §2.3).
   - Behind the v4 switch (DD.V4: on for everyone since B6, 2026-11-11; off with ?v3 in the address or DD_V4=0 in tools/sim-node.mjs): the dragon curve of G1 §3.2 (total
     life of a stage), Recommended Power = that life ÷ 140 s (G1 §4), Party Power = the party's damage per second (G1 §2.2), ATK on the
     Party page as points on a base of 1,000. Every v4 build step lives behind the switch until B6, when it goes on for everyone with a
     save conversion (G10 §9): v4 dragons alone are 4–7× weaker than today's at Stage 10–100, and the switch keeps dd:save:v3 safe.
   Loaded after js/battle.js (it wraps DD.fmt, DD.Battle) and js/state.js (DD.P); on pages without them only the numbers apply. */
(function () {
  const loc = typeof location !== "undefined" ? location.search || "" : "";
  // B6 (2026-11-11, user "go"): v4 is on for everyone; ?v3 in the address (or DD_V4=0 in tools/sim-node.mjs) shows the old rules
  DD.V4 = !/[?&]v3\b/.test(loc) && globalThis.DD_V4 !== false;
  // B6: before a v4 step changes the save (S.v4a, S.v4b, S.v4e), keep the save as it was once under <key>:before-v4 (G6 §13)
  try {
    if (DD.V4 && DD.P && typeof localStorage !== "undefined") {
      const k = DD.P.key, raw = localStorage.getItem(k);
      if (raw && !/"v4[abe]"\s*:/.test(raw) && !localStorage.getItem(k + ":before-v4")) localStorage.setItem(k + ":before-v4", raw);
    }
  } catch (e) { /* private window: nothing to keep */ }

  /* ------------------------------------------------------------ numbers on screen (G1 §2.3), global */
  const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  DD.suffix = (e) => (e < SUF.length ? SUF[e] : String.fromCharCode(97 + (Math.floor((e - SUF.length) / 26) % 26)) + String.fromCharCode(97 + ((e - SUF.length) % 26)));
  /** Three significant digits; up = round up (prices, what is still to do), otherwise down (what the player owns). Below 1,000 the whole
      number, rounded up as before (a scale with 0.4 life left still shows 1). */
  const short = (n, up) => {
    n = Math.max(0, n);
    if (!isFinite(n)) return "∞";
    if (n < 1000) return String(Math.ceil(n));
    let e = Math.floor(Math.log10(n) / 3), v = n / Math.pow(1000, e);
    const d = v < 10 ? 2 : v < 100 ? 1 : 0, k = Math.pow(10, d);
    v = up ? Math.ceil(v * k - 1e-9) / k : Math.floor(v * k + 1e-9) / k;
    if (v >= 1000) { e++; v = 1; }
    return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") + DD.suffix(e);
  };
  DD.fmt = (n) => short(n, false);
  DD.fmtCost = (n) => short(n, true);

  /* ------------------------------------------------------------ the dragon curve (G1 §3.2) */
  const E = [0.5, 0.6, 0.7, 0.8, 0.9];
  const V = (DD.v4 = {
    WINDOW: 140, // s: Recommended Power = the stage's life ÷ this (G1 §4)
    /** average life of one body scale */
    a: (n) => 90 * Math.pow(1.1, Math.min(n, 38) - 1) * Math.pow(1.08, Math.max(0, Math.min(n, 100) - 38)) * Math.pow(1.07, Math.max(0, n - 100)) *
      Math.pow(1.5, Math.floor((n - 1) / 10)) * (E[n - 1] || 1) * (n % 10 === 0 ? 1.25 : 1),
    /** body scales of the stage */
    S: (n) => Math.min(160, 80 + 4 * (n - 1)),
    /** dragons (= heads) of the stage: 2 up to Stage 10; boss stages 2, 3 from Stage 30; else 3 on odd stages, 2 on even */
    heads: (n) => (n < 11 ? 2 : n % 10 === 0 ? (n >= 30 ? 3 : 2) : n % 2 ? 3 : 2),
    /** total life of the stage: a head is 6 scales */
    T: (n) => V.a(n) * (V.S(n) + 6 * V.heads(n)),
    /** Recommended Power */
    R: (n) => V.T(n) / V.WINDOW,
  });

  /* ------------------------------------------------------------ interim hero damage per second (until B3) */
  // Measured 2026-11-10 (G3 §2): each hero alone at Lv 1 and Lv 20, no cards, on a thick Stage 3 dragon (scratch g3m.mjs). B3 replaces
  // these with the G3 tier points and the one level curve.
  V.DPS = {
    spellsword: [15.5, 488], dwarf: [9.1, 346], sorceress: [23.9, 755], "loeg-yllavyre": [34, 1025], "sugarplum-faerie": [15, 395], dreamwalker: [65, 1750],
    ebenezer: [10.2, 409], occultist: [15.8, 596], crusader: [31.9, 924], "amar-suen": [58.5, 969], tristan: [10.6, 375], "kael-dragon": [201.3, 4263],
    "half-goblin": [11.1, 596], leprechaun: [21, 711], "tou-lak": [49.9, 934], minstrel: [22.1, 358], "guild-leader": [28.3, 908],
    enchantress: [15.5, 396], knight: [26.6, 969], alchemist: [34.1, 1042], scout: [34.6, 782], szopin: [24, 702],
    mercenary: [14.2, 548], "jack-frost": [11, 716], alexandra: [48.5, 1548], klaus: [10.1, 365], "time-traveler": [43.9, 1050],
    tracker: [15.3, 616], cassandra: [18.1, 578], marpesia: [42.4, 872], archaeologist: [11.9, 336], viking: [10.4, 524],
  };
  const tierAvg = {};
  const avgOf = (tier) => {
    if (tierAvg[tier]) return tierAvg[tier];
    const ids = Object.keys(V.DPS).filter((id) => DD.HERO[id] && DD.HERO[id].tier === tier);
    const pick = ids.length ? ids : Object.keys(V.DPS);
    return (tierAvg[tier] = [0, 1].map((k) => pick.reduce((a, id) => a + V.DPS[id][k], 0) / pick.length));
  };
  const lvMul = (h, lv) => { const m = DD.levelMods(h, lv); return m.dmgL * m.rateL; };
  /** a hero's damage per second at a level, before party attributes: Lv 1 → 20 between the two measurements, then the level steps */
  V.heroDps = (id, lv) => {
    const h = DD.HERO[id], d = V.DPS[id] || avgOf(h && h.tier);
    lv = Math.max(1, lv || 1);
    if (lv <= 20) return d[0] * Math.pow(d[1] / d[0], (lv - 1) / 19);
    return d[1] * (h ? lvMul(h, lv) / lvMul(h, 20) : 1);
  };

  if (!DD.V4) return;

  /* ------------------------------------------------------------ stages: life and Recommended Power */
  const stage0 = DD.stage;
  DD.stage = function (n) {
    const s = stage0(n);
    return { ...s, v4T: V.T(n), power: Math.max(1, Math.round(V.R(n))) };
  };
  const hard0 = DD.hardStage;
  DD.hardStage = function (n) {
    const s = hard0(n); // its power is already the Normal one × DD.HARD.hp
    return { ...s, v4T: V.T(n) * DD.HARD.hp };
  };
  if (DD.Battle) {
    const build0 = DD.Battle.prototype.buildDragon;
    /** keeps the shape of the body (2–3 dragons, heads, Pearls, boss) and scales every scale so the stage holds exactly its v4 life */
    DD.Battle.prototype.buildDragon = function () {
      build0.call(this);
      const want = this.stage && this.stage.v4T;
      if (!want || !this.body || !this.body.length) return;
      const have = this.body.reduce((a, s) => a + s.hp, 0);
      if (!(have > 0)) return;
      const f = want / have;
      this.body.forEach((s) => { s.hp *= f; s.max = s.hp; });
    };
  }

  /* ------------------------------------------------------------ Party Power = damage per second (G1 §2.2), no Wall HP, no projectiles */
  const P = DD.P;
  if (P && P.battleMods) {
    const share = (id, b) => {
      const g = (b.gear && b.gear[id]) || P.heroGear(id);
      const crit = 1 + Math.min(1, b.crit + g.crit) * (1 + b.critDmg + g.critDmg);
      return V.heroDps(id, P.lv(id) || 1) * (b.dmgMul + g.atk) * crit * (1 + b.haste + g.haste) * (1 + 0.5 * (b.area + g.area));
    };
    P.power = () => { const b = P.battleMods(); return Math.max(1, Math.round(P.formation().reduce((a, id) => a + share(id, b), 0))); };
    P.heroPowerFull = (id) => Math.max(1, Math.round(share(id, P.battleMods())));
    P.heroPower = (id) => Math.max(1, Math.round(V.heroDps(id, P.lv(id) || 1)));
  }
  /** ATK on the Party page: points on a base of 1,000 (G1 §2.1, 1 point = 0.1 %) */
  DD.v4.atkShown = (atk) => Math.round(1000 * (1 + atk));
})();
