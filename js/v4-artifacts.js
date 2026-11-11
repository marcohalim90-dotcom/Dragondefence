/* Rancangan v4, tahap B5 Artifact (Ledger Confirmed C56, 2026-11-10; user: "ya lanjutkan", then "go" for B2 / B3 / B5).
   Design: docs/rancangan-v4/05-artifact.md (G5) and 10-uji-terbuka.md §2 (Thief's Lockpick gives a Fuse Stone).
   - Artifact = a rule for the whole party, equipment = numbers. The 30 artifacts keep their names and paintings; every effect is new and
     grows by one rule: Lv L = Lv 1 × (1 + 0.5 (L − 1)), so Lv 10 = 5.5 × Lv 1 and no level is empty. An element artifact adds DMG to
     the hits of its element (the engine's element is the hit's: a two-element hero gets it when it hits with that element) and twists
     that element's status.
   - Tier names as the heroes: Common, Rare, Epic, Legendary, Mythic (were Fine, Superior, Rare, Epic; same artifacts in each).
     The 4 Mythic stay locked (C95.3): no chest gives them, the game does not show them, a worn one does nothing.
   - Relic Dust per tier: the first copy opens an artifact at Lv 1, every later copy becomes 1 Dust of its tier; the player spends the
     Dust of a tier on any artifact of that tier. No Unlock step, no Disassemble.
   - Artifact Chest 300 gems, ×10 = 2,700: Common 52 %, Rare 31 %, Epic 13 %, Legendary 4 %; pity: an Epic or better at the latest at
     the 10th chest, a Legendary at the latest at the 50th (counted since the last one).
   - Slots: 3 from Stage 2, 4 from Stage 40, 5 from Stage 80 (Dev: 5).
   Save: everything v4 lives in S.v4a = { items: { id: lv }, dust: { tier: n }, pityE, pityL, opened }, seeded once from the old
   S.coll.items (a level never drops, spare copies become Dust of the new tier). S.coll is never written, so the save still plays the
   same without ?v4. Behind the v4 switch (DD.V4), on for everyone since B6 (?v3 = the old rules).
   Loaded after js/v4-core.js, v4-dragons.js and v4-heroes.js: the battle wrappers here sit outside theirs. js/screens.js and
   js/items-page.js read DD.v4a for the Artifacts page, the Shop card, the chest result and items.html. */
