/* Rancangan v4, tahap B3 Hero dan serangan (Ledger Confirmed C56): tier ranges and regrouping, one level curve, hero Power Lv 1 points, the 32 attacks and card kits.
   Design: docs/rancangan-v4/03-tier-stat-hero.md + 04-skill-serangan.md. Everything here works behind the v4 switch (DD.V4; see js/v4-core.js), on for everyone since B6 (?v3 = the old rules).
   Loaded after js/v4-core.js. */
(function () {
  const V = DD.v4;
  if (!V) return;

  /* ------------------------------------------------------------ G3 §5: one level curve for every hero */
  /** Power multiplier at a level (G3 §5): ATK ×1.15 a level to Lv 20, Speed ×1.3 at Lv 10, Crit DMG ×2 → ×3 at Lv 15 (≈ ×1.07 on Power at
      the tiers' base crit), then ×1.08 a level (ATK +5 %, Speed +2 %, Crit +0.5 %). Lv 5 ×1.75 · 10 ×4.57 · 15 ×9.84 · 20 ×19.8 · 50 ×199. */
  V.lvCurve = (lv) => {
    lv = Math.max(1, lv || 1);
    const main = Math.min(lv, 20), past = Math.max(0, lv - 20);
    return Math.pow(1.15, main - 1) * (lv >= 10 ? 1.3 : 1) * (lv >= 15 ? 1.07 : 1) * Math.pow(1.08, past);
  };
  /** HP multiplier at a level (G3 §5): ×1.10 a level to Lv 20, then ×1.03 */
  V.hpCurve = (lv) => { lv = Math.max(1, lv || 1); return Math.pow(1.1, Math.min(lv, 20) - 1) * Math.pow(1.03, Math.max(0, lv - 20)); };

  /* ------------------------------------------------------------ G3 §3.2 tier sheet and §7 hero sheet */
  V.TIERS = {
    common: { power: 10, hp: 100, crit: 0.05, evo: 2 },
    rare: { power: 13, hp: 120, crit: 0.06, evo: 2 },
    epic: { power: 16.9, hp: 145, crit: 0.07, evo: 2 },
    legendary: { power: 22, hp: 175, crit: 0.08, evo: 3 },
    mythic: { power: 28.6, hp: 210, crit: 0.1, evo: 3 },
  };
  /** Power range of a tier at a level (Lv 1 point ±10 %, G3 §3.1) */
  V.tierRange = (tier, lv) => { const t = V.TIERS[tier]; if (!t) return null; const k = V.lvCurve(lv || 1); return [t.power * 0.9 * k, t.power * 1.1 * k]; };
  // id: [tier, Power Lv 1, HP Lv 1, base Crit, role] (G3 §7). Roles: G3 §6 (Breaker = penghancur, Area, Guard = penjaga, Control = kontrol / pemulih, Summoner = pemanggil)
  V.G3 = {
    ebenezer: ["common", 10.8, 95, 0.05, "Breaker"], "half-goblin": ["common", 10, 100, 0.05, "Area"], enchantress: ["common", 9.2, 115, 0.05, "Control"],
    mercenary: ["common", 10.8, 92, 0.1, "Breaker"], tracker: ["common", 9.6, 105, 0.05, "Summoner"], klaus: ["common", 10, 100, 0.05, "Area"],
    dwarf: ["rare", 12.5, 140, 0.06, "Guard"], occultist: ["rare", 13, 115, 0.06, "Area"], leprechaun: ["rare", 13.8, 110, 0.11, "Breaker"],
    cassandra: ["rare", 12.2, 130, 0.11, "Control"], minstrel: ["rare", 12.6, 125, 0.06, "Control"], scout: ["rare", 14, 110, 0.06, "Breaker"],
    "sugarplum-faerie": ["rare", 12.9, 115, 0.06, "Area"],
    spellsword: ["epic", 16.9, 150, 0.07, "Breaker"], knight: ["epic", 17.5, 150, 0.07, "Area"], "jack-frost": ["epic", 15.8, 140, 0.07, "Control"],
    "guild-leader": ["epic", 17.2, 135, 0.12, "Breaker"], szopin: ["epic", 16.6, 165, 0.07, "Guard"], archaeologist: ["epic", 16, 145, 0.07, "Control"],
    tristan: ["epic", 18, 140, 0.12, "Breaker"],
    sorceress: ["legendary", 23.5, 160, 0.08, "Area"], crusader: ["legendary", 21, 190, 0.08, "Guard"], "tou-lak": ["legendary", 20.5, 210, 0.08, "Guard"],
    alchemist: ["legendary", 22, 165, 0.08, "Area"], "time-traveler": ["legendary", 22.5, 165, 0.13, "Breaker"], viking: ["legendary", 22.5, 190, 0.08, "Guard"],
    alexandra: ["mythic", 29, 200, 0.15, "Breaker"], marpesia: ["mythic", 29.5, 210, 0.1, "Area"], "loeg-yllavyre": ["mythic", 27.5, 220, 0.1, "Summoner"],
    "amar-suen": ["mythic", 28.5, 200, 0.15, "Breaker"], dreamwalker: ["mythic", 28.5, 210, 0.1, "Control"],
    "kael-dragon": ["mythic", 100, 230, 0.1, "Breaker"], // G3 §8: "very mythic", ×3.5 the Mythic average, outside the range, never tuned down
  };
  /** a hero's Power (damage per second, no battle cards, no party bonus) at a level: its G3 Lv 1 point × the one curve (replaces B1's interim) */
  V.heroDps = (id, lv) => {
    const g = V.G3[id];
    const p1 = g ? g[1] : (V.TIERS[DD.HERO[id] && DD.HERO[id].tier] || V.TIERS.common).power;
    return p1 * V.lvCurve(lv);
  };

  if (!DD.V4) return;
  // screens: v4-only CSS hangs on this class (css/theme-2a.css "Rancangan v4 B3")
  if (typeof document !== "undefined" && document.documentElement && document.documentElement.classList) document.documentElement.classList.add("dd-v4");

  /* ------------------------------------------------------------ G3 §4 and §7: tiers (Hobb and Tristan Rare → Epic), HP, base Crit, role */
  for (const [id, [tier, , hp, crit, role]] of Object.entries(V.G3)) {
    const h = DD.HERO[id];
    if (!h) continue;
    h.tier = tier;
    h.hp = hp;
    h.w.crit = crit;
    h.v4role = role;
    if (id === "kael-dragon") h.ascended = true; // G3 §8: the "Ascended" mark is his alone
  }
  DD.RECRUIT_POOL = DD.HEROES.filter((h) => h.tier !== "commander" && h.tier !== "mythic" && !(DD.ART_PENDING && DD.ART_PENDING.has(h.id)));

  /* ------------------------------------------------------------ G3 §5 in battle: the same steps for every hero (C53 / C55 per-hero Lv 20 steps gone) */
  DD.levelMods = function (h, lv) {
    lv = Math.max(1, lv || 1);
    const main = Math.min(lv, DD.MAIN_LV), past = Math.max(0, lv - DD.MAIN_LV);
    const base = (h && h.w && h.w.crit) || 0, room = Math.max(0, 0.6 - base);
    const critUp = Math.min(room, 0.005 * past); // Crit +0.5 % a level from Lv 21, up to 60 % in all
    const over = Math.max(0, past - Math.ceil(room / 0.005 - 1e-9)); // past 60 %: Crit DMG +2 % a level instead
    return {
      dmgL: Math.pow(1.15, main - 1) * Math.pow(1.05, past),
      rateL: (lv >= 10 ? 1.3 : 1) * Math.pow(1.02, past),
      hpMul: V.hpCurve(lv),
      extra: critUp > 0 ? { crit: critUp } : {}, // no Lv 5 / Lv 20 stat steps any more: Lv 5 opens the Unique Card, Lv 20 starts with Evo 1 (G3 §5)
      critMul: (lv >= 15 ? 3 : 2) + 0.02 * over,
      lv6: lv >= DD.MAIN_LV,
    };
  };
  /** the level steps on the hero page (G3 §5, §10): what opens at each step */
  V.lvSteps = (h) => [
    [5, "Unique Card opens."],
    [10, "Attack Speed ×1.3. Evo Card 1 opens."],
    [15, "Crit Damage ×2 → ×3. Mythic Card opens."],
    [20, "Every battle starts with Evo Card 1. Evo Card 2 opens."],
    ...((V.TIERS[h.tier] || {}).evo >= 3 ? [[30, "Evo Card 3 opens."]] : []),
  ];
  /** the Stats tab of the hero page (G3 §10): Power with where the hero sits in its tier, Crit, role and the attack's rhythm */
  V.statsUI = (h, lv) => {
    const m = DD.levelMods(h, lv), [lo, hi] = V.tierRange(h.tier, 20);
    const crit = Math.round(((h.w.crit || 0) + (m.extra.crit || 0)) * 1000) / 10, every = h.w.cd || h.w.tick;
    const n = (x) => (x < 1000 ? String(Math.round(x)) : DD.fmt(x));
    return {
      power: (L) => V.heroDps(h.id, L),
      tier: DD.TIER_NAME[h.tier],
      band: h.ascended ? "Ascended" : `Lv 20: ${n(lo)}⁠–⁠${n(hi)}`, // the range never breaks at its dash
      hpNote: `Crit ${crit}% · ×${Math.round(m.critMul * 100) / 100}`,
      line: `Role: ${h.v4role} · ${every ? `1 attack every ${Math.round((every / m.rateL) * 100) / 100} s` : "attacks all the time"}`,
    };
  };
})();

/* ================================================================ G4 · attacks, signature effects and card kits (docs/rancangan-v4/04-skill-serangan.md)
   Built on the C55 attacks (js/attacks-c55.js): the shapes that passed the user's rules stay, four change (Plum: a candy swarm that hovers
   over the densest part; Aldous: the tide pours down from the top to the wall; Klaus and Amar-Suen: no coins), the full-screen effects rise
   from the wall or fall from the top (no left-right crossing), every hero gets the G4 kit: 4 Skill Cards (Kael and Dragon Kael 5) with Rare /
   Epic / Legendary values and caps, a Unique Card (Lv 5), a Mythic Card (Lv 15), 2 Evo Cards (Common–Epic) or 3 (Legendary, Mythic: Lv 30).
   Caps written as "N things" in G4 are the total (cap = N − the attack's own number); Kael's "4" is the C53 cap (+4).
   Freeze: the C55 rule already holds every stop to 0.4 s with 1.6 s between (js/battle-c43.js, DD.FREEZE_MAX / FREEZE_CD). */
