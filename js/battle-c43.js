/* C43 (user no. 93: "build hero"; design = Ledger Draft 38 / artifact "Rancangan Skill dan Evo Card"): the battle side of the hero
   rework. Loaded after js/battle.js. It extends DD.Battle with
   · the element chart (11 elements, two-element heroes take their best element, Dragon ×1.5, immune ×0) and the new statuses
     (Chilled, Staggered, Poisoned, Cursed, Judged, Awed) and reactions (Superconduct, Toxic Blaze, Eclipse; Shatter also for Rock);
   · the Skill Card engine (DD.CARDS: Skill Cards with a value per tier and a cap, Unique, Mythic and Evo Cards; tier odds that move
     with every reroll; cards open with the hero's level; 10 cards per hero);
   · six new attacks (pulse, pinball, rain, sweep, clock, whirl) and what every Unique and Evo Card does (flags, periodic effects,
     marks on scales, effects on a kill).
   Pictures for the big Evo effects come from 2a/fx/evo_<name>.webp when they exist (ChatGPT, C43 G5); until then a glow is drawn. */
(function () {
  if (!DD.Battle) return;
  const Base = DD.Battle;
  const P = Base.prototype;
  const TOP = 120;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const snd = (name, o) => DD.play && DD.play(name, o);
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  /** as js/battle.js glow(): a painted light added onto the field (status rings) */
  const glow = (g, im, x, y, size, a) => { if (!ready(im)) return; g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha *= a; g.drawImage(im, x - size / 2, y - size / 2, size, size); g.restore(); };
  const segD = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  const REACTS0 = { "wet+electric": "overload", "charged+water": "overload", "wet+fire": "steam", "burn+water": "steam", "burn+nature": "wildfire", "tangle+fire": "wildfire" };
  const HIT_EL = { physical: "phys", fire: "fire", water: "water", electric: "elec", nature: "nature", ice: "water", rock: "phys", poison: "nature", dark: "elec", holy: "fire", dragon: "fire" };
  const RX = ["superconduct", "toxic", "eclipse"];
  const EVO_IMG = (name) => `2a/fx/evo_${name}.webp`;
  const ATK_IMG = (name) => `2a/fx/atk_${name}.webp`; // C47: painted pieces of the new attacks (Lark, Tristan, Granny) and Sunrise
  // the hero's painted projectile (as js/battle.js PROJ), for the new attacks
  const PROJ = { spellsword: "bolt", ebenezer: "coin", "half-goblin": "dagger", enchantress: "heart", mercenary: "tracer", dwarf: "axe", occultist: "skull", leprechaun: "rainbow", "jack-frost": "snowball",
    cassandra: "claw", crusader: "hammer", "tou-lak": "roar", alchemist: "flask", marpesia: "spear", "amar-suen": "crowncoin", tracker: "ice", minstrel: "note", scout: "arrow", klaus: "gift",
    archaeologist: "disc", "sugarplum-faerie": "sweet", tristan: "slash", "guild-leader": "crow", szopin: "blade", viking: "waxe", dreamwalker: "dream", "kael-dragon": "dragonblade" };
  const projImg = (h) => DD.img(PROJ[h.def.id] ? `dd/fx_proj_${PROJ[h.def.id]}.webp` : h.def.icon);

  class Battle extends Base {
    constructor(canvas, opts) {
      super(canvas, opts);
      this.c43init();
    }
  }
  DD.Battle = Battle;

  /* ------------------------------------------------------------------ setup */
  P.c43init = function () {
    this.c43 = { obj: [], zones: [], fly: [], later: [] };
    // C55 (user no. 118: "ga boleh ada freeze yang lebih dari 0.4 detik. freeze terlalu curang sebenernya. overpower"): a freeze lasts at
    // most DD.FREEZE_MAX s from its start (more freezes on top cannot stretch it), and the next one can start DD.FREEZE_CD s after it ends
    let fz = this.frozen || 0;
    Object.defineProperty(this, "frozen", { configurable: true, enumerable: true, get: () => fz, set: (v) => {
      const T = this.time || 0;
      if (v > fz) {
        if (fz <= 0) { if (T < (this.fzReady || 0)) return; this.fzStart = T; }
        v = Math.min(v, this.fzStart + DD.FREEZE_MAX - T);
        if (v <= fz) return;
      }
      if (fz > 0 && v <= 0) this.fzReady = T + DD.FREEZE_CD;
      fz = v;
    } });
    this.rerolls = this.mods.oddsStart || 0; // odds steps (DD.cardOdds): Free Refreshes so far; Fate's Coin starts higher (C44)
    this.regenT = 10;
    // C45: Royal Seal and Dragon Compass give counts with a fraction: the whole part, plus one more by chance, rolled once a battle
    this.refresh = DD.FREE_REFRESH + DD.rollCount(this.mods.refresh || 0, this.rnd);
    this.callRefresh = DD.CALL_REFRESH + DD.rollCount(this.mods.callRefresh || 0, this.rnd);
    this.stageEls = this.stage.els || [this.stage.el];
    this.immune = this.stage.immune || [];
    // G2: every dragon its own elements and immunities
    const D = this.dragons || [{ els: this.stageEls, immune: this.immune }];
    this.dEls = D.map((d) => d.els || [d.el]);
    this.dImm = D.map((d) => d.immune || []);
    this.immT = {};
    this.dmgLog = [];
    this.timeStopT = 0;
    for (const h of this.heroes) {
      h.els = h.def.els || [h.def.el];
      h.hitBy = this.dEls.map((els, k) => DD.elBest(h.els, els, this.dImm[k]));
      h.hitEl = h.hitBy[0].el;
      h.elK = h.hitBy[0].m;
      h.flags = new Map();
      h.taken = {};
      h.per = [];
      h.cnt = { coin: 0, hs: 0, gift: 0, slam: 0, shots: 0, soul: 0, verdict: 0 };
      for (const k of ["critDmg", "multi", "stun"]) if (h.st[k] === undefined) h.st[k] = 0;
      h.evo = false;
      h.evo2 = false;
      h.pool = (h.def.cards || []).filter((c) => c.lv <= h.lv);
      // a Lv 20 hero starts with its first Evo Card already working (it was the Lv 20 evolution before C43)
      if (h.lv >= (DD.MAIN_LV || 20)) { const ev = h.pool.find((c) => c.type === "evo"); if (ev) this.takeEff(h, ev); }
    }
  };
  P.has = function (h, f) {
    return !!(h && h.flags && ((h.flags.get(f) || 0) > 0 || (h.buffT > this.time && h.buffFlags && h.buffFlags.includes(f))));
  };
  /** C53 (no. 114): some dragon's head is in the last quarter of its track. Cards that push or slow the dragon act only then:
      early on they pushed the tail back into the portal and left the heroes nothing to hit. */
  P.danger = function () {
    return this.body.some((e, i) => (!i || this.body[i - 1].d !== e.d) && !e.dead && e.s >= this.pathOf(e).len * 0.75);
  };
  P.stacks = function (h, f) {
    return (h && h.flags && h.flags.get(f)) || 0;
  };
  P.anyHas = function (f) {
    return this.heroes.some((x) => x.onWall && this.has(x, f));
  };
  /** G2: the dragon a scale belongs to (the one in front when there is no scale) */
  P.dk = function (e) {
    const k = e && e.d !== undefined ? e.d : this.body[0] ? this.body[0].d || 0 : 0;
    return this.dEls && this.dEls[k] ? k : 0;
  };
  /** G2: the element a hero hits a scale with and its multiplier against that scale's dragon (immune = 0) */
  P.elOf = function (h, e) {
    const k = this.dk(e);
    if (h._el) return { el: h._el, m: DD.elBest([h._el], this.dEls[k], this.dImm[k]).m };
    return h.hitBy ? h.hitBy[k] : { el: h.hitEl, m: h.elK };
  };
  /** "Immune" over a scale, at most once a second per dragon */
  P.immuneText = function (e, el) {
    const k = this.dk(e);
    if ((this.immT[k] || -9) > this.time - 1 || this.texts.length > 40) return;
    this.immT[k] = this.time;
    const p = this.pos(e);
    this.texts.push({ x: p.x, y: p.y - 26, txt: `Immune to ${DD.ELEMENT_NAME[el] || el}`, t: 1, max: 1, sum: true, col: "#c8ccd6" });
  };
  /** G2: Rage (Draft 38): every X s a dragon runs ×M for Y s; 1 s before it roars and glows red; Awed puts it off.
      no. 102: every dragon on its own track keeps its own Rage clock, started when its nose leaves its portal. */
  P.stepRage = function (dt) {
    const T = this.time;
    this.rageMul = 1;
    this.rageK = this.rageK || [];
    if (!this.dragons) return;
    const fronts = new Map();
    for (const e of this.body) if (!fronts.has(e.d || 0)) fronts.set(e.d || 0, e);
    for (const [k, head] of fronts) {
      const fr = this.dragons[k];
      this.rageK[k] = 1;
      if (!fr || head.s <= this.enterOf(head)) continue; // still in its portal: no clock yet
      const rage = fr.rage || (this.stage.hard ? DD.hardRage(this.stage.n, fr.k) : null);
      if (!rage) continue;
      if (fr.rageNext === undefined) fr.rageNext = T + rage[0];
      if (!fr.raging && this.aweT > T && fr.rageNext < this.aweT) { fr.rageNext = this.aweT; fr.warned = false; } // Awed: no Rage for 2 s
      if (!fr.raging && !fr.warned && T >= fr.rageNext - 1) { fr.warned = true; snd("head_die"); this.shake = Math.max(this.shake, 4); }
      if (!fr.raging && T >= fr.rageNext) {
        fr.raging = true; fr.rageEnd = T + rage[1];
        const p = this.pos(head);
        if (this.texts.length < 44) this.texts.push({ x: p.x, y: p.y - 60, txt: "RAGE!", t: 1.2, max: 1.2, sum: true, col: "#ff5a4a" });
      }
      if (fr.raging && T >= fr.rageEnd) { fr.raging = false; fr.warned = false; fr.rageNext = T + rage[0]; }
      if (fr.raging) this.rageK[k] = rage[2];
    }
    if (this.body[0]) this.rageMul = this.rageK[this.body[0].d || 0] || 1;
  };
  /** The "100 %" of an Evo effect: the hero's hit, or 0.4 s of a stream for the heroes that deal damage per second. */
  const baseOf = (h) => h.def.w.dmg || (h.def.w.dps ? h.def.w.dps * 0.4 : 30);

  /* ------------------------------------------------------------------ Skill Cards (Draft 38.2, 38.3) */
  P.capLeft = function (h, stat) {
    const c = h.pool.find((x) => x.type === "skill" && x.stat === stat) || (h.def.cards || []).find((x) => x.type === "skill" && x.stat === stat);
    if (!c || c.cap === null || c.cap === undefined) return Infinity;
    return c.cap - (h.add[stat] || 0);
  };
  P.cardsAt = function (h, tier) {
    return h.pool.filter((c) => {
      if (c.type === "skill") {
        if (this.capLeft(h, c.stat) <= 1e-9) return false;
        if (!tier) return true;
        if (c.tiers[tier] === undefined) return false;
        return !(tier === "legendary" && h.lv < (c.lvL || 5));
      }
      if (tier && c.tier !== tier) return false;
      if (c.type === "evo") return h.sk >= DD.EVO_FROM - (this.mods.evoEarly || 0) && (!h.taken[c.key] || c.rep); // Sage's Lens (Mythic, locked)
      if (c.type === "unique") return !h.taken[c.key];
      if (c.type === "mythic") return !c.eff.stat || Object.keys(c.eff.stat).some((k) => this.capLeft(h, k) > 1e-9);
      return false;
    });
  };
  P.cardFor = function (h, c, tier) {
    if (c.type === "skill") {
      const left = this.capLeft(h, c.stat), v = Math.min(c.tiers[tier], left);
      return { hero: h, card: c, tier, v: Math.round(v * 1000) / 1000, max: v >= left - 1e-9, key: c.key };
    }
    return { hero: h, card: c, tier: c.tier, key: c.key };
  };
  P.rollCards = function () {
    const odds = DD.cardOdds(this.rerolls);
    const open = this.heroes.filter((h) => h.onWall && h.sk < DD.SKILL_MAX && this.cardsAt(h, null).length);
    if (!open.length) return [];
    const out = [], used = new Set();
    for (let guard = 0; out.length < 3 && guard < 160; guard++) {
      let r = this.rnd(), tier = odds[odds.length - 1][0];
      for (const [t, p] of odds) { if (r < p) { tier = t; break; } r -= p; }
      const hs = open.filter((h) => this.cardsAt(h, tier).some((c) => !used.has(c.key)));
      if (!hs.length) continue; // no card of this tier now (a Mythic before Lv 15 …): roll the tier again
      const h = hs[Math.floor(this.rnd() * hs.length)];
      const list = this.cardsAt(h, tier).filter((c) => !used.has(c.key));
      // C45: once a hero's Evo Card can show, it is the card offered DD.EVO_PICK of the time (Sage's Lens adds to it)
      const evo = list.filter((c) => c.type === "evo"), other = list.filter((c) => c.type !== "evo");
      const pick = evo.length && (!other.length || this.rnd() < DD.EVO_PICK + (this.mods.evoPick || 0)) ? evo : other;
      const c = pick[Math.floor(this.rnd() * pick.length)];
      used.add(c.key);
      out.push(this.cardFor(h, c, tier));
    }
    return out;
  };
  /** Free Refresh: the tier odds move for the rest of the battle (Rare −1.5 %, Epic, Legendary, Mythic +0.5 % each). */
  P.reroll = function () {
    this.rerolls += 1 + (this.mods.odds || 0); // Rune Die (C44): every Free Refresh moves the odds further
    return this.rollCards();
  };
  P.takeEff = function (h, c) {
    const e = c.eff || {};
    h.taken[c.key] = (h.taken[c.key] || 0) + 1;
    if (e.stat) for (const [k, v] of Object.entries(e.stat)) {
      const add = Math.min(v, this.capLeft(h, k));
      if (add <= 0) continue;
      h.st[k] = (h.st[k] || 0) + add;
      h.add[k] = (h.add[k] || 0) + add;
    }
    if (e.flag) {
      h.flags.set(e.flag, (h.flags.get(e.flag) || 0) + 1);
      if (h.def.evo && e.flag === h.def.evo.flag) h.evo = true; // the older pattern coefficient (DD.PATTERN_KE) follows the old Evo
    }
    if (e.every) h.per.push({ eff: e, t: Math.min(e.every, 2 + e.every * 0.35) });
  };
  P.giveCard = function (c) {
    const h = c.hero;
    if (h.sk >= DD.SKILL_MAX) return;
    if (!c.card) { h.sk++; return; }
    if (c.card.type === "skill") {
      h.st[c.card.stat] = (h.st[c.card.stat] || 0) + c.v;
      h.add[c.card.stat] = (h.add[c.card.stat] || 0) + c.v;
      h.taken[c.key] = (h.taken[c.key] || 0) + 1;
    } else this.takeEff(h, c.card);
    h.sk++;
  };

  /* ------------------------------------------------------------------ damage, statuses, reactions (Draft 38.1) */
  P.dmgOf = function (h, base, e) {
    let d = base * DD.DMG_SCALE * (DD.PATTERN_K[h.def.id] || 1) * ((h.evo && DD.PATTERN_KE[h.def.id]) || 1) * h.dmgL * (1 + h.st.dmg) * (this.mods.dmgMul + (h.g.atk || 0));
    const eo = this.elOf(h, e), el = eo.el;
    d *= eo.m;
    if (eo.m === 0 && e) this.immuneText(e, el); // G2: a boss immune to this element
    d *= 1 + (this.mods.el[el] || 0) + ((h.g.el || {})[el] || 0);
    if (e && e.type !== "body") d *= 1 + this.mods.boss + (h.g.boss || 0);
    let sure = h.luckyT > this.time;
    if (e) {
      const T = this.time;
      if (e.type !== "body") d *= this.has(h, "bounty3") ? 3 : this.has(h, "bounty") ? 2 : 1;
      if (e.goldT > T && this.anyHas("midas")) d *= 2;
      if (e.goldT > T && h.def.id === "amar-suen") d *= h.taken["amar-suen:King's Ransom"] ? 2 : this.has(h, "crown3") ? 1.5 : 1; // C53
      if (h.howlT > T) d *= 2; // C53: Spirit Howl
      if (e.brandT > T) d *= 1.5;
      if (e.judgeT > T) d *= 1 + (e.judgeK || DD.STATUS.holy.per);
      if (e.stoneT > T && (el === "physical" || el === "rock")) d *= 2;
      if (e.hawkT > T && h.def.id === "scout") d *= 2;
      if (h.def.id === "jack-frost" && this.has(h, "frostbite") && (this.frozen > 0 || e.chillT > T)) d *= 1.3; // C53: Chilled too
      if (e.pinT > T && this.anyHas("holyPin")) d *= 1.2; // C53: Holy Pin, the pinned scale takes +20 % from everyone
      if (this.has(h, "dragonfire") && e.st === "burn" && e.stT > T) d *= 1.2;
      if (this.has(h, "bloodlust")) d *= 1 + 0.1 * Math.min(10, h.blN || 0); // C53: up to +100 % (it had no limit: ×187 with 10 cards at Lv 20)
      if (e.curseT > T) { sure = true; e.curseT = 0; }
    }
    const crit = sure || this.rnd() < (h.def.w.crit || 0) + h.st.crit + this.mods.crit + (h.g.crit || 0);
    return { d: crit ? d * (h.critMul + (h.st.critDmg || 0)) : d, crit };
  };

  P.hit = function (h, e, base, quiet) {
    if (e.dead) return;
    const T = this.time;
    if (h.def.id === "ebenezer" && quiet && this.has(h, "taxman") && ++h.cnt.coin % 10 === 0) base *= 5;
    let { d, crit } = this.dmgOf(h, base, e);
    if (e.sleepT > T) { d *= 1.5; e.sleepT = 0; e.wakeT = T + 1; } // Nightmare: the next hit wakes the scale (C53: hers too)
    // C53: Armour Breaker cracks the scale before his shot lands, so the shot itself takes the +15 %
    if (h.def.id === "mercenary" && this.has(h, "armourBreak")) { e.crack = DD.STATUS.physical.max; e.crackT = T + DD.STATUS.physical.t; }
    const r = this.reaction(h, e);
    if (r) d *= r.mul * (1 + (this.mods.react || 0));
    if (e.crack && e.crackT > T) d *= 1 + DD.STATUS.physical.per * e.crack;
    if (this.timeStopT > 0) {
      // Time Stop: the hit is kept and lands at the end, together with every other one
      e.pend = (e.pend || 0) + d * this.timeStopK;
      h.dealt += d * this.timeStopK;
      if (!r) this.mark(h, e, d);
      return;
    }
    e.hp -= d;
    h.dealt += d;
    this.dmgLog.push(T, d);
    if (crit && e.goldT > T && e.type === "body" && this.has(h, "gildedDeath")) e.hp = 0;
    if (!r) this.mark(h, e, d);
    if (r) this.react(h, e, d, r);
    this.hitFx(h, e, d, crit, quiet);
    this.afterHit(h, e, d, base, quiet);
    if (e.hp <= 0) this.kill(e, h);
  };
  /** The look of a hit (as before C43): a glowing scale and a running total for continuous hits, a painted impact and a number. */
  P.hitFx = function (h, e, d, crit, quiet) {
    if (quiet && !crit) {
      e.heatT = this.time + 0.22;
      e.heatC = h.def.col || "#ffb050";
      this.sumDamage(e, d, h.def.col);
      return;
    }
    e.hit = 0.1;
    if (crit) snd("crit");
    if (this.fx.length < 90 && (crit || this.rnd() < 0.55)) {
      const p = this.pos(e), el = HIT_EL[this.elOf(h, e).el] || "phys";
      this.fxImg(`dd/fx_hit_${el}_${crit ? "l" : "s"}.webp`, p.x + (this.rnd() - 0.5) * 12, p.y + (this.rnd() - 0.5) * 12, crit ? 74 : 46, 0.24, { grow: 0.35, rot: this.rnd() * 6 });
    }
    if (this.texts.length < 40 && (crit || this.rnd() < 0.5)) {
      const p = this.pos(e);
      this.texts.push({ x: p.x + (this.rnd() - 0.5) * 22, y: p.y - e.r * 0.4, txt: DD.fmt(d), t: 0.6, max: 0.6, crit });
    }
  };
  P.near = function (e, n, r) {
    const p = this.pos(e);
    return this.visible().filter((x) => x !== e && !x.dead && (!r || dist(this.pos(x), p) < r)).sort((a, b) => dist(this.pos(a), p) - dist(this.pos(b), p)).slice(0, n);
  };
  P.neighbours = function (e) {
    const i = this.body.indexOf(e);
    return [this.body[i - 1], this.body[i + 1]].filter((x) => x && !x.dead);
  };
  P.addDot = function (h, e, dps, t) {
    (e.dots || (e.dots = [])).push({ h, dps, t: this.time + t });
  };
  /** What a hit does besides damage, per hero card (Unique and Evo Cards). */
  P.afterHit = function (h, e, d, base, quiet) {
    const T = this.time, id = h.def.id;
    if (id === "guild-leader" && this.has(h, "brand")) e.brandT = T + 3;
    if (id === "amar-suen") {
      e.goldT = T + 4;
      if (this.has(h, "crown3")) for (const n of this.neighbours(e)) n.goldT = T + 4;
    }
    // C53: every heartdrop splashes (it counted 5 hits of one drop as one), 10 % of its damage, Wet only where no status is
    if (id === "enchantress" && this.has(h, "heartSplash")) for (const n of this.neighbours(e)) { this.deal(h, n, d * 0.1); if (!(n.st && n.stT > T)) { n.st = "wet"; n.stT = T + DD.STATUS.water.t; } }
    if ((id === "minstrel" || id === "enchantress") && this.has(h, "charm") && !(e.wakeT > T)) e.sleepT = T + 2; // C53: Lullaby / Mass Charm, the next hit ×1.5
    // C53: Guild Bounty, every crow hit Brands its scale and the 2 beside it
    if (id === "guild-leader" && this.has(h, "brandSpread")) { e.brandT = T + 3; for (const n of this.neighbours(e)) n.brandT = T + 3; }
    if (id === "leprechaun" && this.has(h, "rainbowRoad")) this.addDot(h, e, baseOf(h) * 0.3, 3);
    if (id === "loeg-yllavyre" && this.has(h, "wildgrowth")) { this.tangleT = Math.max(this.tangleT, 3); this.addDot(h, e, baseOf(h) * 0.2, 3); }
    if (id === "dreamwalker" && this.has(h, "nightmare")) {
      if (!(e.wakeT > T)) e.sleepT = T + 2;
      if (this.has(h, "lucid")) { e.st = "wet"; e.stT = T + 2; e.curseT = T + 2; }
    }
    if (id === "archaeologist" && this.has(h, "petrify") && (e.discN = (e.discN || 0) + 1) >= 5) { e.discN = 0; e.stoneT = T + 2; }
    if (id === "time-traveler" && this.has(h, "slowTime") && this.danger()) { const cur = this.slowT > 0 ? this.slowF : 1; this.slowF = Math.min(cur, 0.5); this.slowT = Math.max(this.slowT, 1); }
    if (id === "alexandra" && this.has(h, "chainReaction") && e.st === "charged" && !this.inCR && (this.crCd || 0) < T) {
      this.crCd = T + 1;
      this.inCR = true;
      const p = this.pos(e);
      for (const x of this.visible()) if (x !== e && x.st === "charged" && x.stT > T) { const q = this.pos(x); this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2.5, t: 0.25, max: 0.25, col: "#ffe24a", zig: true }); this.hit(h, x, baseOf(h)); }
      this.inCR = false;
    }
    if (id === "ebenezer" && quiet && this.has(h, "jetRicochet") && (h.cnt.ricoT || 0) < T) {
      h.cnt.ricoT = T + 0.4;
      for (const x of this.near(e, 2, 160)) this.hit(h, x, base * 0.5, true);
    }
    if (this.has(h, "bloodlust")) h.blN = (h.blN || 0) + 1;
  };

  P.mark = function (h, e, d) {
    const el = this.elOf(h, e).el;
    if (this.dImm[this.dk(e)].includes(el)) return; // G2: no status from an element the dragon is immune to
    const S = DD.STATUS[el];
    if (!S) return;
    const T = this.time;
    if (S.id === "crack") {
      e.crack = e.crackT > T ? Math.min(S.max, (e.crack || 0) + 1) : 1;
      if (this.has(h, "armourBreak")) e.crack = S.max;
      e.crackT = T + S.t;
      return;
    }
    if (S.id === "chill") {
      e.chill = e.chillT > T ? (e.chill || 0) + 1 : 1;
      e.chillT = T + S.t;
      const cur = this.slowT > 0 ? this.slowF : 1;
      this.slowF = Math.min(cur, S.slow);
      this.slowT = Math.max(this.slowT, S.t);
      if (e.chill >= S.stacks && (this.freezeCd || 0) <= T) {
        this.frozen = Math.max(this.frozen, S.freeze * (this.has(h, "frostbite") && this.danger() ? 2 : 1)); // C53: ×2 near the wall
        this.freezeCd = T + S.cd;
        e.chill = 0;
      }
      return;
    }
    if (S.id === "stagger") {
      if ((this.pushCd || 0) <= T) { this.knock(S.push); this.pushCd = T + S.t; }
      return;
    }
    if (S.id === "poison") {
      const max = this.has(h, "poison10") ? 10 : S.max;
      e.pois = e.poisT > T ? Math.min(max, (e.pois || 0) + 1) : 1;
      e.poisT = T + S.t;
      e.poisD = Math.max(e.poisT > T ? e.poisD || 0 : 0, d * S.dot);
      e.poisH = h;
      if (this.has(h, "venomBurst") && e.pois >= 5) {
        e.pois = 0;
        const p = this.pos(e);
        this.fxImg("dd/fx_hit_nature_l.webp", p.x, p.y, 80, 0.35, { grow: 0.6 });
        for (const x of [e, ...this.neighbours(e)]) this.deal(h, x, this.dmgOf(h, baseOf(h) * 2, x).d);
      }
      return;
    }
    if (S.id === "curse") { if ((e.curseCd || 0) <= T) { e.curseT = T + S.t; e.curseCd = T + S.t; } return; } // once every 4 s on a scale
    if (S.id === "judge") {
      const two = this.has(h, "judgement2");
      e.judgeK = Math.max(e.judgeT > T ? e.judgeK || 0 : 0, two ? 0.3 : S.per);
      e.judgeT = Math.max(e.judgeT || 0, T + (two ? 5 : S.t));
      return;
    }
    if (S.id === "awe") { this.aweT = T + S.t; return; }
    // the older one-at-a-time statuses: Wet, Burning, Charged, Entangled
    e.st = S.id;
    e.stT = T + S.t;
    if (S.id === "burn") this.ignite(h, e, d * S.dot * (1 + (this.mods.burn || 0)));
    if (S.id === "tangle") this.tangleT = Math.max(this.tangleT, S.t);
  };

  P.reaction = function (h, e) {
    const el = this.elOf(h, e).el, R = DD.REACT, T = this.time;
    if (el === "physical" || el === "rock") {
      if (this.frozen > 0) return { k: "shatter", mul: R.shatter.frozen };
      if (el === "physical" && this.slowT > 0) return { k: "shatter", mul: R.shatter.slowed };
      return null;
    }
    if (el === "electric" && e.chillT > T && e.chill > 0) { e.chill = 0; return { k: "superconduct", mul: R.superconduct.mul }; }
    if (el === "fire" && e.poisT > T && e.pois > 0) return { k: "toxic", mul: 1 };
    if (el === "dark" && e.judgeT > T) { e.judgeT = 0; return { k: "eclipse", mul: R.eclipse.mul }; }
    if (el === "holy" && e.curseT > T) { e.curseT = 0; return { k: "eclipse", mul: R.eclipse.mul }; }
    const st = e.st && e.stT > T ? e.st : null;
    if (!st) return null;
    const k = REACTS0[st + "+" + el];
    if (!k) return null;
    e.st = null;
    return { k, mul: R[k].mul || 1 };
  };
  const react0 = P.react;
  P.react = function (h, e, d, r) {
    if (!RX.includes(r.k)) return react0.call(this, h, e, d, r);
    const R = DD.REACT[r.k], p = this.pos(e);
    if (r.k === "superconduct") {
      for (const t of this.near(e, R.jumps, 180)) { const q = this.pos(t); this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2.5, t: 0.22, max: 0.22, col: "#bfefff", zig: true }); this.deal(h, t, d); }
    } else if (r.k === "toxic") {
      const n = e.pois || 0;
      e.pois = 0;
      for (const t of [e, ...this.near(e, 2, 120)]) this.deal(h, t, d * R.burst * n);
      this.fxImg("dd/fx_hit_nature_l.webp", p.x, p.y, 90, 0.35, { grow: 0.6 });
    }
    snd("rx_" + r.k);
    this.reacts[r.k] = (this.reacts[r.k] || 0) + 1;
    if (this.reacts[r.k] === 1 && this.on.react) this.on.react(r.k);
    if ((this.reactAt[r.k] || -9) < this.time - 0.8 && this.texts.length < 40) {
      this.reactAt[r.k] = this.time;
      this.texts.push({ x: p.x, y: p.y - e.r - 6, txt: R.name, t: 0.8, max: 0.8, react: r.k });
    }
  };

  const kill0 = P.kill;
  P.kill = function (e, h) {
    if (e.dead) return;
    const T = this.time, i = this.body.indexOf(e), wasGold = e.goldT > T, brand = e.brandT > T, exp = e.expT > T ? e.expEl : null;
    const nb = [this.body[i - 1], this.body[i + 1]].filter((x) => x && !x.dead);
    kill0.call(this, e);
    if (!e.dead || !this.body.length) return;
    const p = this.pos(e);
    const amar = this.heroes.find((x) => x.def.id === "amar-suen" && x.onWall);
    if (wasGold && amar) {
      // a gold scale is brittle: it bursts into shards that hit the scales around it
      const n = 2 + Math.round(amar.st.count || 0) + (this.has(amar, "midas") ? 2 : 0);
      this.fxImg("dd/fx_hit_coins.webp", p.x, p.y, 70, 0.35, { grow: 0.5 });
      for (const t of this.near(e, n, 140)) this.hit(amar, t, baseOf(amar) * 1.5, true);
    }
    if (brand && this.anyHas("brandSpread")) for (const x of nb) x.brandT = T + 3;
    if (exp) this.experiment(h, e, p, exp, nb);
    if (!h) return;
    const id = h.def.id;
    if (id === "half-goblin" && this.has(h, "heist") && (h.cnt.heistT || 0) <= this.time) {
      h.cnt.heistT = this.time + 0.5; // at most every 0.5 s, so the daggers from a kill cannot run away
      for (const t of this.near(e, 3, 260)) this.shots.push({ hero: h, x: p.x, y: p.y, col: h.def.col, kind: "curve", t: 0, p0: { x: p.x, y: p.y }, side: (this.rnd() - 0.5) * 120, target: t, u: 0, dur: 0.35, pierce: 0, hits: new Set(), spin: 0, trail: [] });
    }
    if (id === "occultist" && this.has(h, "soulHarvest") && (h.cnt.soul || 0) < 6) { h.cnt.soul = (h.cnt.soul || 0) + 1; h.st.count += 1; }
    if (id === "marpesia" && this.has(h, "verdict") && (h.cnt.verdict || 0) < 30) {
      const t = this.near(e, 1, 200)[0];
      if (t) { h.cnt.verdict = (h.cnt.verdict || 0) + 1; this.waves.push({ type: "pin", hero: h, target: t, t: h.def.w.dur + h.st.dur + 0.3, drop: 0.3, tick: 0, r: 12 * (1 + h.st.size), ox: p.x, oy: p.y - 200, oa: -Math.PI / 2 }); }
    }
    // C55: Hatchery is now Loeg's seeds (js/attacks-c55.js); the dragonlings that flew the rows right and left again are gone
    // (user no. 118: "serangan 1 garis kanan kiri kanan kiri … aku ga mau itu ada")
    if (false) {
      this.summons.push({ hero: h, mode: "sweep", k: 9, t: 4, x: p.x < this.W / 2 ? -20 : this.W + 20, y: p.y, dir: p.x < this.W / 2 ? 1 : -1, tick: 0, img: projImg(h), seed: this.rnd() * 6, hitAt: new Map() });
    }
  };

  /** Grand Experiment: a scale killed by one of its flasks sets off the flask's element around it (not the dragon's own element). */
  P.experiment = function (h, e, p, el, nb) {
    if (!h || this.dEls[this.dk(e)].includes(el)) return;
    const T = this.time, vis = this.visible();
    this.fxImg(`dd/fx_hit_${HIT_EL[el] || "phys"}_l.webp`, p.x, p.y, 90, 0.4, { grow: 0.6 });
    if (el === "fire") for (const t of vis) { if (dist(this.pos(t), p) < 70) this.ignite(h, t, baseOf(h) * 0.6); }
    else if (el === "nature") { const cur = this.slowT > 0 ? this.slowF : 1; this.slowF = Math.min(cur, 0.7); this.slowT = Math.max(this.slowT, 5); for (const t of vis) this.deal(h, t, this.dmgOf(h, baseOf(h) * 0.1, t).d); }
    else if (el === "electric") {
      // a bolt runs along the body to the head: 50 % of the hit, +10 % for every scale it crosses
      const i0 = Math.min(this.body.length - 1, Math.max(0, this.body.indexOf(e) + 1)); // no. 102: along e's own dragon only
      let k = 0.5;
      for (let i = i0; i >= 0; i--) { const t = this.body[i]; if (!t || t.dead || t.d !== e.d || t.s <= this.enterOf(t)) continue; this.deal(h, t, this.dmgOf(h, baseOf(h) * 3 * k, t).d); k += 0.1; }
    } else if (el === "water") this.frozen = Math.max(this.frozen, 2.5);
    else if (el === "physical") for (const t of nb) this.deal(h, t, t.hp + 1);
    else if (el === "ice") { this.frozen = Math.max(this.frozen, 2); }
    else if (el === "poison") this.c43.zones.push({ x: p.x, y: p.y, r: 60, dps: baseOf(h) * 0.2, t: 4, tick: 0, hero: h, col: "#c46ae8" });
  };

  /* ------------------------------------------------------------------ attacks */
  const rate0 = P.rateOf;
  P.rateOf = function (h) {
    let r = rate0.call(this, h);
    if (this.heroes.some((x) => x.onWall && this.has(x, "rally"))) r *= 1.15; // C53: Rallying Cry, every hero (the skull swarm too)
    if (this.anyHas("warDrums") && this.shots.filter((b) => b.hero && b.hero.def.id === "tou-lak" && b.kind === "weave").length >= 3) r *= 1.2;
    return r;
  };

  const fire0 = P.fire;
  P.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, k = h.def.kind, T = this.time;
    h.blN = 0;
    h.cnt.shots = (h.cnt.shots || 0) + 1;
    let extraB = 0, extraC = 0;
    if (this.has(h, "luckyArc") && h.cnt.shots % 7 === 0) { h.luckyT = T + 0.6; extraB = (w.bounces || 0) + st.bounce; st.bounce += extraB; }
    if (this.has(h, "sweep3")) { extraC = 2; st.count += 2; }
    // C55: the 21 new attacks (js/attacks-c55.js); false = nothing to hit yet, the attack waits a moment
    const A55 = DD.ATK55 && DD.ATK55[k];
    if (A55 && A55.fire) { const ok = A55.fire.call(this, h, o, vis); st.bounce -= extraB; st.count -= extraC; if (ok === false) { h.cd = 0.15; return; } this.afterFire(h, [], [], vis); return; }
    if (NEW[k]) { NEW[k].call(this, h, o, vis); st.bounce -= extraB; st.count -= extraC; return; }
    const s0 = this.shots.length, w0 = this.waves.length;
    fire0.call(this, h, o, vis);
    st.bounce -= extraB;
    st.count -= extraC;
    if (h.cd === 0.15 && w.cd !== 0.15) return; // nothing in its lane: the attack waits
    this.afterFire(h, this.shots.slice(s0), this.waves.slice(w0), vis);
  };

  P.later = function (t, fn) {
    this.c43.later.push({ t: this.time + t, fn });
  };
  /** One burst of damage in a circle (Second Burst, Surprise Box, Quake Return …). */
  P.burstAt = function (h, x, y, r, mult, col) {
    this.fx.push({ x, y, vx: 0, vy: 0, t: 0.35, max: 0.35, col: col || h.def.col, ring: r });
    for (const e of this.visible()) if (dist(this.pos(e), { x, y }) < r + e.r * 0.6) this.hit(h, e, baseOf(h) * mult);
  };

  P.afterFire = function (h, ns, nw, vis) {
    const id = h.def.id, T = this.time;
    if (id === "mercenary" && this.has(h, "doubleTap")) for (const b of ns) if (b.target) this.shots.push({ ...b, hits: new Set(), wait: (b.wait || 0) + 0.15, trail: [] });
    if (id === "guild-leader" && this.has(h, "murder")) {
      const col = vis.filter((e) => this.onRay(this.muzzle(h), this.aimA, this.pos(e), 60 * (1 + h.st.size))).sort((a, b) => b.hp - a.hp);
      for (const b of ns) if (b.target) for (const t of col.filter((e) => e !== b.target).slice(0, 2)) this.shots.push({ ...b, target: t, hits: new Set(), wait: (b.wait || 0) + 0.1, trail: [] });
    }
    if (id === "enchantress" && this.has(h, "twinHeart")) for (const b of ns) if (b.target) { const t = this.pickFront(this.upperVis(0.6).filter((e) => e !== b.target)); if (t) this.shots.push({ ...b, target: t, hits: new Set(), trail: [] }); }
    if (id === "half-goblin" && this.has(h, "returnDagger")) for (const b of ns) if (b.kind === "curve") this.later(0.6, () => {
      const from = b.target && !b.target.dead ? this.pos(b.target) : { x: b.x, y: b.y }, to = this.muzzle(h);
      this.c43.obj.push({ type: "line", h, x: from.x, y: from.y, tx: to.x, ty: to.y, sp: 700, hits: new Set(), img: projImg(h) });
    });
    if (id === "klaus") for (const b of ns) {
      if (b.tx === undefined) continue;
      if (this.has(h, "surpriseBox") && ++h.cnt.gift % 6 === 0) this.later(b.flyT || 0.7, () => this.burstAt(h, b.tx, b.ty, 88, 4, "#bfefff"));
      if (this.has(h, "secondBurst")) this.later((b.flyT || 0.7) + 1, () => this.burstAt(h, b.tx, b.ty, (h.def.w.radius || 40) * (1 + h.st.size), 0.6, "#bfefff"));
    }
    if (id === "dwarf") {
      for (const b of ns) if (this.has(h, "avalanche")) b.rocks = 0.25;
      // C53 (no. 114): one quake per throw, 150 % for each axe thrown; the 20 px push only near the wall
      if (this.has(h, "quakeReturn") && ns[0]) { const k = ns.length; this.later(ns[0].T || 1.8, () => {
        for (const e of this.visible().slice(0, 3)) this.hit(h, e, baseOf(h) * 1.5 * k);
        if (this.danger()) this.knock(20);
        this.shake = Math.max(this.shake, 6);
      }); }
    }
    if (id === "cassandra") {
      if (this.has(h, "hookDrag") && this.danger()) this.knock(15); // C53: only near the wall
      if (this.has(h, "thornSnare")) {
        const c = this.densest(70);
        if (c) { this.tangleT = Math.max(this.tangleT, 3); for (const x of [c, ...this.near(c, 4, 90)]) this.addDot(h, x, baseOf(h) * 0.3, 3); }
      }
    }
    if (id === "scout" && this.has(h, "volley") && h.cnt.shots % 4 === 0) {
      // C53: the scales above him (all of them if none), 3 arrows for each arrow he fires, full damage
      const up = this.upperVis(0.7), mx = this.muzzle(h).x, near = up.filter((e) => Math.abs(this.pos(e).x - mx) < 60), pool = near.length ? near : up;
      const N = 3 * ((h.def.w.count || 1) + h.st.count);
      for (let i = 0; i < N; i++) { const t = this.pickFront(pool); if (t) this.c43.obj.push({ type: "drop", h, e: t, y0: -30, t: 0, fall: 0.4 + i * 0.04, mult: 1, img: projImg(h) }); }
    }
    if (id === "crusader") for (const b of ns) {
      if (b.tx === undefined) continue;
      if (this.has(h, "consecrate")) this.later(b.flyT || 0.55, () => this.c43.zones.push({ x: b.tx, y: b.ty, r: 46, dps: baseOf(h) * 0.6, t: 3, tick: 0, hero: h, col: "#fff0b8", judge: true }));
    }
    if (id === "crusader" && this.has(h, "crusade") && ++h.cnt.slam % 4 === 0) {
      for (const b of ns.slice(0, 1)) for (let i = 0; i < 3; i++) {
        const t = this.densest(70, this.upperVis().filter((x) => dist(this.pos(x), { x: b.tx, y: b.ty }) > 80)) || this.randomOf(this.upperVis());
        if (!t) break;
        const q = this.pos(t);
        this.shots.push({ ...b, sx: q.x, sy: TOP - 60, x: q.x, y: TOP - 60, tx: q.x, ty: q.y, flyT: 0.4 + i * 0.12, t: 0, tick: 0, spin: 0, touched: false, stop: false });
      }
    }
    if (id === "szopin" || id === "tou-lak") for (const b of ns) { if (b.kind === "weave") { b.hook = id === "szopin" && this.has(h, "chainHook"); b.roar = id === "tou-lak" && this.has(h, "thunderRoar"); b.pvy = b.vy; } }
    if (id === "alchemist" && this.has(h, "mixedBrew")) {
      // C46: Pell hits with her best element; Mixed Brew gives each zone a second, random element of hers, tick by tick in turn
      const k = this.dk(null), els = h.els.filter((x) => x !== h.hitEl && !["ice", "rock", "nature"].includes(x) && DD.elBest([x], this.dEls[k], this.dImm[k]).m >= 1); // C53
      for (const b of ns) if (b.tx !== undefined && els.length) b.el2 = els[Math.floor(this.rnd() * els.length)];
    }
    if (id === "jack-frost" && this.has(h, "snowman")) for (const b of ns) { b.r0 = b.r; b.pvx = b.vx; b.pvy = b.vy; b.grow = true; }
  };

  /* ------------------------------------------------------------------ the six new attacks (Draft 38.4) */
  const NEW = {
    /** Lark: a note on the thickest part of the body rings out pulses that hit every scale within its ring. */
    pulse(h, o, vis) {
      const w = h.def.w, st = h.st;
      const t = this.densest(70) || this.pickFront(this.upperVis());
      if (!t) return void (h.cd = 0.15);
      this.c43.obj.push({ type: "pulse", h, e: t, n: w.n + st.count, gap: w.gap, r: w.r * (1 + st.size), next: 0.15, k: 0, echo: 0, img: projImg(h) });
      if (this.has(h, "charm") && this.danger()) this.frozen = Math.max(this.frozen, 0.3); // C53: the stop only near the wall
    },
    /** Hobb: relic discs ricochet off the edges of the screen for a few seconds, through every scale they cross. */
    pinball(h, o, vis) {
      const w = h.def.w, st = h.st, m = this.muzzle(h);
      const n = (w.count || 1) + st.count;
      for (let i = 0; i < n; i++) {
        const a = this.aimA + (i % 2 ? 1 : -1) * (0.35 + 0.18 * Math.floor(i / 2)) * (h.cnt.shots % 2 ? 1 : -1);
        this.c43.obj.push({ type: "pin", h, x: m.x, y: m.y, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, r: w.r * (1 + st.size) * (this.has(h, "bigaxe") ? 2 : 1), life: w.life + st.dur, hitAt: new Map(), spin: 0, img: projImg(h) });
      }
    },
    /** Plum: sweets rain onto scales and stick, nipping them. */
    rain(h, o, vis) {
      const w = h.def.w, st = h.st, m = this.muzzle(h);
      const pool = this.has(h, "wide") ? this.upperVis() : this.upperVis().filter((e) => Math.abs(this.pos(e).x - m.x) < 90);
      const L = pool.length ? pool : this.upperVis();
      if (!L.length) return void (h.cd = 0.15);
      const n = w.n + st.count + (this.has(h, "wide") ? 2 : 0); // C53: Sugar Storm, 2 more sweets
      for (let i = 0; i < n; i++) { const t = this.randomOf(L); if (t) this.c43.obj.push({ type: "stick", h, e: t, fall: 0.3 + i * 0.05, t: 0, life: w.dur + st.dur, tick: 0, img: projImg(h), rot: this.rnd() * 6 }); }
    },
    /** Tristan: a crescent blade wave across the whole width along the thickest row of the body (Twin Edge: an X). */
    sweep(h, o, vis) {
      const w = h.def.w, st = h.st;
      const t = this.densest(70);
      if (!t) return void (h.cd = 0.15);
      const p = this.pos(t), from = h.cnt.shots % 2 ? 1 : -1;
      const angs = this.has(h, "double") ? [-0.3, 0.3] : [0];
      // C53 (no. 114): Waves cards were never read — one more wave per Waves, each one coil row further, alternating sides
      const n = 1 + st.count;
      for (let i = 0; i < n; i++) {
        const off = i ? Math.ceil(i / 2) * (2 * DD.SEG_R + 2) * (i % 2 ? -1 : 1) : 0;
        for (const a of angs) this.c43.obj.push({ type: "sweep", h, cx: p.x, cy: p.y + off, a, from: i % 2 ? -from : from, u: -0.08 * i, dur: 0.35, band: w.band * (1 + st.size), hits: new Set(), main: i === 0 });
      }
      if (this.has(h, "tornado") && h.cnt.shots % 5 === 0) {
        const m = this.muzzle(h);
        this.c43.obj.push({ type: "tornado", h, x: p.x, y: p.y + 60, life: 2, tick: 0, r: 34 }); // C53: from the slash
      }
    },
    /** Granny: a clockwork ray sweeps across the field like a clock hand (Paradox: two more, 60 px either side). */
    clock(h, o, vis) {
      const w = h.def.w, st = h.st, m = this.muzzle(h);
      const dir = h.cnt.shots % 2 ? 1 : -1;
      const offs = this.has(h, "skyfall") ? [-60, 0, 60] : [0];
      for (const dx of offs) this.c43.obj.push({ type: "clock", h, ox: m.x + dx, oy: m.y - 10, a0: this.aimA - (w.arc / 2) * dir, a1: this.aimA + (w.arc / 2) * dir, u: 0, dur: w.t, width: w.width * (1 + st.size), hits: new Set() });
    },
    /** Rusk: a whirling axe climbs straight up his lane and grinds through every scale it meets. */
    whirl(h, o, vis) {
      const w = h.def.w, st = h.st, m = this.muzzle(h);
      const n = 1 + st.count;
      for (let i = 0; i < n; i++) this.c43.obj.push({ type: "whirl", h, x: m.x + (i - (n - 1) / 2) * 36, y: m.y - 10, vx: 0, vy: -w.speed, r: w.r * (1 + st.size), life: w.life + st.dur, age: 0, tick: 0, spin: 0, split: this.has(h, "splitsaw"), img: projImg(h) });
    },
  };

  /* ------------------------------------------------------------------ every frame */
  P.stepC43 = function (dt) {
    const T = this.time, vis = this.visible();
    this.stepRage(dt);
    // the old one-element code (zones, fx) follows the dragon in front
    if (this.dragons) { const k = this.dk(null); for (const h of this.heroes) if (h.hitBy) { h.hitEl = h.hitBy[k].el; h.elK = h.hitBy[k].m; } }
    // Mender's Bell (C44): every 10 s the wall heals a share of its HP
    if (this.mods.regen && (this.regenT -= dt) <= 0) { this.regenT = 10; if (this.wall > 0) this.wall = Math.min(this.wallMax, this.wall + this.wallMax * this.mods.regen); }
    // things that happen a moment later
    if (this.c43.later.length) { const due = this.c43.later.filter((x) => x.t <= T); this.c43.later = this.c43.later.filter((x) => x.t > T); for (const x of due) x.fn(); }
    // Time Stop: what the heroes dealt meanwhile lands at once
    if (this.timeStopT > 0 && (this.timeStopT -= dt) <= 0) {
      const g = this.heroes.find((x) => x.def.id === "time-traveler") || this.heroes[0];
      for (const e of this.body.slice()) if (e.pend) { const d = e.pend; e.pend = 0; e.hp -= d; const p = this.pos(e); if (this.texts.length < 48) this.texts.push({ x: p.x, y: p.y - 10, txt: DD.fmt(d), t: 0.8, max: 0.8, crit: true }); if (e.hp <= 0) this.kill(e, g); }
      this.shake = Math.max(this.shake, 8);
    }
    // damage over time: Poisoned, and the marks of Rainbow Road, Thorn Snare, Wildgrowth
    if ((this.dotTick = (this.dotTick || 0) - dt) <= 0) {
      this.dotTick = 0.25;
      for (const e of this.body.slice()) {
        if (e.dead) continue;
        if (e.pois > 0 && e.poisT > T) { const d = e.poisD * e.pois * 0.25 * (1 + (this.mods.poison || 0)); this.sumDamage(e, d, "#c46ae8"); this.deal(e.poisH, e, d); }
        if (e.dots && e.dots.length) {
          e.dots = e.dots.filter((x) => x.t > T);
          for (const x of e.dots) { if (e.dead) break; const d = this.dmgOf(x.h, x.dps * 0.25, e).d; this.sumDamage(e, d, x.h.def.col); this.deal(x.h, e, d); }
        }
      }
      // Scorch (Ysmay): every second a Burning scale sets the scale behind it Burning
      if ((this.scorchT = (this.scorchT || 0) - 0.25) <= 0) {
        this.scorchT = 1;
        const ys = this.heroes.find((x) => x.def.id === "sorceress" && x.onWall && this.has(x, "scorch"));
        if (ys) for (const e of this.body.slice()) if (e.st === "burn" && e.stT > T && e.burnH === ys) { const i = this.body.indexOf(e), b = this.body[i + 1]; if (b && !b.dead) this.ignite(ys, b, this.dmgOf(ys, baseOf(ys) * 0.5, b).d); } // C53: a fresh half-hit, also onto a scale already burning
      }
    }
    // the dragon held back: Sugar Rush (sweets), Holy Pin (a pinned spear)
    let hold = 1;
    if (this.danger()) { // C53: only near the wall
      const sticks = new Set(this.c43.obj.filter((x) => x.type === "stick" && x.t >= x.fall && this.has(x.h, "sugarRush")).map((x) => x.e)).size;
      if (sticks) hold = Math.min(hold, Math.max(0.7, 1 - 0.02 * sticks));
      if (this.waves.some((wv) => wv.type === "pin" && this.has(wv.hero, "holyPin"))) hold = Math.min(hold, 0.8);
      if (this.anyHas("nightmare") && this.body.filter((x) => x.sleepT > T).length >= 5) hold = Math.min(hold, 0.8);
    }
    if (hold < 1) { const cur = this.slowT > 0 ? this.slowF : 1; this.slowF = Math.min(cur, hold); this.slowT = Math.max(this.slowT, 0.2); }
    // the Rewind log keeps 4 s
    if (this.dmgLog.length > 6000 || (this.dmgLog.length && this.dmgLog[0] < T - 6)) { let i = 0; while (i < this.dmgLog.length && this.dmgLog[i] < T - 6) i += 2; this.dmgLog.splice(0, i); } // C53: 6 s

    // periodic Evo effects, and Hawk / Pack Hunt
    for (const h of this.heroes) {
      if (!h.onWall) continue;
      for (const p of h.per) if ((p.t -= dt) <= 0) { p.t = p.eff.every; if (vis.length) this.runPer(h, p.eff); }
      if (h.def.id === "scout" && this.has(h, "hawk") && (h.cnt.hawkT = (h.cnt.hawkT || 5) - dt) <= 0) {
        h.cnt.hawkT = 5;
        const t = vis.filter((e) => !e.dead).reduce((a, e) => (!a || e.hp > a.hp ? e : a), null); // C55: where the hawks dive (the toughest)
        if (t) { t.hawkT = T + 5; for (const n of this.neighbours(t)) n.hawkT = T + 5; const q = this.pos(t); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 60, 0.5, { grow: 0.5 }); }
      }
    }
    for (const s of this.summons) if (s.hero.def.id === "tracker" && this.has(s.hero, "packHunt") && (s.bite = (s.bite === undefined ? 3 : s.bite) - dt) <= 0) {
      s.bite = 3;
      const t = this.nearest(s, vis);
      if (t) { const q = this.pos(t); s.x = q.x; s.y = q.y + 20; this.hit(s.hero, t, baseOf(s.hero) * 2); this.fxImg("dd/fx_hit_nature_l.webp", q.x, q.y, 70, 0.3, { grow: 0.4 }); }
    }
    // older shots that C43 cards change: Avalanche rocks, Chain Hook, Thunder Roar, Snowman
    for (const b of this.shots) {
      const h = b.hero;
      if (!h) continue;
      if (b.rocks !== undefined && (b.rocks -= dt) <= 0) { b.rocks = 0.25; this.c43.zones.push({ x: b.x, y: b.y, r: 22, dps: baseOf(h) * 1, t: 2, tick: 0, hero: h, col: "#c49a62", rock: true }); }
      if (b.hook && (b.hookT = (b.hookT || 0) - dt) <= 0) {
        b.hookT = 0.3;
        const m = this.muzzle(h);
        for (const e of vis) { const q = this.pos(e); if (segD(q.x, q.y, m.x, m.y, b.x, b.y) < e.r + 4) this.hit(h, e, baseOf(h) * 0.4, true); }
      }
      if (b.roar) { if (b.pvy > 0 && b.vy < 0) { for (const e of vis.slice(0, 5)) this.hit(h, e, baseOf(h)); if (this.danger() && (this.roarCd || 0) <= T) { this.knock(10); this.roarCd = T + 1; } this.fx.push({ x: b.x, y: b.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#ffe24a", ring: 70 }); } b.pvy = b.vy; }
      if (b.grow) { if (Math.sign(b.vx) !== Math.sign(b.pvx) || Math.sign(b.vy) !== Math.sign(b.pvy)) b.r = Math.min(b.r0 * 2, b.r * 1.25); b.pvx = b.vx; b.pvy = b.vy; } // C53: +25 % a bounce
    }
    // the Philosopher's Stone: two of Pell's zones of different elements that touch make a Reaction cloud
    const pz = this.zones.filter((z) => z.el && this.has(z.hero, "reactionCloud"));
    for (let i = 0; i < pz.length; i++) for (let j = i + 1; j < pz.length; j++) {
      const a = pz[i], b = pz[j];
      if (a.el === b.el || a.cloud === b || b.cloud === a || dist(a, b) > a.r + b.r) continue;
      a.cloud = b; b.cloud = a;
      this.c43.zones.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: Math.max(a.r, b.r), dps: baseOf(a.hero) * 2, t: Math.min(a.t, b.t), tick: 0, hero: a.hero, col: "#ffffff", cloud: true });
    }

    // C43 zones (holy ground, rocks, poison clouds, lava, Burning Trail lines …)
    this.c43.zones = this.c43.zones.filter((z) => {
      z.t -= dt;
      if ((z.tick -= dt) <= 0) {
        z.tick = 0.25;
        for (const e of vis) {
          if (e.dead) continue;
          const q = this.pos(e);
          const inside = z.line ? Math.abs(q.y - z.y) < z.band + e.r * 0.4 : dist(q, z) < z.r + e.r * 0.6;
          if (!inside) continue;
          this.hit(z.hero, e, z.dps * 0.25, true);
          if (z.judge) { e.judgeT = T + 3; e.judgeK = Math.max(e.judgeK || 0, DD.STATUS.holy.per); }
        }
      }
      return z.t > 0;
    });
    // C43 objects: the new attacks and the big Evo effects
    // C53: objects made while stepping (Berserker's split axes …) were thrown away by the filter
    const cur = this.c43.obj; this.c43.obj = [];
    const keep = cur.filter((o) => this.stepObj(o, dt, vis) !== false);
    this.c43.obj = keep.concat(this.c43.obj);
    this.c43.fly = this.c43.fly.filter((f) => (f.t += dt) < f.dur);
  };

  P.stepObj = function (o, dt, vis) {
    if (o.a55) { const A = DD.ATK55 && DD.ATK55[o.a55]; return A && A.step ? A.step.call(this, o, dt, vis) : false; } // C55
    const h = o.h, T = this.time;
    if (o.type === "pulse") {
      if (o.e.dead) { const t = this.near(o.e, 1, 120)[0]; if (!t) return false; o.e = t; }
      if ((o.next -= dt) > 0) return true;
      if (o.k >= o.n) return false;
      o.next = o.gap;
      const p = this.pos(o.e), mult = this.has(h, "crescendo") ? Math.min(2, Math.pow(1.25, o.k)) : 1; // C53: up to ×2 (with Pulses cards it grew without end)
      let n = 0;
      for (const e of vis) if (dist(this.pos(e), p) < o.r + e.r * 0.5) { this.hit(h, e, h.def.w.dmg * mult); n++; }
      // C47 (user no. 96): a painted pulse ring (2a/fx/atk_pulse) instead of the canvas ring
      if (ready(DD.img(ATK_IMG("pulse")))) this.fxImg(ATK_IMG("pulse"), p.x, p.y, o.r * 2.3, 0.34, { grow: 0.35 });
      else this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.32, max: 0.32, col: h.def.col, ring: o.r });
      o.k++;
      if (n >= 4 && this.has(h, "echo") && o.echo < 3) { o.echo++; o.n++; }
      return true;
    }
    if (o.type === "pin") {
      o.life -= dt;
      o.spin += dt * 14;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      let bounced = false;
      if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); bounced = true; }
      if (o.x > this.W - o.r) { o.x = this.W - o.r; o.vx = -Math.abs(o.vx); bounced = true; }
      if (o.y < TOP - 40) { o.y = TOP - 40; o.vy = Math.abs(o.vy); bounced = true; }
      // C47 (user no. 96): the discs bounce where the body is (80 px under its lowest visible scale), not over the empty field
      let low = TOP + 160; for (const e of vis) { const q = this.pos(e); if (q.y > low) low = q.y; }
      const floor = Math.min((this.formY || this.H * 0.8) - 40, low + 80);
      if (o.y > floor) { o.y = floor; o.vy = -Math.abs(o.vy); bounced = true; }
      if (bounced && this.has(h, "relicShards")) { const t0 = this.nearest(o, vis); if (t0) for (const t of [t0, ...this.near(t0, 1, 160)]) this.hit(h, t, baseOf(h) * 0.6); }
      for (const e of vis) {
        if (e.dead || dist(this.pos(e), o) > o.r + e.r) continue;
        if ((o.hitAt.get(e) || -9) > T - 0.3) continue;
        o.hitAt.set(e, T);
        this.hit(h, e, h.def.w.dmg);
      }
      return o.life > 0;
    }
    if (o.type === "stick") {
      o.t += dt;
      if (o.e.dead) { const t = this.near(o.e, 1, 90)[0]; if (!t) return false; o.e = t; }
      if (o.t < o.fall) return true;
      if ((o.tick -= dt) <= 0) { o.tick = h.def.w.tick; this.hit(h, o.e, h.def.w.dmg, true); }
      return o.t < o.fall + o.life;
    }
    if (o.type === "sweep") {
      o.u += dt / o.dur;
      const W = this.W, x = o.from > 0 ? -20 + (W + 40) * o.u : W + 20 - (W + 40) * o.u, y = o.cy + Math.tan(o.a) * (x - o.cx);
      o.x = x; o.y = y;
      for (const e of vis) {
        if (o.hits.has(e) || e.dead) continue;
        const q = this.pos(e), ly = o.cy + Math.tan(o.a) * (q.x - o.cx);
        if (Math.abs(q.x - x) < 34 && Math.abs(q.y - ly) < o.band + e.r * 0.5) { o.hits.add(e); this.hit(h, e, h.def.w.dmg); }
      }
      if (o.u >= 1) {
        if (this.has(h, "fireLine") && o.main && o.a <= 0) this.c43.zones.push({ line: true, y: o.cy, band: o.band, x: W / 2, r: W, dps: baseOf(h) * 0.4, t: 2, tick: 0, hero: h, col: "#ff8a3a" });
        return false;
      }
      return true;
    }
    if (o.type === "tornado") {
      o.life -= dt;
      o.y -= 160 * dt;
      if ((o.tick -= dt) <= 0) { o.tick = 0.25; for (const e of vis) if (dist(this.pos(e), o) < o.r + e.r) this.hit(h, e, baseOf(h) * 2); }
      return o.life > 0 && o.y > TOP - 60;
    }
    if (o.type === "clock") {
      o.u += dt / o.dur;
      const a = o.a0 + (o.a1 - o.a0) * Math.min(1, o.u);
      o.a = a;
      for (const e of vis) {
        if (o.hits.has(e) || e.dead) continue;
        const q = this.pos(e);
        if (this.onRay({ x: o.ox, y: o.oy }, a, q, o.width + e.r * 0.8)) { o.hits.add(e); this.hit(h, e, h.def.w.dmg * (1 + h.st.size)); } // C53: a wider ray stays on a scale longer
      }
      return o.u < 1;
    }
    if (o.type === "whirl") {
      o.age += dt;
      o.life -= dt;
      o.spin += dt * 18;
      let touch = false;
      for (const e of vis) if (!e.dead && dist(this.pos(e), o) < o.r + e.r) { touch = true; break; }
      const v = touch ? o.vy * 0.25 : o.vy; // it slows down while it grinds a scale
      o.x += o.vx * dt;
      o.y += v * dt;
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.25;
        const k = this.has(h, "berserk") ? 1 + Math.min(1, 0.1 * o.age) : 1;
        let any = null;
        for (const e of vis) if (!e.dead && dist(this.pos(e), o) < o.r + e.r) { this.hit(h, e, h.def.w.dps * 0.25 * k, true); any = e; }
        if (any && o.split) {
          o.split = false;
          for (const s of [-1, 1]) this.c43.obj.push({ ...o, vx: s * 140, vy: o.vy * 0.8, life: o.life * 0.8, split: false, age: 0 });
        }
      }
      return o.life > 0 && o.y > TOP - 60 && o.x > -40 && o.x < this.W + 40;
    }
    if (o.type === "line") {
      const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
      if (d < 10) return false;
      o.x += (dx / d) * o.sp * dt;
      o.y += (dy / d) * o.sp * dt;
      o.ang = Math.atan2(dy, dx);
      for (const e of vis) if (!o.hits.has(e) && !e.dead && dist(this.pos(e), o) < e.r + 8) { o.hits.add(e); this.hit(h, e, h.def.w.dmg); }
      return true;
    }
    if (o.type === "drop") {
      o.t += dt;
      if (o.e.dead) { const t = this.near(o.e, 1, 120)[0]; if (!t) return false; o.e = t; }
      if (o.t < o.fall) return true;
      this.hit(h, o.e, (h.def.w.dmg || baseOf(h)) * o.mult * (o.bigK || 1));
      if (o.status) { const el = h._el; h._el = o.status; this.mark(h, o.e, 0); h._el = el; }
      if (o.exp) { o.e.expT = T + 0.6; o.e.expEl = o.exp; }
      const q = this.pos(o.e);
      this.fxImg(o.fxImg || `dd/fx_hit_${HIT_EL[o.exp || h.hitEl] || "phys"}_l.webp`, q.x, q.y, o.size || 60, 0.3, { grow: 0.4 });
      return false;
    }
    if (o.type === "roll") {
      // Jawbreaker / Avalanche: rolls down the body from the head, hitting each scale once
      o.acc += dt * 18;
      while (o.acc >= 1 && o.i < this.body.length) {
        o.acc--;
        const e = this.body[o.i++];
        if (e && o.d === undefined) o.d = e.d; // no. 102: it rolls down one dragon, the one whose head it started on
        if (e && e.d !== o.d) { o.i = this.body.length; break; }
        if (!e || e.dead || e.s <= this.enterOf(e)) continue;
        o.x = this.pos(e).x; o.y = this.pos(e).y;
        this.hit(h, e, baseOf(h) * o.mult, true);
      }
      if (o.freeze && !o.froze) { o.froze = true; this.frozen = Math.max(this.frozen, o.freeze); }
      return o.i < this.body.length;
    }
    if (o.type === "beamSweep") {
      o.u += dt / o.dur; // C55 (no. 118): the sky opens everywhere at once; no light runs left to right any more
      if ((o.tick -= dt) <= 0) { o.tick = 0.25; for (const e of vis) this.hit(h, e, baseOf(h) * o.mult * 0.25, true); } // C53: every scale on the screen
      return o.u < 1;
    }
    if (o.type === "lane") {
      o.y -= 520 * dt;
      for (const e of vis) { const q = this.pos(e); if (!o.hits.has(e) && Math.abs(q.x - o.x) < 26 && Math.abs(q.y - o.y) < 30) { o.hits.add(e); this.hit(h, e, baseOf(h) * o.mult); if (o.status) { const el = h._el; h._el = o.status; this.mark(h, e, 0); h._el = el; } } }
      return o.y > TOP - 80;
    }
    return false;
  };

  /** One periodic Evo effect (Draft 38.5: "every N s …"). */
  P.runPer = function (h, e) {
    const T = this.time, vis = this.visible(), b = baseOf(h);
    const withStatus = (t) => { if (!e.status) return; const el = h._el; h._el = e.status; this.mark(h, t, b * e.mult); h._el = el; };
    if (e.fx === "screen") {
      this.flyby(h, e.sprite);
      for (const t of vis) {
        this.hit(h, t, b * e.mult, true);
        withStatus(t);
        if (e.mark === "sleep") { t.sleepT = T + 2; if (this.has(h, "lucid")) { t.st = "wet"; t.stT = T + 2; t.curseT = T + 2; } }
      }
      if (e.heal) this.wall = Math.min(this.wallMax, this.wall + this.wallMax * e.heal);
      this.shake = Math.max(this.shake, 6);
    } else if (e.fx === "sweep") this.c43.obj.push({ type: "beamSweep", h, u: 0, dur: e.t, mult: e.mult, tick: 0, x: -20 });
    else if (e.fx === "roll") this.c43.obj.push({ type: "roll", h, i: 0, acc: 0, mult: e.mult, freeze: e.freeze || 0, sprite: e.sprite, x: 0, y: 0 });
    else if (e.fx === "dense") {
      const t = this.densest(e.r || 90);
      if (!t) return;
      const q = this.pos(t);
      this.c43.fly.push({ h, img: EVO_IMG(e.sprite || "meteor"), x0: q.x + 120, y0: TOP - 140, x1: q.x, y1: q.y, t: 0, dur: 0.45, size: 90 });
      this.later(0.45, () => {
        this.burstAt(h, q.x, q.y, e.r, e.mult, "#ff8a3a");
        this.shake = Math.max(this.shake, 9);
        if (e.zone) this.c43.zones.push({ x: q.x, y: q.y, r: e.r * 0.8, dps: b * e.zone, t: e.zoneT || 3, tick: 0, hero: h, col: "#ff6a2a", lava: true });
      });
    } else if (e.fx === "lanes") {
      for (let i = 0; i < e.n; i++) this.c43.obj.push({ type: "lane", h, x: ((i + 0.5) * this.W) / e.n, y: (this.formY || this.H * 0.8) - 20, mult: e.mult, status: e.status, hits: new Set(), sprite: e.sprite });
    } else if (e.fx === "front") {
      this.flyby(h, e.sprite, true);
      for (const t of vis.slice(0, e.n)) { this.hit(h, t, b * e.mult); withStatus(t); }
      this.shake = Math.max(this.shake, 8);
    } else if (e.fx === "axeRain") {
      for (let i = 0; i < e.n; i++) { const t = this.randomOf(vis); if (!t) break; const q = this.pos(t); this.c43.zones.push({ x: q.x, y: q.y, r: 30, dps: b * e.mult, t: e.t, tick: 0.2 + i * 0.05, hero: h, col: "#c8d8e8", axe: true }); }
    } else if (e.fx === "flasks") {
      const els = ["fire", "water", "nature", "electric", "physical", "ice", "poison"];
      for (let i = 0; i < e.n; i++) { const t = this.randomOf(vis); if (t) this.c43.obj.push({ type: "drop", h, e: t, t: 0, fall: 0.35 + i * 0.07, mult: e.mult, exp: els[Math.floor(this.rnd() * els.length)], img: projImg(h) }); }
    } else if (e.fx === "spears") {
      for (let i = 0; i < e.n; i++) { const t = this.randomOf(vis); if (t) this.c43.obj.push({ type: "drop", h, e: t, t: 0, fall: 0.3 + i * 0.05, mult: e.mult, img: projImg(h), size: 70 }); }
    } else if (e.fx === "markFront") {
      for (const t of vis.slice(0, Math.max(1, Math.round(this.body.length * e.frac)))) t.goldT = T + e.t;
      this.flyby(h, "gold");
    } else if (e.fx === "slow") {
      h.howlT = T + e.t; // C53: Spirit Howl, the wolves deal ×2
      if (!this.danger()) return;
      const cur = this.slowT > 0 ? this.slowF : 1;
      this.slowF = Math.min(cur, e.x);
      this.slowT = Math.max(this.slowT, e.t);
      this.fx.push({ x: this.W / 2, y: this.H / 2, vx: 0, vy: 0, t: 0.5, max: 0.5, col: h.def.col, ring: this.W * 0.5 });
    } else if (e.fx === "rewind") {
      let sum = 0;
      for (let i = 0; i < this.dmgLog.length; i += 2) if (this.dmgLog[i] >= T - e.back) sum += this.dmgLog[i + 1];
      if (this.danger()) this.knock(e.push); // C53: only near the wall
      const front = vis.slice(0, 8);
      for (const t of front) this.deal(h, t, sum / Math.max(1, front.length));
      this.flyby(h, "clock");
    } else if (e.fx === "timestop") {
      this.timeStopT = e.t;
      this.timeStopK = e.mult;
      this.frozen = Math.max(this.frozen, e.t);
      this.flyby(h, "clock");
    } else if (e.fx === "buff") {
      h.buffT = T + e.t;
      h.buffFlags = e.flags || [];
      h.countMul = e.countMul || 1;
      this.later(e.t, () => { h.countMul = 1; });
      this.flyby(h, "dragonform");
    }
  };
  /** A big painted creature or light crossing the screen for an Evo effect (picture from 2a/fx/evo_<name>.webp). */
  P.flyby = function (h, name, low) {
    const y = low ? (this.formY || this.H * 0.8) - 120 : TOP + 60 + this.rnd() * 120;
    const l2r = this.rnd() < 0.5;
    this.c43.fly.push({ h, img: EVO_IMG(name || "light"), x0: l2r ? -80 : this.W + 80, y0: y, x1: l2r ? this.W + 80 : -80, y1: y - 40, t: 0, dur: 0.9, size: 150, flip: !l2r });
  };

  /* ------------------------------------------------------------------ drawing */
  P.drawC43 = function (g) {
    const T = this.time;
    for (const z of this.c43.zones) {
      g.globalAlpha = Math.min(1, z.t / 0.4) * (z.cloud ? 0.4 : 0.32);
      g.fillStyle = z.col;
      g.beginPath();
      if (z.line) g.rect(0, z.y - z.band, this.W, z.band * 2);
      else g.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    for (const o of this.c43.obj) {
      if (o.a55) { const A = DD.ATK55 && DD.ATK55[o.a55]; if (A && A.draw) A.draw.call(this, g, o); continue; } // C55
      const h = o.h, col = h.def.col || "#fff";
      if (o.type === "pulse" && !o.e.dead) {
        const p = this.pos(o.e);
        if (ready(o.img)) { g.save(); g.translate(p.x, p.y - 26); g.drawImage(o.img, -14, -14, 28, 28); g.restore(); }
      } else if (o.type === "pin" || o.type === "whirl") {
        g.save(); g.translate(o.x, o.y); g.rotate(o.spin);
        if (ready(o.img)) g.drawImage(o.img, -o.r * 1.2, -o.r * 1.2, o.r * 2.4, o.r * 2.4);
        else { g.fillStyle = col; g.beginPath(); g.arc(0, 0, o.r, 0, Math.PI * 2); g.fill(); }
        g.restore();
      } else if (o.type === "stick" && !o.e.dead) {
        const p = this.pos(o.e), q = Math.min(1, o.t / o.fall), y = TOP - 40 + (p.y - (TOP - 40)) * q;
        g.save(); g.translate(p.x, q < 1 ? y : p.y); g.rotate(o.rot);
        if (ready(o.img)) g.drawImage(o.img, -12, -12, 24, 24); else { g.fillStyle = col; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill(); }
        g.restore();
      } else if (o.type === "sweep" && ready(DD.img(ATK_IMG("crescent")))) {
        const im = DD.img(ATK_IMG("crescent")), sz = o.band * 3.2;
        g.save(); g.translate(o.x, o.y); g.rotate(o.a); if (o.from < 0) g.scale(-1, 1);
        g.globalAlpha = 0.95; g.drawImage(im, -sz / 2, -sz / 2, sz, sz); g.restore();
      } else if (o.type === "sweep") {
        g.save(); g.translate(o.x, o.y); g.rotate(o.a);
        g.globalAlpha = 0.9; g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 14;
        g.beginPath(); g.arc(o.from > 0 ? -14 : 14, 0, o.band * 1.2, o.from > 0 ? -1.1 : Math.PI - 1.1, o.from > 0 ? 1.1 : Math.PI + 1.1); g.stroke();
        g.restore();
      } else if (o.type === "tornado" && ready(DD.img(ATK_IMG("tornado")))) {
        const im = DD.img(ATK_IMG("tornado")), sz = o.r * 2.8;
        g.save(); g.translate(o.x, o.y); g.scale(1 + Math.sin(T * 14) * 0.05, 1); g.drawImage(im, -sz / 2, -sz * 0.6, sz, sz * 1.2); g.restore();
      } else if (o.type === "tornado") {
        g.save(); g.globalAlpha = 0.6; g.fillStyle = "#ff8a3a"; g.shadowColor = "#ff6a2a"; g.shadowBlur = 18;
        g.beginPath(); g.ellipse(o.x, o.y, o.r * 0.7, o.r * 1.3, Math.sin(T * 12) * 0.2, 0, Math.PI * 2); g.fill(); g.restore();
      } else if (o.type === "clock" && ready(DD.img(ATK_IMG("clockray")))) {
        const im = DD.img(ATK_IMG("clockray")), dial = DD.img(ATK_IMG("clockdial")), L = 1400, wd = Math.max(26, o.width * 3.2);
        g.save(); g.globalAlpha = 0.95 * (1 - Math.max(0, o.u - 0.8) * 5); g.translate(o.ox, o.oy); g.rotate(o.a + Math.PI / 2);
        g.drawImage(im, -wd / 2, -L, wd, L);
        if (ready(dial)) { g.rotate(-(o.a + Math.PI / 2)); g.drawImage(dial, -24, -24, 48, 48); }
        g.restore();
      } else if (o.type === "clock") {
        const L = 1400, x2 = o.ox + Math.cos(o.a) * L, y2 = o.oy + Math.sin(o.a) * L;
        g.save(); g.globalAlpha = 0.85 * (1 - Math.max(0, o.u - 0.8) * 5); g.strokeStyle = col; g.lineWidth = o.width; g.shadowColor = "#fff0b8"; g.shadowBlur = 16;
        g.beginPath(); g.moveTo(o.ox, o.oy); g.lineTo(x2, y2); g.stroke(); g.restore();
      } else if (o.type === "line" || o.type === "drop") {
        let x = o.x, y = o.y;
        if (o.type === "drop") { if (o.e.dead) continue; const p = this.pos(o.e), q = Math.min(1, o.t / o.fall); x = p.x; y = -30 + (p.y + 30) * q * q; }
        if (ready(o.img)) { g.save(); g.translate(x, y); g.rotate(o.type === "line" ? o.ang || 0 : Math.PI / 2); g.drawImage(o.img, -14, -14, 28, 28); g.restore(); }
      } else if (o.type === "roll") {
        const im = DD.img(EVO_IMG(o.sprite || "jawbreaker"));
        if (ready(im)) g.drawImage(im, o.x - 34, o.y - 34, 68, 68);
        else { g.save(); g.fillStyle = "#ffd6f0"; g.shadowColor = col; g.shadowBlur = 16; g.beginPath(); g.arc(o.x, o.y, 28, 0, Math.PI * 2); g.fill(); g.restore(); }
      } else if (o.type === "beamSweep") {
        // C55 Sunrise: shafts of light fall from the open sky over the whole field together, swell and fade (no sweep)
        const im = DD.img(ATK_IMG("pillar")), a = Math.sin(Math.min(1, o.u) * Math.PI);
        g.save(); g.globalCompositeOperation = "lighter";
        for (let k = 0; k < 5; k++) {
          const x = this.W * (0.1 + 0.2 * k), w = 70 + 20 * Math.sin(this.time * 3 + k);
          g.globalAlpha = (0.55 + 0.25 * Math.sin(this.time * 5 + k * 1.7)) * a;
          if (ready(im)) g.drawImage(im, x - w / 2, 0, w, this.H);
          else { g.fillStyle = "#fff0b8"; g.fillRect(x - w / 4, 0, w / 2, this.H); }
        }
        g.restore();
      } else if (o.type === "lane") {
        const im = DD.img(EVO_IMG(o.sprite || "beast"));
        if (ready(im)) g.drawImage(im, o.x - 30, o.y - 30, 60, 60);
        else { g.save(); g.fillStyle = "#ffe24a"; g.shadowColor = "#ffe24a"; g.shadowBlur = 14; g.beginPath(); g.ellipse(o.x, o.y, 14, 24, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
    }
    for (const f of this.c43.fly) {
      const u = f.t / f.dur, x = f.x0 + (f.x1 - f.x0) * u, y = f.y0 + (f.y1 - f.y0) * u;
      const im = DD.img(f.img);
      g.save(); g.globalAlpha = Math.min(1, (1 - u) * 3, u * 6);
      if (ready(im)) { g.translate(x, y); if (f.flip) g.scale(-1, 1); g.drawImage(im, -f.size / 2, -f.size / 2, f.size, f.size); }
      else { g.fillStyle = f.h.def.col || "#fff"; g.shadowColor = g.fillStyle; g.shadowBlur = 30; g.beginPath(); g.arc(x, y, f.size * 0.25, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    g.globalAlpha = 1;
    // marks a player should see: Branded, gold, asleep, stone (a small ring on the scale)
    for (const e of this.body) {
      if (e.s <= this.enterOf(e)) continue;
      // marks first, then the new statuses (Chilled, Poisoned, Cursed, Judged) until they have their own paintings (C43 G5)
      const c = e.brandT > T ? "#ff4a6a" : e.goldT > T ? "#ffd24a" : e.sleepT > T ? "#9ab0ff" : e.stoneT > T ? "#b0a090" : e.hawkT > T ? "#ffffff"
        : e.chillT > T && e.chill > 0 ? "#a8ecff" : e.pois > 0 && e.poisT > T ? "#c46ae8" : e.curseT > T ? "#8b7bd8" : e.judgeT > T ? "#fff0b8" : null;
      if (!c) continue;
      const p = this.pos(e);
      // C46: the new statuses have their paintings now (2a/fx, ChatGPT A43); a mark of a hero (Brand, gold, sleep, Hawk) keeps its ring
      const st = e.brandT > T || e.goldT > T || e.sleepT > T || e.hawkT > T ? null : e.stoneT > T ? "stoned" : e.chillT > T && e.chill > 0 ? "chilled" : e.pois > 0 && e.poisT > T ? "poisoned" : e.curseT > T ? "cursed" : e.judgeT > T ? "judged" : null;
      const sim = st && DD.img(`2a/fx/${st}.webp`);
      if (sim && ready(sim)) { glow(g, sim, p.x, p.y, e.r * 2.7, 0.9); continue; }
      g.save(); g.globalAlpha = 0.85; g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath(); g.arc(p.x, p.y, e.r * 0.95, 0, Math.PI * 2); g.stroke(); g.restore();
    }
  };
})();
