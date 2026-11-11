/* DREAMDYSIS: DRAGON DEFENCE — the player's save and every meta rule, design v3 (docs/RANCANGAN.md CONFIRMED C5–C11).
   The screens call these; nothing here touches the page, so the same rules can move to the APK.
   Save key dd:save:v3 (dd:save:v2 is never touched); ?sandbox uses dd:sandbox:v3; ?reset empties the key in use. */
(function () {
  const qs = new URLSearchParams(location.search);
  const KEY = qs.has("sandbox") ? "dd:sandbox:v3" : "dd:save:v3";
  const now = () => Date.now();
  // the player's own calendar day (bug list C5: the UTC date turned at 07:00 in Indonesia)
  const dayOf = (t) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const day = () => dayOf(Date.now());
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const roll = (odds) => { const r = Math.random(); let acc = 0; for (let i = 0; i < odds.length; i++) if (r < (acc += odds[i])) return i; return odds.length - 1; };
  let uid = 0;

  function fresh() {
    // C54: no hero yet — the prologue gives 3 hero cards to open (P.starterCards); Kael comes on loan after Stage 3 (P.loanStart)
    const heroes = {};
    return {
      v: 3, coins: 1250, gems: 300, tickets: 3, keys: 1, ore: 0, exShards: 0,
      energy: DD.ENERGY_BASE, energyAt: now(), energyAds: { day: day(), n: 0 },
      pl: { lv: 1, exp: 0 },
      cleared: 0, stage: 1, best: {}, chests: {},
      heroes, trial: null,
      formation: [],
      recruit: { pulls: 0, desired: null },
      bag: [], gear: {}, slotLv: {}, chest: { opened: 0 }, // gear = each hero's six pieces (C29 D)
      training: { atk: 0, crit: 0, haste: 0, rank: 0 }, // Party Training (C21)
      stones: 0, stoneAt: now(), party: 1, pShards: 0, // Enchant Stones, Party Shards (C21); party = save converted to Party Power
      patrol: { at: now() }, quick: { day: day(), n: 0, ad: 0 },
      offers: null, double: { day: day(), n: 0 },
      sound: true, seen: {},
      coll: { items: {}, chests: 0, at: now() }, // Collection (build stage 3)
      essence: 0, limited: { pulls: 0, since: 0, got: [] },
      // the daily loop (C22): today's quests and online minutes, sign-in round, newcomer challenge, pass claims, counters
      daily: { day: "", q: {}, got: [], online: 0, onGot: [] }, signin: { n: 0, last: "" },
      newbie: { start: now(), got: [], tasks: [], gifts: [] }, pass: { got: [] }, stats: { wins: 0, battles: 0 },
      hard: { on: false, cleared: 0, stage: 1, best: {} }, // Hard Mode (C23)
    };
  }

  let S = fresh();
  try {
    if (qs.has("reset")) localStorage.removeItem(KEY);
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o.v === 3) { S = Object.assign(fresh(), o); if (!o.party) S.party = 0; } } // no party flag = an old save to convert (C21)
  } catch (e) { /* private window: play without saving */ }
  S.bag.forEach((g) => (uid = Math.max(uid, g.uid)));
  Object.values(S.equipped || {}).forEach((g) => g && (uid = Math.max(uid, g.uid)));
  Object.values(S.gear || {}).forEach((w) => Object.values(w).forEach((g) => g && (uid = Math.max(uid, g.uid))));
  convertToParty();
  convertLevels();
  convertEquipment();
  convertGear();
  convertHammer();
  convertStars();
  convertShards();
  if (!S.artGift && S.cleared >= DD.UNLOCK.artifacts && DD.ART_GIFT) { S.artGift = 1; S.coll.chests += DD.ART_GIFT; } // C27 G (no gift since 2026-11-02)

  /** C48 (user no. 97: "mana boleh ada hero shard. sangat membingungkan. kalau bener mah, kertu duplicat aja, 1 cara cukup."): Party Shards and Exchange Shards are gone; what a save still holds becomes Recruit Tickets (1 Party Shard = 1 ticket,
      15 Exchange Shards = 1 ticket, rounded up), so the cards still come only from Recruit. Runs once (S.shardsV). */
  function convertShards() {
    if (S.shardsV) return;
    S.shardsV = 1;
    const t = (S.pShards || 0) + Math.ceil((S.exShards || 0) / DD.EXCHANGE_COST);
    if (t > 0) { S.tickets = (S.tickets || 0) + t; S.shardTickets = t; }
    S.pShards = 0;
    S.exShards = 0;
  }
  /** C46 (user no. 95: "stars di hapuskan permanent"): a piece's stars become the Enchant Stones they cost; a tier above 20 stops at 20
      (Mythic has no top). Runs once (S.eqV3). */
  function convertStars() {
    if (S.eqV3) return;
    S.eqV3 = 1;
    const fix = (g) => { if (!g) return; if (g.stars) S.stones = (S.stones || 0) + DD.starStones(g.stars); delete g.stars; g.tier = Math.min(g.tier || 1, DD.tierTop(g)); };
    (S.bag || []).forEach(fix);
    Object.values(S.gear || {}).forEach((w) => Object.values(w).forEach(fix));
  }
  /** C45 (user no. 94: "hammer dan axe gabung aja"): every Hammer becomes an Axe of the same rarity, tier, stars and effects; a
      Legendary Hammer becomes the first Axe name (Worldsplitter), since the two Hammer names are gone. Runs on every load. */
  function convertHammer() {
    const fix = (g) => { if (g && g.type === "hammer") { g.type = "axe"; if (g.r === 4) g.lv3 = 0; } };
    (S.bag || []).forEach(fix);
    Object.values(S.gear || {}).forEach((w) => Object.values(w).forEach(fix));
  }
  /** C27 F: the artifacts of C21 become equipment: Blade → Weapon (Sword), Tome → Amulet, Crown → Helm, Aegis → Armor, Charm → Gloves,
      Banner → Boots; the most stars of its affixes become its stars; Epic and Legendary pieces get their effects. */
  function convertEquipment() {
    if (S.eqV2) return;
    S.eqV2 = 1;
    const fix = (g) => {
      if (!g) return g;
      g.slot = DD.EQ_MIGRATE[g.slot] || g.slot;
      if (g.slot === "weapon" && !g.type) g.type = "sword";
      g.stars = Math.min(DD.STAR_MAX, Math.max(0, ...(g.aff || []).map((a) => a.s || 0)));
      delete g.aff;
      g.tier = g.tier || 1;
      return rollFx(g);
    };
    S.bag = S.bag.map(fix).filter((g) => DD.SLOT[g.slot]);
    const eq = {}, lv = {};
    for (const [k, g] of Object.entries(S.equipped || {})) if (g) eq[DD.EQ_MIGRATE[k] || k] = fix(g);
    for (const [k, v] of Object.entries(S.slotLv || {})) lv[DD.EQ_MIGRATE[k] || k] = v;
    S.equipped = eq;
    S.slotLv = lv;
  }
  /** C29 D (2026-11-02, user: "equipement sekarang ada di masing2 heroes aja"): the pieces the Lead wore become the Lead's own; a
      weapon of another type than the Lead's goes back to the bag. S.equipped stays readable as the Lead's pieces (not saved). */
  function convertGear() {
    if (Object.prototype.hasOwnProperty.call(S, "equipped")) {
      S.gear = S.gear || {};
      const lead = S.formation[0], old = S.equipped || {};
      delete S.equipped;
      if (lead) {
        const w = (S.gear[lead] = S.gear[lead] || {});
        for (const [slot, g] of Object.entries(old)) { if (!g) continue; if (slot === "weapon" && DD.HERO_WEAPON[lead] !== g.type) S.bag.push(g); else w[slot] = g; }
      }
    }
    S.gear = S.gear || {};
    Object.defineProperty(S, "equipped", { get: () => (S.gear[S.formation[0]] = S.gear[S.formation[0]] || {}), enumerable: false, configurable: true });
  }
  S.formation = S.formation.slice(0, DD.PARTY_MAX); // C27 D: five places at most (an old save could hold up to eight)

  /** C27 C: the old Lv 1–6 → the new levels; every hero gets the level it may reach before its next 3 cards. */
  function convertLevels() {
    if (S.lvV2) return;
    S.lvV2 = 1;
    for (const h of Object.values(S.heroes)) {
      h.lv = DD.LV_FROM_OLD[Math.min(6, h.lv || 1)] || 1;
      h.cap = Math.max(DD.LV_BLOCK, Math.ceil(h.lv / DD.LV_BLOCK) * DD.LV_BLOCK);
    }
  }

  /** C21 (2026-10-30): an old save keeps everything it earned. Talents → Party Training bought with the same coins; runes
      → Enchant Stones (a level-L rune is worth 2^(L-1) stones); equipment → artifacts (slot mapped, affixes rolled);
      Kael keeps the level the Player Level gave him; the Commander slot becomes a normal party slot with Kael in it. */
  function convertToParty() {
    if (S.party) return;
    S.party = 1;
    S.training = S.training || { atk: 0, crit: 0, haste: 0, rank: 0 };
    if (S.talents && S.talents.bought) {
      let coins = 0;
      for (let i = 0; i < S.talents.bought; i++) coins += DD.talentCost(i);
      for (let guard = 0; guard < 400; guard++) {
        const t = S.training, cap = (t.rank + 1) * 10;
        if (DD.TRAIN.every((l) => t[l.id] >= cap) && t.rank < DD.RANKS.length) { t.rank++; continue; }
        const l = DD.TRAIN.map((x) => x.id).filter((id) => t[id] < cap).sort((a, b) => t[a] - t[b])[0];
        if (!l) break;
        const cost = DD.trainCost(t[l]);
        if (coins < cost) break;
        coins -= cost;
        t[l]++;
      }
      S.coins += Math.floor(coins); // what is left goes back
    }
    delete S.talents;
    S.stones = S.stones || 0;
    if (S.runes) {
      for (const [k, n] of Object.entries(S.runes.inv || {})) S.stones += n * Math.pow(2, Number(k.split(":")[1]) - 1);
      for (const lv of Object.values(S.runes.sock || {})) if (lv) S.stones += Math.pow(2, lv - 1);
      S.stoneAt = S.runes.at || now();
      delete S.runes;
    }
    const mapSlot = (id) => DD.SLOT_MIGRATE[id] || id;
    const fix = (g) => { if (!g) return g; g.slot = mapSlot(g.slot); if (!g.aff) g.aff = rollAffixes(g.r); return g; };
    S.bag.forEach(fix);
    const eq = {}, lv = {};
    for (const [k, g] of Object.entries(S.equipped || {})) eq[mapSlot(k)] = fix(g);
    for (const [k, v] of Object.entries(S.slotLv || {})) lv[mapSlot(k)] = v;
    S.equipped = eq;
    S.slotLv = lv;
    if (S.heroes[DD.CMD]) S.heroes[DD.CMD].lv = Math.max(S.heroes[DD.CMD].lv || 1, DD.cmdLv(S.pl.lv));
    // C54: Kael is an ordinary hero now (no longer put back into the party)
    if (S.cleared >= DD.UNLOCK.party) S.seen.party = false; // show the one-line hint about the new Party tab
  }

  const P = (DD.P = {});
  P.key = KEY;
  P.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  P.get = () => S;
  P.reset = () => { S = fresh(); P.save(); };
  const daily = (o) => { if (o.day !== day()) { o.day = day(); o.n = 0; if ("ad" in o) o.ad = 0; } return o; };

  /* ------------------------------------------------------------ unlocks (C10) */
  P.unlocked = (f) => !!S.devAll || S.cleared >= (DD.UNLOCK[f] || 0);
  /* developer switch (user 2026-10-24: "tombol hanya untuk developer. digunakan untuk unlock semua fitur yang ada"):
     opens every feature, formation slot and stage without touching the progress; switched off = back to normal.
     Shown only on the developer's machine (localhost) or with ?dev, never in a player's build. */
  // no. 105: the APK serves the game from 127.0.0.1 too, so the app wrapper opens it with ?app (no Developer button there)
  P.isDev = (["localhost", "127.0.0.1", ""].includes(location.hostname) && !qs.has("app")) || qs.has("dev");
  P.devAll = () => !!S.devAll;
  P.setDevAll = (on) => { S.devAll = !!on; if (!on) S.stage = Math.min(S.stage, S.cleared + 1); P.save(); };

  /* ------------------------------------------------------------ energy and Player Level (C9) */
  P.energyCap = () => Math.min(DD.ENERGY_CAP_MAX, DD.ENERGY_BASE + (S.pl.lv - 1));
  P.energy = function () {
    const per = DD.ENERGY_MIN * 60000, cap = P.energyCap();
    if (S.energy < cap) {
      const gain = Math.floor((now() - S.energyAt) / per);
      if (gain > 0) { S.energy = Math.min(cap, S.energy + gain); S.energyAt += gain * per; }
    } else S.energyAt = now();
    return S.energy;
  };
  P.energyNext = () => (S.energy >= P.energyCap() ? 0 : DD.ENERGY_MIN * 60000 - (now() - S.energyAt));
  P.addEnergy = (n) => { P.energy(); S.energy += n; }; // rewards may go past the cap
  P.energyAdsLeft = () => DD.ENERGY_AD_DAY - daily(S.energyAds).n;
  P.adEnergy = () => { if (P.energyAdsLeft() <= 0) return false; S.energyAds.n++; P.addEnergy(DD.ENERGY_AD); P.save(); return true; };
  P.buyEnergy = () => { if (S.gems < DD.ENERGY_BUY.gems) return false; S.gems -= DD.ENERGY_BUY.gems; P.addEnergy(DD.ENERGY_BUY.energy); P.save(); return true; };
  P.addExp = (exp) => {
    S.pl.exp += exp;
    let ups = 0;
    while (S.pl.exp >= DD.PL_EXP(S.pl.lv)) { S.pl.exp -= DD.PL_EXP(S.pl.lv); S.pl.lv++; ups++; P.addEnergy(DD.PL_ENERGY); }
    return ups;
  };

  /* ------------------------------------------------------------ heroes (C5) */
  P.trialLeft = () => (S.trial && S.trial.until > now() ? S.trial.until - now() : 0);
  P.isTrial = (id) => !S.heroes[id] && S.trial && S.trial.id === id && P.trialLeft() > 0;
  P.owned = (id) => !!S.heroes[id];
  // DEV unlock all (2026-10-30): every hero can be deployed at Lv 1 without being written into the save
  P.isDevHero = (id) => !!S.devAll && !S.heroes[id];
  P.has = (id) => P.owned(id) || P.isTrial(id) || P.isDevHero(id);
  P.lv = (id) => (S.heroes[id] ? S.heroes[id].lv : P.isTrial(id) ? S.trial.lv || 1 : P.isDevHero(id) ? 1 : 0);
  /** C54: the 3 hero cards of a new player — 3 different random Commons, owned and in the party */
  P.starterCards = () => {
    const pool = DD.HEROES.filter((h) => h.tier === "common" && (!DD.SKIN_HEROES || DD.SKIN_HEROES.includes(h.id))).map((h) => h.id);
    const out = [];
    while (out.length < Math.min(DD.START_CARDS, pool.length)) { const id = pick(pool); if (!out.includes(id)) out.push(id); }
    const list = out.map((id) => ({ id, tier: DD.HERO[id].tier, result: P.addShard(id) }));
    const rank = (id) => { const k = DD.START_LEAD.indexOf(id); return k < 0 ? 99 : k; };
    S.formation = out.slice().sort((x, y) => rank(x) - rank(y)); // C55: the steadiest of the three leads
    P.save();
    return list;
  };
  /** C54: Kael on loan for DD.TRIAL.hours, once, after Stage DD.TRIAL.afterStage; he fights at the level of the best hero owned */
  P.loanDue = () => !S.heroes[DD.TRIAL.id] && !S.trial && S.cleared >= DD.TRIAL.afterStage;
  P.loanStart = () => {
    if (!P.loanDue()) return false;
    const lv = Math.max(1, ...Object.values(S.heroes).map((h) => h.lv || 1));
    S.trial = { id: DD.TRIAL.id, until: now() + DD.TRIAL.hours * 3600000, lv };
    S.formation = S.formation.filter((id) => P.has(id));
    if (S.formation.length < P.slots()) S.formation.push(DD.TRIAL.id);
    P.save();
    return true;
  };
  /** C54: the loan ran out and Kael has not said goodbye yet */
  P.loanOver = () => !!(S.trial && S.trial.id === DD.TRIAL.id && !S.heroes[DD.TRIAL.id] && S.trial.until <= now() && !S.trial.bye);
  P.loanBye = () => { if (S.trial) S.trial.bye = true; S.formation = S.formation.filter((id) => P.has(id)); P.save(); };
  P.shards = (id) => (S.heroes[id] ? S.heroes[id].shards : 0);
  P.levels = () => Object.fromEntries(DD.HEROES.filter((h) => P.has(h.id)).map((h) => [h.id, P.lv(h.id)]));
  /** C27 C: the highest level the hero may reach before its next 3 cards. */
  P.cap = (id) => (S.heroes[id] ? S.heroes[id].cap || DD.LV_BLOCK : 0);
  /** The next step: coins for one level, or 3 cards to open the next 5 levels (brk). */
  P.lvCost = (id) => {
    if (!P.owned(id)) return null;
    const lv = P.lv(id);
    return lv < P.cap(id) ? { coins: DD.lvCoins(lv), shards: 0 } : { coins: 0, shards: DD.BREAK_CARDS, brk: true };
  };
  P.canLv = (id) => { const c = P.lvCost(id); return !!c && S.heroes[id].shards >= c.shards && S.coins >= c.coins; };
  P.levelUp = (id) => {
    if (!P.canLv(id)) return false;
    const c = P.lvCost(id), h = S.heroes[id];
    h.shards -= c.shards;
    S.coins -= c.coins;
    if (c.brk) h.cap = P.cap(id) + DD.LV_BLOCK;
    else { h.lv++; P.quest("levelup"); }
    P.save();
    return c.brk ? "break" : "level";
  };
  /** One card of a hero: unlocks it when not owned, then each card counts toward its next 5 levels (C27 C: no top level). */
  P.addShard = (id, n) => {
    n = n || 1;
    if (!S.heroes[id]) { S.heroes[id] = { lv: 1, shards: n - 1, cap: DD.LV_BLOCK }; return "new"; }
    S.heroes[id].shards += n;
    return "shard";
  };
  /* ------------------------------------------------------------ formation (C5) */
  P.slots = () => DD.PARTY_MAX; // C27 D: five places, all open from the start
  P.formation = () => {
    const f = S.formation.filter((id) => P.has(id)).slice(0, P.slots());
    return f.length ? f : Object.keys(S.heroes).slice(0, 1); // C54: no Kael to fall back on
  };
  P.toggleFormation = (id) => {
    S.formation = S.formation.filter((x) => P.has(x));
    const i = S.formation.indexOf(id);
    if (i >= 0) { if (S.formation.length <= 1) return "last"; S.formation.splice(i, 1); P.save(); return "left"; }
    if (S.formation.length >= P.slots()) return "full";
    S.formation.push(id);
    P.save();
    return "joined";
  };
  /** The first hero is on the wall when a battle starts (the old Commander place). */
  P.setLead = (id) => { const i = S.formation.indexOf(id); if (i <= 0) return false; S.formation.splice(i, 1); S.formation.unshift(id); P.save(); return true; };
  P.replaceFormation = (out, inn) => {
    const i = S.formation.indexOf(out);
    if (i < 0 || S.formation.includes(inn)) return false;
    S.formation[i] = inn;
    P.save();
    return true;
  };

  /* ------------------------------------------------------------ red dots and NEW tags (2026-10-31, group task 4)
     Derived from the state on every draw, never stored. A dot = something of value to do now; NEW = a feature not yet
     opened. Ads and sales never get a dot. */
  /** A bag piece this hero can wear that beats what it wears (C29 D). */
  P.betterFor = (id) => DD.SLOTS.some((sl) => S.bag.some((g) => g.slot === sl.id && P.fits(g, id) && P.artScore(g) > P.artScore(P.gearOf(id)[sl.id])));
  P.betterArt = () => P.formation().some((id) => P.betterFor(id));
  P.enchantReady = () => P.allWorn().some((g) => P.enchantable(g) && S.stones >= P.enchantCost(g));
  P.dots = () => ({
    home: P.missionsReady() || (P.unlocked("patrol") && P.patrol().hours >= 1) || Array.from({ length: S.cleared + 1 }, (_, i) => P.chestState(i + 1).includes(1)).some(Boolean),
    heroes: P.unlocked("heroes") && (Object.keys(S.heroes).some((id) => P.canLv(id)) || P.betterArt()), // C29 D: a better piece for a party hero
    // 2026-10-31: the artifacts have their own tab, so their dots moved there (Party keeps Training)
    party: P.unlocked("party") && P.unlocked("training") && P.canRank(), // C29 D: equipment left the Party tab
    artifacts: P.unlocked("artifacts") && (S.coll.chests > 0 || DD.COLLECTION.some((x) => P.collNeed(x.id) !== null && P.collCopies(x.id) >= P.collNeed(x.id))),
    shop: P.unlocked("shop") && (S.keys > 0 || P.passReady() || (P.unlocked("recruit") && S.tickets > 0) || (P.unlocked("limited") && P.limitedMilestones().some((m) => m.state === 1))), // C32 G6: Recruit and Limited live here
    missions: P.missionsReady(),
  });
  /** A feature opened by the stages but not visited yet. */
  P.isNew = (f) => P.unlocked(f) && !S.devAll && !S.seen["new_" + f];
  P.seeNew = (f) => { if (P.isNew(f)) { S.seen["new_" + f] = true; P.save(); } };
  // saves from before the NEW tags: what was already open is not new (only the C21 features are)
  if (!S.seen.newInit) {
    Object.keys(DD.UNLOCK).forEach((f) => { if (S.cleared >= DD.UNLOCK[f] && !["party", "training", "enchant"].includes(f)) S.seen["new_" + f] = true; });
    S.seen.newInit = true;
  }

  /* ------------------------------------------------------------ Party Power (C21): every source ends in the party attributes */
  /** C27 F: the Lead wears the equipment; a weapon of another type than the Lead's gives half its ATK and no effects. */
  /** C29 D: each hero wears its own six pieces; a weapon only on a hero of its type (the ½ rule of C27 F is gone). */
  P.gearOf = (id) => (S.gear[id] = S.gear[id] || {});
  P.fits = (g, id) => !!g && (g.slot !== "weapon" || DD.HERO_WEAPON[id] === g.type);
  P.leadMatch = () => true; // older callers: every worn piece is at full power now
  P.gearStat = (g) => DD.gearValue(g);
  P.allWorn = () => Object.values(S.gear).flatMap((w) => Object.values(w).filter(Boolean));
  P.wearerOf = (gid) => Object.keys(S.gear).find((id) => Object.values(S.gear[id]).some((g) => g && g.uid === gid)) || null;
  /** What one hero's pieces give that hero: ATK, Crit, Haste and the effects; HP goes to the wall (P.party). */
  P.heroGear = (id) => {
    const t = { atk: 0, hp: 0, crit: 0, critDmg: 0, haste: 0, area: 0, dur: 0, boss: 0, el: {} };
    for (const sl of DD.SLOTS) {
      const g = P.gearOf(id)[sl.id];
      if (!g) continue;
      t[sl.stat] += DD.gearValue(g);
      (g.fx || []).forEach((k) => { const s = DD.EQ_FX[k].stat, v = DD.fxValue(k, g); if (s.startsWith("el_")) t.el[s.slice(3)] = (t.el[s.slice(3)] || 0) + v; else t[s] += v; });
    }
    return t;
  };
  /** The party attributes: Party Level, Training (+ rank perks), artifacts (main stat, slot level, affixes with stars),
      Collection. Capped as in DD.ATTR. */
  P.party = () => {
    const t = { atk: 0, hp: 0, crit: 0, critDmg: 0, haste: 0, area: 0, dur: 0, proj: 0, boss: 0, el: Object.fromEntries((DD.ELEMENTS || ["physical", "fire", "water", "electric", "nature"]).map((e) => [e, 0])) };
    const add = (k, v) => { if (k.startsWith("el_")) t.el[k.slice(3)] += v; else t[k] += v; };
    t.atk += DD.PARTY_LV.atk * (S.pl.lv - 1);
    t.hp += DD.PARTY_LV.hpFlat * (S.pl.lv - 1); // t.hp = flat Wall HP since C27 B
    const tr = S.training || { atk: 0, crit: 0, haste: 0, rank: 0 };
    DD.TRAIN.forEach((l) => add(l.id, DD.trainPts(l.id, tr[l.id]) / 1000));
    for (let i = 0; i < tr.rank; i++) for (const [k, v] of Object.entries(DD.rankPerk(i))) add(k, v);
    // slot levels count for every hero (C29 D: one level per slot type); the party heroes' Helm and Armor add to the wall
    DD.SLOTS.forEach((sl) => (t[sl.stat] += (S.slotLv[sl.id] || 0) * DD.SLOT_LV_VALUE[sl.stat]));
    P.formation().forEach((id) => (t.hp += P.heroGear(id).hp));
    // C27 G: the worn artifacts that touch a party attribute (Head DMG, Wall HP); the others act inside the battle (P.artMods)
    // C44: also Crit, Haste, Area, Duration and the element DMG artifacts
    P.worn().forEach((id) => { const a = DD.COLL[id], lv = P.collLv(id); if (a.fx.startsWith("el_") || (DD.ART_PARTY_FX || ["boss", "hp"]).includes(a.fx)) add(a.fx, a.v(lv)); });
    for (const [k, a] of Object.entries(DD.ATTR)) if (a.cap !== undefined) t[k] = Math.min(t[k], a.cap);
    for (const e of Object.keys(t.el)) t.el[e] = Math.min(t.el[e], DD.EL_CAP);
    return t;
  };
  P.team = P.party; // older callers
  /** What the battle needs from the party (C21 rumus 20.7). */
  P.battleMods = () => {
    const t = P.party();
    // each party hero's own pieces (C29 D), Crit and Haste kept under their caps together with the party's
    const gear = Object.fromEntries(P.formation().map((id) => {
      const g = P.heroGear(id);
      g.crit = Math.min(g.crit, Math.max(0, DD.ATTR.crit.cap - t.crit));
      g.haste = Math.min(g.haste, Math.max(0, DD.ATTR.haste.cap - t.haste));
      return [id, g];
    }));
    return { ...P.artMods(), dmgMul: 1 + t.atk, hpMul: 1, hpFlat: t.hp, crit: t.crit, critDmg: t.critDmg, haste: t.haste, area: t.area, dur: t.dur, proj: t.proj, boss: t.boss, el: t.el, gear };
  };
  const heroPowerRaw = (id) => {
    const h = DD.HERO[id], m = DD.levelMods(h, P.lv(id) || 1);
    const dps = (h.w.dmg || h.w.dps || 20) / (h.w.cd || 1);
    return dps * m.dmgL * m.rateL * 40 + h.hp * m.hpMul; // h.hp is ×0.1 since C27 B, so ×1 here = the old ×0.1
  };
  P.heroPower = (id) => Math.max(1, Math.round(heroPowerRaw(id) * DD.POWER_SCALE));
  /** The wall's life (C27 B, "Wall HP" on screen): the party heroes' HP with their levels, plus the flat Wall HP. */
  P.wallHP = () => P.formation().reduce((a, id) => a + DD.HERO[id].hp * DD.levelMods(DD.HERO[id], P.lv(id) || 1).hpMul, 0) + P.party().hp;
  /** Training points of one line (C27 B). */
  P.trainPts = (id) => DD.trainPts(id, S.training[id]);
  /** Party Power (C21 20.8): the party's hero power × every attribute; Recommended Power uses the same scale. */
  /** One hero's share of the power with the party's attributes and its own pieces (C29 D). */
  const heroShare = (id, b) => {
    const g = (b.gear && b.gear[id]) || P.heroGear(id);
    const crit = 1 + Math.min(1, b.crit + g.crit) * (1 + b.critDmg + g.critDmg);
    return heroPowerRaw(id) * (b.dmgMul + g.atk) * crit * (1 + b.haste + g.haste) * (1 + 0.5 * (b.area + g.area));
  };
  P.power = () => {
    const b = P.battleMods();
    const base = P.formation().reduce((a, id) => a + DD.HERO[id].hp * DD.levelMods(DD.HERO[id], P.lv(id) || 1).hpMul, 0) || 1;
    return Math.max(1, Math.round(P.formation().reduce((a, id) => a + heroShare(id, b), 0) * (1 + 0.25 * b.proj) * (0.5 + 0.5 * (1 + b.hpFlat / base)) * DD.POWER_SCALE));
  };
  /** One hero's power on its page: level, party attributes and its own pieces. */
  P.heroPowerFull = (id) => Math.max(1, Math.round(heroShare(id, P.battleMods()) * DD.POWER_SCALE));

  /* ------------------------------------------------------------ Recruit (C6) */
  P.recruitLv = () => {
    let lv = 1, need = 0;
    for (const step of DD.RECRUIT_LV_PULLS) { need += step; if (S.recruit.pulls >= need) lv++; else break; }
    return lv;
  };
  P.recruitBar = () => {
    const lv = P.recruitLv();
    if (lv > DD.RECRUIT_LV_PULLS.length) return null;
    const before = DD.RECRUIT_LV_PULLS.slice(0, lv - 1).reduce((a, b) => a + b, 0);
    return { have: S.recruit.pulls - before, need: DD.RECRUIT_LV_PULLS[lv - 1] };
  };
  P.recruitOdds = () => DD.RECRUIT_ODDS[P.recruitLv() - 1];
  P.recruitCost = (n) => { const t = Math.min(S.tickets, n); return { tickets: t, gems: (n - t) * DD.TICKET_GEMS }; };
  P.recruit = (n) => {
    const c = P.recruitCost(n);
    if (S.gems < c.gems) return null;
    S.tickets -= c.tickets;
    S.gems -= c.gems;
    const out = [];
    for (let k = 0; k < n; k++) {
      const odds = P.recruitOdds();
      S.recruit.pulls++;
      const tier = DD.RECRUIT_TIERS[roll(odds)];
      const pool = DD.RECRUIT_POOL.filter((h) => h.tier === tier);
      const d = S.recruit.desired && DD.HERO[S.recruit.desired];
      const hero = d && d.tier === tier && Math.random() < DD.DESIRED_SHARE ? d : pick(pool);
      out.push({ id: hero.id, tier, result: P.addShard(hero.id) });
    }
    P.quest("recruit", n);
    P.save();
    return out;
  };
  P.setDesired = (id) => { S.recruit.desired = id; P.save(); };

  /* ------------------------------------------------------------ equipment (C7, C8) */
  function rollAffixes(r) {
    const keys = Object.keys(DD.AFFIX), out = [];
    while (out.length < DD.AFFIX_COUNT[r]) {
      const k = pick(keys);
      if (!out.some((a) => a.k === k)) out.push({ k, q: Math.round((0.8 + Math.random() * 0.4) * 100) / 100, s: 0 });
    }
    return out;
  }
  /* ---------------------------------------------------------------- Equipment (C27 F) */
  function rollFx(g) { const want = DD.fxCount(g.r, g.tier); g.fx = g.fx || []; while (g.fx.length < want) { const k = pick(Object.keys(DD.EQ_FX).filter((x) => !g.fx.includes(x))); g.fx.push(k); } return g; } // hoisted: the save conversion uses it
  P.dropTier = () => 1 + roll(DD.DROP_TIERS);
  P.makeGear = (r, slot, tier) => {
    slot = slot || pick(DD.SLOTS).id;
    const g = { uid: ++uid, slot, type: slot === "weapon" ? pick(Object.keys(DD.WEAPON_TYPES)) : undefined, r, tier: tier || 1, stars: 0, fx: [] };
    // C44: a Legendary is one of three named pieces; the 2nd and 3rd always carry their own effect first
    if (r === 4 && DD.EQ_LEGENDS) { const L3 = DD.EQ_LEGENDS[g.type || slot]; g.lv3 = Math.floor(Math.random() * L3.length); if (L3[g.lv3].fx) g.fx = [L3[g.lv3].fx]; }
    return rollFx(g);
  };
  /** How good a piece is, comparable between slots (its number against a Tier 1 Normal one), for "better", Equip All and a full bag. */
  P.artScore = (g) => (g ? DD.gearValue(g) / DD.SLOT[g.slot].base + (g.fx || []).length * 0.5 : 0);
  /** C46 (user no. 95): no stars. Tier Up = coins + Enchant Stones, Tier 1 → 20 (Mythic: no top). */
  P.starUp = () => false;
  P.canTierUp = (g) => { if (!g || g.tier >= DD.tierTop(g)) return false; const c = DD.tierUpCost(g); return S.coins >= c.coins && S.stones >= c.stones; };
  P.tierUp = (gid) => {
    const g = P.findArt(gid);
    if (!P.canTierUp(g)) return false;
    const c = DD.tierUpCost(g);
    S.coins -= c.coins;
    S.stones -= c.stones;
    g.tier++;
    P.save();
    return true;
  };
  /** Fusion (C46): two pieces with the same name, both at Tier 20, make one of the next rarity at Tier 1 (the worn one stays worn).
      Epic → Legendary picks one of the three Legendary names (its own effect first); Legendary → Mythic keeps the name. */
  P.fuseMate = (g) => (g && g.r < DD.MYTHIC && g.tier >= DD.TIER_TOP && S.bag.find((x) => x !== g && x.uid !== g.uid && DD.eqKey(x) === DD.eqKey(g) && x.tier >= DD.TIER_TOP)) || null;
  P.fuse = (gid) => {
    const g = P.findArt(gid), m = P.fuseMate(g);
    if (!m) return null;
    S.bag.splice(S.bag.indexOf(m), 1);
    g.r++;
    g.tier = 1;
    if (g.r === 4 && DD.EQ_LEGENDS) {
      const L3 = DD.EQ_LEGENDS[g.type || g.slot];
      g.lv3 = Math.floor(Math.random() * L3.length);
      const sig = L3[g.lv3].fx;
      if (sig && !(g.fx || []).includes(sig)) g.fx = [sig, ...(g.fx || [])].slice(0, DD.fxCount(4));
    }
    rollFx(g);
    P.save();
    return g;
  };
  /** A won battle may drop a Dragon Chest with one piece (C64.1). */
  P.dragonChest = (hard) => (Math.random() < (hard ? DD.DRAGON_CHEST.hard : DD.DRAGON_CHEST.chance) ? P.addGear(P.makeGear(roll(DD.DRAGON_CHEST.odds), undefined, P.dropTier())) : null);
  P.findArt = (gid) => S.bag.find((g) => g.uid === gid) || P.allWorn().find((g) => g.uid === gid) || null;
  P.enchantable = (g) => !!g && (g.aff || []).some((a) => (a.s || 0) < DD.ENCHANT_MAX);
  P.enchantCost = (g) => { const open = (g.aff || []).filter((a) => (a.s || 0) < DD.ENCHANT_MAX); return open.length ? DD.enchantCost(Math.min(...open.map((a) => a.s || 0))) : null; };
  /** Enchant: the affix with the fewest stars (ties at random) gets one more. Returns the affix or null. */
  P.enchant = (gid) => {
    const g = P.findArt(gid);
    if (!P.enchantable(g)) return null;
    const cost = P.enchantCost(g);
    if (S.stones < cost) return null;
    const open = g.aff.filter((a) => (a.s || 0) < DD.ENCHANT_MAX), low = Math.min(...open.map((a) => a.s || 0));
    const a = pick(open.filter((x) => (x.s || 0) === low));
    S.stones -= cost;
    a.s = (a.s || 0) + 1;
    P.save();
    return a;
  };
  /** Reroll one affix to another kind (the stars stay). */
  P.reroll = (gid, i) => {
    const g = P.findArt(gid);
    if (!g || !g.aff || !g.aff[i] || S.stones < DD.REROLL_COST) return null;
    const keys = Object.keys(DD.AFFIX).filter((k) => !g.aff.some((a) => a.k === k));
    if (!keys.length) return null;
    S.stones -= DD.REROLL_COST;
    g.aff[i] = { k: pick(keys), q: Math.round((0.8 + Math.random() * 0.4) * 100) / 100, s: g.aff[i].s || 0 };
    P.save();
    return g.aff[i];
  };
  /** Into the bag; a full bag disassembles the weakest piece (never an enchanted one while a plain one is left; bug list C3).
      Returns the piece, marked broken when it was the one to go; P.takeBroken() tells the loot box how many went for how much ore. */
  const broken = { n: 0, ore: 0 };
  P.addGear = (g) => {
    S.bag.push(g);
    while (S.bag.length > DD.BAG_MAX) {
      const plain = S.bag.filter((x) => (x.tier || 1) <= 1); // C46: a piece somebody raised goes last
      const pool = plain.length ? plain : S.bag;
      const weakest = pool.reduce((a, x) => (P.artScore(x) < P.artScore(a) ? x : a), pool[0]);
      if (weakest === g) g.broken = true;
      broken.n++;
      broken.ore += P.disassemble(weakest.uid, true);
    }
    return g;
  };
  P.takeBroken = () => { const b = { ...broken }; broken.n = 0; broken.ore = 0; return b; };
  /** Puts a bag piece on a hero (C29 D); "type" when the weapon is not that hero's kind. */
  P.equip = (gid, id) => {
    id = id || P.formation()[0];
    const i = S.bag.findIndex((g) => g.uid === gid);
    if (i < 0) return false;
    if (!P.fits(S.bag[i], id)) return "type";
    const g = S.bag.splice(i, 1)[0], w = P.gearOf(id);
    const old = w[g.slot];
    w[g.slot] = g;
    if (old) S.bag.push(old);
    P.save();
    return true;
  };
  P.unequip = (id, slot) => {
    const w = P.gearOf(id), g = w[slot];
    if (!g) return false;
    if (S.bag.length >= DD.BAG_MAX) return "full";
    delete w[slot];
    S.bag.push(g);
    P.save();
    return true;
  };
  /** Auto Equip: the best bag piece this hero can wear in each slot. */
  P.equipAll = (id) => {
    id = id || P.formation()[0];
    let n = 0;
    DD.SLOTS.forEach((sl) => {
      const cur = P.gearOf(id)[sl.id];
      const best = S.bag.filter((g) => g.slot === sl.id && P.fits(g, id)).reduce((a, g) => (!a || P.artScore(g) > P.artScore(a) ? g : a), null);
      if (best && (!cur || P.artScore(best) > P.artScore(cur))) { P.equip(best.uid, id); n++; }
    });
    P.save();
    return n;
  };
  P.disassemble = (gid, quiet) => {
    const i = S.bag.findIndex((g) => g.uid === gid);
    if (i < 0) return 0;
    const g = S.bag.splice(i, 1)[0];
    const ore = DD.DISASSEMBLE_ORE[g.r] * (g.tier || 1);
    S.ore += ore;
    if (!quiet) P.save();
    return ore;
  };
  /** Disassembles every bag piece that is not better than what its slot wears. */
  P.disassembleWeaker = () => {
    let ore = 0;
    // a piece is weaker when every party hero who could wear it already wears one at least as good (C29 D)
    S.bag.slice().forEach((g) => {
      const users = P.formation().filter((id) => P.fits(g, id));
      if (users.length && users.every((id) => { const cur = P.gearOf(id)[g.slot]; return cur && P.artScore(g) <= P.artScore(cur); }) && !(g.stars || 0) && !P.fuseMate(g)) ore += P.disassemble(g.uid, true);
    });
    P.save();
    return ore;
  };
  P.enhanceCost = (slot) => DD.enhanceCost(S.slotLv[slot] || 0);
  P.canEnhance = (slot) => { const lv = S.slotLv[slot] || 0, c = DD.enhanceCost(lv); return lv < DD.SLOT_LV_MAX && S.coins >= c.coins && S.ore >= c.ore; };
  P.enhance = (slot) => {
    if (!P.canEnhance(slot)) return false;
    const c = P.enhanceCost(slot);
    S.coins -= c.coins;
    S.ore -= c.ore;
    S.slotLv[slot] = (S.slotLv[slot] || 0) + 1;
    P.quest("train");
    return true;
  };
  /** One-Click Enhance: the lowest slot first, as far as coins and Forge Ore go (at most 20 levels per tap). */
  P.oneClickEnhance = () => {
    let n = 0;
    while (n < DD.ONE_CLICK_MAX) {
      const sl = DD.SLOTS.map((s) => s.id).filter(P.canEnhance).sort((a, b) => (S.slotLv[a] || 0) - (S.slotLv[b] || 0))[0];
      if (!sl || !P.enhance(sl)) break;
      n++;
    }
    P.save();
    return n;
  };
  P.chestLv = () => 1 + DD.CHEST_LV_OPENS.filter((x) => S.chest.opened >= x).length;
  P.chestNext = () => DD.CHEST_LV_OPENS[P.chestLv() - 1] ?? null;
  P.chestOdds = () => DD.CHEST_ODDS[P.chestLv() - 1];
  P.chestCost = (n) => {
    let keys = Math.min(S.keys, n);
    if (n === 10 && (10 - keys) * DD.CHEST_KEY_GEMS >= DD.CHEST_10_GEMS) keys = 0;
    return { keys, gems: n === 10 && keys === 0 ? DD.CHEST_10_GEMS : (n - keys) * DD.CHEST_KEY_GEMS };
  };
  P.openChest = (n) => {
    const { keys, gems } = P.chestCost(n);
    if (S.gems < gems) return null;
    S.keys -= keys;
    S.gems -= gems;
    const out = [];
    P.quest("chest", n);
    for (let k = 0; k < n; k++) { out.push(P.addGear(P.makeGear(roll(P.chestOdds()), undefined, P.dropTier()))); S.chest.opened++; if (P.unlocked("enchant") && Math.random() < DD.STONE_CHEST) S.stones++; }
    P.save();
    return out;
  };

  /* ------------------------------------------------------------ Party Training (C21; replaces the Talents of C7) */
  P.trainCap = () => Math.min(DD.TRAIN_MAX, (S.training.rank + 1) * 10);
  P.trainCost = (id) => DD.trainCost(S.training[id]);
  P.canTrain = (id) => S.training[id] < P.trainCap() && S.coins >= P.trainCost(id);
  P.train = (id, quiet) => {
    if (!P.canTrain(id)) return false;
    S.coins -= P.trainCost(id);
    S.training[id]++;
    P.quest("train");
    if (!quiet) P.save();
    return true;
  };
  /** Rank Up: all three lines at the cap (Lv 10, 20, …) open the next party perk and the next 10 levels. */
  P.canRank = () => DD.TRAIN.every((l) => S.training[l.id] >= (S.training.rank + 1) * 10); // C27 B: ranks without end
  P.rankUp = (quiet) => { if (!P.canRank()) return false; S.training.rank++; if (!quiet) P.save(); return true; };
  /** One-Click Train: the lowest line first, a Rank Up as soon as it opens, as far as the coins go (20 steps a tap). */
  P.oneClickTrain = () => {
    let n = 0;
    while (n < DD.ONE_CLICK_MAX) {
      if (P.rankUp(true)) { n++; continue; }
      const id = DD.TRAIN.map((l) => l.id).filter((x) => S.training[x] < P.trainCap()).sort((a, b) => S.training[a] - S.training[b])[0];
      if (!id || !P.train(id, true)) break;
      n++;
    }
    P.save();
    return n;
  };

  /* ------------------------------------------------------------ Patrol and Quick Patrol (C9) */
  function patrolLoot(h) {
    const r = DD.patrolRate(S.cleared);
    return { hours: h, coins: Math.floor(h * r.coins), ore: Math.floor(h * r.ore), exp: Math.floor(h * r.exp), gear: 0 }; // C27 F: no equipment from Patrol
  }
  P.patrol = () => {
    const l = patrolLoot(Math.min(DD.PATROL_MAX_H, (now() - S.patrol.at) / 3600000));
    // Enchant Stones waiting on their own clock (C21), shown before Claim
    l.stones = P.unlocked("enchant") ? Math.floor(Math.min(now() - (S.stoneAt || now()), DD.PATROL_MAX_H * 3600000) / (DD.STONE_PATROL_H * 3600000)) : 0;
    l.collChests = 0; // 2026-11-02: Artifact Chests only from the Shop
    return l;
  };
  function giveLoot(l) {
    S.coins += l.coins;
    S.ore += l.ore;
    const out = { ...l, gearList: [], levelUps: P.addExp(l.exp) };
    for (let k = 0; k < l.gear; k++) out.gearList.push(P.addGear(P.makeGear(roll(DD.CHEST_ODDS[0]))));
    return out;
  }
  P.claimPatrol = () => {
    P.quest("patrol");
    const out = giveLoot(P.patrol());
    S.patrol.at = now();
    out.collChests = 0; S.coll.at = now(); // 2026-11-02: Artifact Chests only from the Shop
    S.coll.chests += out.collChests;
    const clock = { at: S.stoneAt || now() };
    out.stones = P.unlocked("enchant") ? tick(clock, DD.STONE_PATROL_H) : ((clock.at = now()), 0);
    S.stoneAt = clock.at;
    S.stones += out.stones;
    P.save();
    return out;
  };
  /** Whole periods passed on a clock (capped like Patrol); the clock keeps the remainder. */
  function tick(o, hours) {
    const per = hours * 3600000, n = Math.floor(Math.min(now() - o.at, DD.PATROL_MAX_H * 3600000) / per);
    o.at = Math.max(o.at + n * per, now() - DD.PATROL_MAX_H * 3600000);
    return n;
  }

  /* ------------------------------------------------------------ Collection (build stage 3, Confirmed C17) */
  P.collLv = (id) => (S.coll.items[id] ? S.coll.items[id].lv : 0);
  P.collCopies = (id) => (S.coll.items[id] ? S.coll.items[id].copies : 0);
  P.collNeed = (id) => { const c = DD.COLL[id] || {}, max = c.max || DD.COLL_MAX; return P.collLv(id) >= max ? null : (c.copies || DD.COLL_COPIES)[P.collLv(id)]; }; // C46: Mythic artifacts have 3 levels
  /** Buys n Artifact Chests in the Shop and opens them (2026-11-02: the only way to artifacts). Null when the gems are short. */
  P.buyArtChest = (n) => {
    const cost = DD.ART_CHEST_GEMS * (n >= 10 ? 9 : n);
    if (S.gems < cost) return null;
    S.gems -= cost;
    S.coll.chests += n;
    return P.openCollChest(n);
  };
  P.openCollChest = (n) => {
    n = Math.min(n, S.coll.chests);
    const out = [];
    const tw = Object.values(DD.COLL_TIERS).reduce((a, t) => a + t.w, 0);
    for (let k = 0; k < n; k++) {
      let r = Math.random() * tw, tier = "fine";
      for (const [id, t] of Object.entries(DD.COLL_TIERS)) { if ((r -= t.w) < 0) { tier = id; break; } }
      const c = pick((DD.RELEASED || DD.COLLECTION).filter((x) => x.tier === tier)); // C46: never a locked one
      const it = (S.coll.items[c.id] = S.coll.items[c.id] || { lv: 0, copies: 0 });
      it.copies++;
      out.push(c.id);
    }
    S.coll.chests -= n;
    P.save();
    return out;
  };
  P.collUp = (id) => {
    const it = S.coll.items[id], need = P.collNeed(id);
    if (!it || need === null || it.copies < need) return false;
    it.copies -= need;
    it.lv++;
    if (it.lv === 1 && P.worn().length < DD.ART_WORN) { S.arts = [...P.worn(), id]; } // a new artifact goes on while a place is free
    P.save();
    return true;
  };
  /* C27 G: three worn artifacts */
  P.worn = () => (S.arts || []).filter((id) => DD.COLL[id] && !DD.COLL[id].locked && P.collLv(id) > 0).slice(0, DD.ART_WORN);
  P.wear = (id) => { if (!P.collLv(id)) return "none"; S.arts = P.worn(); if (S.arts.includes(id)) { S.arts = S.arts.filter((x) => x !== id); P.save(); return "off"; } if (S.arts.length >= DD.ART_WORN) return "full"; S.arts.push(id); P.save(); return "on"; };
  /** What the worn artifacts do inside a battle. */
  P.artMods = () => {
    const m = { coin: 0, chestCoin: 0, burn: 0, react: 0, phoenix: 0, slow: 0, refresh: 0, callPick: 3, callRefresh: 0, poison: 0, freeze: 0, odds: 0, oddsStart: 0, evoPick: 0, evoEarly: 0, regen: 0 }; // C44: the last six (C46: Sage's Lens = evoEarly again, Mythic, locked)
    P.worn().forEach((id) => { const a = DD.COLL[id], v = a.v(P.collLv(id));
      if (a.fx === "call") { m.callPick = 4; m.callRefresh += v; } else if (a.fx in m) m[a.fx] += v; });
    return m;
  };
  P.collUpAll = () => { let n = 0, up = true; while (up) { up = false; for (const c of DD.COLLECTION) if (P.collUp(c.id)) { n++; up = true; } } return n; };

  /* ------------------------------------------------------------ Limited Recruitment (build stage 3, Confirmed C19) */
  P.limitedPity = () => DD.LIMITED_PITY - S.limited.since;
  P.buyEssence = (n) => { const g = n * DD.ESSENCE_GEMS; if (S.gems < g) return false; S.gems -= g; S.essence += n; P.save(); return true; };
  P.limitedPull = (n) => {
    if (S.essence < n) return null;
    S.essence -= n;
    P.quest("recruit", n);
    const out = [];
    for (let k = 0; k < n; k++) {
      S.limited.pulls++;
      S.limited.since++;
      let tier = DD.LIMITED_ODDS[roll(DD.LIMITED_ODDS.map((x) => x[1]))][0];
      if (S.limited.since >= DD.LIMITED_PITY) tier = "mythic";
      if (tier === "mythic") S.limited.since = 0;
      const hero = pick(DD.LIMITED_POOL.filter((h) => h.tier === tier));
      out.push({ id: hero.id, tier, result: P.addShard(hero.id) });
    }
    P.save();
    return out;
  };
  /** Pull-count rewards: 0 not reached, 1 ready, 2 taken. */
  P.limitedMilestones = () => DD.LIMITED_MILESTONES.map(([at, give], i) => ({ at, give, state: S.limited.got.includes(i) ? 2 : S.limited.pulls >= at ? 1 : 0 }));
  P.claimMilestone = (i) => {
    const m = P.limitedMilestones()[i];
    if (!m || m.state !== 1) return null;
    S.limited.got.push(i);
    S.gems += m.give.gems || 0;
    S.essence += m.give.essence || 0;
    P.save();
    return m.give;
  };
  P.quickLeft = () => DD.QUICK_PATROL_DAY - daily(S.quick).n;
  P.quickAdLeft = () => DD.QUICK_PATROL_AD - daily(S.quick).ad;
  /** Quick Patrol: 5 energy for 2 hours of Patrol now; byAd = one of the extra 5 a day. */
  P.quickPatrol = (byAd) => {
    if (byAd ? P.quickAdLeft() <= 0 : P.quickLeft() <= 0) return null;
    if (P.energy() < DD.ENERGY_RUN) return null;
    S.energy -= DD.ENERGY_RUN;
    if (byAd) S.quick.ad++; else S.quick.n++;
    P.quest("quick");
    const out = giveLoot(patrolLoot(DD.QUICK_PATROL_H));
    P.save();
    return out;
  };

  /* ------------------------------------------------------------ Shop: Special Offer (C8) */
  P.offers = () => {
    const slot = Math.floor(now() / (DD.OFFER_HOURS * 3600000));
    if (!S.offers || S.offers.slot !== slot) S.offers = { slot, items: DD.OFFERS.map((o) => ({ id: o.id, sold: false })), refresh: { day: day(), n: 0 } };
    // C48: an offer that no longer exists (the old Hero Shards) becomes the one in its place
    S.offers.items = S.offers.items.map((it, i) => (DD.OFFERS.some((d) => d.id === it.id) ? it : { id: (DD.OFFERS[i] || DD.OFFERS[0]).id, sold: it.sold }));
    daily(S.offers.refresh);
    return S.offers;
  };
  P.offerEndsIn = () => DD.OFFER_HOURS * 3600000 - (now() % (DD.OFFER_HOURS * 3600000));
  P.refreshOffers = () => {
    const o = P.offers();
    const free = o.refresh.n < DD.OFFER_FREE_REFRESH;
    if (!free && S.gems < DD.OFFER_REFRESH_GEMS) return false;
    if (!free) S.gems -= DD.OFFER_REFRESH_GEMS;
    o.refresh.n++;
    o.items.forEach((x) => (x.sold = false));
    P.save();
    return true;
  };
  P.buyOffer = (i) => {
    const o = P.offers(), it = o.items[i], def = DD.OFFERS.find((d) => d.id === it.id);
    if (it.sold) return null;
    if (def.pay !== "ad") {
      if (def.pay.coins && S.coins < def.pay.coins) return null;
      if (def.pay.gems && S.gems < def.pay.gems) return null;
      S.coins -= def.pay.coins || 0;
      S.gems -= def.pay.gems || 0;
    }
    it.sold = true;
    const g = def.give, out = { ...g, heroes: [] };
    S.gems += g.gems || 0;
    S.tickets += g.tickets || 0;
    S.ore += g.ore || 0;
    S.keys += g.keys || 0;
    S.stones += g.stones || 0;
    if (g.energy) P.addEnergy(g.energy);
    P.save();
    return out;
  };

  /* ------------------------------------------------------------ the daily loop (build stage 5, Ledger TD C22) */
  const DAY = 86400000;
  /** Gives a reward object (coins, gems, tickets, keys, ore, stones, essence, energy, collChests) and returns it for the loot box. */
  P.grant = (g) => {
    for (const [k, v] of Object.entries(g)) {
      if (k === "energy") P.addEnergy(v);
      else if (k === "collChests") S.coll.chests += v;
      else S[k] = (S[k] || 0) + v;
    }
    P.save();
    return { ...g };
  };
  /** Today's quest sheet; a new day starts a fresh one with "Log in" done. */
  function today() {
    const d = S.daily;
    if (d.day !== day()) { d.day = day(); d.q = { login: 1 }; d.got = []; d.online = 0; d.onGot = []; }
    return d;
  }
  P.quest = (id, n) => { const d = today(); d.q[id] = (d.q[id] || 0) + (n || 1); };
  P.quests = () => { const d = today(); return DD.QUESTS.filter((q) => !q.lock || P.unlocked(q.lock)).map((q) => ({ ...q, have: Math.min(q.need, d.q[q.id] || 0) })); };
  P.questPts = () => P.quests().reduce((a, q) => a + (q.have >= q.need ? q.pts : 0), 0);
  /** Quest chests: 0 not reached, 1 ready, 2 taken. */
  P.questChests = () => { const d = today(), p = P.questPts(); return DD.QUEST_CHESTS.map(([at, give], i) => ({ at, give, state: d.got.includes(i) ? 2 : p >= at ? 1 : 0 })); };
  P.claimQuestChest = (i) => { const c = P.questChests()[i]; if (!c || c.state !== 1) return null; today().got.push(i); return P.grant(c.give); };
  /** Online Rewards: minutes played today (the page adds time while it is visible). */
  P.onlineTick = (sec) => { today().online += sec; };
  P.online = () => { const d = today(), min = Math.floor(d.online / 60); return { min, rows: DD.ONLINE.map(([at, give], i) => ({ at, give, state: d.onGot.includes(i) ? 2 : min >= at ? 1 : 0 })) }; };
  P.claimOnline = (i) => { const r = P.online().rows[i]; if (!r || r.state !== 1) return null; today().onGot.push(i); return P.grant(r.give); };
  /** 7-Day Sign-in: which day is next, and whether it can be claimed today. A missed day starts again at Day 1. */
  P.signin = () => {
    const s = S.signin, yesterday = dayOf(now() - DAY);
    const claimedToday = s.last === day();
    const keep = claimedToday || s.last === yesterday;
    const n = keep ? s.n % DD.SIGNIN.length : 0;
    return { next: claimedToday ? (s.n - 1) % DD.SIGNIN.length : n, done: claimedToday ? ((s.n - 1) % DD.SIGNIN.length) + 1 : n, can: !claimedToday };
  };
  P.claimSignin = () => {
    const st = P.signin();
    if (!st.can) return null;
    S.signin.n = st.next + 1;
    S.signin.last = day();
    return P.grant(DD.SIGNIN[st.next]);
  };
  /** What a 7-Day Challenge task counts. */
  P.metric = (m) => {
    const owned = Object.values(S.heroes);
    return {
      cleared: S.cleared, pulls: S.recruit.pulls + S.limited.pulls, wins: S.stats.wins, pl: S.pl.lv,
      worn: P.allWorn().length, owned: owned.length,
      slotLv: Object.values(S.slotLv).reduce((a, b) => a + b, 0), training: DD.TRAIN.reduce((a, l) => a + S.training[l.id], 0),
      heroLv: owned.reduce((a, h) => a + h.lv - 1, 0), chests: S.chest.opened,
    }[m] || 0;
  };
  P.challenge = () => {
    const nb = S.newbie, since = Math.floor((now() - nb.start) / DAY);
    const days = DD.CHALLENGE.map((tasks, d) => ({ day: d + 1, open: since >= d, tasks: tasks.map(([text, m, need, pts], k) => {
      const have = Math.min(need, P.metric(m));
      return { key: d + ":" + k, text, have, need, pts, done: have >= need };
    }) }));
    const pts = days.filter((d) => d.open).reduce((a, d) => a + d.tasks.reduce((b, t) => b + (t.done ? t.pts : 0), 0), 0);
    return { days, pts, endsIn: nb.start + DD.CHALLENGE_DAYS * DAY - now(), today: Math.min(DD.CHALLENGE.length, since + 1),
      chests: DD.CHALLENGE_CHESTS.map(([at, give], i) => ({ at, give, state: nb.got.includes(i) ? 2 : pts >= at ? 1 : 0 })) };
  };
  P.challengeOpen = () => P.challenge().endsIn > 0;
  P.claimChallenge = (i) => { const c = P.challenge(); if (c.endsIn <= 0 || !c.chests[i] || c.chests[i].state !== 1) return null; S.newbie.got.push(i); return P.grant(c.chests[i].give); };
  /** Newcomer Benefits: one gift per stage in DD.NEWCOMER. */
  P.benefits = () => DD.NEWCOMER.map(([at, give], i) => ({ at, give, state: S.newbie.gifts.includes(i) ? 2 : S.cleared >= at ? 1 : 0 }));
  P.claimBenefit = (i) => { const b = P.benefits()[i]; if (!b || b.state !== 1) return null; S.newbie.gifts.push(i); return P.grant(b.give); };
  /** Progression Pass: the free track (the premium one is simulated). */
  P.passTiers = () => DD.PASS.map((t, i) => ({ ...t, state: S.pass.got.includes(i) ? 2 : S.cleared >= t.at ? 1 : 0 }));
  P.claimPass = () => {
    const out = {};
    P.passTiers().forEach((t, i) => { if (t.state === 1) { S.pass.got.push(i); for (const [k, v] of Object.entries(t.free)) out[k] = (out[k] || 0) + v; } });
    return Object.keys(out).length ? P.grant(out) : null;
  };
  /** Anything waiting in Missions (Home dot) or in the Pass (Shop dot). */
  P.missionsReady = () => P.unlocked("missions") && (P.questChests().some((c) => c.state === 1) || P.online().rows.some((r) => r.state === 1) || P.signin().can ||
    (P.challengeOpen() && P.challenge().chests.some((c) => c.state === 1)) || P.benefits().some((b) => b.state === 1));
  P.passReady = () => P.unlocked("pass") && P.passTiers().some((t) => t.state === 1);
  /** True once a day while the Sign-in can be claimed: Home opens it by itself. */
  P.signinPopup = () => { if (!P.unlocked("missions") || !P.signin().can || S.seen.signinDay === day()) return false; S.seen.signinDay = day(); P.save(); return true; };

  /* ------------------------------------------------------------ a battle: start and rewards (C9) */
  P.canPlay = () => P.energy() >= DD.ENERGY_RUN;
  P.startRun = () => {
    if (!P.canPlay()) return false;
    if (S.energy >= P.energyCap()) S.energyAt = now();
    S.energy -= DD.ENERGY_RUN;
    P.save();
    return true;
  };
  P.stageOpen = (n) => !!S.devAll || n <= S.cleared + 1;
  /** Hard Mode: Hard N needs Normal N and Hard N − 1. */
  P.hardOpen = (n) => P.unlocked("hard") && (!!S.devAll || (n <= S.cleared && n <= S.hard.cleared + 1));
  P.setHard = (on) => { S.hard.on = !!on && P.unlocked("hard"); if (S.hard.on && !P.hardOpen(S.hard.stage)) S.hard.stage = Math.max(1, Math.min(S.hard.cleared + 1, S.cleared)); P.save(); };
  P.doubleLeft = () => DD.DOUBLE_DAY - daily(S.double).n;
  /** The rewards a finished battle gives (not yet paid): coins, EXP, equipment, the 30/60/100 % chests. */
  P.runRewards = (n, r, hard) => {
    const p = r.win ? 1 : r.progress, H = hard ? DD.HARD : { coins: 1, exp: 1 };
    return {
      coins: Math.round((r.coins + (r.win ? DD.winCoins(n) : 0)) * (r.win ? 1 : Math.max(0.2, p)) * H.coins),
      exp: Math.round(DD.runExp(n, p) * H.exp),
      gear: (r.win ? DD.WIN_GEAR : Math.floor(DD.WIN_GEAR * p)) + (r.chestGear || 0),
    };
  };
  /** Pays a battle (× 2 with Double Rewards) and opens the progress chests reached. */
  P.endRun = (n, r, double, hard) => {
    const base = P.runRewards(n, r, hard);
    const k = double ? 2 : 1;
    if (double) S.double.n++;
    const out = { coins: base.coins * k, exp: base.exp * k, gearList: [], chests: [], first: false, unlocked: [] };
    P.quest("battle");
    S.stats.battles++;
    if (r.win) { P.quest("win"); S.stats.wins++; }
    S.coins += out.coins;
    out.levelUps = P.addExp(out.exp);
    if (r.win) { const g = P.dragonChest(hard); if (g) { out.gearList.push(g); out.dragonChest = true; } } // C27 F: equipment only from a Dragon Chest
    const pct = Math.round((r.win ? 1 : r.progress) * 100);
    if (r.win && P.unlocked("enchant")) { out.stones = 1; S.stones += 1; }
    if (hard) {
      // Hard Mode (C23): its own best and its own cleared line; the first clear of each Hard stage gives a gift
      S.hard.best[n] = Math.max(S.hard.best[n] || 0, pct);
      if (r.win && n > S.hard.cleared) { S.hard.cleared = n; out.hardFirst = P.grant(DD.HARD.first); for (const [k, v] of Object.entries(DD.HARD.first)) out[k] = (out[k] || 0) + v; if (S.hard.stage === n) S.hard.stage = n + 1; }
      P.save();
      return out;
    }
    S.best[n] = Math.max(S.best[n] || 0, pct);
    if (r.win && n > S.cleared) {
      const before = Object.keys(DD.UNLOCK).filter((f) => P.unlocked(f));
      S.cleared = n;
      out.first = true;
      out.unlocked = Object.keys(DD.UNLOCK).filter((f) => P.unlocked(f) && !before.includes(f));
      if (out.unlocked.includes("artifacts") && !S.artGift && DD.ART_GIFT) { S.artGift = 1; S.coll.chests += DD.ART_GIFT; out.collChests = (out.collChests || 0) + DD.ART_GIFT; }
      // the last stage of a chapter: the chapter gift (C23)
      if (n % DD.CHAPTER === 0) { P.grant(DD.CHAPTER_GIFT); out.chapter = n / DD.CHAPTER; for (const [k, v] of Object.entries(DD.CHAPTER_GIFT)) out[k] = (out[k] || 0) + v; }
      if (S.stage === n) S.stage = n + 1;
    }
    P.save();
    return out;
  };
  /** The progress chests of a stage: 0 locked, 1 ready, 2 taken. */
  P.bestOf = (n) => Math.max(S.best[n] || 0, n <= S.cleared ? 100 : 0); // C32 G8: a cleared stage was survived to the end
  P.chestState = (n) => DD.PROGRESS_CHESTS.map((need, i) => ((S.chests[n] || [])[i] ? 2 : P.bestOf(n) >= need ? 1 : 0));
  /** Ready chests over every stage (C32 G8), and taking them all at once. */
  P.readyChests = () => { let k = 0; for (let n = 1; n <= S.cleared + 1; n++) k += P.chestState(n).filter((x) => x === 1).length; return k; };
  P.claimAllChests = () => {
    const out = {};
    for (let n = 1; n <= S.cleared + 1; n++) P.chestState(n).forEach((x, i) => { if (x !== 1) return; const g = P.claimChest(n, i) || {}; for (const [k, v] of Object.entries(g)) out[k] = (out[k] || 0) + v; });
    return out;
  };
  P.claimChest = (n, i) => {
    if (P.chestState(n)[i] !== 1) return null;
    (S.chests[n] = S.chests[n] || [false, false, false])[i] = true;
    const out = {};
    if (i === 0) { out.coins = 100 * n; S.coins += out.coins; }
    if (i === 1) { out.coins = 200 * n; out.energy = 10; S.coins += out.coins; P.addEnergy(10); }
    if (i === 2) {
      out.gems = 50; out.tickets = 1; S.gems += 50; S.tickets += 1;
      // 2026-11-02 (user: "artifact harusnya di dapat hanya dari beli saja"): no Artifact Chest here any more
      if (n >= DD.UNLOCK.limited) { out.essence = DD.ESSENCE_CHEST; S.essence += DD.ESSENCE_CHEST; }
    }
    P.save();
    return out;
  };
})();
