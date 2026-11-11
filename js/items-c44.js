/* C44 (user no. 93: "tambah banyak equipment lagi dan artifact. aku akan check nanti"): more equipment effects, three named Legendary
   pieces per weapon type and slot, and 20 more artifacts (30 in all). Loaded after js/heroes-c43.js, before js/state.js.
   C45 (user no. 94): Hammer joins Axe ("hammer dan axe gabung aja"); a fuse puts the stars back to 0 and gives the Enchant Stones back
   ("kalau stay itu bakalan abuse"); every artifact grows by one rule, so every level counts ("di tengah2 nya apa?").
   Everything here uses stats the battle already reads (per-hero gear: atk, crit, critDmg, haste, area, dur, boss, el; party and
   artifact mods), plus six artifact mods that js/battle-c43.js reads: poison, freeze, odds, oddsStart, evoPick, regen. */
(function () {
  /* ---------------------------------------------------------------- equipment effects (EQ_FX): 10 → 18 */
  Object.assign(DD.EQ_FX, {
    precision: { name: "Precision", stat: "crit", v: 0.01 },
    might: { name: "Might", stat: "atk", v: 0.02 },
    el_ice: { name: "Frost Edge", stat: "el_ice", v: 0.05 },
    el_rock: { name: "Stone Edge", stat: "el_rock", v: 0.05 },
    el_poison: { name: "Venom Edge", stat: "el_poison", v: 0.05 },
    el_dark: { name: "Shadow Edge", stat: "el_dark", v: 0.05 },
    el_holy: { name: "Holy Edge", stat: "el_holy", v: 0.05 },
    el_dragon: { name: "Wyrm Edge", stat: "el_dragon", v: 0.05 },
  });
  Object.assign(DD.AFFIX, {
    el_ice: { name: "Ice DMG", v: 0.05 }, el_rock: { name: "Rock DMG", v: 0.05 }, el_poison: { name: "Poison DMG", v: 0.05 },
    el_dark: { name: "Dark DMG", v: 0.05 }, el_holy: { name: "Holy DMG", v: 0.05 }, el_dragon: { name: "Dragon DMG", v: 0.05 },
  });

  /* ---------------------------------------------------------------- C45: Hammer joins Axe (8 weapon types). The Crusader now fights
     with an Axe; a Hammer already in a save becomes an Axe of the same rarity, tier and stars (js/state.js convertHammer). */
  delete DD.WEAPON_TYPES.hammer;
  for (const [id, t] of Object.entries(DD.HERO_WEAPON)) if (t === "hammer") DD.HERO_WEAPON[id] = "axe";

  /* ---------------------------------------------------------------- Legendary pieces: three names per type and slot; the first is
     the one the game had (random effects), the other two always carry their own signature effect */
  const L = (name, fx) => ({ name, fx });
  DD.EQ_LEGENDS = {
    sword: [L(DD.EQ_LEGEND.sword), L("Dawnbringer", "el_holy"), L("Wyrmfang Blade", "el_dragon")],
    dagger: [L(DD.EQ_LEGEND.dagger), L("Viper's Kiss", "el_poison"), L("Nightglass Dirk", "el_dark")],
    bow: [L(DD.EQ_LEGEND.bow), L("Galeheart Longbow", "swift"), L("Frostwind Bow", "el_ice")],
    staff: [L(DD.EQ_LEGEND.staff), L("Emberheart Staff", "el_fire"), L("Staff of Tides", "el_water")],
    tome: [L(DD.EQ_LEGEND.tome), L("Thunder Grimoire", "el_electric"), L("Book of Shadows", "el_dark")],
    axe: [L(DD.EQ_LEGEND.axe), L("Mountain Cleaver", "el_rock"), L("Bloodmoon Axe", "keen")],
    spear: [L(DD.EQ_LEGEND.spear), L("Stormpiercer", "el_electric"), L("Dragoon's Lance", "dragonbane")],
    orb: [L(DD.EQ_LEGEND.orb), L("Orb of the Deep", "el_water"), L("Verdant Orb", "el_nature")],
    helm: [L(DD.EQ_LEGEND.helm), L("Helm of the Wyrmguard", "dragonbane"), L("Frostcrown", "el_ice")],
    armor: [L(DD.EQ_LEGEND.armor), L("Thornmail", "el_nature"), L("Obsidian Plate", "el_rock")],
    gloves: [L(DD.EQ_LEGEND.gloves), L("Assassin's Grips", "precision"), L("Stormfists", "el_electric")],
    boots: [L(DD.EQ_LEGEND.boots), L("Emberstriders", "el_fire"), L("Shadowsteps", "swift")],
    amulet: [L(DD.EQ_LEGEND.amulet), L("Saint's Locket", "el_holy"), L("Venom Pendant", "el_poison")],
  };
  const name0 = DD.artName;
  DD.artName = (g) => {
    if (g.r !== 4) return name0(g);
    const L3 = DD.EQ_LEGENDS[g.type || g.slot];
    return (L3 && L3[g.lv3 || 0] && L3[g.lv3 || 0].name) || name0(g);
  };
  const key0 = DD.eqKey;
  DD.eqKey = (g) => key0(g) + (g.r === 4 && g.lv3 ? ":" + g.lv3 : ""); // a named Legendary fuses only with the same name
  /** C45: the Enchant Stones a piece's stars cost (2 + 4 + … for each star); a fuse gives them back. */
  DD.starStones = (n) => { let s = 0; for (let i = 0; i < (n || 0); i++) s += DD.starCost(i); return s; };

  /* ---------------------------------------------------------------- artifacts: 10 → 30, one growth rule (C45)
     Every artifact: each level adds half of its Lv 1 value, so Lv 10 = 5.5 × Lv 1 and no level is empty. A count that cannot be a
     fraction (Free Refresh, Hero Call Refresh) keeps the whole part and gives the rest as a chance of one more each battle. */
  DD.ART_GROW = 0.5;
  const G = (v1) => (lv) => v1 * (1 + DD.ART_GROW * (Math.max(1, lv) - 1));
  const fmt = (n) => (DD.fmt ? DD.fmt(n) : String(n)); // DD.fmt lives in js/battle.js; the listing page does not load it
  const pt = (v) => fmt(Math.round(v * 1000)); // points, as on every party attribute (1 point = 0.1 %, C27 B)
  const x2 = (v) => "×" + (+(1 + v).toFixed(3));
  const pc = (v) => +(v * 100).toFixed(2) + "%";
  const whole = (v) => Math.floor(v + 1e-9);
  const rest = (v) => Math.round((v - whole(v)) * 100); // the chance of one more, in %
  const countN = (v) => (whole(v) ? "+" + whole(v) : "") + (rest(v) ? `${whole(v) ? " · " : ""}${rest(v)}%` : "");
  DD.EVO_PICK = 0.6; // how often a hero's Evo Card is the card offered once it can show (js/battle-c43.js rollCards)
  const odds = (k) => DD.cardOdds(k).slice().reverse().map(([t, p]) => `${DD.TIER_NAME[t]} ${pc(p)}`).join(" · ");
  const step = (v) => DD.REROLL_STEP * (1 + v);
  /** lab = what the number of the level strip on items.html counts; num = that number; note = how it works (items.html only). */
  const OLD = {
    lucky_coin: { v: G(0.1), lab: "Coins", num: x2, line: (v) => `Coins from battles ${x2(v)}` },
    thiefs_lockpick: { v: G(0.5), lab: "Treasure coins", num: x2, line: (v) => `Treasure scales give ${x2(v)} coins` },
    alchemists_flask: { v: G(0.2), lab: "Burning", num: x2, line: (v) => `Burning damage ${x2(v)}` },
    hunters_trophy: { v: G(0.1), lab: "Head DMG", num: (v) => "+" + pt(v) },
    frostfire_ember: { v: G(0.15), lab: "Reactions", num: x2, line: (v) => `Reactions ${x2(v)}` },
    dragon_scale: { v: G(30), lab: "Wall HP", num: (v) => "+" + Math.round(v) },
    phoenix_feather: { v: G(0.18), lab: "Wall HP back", num: pc, note: "The number is that share of the party's Wall HP." },
    void_hourglass: { v: G(0.05), lab: "Dragon speed", num: (v) => "×" + (+(1 - v).toFixed(3)), line: (v) => `The dragon crawls ×${+(1 - v).toFixed(3)}` },
  };
  for (const [id, o] of Object.entries(OLD)) Object.assign(DD.COLL[id], o);
  const el = (id, name, tier, e, v1) => ({ id, name, tier, fx: "el_" + e, v: G(v1), lab: DD.ELEMENT_NAME[e] + " DMG", num: (v) => "+" + pt(v), line: (v) => `${DD.ELEMENT_NAME[e]} DMG +${pt(v)}`,
    note: `For the heroes who hit with ${DD.ELEMENT_NAME[e]}.` });
  const attr = (id, name, tier, fx, v1, nm) => ({ id, name, tier, fx, v: G(v1), lab: nm, num: (v) => "+" + pt(v), line: (v) => `${nm} +${pt(v)}` });
  const NEW = [
    el("ember_stone", "Ember Stone", "fine", "fire", 0.05),
    el("tide_pearl", "Tide Pearl", "fine", "water", 0.05),
    el("thorn_seed", "Thorn Seed", "fine", "nature", 0.05),
    el("storm_shard", "Storm Shard", "fine", "electric", 0.05),
    el("iron_rivet", "Iron Rivet", "fine", "physical", 0.05),
    el("frost_crystal", "Frost Crystal", "superior", "ice", 0.06),
    el("quarry_stone", "Quarry Stone", "superior", "rock", 0.06),
    { id: "viper_fang", name: "Viper Fang", tier: "superior", fx: "poison", v: G(0.2), lab: "Poisoned", num: x2, line: (v) => `Poisoned damage ${x2(v)}` },
    el("shadow_lantern", "Shadow Lantern", "superior", "dark", 0.06),
    el("saints_relic", "Saint's Relic", "superior", "holy", 0.06),
    { id: "rune_die", name: "Rune Die", tier: "superior", fx: "odds", v: G(0.4), lab: "Rare per refresh", num: (v) => "−" + pc(step(v)),
      line: (v) => `Each Free Refresh moves the card odds further: Rare −${pc(step(v))}, Epic, Legendary and Mythic +${pc(step(v) / 3)} each`,
      note: `Without it, each Free Refresh moves Rare −${pc(DD.REROLL_STEP)} and the other three +${pc(DD.REROLL_STEP / 3)} each, for the rest of the battle.` },
    el("wyrm_tooth", "Wyrm Tooth", "rare", "dragon", 0.08),
    { id: "winter_heart", name: "Winter Heart", tier: "rare", fx: "freeze", v: G(0.15), lab: "Stop time", num: x2, line: (v) => `Frozen and Stunned dragons stay stopped ${x2(v)} as long` },
    attr("guild_charter", "Guild Charter", "rare", "crit", 0.02, "Crit"),
    { id: "menders_bell", name: "Mender's Bell", tier: "rare", fx: "regen", v: G(0.015), lab: "Heal every 10 s", num: pc,
      line: (v) => `Every 10 s the wall heals ${DD.P && DD.P.wallHP ? fmt(Math.round(DD.P.wallHP() * v)) : pc(v) + " of its"} Wall HP`,
      note: "The number is that share of the party's Wall HP. A broken wall does not heal." },
    attr("titans_belt", "Titan's Belt", "epic", "area", 0.05, "Area"),
    attr("chronos_sand", "Chronos Sand", "epic", "dur", 0.05, "Duration"),
    attr("crown_of_wings", "Crown of Wings", "epic", "haste", 0.04, "Haste"),
  ];
  /* C46 (user no. 95: "benerin 4 artifak yang tidak tambah apa2, ganti levelnya jadi sesuai 3 level aja untuk mythic dan ubah menjadi
     mythic, dan di lock tidak untuk di release sekarang"): the four whose levels gave nothing become Mythic artifacts with 3 levels,
     each level one step; locked: no chest gives them, the Artifacts page does not show them, a worn one does nothing yet. */
  DD.COLL_TIERS.mythic = { name: "Mythic", w: 0, v: 0 };
  const MY = { tier: "mythic", locked: true, max: 3, copies: [1, 2, 3] };
  Object.assign(DD.COLL.dragon_compass, MY, { v: (lv) => Math.max(1, lv) - 1, lab: "Hero Call Refresh", num: (v) => (v ? "+" + v : "4 heroes"),
    line: (v) => "Hero Call shows 4 heroes" + (v ? `, Hero Call Refresh +${v}` : ""), note: "Hero Call usually shows 3 heroes." });
  Object.assign(DD.COLL.royal_seal, MY, { v: (lv) => Math.max(1, lv), lab: "Free Refresh", num: (v) => "+" + v, line: (v) => `Free Refresh +${v} a battle`,
    note: `Every battle has ${DD.FREE_REFRESH} Free Refreshes.` });
  const MYN = [
    { id: "sages_lens", name: "Sage's Lens", fx: "evoEarly", v: (lv) => Math.max(1, lv), lab: "Evo after", num: (v) => `${DD.EVO_FROM - v} cards`,
      line: (v) => `Evo Cards can show once a hero has ${DD.EVO_FROM - v} card${DD.EVO_FROM - v === 1 ? "" : "s"} in the battle (normally ${DD.EVO_FROM})` },
    { id: "fates_coin", name: "Fate's Coin", fx: "oddsStart", v: (lv) => 1 + Math.max(1, lv), lab: "Mythic at start", num: (v) => pc(Object.fromEntries(DD.cardOdds(v)).mythic),
      line: (v) => `Card odds when a battle starts: ${odds(v)}`, note: `Without it a battle starts at ${odds(0)}. Each Free Refresh moves the odds on from there.` },
  ].map((a) => Object.assign(a, MY));
  NEW.push(...MYN);
  // pictures: 2a/rel_<id>.webp once painted (DD.REL_READY); until then the Artifacts icon stands in
  DD.REL_READY = DD.REL_READY || ["ember_stone", "tide_pearl", "thorn_seed", "storm_shard", "iron_rivet", "frost_crystal", "quarry_stone", "viper_fang", "shadow_lantern", "saints_relic", "rune_die", "wyrm_tooth", "winter_heart", "guild_charter", "menders_bell", "titans_belt", "chronos_sand", "crown_of_wings", "sages_lens", "fates_coin"]; // C46: painted (A44, docs/art-2a/relics2)
  for (const a of NEW) { a.isNew = true; a.art = `2a/rel_${a.id}.webp`; a.icon = DD.REL_READY.includes(a.id) ? a.art : "2a/ic_artifacts.webp"; a.noArt = !DD.REL_READY.includes(a.id); }
  DD.COLLECTION.push(...NEW);
  DD.COLL = Object.fromEntries(DD.COLLECTION.map((c) => [c.id, c]));
  DD.RELEASED = DD.COLLECTION.filter((c) => !c.locked); // what the game shows and the chests give (C46)
  // the party attributes an artifact can raise directly (the others act inside the battle, P.artMods)
  DD.ART_PARTY_FX = ["boss", "hp", "crit", "critDmg", "haste", "area", "dur", "proj"];
  /** C45: a count with a fraction for one battle: the whole part, plus one more by chance. */
  DD.rollCount = (v, rnd) => { const f = v - whole(v); return whole(v) + (f > 1e-9 && (rnd || Math.random)() < f ? 1 : 0); }; // no draw for a whole count
})();
