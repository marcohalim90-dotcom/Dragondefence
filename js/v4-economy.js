/* Rancangan v4, tahap B6 Ekonomi (Ledger Confirmed C56; user "go" 2026-11-11): docs/rancangan-v4/07-ekonomi.md (rules); the screens use
   what is here (js/screens.js "v4 B6").
   - Hero cards (G7 §4): every won battle drops 1 hero card (Hard 2); Recruit gives 1 card a pull (1 Recruit Ticket or 200 gems; 10 for
     1,800 gems). One odds table for both, set by the highest stage cleared (6 bands, §4.1); pity shared by both: an Epic or better at
     the latest every 10th card, a Legendary every 40th. Wish: up to 5 marked heroes take 80 % of the cards of their tier. A card of a
     hero not owned yet opens that hero. No Recruit Level, no Desired Hero.
   - Limited (§4.4): Mythic only here; 1 free Mythic Essence from the 100 % chest of Stage 15+ (was 2); Wish works inside every tier.
   - Coins (§5): a Normal win pays at least W(n) = 223 n (the battle's coins + the win bonus, topped up; Lucky Coin stays on top);
     Hard ×2. Progress chests: 30 % = 10 energy, 60 % = 0.3 W, 100 % = 50 gems + 1 Recruit Ticket (+1 Essence from Stage 15). Patrol
     7 n coins an hour, up to 16 h, no Forge Ore. Gifts that were fixed coins follow W of the highest stage (Sign-in Day 2 = 2 W, the
     20-point quest chest = 0.5 W). A won battle no longer gives a Fuse Stone; Fuse Stones come from Disassemble, Patrol and the Hard
     first clear (§8).
   - Equipment (§8): a Dragon Chest (35 % Normal, 50 % Hard) and every Equipment Chest gives a piece for one hero of the party (a weapon
     of that hero's type, any slot); rarity Common 70 / Rare 22 / Epic 6 / Legendary 2 % up to Stage 40, then 40 / 35 / 18 / 7 %, the
     Equipment Chest always the second row. Mythic only from Fuse. No chest levels.
   - Energy (§7): at most 60. Start (§9): 400 coins, 0 gems; the 3 Recruit Tickets open the 3 first hero cards; Kael on loan at Lv 10.
   - The save, once (G6 §13): the slot levels' coins come back, the Desired Hero becomes the first Wish.
   Behind the v4 switch (DD.V4), which B6 turns on for everyone (?v3 = the old rules); before any v4 step changes the save, js/v4-core.js
   keeps it once under <key>:before-v4. Loaded after js/v4-level.js. */
