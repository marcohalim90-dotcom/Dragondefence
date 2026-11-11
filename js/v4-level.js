/* Rancangan v4, tahap B4 Level dan equipment (Ledger Confirmed C56; user "ya lanjut" 2026-11-11): docs/rancangan-v4/06-level.md
   (rules) and 09-alur-ui-equipment.md (the screens use what is here).
   - One price rule (G6 §3): a stage's budget B(n) = Laju(n) × W(n) coins; a hero level = 18 % of B(2 Lv − 3), a Training level = 25 % of
     B(T + 1), a Tier Up = 3.8 % of B(1 + 26 × (rarity + (tier − 1) ÷ 19)). Laju(n) = 1 up to Stage 8, +0.02 a stage, 2.5 from Stage 83.
   - Party Training (G6 §6): one level, ATK × 1.02 a level without end; every 10 levels a Rank, ATK × 1.10. The Crit and Haste lines and
     the Rank perks are gone.
   - Party Level (G6 §7, G7 §4.5): EXP 80 + 32 n a Normal win; Lv L → L + 1 needs 30 L Laju(L) + 200; ATK × 1.012 a level to Lv 100,
     then × 1.008. ATK party = 1,000 × (Training × Rank × Party Level) on screen (G1 §2.1).
   - Equipment (G6 §5): 5 rarities named like the heroes (Common, Rare, Epic, Legendary, Mythic; the save's index is kept, so a piece
     keeps its value: old Normal = Common … old Legendary = Mythic, old Mythic = Mythic 19 tiers up); every piece gives ATK points (Weapon
     40, Amulet 20, others 10 at Common Tier 1), Helm and Armor also Wall HP (30 / 50), Gloves Crit +1.5 % and Boots Haste +3 % fixed;
     rarity ×2, tier × 2^(1/19) (Tier 20 = ×2 = next rarity Tier 1); Tier Up costs coins only; Fuse = two pieces of one name at Tier 20,
     or one and 20 × 2^rarity Fuse Stones; effects only on the Weapon (Epic 1, Legendary 2, Mythic 3, fixed numbers); Disassemble gives
     2^rarity Fuse Stones. Enhance (slot levels), Enchant and Forge Ore are gone; Fuse Stone = the save's stone counter (S.stones).
   - Save: v4 keeps its own Training level in S.v4b; on the first v4 load the Forge Ore joins the Fuse Stones. The slot levels' coins come
     back at the B6 switch (G6 §13), not before.
   Behind the v4 switch (DD.V4), on for everyone since B6 (?v3 = the old rules). Loaded after js/v4-artifacts.js. */
