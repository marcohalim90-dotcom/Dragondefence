/* C43 (user no. 93: "build hero dan gunakan gpt untuk asset yang kurang"; design = Ledger Draft 38, artifact "Rancangan Skill dan
   Evo Card"): 11 elements with natural rivals, the new statuses and reactions, the heroes' new elements and attacks, the Skill Card
   odds. Loaded after js/data.js and js/cards-c43.js (generated: every hero's Skill Cards and Evo Cards), before js/battle.js.
   The battle side is js/battle-c43.js. Nothing here names a hero's design source. */
(function () {
  /* ---------------------------------------------------------------- elements (Draft 38.1, user no. 92–93) */
  DD.ELEMENTS = ["physical", "fire", "water", "nature", "electric", "ice", "rock", "poison", "dark", "holy", "dragon"];
  DD.ELEMENT_NAME = { physical: "Physical", fire: "Fire", water: "Water", nature: "Nature", electric: "Electric", ice: "Ice", rock: "Rock", poison: "Poison", dark: "Dark", holy: "Holy", dragon: "Dragon" };
  DD.EL_COL = { physical: "#e8dcc8", fire: "#ff8a3a", water: "#5ab4ff", nature: "#7fd45a", electric: "#ffe24a", ice: "#a8ecff", rock: "#c49a62", poison: "#c46ae8", dark: "#8b7bd8", holy: "#fff0b8", dragon: "#ff5a5a" };
  /** attacker → elements it hits ×2 (up) and ×0.75 (down); rest = everything else (×1 unless set). Dragon is the heroes' only:
      ×1.5 to every element, and no dragon is ever of the Dragon element. */
  DD.EFF = {
    physical: { up: ["ice", "rock", "dark"], down: ["poison", "holy"] },
    fire: { up: ["nature", "ice"], down: ["fire", "water", "rock"] },
    water: { up: ["fire", "rock"], down: ["water", "nature"] },
    nature: { up: ["water", "rock"], down: ["fire", "nature", "poison"] },
    electric: { up: ["water"], down: ["electric", "nature", "rock"] },
    ice: { up: ["nature", "rock"], down: ["fire", "water", "ice"] },
    rock: { up: ["fire", "ice", "electric", "poison"], down: ["physical", "nature"] },
    poison: { up: ["nature", "holy"], down: ["poison", "rock"] },
    dark: { up: ["dark", "holy"], down: [], rest: 1.25 },
    holy: { up: ["dark", "holy"], down: [], rest: 1.25 },
  };
  DD.DRAGON_HIT = 1.5;
  DD.EL_UP = 2;
  DD.EL_DOWN = 0.75;
  /** One attacking element against one dragon element. */
  DD.elMul = (a, d) => (a === "dragon" ? DD.DRAGON_HIT : !DD.EFF[a] ? 1 : DD.EFF[a].up.includes(d) ? DD.EL_UP : DD.EFF[a].down.includes(d) ? DD.EL_DOWN : DD.EFF[a].rest || 1);
  /** A hero's best element against a dragon: two dragon elements multiply; an immune element (boss) deals nothing. */
  DD.elBest = (atk, def, immune) => {
    let best = { el: atk[0], m: -1 };
    for (const a of atk) {
      const m = immune && immune.includes(a) ? 0 : a === "dragon" ? DD.DRAGON_HIT : def.reduce((x, d) => x * DD.elMul(a, d), 1);
      if (m > best.m) best = { el: a, m };
    }
    return best;
  };
  /** The elements that hit a dragon of these elements ×2 or more (Home and stage cards: "Weak to"). */
  DD.weakList = (def) => DD.ELEMENTS.filter((a) => a !== "dragon" && def.reduce((x, d) => x * DD.elMul(a, d), 1) >= 2);
  // the old single "weak to" stays for the screens that still read it: the first ×2 element
  DD.WEAK_TO = Object.fromEntries(["physical", "fire", "water", "nature", "electric", "ice", "rock", "poison", "dark", "holy"].map((d) => [d, DD.weakList([d])[0] || null]));
  DD.WEAK_MULT = DD.EL_UP;

  /* ---------------------------------------------------------------- statuses and reactions (Draft 38.1) */
  Object.assign(DD.STATUS, {
    ice: { id: "chill", name: "Chilled", t: 2, col: "#a8ecff", slow: 0.85, stacks: 3, freeze: 1, cd: 4 },
    rock: { id: "stagger", name: "Staggered", t: 0.5, col: "#c49a62", push: 4 },
    poison: { id: "poison", name: "Poisoned", t: 4, col: "#c46ae8", dot: 0.1, max: 5 },
    dark: { id: "curse", name: "Cursed", t: 4, col: "#8b7bd8" },
    holy: { id: "judge", name: "Judged", t: 3, col: "#fff0b8", per: 0.15 },
    dragon: { id: "awe", name: "Awed", t: 2, col: "#ff5a5a" },
  });
  Object.assign(DD.REACT, {
    superconduct: { name: "Superconduct", mul: 1.3, jumps: 3, hint: "Superconduct! Chilled + Electric: ×1.3, and lightning jumps to 3 more scales." },
    toxic: { name: "Toxic Blaze", mul: 1, burst: 0.5, hint: "Toxic Blaze! Poisoned + Fire: every Poisoned stack bursts for 50% on 3 scales." },
    eclipse: { name: "Eclipse", mul: 2, hint: "Eclipse! Judged + Dark, or Cursed + Holy: that hit deals ×2." },
  });
  DD.REACT.shatter.hint = "Shatter! Physical or Rock hits on a frozen dragon deal ×2 (slowed: ×1.25).";
  Object.assign(DD.ELEMENT_LINE, {
    ice: "Ice · leaves Chilled (dragon ×0.85; 3 stacks freeze it 1 s) · Superconduct with Electric",
    rock: "Rock · leaves Staggered (pushes the dragon back) · Shatter on a frozen dragon",
    poison: "Poison · leaves Poisoned (10% a second, 5 stacks) · Toxic Blaze with Fire",
    dark: "Dark · leaves Cursed (the next hit crits) · ×2 on Dark and Holy, ×1.25 on the rest",
    holy: "Holy · leaves Judged (+15% damage taken) · ×2 on Dark and Holy, ×1.25 on the rest",
    dragon: "Dragon · leaves Awed · ×1.5 on every element",
  });

  /* ---------------------------------------------------------------- heroes (Draft 38.4) */
  const W = {
    minstrel: { kind: "pulse", w: { dmg: 13, cd: 1.6, n: 3, r: 60, gap: 0.3 }, line: "A note lands on the thickest part of the body and rings out 3 pulses that hit every scale within 60 px." },
    archaeologist: { kind: "pinball", w: { dmg: 9, cd: 2.4, speed: 520, life: 3, count: 1, r: 14 }, line: "A relic disc ricochets off the screen edges for 3 s, hitting every scale it crosses." },
    "sugarplum-faerie": { kind: "rain", w: { dmg: 11, cd: 1.8, n: 3, dur: 2, tick: 0.35 }, line: "Sweets rain onto scales in the upper field and stick for 2 s, nipping them." },
    tristan: { kind: "sweep", w: { dmg: 90, cd: 1.6, band: 26 }, line: "A crescent blade wave flies across the whole width along the thickest row of the body." },
    "time-traveler": { kind: "clock", w: { dmg: 30, cd: 2.1, width: 10, arc: 1.4, t: 0.7 }, line: "A clockwork ray sweeps across the field like a clock hand, through every scale it passes." },
    viking: { kind: "whirl", w: { dps: 158, cd: 2.4, speed: 200, life: 2.2, r: 26 }, line: "A whirling axe climbs straight up his lane and grinds through every scale it meets." },
    "amar-suen": { w: { gold: 0 }, line: "Golden touches fall on scales anywhere on the field and turn them to gold." },
    cassandra: { line: "Three thorn lashes cross the thickest part of the body and drag the dragon back a moment." },
    "guild-leader": { line: "Marks the strongest scale near his column; his crow dives at it." },
    // C45: attack texts that still named the element the hero had before C43 (Pell is pure Poison; Marpesia is Holy)
    alchemist: { weapon: "Venom Flask", tech: "A flask lobbed onto the first scale in her column leaves a poison zone." },
    marpesia: { tech: "A spear falls on the back of the body in her column and stays pinned, hurting that scale; when that scale breaks it moves to the next one in the column." },
  };
  for (const h of DD.HEROES) {
    h.els = (DD.HERO_EL && DD.HERO_EL[h.id]) || [h.el];
    h.el = h.els[0]; // colour, painted hits and the old one-element screens use the first
    const o = W[h.id];
    if (o) {
      if (o.kind) h.kind = o.kind;
      if (o.w) h.w = Object.assign({}, h.w, o.w);
      if (o.line) h.line = o.line;
      if (o.kind && o.line) h.tech = o.line; // C45: the profile's Attack text follows the new attack, not the old one
      if (o.weapon) h.weapon = o.weapon;
      if (o.tech) h.tech = o.tech;
    }
    if (h.upg) delete h.upg.gold; // C43: no Gold card (user no. 91: "statistik gold juga tidak perlu ada")
    h.cards = (DD.CARDS && DD.CARDS[h.id]) || [];
  }
  DD.HERO = Object.fromEntries(DD.HEROES.map((h) => [h.id, h]));
  /** G1 (no. 99): a thrown zone (Pell, Klaus) shows the pool of its element (2a/fx/pool_<el>.webp, ChatGPT 2026-11-06); others keep the fire pool. */
  DD.ZONE_POOLS = ["physical", "fire", "water", "nature", "electric", "ice", "rock", "poison"];
  DD.zoneImg = (el) => (DD.ZONE_POOLS.includes(el) ? `2a/fx/pool_${el}.webp` : "dd/fx_area_firepool.webp");
  // the new attacks deal about what the old ones did before the element chart (sim-node heroes, Stage 3, 2026-11-05)
  Object.assign(DD.PATTERN_K, { minstrel: 0.4, archaeologist: 1.54, "sugarplum-faerie": 0.75, tristan: 0.213, "time-traveler": 0.195, viking: 0.5 });
  for (const id of ["minstrel", "sugarplum-faerie", "viking"]) delete DD.PATTERN_KE[id];
  delete DD.CARD_STATS.gold;
  Object.assign(DD.CARD_STATS, {
    critDmg: { label: "Crit Damage", tag: "Crit DMG", v: [0.4, 0.8, 1.2, 1.6], pct: true },
    multi: { label: "Hits", tag: "Hits", v: [1, 2, 3, 4] },
    stun: { label: "Stun", tag: "Stun", v: [0.1, 0.2, 0.3, 0.4], unit: "s" },
  });

  /* ---------------------------------------------------------------- Skill Card odds (Draft 38.2, user no. 91) */
  DD.CARD_TIER_ODDS = [["rare", 0.625], ["epic", 0.225], ["legendary", 0.1], ["mythic", 0.05]];
  DD.REROLL_STEP = 0.015; // every reroll: Rare −1.5 %, the three others +0.5 % each, for the rest of the battle (stops at Rare 0 %)
  DD.EVO_FROM = 4; // an Evo Card shows from this skill level in a battle
  /** The tier odds after `n` rerolls in this battle. */
  DD.cardOdds = (n) => {
    const k = Math.min(n, DD.CARD_TIER_ODDS[0][1] / DD.REROLL_STEP), add = (DD.REROLL_STEP / 3) * k;
    return DD.CARD_TIER_ODDS.map(([t, p], i) => [t, i === 0 ? Math.max(0, p - DD.REROLL_STEP * k) : p + add]);
  };
})();