(function () {
  if (!DD.V4) return;
  const V = DD.v4, P = DD.P;
  const E = (V.eco = {});
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const roll = (odds) => { const r = Math.random(); let acc = 0; for (let i = 0; i < odds.length; i++) if (r < (acc += odds[i])) return i; return odds.length - 1; };

  /* ------------------------------------------------------------ numbers (G7) */
  E.W = (n) => 223 * Math.max(1, n);
  E.TIERS = ["common", "rare", "epic", "legendary"];
  /** [first stage of the band, odds Common / Rare / Epic / Legendary] (§4.1) */
  E.BANDS = [[1, [0.6, 0.3, 0.09, 0.01]], [21, [0.45, 0.35, 0.16, 0.04]], [41, [0.3, 0.38, 0.24, 0.08]], [61, [0.2, 0.35, 0.32, 0.13]],
    [81, [0.12, 0.3, 0.38, 0.2]], [101, [0.08, 0.25, 0.4, 0.27]]];
  E.PITY_E = 10;
  E.PITY_L = 40;
  E.WISH_MAX = 5;
  E.WISH_SHARE = 0.8;
  E.RECRUIT10_GEMS = 1800;
  /** Dragon Chest rarity up to Stage 40, then from Stage 41 (also the Equipment Chest) (§8) */
  E.GEAR_ODDS = [[0.7, 0.22, 0.06, 0.02], [0.4, 0.35, 0.18, 0.07]];
  E.GEAR_BAND = 40;
  E.LOAN_LV = 10;
  E.START = { coins: 400, gems: 0 };
  E.ENERGY_MAX = 60;
  E.PATROL_COINS = 7; // × n an hour
  /** the band a stage falls in: { i, from, to, odds } */
  E.bandOf = (n) => { n = Math.max(1, n); let i = 0; E.BANDS.forEach(([from], k) => { if (n >= from) i = k; }); const nx = E.BANDS[i + 1]; return { i, from: E.BANDS[i][0], to: nx ? nx[0] - 1 : Infinity, odds: E.BANDS[i][1] }; };
  /** heroes a card of this tier can be (Mythic only in Limited) */
  E.pool = (tier) => DD.HEROES.filter((h) => h.tier === tier && !(DD.ART_PENDING && DD.ART_PENDING.has(h.id))).map((h) => h.id);
  E.wishable = () => ["common", "rare", "epic", "legendary", "mythic"].flatMap((t) => E.pool(t));

  // data that changes with v4 (pages without the save read these too)
  DD.ESSENCE_CHEST = 1;
  DD.ENERGY_CAP_MAX = E.ENERGY_MAX;
  DD.HARD.first = Object.assign({}, DD.HARD.first, { tickets: 1 }); // G8: Hard first clear also 1 Recruit Ticket
  DD.patrolRate = (cleared) => ({ coins: E.PATROL_COINS * Math.max(1, cleared), ore: 0, exp: 20 + 2 * cleared, gearEveryH: 2 });
  DD.OFFERS = DD.OFFERS.filter((o) => o.id !== "ore" && o.id !== "stones"); // Forge Ore is gone; Fuse Stones are not sold for coins (§8)
  { const q = DD.QUESTS.find((x) => x.id === "train"); if (q) q.name = "Train 3 times"; }
  DD.CHALLENGE[1][2] = ["Wear 3 pieces", "worn", 3, 10];
  DD.CHALLENGE[2][2] = ["Tier Up pieces 10 times", "tierUps", 10, 10]; // the slot levels are gone

  if (!P) return; // pages without the save: the numbers above only
  const S = () => P.get();
  const st = () => { const s = S(); if (!s.v4e) s.v4e = { wish: [], sinceE: 0, sinceL: 0, tierUps: 0 }; return s.v4e; };
  const Wtop = () => E.W(S().cleared);

  // gifts that were fixed coins follow W of the highest stage cleared (§5); Forge Ore gifts become coins
  const live = (o, k, f) => Object.defineProperty(o, k, { get: f, enumerable: true, configurable: true });
  live(DD.SIGNIN[1], "coins", () => 2 * Wtop());
  delete DD.SIGNIN[4].ore; live(DD.SIGNIN[4], "coins", () => Wtop());
  live(DD.QUEST_CHESTS[0][1], "coins", () => Math.round(0.5 * Wtop()));
  delete DD.QUEST_CHESTS[3][1].ore;
  live(DD.ONLINE[0][1], "coins", () => Math.round(0.25 * Wtop()));
  delete DD.ONLINE[3][1].ore; live(DD.ONLINE[3][1], "coins", () => Math.round(0.5 * Wtop()));
  DD.PASS.forEach((t) => { if (t.free.ore) t.free = { coins: Math.round(0.5 * E.W(t.at)) }; });

  /* ------------------------------------------------------------ hero cards: odds, pity, Wish (§4) */
  E.band = () => E.bandOf(S().cleared);
  E.pity = () => ({ epic: E.PITY_E - st().sinceE, legendary: E.PITY_L - st().sinceL, sinceL: st().sinceL });
  E.wish = () => st().wish.filter((id) => DD.HERO[id]);
  E.isWish = (id) => st().wish.includes(id);
  E.toggleWish = (id) => {
    const w = st().wish, i = w.indexOf(id);
    if (i >= 0) w.splice(i, 1);
    else if (w.length >= E.WISH_MAX) return false;
    else w.push(id);
    P.save();
    return true;
  };
  /** the tier of the next card: the band's odds, then the pity */
  E.rollTier = () => {
    const s = st();
    s.sinceE++; s.sinceL++;
    let t = roll(E.band().odds);
    if (s.sinceL >= E.PITY_L) t = 3;
    else if (s.sinceE >= E.PITY_E && t < 2) t = 2;
    if (t >= 2) s.sinceE = 0;
    if (t === 3) s.sinceL = 0;
    return E.TIERS[t];
  };
  /** a hero of the tier: 80 % a wished one (shared evenly), 20 % one of the others */
  E.pickHero = (tier) => {
    const pool = E.pool(tier), w = st().wish.filter((id) => pool.includes(id)), other = pool.filter((id) => !w.includes(id));
    if (w.length && (!other.length || Math.random() < E.WISH_SHARE)) return pick(w);
    return pick(other.length ? other : pool);
  };
  /** one hero card: opens the hero or counts toward its next 5 levels */
  E.card = (tier) => { tier = tier || E.rollTier(); const id = E.pickHero(tier); return { id, tier, result: P.addShard(id) }; };

  /* ------------------------------------------------------------ Recruit (§4.2) and Limited (§4.4) */
  P.recruitLv = () => 1;
  P.recruitBar = () => null;
  P.recruitOdds = () => E.band().odds;
  P.recruitCost = (n) => {
    const s = S();
    let t = Math.min(s.tickets, n);
    if (n === 10 && (10 - t) * DD.TICKET_GEMS >= E.RECRUIT10_GEMS) t = 0;
    return { tickets: t, gems: n === 10 && t === 0 ? E.RECRUIT10_GEMS : (n - t) * DD.TICKET_GEMS };
  };
  P.recruit = (n) => {
    const c = P.recruitCost(n), s = S();
    if (s.gems < c.gems) return null;
    s.tickets -= c.tickets;
    s.gems -= c.gems;
    const out = [];
    for (let k = 0; k < n; k++) { s.recruit.pulls++; out.push(E.card()); }
    P.quest("recruit", n);
    P.save();
    return out;
  };
  P.setDesired = (id) => E.toggleWish(id);
  P.limitedPull = (n) => {
    const s = S();
    if (s.essence < n) return null;
    s.essence -= n;
    P.quest("recruit", n);
    const out = [];
    for (let k = 0; k < n; k++) {
      s.limited.pulls++;
      s.limited.since++;
      let tier = DD.LIMITED_ODDS[roll(DD.LIMITED_ODDS.map((x) => x[1]))][0];
      if (s.limited.since >= DD.LIMITED_PITY) tier = "mythic";
      if (tier === "mythic") s.limited.since = 0;
      out.push(E.card(tier));
    }
    P.save();
    return out;
  };

  /* ------------------------------------------------------------ a battle: coins, cards, chests (§4.2, §5, §8) */
  const rr0 = P.runRewards;
  P.runRewards = (n, r, hard) => {
    const b = rr0(n, r, hard);
    if (r.win) {
      const got = (r.coins || 0) / (1 + ((P.battleMods() || {}).coin || 0)) + DD.winCoins(n);
      if (got < E.W(n)) b.coins += Math.round((E.W(n) - got) * (hard ? DD.HARD.coins : 1));
    }
    return b;
  };
  const end0 = P.endRun;
  P.endRun = (n, r, double, hard) => {
    const out = end0(n, r, double, hard), s = S();
    if (r.win && P.unlocked("enchant")) { s.stones = Math.max(0, s.stones - 1); if (out.stones) { out.stones--; if (!out.stones) delete out.stones; } }
    if (r.win) { out.heroes = []; for (let k = 0; k < (hard ? 2 : 1); k++) out.heroes.push(E.card()); out.cardsWon = true; P.save(); }
    return out;
  };
  P.claimChest = (n, i) => {
    if (P.chestState(n)[i] !== 1) return null;
    const s = S(), out = {};
    (s.chests[n] = s.chests[n] || [false, false, false])[i] = true;
    if (i === 0) { out.energy = 10; P.addEnergy(10); }
    if (i === 1) { out.coins = Math.round(0.3 * E.W(n)); s.coins += out.coins; }
    if (i === 2) {
      out.gems = 50; out.tickets = 1; s.gems += 50; s.tickets += 1;
      if (n >= DD.UNLOCK.limited) { out.essence = DD.ESSENCE_CHEST; s.essence += DD.ESSENCE_CHEST; }
    }
    P.save();
    return out;
  };
  /** what the three progress chests of a stage give, in words (G7 §10) */
  E.chestWords = (n) => [`10 energy`, `${DD.fmt(Math.round(0.3 * E.W(n)))} coins`, `50 gems + 1 Recruit Ticket${n >= DD.UNLOCK.limited ? " + 1 Mythic Essence" : ""}`];

  /** a piece for one hero of the party: any slot, a weapon of that hero's type */
  E.partyPiece = (r) => {
    const f = P.formation().filter((id) => P.has(id)), hid = f.length ? pick(f) : null;
    const g = P.makeGear(r, pick(DD.SLOTS).id, P.dropTier());
    if (g.slot === "weapon" && hid) g.type = DD.HERO_WEAPON[hid] || g.type;
    return g;
  };
  E.gearOdds = () => E.GEAR_ODDS[S().cleared > E.GEAR_BAND ? 1 : 0];
  P.dragonChest = (hard) => (Math.random() < (hard ? DD.DRAGON_CHEST.hard : DD.DRAGON_CHEST.chance) ? P.addGear(E.partyPiece(roll(E.gearOdds()))) : null);
  P.chestLv = () => 1;
  P.chestNext = () => null;
  P.chestOdds = () => E.GEAR_ODDS[1];
  P.openChest = (n) => {
    const { keys, gems } = P.chestCost(n), s = S();
    if (s.gems < gems) return null;
    s.keys -= keys;
    s.gems -= gems;
    P.quest("chest", n);
    const out = [];
    for (let k = 0; k < n; k++) { out.push(P.addGear(E.partyPiece(roll(P.chestOdds())))); s.chest.opened++; }
    P.save();
    return out;
  };

  /* ------------------------------------------------------------ start, loan, counters */
  const sc0 = P.starterCards;
  P.starterCards = () => { const s = S(); s.tickets = Math.max(0, s.tickets - DD.START_CARDS); return sc0(); }; // the 3 tickets open the 3 first cards
  const ls0 = P.loanStart;
  P.loanStart = () => { const ok = ls0(); if (ok && S().trial) { S().trial.lv = E.LOAN_LV; P.save(); } return ok; };
  const tu0 = P.tierUp;
  P.tierUp = (gid) => { const r = tu0(gid); if (r) st().tierUps = (st().tierUps || 0) + 1; return r; };
  const tua0 = V.lv.tierUpAll;
  V.lv.tierUpAll = (ids) => { const r = tua0(ids); if (r && r.n) { st().tierUps = (st().tierUps || 0) + r.n; P.save(); } return r; };
  const met0 = P.metric;
  P.metric = (m) => (m === "training" ? V.lv.T() : m === "tierUps" ? st().tierUps || 0 : met0(m));

  /* ------------------------------------------------------------ the save, once (G6 §13, G7 §9) */
  {
    const s = S();
    if (!s.v4e) {
      const fresh = !Object.keys(s.heroes).length && !s.cleared && !(s.stats && s.stats.battles);
      const v = st();
      if (fresh) { s.coins = E.START.coins; s.gems = E.START.gems; }
      if (s.recruit && s.recruit.desired && DD.HERO[s.recruit.desired]) v.wish = [s.recruit.desired];
      const back = V.lv.slotRefund ? V.lv.slotRefund() : 0;
      if (back) { s.coins += back; v.refund = back; }
      s.slotLv = {};
      P.save();
    }
  }
})();