(function () {
  if (!DD.V4) return;
  const V = DD.v4, P = DD.P;
  const L = (V.lv = {});

  /* ------------------------------------------------------------ prices (G6 §3) */
  L.laju = (n) => Math.min(2.5, Math.max(1, 1 + (n - 8) / 50));
  L.W = (n) => 223 * n;
  L.budget = (n) => L.laju(n) * L.W(n);
  const r10 = (x) => Math.round(x / 10) * 10, r5 = (x) => Math.round(x / 5) * 5;
  /** coins for hero Lv lv → lv + 1 (the same for every tier, G6 §2.1) */
  L.heroPrice = (lv) => { const n = Math.max(1, 2 * lv - 3); return Math.max(10, r10(40 * n * L.laju(n))); };
  /** coins for Training T → T + 1 */
  L.trainPrice = (T) => Math.max(10, r10(55 * (T + 1) * L.laju(T + 1)));
  DD.lvCoins = L.heroPrice;
  const enh0 = DD.enhanceCost; // the old slot-level prices, for the coins the B6 switch gives back

  /* ------------------------------------------------------------ equipment (G6 §5) */
  const Q = Math.pow(2, 1 / 19);
  L.RARITY = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
  // the save keeps its rarity index (0–5); v4 names and colours by index; old Mythic (5) = Mythic 19 tiers up
  DD.GEAR_RARITY = ["common", "rare", "epic", "legendary", "mythic", "mythic"];
  Object.assign(DD.GEAR_RARITY_NAME, { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic" });
  DD.MYTHIC = 4;
  /** the rarity and tier a piece counts as */
  L.rt = (g) => (g.r >= 5 ? { r: 4, t: (g.tier || 1) + 19 } : { r: g.r, t: g.tier || 1 });
  L.BASE = { weapon: 40, amulet: 20, helm: 10, armor: 10, gloves: 10, boots: 10 }; // ATK points at Common Tier 1
  L.HP = { helm: 30, armor: 50 }; // Wall HP at Common Tier 1
  L.FIXED = { gloves: { crit: 0.015 }, boots: { haste: 0.03 } }; // the same at every rarity and tier (G6 §2.6)
  L.mult = (g) => { const { r, t } = L.rt(g); return Math.pow(2, r) * Math.pow(Q, t - 1); };
  /** ATK points of a piece (1 point = 0.1 % ATK for its hero) */
  L.atkPts = (g) => L.BASE[g.slot] * L.mult(g);
  L.hpOf = (g) => (L.HP[g.slot] || 0) * L.mult(g);
  L.tierTop = (g) => (L.rt(g).r >= 4 ? Infinity : 20);
  DD.tierTop = L.tierTop;
  /** Tier t → t + 1, coins only */
  L.tierPrice = (g) => { const { r, t } = L.rt(g), n = 1 + 26 * (r + (t - 1) / 19); return Math.max(5, r5(8.5 * n * L.laju(n))); };
  DD.tierUpCost = (g) => ({ coins: L.tierPrice(g), stones: 0 });
  DD.TIER_MULT = (t) => Math.pow(Q, Math.max(1, t) - 1);
  /** what a piece is worth in the old numbers (the old screens and Auto Equip compare with this): its ATK as a fraction */
  DD.gearValue = (g) => L.atkPts(g) / 1000;
  /** Weapon effects: Epic 1, Legendary 2, Mythic 3; fixed by rarity (G6 §5.4) */
  L.FX = { dragonbane: [0.05, 0.08, 0.12], keen: [0.1, 0.15, 0.2], reach: [0.04, 0.06, 0.08], linger: [0.04, 0.06, 0.08], swift: [0.02, 0.03, 0.04],
    el_fire: [0.04, 0.06, 0.08], el_water: [0.04, 0.06, 0.08], el_electric: [0.04, 0.06, 0.08], el_nature: [0.04, 0.06, 0.08], el_physical: [0.04, 0.06, 0.08] };
  L.fxCount = (g) => (g.slot !== "weapon" ? 0 : Math.max(0, L.rt(g).r - 1));
  /** a piece's v4 effects (kept in g.fx4, its old list untouched): its old weapon effects first, then picked by its id */
  L.fxOf = (g) => {
    const want = L.fxCount(g);
    if (!want) return [];
    let list = (g.fx4 || (g.fx || []).filter((k) => L.FX[k])).slice(0, want);
    const keys = Object.keys(L.FX);
    for (let i = 0; list.length < want && i < keys.length * 2; i++) { const k = keys[((g.uid || 1) * 7 + i * 3) % keys.length]; if (!list.includes(k)) list.push(k); }
    g.fx4 = list;
    return list;
  };
  L.fxVal = (k, g) => (L.FX[k] || [0, 0, 0])[Math.min(2, L.rt(g).r - 2)] || 0;
  DD.fxValue = (k, g) => (typeof g === "object" ? L.fxVal(k, g) : (L.FX[k] || [0])[0]);
  DD.fxCount = (r) => Math.max(0, Math.min(3, r - 1));
  // names: material by rarity up to Epic, the Legendary name from Legendary (a Mythic keeps it)
  DD.artName = (g) => { const r = L.rt(g).r; return r >= 3 ? DD.EQ_LEGEND[g.type || g.slot] : `${DD.EQ_MAT[r]} ${g.type ? DD.WEAPON_TYPES[g.type] : DD.EQ_NOUN[g.slot]}`; };
  DD.eqKey = (g) => `${g.slot}:${g.type || ""}:${L.rt(g).r}`;
  /** how good a piece is: its multiplier (the same for every slot) plus a little per effect */
  L.score = (g) => (g ? L.mult(g) * (1 + 0.05 * L.fxOf(g).length) : 0);
  /** Fuse Stones that stand in for the twin (G6 §5.5) */
  L.fuseStoneCost = (g) => 20 * Math.pow(2, L.rt(g).r);
  if (!P) return; // pages without the save (items.html): the numbers and names above only
  P.artScore = L.score;
  /** what one hero's pieces give that hero (G6 §5.2): ATK, Wall HP (to the wall), Gloves Crit, Boots Haste, Weapon effects */
  P.heroGear = (id) => {
    const t = { atk: 0, hp: 0, crit: 0, critDmg: 0, haste: 0, area: 0, dur: 0, boss: 0, el: {} };
    for (const sl of DD.SLOTS) {
      const g = P.gearOf(id)[sl.id];
      if (!g) continue;
      t.atk += L.atkPts(g) / 1000;
      t.hp += L.hpOf(g);
      for (const [k, v] of Object.entries(L.FIXED[g.slot] || {})) t[k] += v;
      for (const k of L.fxOf(g)) {
        const s = DD.EQ_FX[k].stat, v = L.fxVal(k, g);
        if (s.startsWith("el_")) t.el[s.slice(3)] = (t.el[s.slice(3)] || 0) + v; else t[s] += v;
      }
    }
    return t;
  };

  /* ------------------------------------------------------------ Fuse Stone, Fuse, Disassemble */
  const S = () => P.get();
  L.stones = () => S().stones || 0;
  /** the twin in the Bag: the same name, Tier 20; never a piece another hero wears */
  P.fuseMate = (g) => (g && L.tierTop(g) === 20 && g.tier >= 20 && S().bag.find((x) => x !== g && x.uid !== g.uid && DD.eqKey(x) === DD.eqKey(g) && x.tier >= 20)) || null;
  L.canFuse = (g) => !!g && L.tierTop(g) === 20 && g.tier >= 20 && (!!P.fuseMate(g) || L.stones() >= L.fuseStoneCost(g));
  /** Fuse: with the twin if there is one, else with Fuse Stones; the result is the next rarity at Tier 1, the same ATK */
  P.fuse = (gid, useStones) => {
    const g = P.findArt(gid);
    if (!g || L.tierTop(g) !== 20 || g.tier < 20) return null;
    const m = useStones ? null : P.fuseMate(g);
    if (m) S().bag.splice(S().bag.indexOf(m), 1);
    else { const c = L.fuseStoneCost(g); if (L.stones() < c) return null; S().stones -= c; }
    g.r++;
    g.tier = 1;
    g.fx4 = null;
    L.fxOf(g);
    P.save();
    return g;
  };
  P.canTierUp = (g) => !!g && g.tier < L.tierTop(g) && S().coins >= L.tierPrice(g);
  P.tierUp = (gid) => {
    const g = P.findArt(gid);
    if (!P.canTierUp(g)) return false;
    S().coins -= L.tierPrice(g);
    g.tier++;
    P.save();
    return true;
  };
  /** Tier Up All (G9 §4.2): the cheapest Tier Up first among the heroes given, as far as the coins go, at most 20 a tap */
  L.tierUpPlan = (ids) => {
    const pieces = ids.flatMap((id) => DD.SLOTS.map((sl) => P.gearOf(id)[sl.id]).filter(Boolean));
    const tiers = new Map(pieces.map((g) => [g, g.tier]));
    let coins = S().coins, n = 0, cost = 0;
    const steps = [];
    while (n < (DD.ONE_CLICK_MAX || 20)) {
      let best = null, bp = Infinity;
      for (const g of pieces) {
        const t = tiers.get(g);
        if (t >= L.tierTop(g)) continue;
        const p = L.tierPrice({ ...g, tier: t });
        if (p < bp) { bp = p; best = g; }
      }
      if (!best || bp > coins) break;
      coins -= bp; cost += bp; n++;
      tiers.set(best, tiers.get(best) + 1);
      steps.push(best);
    }
    return { n, cost, steps };
  };
  L.tierUpAll = (ids) => {
    const plan = L.tierUpPlan(ids);
    for (const g of plan.steps) { S().coins -= L.tierPrice(g); g.tier++; }
    if (plan.n) P.save();
    return plan;
  };
  L.dust = (g) => Math.pow(2, L.rt(g).r); // Fuse Stones from Disassemble
  P.disassemble = (gid, quiet) => {
    const i = S().bag.findIndex((g) => g.uid === gid);
    if (i < 0) return 0;
    const g = S().bag.splice(i, 1)[0], k = L.dust(g);
    S().stones = (S().stones || 0) + k;
    if (!quiet) P.save();
    return k;
  };
  /** a spare: no owned hero who can wear it would wear it, and it is not the twin of a worn piece (G9 §4.4) */
  L.isTwin = (g) => P.allWorn().some((w) => DD.eqKey(w) === DD.eqKey(g) && L.tierTop(w) === 20);
  L.isSpare = (g) => {
    if (L.isTwin(g)) return false;
    const users = Object.keys(S().heroes || {}).filter((id) => P.fits(g, id));
    return !users.some((id) => { const cur = P.gearOf(id)[g.slot]; return !cur || L.score(g) > L.score(cur); });
  };
  L.spares = () => S().bag.filter(L.isSpare);
  P.disassembleWeaker = () => { let k = 0; for (const g of L.spares()) k += P.disassemble(g.uid, true); P.save(); return k; };
  /** a full Bag breaks its weakest spare first (a piece somebody raised goes last), into Fuse Stones */
  P.addGear = (g) => {
    const bag = S().bag;
    if (g.r >= 4) g.r = 3; // Mythic only from a Fuse (G6 §5.1); the drop odds come in B6
    bag.push(g);
    while (bag.length > DD.BAG_MAX) {
      const sp = bag.filter((x) => x !== g && L.isSpare(x)), pool = sp.length ? sp : bag;
      const weakest = pool.reduce((a, x) => (L.score(x) < L.score(a) ? x : a), pool[0]);
      if (weakest === g) g.broken = true;
      L.broken.n++;
      L.broken.stones += P.disassemble(weakest.uid, true);
    }
    return g;
  };
  L.broken = { n: 0, stones: 0 };
  P.takeBroken = () => { const b = { n: L.broken.n, ore: 0, stones: L.broken.stones }; L.broken.n = 0; L.broken.stones = 0; return b; };
  /** the party hero a piece is better for (G9 §5.1, the reward box's Equip), or null */
  L.betterFor = (g) => {
    for (const id of P.formation()) { if (!P.fits(g, id)) continue; const cur = P.gearOf(id)[g.slot]; if (!cur || L.score(g) > L.score(cur)) return id; }
    return null;
  };
  /** G9 §5.1 reward box: the new pieces that beat what a party hero wears, one per hero and slot, strongest piece first
   *  (two Amulets in one chest go to two heroes, never both to the same slot) */
  L.rewardPlan = (list) => {
    const worn = {}, out = [], score = (id, sl) => { const k = id + ":" + sl; return k in worn ? worn[k] : L.score(P.gearOf(id)[sl]); };
    const fresh = (list || []).filter((g) => !g.broken && S().bag.includes(g)).sort((x, y) => L.score(y) - L.score(x));
    for (const g of fresh) for (const id of P.formation()) {
      if (!P.fits(g, id) || L.score(g) <= score(id, g.slot)) continue;
      out.push({ g, hid: id, cur: P.gearOf(id)[g.slot] || null }); worn[id + ":" + g.slot] = L.score(g); break;
    }
    return out;
  };
  /** a worn piece of a party hero that can Fuse now (G9 §5.7 red dot) */
  L.fuseReady = (id) => DD.SLOTS.some((sl) => { const g = P.gearOf(id)[sl.id]; return g && g.tier >= 20 && L.tierTop(g) === 20 && L.canFuse(g); });
  /** Auto Equip All (G9 §5.3): each party hero in party order takes its best pieces */
  L.equipAllParty = () => { const by = {}; for (const id of P.formation()) { const n = P.equipAll(id); if (n) by[id] = n; } return by; };
  const dots0 = P.dots;
  P.dots = () => {
    const d = dots0();
    d.heroes = P.unlocked("heroes") && (Object.keys(S().heroes).some((id) => P.canLv(id)) || P.formation().some((id) => P.betterFor(id) || L.fuseReady(id)));
    d.party = false; // Training ranks by itself now; a Tier Up or Train that is affordable gets no dot (G9 §5.7)
    return d;
  };

  /* ------------------------------------------------------------ Party Training (G6 §6) and Party Level (G6 §7, G7 §4.5) */
  const st = () => { const s = S(); if (!s.v4b) s.v4b = {}; return s.v4b; };
  L.T = () => st().train || 0;
  L.rank = () => Math.floor(L.T() / 10);
  L.trainMul = (T = L.T()) => Math.pow(1.02, T) * Math.pow(1.1, Math.floor(T / 10));
  L.plMul = (lv = S().pl.lv) => Math.pow(1.012, Math.min(lv, 100) - 1) * Math.pow(1.008, Math.max(0, lv - 100));
  L.atkMul = () => L.trainMul() * L.plMul();
  L.canTrain = () => S().coins >= L.trainPrice(L.T());
  L.train = () => { if (!L.canTrain()) return false; S().coins -= L.trainPrice(L.T()); st().train = L.T() + 1; P.quest("train"); P.save(); return true; };
  DD.PL_EXP = (lv) => Math.round(30 * lv * L.laju(lv) + 200);
  DD.runExp = (n, p) => Math.round((80 + 32 * n) * (p >= 1 ? 1 : 0.2 + 0.8 * Math.max(0, p)));
  P.trainCost = () => L.trainPrice(L.T());
  P.canTrain = () => L.canTrain();
  P.train = () => L.train();
  P.canRank = () => false;
  P.rankUp = () => false;
  P.oneClickTrain = () => { let n = 0; while (n < (DD.ONE_CLICK_MAX || 20) && L.train()) n++; return n; };
  /** the party attributes: the old ones without the old Training, Rank perks, slot levels and Party Level; ATK = their v4 product */
  const party0 = P.party;
  P.party = () => {
    const s = S(), keep = [s.training, s.slotLv, s.pl.lv];
    s.training = { atk: 0, crit: 0, haste: 0, rank: 0 }; s.slotLv = {}; s.pl.lv = 1;
    let t;
    try { t = party0(); } finally { [s.training, s.slotLv, s.pl.lv] = keep; }
    t.atk = (1 + t.atk) * L.atkMul() - 1;
    return t;
  };
  /** A = ATK party × (1 + ATK points of the hero's pieces ÷ 1,000) (G1 §2.1): the battle adds g.atk to dmgMul, so g.atk carries dmgMul */
  const bm0 = P.battleMods;
  P.battleMods = () => { const b = bm0(); for (const g of Object.values(b.gear || {})) g.atk *= b.dmgMul; return b; };

  /* ------------------------------------------------------------ the save, once (G6 §13) */
  {
    const s = S(), v = st();
    if (!v.conv) {
      const tr = s.training || {};
      v.train = Math.ceil(((tr.atk || 0) + (tr.crit || 0) + (tr.haste || 0)) / 3);
      v.oreMoved = s.ore || 0;
      s.stones = (s.stones || 0) + (s.ore || 0);
      s.ore = 0;
      v.conv = 1;
      P.save();
    }
  }
  /** the slot levels' coins, given back at the B6 switch (G6 §13) */
  L.slotRefund = () => { let c = 0; for (const lv of Object.values(S().slotLv || {})) for (let i = 0; i < lv; i++) c += enh0 ? enh0(i).coins : 0; return c; };
})();