(function () {
  if (!DD.V4) return;

  /* ------------------------------------------------------------ tiers, Dust, chest, slots (G5 §3–4) */
  const OLD_TIER = { fine: "common", superior: "rare", rare: "epic", epic: "legendary", mythic: "mythic" };
  const TIERS = ["common", "rare", "epic", "legendary"]; // released, in chest order
  DD.COLL_TIERS = { common: { name: "Common", w: 52 }, rare: { name: "Rare", w: 31 }, epic: { name: "Epic", w: 13 }, legendary: { name: "Legendary", w: 4 }, mythic: { name: "Mythic", w: 0 } };
  const A = (DD.v4a = {
    TIERS,
    ODDS: { common: 0.52, rare: 0.31, epic: 0.13, legendary: 0.04 },
    PITY_E: 10, // an Epic or better at the latest at this chest
    PITY_L: 50, // a Legendary at the latest at this chest
    /** Relic Dust for Lv 2, 3 … 10 (Mythic: Lv 2–3) */
    DUST: { common: [1, 2, 2, 3, 3, 4, 4, 5, 5], rare: [1, 1, 2, 2, 2, 2, 3, 3, 3], epic: [1, 1, 1, 1, 2, 2, 2, 2, 2], legendary: [1, 1, 1, 1, 1, 1, 1, 1, 1], mythic: [1, 1] },
    SLOTS: [[80, 5], [40, 4], [0, 3]], // [Stage cleared, slots]
    CHEST_GEMS: 300,
    CHEST10_GEMS: 2700,
    STONE: 0.25, // Thief's Lockpick: a Fuse Stone 1 time in 4 per Chest scale
  });
  const pc = (v) => +(v * 100).toFixed(2) + "%";
  const grow = (v1) => (lv) => v1 * (1 + 0.5 * (Math.max(1, lv) - 1));
  A.tierName = (t) => (DD.COLL_TIERS[t] || {}).name || t;

  /* ------------------------------------------------------------ the 26 released artifacts (G5 §5.1–5.4)
     fx = what it raises (P.party: el_*, boss, crit, area, dur, haste; P.artMods: the rest); tw = its twist in the battle (mods.v4a). */
  const EFF = {
    // Common
    lucky_coin: { fx: "coin", v1: 0.06, lab: "Coins", line: (x) => `Coins from scales +${x}.` },
    thiefs_lockpick: { fx: "chestCoin", tw: "lock", v1: 0.2, lab: "Chest coins", line: (x) => `Chest scales give +${x} coins and a Fuse Stone 1 time in 4.` },
    alchemists_flask: { fx: "burn", tw: "flask", v1: 0.1, lab: "Burning", line: (x) => `Burning deals +${x} and lasts 1 s longer.` },
    hunters_trophy: { fx: "boss", v1: 0.08, lab: "Head DMG", line: (x) => `Head DMG +${x}.` },
    ember_stone: { fx: "el_fire", tw: "ember", v1: 0.03, line: (x) => `Fire hits deal +${x}. A Burning scale sets the scale behind it Burning once.`,
      note: "Only a scale that was not Burning spreads, to the next scale toward the tail; that scale does not spread on." },
    tide_pearl: { fx: "el_water", tw: "tide", v1: 0.03, line: (x) => `Water hits deal +${x}. Wet lasts 2 s longer.` },
    thorn_seed: { fx: "el_nature", tw: "thorn", v1: 0.03, line: (x) => `Nature hits deal +${x}. Entangled scales take +10% from every hero.` },
    storm_shard: { fx: "el_electric", tw: "storm", v1: 0.03, line: (x) => `Electric hits deal +${x}. Every 10th Electric hit jumps to 2 more scales.`,
      note: "Counts the Electric hits of the whole party; the jump deals that hit's damage." },
    iron_rivet: { fx: "el_physical", tw: "rivet", v1: 0.03, line: (x) => `Physical hits deal +${x}. Cracked stacks up to 5 (not 3).` },
    // Rare
    frostfire_ember: { fx: "react", v1: 0.1, lab: "Reactions", line: (x) => `Reactions (Overload, Steam, Wildfire, Shatter …) deal +${x}.` },
    frost_crystal: { fx: "el_ice", tw: "frost", v1: 0.03, line: (x) => `Ice hits deal +${x}. 2 Chilled stacks freeze the dragon (not 3); the freeze stays 0.4 s.` },
    quarry_stone: { fx: "el_rock", tw: "quarry", v1: 0.03, line: (x) => `Rock hits deal +${x}. Near the wall, Staggered pushes twice as far.` },
    viper_fang: { fx: "poison", tw: "viper", v1: 0.1, lab: "Poisoned", line: (x) => `Poisoned deals +${x} and stacks up to 7 (not 5).` },
    shadow_lantern: { fx: "el_dark", tw: "lantern", v1: 0.03, line: (x) => `Dark hits deal +${x}. A crit on a Cursed scale deals ×3 (not ×2).` },
    saints_relic: { fx: "el_holy", tw: "saint", v1: 0.03, line: (x) => `Holy hits deal +${x}. Judged lasts 2 s longer.` },
    rune_die: { fx: "odds", v1: 0.003, lab: "Odds per refresh", line: (x) => `Each Free Refresh moves +${x} more of the card odds from Rare to the other tiers (normally ${pc(DD.REROLL_STEP)}).`,
      note: "Rare loses the whole step, Epic, Legendary and Mythic each get a third of it, for the rest of the battle." },
    // Epic
    dragon_scale: { fx: "wallPct", v1: 0.1, lab: "Wall HP", line: (x) => `Wall HP +${x}.` },
    phoenix_feather: { fx: "phoenix", v1: 0.15, lab: "Wall HP back", sign: "", line: (x) => `Once a battle, when the wall falls, it comes back with ${x} of its HP.` },
    wyrm_tooth: { fx: "el_dragon", tw: "wyrm", v1: 0.04, line: (x) => `Dragon-element hits deal +${x}. Awed lasts 1 s longer.` },
    winter_heart: { fx: "winter", tw: "winter", v1: 0.04, lab: "Chilled DMG", line: (x) => `Chilled scales take +${x} from every hero.` },
    guild_charter: { fx: "crit", v1: 0.03, lab: "Crit Chance", line: (x) => `Crit Chance +${x} for every hero.` },
    menders_bell: { fx: "regen", v1: 0.01, lab: "Heal every 10 s", sign: "", line: (x) => `Every 10 s the wall heals ${x} of its HP.`, note: "A broken wall does not heal." },
    // Legendary
    void_hourglass: { fx: "slow", v1: 0.03, lab: "Dragon speed", sign: "−", line: (x) => `Every dragon moves ${x} slower.` },
    titans_belt: { fx: "area", v1: 0.06, lab: "Area", line: (x) => `Area +${x} for every hero.` },
    chronos_sand: { fx: "dur", v1: 0.06, lab: "Duration", line: (x) => `Duration +${x} for every hero.` },
    crown_of_wings: { fx: "haste", v1: 0.04, lab: "Haste", line: (x) => `Haste +${x} for every hero.` },
  };
  /* the 4 Mythic (G5 §5.5): 3 levels, locked; their numbers only show on items.html */
  const mythicOdds = (k) => Object.fromEntries(DD.cardOdds(k)).mythic;
  const MYTH = {
    dragon_compass: { fx: "call", v: (lv) => Math.min(3, Math.max(1, lv)), lab: "Hero Call Refresh", num: (v) => "+" + v,
      line: (v) => `Hero Call shows 1 more hero and has ${v} more Hero Call Refresh${v === 1 ? "" : "es"}.`, note: "Hero Call usually shows 3 heroes." },
    royal_seal: { fx: "refresh", v: (lv) => Math.min(3, Math.max(1, lv)), lab: "Free Refresh", num: (v) => "+" + v,
      line: (v) => `Every battle has ${v} more Free Refresh${v === 1 ? "" : "es"}.`, note: `Every battle has ${DD.FREE_REFRESH} Free Refreshes.` },
    // the engine: an Evo Card can show once the hero has DD.EVO_FROM − evoEarly cards in the battle (js/battle-c43.js)
    sages_lens: { fx: "evoEarly", v: (lv) => Math.min(3, Math.max(1, lv)), lab: "Evo Card after", num: (v) => `${DD.EVO_FROM - (v >= 3 ? 2 : 1)} cards${v >= 2 ? " · 80%" : ""}`,
      line: (v) => `A hero's Evo Card can be offered once it has ${DD.EVO_FROM - (v >= 3 ? 2 : 1)} cards in the battle (normally ${DD.EVO_FROM})` +
        (v >= 2 ? `, and is offered ${pc(DD.EVO_PICK + 0.2)} of the time (normally ${pc(DD.EVO_PICK)}).` : ".") },
    fates_coin: { fx: "oddsStart", v: (lv) => 2 * Math.min(3, Math.max(1, lv)), lab: "Mythic at start", num: (v) => pc(mythicOdds(v)),
      line: (v) => `Every battle starts with Mythic card odds ${pc(mythicOdds(v))} (normally ${pc(mythicOdds(0))}).` },
  };
  for (const c of DD.COLLECTION) {
    c.tier = OLD_TIER[c.tier] || c.tier;
    delete c.copies;
    delete c.note;
    const e = EFF[c.id], m = MYTH[c.id];
    if (e) {
      const el = e.fx.startsWith("el_") ? e.fx.slice(3) : null;
      Object.assign(c, { fx: e.fx, tw: e.tw || null, v: grow(e.v1), max: DD.COLL_MAX, lab: e.lab || DD.ELEMENT_NAME[el] + " DMG",
        num: (v) => (e.sign === undefined ? "+" : e.sign) + pc(v), line: (v) => e.line(pc(v)) });
      if (e.note || el) c.note = e.note || "A hero with two elements gets it when it hits with this element.";
    }
    if (m) Object.assign(c, m, { tw: null, max: 3 });
  }

  /* ------------------------------------------------------------ words the screens use (js/screens.js, js/items-page.js) */
  A.oddsPairs = () => TIERS.map((t) => [t, A.tierName(t), pc(A.ODDS[t])]);
  A.INFO = ["Artifacts", [
    ["Artifacts", [
      ["icons/icon_artifact_phoenix_feather.webp", `${DD.RELEASED.length} artifacts`, "Each one changes the battle for the whole party: one element's hits and its status, the wall, the dragons' speed, coins …"],
      ["icons/icon_artifact_royal_seal.webp", "Worn", "<em>3</em> at a time; a 4th place opens at Stage <em>40</em>, a 5th at Stage <em>80</em>. Tap one to wear it or take it off."],
      ["dd/icon_coll_chest.webp", "Artifact Chests", "Sold only in the Shop, for gems: Common 52%, Rare 31%, Epic 13%, Legendary 4%. Every 10 chests give an Epic or better, every 50 a Legendary."],
      ["2a/ic_artifacts.webp", "Relic Dust", "A copy you already own becomes 1 Dust of its tier. Dust levels up any artifact of that tier, up to Lv 10."],
    ]],
  ]];

  /* ------------------------------------------------------------ the player's side (js/state.js API, overridden) */
  const P = DD.P;
  if (P && P.get) {
    const Sv = () => P.get();
    const blank = () => ({ items: {}, dust: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 }, pityE: 0, pityL: 0, opened: 0 });
    /** S.v4a, seeded once from the old copies (G5 §8): a level never drops, spare copies become Dust; S.coll stays as it was */
    const st = () => {
      const s = Sv();
      if (s.v4a && s.v4a.items && s.v4a.dust) return s.v4a;
      const a = blank();
      for (const [id, it] of Object.entries((s.coll && s.coll.items) || {})) {
        const c = DD.COLL[id];
        if (!c || !it) continue;
        let lv = it.lv || 0, spare = it.copies || 0;
        if (!lv && spare > 0) { lv = 1; spare--; }
        if (!lv) continue;
        a.items[id] = Math.min(lv, c.max || DD.COLL_MAX);
        a.dust[c.tier] = (a.dust[c.tier] || 0) + spare;
      }
      s.v4a = a;
      return a;
    };
    A.state = st;
    A.dust = (t) => st().dust[t] || 0;
    A.slots = () => { const s = Sv(); if (s.devAll) return 5; for (const [at, n] of A.SLOTS) if ((s.cleared || 0) >= at) return n; return 3; };
    /** chests until the pity: an Epic or better within n, a Legendary within m */
    A.pity = () => { const a = st(); return { epic: A.PITY_E - a.pityE, legendary: A.PITY_L - a.pityL }; };
    Object.defineProperty(DD, "ART_WORN", { configurable: true, get: () => A.slots() });

    const owned = (id) => !!DD.COLL[id] && !DD.COLL[id].locked && (st().items[id] || 0) > 0;
    P.collLv = (id) => st().items[id] || 0;
    /** v4: the Relic Dust this artifact can spend (0 while it is not found) */
    P.collCopies = (id) => (owned(id) ? A.dust(DD.COLL[id].tier) : 0);
    /** v4: the Dust for its next level; null when not found, locked or at the top */
    P.collNeed = (id) => {
      if (!owned(id)) return null;
      const c = DD.COLL[id], lv = P.collLv(id);
      return lv >= (c.max || DD.COLL_MAX) ? null : A.DUST[c.tier][lv - 1];
    };
    P.collUp = (id) => {
      const need = P.collNeed(id), a = st();
      if (need === null) return false;
      const t = DD.COLL[id].tier;
      if ((a.dust[t] || 0) < need) return false;
      a.dust[t] -= need;
      a.items[id]++;
      P.save();
      return true;
    };
    /** one chest's tier with the pity (counted since the last Epic+ / Legendary) */
    A.roll = (a, rnd) => {
      const r = rnd || Math.random, nE = a.pityE + 1, nL = a.pityL + 1;
      let t;
      if (nL >= A.PITY_L) t = "legendary";
      else if (nE >= A.PITY_E) t = r() < A.ODDS.legendary / (A.ODDS.epic + A.ODDS.legendary) ? "legendary" : "epic";
      else { let x = r(); t = TIERS[TIERS.length - 1]; for (const k of TIERS) if ((x -= A.ODDS[k]) < 0) { t = k; break; } }
      if (t === "legendary") { a.pityE = 0; a.pityL = 0; } else if (t === "epic") { a.pityE = 0; a.pityL = nL; } else { a.pityE = nE; a.pityL = nL; }
      return t;
    };
    /** opens n chests: ids, with .res = [{ id, tier, isNew }] for the result box ("New" / "+1 Common Dust") */
    A.open = (n, rnd) => {
      const a = st(), s = Sv(), out = [];
      out.res = [];
      for (let k = 0; k < n; k++) {
        const t = A.roll(a, rnd), pool = DD.RELEASED.filter((x) => x.tier === t), c = pool[Math.floor((rnd || Math.random)() * pool.length)];
        a.opened++;
        const isNew = !a.items[c.id];
        if (isNew) {
          a.items[c.id] = 1;
          const w = P.worn();
          if (w.length < A.slots()) s.arts = [...w, c.id]; // a new artifact goes on while a place is free
        } else a.dust[t] = (a.dust[t] || 0) + 1;
        out.push(c.id);
        out.res.push({ id: c.id, tier: t, isNew });
      }
      P.save();
      return out;
    };
    P.buyArtChest = (n) => {
      const s = Sv(), ten = n >= 10, cost = ten ? A.CHEST10_GEMS : A.CHEST_GEMS * n;
      if (s.gems < cost) return null;
      s.gems -= cost;
      return A.open(ten ? 10 : n);
    };
    /** Artifact Chests an old save still holds (Patrol before 2026-11-02) open with the v4 odds */
    P.openCollChest = (n) => {
      const s = Sv();
      n = Math.min(n, s.coll.chests);
      if (n <= 0) return [];
      s.coll.chests -= n;
      return A.open(n);
    };
    P.worn = () => (Sv().arts || []).filter((id, i, l) => owned(id) && l.indexOf(id) === i).slice(0, A.slots());
    P.wear = (id) => {
      if (!owned(id)) return "none";
      const s = Sv();
      s.arts = P.worn();
      if (s.arts.includes(id)) { s.arts = s.arts.filter((x) => x !== id); P.save(); return "off"; }
      if (s.arts.length >= A.slots()) return "full";
      s.arts.push(id);
      P.save();
      return "on";
    };
    /** What the worn artifacts do inside a battle (the party attributes come through P.party: element DMG, Head DMG, Crit, Area,
        Duration, Haste). mods.v4a = the twists, read by the battle wrappers below. */
    P.artMods = () => {
      const m = { coin: 0, chestCoin: 0, burn: 0, react: 0, phoenix: 0, slow: 0, refresh: 0, callPick: 3, callRefresh: 0, poison: 0, freeze: 0, odds: 0, oddsStart: 0,
        evoPick: 0, evoEarly: 0, regen: 0, wallPct: 0, v4a: {} };
      for (const id of P.worn()) {
        const c = DD.COLL[id], v = c.v(P.collLv(id));
        if (c.tw) m.v4a[c.tw] = v;
        if (c.fx === "odds") m.odds += v / DD.REROLL_STEP; // extra odds steps per Free Refresh (js/battle-c43.js)
        else if (typeof m[c.fx] === "number") m[c.fx] += v;
      }
      return m;
    };
    /** Dragon Scale: Wall HP +X % (the whole wall: heroes, Party Level, equipment) */
    const bm0 = P.battleMods;
    if (bm0) P.battleMods = () => { const b = bm0(); const w = b.wallPct || 0; if (w) { b.hpMul *= 1 + w; b.hpFlat *= 1 + w; } return b; };
    const wall0 = P.wallHP;
    if (wall0) P.wallHP = () => wall0() * (1 + (P.artMods().wallPct || 0));
    /** Thief's Lockpick: the stones a battle found. B4 turns S.stones into Fuse Stones (G6); until then they count as S.stones. */
    const end0 = P.endRun;
    if (end0) P.endRun = (n, r, double, hard) => {
      const out = end0(n, r, double, hard), k = (r && r.fuseStones) || 0;
      if (k) { Sv().stones += k; out.stones = (out.stones || 0) + k; P.save(); }
      return out;
    };
  }

  /* ------------------------------------------------------------ the battle: the twists (mods.v4a) */
  const B = DD.Battle && DD.Battle.prototype;
  if (!B) return;
  /** Statuses read their numbers from DD.STATUS: inside one step of a battle the worn artifacts change them, then they go back. */
  const step0 = B.step;
  B.step = function (dt) {
    const a = this.mods && this.mods.v4a, S = DD.STATUS;
    if (!a) return step0.call(this, dt);
    const keep = [];
    const set = (o, k, v) => { if (!o) return; keep.push([o, k, o[k]]); o[k] = v; };
    if (a.flask && S.fire) { this.v4aFireK = (S.fire.t + 1) / S.fire.t; set(S.fire, "t", S.fire.t + 1); } // Alchemist's Flask: 1 s longer, same burn a second
    if (a.tide && S.water) set(S.water, "t", S.water.t + 2); // Tide Pearl
    if (a.rivet && S.physical) set(S.physical, "max", 5); // Iron Rivet
    if (a.frost && S.ice) set(S.ice, "stacks", 2); // Frost Crystal (the freeze itself stays DD.FREEZE_MAX)
    if (a.quarry && S.rock && this.danger && this.danger()) set(S.rock, "push", S.rock.push * 2); // Quarry Stone, near the wall
    if (a.viper && S.poison) set(S.poison, "max", 7); // Viper Fang
    if (a.saint && S.holy) set(S.holy, "t", S.holy.t + 2); // Saint's Relic
    if (a.wyrm && S.dragon) set(S.dragon, "t", S.dragon.t + 1); // Wyrm Tooth
    try { return step0.call(this, dt); } finally { for (let i = keep.length - 1; i >= 0; i--) keep[i][0][keep[i][1]] = keep[i][2]; }
  };
  /** Thorn Seed, Winter Heart, Shadow Lantern; the hit's own damage for Storm Shard */
  const dmg0 = B.dmgOf;
  B.dmgOf = function (h, base, e) {
    const a = this.mods && this.mods.v4a;
    if (!a || !e) return dmg0.call(this, h, base, e);
    const T = this.time, cursed = a.lantern && e.curseT > T;
    const r = dmg0.call(this, h, base, e);
    let k = 1;
    if (a.thorn && e.st === "tangle" && e.stT > T) k *= 1.1;
    if (a.winter && e.chillT > T && e.chill > 0) k *= 1 + a.winter;
    if (cursed && r.crit) { const m = h.critMul + ((h.st && h.st.critDmg) || 0); if (m > 0) k *= (m + 1) / m; } // ×3 instead of ×2
    r.d *= k;
    const rec = this.v4aRec;
    if (rec && rec.e === e && rec.d === null) rec.d = r.d;
    return r;
  };
  /** Storm Shard: every 10th Electric hit of the party jumps to the 2 nearest scales for the same damage */
  const hit0 = B.hit;
  B.hit = function (h, e, base, quiet) {
    const a = this.mods && this.mods.v4a;
    if (!a || !a.storm || !e || e.dead) return hit0.call(this, h, e, base, quiet);
    const el = this.elOf(h, e).el, rec = { e, d: null }, prev = this.v4aRec;
    this.v4aRec = rec;
    try { hit0.call(this, h, e, base, quiet); } finally { this.v4aRec = prev; }
    if (el !== "electric" || rec.d === null || !(rec.d > 0)) return;
    this.v4aN = (this.v4aN || 0) + 1;
    if (this.v4aN % 10) return;
    const p = this.pos(e);
    for (const t of this.near(e, 2, 180)) {
      if ((this.dImm[this.dk(t)] || []).includes("electric")) continue;
      const q = this.pos(t);
      this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2.5, t: 0.22, max: 0.22, col: "#ffe24a", zig: true });
      this.deal(h, t, rec.d);
    }
  };
  /** Alchemist's Flask (the same burn a second for 1 s longer) and Ember Stone (a scale that catches fire lights the one behind it) */
  const ign0 = B.ignite;
  B.ignite = function (h, e, pool) {
    const a = this.mods && this.mods.v4a;
    if (!a || !e) return ign0.call(this, h, e, pool);
    const T = this.time, fresh = !(e.st === "burn" && e.stT > T);
    if (a.flask && this.v4aFireK && !this.v4aSpread) pool *= this.v4aFireK;
    ign0.call(this, h, e, pool);
    if (!a.ember || !fresh || this.v4aSpread) return;
    const i = this.body.indexOf(e), t = i >= 0 ? this.body[i + 1] : null;
    if (!t || t.dead || !this.sameOut(t, e) || (t.st === "burn" && t.stT > T) || (this.dImm[this.dk(t)] || []).includes("fire")) return;
    this.v4aSpread = true;
    try { this.ignite(h, t, pool); } finally { this.v4aSpread = false; }
    this.v4aSpreads = (this.v4aSpreads || 0) + 1;
  };
  /** Thief's Lockpick: a Fuse Stone 1 time in 4 when a Chest scale falls */
  const kill0 = B.kill;
  B.kill = function (e, h) {
    const chest = e && !e.dead && e.special === "chest";
    const r = kill0.call(this, e, h);
    const a = this.mods && this.mods.v4a;
    if (chest && e.dead && a && a.lock && this.rnd() < A.STONE) {
      this.v4aStones = (this.v4aStones || 0) + 1;
      const p = this.pos(e);
      if (this.texts.length < 44) this.texts.push({ x: p.x, y: p.y - 58, txt: "+1 Fuse Stone", t: 1.2, max: 1.2, coin: true });
    }
    return r;
  };
  /** the stones go with the battle's result to P.endRun */
  const fin0 = B.finish;
  B.finish = function (win) {
    const n = this.v4aStones || 0, on = this.on, end = on && on.end;
    if (!n || !end || this.state === "over") return fin0.call(this, win);
    on.end = (r) => end.call(on, { ...r, fuseStones: n });
    try { return fin0.call(this, win); } finally { on.end = end; }
  };
})();