(function () {
  if (!DD.V4 || !DD.v4) return;
  const V = DD.v4;
  const PCT = { dmg: 1, rate: 1, size: 1, crit: 1, critDmg: 1 };
  // skill: [name, stat, Rare, Epic, Legendary (null = none), cap (null = no limit), note]; u / m: [name, text, effect]; e: [name, tier, text, effect, repeatable, key]
  const KIT = {
    ebenezer: { s: [["Debt Damage", "dmg", 0.4, 0.8, 1.2, 4], ["Debt Seals", "count", 1, 2, null, 3], ["Seal Size", "size", 0.2, 0.4, 0.6, 1.5], ["Debt Term", "dur", 0.5, 1, null, 2, "each second +25% payout"]],
      u: ["Compound Interest", "A seal that lands on an already sealed scale doubles the debt instead of starting a new one.", { flag: "compound" }],
      m: ["Golden Torrent", "Debt Damage +200% and every seal also seals the 2 scales beside it.", { stat: { dmg: 2 }, flag: "torrent" }],
      e: [["Penny Storm", "epic", "Every attack stamps 2 more seals on the next scales behind the first.", { flag: "sweep3" }], ["Taxman", "mythic", "Every 10th payout is collected ×5.", { flag: "taxman4" }]] },
    "half-goblin": { s: [["Shadow Damage", "dmg", 0.4, 0.8, 1.2, 4], ["Shadows", "count", 1, 2, null, 3], ["Stabs per Scale", "pierce", 1, 2, 3, 3], ["Run Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Venom Tips", "Every stab leaves 2 Poisoned stacks instead of 1.", { flag: "venom2" }],
      m: ["Death by a Thousand Cuts", "Shadows +2 and Poisoned stacks up to 10.", { stat: { count: 2 }, flag: "poison10" }],
      e: [["Boomerang Run", "epic", "When a shadow reaches the head it turns and runs back to the tail.", { flag: "returnDagger" }], ["Heist", "legendary", "A scale killed by a shadow drops 3 daggers that fly to the nearest scales.", { flag: "heist" }]] },
    enchantress: { s: [["Bubble Damage", "dmg", 0.4, 0.8, null, 4], ["Bubbles", "bounce", 1, 2, null, 4], ["Pops per Bubble", "multi", 1, 2, null, 2], ["Cast Speed", "rate", 0.25, 0.5, null, 2]],
      u: ["Heart Splash", "The last pop of a bubble splashes Wet onto the 2 scales beside it.", { flag: "splash4" }],
      m: ["True Love", "Bubble Damage +200% and every pop heals the wall 0.6%.", { stat: { dmg: 2 }, flag: "trueLove" }],
      e: [["Twin Hearts", "epic", "Two waves rise at once, side by side.", { flag: "twinWave" }], ["Tidal Embrace", "legendary", "Every 12 s a giant bubble rises and holds the front 6 scales for 0.4 s.", { every: 12, fx: "v4embrace" }]] },
    mercenary: { s: [["Shot Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.9], ["Crit Damage", "critDmg", 0.4, 0.8, null, null], ["Reload Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Armour Breaker", "The tail scale he locks onto gets 3 Cracked stacks at once.", { flag: "armourTail" }],
      m: ["Headhunter", "Shot Damage +200% and Crit Chance +50%.", { stat: { dmg: 2, crit: 0.5 } }],
      e: [["Double Tap", "epic", "Every shot fires twice along the same line.", { flag: "doubleTap" }], ["Bounty Hunter", "mythic", "A crit on a head deals ×3.", { flag: "bountyCrit" }]] },
    tracker: { s: [["Wolf Damage", "dmg", 0.4, 0.8, null, 4], ["Wolves", "count", 1, 2, null, 3], ["Wolf Time", "dur", 1, 2, null, 8], ["Leap Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Pack Hunt", "Every 3 s each wolf leaps at the toughest scale near it and bites for 200%.", { flag: "packHunt4" }],
      m: ["Spirit Pack", "Wolves +2 and Wolf Time +6 s.", { stat: { count: 2, dur: 6 } }],
      e: [["Alpha", "epic", "One wolf is an Alpha: bigger, bites twice per landing.", { flag: "alpha4" }], ["Spirit Howl", "legendary", "Every 15 s the pack howls: the whole dragon moves ×0.8 for 3 s.", { every: 15, fx: "v4howl" }]] },
    klaus: { s: [["Firework Damage", "dmg", 0.4, 0.8, null, 4], ["Rockets", "count", 1, 2, null, 3], ["Burst Size", "size", 0.2, 0.4, 0.6, 1.5], ["Sparkle Time", "dur", 0.5, 1, null, 2]],
      u: ["Second Burst", "Every burst bursts again 1 s later for 60%.", { flag: "secondBurst" }],
      m: ["Christmas Eve", "Rockets +2 and Burst Size +60%.", { stat: { count: 2, size: 0.6 } }],
      e: [["Sack of Plenty", "epic", "3 rockets go up every launch.", { flag: "triple" }], ["Surprise Box", "legendary", "Every 6th rocket is a giant firework: 400% within 88 px.", { flag: "surpriseBox" }]] },
    dwarf: { s: [["Eruption Damage", "dmg", 0.4, 0.8, 1.2, 4.5], ["Tunnels", "count", 1, 2, null, 3], ["Shard Spread", "size", 0.2, 0.4, 0.6, 1.5], ["Dig Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Quake Return", "Every 4th eruption shakes the ground: Staggered on every scale within 120 px.", { flag: "quake4" }],
      m: ["Mountain King", "Eruption Damage +200% and Tunnels +2.", { stat: { dmg: 2, count: 2 } }],
      e: [["Mountain Stand", "epic", "Each eruption leaves a stone pillar for 3 s that every passing scale hits for 50%.", { flag: "pillar" }], ["Avalanche", "legendary", "Every 18 s boulders roll down the whole body from tail to head: 300% to every scale.", { every: 18, fx: "v4rollTail", mult: 3 }]] },
    occultist: { s: [["Skull Damage", "dmg", 0.4, 0.8, 1.2, 4.5], ["Skulls", "count", 1, 2, null, 3], ["Ring Size", "size", 0.2, 0.4, null, 1.5], ["Bite Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Curse of the Ring", "A scale bitten 4 times is Cursed: the next hit on it is a crit.", { flag: "ringCurse" }],
      m: ["Necropolis", "Skulls +3 and Skull Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Lich", "epic", "The ring follows the scale it sits on until that scale breaks.", { flag: "lich" }], ["Grave Call", "legendary", "Every 20 s a wave of spirits rises from the wall to the top: 300% to every scale.", { every: 20, fx: "screen", mult: 3, sprite: "skull" }]] },
    leprechaun: { s: [["Strike Damage", "dmg", 0.4, 0.8, 1.2, 4.5], ["Clovers", "count", 1, 2, null, 2, "3 clovers a planting at most"], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8], ["Planting Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Lucky Charm", "Jackpot comes 1 in 3 instead of 1 in 5.", { flag: "lucky3" }],
      m: ["Jackpot", "Strike Damage +200% and every Jackpot also strikes the 2 scales beside it.", { stat: { dmg: 2 }, flag: "jackpot3" }],
      e: [["Pot of Gold", "epic", "Every clover plants a second clover 60 px further along the path.", { flag: "twin" }], ["Rainbow Road", "legendary", "Every 15 s a rainbow lies along the path for 4 s: 30% a second to every scale on it.", { every: 15, fx: "v4rainbow" }]] },
    cassandra: { s: [["Lash Damage", "dmg", 0.4, 0.8, 1.2, 4.5], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8], ["Lash Speed", "rate", 0.25, 0.5, null, 1.5], ["Claw Size", "size", 0.2, 0.4, null, 1.5]],
      u: ["Hook and Drag", "The front scale under the claws is hooked: the whole dragon is pulled back 10 px (once every 3 s).", { flag: "hook3" }],
      m: ["Moon Huntress", "Lash Damage +200% and Crit Chance +50%.", { stat: { dmg: 2, crit: 0.5 } }],
      e: [["Moonbound", "epic", "Every slash strikes twice, the second set crossing the first.", { flag: "double" }], ["Thorn Snare", "legendary", "Every 16 s thorns grow over the front third of the body: 50% a second for 3 s.", { every: 16, fx: "v4thorns" }]] },
    minstrel: { s: [["Note Damage", "dmg", 0.4, 0.8, null, 4], ["Pulses", "count", 1, 2, null, 3], ["Ring Size", "size", 0.2, 0.4, 0.6, 1.5], ["Play Speed", "rate", 0.25, 0.5, null, 2]],
      u: ["Resonance", "A scale hit by 2 pulses within 0.5 s takes the second pulse ×2.", { flag: "resonance" }],
      m: ["Encore", "Pulses +3 and Note Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Lullaby", "epic", "Pulses make scales Drowsy: the next hit on them ×1.5.", { flag: "drowsy" }], ["Crescendo", "legendary", "Every note's pulses grow: each pulse +25% (up to ×2).", { flag: "crescendo" }]] },
    scout: { s: [["Talon Damage", "dmg", 0.4, 0.8, 1.2, 4.5], ["Hawks", "count", 1, 2, null, 3], ["Talon Reach", "pierce", 1, 2, 3, 2, "4 scales per dive at most"], ["Dive Speed", "rate", 0.25, 0.5, null, 2]],
      u: ["Volley", "Every dive also drops 3 arrows on the scales behind it (50% each).", { flag: "volley4" }],
      m: ["Hail of Arrows", "Hawks +2 and Talon Damage +200%.", { stat: { count: 2, dmg: 2 } }],
      e: [["Splitting Talons", "epic", "Every dive tears 2 more scales behind the first.", { flag: "split" }], ["Sky Hunter", "legendary", "Every 5 s the hawk marks the toughest scale and the 2 beside it: dives on them ×2.", { flag: "hawk" }]] },
    "sugarplum-faerie": { s: [["Sweet Damage", "dmg", 0.4, 0.8, null, 4], ["Sweets", "count", 1, 2, null, 4], ["Sticky Time", "dur", 0.5, 1, 1.5, 4], ["Drop Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Gumdrop", "A scale with 3 sweets stuck on it takes +30% from every hero.", { flag: "gumdrop" }],
      m: ["Candy Kingdom", "Sweets +3 and Sweet Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Sugar Storm", "epic", "A second swarm follows the second densest part.", { flag: "swarm2" }], ["Candy Burst", "legendary", "Every 20 s the swarms burst into a sugar storm over the screen: 250% to every scale, and every scale gets 1 sweet stuck.", { every: 20, fx: "v4candy" }]] },
    spellsword: { s: [["Bolt Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Crit Damage", "critDmg", 0.4, 0.8, null, 1.6], ["Bolt Speed", "rate", 0.25, 0.5, null, 2], ["Bolt Count", "count", 1, 2, null, 4], ["Bolt Crit Chance", "crit", 0.1, 0.2, 0.5, 0.9]],
      u: ["Edge Bounce", "+3 Pierce, and a bolt that hits the end of the screen bounces back to hit again.", { stat: { pierce: 3 }, flag: "edgeBounce" }],
      m: ["Arcane Storm", "Bolt Damage +200% and Crit Chance +50%.", { stat: { dmg: 2, crit: 0.5 } }],
      e: [["Twin Shot", "legendary", "Every bolt fires a twin beside it.", { flag: "twinBolt" }, true], ["Split Bolt", "mythic", "A bolt that hits splits into 3 small bolts (50%).", { flag: "split3" }]] },
    knight: { s: [["Cross Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Cross Size", "size", 0.2, 0.4, 0.6, 2], ["Charge Speed", "rate", 0.25, 0.5, null, 1.5], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8]],
      u: ["Judgement", "Judged scales take +30% (not +15%) for 5 s.", { flag: "judgement2" }],
      m: ["Dawnbreaker", "Cross Damage +200% and Cross Size +60%.", { stat: { dmg: 2, size: 0.6 } }],
      e: [["Skyfall", "epic", "Two more crosses strike the 2 densest spots.", { flag: "skyfall" }], ["Sunrise", "mythic", "Every 12 s the sky opens for 1.5 s: holy light hits every scale on the screen, 300% a second.", { every: 12, fx: "sweep", mult: 3, t: 1.5 }]] },
    "jack-frost": { s: [["Snowball Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Snowballs", "count", 1, 2, null, 3], ["Roll Time", "dur", 0.5, 1, null, 2.5], ["Snowball Size", "size", 0.2, 0.4, 0.6, 1.5]],
      u: ["Frostbite", "Chilled and Frozen scales take +30% from snowballs.", { flag: "frostbite4" }],
      m: ["Blizzard", "Snowballs +2 and Snowball Damage +200%.", { stat: { count: 2, dmg: 2 } }],
      e: [["Snowman", "epic", "A snowman stands at the wall for 6 s and breathes frost at the nearest scale (50% every 0.5 s).", { flag: "snowman4" }], ["Frost Storm", "legendary", "Every 18 s a blizzard covers the screen for 3 s: 60% a second and Chilled to every scale.", { every: 18, fx: "v4blizzard" }]] },
    "guild-leader": { s: [["Chain Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Binds", "count", 1, 2, null, 3], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8], ["Crit Damage", "critDmg", 0.4, 0.8, null, null]],
      u: ["Brand", "Bound scales are Branded: they take ×1.5 from every hero; the brand fades 3 s after the chain.", { flag: "brand4" }],
      m: ["Guildmaster", "Binds +3 and Chain Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Murder of Crows", "epic", "Crows fly along each chain: 3 pecks of 40% on each bound scale.", { flag: "crows3" }], ["Guild Bounty", "legendary", "A bound scale that breaks passes its chain to the next strongest scale.", { flag: "chainPass" }]] },
    szopin: { s: [["Rift Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Rifts", "count", 1, 2, null, 3], ["Rift Time", "dur", 0.5, 1, 1.5, 4], ["Rift Size", "size", 0.2, 0.4, 0.6, 1.5]],
      u: ["Chain Hook", "Every 0.4 s a dark chain lashes out of each rift at the nearest scale outside it for 100%.", { flag: "chainHook" }],
      m: ["God Slayer", "Rift Damage +200% and Rift Size +60%.", { stat: { dmg: 2, size: 0.6 } }],
      e: [["Wrath Unchained", "epic", "When a rift closes it bursts: 200% to every scale that was inside.", { flag: "boom" }], ["Bloodlust", "legendary", "Every scale that breaks inside a rift makes Szopin's rifts +10% for the battle (up to +100%).", { flag: "blood4" }]] },
    archaeologist: { s: [["Glyph Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Glyph Sets", "count", 1, 2, null, 3], ["Glyph Time", "dur", 0.5, 1, null, 3], ["Triangle Size", "size", 0.2, 0.4, 0.6, 1.5]],
      u: ["Relic Shards", "When a triangle fades its 3 glyphs burst for 150% within 50 px.", { flag: "relicShards" }],
      m: ["Lost Expedition", "Glyph Sets +2 and Glyph Damage +200%.", { stat: { count: 2, dmg: 2 } }],
      e: [["Ancient Seal", "epic", "Scales inside a triangle move ×0.85 (only near the wall).", { flag: "seal85" }], ["Petrify", "legendary", "Stone scales take ×3 instead of ×2 from Physical and Rock hits.", { flag: "petrify3" }]] },
    tristan: { s: [["Petal Damage", "dmg", 0.4, 0.8, 1.2, 5], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8], ["Bloom Speed", "rate", 0.25, 0.5, null, 1.5], ["Roses", "count", 1, 2, null, 3]],
      u: ["Burning Trail", "Petals leave a line of fire for 2 s: 30% a second.", { flag: "fireLine" }],
      m: ["Ember Knight", "Petal Damage +200% and Crit Chance +50%.", { stat: { dmg: 2, crit: 0.5 } }],
      e: [["Twin Edge", "epic", "Every rose has 8 petals.", { flag: "double" }], ["Flame Tornado", "legendary", "Every 15 s the roses join into a fire tornado that climbs the body for 3 s: 80% a second.", { every: 15, fx: "v4tornado" }]] },
    sorceress: { s: [["Flame Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Flame Width", "size", 0.2, 0.4, 0.6, 1.2], ["Flame Time", "dur", 0.5, 1, null, 2], ["Cast Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Scorch", "Every second a Burning scale sets the scale behind it Burning, for 50% of a flame hit.", { flag: "scorch" }],
      m: ["Inferno", "Flame Damage +200% and Flame Width +60%.", { stat: { dmg: 2, size: 0.6 } }],
      e: [["Dragon Fury", "epic", "Two more cones pour back along the body from the 6th and the 12th scale behind the head.", { flag: "triple" }],
        ["Phoenix Wings", "legendary", "Every 10 s a phoenix rises from the wall to the top of the screen: 400% to every scale it crosses and Burning.", { every: 10, fx: "screen", mult: 4, status: "fire", sprite: "phoenix" }],
        ["Meteor", "mythic", "Every 6 s a meteor falls on the thickest part of the body: 600% within 90 px, then a lava pool for 3 s (100% a second).", { every: 6, fx: "dense", mult: 6, r: 90, zone: 1, zoneT: 3, sprite: "meteor" }]] },
    crusader: { s: [["Tide Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Tide Height", "size", 0.2, 0.4, 0.6, 2], ["Afterburn", "dur", 0.5, 1, 1.5, 3], ["Prayer Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Consecrate", "The tide leaves holy ground under the last 3 scales it hits for 3 s (60% a second, Judged).", { flag: "consecrate" }],
      m: ["Templar", "Tide Damage +200% and Execute at 20%.", { stat: { dmg: 2 }, flag: "exec20" }],
      e: [["Holy Harvest", "epic", "Every Execute heals the wall 1%.", { flag: "harvest1" }], ["Crusade", "legendary", "A second tide follows 0.5 s behind the first.", { flag: "splitsaw" }],
        ["Divine Judgement", "mythic", "Every 25 s a judgement falls on the whole screen: every scale under 30% life breaks (not a head).", { every: 25, fx: "v4judge" }]] },
    "tou-lak": { s: [["Zap Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Zap Targets", "count", 1, 2, null, 4], ["Totem Time", "dur", 0.5, 1, 1.5, 4], ["Totem Reach", "size", 0.2, 0.4, null, 1.5]],
      u: ["Thunder Roar", "The thunderclap also pushes the dragon back 8 px (only near the wall).", { flag: "roar8" }],
      m: ["Warlord", "Zap Damage +200% and Zap Targets +3.", { stat: { dmg: 2, count: 3 } }],
      e: [["Intimidate", "epic", "Scales zapped 3 times are Shaken: they take +25% from every hero for 3 s.", { flag: "shaken" }], ["Stampede", "legendary", "Every 20 s spirit buffalo charge up 3 lanes: 300% to every scale in them.", { every: 20, fx: "lanes", n: 3, mult: 3, sprite: "beast" }],
        ["War Drums", "mythic", "With 2 or more totems standing, every hero attacks 20% faster.", { flag: "warDrums" }]] },
    alchemist: { s: [["Vial Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Vials", "count", 1, 2, null, 4], ["Vial Size", "size", 0.2, 0.4, 0.6, 1.5], ["Spiral Time", "dur", 0.5, 1, null, 3]],
      u: ["Mixed Brew", "Vials alternate between her best and her second-best element, so 2 statuses build up for reactions.", { flag: "brew2" }],
      m: ["Grand Alchemy", "Vials +4 and Vial Damage +200%.", { stat: { count: 4, dmg: 2 } }],
      e: [["Transmute", "epic", "A scale hit by 3 different elements turns to gold glass: ×2 from every hero for 3 s.", { flag: "glass" }],
        ["Grand Experiment", "legendary", "Every 45 s Pell throws 10 flasks of random elements for 300% each. A scale killed by one sets off its element around it (unless the dragon has that element): Fire = Burning around it · Nature = Entangled and the whole dragon ×0.7 speed for 5 s, plus 10% to every scale · Electric = lightning runs toward the head, 50% +10% per scale it passes · Water = the dragon stops 0.4 s · Physical = the scale in front and behind break at once.", { every: 45, fx: "v4flasks", n: 10, mult: 3 }],
        ["Philosopher's Stone", "mythic", "Every reaction a vial starts is ×2.", { flag: "stone2" }]] },
    "time-traveler": { s: [["Sigil Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Echo Strength", "size", 0.1, 0.2, 0.3, 1, "replay up to 100%"], ["Charge Speed", "rate", 0.25, 0.5, null, 1.5], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.8]],
      u: ["Slow Time", "Scales under a sigil move ×0.85 (only near the wall).", { flag: "slowSigil" }],
      m: ["Grandfather Clock", "Sigils +3 and Sigil Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Paradox", "epic", "Every sigil also sits on the 2 scales beside it.", { flag: "paradox" }], ["Rewind", "legendary", "Every 30 s the front 10 scales are rewound 30 px back along the path.", { every: 30, fx: "v4rewind" }],
        ["Time Stop", "mythic", "Every 40 s time stops for 3 s: every hit lands together at the end, ×1.5. The dragon is frozen only 0.4 s of it.", { every: 40, fx: "timestop", t: 3, mult: 1.5 }]] },
    viking: { s: [["Cyclone Damage", "dmg", 0.4, 0.8, 1.2, 6], ["Cyclone Size", "size", 0.2, 0.4, 0.6, 1.5], ["Cyclone Time", "dur", 0.5, 1, 1.5, 3], ["Spin Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Berserk", "Every second a cyclone climbs, it hits 10% harder (up to +100%).", { flag: "berserk" }],
      m: ["Valhalla", "Cyclone Damage +200% and Cyclone Size +60%.", { stat: { dmg: 2, size: 0.6 } }],
      e: [["Berserker", "epic", "Each cyclone splits into 2 at its first hit.", { flag: "splitsaw" }], ["Frost Giant", "legendary", "Every 20 s a frost giant stamps the front of the body: 400% to the front 8 scales.", { every: 20, fx: "v4stamp", n: 8, mult: 4, sprite: "giant" }],
        ["Ragnarok", "mythic", "Every 30 s axes rain over the whole screen for 2 s: 150% to every scale, twice.", { every: 30, fx: "v4ragnarok" }]] },
    alexandra: { s: [["Bolt Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Chains", "bounce", 1, 2, 3, 10, "16 jumps at most"], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.9], ["Cast Speed", "rate", 0.25, 0.5, null, 2]],
      u: ["Overcharge Plus", "Overcharge +20% a jump instead of +10%.", { flag: "over20" }],
      m: ["Forbidden Storm", "Bolt Damage +200% and Chains +5.", { stat: { dmg: 2, bounce: 5 } }],
      e: [["Infinite Library", "epic", "Every chain splits in two at its 3rd jump.", { flag: "split3rd" }], ["Storm Tome", "legendary", "Every 12 s the tome opens over the field for 2 s: lightning strikes every scale on the screen 4 times for 80%.", { every: 12, fx: "v4storm" }],
        ["Chain Reaction", "mythic", "A scale broken by a chain releases a new chain of 4 jumps.", { flag: "chainNew" }]] },
    marpesia: { s: [["Spear Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Spears", "count", 1, 2, null, 4], ["Pin Time", "dur", 0.5, 1, 1.5, 5], ["Spear Width", "size", 0.2, 0.4, 0.6, 1.5]],
      u: ["Valkyrie's Mark", "Holy Pin +40% instead of +20%.", { flag: "valk40" }],
      m: ["Sky Queen", "Spears +3 and Spear Damage +200%.", { stat: { count: 3, dmg: 2 } }],
      e: [["Rallying Cry", "epic", "While a spear is pinned, every hero attacks 15% faster.", { flag: "rally4" }], ["Spear Rain", "legendary", "Every 15 s 8 spears fall at once on the 8 toughest scales (200% each).", { every: 15, fx: "v4spearRain", n: 8, mult: 2 }],
        ["Valkyrie's Verdict", "mythic", "A pinned scale that breaks sends the spear on to the next densest spot.", { flag: "verdict4" }]] },
    "loeg-yllavyre": { s: [["Breath Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Elder Spirits", "count", 1, 2, null, 2], ["Flight Time", "dur", 1, 2, null, 8], ["Breath Speed", "rate", 0.25, 0.5, null, 1.5]],
      u: ["Wildgrowth", "A bloom on a scale that breaks plants 2 more seeds beside it.", { flag: "hatchery" }],
      m: ["Brood Mother", "Elder Spirits +2 and Breath Damage +200%.", { stat: { count: 2, dmg: 2 } }],
      e: [["Brood", "epic", "Each spirit leaves 2 drakelings that perch on the body for 6 s and bite (50% every 0.5 s).", { flag: "drakes" }],
        ["Elder Call", "legendary", "Every 25 s the elder dragon itself rises from the wall to the top of the field: 500% to every scale and Awed.", { every: 25, fx: "screen", mult: 5, status: "dragon", sprite: "elder" }],
        ["World Tree", "mythic", "Every bloom heals the wall 0.5% and roots the dragon: ×0.9 speed for 2 s.", { flag: "worldTree" }]] },
    "amar-suen": { s: [["Touch Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.9], ["Touch Speed", "rate", 0.25, 0.5, null, 2], ["Touches", "count", 1, 2, null, 3]],
      u: ["Midas", "Gold lasts 4 s instead of 2 s.", { flag: "midas4" }],
      m: ["Midas King", "Touch Damage +200% and Crit Chance +50%.", { stat: { dmg: 2, crit: 0.5 } }],
      // the old King's Ransom key gave Amar-Suen ×2 more on gold (js/battle-c43.js): this card keeps its name under another key
      e: [["Golden Crown", "epic", "Every touch turns 3 scales in a row to gold.", { flag: "crown4" }], ["King's Ransom", "legendary", "Every 20 s the front third of the body turns to gold for 4 s.", { every: 20, fx: "markFront", frac: 1 / 3, mark: "gold", t: 4 }, false, "King's Ransom v4"],
        ["Gilded Death", "mythic", "A crit on a gold scale breaks it at once (not a head).", { flag: "gildedDeath" }]] },
    dreamwalker: { s: [["Nightmare Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Dreamers", "count", 1, 2, null, 3], ["Sleep Time", "dur", 0.5, 1, 1.5, 4], ["Tendril Reach", "size", 0.2, 0.4, 0.6, 2]],
      u: ["Nightmare", "Tendrils also lash the scales 2 away. Near the wall, while 5 or more scales sleep, the dragon moves ×0.8.", { flag: "nightmare4" }],
      m: ["Endless Dream", "Dreamers +2 and Nightmare Damage +200%.", { stat: { count: 2, dmg: 2 } }],
      e: [["Deep Sleep", "epic", "Sleep lasts twice as long; sleeping scales take +40%.", { flag: "deep4" }], ["Waking World", "legendary", "Every 20 s every sleeping scale wakes screaming: 300% to it.", { every: 20, fx: "v4wake" }],
        ["Lucid", "mythic", "Sleeping scales are also Wet and Cursed.", { flag: "lucid4" }]] },
    "kael-dragon": { s: [["Meteor Damage", "dmg", 0.4, 0.8, 1.2, 7], ["Meteors", "count", 1, 2, null, 5], ["Crater Size", "size", 0.2, 0.4, 0.6, 2], ["Call Speed", "rate", 0.25, 0.5, null, 2], ["Crit Chance", "crit", 0.1, 0.2, 0.5, 0.9]],
      u: ["Dragonfire", "Craters burn 3 s and every crater hit is a crit.", { flag: "dragonfire4" }],
      m: ["Ascendance", "Meteor Damage +200% and Meteors +3.", { stat: { dmg: 2, count: 3 } }],
      e: [["Dragon Split", "epic", "Every meteor splits into 3 small meteors on impact (50% each).", { flag: "split" }], ["Wings of Ruin", "legendary", "Every call drops 2 showers in a row.", { flag: "twinshot" }],
        ["Dragon Form", "mythic", "Every 40 s Kael becomes the dragon for 6 s: every hero deals +50%.", { every: 40, fx: "v4dragonForm", t: 6 }]] },
  };
  // the attack itself (G4 §6 "Teks di game"): weapon, how it attacks, signature effect name and text
  const ATK = {
    ebenezer: ["Debt Seal", "Stamps a debt seal on the body scale closest to the wall. 1.2 s later the debt is paid: the healthier the scale, the harder it pays (up to ×3).", "Debt", "Pays up to ×3 on healthy scales; finishes nothing, opens everything."],
    "half-goblin": ["Shadow Run", "A shadow runs along the dragon's spine from its tail toward its head, stabbing every scale it passes.", "Toxin", "A scale with 5 Poisoned stacks bursts: 100% of the stacks onto it and the 2 scales beside it."],
    enchantress: ["Heart Bubbles", "Heart bubbles float up from the wall in waves and pop on the first scale they touch; every pop mends the wall a little.", "Mend", "Every pop heals the wall 0.3% of its HP."],
    mercenary: ["Longshot", "Locks onto the last scale of the dragon, then one shot crosses the field to it, through every scale on the way: +10% for every scale passed.", "Longshot", "+10% damage for every scale the shot has already passed."],
    tracker: ["Spirit Wolf", "Calls spirit wolves that leap from scale to scale over the body and bite where they land.", "Pack", "When 2 wolves bite the same scale within 1 s, the second bite mauls for ×2."],
    klaus: ["Gift Fireworks", "Launches gift rockets straight up that burst into stars over the thickest part of the body; each burst hides a gift.", "Gifts", "Each burst, at random: ×2 damage, 3 Chilled stacks, or the star splits into 3 small bursts (50% each)."],
    dwarf: ["Tunnel Axe", "Digs under the field and bursts up beneath the front scale, throwing rock shards upward in a fan.", "Upheaval", "The scale it bursts under takes ×2, then the shards fly up through the body."],
    occultist: ["Skull Swarm", "A ring of skulls circles the densest part of the body and bites everything inside the ring.", "Soul Harvest", "Every scale that breaks inside the ring adds 1 skull to it for this battle (up to +3)."],
    leprechaun: ["Clover Mines", "Plants clover mines on the dragon's path ahead of its head; a scale that crosses one sets it off.", "Luck", "1 strike in 5 is a Jackpot: ×5."],
    cassandra: ["Claw Lash", "Three giant thorn claws slash across the densest part of the body.", "Thorns", "Slashed scales are Entangled and the dragon is held for 0.15 s (only near the wall)."],
    minstrel: ["Echo Song", "A note lands on a scale and rings out 3 pulses; each pulse hits every scale within 60 px.", "Echo", "The 3rd pulse rings again on the nearest other scale."],
    scout: ["Hawk Dive", "Hawks dive from the sky onto scales and tear through them.", "Feathers", "Every dive leaves a feather; at 3 feathers the hawk returns once for a free dive on each feathered scale."],
    "sugarplum-faerie": ["Sugar Swarm", "A cloud of candy sprites hovers over the densest part of the body and drifts with it, dropping sweets that stick for 2 s, nipping.", "Sugar Rush", "Every 10 sweets that land, her next drop is doubled."],
    spellsword: ["Arcane Bolt", "Fires straight bolts where the squad aims; drag to aim.", "Aim", "Bolts fly where you drag; Edge Bounce makes them bounce off the screen edge."],
    knight: ["Holy Cross", "A cross of light strikes the front scale; every scale on its arms is hit and the ground burns for 2 s.", "Holy Ground", "The cross burns 2 s: 30% a second, and leaves Judged."],
    "jack-frost": ["Bouncing Snowball", "A snowball shoots off at an angle and bounces off the screen edges for 3 s, hitting every scale it crosses.", "Chill", "3 Chilled stacks freeze that scale 0.4 s (once every 4 s)."],
    "guild-leader": ["Binding Contract", "Dark chains shoot from the top corners and bind the 3 strongest scales for 3 s.", "Soul Link", "30% of the damage dealt to one bound scale also hits every other bound scale."],
    szopin: ["Void Rift", "Tears a black rift open in the densest part of the body for 2 s; scales inside are hurt, harder toward its heart.", "Void", "Damage inside the rift grows toward its heart: up to ×2 in the middle."],
    archaeologist: ["Glyph Triangle", "Sets 3 relic glyphs around the middle of the body and links them with light; scales on the links are hit, scales inside can turn to stone.", "Petrify", "A scale hit 5 times inside the triangle turns to stone for 2 s: Physical and Rock hits on it ×2."],
    tristan: ["Ember Rose", "A rose of fire blades blooms on the toughest scale; 4 petals spin out and slash every scale around it.", "Embers", "A scale slashed by 3 petals bursts: 150% within 40 px and Burning."],
    sorceress: ["Backdraft", "Turns the dragon's own fire against it: for 2.2 s a cone of flame pours from its head back along its body, burning every scale in it. The head is never burnt.", "Backfire", "Every scale in the cone is Burning."],
    crusader: ["Holy Tide", "A band of holy light pours down from the top of the field to the wall, hitting every scale once.", "Execute", "A scale left under 15% life by the tide breaks at once (not a head)."],
    "tou-lak": ["Thunder Totem", "Plants a thunder totem beside the front dragon's head; it zaps the 2 nearest scales every 0.5 s for 3 s.", "Static", "Every 8th zap of Tou'lak is a thunderclap: 150% to every scale within 110 px."],
    alchemist: ["Elixir Spiral", "Releases 6 vials that spiral out from the densest part of the body; each shatters on the first scale it meets, with the element that hurts that dragon most.", "Elixirs", "Every vial is one of her 8 elements, the best one against that dragon; it leaves that element's status."],
    "time-traveler": ["Time Sigils", "Strikes 3 scales and sets a clock sigil on each; 1.5 s later the sigil replays part of all the damage that scale took.", "Replay", "The sigil replays 50% of all damage the scale took under it, from every hero."],
    viking: ["Frost Cyclone", "A frost cyclone climbs from the wall up the field, shredding every scale it passes and growing.", "Shred", "Every tick inside the cyclone: +5% damage taken for that scale, up to +50% (3 s)."],
    alexandra: ["Chain Lightning", "Lightning leaps from her tome to a scale, then chains to the next nearest scale 6 times.", "Overcharge", "Every jump of the chain hits 10% harder than the last."],
    marpesia: ["Sky Spear", "A spear of light falls from the sky onto the densest spot and stays pinned for 2.5 s, burning every scale around it.", "Holy Pin", "A pinned scale takes +20% from every hero."],
    "loeg-yllavyre": ["Elder Flight", "An elder dragon spirit flies a figure eight over the field for 8 s, breathing seeds onto the scales below.", "Seeds", "A seed blooms 2 s later: 150% to its scale and 50% to the 2 beside it."],
    "amar-suen": ["Midas Rain", "A rain of golden touches falls on the densest part of the body; touched scales turn to gold for 2 s.", "Gilded", "A gold scale takes ×2 from every hero; when it breaks, gold shards hit the 4 scales around it for 150%."],
    dreamwalker: ["Nightmare Bloom", "Nightmares bloom inside 3 scales; tendrils lash the scales on both sides and put them to sleep.", "Sleep", "Sleeping scales take +20% from every hero; a hit wakes them after 2 s."],
    "kael-dragon": ["Dragonfall", "Calls a shower of dragonfire meteors onto the densest part of the body; each leaves a burning crater, and every hit Awes the dragon.", "Craters", "Each crater burns 1.5 s (30% a second); Awed: the dragon cannot Rage for 2 s."],
  };
  V.KIT = KIT;
  V.ATK = ATK;
  const EVO_LV = [10, 20, 30];
  for (const [id, k] of Object.entries(KIT)) {
    const h = DD.HERO[id];
    if (!h) continue;
    const old = h.cards || [], iconOf = (name, flag) => { const c = old.find((x) => x.icon && (x.name === name || (flag && x.eff && x.eff.flag === flag))); return c && c.icon; };
    const cards = k.s.map(([name, stat, r, e, l, cap, note]) => ({ key: `${id}:${name}`, type: "skill", name, stat, tiers: Object.assign({ rare: r, epic: e }, l === null ? {} : { legendary: l }),
      cap, pct: !!PCT[stat], unit: stat === "dur" ? "s" : "", lv: 1, lvL: 5, ...(note ? { note } : {}) }));
    const one = (type, tier, lv, [name, text, eff], rep, key) => { const ic = iconOf(name, eff.flag); return { key: `${id}:${key || name}`, type, tier, name, text, lv, rep: !!rep, eff, ...(ic ? { icon: ic } : {}) }; };
    cards.push(one("unique", "legendary", 5, k.u));
    cards.push(one("mythic", "mythic", 15, k.m));
    k.e.forEach(([name, tier, text, eff, rep, key], i) => cards.push(one("evo", tier, EVO_LV[i], [name, text, eff], rep, key)));
    h.cards = cards;
    const a = ATK[id];
    if (a) { h.weapon = a[0]; h.tech = a[1]; h.line = a[1]; h.role = `${a[2]}: ${a[3]}`; h.v4effect = a[2]; }
  }
  // C53's card edits and caps no longer apply: every number above is G4's
  if (DD.C53) { DD.C53.CARD_EDIT = {}; DD.C53.CAPS = {}; DD.C53.CARD_DMG = {}; }
  // attacks that are not C55 kinds any more (their old code paths stay for the game without the switch)
  const KIND = { tracker: "v4wolves", "sugarplum-faerie": "v4swarm", cassandra: "v4claw", alexandra: "v4chain", "amar-suen": "v4midas" };
  for (const [id, k] of Object.entries(KIND)) if (DD.HERO[id]) DD.HERO[id].kind = k;
  // G3 §9: the damage coefficient of each attack, set so the hero's damage per second at Lv 1 (alone, no cards, elements neutral, a thick
  // Stage 12 dragon, seconds 20–50 as the C53 tool, 6 seeds) lands on its G3 Power point within ±2 % (node tools/v4-tune-heroes.mjs, 2026-11-10)
  V.K = {"spellsword":1.1781,"ebenezer":0.333,"half-goblin":0.0977,"enchantress":0.6542,"mercenary":0.4759,"tracker":0.2477,"dwarf":0.4223,"occultist":0.4657,"leprechaun":1.3269,"knight":1.1248,"jack-frost":1.6447,"cassandra":0.0909,"sorceress":1.3016,"crusader":0.25,"tou-lak":0.9706,"alchemist":1.0713,"alexandra":0.8322,"marpesia":0.6339,"loeg-yllavyre":1.0935,"amar-suen":0.2601,"minstrel":0.3464,"scout":0.4252,"klaus":1.68,"archaeologist":0.2101,"sugarplum-faerie":0.427,"tristan":0.0841,"guild-leader":0.7842,"szopin":0.1892,"time-traveler":1.5535,"viking":0.7489,"dreamwalker":1.0887,"kael-dragon":0.7356};
  Object.assign(DD.PATTERN_K, V.K);
  // Rusk: a cyclone lives 2.2 s; one every 2.4 s made them overlap from Lv 10 (×1.3 speed) and Shred stacked, so his Power grew faster than the
  // one level curve (+21 % at Lv 10). One every 3 s keeps them apart until cards add speed.
  if (DD.HERO.viking) DD.HERO.viking.w.cd = 3;
  const AIM = { tracker: "Wolves leap", "sugarplum-faerie": "Swarm over the body", cassandra: "Claws on the densest", alexandra: "Chain lightning", "amar-suen": "Golden rain", crusader: "Pours down to the wall", occultist: "Skull ring" };
  const aim0 = DD.aimOf;
  DD.aimOf = (h) => AIM[h.id] || aim0(h);
})();

/* ================================================================ G4 in battle: the new attacks, signature effects and card effects */
(function () {
  if (!DD.V4 || !DD.v4 || !DD.Battle || !DD.ATK55) return;
  const P = DD.Battle.prototype, X = DD.ATK55, V = DD.v4;
  const TOP = 120, PI2 = Math.PI * 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const baseOf = (h) => h.def.w.dmg || (h.def.w.dps ? h.def.w.dps * 0.4 : 30);
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  const img = (p) => DD.img(p);
  const a55 = (n) => img(`2a/fx/c55_${n}.webp`);
  const sprite = (g, im, x, y, w, rot, a) => {
    if (!ready(im)) return false;
    const hh = (w * im.naturalHeight) / im.naturalWidth;
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (a !== undefined) g.globalAlpha *= a; g.drawImage(im, -w / 2, -hh / 2, w, hh); g.restore();
    return true;
  };
  const halo = (g, x, y, r, col, a) => {
    g.save(); g.globalAlpha *= a;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, PI2); g.fill(); g.restore();
  };
  const progress = (b, e) => e.s / (b.pathOf(e).len || 1);
  const toughest = (vis, n) => vis.filter((e) => !e.dead).sort((a, c) => c.hp - a.hp).slice(0, n);
  const push = (b, o) => { b.c43.obj.push(o); return o; };
  const slow = (b, f, t) => { const cur = b.slowT > 0 ? b.slowF : 1; b.slowF = Math.min(cur, f); b.slowT = Math.max(b.slowT, t); };
  const sureHit = (b, h, e, base, quiet) => { const l = h.luckyT; h.luckyT = b.time + 1; b.hit(h, e, base, quiet); h.luckyT = l; };
  const fall = (b, h, name, x, y, size, dur) => b.c43.fly.push({ h, img: `2a/fx/evo_${name}.webp`, x0: x, y0: TOP - 140, x1: x, y1: y, t: 0, dur: dur || 0.45, size: size || 120 });
  const inTri = (p, a, b, c) => {
    const s = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };

  /* ---------------------------------------------------------------- G4 §5: full-screen effects rise from the wall or fall from the top (no left-right crossing) */
  P.flyby = function (h, name, low) {
    const x = this.W / 2 + (this.rnd() - 0.5) * this.W * 0.3, src = `2a/fx/evo_${name || "light"}.webp`;
    if (low) this.c43.fly.push({ h, img: src, x0: x, y0: TOP - 140, x1: x, y1: (this.formY || this.H * 0.8) - 140, t: 0, dur: 0.5, size: 170 });
    else this.c43.fly.push({ h, img: src, x0: x, y0: (this.wallY || this.H * 0.8) + 40, x1: x, y1: TOP - 140, t: 0, dur: 0.9, size: 170 });
  };

  /* ---------------------------------------------------------------- Ebenezer: Compound Interest, Golden Torrent, Taxman */
  X.debt.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, n = (w.count || 1) + st.count, comp = this.has(h, "compound");
    const seals = this.c43.obj.filter((x) => x.a55 === "debt" && x.h === h && !x.e.dead), sealOf = (e) => seals.find((x) => x.e === e);
    const ok = vis.filter((e) => !e.dead && (comp || !sealOf(e))), body = ok.filter((e) => e.type === "body");
    const list = (body.length ? body : ok).sort((a, b) => progress(this, b) - progress(this, a)).slice(0, n);
    if (!list.length) return false;
    const mult = 1 + 0.25 * (st.dur || 0);
    const stamp = (e) => { const s = sealOf(e); if (s) { if (comp && !s.doubled) { s.mult *= 2; s.doubled = true; } return; } seals.push(push(this, { a55: "debt", h, e, t: 0, delay: w.delay || 2, mult })); };
    for (const e of list) { stamp(e); if (this.has(h, "torrent")) for (const nb of this.neighbours(e)) stamp(nb); }
    return true;
  };
  X.debt.step = function (o, dt) {
    const h = o.h, e = o.e;
    if (e.dead) return false;
    if ((o.t += dt) < o.delay) return true;
    let m = o.mult * (1 + (2 * Math.max(0, e.hp)) / e.max);
    if (this.has(h, "taxman4") && (h.cnt.tax = (h.cnt.tax || 0) + 1) % 10 === 0) m *= 5;
    const p = this.pos(e);
    this.hit(h, e, baseOf(h) * m);
    if (h.st.size > 0) for (const n of this.neighbours(e)) this.hit(h, n, baseOf(h) * m * Math.min(1.5, h.st.size), true);
    this.fxImg("dd/fx_hit_flash.webp", p.x, p.y, 90, 0.3, { grow: 0.6 });
    this.burst(p.x, p.y, "#ffd84a", 10);
    return false;
  };

  /* ---------------------------------------------------------------- Velis: Twin Hearts, Heart Splash, True Love */
  X.bubbles.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, n = (w.count || 3) + (st.bounce || 0), m = this.muzzle(h);
    for (const side of this.has(h, "twinWave") ? [-1, 1] : [0]) {
      const cx = Math.max(40, Math.min(this.W - 40, m.x + side * 70));
      for (let i = 0; i < n; i++) {
        const x0 = Math.max(20, Math.min(this.W - 20, cx + (i - (n - 1) / 2) * 26));
        push(this, { a55: "bubbles", h, x0, x: x0, y: m.y - 10 - i * 8, t: 0, ph: this.rnd() * 6, vy: 120 + this.rnd() * 40, pops: (w.multi || 2) + (st.multi || 0), r: 13, v4: true });
      }
    }
    return true;
  };
  const bub0 = X.bubbles.step;
  X.bubbles.step = function (o, dt, vis) {
    if (!o.v4) return bub0.call(this, o, dt, vis);
    const h = o.h, T = this.time;
    o.t += dt; o.y -= o.vy * dt; o.x = o.x0 + Math.sin(o.t * 3 + o.ph) * 32;
    if (o.y < TOP - 30) return false;
    for (const e of vis) {
      if (e.dead || dist(this.pos(e), o) > e.r + o.r) continue;
      for (let k = 0; k < o.pops && !e.dead; k++) this.hit(h, e, baseOf(h), k > 0);
      this.wall = Math.min(this.wallMax, this.wall + this.wallMax * (this.has(h, "trueLove") ? 0.006 : 0.003)); // Mend
      if (this.has(h, "splash4")) for (const nb of this.neighbours(e)) { nb.st = "wet"; nb.stT = T + DD.STATUS.water.t; }
      this.fx.push({ x: o.x, y: o.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#ff9fd0", ring: 26 });
      return false;
    }
    return true;
  };

  /* ---------------------------------------------------------------- Garran: Armour Breaker on the locked tail scale */
  const ls0 = X.longshot.step;
  X.longshot.step = function (o, dt, vis) {
    if (!o.fired && o.t + dt >= o.aimT && this.has(o.h, "armourTail") && o.e && !o.e.dead) { o.e.crack = DD.STATUS.physical.max; o.e.crackT = this.time + DD.STATUS.physical.t; }
    return ls0.call(this, o, dt, vis);
  };

  /* ---------------------------------------------------------------- Fen: Spirit Wolf (Pack, Pack Hunt, Alpha) */
  X.v4wolves = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, n = 1 + (st.count || 0), m = this.muzzle(h);
      for (let k = 0; k < n; k++) push(this, { a55: "v4wolf", h, x: m.x + (k - (n - 1) / 2) * 20, y: m.y - 20, life: (w.life || 12) + (st.dur || 0), to: null, u: 1, jt: 0.5, alpha: k === 0 && this.has(h, "alpha4"), hunt: 3, face: 1 });
      h.cd = (w.cd || 10) * this.rateOf(h); // a new pack every 10 s whatever the speed: Speed (level, Leap Speed) makes the wolves leap faster, not come more often
      return true;
    },
  };
  X.v4wolf = {
    step(o, dt, vis) {
      const h = o.h, w = h.def.w, T = this.time;
      if ((o.life -= dt) <= 0) return false;
      const bite = (e, mult) => {
        if (e.dead) return;
        const m = e.wolfT > T - 1 && e.wolfBy !== o ? 2 : 1; // Pack: the second wolf on a scale within 1 s mauls ×2
        e.wolfT = T; e.wolfBy = o;
        this.hit(h, e, w.dmg * mult * m);
      };
      if (this.has(h, "packHunt4") && (o.hunt -= dt) <= 0) {
        o.hunt = 3;
        const t = toughest(vis.filter((e) => dist(this.pos(e), o) < 220), 1)[0];
        if (t) { const q = this.pos(t); o.x = q.x; o.y = q.y; bite(t, 2); this.fxImg("dd/fx_hit_nature_l.webp", q.x, q.y, 70, 0.3, { grow: 0.4 }); o.to = null; o.u = 1; }
      }
      if (!o.to || o.u >= 1) {
        if (o.to && !o.to.dead) {
          const p = this.pos(o.to);
          for (const e of vis) if (!e.dead && dist(this.pos(e), p) < (o.alpha ? 52 : 40) + e.r * 0.5) { bite(e, 1); if (o.alpha) bite(e, 1); }
          this.fxImg("dd/fx_hit_nature_l.webp", p.x, p.y, o.alpha ? 90 : 70, 0.3, { grow: 0.3 });
        }
        const near = vis.filter((e) => !e.dead && dist(this.pos(e), o) < 200), up = this.upperVis(), bodyOf = (l) => l.filter((e) => e.type === "body");
        const pool = bodyOf(near).length ? bodyOf(near) : bodyOf(up).length ? bodyOf(up) : near.length ? near : up;
        o.to = this.pickFront(pool);
        o.from = { x: o.x, y: o.y }; o.u = 0; o.jt = ((w.fire || 0.4) * 1.25) / this.rateOf(h);
        if (!o.to) return true;
      }
      if (o.to.dead) { o.u = 1; return true; }
      const p = this.pos(o.to);
      o.u = Math.min(1, o.u + dt / o.jt);
      o.face = p.x >= o.from.x ? 1 : -1;
      o.x = o.from.x + (p.x - o.from.x) * o.u;
      o.y = o.from.y + (p.y - o.from.y) * o.u - Math.sin(o.u * Math.PI) * 70;
      return true;
    },
    draw(g, o) {
      const im = img("dd/fx_unit_wolf.webp"), s = o.alpha ? 1.35 : 1, a = Math.min(1, o.life * 2);
      if (ready(im)) { g.save(); g.globalAlpha *= a; g.translate(o.x, o.y); g.scale((o.face || 1) * s, s); g.drawImage(im, -44, -30, 88, 60); g.restore(); }
      else halo(g, o.x, o.y, 22 * s, "rgba(120,230,140,0.8)", a);
    },
  };

  /* ---------------------------------------------------------------- Klaus: Gifts without coins (×2, 3 Chilled, or 3 small bursts) */
  X.fireworks.burst = function (h, x, y, mult, rad) {
    const w = h.def.w, R = rad || (w.radius || 40) * (1 + (h.st.size || 0)), r = this.rnd();
    const kind = r < 1 / 3 ? "x2" : r < 2 / 3 ? "chill" : "split", m = kind === "x2" ? mult * 2 : mult;
    const at = (cx, cy, RR, mm) => {
      for (const e of this.visible()) if (!e.dead && dist(this.pos(e), { x: cx, y: cy }) < RR + e.r * 0.5) {
        this.hit(h, e, baseOf(h) * mm, true);
        if (kind === "chill" && !e.dead) { this.mark(h, e, 0); this.mark(h, e, 0); } // with the hit's own mark: 3 Chilled stacks
        if ((h.st.dur || 0) > 0 && !e.dead) this.addDot(h, e, baseOf(h) * 0.2, h.st.dur);
      }
      const cols = ["#ff5a5a", "#ffd84a", "#7fd45a", "#5ab4ff", "#ffffff"];
      for (let k = 0; k < 10; k++) { const a = (k * PI2) / 10; this.fx.push({ x: cx, y: cy, vx: Math.cos(a) * RR * 3, vy: Math.sin(a) * RR * 3, t: 0.4, max: 0.4, col: kind === "chill" ? "#bfefff" : cols[k % cols.length], size: 3.5 }); }
      this.fx.push({ x: cx, y: cy, vx: 0, vy: 0, t: 0.3, max: 0.3, col: kind === "chill" ? "#bfefff" : "#fff3c8", ring: RR });
    };
    if (kind === "split") for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k * PI2) / 3; at(x + Math.cos(a) * R * 0.9, y + Math.sin(a) * R * 0.9, R * 0.6, m * 0.5); }
    else at(x, y, R, m);
  };

  /* ---------------------------------------------------------------- Borrik: Quake Return (every 4th), Mountain Stand (pillars) */
  const tun0 = X.tunnel.step;
  X.tunnel.step = function (o, dt, vis) {
    const was = o.done, r = tun0.call(this, o, dt, vis), h = o.h;
    if (!was && o.done && o.p) {
      const p = o.p;
      if (this.has(h, "quake4") && (h.cnt.quake = (h.cnt.quake || 0) + 1) % 4 === 0) {
        const el = h._el; h._el = "rock";
        for (const e of this.visible()) if (!e.dead && dist(this.pos(e), p) < 120 + e.r * 0.5) this.mark(h, e, 0);
        h._el = el;
        this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.4, max: 0.4, col: "#c49a62", ring: 120 });
        this.shake = Math.max(this.shake, 6);
      }
      if (this.has(h, "pillar")) push(this, { a55: "v4pillar", h, x: p.x, y: p.y, life: 3, hits: new Set() });
    }
    return r;
  };
  X.v4pillar = {
    step(o, dt, vis) {
      for (const e of vis) if (!e.dead && !o.hits.has(e) && dist(this.pos(e), o) < 22 + e.r * 0.6) { o.hits.add(e); this.hit(o.h, e, baseOf(o.h) * 0.5, true); }
      return (o.life -= dt) > 0;
    },
    draw(g, o) {
      const a = Math.min(1, o.life * 2);
      if (sprite(g, img("2a/fx/atk_pillar.webp"), o.x, o.y - 20, 44, 0, a)) return;
      g.save(); g.globalAlpha *= a; g.fillStyle = "#8a6a44"; g.strokeStyle = "#3b2a18"; g.lineWidth = 2; g.fillRect(o.x - 10, o.y - 44, 20, 44); g.strokeRect(o.x - 10, o.y - 44, 20, 44); g.restore();
    },
  };
  X.v4rollTail = {
    step(o, dt) {
      if (!o.list) { const d = (this.body[0] || {}).d || 0; o.list = this.body.filter((e) => (e.d || 0) === d); o.k = o.list.length - 1; o.acc = 0; }
      o.acc += dt * 18;
      while (o.acc >= 1 && o.k >= 0) {
        o.acc--;
        const e = o.list[o.k--];
        if (!e || e.dead || e.s <= this.enterOf(e)) continue;
        const q = this.pos(e); o.x = q.x; o.y = q.y;
        this.hit(o.h, e, baseOf(o.h) * o.mult, true);
      }
      return o.k >= 0;
    },
    draw(g, o) {
      if (o.x === undefined) return;
      if (sprite(g, a55("rock_shard"), o.x, o.y, 54, this.time * 8)) return;
      g.save(); g.fillStyle = "#8a6a44"; g.strokeStyle = "#3b2a18"; g.lineWidth = 2; g.beginPath(); g.arc(o.x, o.y, 20, 0, PI2); g.fill(); g.stroke(); g.restore();
    },
  };

  /* ---------------------------------------------------------------- Morrow: Lich (the ring keeps its scale) */
  const orbit0 = P.orbit;
  P.orbit = function (h, dt) {
    if (this.has(h, "lich") && h.oE && !h.oE.dead) h.oT = Math.max(h.oT || 0, 0.5);
    return orbit0.call(this, h, dt);
  };

  /* ---------------------------------------------------------------- Finnick: Clovers (more per planting), Lucky Charm, Jackpot. A clover lives 10 s; the old limit of
     6 on the path took the oldest away (the ones about to be crossed), so speed never helped: now 24 at most, only to keep the screen readable */
  X.clover.fire = function (h, o, vis) {
    const st = h.st, n = 1 + (st.count || 0), max = 24;
    const heads = [];
    this.body.forEach((e, i) => { if (!e.dead && (i === 0 || (this.body[i - 1].d || 0) !== (e.d || 0)) && e.s > this.enterOf(e)) heads.push(e); });
    const hd = heads.sort((a, b) => progress(this, b) - progress(this, a))[0];
    if (!hd) return false;
    const len = this.pathOf(hd).len, fronts = this.body.filter((e) => !e.dead && (e.d || 0) === (hd.d || 0) && e.s > this.enterOf(e)).slice(0, 10);
    const plant = (s) => {
      // at the wall there is no road left ahead of the head: the clover grows under one of its front scales instead (it used to plant nothing)
      const q = s < len - 12 ? this.at(s, hd.d) : fronts.length ? this.pos(fronts[Math.floor(this.rnd() * fronts.length)]) : null;
      if (q) push(this, { a55: "clover", h, d: hd.d || 0, x: q.x, y: q.y, life: 10, t: 0 });
    };
    let room = max - this.c43.obj.filter((x) => x.a55 === "clover" && x.h === h && x.life > 0).length; // full: no new clover (the old ones are the next to be crossed)
    for (let k = 0; k < n && room > 0; k++) { const s = hd.s + 60 + this.rnd() * 120 + k * 45; plant(s); room--; if (this.has(h, "twin") && room > 0) { plant(s + 60); room--; } }
    return true;
  };
  X.clover.step = function (o, dt, vis) {
    o.t += dt;
    if ((o.life -= dt) <= 0) return false;
    if (o.t < 0.25) return true;
    const h = o.h;
    for (const e of vis) {
      if (e.dead || (e.d || 0) !== o.d || dist(this.pos(e), o) > e.r + 10) continue;
      const jack = this.rnd() < (this.has(h, "lucky3") ? 1 / 3 : 1 / 5), m = jack ? 5 : 1, p = this.pos(e);
      this.beams.push({ x1: p.x + 20, y1: TOP - 60, x2: p.x, y2: p.y, w: 3.5, t: 0.3, max: 0.3, col: jack ? "#ffd84a" : "#bfe8ff", zig: true });
      const nb = jack && this.has(h, "jackpot3") ? this.neighbours(e) : [];
      this.hit(h, e, baseOf(h) * m);
      for (const x of nb) { const q = this.pos(x); this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2.5, t: 0.22, max: 0.22, col: "#ffd84a", zig: true }); this.hit(h, x, baseOf(h) * m, true); }
      if (jack && this.texts.length < 48) this.texts.push({ x: p.x, y: p.y - 30, txt: "JACKPOT", t: 0.9, max: 0.9, crit: true });
      this.fxImg("dd/fx_hit_flash.webp", p.x, p.y, 80, 0.25, { grow: 0.5 });
      return false;
    }
    return true;
  };
  X.v4rainbow = {
    step(o, dt, vis) {
      if ((o.tick -= dt) <= 0) { o.tick = 0.25; for (const e of vis) if (!e.dead && (e.d || 0) === o.d && e.s >= o.s0 && e.s <= o.s1) this.hit(o.h, e, baseOf(o.h) * 0.3 * 0.25, true); }
      return (o.life -= dt) > 0;
    },
    draw(g, o) {
      const cols = ["#ff5a5a", "#ffb03a", "#ffe24a", "#7fd45a", "#5ab4ff", "#b07aff"], a = Math.min(1, o.life * 2, (4 - o.life) * 4);
      g.save(); g.globalAlpha *= 0.55 * a; g.lineCap = "round";
      cols.forEach((c, i) => {
        g.strokeStyle = c; g.lineWidth = 4; g.beginPath();
        for (let s = o.s0, f = true; s <= o.s1; s += 12) { const q = this.at(s, o.d); const y = q.y + (i - 2.5) * 4; if (f) { g.moveTo(q.x, y); f = false; } else g.lineTo(q.x, y); }
        g.stroke();
      });
      g.restore();
    },
  };

  /* ---------------------------------------------------------------- Cassandra: Claw Lash (Claw Size, Thorns near the wall, Hook and Drag) */
  X.v4claw = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, R = 70 * (1 + (st.size || 0)), t = this.densest(R);
      if (!t) return false;
      const p = this.pos(t), rot = this.rnd() * Math.PI, times = this.has(h, "double") ? 2 : 1;
      for (let i = 0; i < times; i++) this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.45, max: 0.45, col: h.def.col, claw: 60 * (1 + (st.size || 0)), ang: rot + i * 1.5 });
      let any = false;
      for (const e of vis) if (!e.dead && dist(this.pos(e), p) < R + e.r * 0.5) { any = true; for (let i = 0; i < times; i++) this.hit(h, e, w.dmg); }
      if (any && this.danger()) this.frozen = Math.max(this.frozen, w.stun || 0.15); // Thorns: held 0.15 s, only near the wall
      if (any && this.has(h, "hook3") && (h.cnt.hookT || 0) <= this.time) { h.cnt.hookT = this.time + 3; this.knock(10); }
      return true;
    },
  };

  /* ---------------------------------------------------------------- Lark: Echo (signature), Resonance; Plum's sweets with Sugar Rush */
  const so0 = P.stepObj;
  P.stepObj = function (o, dt, vis) {
    if (o.type === "pulse" && o.h && o.h.def.id === "minstrel") {
      const h = o.h, T = this.time;
      if (o.e.dead) { const t = this.near(o.e, 1, 120)[0]; if (!t) return false; o.e = t; }
      if ((o.next -= dt) > 0) return true;
      if (o.k >= o.n) return false;
      o.next = o.gap;
      const p = this.pos(o.e), mult = this.has(h, "crescendo") ? Math.min(2, Math.pow(1.25, o.k)) : 1, reso = this.has(h, "resonance");
      for (const e of vis) if (!e.dead && dist(this.pos(e), p) < o.r + e.r * 0.5) {
        const m = reso && e.resoT < T && T - e.resoT <= 0.5 ? 2 : 1;
        e.resoT = T;
        this.hit(h, e, h.def.w.dmg * mult * m);
      }
      if (ready(img("2a/fx/atk_pulse.webp"))) this.fxImg("2a/fx/atk_pulse.webp", p.x, p.y, o.r * 2.3, 0.34, { grow: 0.35 });
      else this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.32, max: 0.32, col: h.def.col, ring: o.r });
      o.k++;
      if (o.k === 3 && !o.echoed && !o.isEcho) { // Echo: the 3rd pulse rings again on the nearest other scale
        o.echoed = true;
        const t2 = this.near(o.e, 1, 220)[0];
        if (t2) this.c43.obj.push({ type: "pulse", h, e: t2, n: 1, gap: o.gap, r: o.r, next: 0.1, k: 0, echo: 0, img: o.img, isEcho: true });
      }
      return true;
    }
    if (o.type === "stick" && o.v4) {
      const h = o.h;
      o.t += dt;
      if (o.e.dead) { const t = this.near(o.e, 1, 90)[0]; if (!t) return false; o.e = t; }
      if (o.t < o.fall) return true;
      if ((o.tick -= dt) <= 0) { o.tick = h.def.w.tick || 0.35; this.hit(h, o.e, h.def.w.dmg * o.v4, true); }
      return o.t < o.fall + o.life;
    }
    return so0.call(this, o, dt, vis);
  };

  /* ---------------------------------------------------------------- Dace: Talon Reach, Volley, Feathers (signature) */
  X.dive.step = function (o, dt, vis) {
    const h = o.h, w = h.def.w;
    if ((o.t += dt) < 0) return true;
    if (o.e.dead && !o.hit) { const n = toughest(vis, 1)[0]; if (!n) return false; o.e = n; }
    const u = Math.min(1, o.t / o.dur);
    if (!o.hit) o.p = this.pos(o.e);
    const ex = o.sx + (o.sx < this.W / 2 ? 150 : -150), x = (1 - u) * (1 - u) * o.sx + 2 * u * (1 - u) * o.p.x + u * u * ex;
    const y = (1 - u) * (1 - u) * o.sy + 2 * u * (1 - u) * (o.p.y * 2 - o.sy) * 0.5 + u * u * o.sy;
    o.ang = Math.atan2(y - (o.y || y), x - (o.x || x)); o.x = x; o.y = y;
    if (u >= 0.5 && !o.hit) {
      o.hit = true;
      const reach = (w.pierce || 0) + (h.st.pierce || 0) + (this.has(h, "split") ? 2 : 0), i = this.body.indexOf(o.e), d = o.e.d || 0;
      this.hit(h, o.e, baseOf(h));
      let last = i;
      for (let k = 1; k <= reach; k++) { const x2 = this.body[i + k]; if (x2 && !x2.dead && (x2.d || 0) === d) { this.hit(h, x2, baseOf(h), true); last = i + k; } }
      if (this.has(h, "volley4")) for (let k = 1; k <= 3; k++) { const x3 = this.body[last + k]; if (x3 && !x3.dead && (x3.d || 0) === d) this.c43.obj.push({ type: "drop", h, e: x3, t: 0, fall: 0.2 + 0.06 * k, mult: 0.5, img: img("dd/fx_proj_tracer.webp"), size: 40 }); }
      if (!o.free) { // Feathers: at 3 the hawk comes back once for a free dive on each feathered scale
        const fs = h.feathers || (h.feathers = []);
        fs.push(o.e);
        if (fs.length >= 3) fs.splice(0).filter((e) => !e.dead).forEach((e, k) => { const a = this.time * 1.7 + k; push(this, { a55: "dive", h, e, t: -0.25 - k * 0.12, dur: 0.6, sx: this.W / 2 + Math.cos(a) * 130, sy: TOP - 20, free: true }); });
      }
      this.fxImg("dd/fx_hit_flash.webp", o.p.x, o.p.y, 70, 0.22, { grow: 0.5 });
    }
    return u < 1;
  };

  /* ---------------------------------------------------------------- Plum: Sugar Swarm (hovers over the densest part; Sugar Rush; Sugar Storm) */
  X.v4swarm = {
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, want = this.has(h, "swarm2") ? 2 : 1, m = this.muzzle(h);
      const sw = this.c43.obj.filter((x) => x.a55 === "v4cloud" && x.h === h);
      while (sw.length < want) sw.push(push(this, { a55: "v4cloud", h, k: sw.length, x: m.x, y: m.y - 80, life: 3, t: 0 }));
      const n = (w.n || 3) + (st.count || 0);
      let any = false;
      for (const s of sw) {
        s.life = Math.max(s.life, 3);
        const L = vis.filter((e) => !e.dead && dist(this.pos(e), s) < 95);
        if (!L.length) continue;
        const dbl = h.cnt.rush ? 2 : 1; // Sugar Rush: the drop after 10 sweets is doubled
        h.cnt.rush = false;
        for (let i = 0; i < n; i++) {
          const t = this.randomOf(L);
          if (!t) break;
          any = true;
          this.c43.obj.push({ type: "stick", h, e: t, fall: 0.3 + i * 0.05, t: 0, life: (w.dur || 2) + (st.dur || 0), tick: 0, img: img("dd/fx_proj_sweet.webp"), rot: this.rnd() * 6, v4: dbl });
          if ((h.cnt.sweets = (h.cnt.sweets || 0) + 1) % 10 === 0) h.cnt.rush = true;
        }
      }
      return any;
    },
  };
  X.v4cloud = {
    step(o, dt, vis) {
      o.t += dt;
      let t = this.densest(70);
      if (o.k && t) { const a = this.pos(t); t = this.densest(70, vis.filter((e) => dist(this.pos(e), a) > 140)) || t; }
      if (t) { const q = this.pos(t); o.x += (q.x - o.x) * Math.min(1, dt * 2.2); o.y += (q.y - 30 - o.y) * Math.min(1, dt * 2.2); }
      return (o.life -= dt) > 0;
    },
    draw(g, o) {
      const a = Math.min(1, o.life * 2, o.t * 3), cols = ["#ff8fc8", "#ffd84a", "#9fe8ff", "#c9a0ff", "#ff8fc8", "#a8f0a0"];
      halo(g, o.x, o.y, 54, "rgba(255,170,215,0.45)", a);
      for (let k = 0; k < 6; k++) {
        const an = this.time * 2.4 + (k * PI2) / 6, x = o.x + Math.cos(an) * 30, y = o.y + Math.sin(an) * 14 + Math.sin(this.time * 9 + k) * 3;
        g.save(); g.globalAlpha *= a;
        g.fillStyle = "rgba(255,255,255,0.75)"; g.beginPath(); g.ellipse(x - 4, y - 3, 4, 2.5, -0.5, 0, PI2); g.ellipse(x + 4, y - 3, 4, 2.5, 0.5, 0, PI2); g.fill();
        g.fillStyle = cols[k]; g.strokeStyle = "#7a2a52"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 4.5, 0, PI2); g.fill(); g.stroke(); g.restore();
      }
    },
  };

  /* ---------------------------------------------------------------- Kael: Twin Shot (a twin beside every bolt), Split Bolt (3 small bolts); Jack: Snowman */
  const fire0 = P.fire;
  P.fire = function (h, o, vis) {
    const id = h.def.id;
    if (id === "spellsword") {
      h.countMul = 1 + this.stacks(h, "twinBolt");
      const n0 = this.shots.length;
      fire0.call(this, h, o, vis);
      if (this.has(h, "split3")) for (let i = n0; i < this.shots.length; i++) { const b = this.shots[i]; if (b.hero === h && !b.sub) b.split = true; }
      return;
    }
    if (id === "jack-frost" && this.has(h, "snowman4") && !this.c43.obj.some((x) => x.a55 === "v4snowman" && x.h === h)) {
      const m = this.muzzle(h);
      push(this, { a55: "v4snowman", h, x: Math.max(30, Math.min(this.W - 30, m.x + 46)), y: (this.wallY || this.H * 0.8) - 34, life: 6, bt: 0.3 });
    }
    return fire0.call(this, h, o, vis);
  };
  const ms0 = P.moveShots;
  P.moveShots = function (dt) {
    const r = ms0.call(this, dt);
    // Split Bolt: the split makes 2 side pieces; they stop at their first scale and a third flies straight on between them
    const fresh = this.shots.filter((b) => b.sub && !b.v4 && b.hero && b.hero.def.id === "spellsword" && this.has(b.hero, "split3"));
    for (let i = 0; i < fresh.length; i++) {
      const b = fresh[i];
      b.v4 = true; b.pierce = 0;
      if (i % 2 === 1) { const a = (fresh[i - 1].ang + b.ang) / 2; this.shots.push({ ...b, ang: a, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, x: (b.x + fresh[i - 1].x) / 2, y: (b.y + fresh[i - 1].y) / 2, hits: new Set(b.hits), v4: true, pierce: 0 }); }
    }
    return r;
  };
  X.v4snowman = {
    step(o, dt, vis) {
      if ((o.life -= dt) <= 0) return false;
      if ((o.bt -= dt) <= 0) {
        o.bt = 0.5;
        const t = this.nearest(o, vis.filter((e) => !e.dead));
        if (t) { const q = this.pos(t); this.beams.push({ x1: o.x, y1: o.y - 22, x2: q.x, y2: q.y, w: 5, t: 0.2, max: 0.2, col: "#bfefff" }); this.hit(o.h, t, baseOf(o.h) * 0.5, true); }
      }
      return true;
    },
    draw(g, o) {
      const a = Math.min(1, o.life * 2);
      g.save(); g.globalAlpha *= a; g.fillStyle = "#f4fbff"; g.strokeStyle = "#5a8fb0"; g.lineWidth = 2;
      g.beginPath(); g.arc(o.x, o.y, 14, 0, PI2); g.fill(); g.stroke();
      g.beginPath(); g.arc(o.x, o.y - 20, 10, 0, PI2); g.fill(); g.stroke();
      g.fillStyle = "#ff8a3a"; g.beginPath(); g.moveTo(o.x, o.y - 21); g.lineTo(o.x + 9, o.y - 19); g.lineTo(o.x, o.y - 17); g.fill();
      g.fillStyle = "#1e2a36"; g.beginPath(); g.arc(o.x - 3, o.y - 23, 1.6, 0, PI2); g.arc(o.x + 3, o.y - 23, 1.6, 0, PI2); g.fill(); g.restore();
    },
  };

  /* ---------------------------------------------------------------- Bertrand: Binds, Brand, Murder of Crows */
  X.chains.fire = function (h, o, vis) {
    const w = h.def.w, n = (w.binds || 3) + (h.st.count || 0), list = toughest(vis, n);
    if (!list.length) return false;
    const gid = (this.linkG = (this.linkG || 0) + 1), T = this.time, t = w.t || 3;
    for (const e of list) { e.linkT = T + t; e.linkG = gid; e.linkH = h; if (this.has(h, "brand4")) e.brandT = T + t + 3; this.hit(h, e, baseOf(h)); }
    push(this, { a55: "chains", h, es: list, t: 0, life: t, gid });
    if (this.has(h, "crows3")) for (let k = 1; k <= 3; k++) this.later(0.3 * k, () => {
      for (const e of list) if (!e.dead && e.linkG === gid) { const q = this.pos(e); this.hit(h, e, baseOf(h) * 0.4, true); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y - 10, 34, 0.18, { grow: 0.4 }); }
    });
    return true;
  };

  /* ---------------------------------------------------------------- Tristan: Burning Trail at 30 % a second */
  const rose0 = X.rose.step;
  X.rose.step = function (o, dt, vis) {
    const z0 = this.c43.zones.length, r = rose0.call(this, o, dt, vis), b = baseOf(o.h);
    for (let i = z0; i < this.c43.zones.length; i++) { const z = this.c43.zones[i]; if (z.hero === o.h && Math.abs(z.dps - b * 0.4) < 1e-9) z.dps = b * 0.3; }
    return r;
  };
  X.v4tornado = {
    step(o, dt, vis) {
      if (!o.list) { const t = toughest(vis, 1)[0]; if (!t) return false; const d = t.d || 0; o.list = this.body.filter((e) => (e.d || 0) === d); o.k = Math.max(0, o.list.indexOf(t)); }
      o.acc = (o.acc || 0) + dt * 5;
      while (o.acc >= 1) { o.acc--; o.k = Math.min(o.list.length - 1, o.k + 1); }
      const e = o.list[o.k];
      if (e && !e.dead) { const q = this.pos(e); o.x = q.x; o.y = q.y; }
      if ((o.tick -= dt) <= 0 && o.x !== undefined) { o.tick = 0.25; for (const x of vis) if (!x.dead && dist(this.pos(x), o) < 40 + x.r * 0.5) this.hit(o.h, x, baseOf(o.h) * 0.8 * 0.25, true); }
      return (o.life -= dt) > 0;
    },
    draw(g, o) {
      if (o.x === undefined) return;
      if (!sprite(g, img("2a/fx/atk_tornado.webp"), o.x, o.y - 30, 70, 0, Math.min(1, o.life * 2))) halo(g, o.x, o.y - 20, 40, "rgba(255,120,40,0.8)", 0.8);
    },
  };

  /* ---------------------------------------------------------------- Aldous: Holy Tide pours down from the top to the wall; Execute 15 % (Templar 20 %), Holy Harvest */
  X.tide.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, band = (w.band || 26) * (1 + (st.size || 0));
    push(this, { a55: "tide", h, y: TOP - 30, band, hits: new Set(), last: [], delay: 0, down: true });
    if (this.has(h, "splitsaw")) push(this, { a55: "tide", h, y: TOP - 30, band, hits: new Set(), last: [], delay: 0.5, down: true });
    return true;
  };
  const tide0 = X.tide.step;
  X.tide.step = function (o, dt, vis) {
    if (!o.down) return tide0.call(this, o, dt, vis);
    if (o.delay > 0) { o.delay -= dt; return true; }
    const h = o.h, w = h.def.w, ex = this.has(h, "exec20") ? 0.2 : 0.15;
    o.y += (w.speed || 420) * dt;
    for (const e of vis) {
      if (e.dead || o.hits.has(e)) continue;
      const q = this.pos(e);
      if (Math.abs(q.y - o.y) > o.band + e.r * 0.5) continue;
      o.hits.add(e);
      this.hit(h, e, baseOf(h) * (1 + (h.st.size || 0)), o.hits.size > 1);
      if (h.st.dur > 0 && !e.dead) this.addDot(h, e, baseOf(h) * 0.3, h.st.dur);
      if (!e.dead && e.type === "body" && e.hp < e.max * ex) { // Execute (not a head)
        this.deal(h, e, e.hp + 1);
        this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 70, 0.25, { grow: 0.6 });
        if (this.has(h, "harvest1")) this.wall = Math.min(this.wallMax, this.wall + this.wallMax * 0.01);
      }
      o.last.push(q); if (o.last.length > 3) o.last.shift();
    }
    if (o.y > (this.wallY || this.H * 0.8)) {
      if (this.has(h, "consecrate")) for (const q of o.last) this.c43.zones.push({ x: q.x, y: q.y, r: 40, dps: baseOf(h) * 0.6, t: 3, tick: 0, hero: h, col: "#fff0b8", judge: true });
      return false;
    }
    return true;
  };

  /* ---------------------------------------------------------------- Tou'lak: Zap Targets (Totem Reach is reach only), Thunder Roar 8 px, Intimidate (Shaken) */
  X.totem.step = function (o, dt, vis) {
    const h = o.h, w = h.def.w, T = this.time;
    o.t += dt;
    if ((o.zt -= dt) <= 0) {
      o.zt = w.zap || 0.5;
      const reach = (w.reach || 170) * (1 + (h.st.size || 0)), top = { x: o.x, y: o.y - 34 };
      const list = vis.filter((e) => !e.dead && dist(this.pos(e), o) < reach).sort((a, b) => dist(this.pos(a), o) - dist(this.pos(b), o)).slice(0, 2 + (h.st.count || 0));
      for (const e of list) {
        const q = this.pos(e);
        this.beams.push({ x1: top.x, y1: top.y, x2: q.x, y2: q.y, w: 2.5, t: 0.18, max: 0.18, col: "#ffe24a", zig: true });
        this.hit(h, e, baseOf(h), true);
        if (this.has(h, "shaken") && !e.dead && (e.zapN = (e.zapN || 0) + 1) >= 3) { e.zapN = 0; e.shakeT = T + 3; }
      }
      if (list.length && (h.cnt.zap = (h.cnt.zap || 0) + 1) % 8 === 0) { // Static: the thunderclap
        for (const e of vis) if (!e.dead && dist(this.pos(e), o) < 110) this.hit(h, e, baseOf(h) * 1.5, true);
        this.fx.push({ x: o.x, y: o.y - 20, vx: 0, vy: 0, t: 0.35, max: 0.35, col: "#ffe24a", ring: 110 });
        this.shake = Math.max(this.shake, 3);
        if (this.has(h, "roar8") && this.danger() && (this.roarCd || 0) <= T) { this.knock(8); this.roarCd = T + 1; }
      }
    }
    return (o.life -= dt) > 0;
  };

  /* ---------------------------------------------------------------- Pell: Elixirs (her best element; Mixed Brew: best and second best), vials shatter, Philosopher's Stone */
  X.spiral.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, d0 = this.densest(80);
    if (!d0) return false;
    const c = this.pos(d0), k = this.dk(d0), imm = this.dImm[k] || [];
    const rank = h.els.filter((x) => !imm.includes(x)).map((x) => [x, DD.elBest([x], this.dEls[k], imm).m]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const els = this.has(h, "brew2") ? [rank[0], rank[1] || rank[0]] : [rank[0]];
    const n = (w.count || 6) + (st.count || 0);
    for (let j = 0; j < n; j++) push(this, { a55: "spiral", h, cx: c.x, cy: c.y, a0: (j * PI2) / n, t: 0, life: (w.life || 1.1) + 0.3 * (st.dur || 0), el: els[j % els.length] || h.hitEl, hits: new Set(), r: 12 * (1 + (st.size || 0)), x: c.x, y: c.y });
    return true;
  };
  X.spiral.step = function (o, dt, vis) {
    const h = o.h;
    o.t += dt;
    const rr = 10 + 150 * o.t, an = o.a0 + 3.2 * o.t;
    o.x = o.cx + Math.cos(an) * rr; o.y = o.cy + Math.sin(an) * rr * 0.8;
    for (const e of vis) {
      if (e.dead || dist(this.pos(e), o) > e.r + o.r) continue;
      const el0 = h._el, two = this.has(h, "stone2");
      h._el = o.el;
      if (two) this.mods.react = (this.mods.react || 0) + 1;
      this.hit(h, e, baseOf(h), true);
      if (two) this.mods.react -= 1;
      h._el = el0;
      this.fxImg(`2a/fx/c55_vial_${o.el}.webp`, o.x, o.y, 30, 0.2, { grow: 0.8 });
      return false; // a vial shatters on the first scale it meets
    }
    return o.t < o.life && o.y > TOP - 40 && o.y < this.fieldBottom + 20;
  };

  /* ---------------------------------------------------------------- Granny: Sigils card count, Paradox */
  X.sigil.fire = function (h, o, vis) {
    const w = h.def.w, n = (w.n || 3) + (h.st.count || 0), T = this.time, d = this.densest(90);
    if (!d) return false;
    const c = this.pos(d), list = vis.filter((e) => !e.dead && !(e.sigilT > T)).sort((a, b) => dist(this.pos(a), c) - dist(this.pos(b), c)).slice(0, n);
    if (!list.length) return false;
    const all = new Set(list);
    if (this.has(h, "paradox")) for (const e of list) for (const nb of this.neighbours(e)) if (!(nb.sigilT > T)) all.add(nb);
    for (const e of all) { e.sigilT = T + (w.delay || 1.5); e.sigilSum = 0; if (list.includes(e)) this.hit(h, e, baseOf(h), true); push(this, { a55: "sigil", h, e, t: 0, delay: w.delay || 1.5 }); }
    return true;
  };

  /* ---------------------------------------------------------------- Alexandra: Chain Lightning (Overcharge, Infinite Library, Chain Reaction) */
  const chainRun = function (h, from, e, jumps, i0, hit, canSplit) {
    const over = this.has(h, "over20") ? 0.2 : 0.1, T = this.time;
    for (let i = i0; i <= jumps && e; i++) {
      const p = this.pos(e);
      this.beams.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, w: 2.5, t: 0.22, max: 0.22, col: h.def.col, zig: true });
      hit.add(e);
      e.chainBy = h; e.chainT = T;
      this.hit(h, e, h.def.w.dmg * (1 + over * i));
      from = p;
      const cand = this.visible().filter((x) => !hit.has(x) && !x.dead && dist(this.pos(x), p) < 160).sort((a, b) => dist(this.pos(a), p) - dist(this.pos(b), p));
      if (canSplit && i === 3 && cand[1]) { hit.add(cand[0]); chainRun.call(this, h, p, cand[1], jumps, i + 1, hit, false); hit.delete(cand[0]); }
      e = cand[0];
    }
  };
  X.v4chain = {
    fire(h, o, vis) {
      const first = this.densest(70) || this.pickFront(vis);
      if (!first) return false;
      const m = this.muzzle(h), p = this.pos(first);
      this.fxImg("dd/fx_hit_elec_l.webp", p.x, p.y, 70, 0.3, { grow: 0.4 });
      chainRun.call(this, h, { x: m.x, y: m.y - 20 }, first, (h.def.w.bounces || 6) + (h.st.bounce || 0), 0, new Set(), this.has(h, "split3rd"));
      return true;
    },
  };

  /* ---------------------------------------------------------------- Amar-Suen: Midas Rain on the densest part (gold 2 s, Midas 4 s) */
  X.v4midas = {
    fire(h, o, vis) {
      const n = 3 + (h.st.count || 0), c0 = this.densest(70);
      if (!c0) return false;
      const c = this.pos(c0), pool = vis.filter((e) => !e.dead).sort((a, b) => dist(this.pos(a), c) - dist(this.pos(b), c)).slice(0, n * 2);
      for (let i = 0; i < n && pool.length; i++) {
        const t = pool.splice(Math.floor(this.rnd() * Math.min(pool.length, n)), 1)[0];
        this.c43.obj.push({ type: "drop", h, e: t, t: 0, fall: 0.35 + i * 0.08, mult: 1, img: img("dd/fx_proj_crowncoin.webp"), size: 60 });
      }
      if (this.rnd() < 0.35) this.fxImg("dd/fx_area_goldcloud.webp", c.x, TOP - 20, 200, 0.6, { fade: true, alpha: 0.6 });
      return true;
    },
  };

  /* ---------------------------------------------------------------- Dreamwalker: Sleep (+20 % while asleep; a hit wakes it 2 s later), Nightmare, Deep Sleep, Lucid */
  const sleep4 = function (h, e) {
    const T = this.time, t = ((h.def.w.t || 2) + (h.st.dur || 0)) * (this.has(h, "deep4") ? 2 : 1);
    e.dreamT = T + t; e.dreamH = h; e.dreamWake = 0; e.dreamDeep = this.has(h, "deep4");
    if (this.has(h, "lucid4")) { e.st = "wet"; e.stT = T + t; e.curseT = T + t; }
  };
  X.nightmare.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, n = (w.count || 3) + (st.count || 0), T = this.time;
    const up = this.upperVis(0.9).filter((e) => !e.dead), awake = up.filter((e) => !(e.dreamT > T)), list = [];
    const pool = awake.length ? awake : up; // awake scales first; when every scale sleeps the nightmares bloom in sleeping ones (it used to stop attacking)
    while (list.length < n && pool.length) list.push(pool.splice(Math.floor(this.rnd() * pool.length), 1)[0]);
    if (!list.length) return false;
    for (const e of list) { this.hit(h, e, baseOf(h)); if (!e.dead) sleep4.call(this, h, e); push(this, { a55: "nightmare", h, e, t: 0, lines: null, v4: true }); }
    return true;
  };
  const nm0 = X.nightmare.step;
  X.nightmare.step = function (o, dt, vis) {
    if (!o.v4) return nm0.call(this, o, dt, vis);
    const h = o.h;
    o.t += dt;
    if (o.t >= 1 && !o.lines) {
      o.lines = [];
      if (!o.e.dead) {
        const i = this.body.indexOf(o.e), reach = 1 + (this.has(h, "nightmare4") ? 1 : 0) + Math.round((h.st.size || 0) * 2.5), p = this.pos(o.e);
        for (let k = 1; k <= reach; k++) for (const j of [i - k, i + k]) {
          const x = this.body[j];
          if (!x || x.dead || (x.d || 0) !== (o.e.d || 0) || x.s <= this.enterOf(x)) continue;
          this.hit(h, x, baseOf(h) * 0.6, true);
          if (!x.dead) sleep4.call(this, h, x);
          o.lines.push({ a: p, b: this.pos(x) });
        }
      }
    }
    return o.t < 1.45;
  };

  /* ---------------------------------------------------------------- Dragon Kael: Crater Size, Dragonfire craters (3 s, every hit a crit) */
  X.meteor.fire = function (h, o, vis) {
    const w = h.def.w, st = h.st, n = (w.count || 3) + (st.count || 0), d = this.densest(70);
    if (!d) return false;
    const c = this.pos(d), r = (w.r || 34) * (1 + (st.size || 0));
    for (let k = 0; k < n; k++) { const an = this.rnd() * PI2, rr = k ? 20 + this.rnd() * 45 : 0; push(this, { a55: "meteor", h, tx: c.x + Math.cos(an) * rr, ty: c.y + Math.sin(an) * rr * 0.8, t: 0, fall: 0.35 + k * 0.07, r, mult: 1 }); }
    return true;
  };
  X.meteor.step = function (o, dt, vis) {
    const h = o.h;
    o.t += dt;
    if (o.t >= o.fall && !o.done) {
      o.done = true;
      for (const e of vis) if (!e.dead && dist(this.pos(e), { x: o.tx, y: o.ty }) < o.r + e.r * 0.5) this.hit(h, e, baseOf(h) * o.mult, true);
      if (o.mult >= 1) { const fire = this.has(h, "dragonfire4"); push(this, { a55: "v4crater", h, x: o.tx, y: o.ty, r: o.r * 0.8, life: fire ? 3 : 1.5, max: fire ? 3 : 1.5, tick: 0, crit: fire }); }
      this.fxImg("dd/fx_hit_shock.webp", o.tx, o.ty, o.r * 3, 0.3, { grow: 0.5 });
      this.shake = Math.max(this.shake, o.mult >= 1 ? 4 : 2);
      if (this.has(h, "split") && o.mult >= 1) for (let k = 0; k < 3; k++) { const an = (k * PI2) / 3; push(this, { a55: "meteor", h, tx: o.tx + Math.cos(an) * 40, ty: o.ty + Math.sin(an) * 32, t: 0.2, fall: 0.35, r: o.r * 0.6, mult: 0.5 }); }
    }
    return o.t < o.fall + 0.05;
  };
  X.v4crater = {
    step(o, dt, vis) {
      if ((o.tick -= dt) <= 0) {
        o.tick = 0.25;
        for (const e of vis) if (!e.dead && dist(this.pos(e), o) < o.r + e.r * 0.6) { const b = baseOf(o.h) * 0.3 * 0.25; if (o.crit) sureHit(this, o.h, e, b, true); else this.hit(o.h, e, b, true); }
      }
      return (o.life -= dt) > 0;
    },
    draw(g, o) {
      const a = Math.min(1, o.life / 0.4);
      if (!sprite(g, img("2a/fx/area_crater.webp"), o.x, o.y, o.r * 2.4, 0, 0.85 * a)) halo(g, o.x, o.y, o.r, "rgba(255,110,40,0.7)", a);
    },
  };

  /* ---------------------------------------------------------------- periodic Evo effects (G4 §5) */
  X.v4blizzard = {
    step(o, dt, vis) {
      if ((o.tick -= dt) <= 0) { o.tick = 0.25; for (const e of vis) if (!e.dead) this.hit(o.h, e, baseOf(o.h) * 0.6 * 0.25, true); }
      if (this.fx.length < 260) for (let k = 0; k < 3; k++) this.fx.push({ x: this.rnd() * this.W, y: TOP - 20, vx: -40 + this.rnd() * 30, vy: 260 + this.rnd() * 120, t: 0.9, max: 0.9, col: "#e8f8ff", size: 2.5 });
      return (o.life -= dt) > 0;
    },
  };
  X.v4strikes = { // Storm Tome, Ragnarok: hits on every scale at set moments, falling from the top
    step(o, dt, vis) {
      o.t += dt;
      while (o.at.length && o.t >= o.at[0]) {
        o.at.shift();
        for (const e of this.visible()) {
          if (e.dead) continue;
          const q = this.pos(e);
          if (o.kind === "storm") this.beams.push({ x1: q.x + (this.rnd() - 0.5) * 40, y1: Math.max(0, q.y - 260), x2: q.x, y2: q.y, w: 3, t: 0.22, max: 0.22, col: "#ffe24a", bolt: true });
          this.hit(o.h, e, baseOf(o.h) * o.mult, true);
        }
        if (o.kind === "axes") for (let k = 0; k < 6; k++) { const x = this.rnd() * this.W; fall(this, o.h, "giant", x, TOP + 80 + this.rnd() * (this.fieldBottom - TOP - 120), 50, 0.35); }
        this.shake = Math.max(this.shake, 5);
      }
      return o.at.length > 0;
    },
  };
  const rp0 = P.runPer;
  P.runPer = function (h, e) {
    const T = this.time, vis = this.visible(), b = baseOf(h);
    const front = () => vis.filter((x) => !x.dead).sort((a, c) => progress(this, c) - progress(this, a));
    switch (e.fx) {
      case "v4embrace": { // Tidal Embrace: a giant bubble rises and holds the front scales (the dragon stops; the 0.4 s rule)
        const f = front()[0];
        this.c43.fly.push({ h, img: "2a/fx/c55_heart_bubble.webp", x0: f ? this.pos(f).x : this.W / 2, y0: (this.wallY || this.H * 0.8) + 30, x1: f ? this.pos(f).x : this.W / 2, y1: f ? this.pos(f).y : TOP, t: 0, dur: 0.45, size: 150 });
        this.later(0.45, () => { this.frozen = Math.max(this.frozen, 0.4); });
        return;
      }
      case "v4howl": slow(this, 0.8, 3); this.fx.push({ x: this.W / 2, y: this.H / 2, vx: 0, vy: 0, t: 0.5, max: 0.5, col: h.def.col, ring: this.W * 0.5 }); return;
      case "v4rollTail": push(this, { a55: "v4rollTail", h, mult: e.mult || 3 }); return;
      case "v4rainbow": {
        const hd = front()[0];
        if (!hd) return;
        push(this, { a55: "v4rainbow", h, d: hd.d || 0, s0: Math.max(0, hd.s - 300), s1: hd.s + 120, life: 4, tick: 0 });
        return;
      }
      case "v4thorns": {
        const list = front(), k = Math.max(1, Math.ceil(list.length / 3));
        for (const x of list.slice(0, k)) { this.addDot(h, x, b * 0.5, 3); const q = this.pos(x); this.fxImg("dd/fx_hit_nature_s.webp", q.x, q.y, 40, 0.4, { grow: 0.3 }); }
        return;
      }
      case "v4candy": {
        for (const x of vis) if (!x.dead) {
          this.hit(h, x, b * 2.5, true);
          if (!x.dead) this.c43.obj.push({ type: "stick", h, e: x, fall: 0.2 + this.rnd() * 0.3, t: 0, life: (h.def.w.dur || 2) + (h.st.dur || 0), tick: 0, img: img("dd/fx_proj_sweet.webp"), rot: this.rnd() * 6, v4: 1 });
        }
        for (let k = 0; k < 40 && this.fx.length < 280; k++) this.fx.push({ x: this.rnd() * this.W, y: (this.wallY || this.H * 0.8) - this.rnd() * 60, vx: (this.rnd() - 0.5) * 60, vy: -260 - this.rnd() * 200, t: 1, max: 1, col: ["#ff8fc8", "#ffd84a", "#9fe8ff"][k % 3], size: 3.5 });
        this.shake = Math.max(this.shake, 5);
        return;
      }
      case "v4blizzard": push(this, { a55: "v4blizzard", h, life: 3, tick: 0 }); return;
      case "v4tornado": push(this, { a55: "v4tornado", h, life: 3, tick: 0 }); return;
      case "v4judge": {
        for (const x of vis) if (!x.dead && x.type === "body" && x.hp < x.max * 0.3) { const q = this.pos(x); this.deal(h, x, x.hp + 1); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 60, 0.3, { grow: 0.6 }); }
        fall(this, h, "lighthammer", this.W / 2, this.H * 0.45, 200, 0.4);
        this.shake = Math.max(this.shake, 8);
        return;
      }
      case "v4flasks": {
        const els = ["fire", "water", "nature", "electric", "physical"];
        for (let i = 0; i < e.n; i++) { const t = this.randomOf(vis); if (t) this.c43.obj.push({ type: "drop", h, e: t, t: 0, fall: 0.35 + i * 0.07, mult: e.mult, exp: els[Math.floor(this.rnd() * els.length)], img: img("dd/fx_proj_flask.webp") }); }
        return;
      }
      case "v4rewind": this.knock(30); this.flyby(h, "clock"); return;
      case "v4stamp": {
        const list = front().slice(0, e.n || 8), q = list[0] ? this.pos(list[0]) : { x: this.W / 2, y: this.H * 0.6 };
        fall(this, h, e.sprite || "giant", q.x, q.y, 190, 0.4);
        this.later(0.4, () => { for (const x of list) if (!x.dead) this.hit(h, x, b * (e.mult || 4)); this.shake = Math.max(this.shake, 9); });
        return;
      }
      case "v4ragnarok": push(this, { a55: "v4strikes", h, kind: "axes", t: 0, at: [0.5, 1.5], mult: 1.5 }); return;
      case "v4storm": fall(this, h, "storm", this.W / 2, TOP + 40, 220, 0.4); push(this, { a55: "v4strikes", h, kind: "storm", t: 0, at: [0.4, 0.9, 1.4, 1.9], mult: 0.8 }); return;
      case "v4spearRain": {
        toughest(vis, e.n || 8).forEach((t, i) => this.c43.obj.push({ type: "drop", h, e: t, t: 0, fall: 0.35, mult: e.mult || 2, img: img("dd/fx_proj_spear.webp"), size: 70 }));
        return;
      }
      case "v4wake": {
        for (const x of vis) if (!x.dead && x.dreamT > T) { x.dreamT = 0; x.dreamWake = 0; const q = this.pos(x); this.hit(h, x, b * 3); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 60, 0.3, { grow: 0.6 }); }
        this.flyby(h, "dream");
        return;
      }
      case "v4dragonForm": this.dragonFormT = T + (e.t || 6); this.flyby(h, "dragonform"); return;
    }
    return rp0.call(this, h, e);
  };

  /* ---------------------------------------------------------------- shared: damage taken, what a hit leaves, what a break sets off */
  const dmg0 = P.dmgOf;
  P.dmgOf = function (h, base, e) {
    const r = dmg0.call(this, h, base, e);
    if (!e) return r;
    const T = this.time, id = h.def.id;
    let k = 1;
    if (e.pinT > T) k *= e.pinK || 1.2; // Holy Pin (Marpesia's signature; Valkyrie's Mark +40 %)
    if (e.goldT > T) k *= 2; // Gilded (Amar-Suen's signature)
    if (e.dreamT > T) k *= e.dreamDeep ? 1.4 : 1.2; // Sleep (Deep Sleep +40 %)
    if (e.shakeT > T) k *= 1.25; // Intimidate: Shaken
    if (e.glassT > T) k *= 2; // Transmute: gold glass
    if (e.sweetN >= 3 && this.anyHas("gumdrop")) k *= 1.3; // Gumdrop
    if (e.stoneT > T && this.anyHas("petrify3")) { const el = this.elOf(h, e).el; if (el === "physical" || el === "rock") k *= 1.5; } // Petrify Evo: ×3 in all
    if (id === "jack-frost" && this.has(h, "frostbite4") && (this.frozen > 0 || e.chillT > T)) k *= 1.3;
    if (id === "szopin" && h.cnt && h.cnt.blood) k *= 1 + 0.1 * Math.min(10, h.cnt.blood); // Bloodlust
    if (this.dragonFormT > T) k *= 1.5; // Dragon Form
    if (r.crit && e.type !== "body" && this.has(h, "bountyCrit")) k *= 3; // Bounty Hunter
    r.d *= k;
    return r;
  };
  const hit0 = P.hit;
  P.hit = function (h, e, base, quiet) {
    if (!e || e.dead) return;
    const T = this.time;
    if (this.v4glass && h) { // Transmute: 3 different elements within 3 s
      const el = this.elOf(h, e).el, m = e.elm || (e.elm = {});
      m[el] = T;
      let n = 0;
      for (const x in m) if (m[x] > T - 3) n++;
      if (n >= 3 && !(e.glassT > T)) { e.glassT = T + 3; e.elm = {}; const q = this.pos(e); this.fxImg("dd/fx_hit_flash.webp", q.x, q.y, 60, 0.3, { grow: 0.5 }); }
    }
    const slept = e.dreamT > T;
    const r = hit0.call(this, h, e, base, quiet);
    if (slept && !e.dead && !e.dreamWake) e.dreamWake = T + 2; // Sleep: a hit wakes the scale 2 s later
    return r;
  };
  const ah0 = P.afterHit;
  P.afterHit = function (h, e, d, base, quiet) {
    const T = this.time, id = h.def.id, g0 = e.goldT;
    ah0.call(this, h, e, d, base, quiet);
    if (id === "half-goblin" && this.has(h, "venom2") && e.poisT > T) e.pois = Math.min(this.has(h, "poison10") ? 10 : DD.STATUS.poison.max, (e.pois || 0) + 1); // Venom Tips
    if (id === "occultist" && this.has(h, "ringCurse") && (e.biteN = (e.biteN || 0) + 1) >= 4) { e.biteN = 0; e.curseT = T + 4; } // Curse of the Ring
    if (id === "minstrel" && this.has(h, "drowsy") && !(e.wakeT > T)) e.sleepT = T + 2; // Lullaby: Drowsy, the next hit ×1.5
    if (id === "amar-suen") {
      const t = T + (this.has(h, "midas4") ? 4 : 2);
      e.goldT = Math.max(g0 > T ? g0 : 0, t);
      if (this.has(h, "crown4")) for (const nb of this.neighbours(e)) nb.goldT = Math.max(nb.goldT || 0, t);
    }
    if (id === "kael-dragon") this.aweT = Math.max(this.aweT || 0, T + 2); // every hit Awes the dragon
  };
  const kill0 = P.kill;
  P.kill = function (e, h) {
    if (e.dead) return;
    const T = this.time, p = this.pos(e);
    const gold = e.goldT > T, pin = e.pinT > T ? e.pinH : null, link = e.linkT > T ? { T: e.linkT, G: e.linkG, H: e.linkH, b: e.brandT } : null, chained = e.chainT === T ? e.chainBy : null;
    const inRift = h && h.def.id === "szopin" && this.c43.obj.some((o) => o.a55 === "rift" && o.h === h && dist(p, o) < o.R + e.r * 0.5);
    if (gold) e.goldT = 0; // the old gold shards (js/battle-c43.js) give way to Gilded below
    kill0.call(this, e, h);
    if (!e.dead) return;
    const vis = this.visible();
    const amar = this.heroes.find((x) => x.def.id === "amar-suen" && x.onWall);
    if (gold && amar) { this.fxImg("dd/fx_hit_coins.webp", p.x, p.y, 70, 0.35, { grow: 0.5 }); for (const t of this.near(e, 4, 140)) this.hit(amar, t, baseOf(amar) * 1.5, true); }
    if (h && h.def.id === "occultist" && (h.cnt.soul4 || 0) < 3) { h.cnt.soul4 = (h.cnt.soul4 || 0) + 1; h.st.count += 1; } // Soul Harvest
    if (inRift && this.has(h, "blood4")) h.cnt.blood = Math.min(10, (h.cnt.blood || 0) + 1); // Bloodlust
    if (link && link.H && this.has(link.H, "chainPass")) { // Guild Bounty
      const t = toughest(vis.filter((x) => !(x.linkT > T && x.linkG === link.G)), 1)[0];
      if (t) { t.linkT = link.T; t.linkG = link.G; t.linkH = link.H; if (link.b > T) t.brandT = link.b; const o = this.c43.obj.find((x) => x.a55 === "chains" && x.gid === link.G); if (o) o.es.push(t); }
    }
    if (pin && this.has(pin, "verdict4") && (pin.cnt.verdict || 0) < 30) { // Valkyrie's Verdict
      const t = this.densest(60);
      if (t) { pin.cnt.verdict = (pin.cnt.verdict || 0) + 1; this.waves.push({ type: "pin", hero: pin, target: t, t: pin.def.w.dur + pin.st.dur + 0.3, drop: 0.3, tick: 0, r: 12 * (1 + pin.st.size), ox: p.x, oy: p.y - 200, oa: -Math.PI / 2 }); }
    }
    if (chained && this.has(chained, "chainNew") && (chained.cnt.crT || 0) <= T) { // Chain Reaction
      chained.cnt.crT = T + 0.25;
      const nx = this.nearest(p, vis.filter((x) => !x.dead));
      if (nx) chainRun.call(this, chained, p, nx, 4, 0, new Set(), false);
    }
  };
  const rate0 = P.rateOf;
  P.rateOf = function (h) { return rate0.call(this, h) * (this.v4rally ? 1.15 : 1); }; // Rallying Cry: while a spear is pinned
  const sc0 = P.stepC43;
  P.stepC43 = function (dt) {
    const T = this.time;
    // World Tree: the blooms due now (js/attacks-c55.js makes them bloom in this step)
    for (const e of this.body) if (e.seedT && e.seedT <= T && !e.dead && e.seedH && this.has(e.seedH, "worldTree")) { this.wall = Math.min(this.wallMax, this.wall + this.wallMax * 0.005); slow(this, 0.9, 2); }
    sc0.call(this, dt);
    this.v4glass = this.anyHas("glass");
    for (const e of this.body) { e.sweetN = 0; if (e.dreamWake && T >= e.dreamWake) { e.dreamT = 0; e.dreamWake = 0; } }
    for (const o of this.c43.obj) if (o.type === "stick" && o.t >= o.fall && o.e) o.e.sweetN = (o.e.sweetN || 0) + 1;
    let rally = false;
    for (const wv of this.waves) if (wv.type === "pin" && wv.hero && wv.hero.def.id === "marpesia" && !(wv.drop > 0) && wv.target && !wv.target.dead) {
      wv.target.pinT = T + 0.15; wv.target.pinH = wv.hero; wv.target.pinK = this.has(wv.hero, "valk40") ? 1.4 : 1.2;
      if (this.has(wv.hero, "rally4")) rally = true;
    }
    this.v4rally = rally;
    if (this.danger()) {
      const vis = this.visible();
      // Ancient Seal: scales inside a triangle ×0.85
      for (const o of this.c43.obj) if (o.a55 === "glyphs" && this.has(o.h, "seal85") && vis.some((e) => !e.dead && inTri(this.pos(e), o.pts[0], o.pts[1], o.pts[2]))) { slow(this, 0.85, 0.2); break; }
      // Slow Time: scales under a sigil ×0.85
      if (this.c43.obj.some((o) => o.a55 === "sigil" && !o.e.dead && this.has(o.h, "slowSigil"))) slow(this, 0.85, 0.2);
      // Nightmare: 5 or more sleeping scales ×0.8
      if (this.anyHas("nightmare4") && this.body.filter((e) => e.dreamT > T).length >= 5) slow(this, 0.8, 0.2);
    }
  };
})();
