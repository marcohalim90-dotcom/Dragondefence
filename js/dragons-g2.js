/* G2 (2026-11-06, user no. 99 "lanjut g2"; Ledger Draft 38 DRAGON_RULES, user no. 91 and 93): the dragon part.
   - every stage fights 2–3 dragons in a row on the same path (C93.6 "di dungeon, 1 stage bisa lawan 2-3 naga"): Stage 1–9 two,
     from Stage 11 two or three; each dragon has its own form and elements; the stage's own dragon comes last;
   - Stage 10, 20, 30 … = a boss dragon (C91.38, C91.45): still only a dragon body (C50.1), 1.5 × as thick, immune to 1 element
     (Stage 10, 20) or 2 (Stage 30+): a hit of that element deals 0 and leaves no status; 1–2 lesser dragons come before it;
   - Rage (C91.39): the boss, and every dragon in Hard, runs faster for a few seconds every so often (own numbers per dragon); one
     second before, it roars and glows red; Awed (the Dragon element's status) puts the Rage off 2 s;
   - the stage HP stays what it was (it is shared out over the dragons); only the boss is thicker (no curve run yet, user no. 95).
   Pictures: the dragons use the 15 painted forms there are now; their own new forms come in G3. Loaded before js/state.js. */
(function () {
  // two more painted forms (C42 samples, docs/art-2a/forms): Rustscale and Riftwing
  Object.assign(DD.FORMS, {
    rust: { el: "physical", name: "Rustscale Drake", feats: [{ part: "feat", every: 6, w: 4 }] },
    riftwing: { el: "electric", name: "Riftwing", feats: [{ part: "feat", at: [2], w: 7.5 }] },
    // G3 group 1 (2026-11-06, ChatGPT, docs/art-2a/forms): the two bosses that wore borrowed forms. Hellchain = black ember scales in
    // red-hot chains, shackle claws, a flail tail; Worldroot = boulder stone bound by roots, root antlers, root claws
    hellchain: { el: "fire", name: "Hellchain Wyrm", feats: [{ part: "feat", every: 5, w: 4.4 }], headScale: 1.1 },
    worldroot: { el: "nature", name: "Worldroot Wyrm", feats: [{ part: "feat", every: 5, w: 4.4 }], headScale: 1.15 },
  });
  /** the lesser dragon of each stage (Draft 38 LESSER), stage → [name, elements]; after Stage 49 the list comes round again.
      no. 103: Stage 14 Hydra → Sporecap Wyrm, Stage 28 Magma Wyrm → Pumice Wyrm (Hydra and Magma Wyrm are bosses now) */
  const LESSER = {
    1: ["Moss Wyrm", ["nature"]], 2: ["Ironhide Drake", ["physical"]], 3: ["Mistfin Lung", ["water"]], 4: ["Thornback Drake", ["nature"]], 5: ["Storm Wyvern", ["electric"]],
    6: ["Tide Serpent", ["water"]], 7: ["Stonescale Drake", ["rock"]], 8: ["Ashscale Wyrm", ["fire"]], 9: ["Obsidian Wyrm", ["rock"]], 11: ["Blazefang", ["fire"]],
    12: ["Frost Wyrm", ["ice"]], 13: ["Bone Wyrm", ["dark"]], 14: ["Sporecap Wyrm", ["nature", "poison"]], 15: ["Thunder Drake", ["electric"]], 16: ["Drowned Wyrm", ["water"]],
    17: ["Venomscale Cobra", ["poison"]], 18: ["Riftwing", ["electric", "dark"]], 19: ["Sand Wyrm", ["rock"]], 21: ["Rustscale Drake", ["physical"]], 22: ["Ghostwyrm", ["water", "dark"]],
    23: ["Saltfossil Wyrm", ["rock"]], 24: ["Titanscale Gladiator", ["physical"]], 25: ["Eclipse Drake", ["dark", "electric"]], 26: ["Bloodwing", ["dark"]], 27: ["Blossom Wyrm", ["nature", "holy"]],
    28: ["Pumice Wyrm", ["fire", "rock"]], 29: ["Crystal Wyvern", ["electric", "ice"]], 31: ["Flytrap Wyrm", ["nature", "poison"]], 32: ["Jade Wyrm", ["rock", "holy"]], 33: ["Shellback Wyrm", ["water", "rock"]],
    34: ["Harvest Wyrm", ["nature"]], 35: ["Plumed Storm Wyrm", ["electric", "holy"]], 36: ["Kraken Wyrm", ["water", "dark"]], 37: ["Pangolin Wyrm", ["rock"]], 38: ["Cinder Axolotl", ["fire", "water"]],
    39: ["Siegeback Wyrm", ["physical", "rock"]], 41: ["Phoenix Wyrm", ["fire", "holy"]], 42: ["Lantern Jelly Wyrm", ["water", "electric"]], 43: ["Wrapped Wyrm", ["dark", "rock"]], 44: ["Lotus Wyrm", ["nature", "water"]],
    45: ["Runebound Wyrm", ["holy", "electric"]], 46: ["Leviathan", ["water", "ice"]], 47: ["Chameleon Wyrm", ["nature", "poison"]], 48: ["Coilspark Wyrm", ["electric", "physical"]], 49: ["Shogun Wyrm", ["physical", "fire"]],
  };
  /** the boss dragons (Draft 38 BOSSES): rage = [every s, for s, speed ×]; after Stage 50 they come round again */
  const BOSSES = [
    { name: "Ember Drake", world: "Ember Drake Nest", form: "ember", els: ["fire", "rock"], immune: ["fire"], rage: [45, 3, 1.6] },
    { name: "Broodmother", world: "Broodmother Hive", form: "brood", els: ["nature", "poison"], immune: ["poison"], rage: [40, 4, 1.6] },
    { name: "Elder Dragon", world: "Elder Dragon's Throne", form: "elder", els: ["fire", "holy"], immune: ["fire", "water"], rage: [35, 4, 1.7] },
    { name: "Hellchain Wyrm", world: "Hellchain Pit", form: "hellchain", els: ["fire", "dark"], immune: ["fire", "holy"], rage: [30, 5, 1.7] },
    { name: "Worldroot Wyrm", world: "Worldroot Wyrm Grove", form: "worldroot", els: ["nature", "rock"], immune: ["ice", "water"], rage: [25, 5, 1.8] },
    // no. 103 (user: "pindah", C91.45 "yang sekarang yang terlihat seperti bos naga jadi masuk ke stage perkalian 10"): the two
    // lesser dragons that look like bosses move to Stage 60 and 70; the boss list then comes round every 70 stages
    { name: "Magma Wyrm", world: "Magma Wyrm Forge", form: "magma", els: ["fire", "rock"], immune: ["fire", "rock"], rage: [25, 6, 1.8] },
    { name: "Hydra", world: "Hydra Mire", form: "hydra", els: ["nature", "poison"], immune: ["poison", "water"], rage: [22, 6, 1.9] },
  ];
  /** the painted form a dragon wears until its own comes (G3): by name, else the form of its first element */
  const BY_NAME = { "Moss Wyrm": "moss", "Ironhide Drake": "ironhide", "Mistfin Lung": "tide", "Thornback Drake": "moss", "Storm Wyvern": "wyvern", "Tide Serpent": "tide",
    "Stonescale Drake": "sand", "Ashscale Wyrm": "ember", "Obsidian Wyrm": "ironhide", Blazefang: "magma", "Frost Wyrm": "frost", "Bone Wyrm": "bone", Hydra: "hydra",
    "Thunder Drake": "wyvern", "Drowned Wyrm": "tide", "Venomscale Cobra": "hydra", Riftwing: "riftwing", "Sand Wyrm": "sand", "Rustscale Drake": "rust", Ghostwyrm: "tide",
    "Saltfossil Wyrm": "bone", "Titanscale Gladiator": "ironhide", "Eclipse Drake": "wyvern", Bloodwing: "brood", "Blossom Wyrm": "moss", "Magma Wyrm": "magma", "Crystal Wyvern": "crystal" };
  const BY_EL = { nature: "moss", physical: "ironhide", water: "tide", electric: "wyvern", fire: "magma", ice: "frost", rock: "sand", poison: "hydra", dark: "bone", holy: "crystal" };
  // G3 group 3 (2026-11-06, ChatGPT, docs/art-2a/forms/dragon_<id>.png; user no. 64 "naganya secara fisik juga harus beda", no. 91
  // "yang sisanya jadi naga lesser aja, lebih tampak lemah"): each lesser dragon its own painted form, younger and lighter than a
  // boss; a pair of limbs (feat) every 5 scales. READY = painted; card = its stage card is painted too (else the card of the form
  // it wore before is shown on Home)
  const G3 = { "Mistfin Lung": "mistfin", "Thornback Drake": "thornback", "Stonescale Drake": "stonescale", "Ashscale Wyrm": "ashscale",
    "Obsidian Wyrm": "obsidian", Blazefang: "blazefang", "Thunder Drake": "thunder", "Drowned Wyrm": "drowned", "Venomscale Cobra": "venomscale",
    Ghostwyrm: "ghost", "Saltfossil Wyrm": "saltfossil", "Titanscale Gladiator": "titanscale", "Eclipse Drake": "eclipse", Bloodwing: "bloodwing",
    "Blossom Wyrm": "blossom", "Flytrap Wyrm": "flytrap", "Jade Wyrm": "jade", "Shellback Wyrm": "shellback", "Harvest Wyrm": "harvest",
    "Plumed Storm Wyrm": "plumed", "Kraken Wyrm": "kraken", "Pangolin Wyrm": "pangolin", "Cinder Axolotl": "axolotl", "Siegeback Wyrm": "siegeback",
    "Phoenix Wyrm": "phoenix", "Lantern Jelly Wyrm": "lantern", "Wrapped Wyrm": "wrapped", "Lotus Wyrm": "lotus", "Runebound Wyrm": "runebound",
    Leviathan: "leviathan", "Chameleon Wyrm": "chameleon", "Coilspark Wyrm": "coilspark", "Shogun Wyrm": "shogun",
    "Sporecap Wyrm": "sporecap", "Pumice Wyrm": "pumice" }; // no. 103: the two new lesser dragons of Stage 14 and 28
  const G3_READY = { mistfin: { card: true }, thornback: { card: true }, stonescale: { card: true }, eclipse: { card: true }, bloodwing: { card: true }, blossom: { card: true }, drowned: { card: true }, jade: { card: true }, kraken: { card: true }, shellback: { card: true }, harvest: { card: true }, phoenix: { card: true }, plumed: { card: true }, shogun: { card: true }, pangolin: { card: true }, axolotl: { card: true }, flytrap: { card: true }, siegeback: { card: true }, ashscale: { card: true }, lantern: { card: true }, obsidian: { card: true }, blazefang: { card: true }, wrapped: { card: true }, thunder: { card: true }, lotus: { card: true }, venomscale: { card: true }, ghost: { card: true }, runebound: { card: true }, leviathan: { card: true }, saltfossil: { card: true }, chameleon: { card: true }, titanscale: { card: true }, coilspark: { card: true }, sporecap: { card: true }, pumice: { card: true } };
  for (const [name, id] of Object.entries(G3)) {
    const r = G3_READY[id];
    if (!r) continue;
    const els = (Object.values(LESSER).find((x) => x[0] === name) || [name, ["water"]])[1];
    DD.FORMS[id] = { el: els[0], name, feats: [{ part: "feat", every: 5, w: r.w || 4.2 }], ...(r.card ? {} : { cardFrom: BY_NAME[name] || BY_EL[els[0]] }) };
    BY_NAME[name] = id;
  }
  /** the hall a new element fights in until it has its own (G3): the nearest painted one */
  DD.HALL_EL = { ice: "water", rock: "physical", poison: "nature", dark: "electric", holy: "fire" };
  const lesserAt = (n) => { const k = ((n - 1) % 50) + 1; return LESSER[k] || LESSER[k - 1] || LESSER[k + 1]; };
  const lesser = (n) => { const [name, els] = lesserAt(n); return { name, form: BY_NAME[name] || BY_EL[els[0]] || "moss", els, el: els[0] }; };
  DD.isBossStage = (n) => n % 10 === 0;
  /** the dragons of stage n, in the order they come out; share = the part of the stage's body each one is */
  DD.stageDragons = (n) => {
    const out = [], main = lesser(n);
    const near = [n - 1, n + 1, n - 2, n + 2, n - 3, n + 3].filter((k) => k >= 1 && !DD.isBossStage(k)).map(lesser);
    const pick = (avoid) => near.find((d) => !avoid.some((a) => a.form === d.form || a.el === d.el)) || near.find((d) => !avoid.some((a) => a.form === d.form)) || near[0];
    if (DD.isBossStage(n)) {
      const b = BOSSES[(n / 10 - 1) % BOSSES.length];
      const boss = { ...b, el: b.els[0], boss: true };
      const k = n >= 30 ? 2 : 1;
      for (let i = 0; i < k; i++) out.push(pick([boss, ...out]));
      out.push(boss);
      const shares = k === 1 ? [0.35, 0.65] : [0.25, 0.25, 0.5];
      out.forEach((d, i) => (d.share = shares[i]));
    } else {
      const k = n <= 9 ? 2 : n % 2 ? 3 : 2;
      for (let i = 0; i < k - 1; i++) out.push(pick([main, ...out]));
      out.push(main);
      const shares = k === 2 ? [0.4, 0.6] : [0.3, 0.3, 0.4];
      out.forEach((d, i) => (d.share = shares[i]));
    }
    return out.map((d, i) => ({ ...d, k: i, immune: d.immune || [] }));
  };
  // a stage is named after its own dragon: Stage 1–30 keep their world names (they are these dragons' places); a boss stage is its
  // boss's place; the others are "<dragon> <place of its element>"; past Stage 50 the list comes round with II, III …
  const PLACE = { nature: "Grove", water: "Shoals", rock: "Quarry", fire: "Caldera", electric: "Spire", ice: "Glacier", dark: "Hollow", holy: "Sanctum", physical: "Bastion", poison: "Mire" };
  const ROMAN = ["", "", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];
  const round = (n) => { const c = Math.floor((n - 1) / 50) + 1; return c < ROMAN.length ? ROMAN[c] : " " + c; };
  // no. 103: Hydra and Magma Wyrm are bosses now, so the worlds of Stage 14 and 28 are named after their new dragons
  const RENAME = { "Hydra Fen Temple": "Sporecap Fen Temple", "Magma Drake Forge": "Pumice Wyrm Forge" };
  const placeOf = (n, s, main) => { if (main.boss) return main.world + round(n); if (n > 30) return `${main.name} ${PLACE[main.el] || "Lair"}` + round(n); const w = s.worldName.replace(/ [IVX]+$/, ""); return (RENAME[w] || w) + round(n); };
  const bossRound = (n) => { const c = Math.floor((n / 10 - 1) / BOSSES.length) + 1; return c < ROMAN.length ? ROMAN[c] : " " + c; }; // no. 103
  // every stage carries its dragons; the stage's element, form and "weak to" are its last dragon's (the stage's own, or the boss)
  const stage0 = DD.stage;
  DD.stage = function (n) {
    const s = stage0(n), dragons = DD.stageDragons(n), main = dragons[dragons.length - 1];
    const k = ((n - 1) % 50) + 1, worldName = main.boss ? main.world + bossRound(n) : placeOf(k, stage0(k), main).replace(/( [IVX]+)+$/, "") + round(n);
    return { ...s, name: `${n}. ${worldName}`, worldName, dragons, bossDragon: !!main.boss, el: main.el, els: main.els, form: main.form,
      immune: main.immune, weak: DD.weakList(main.els).filter((e) => !main.immune.includes(e))[0] || null, mainName: main.name,
      // Recommended Power follows the boss's thicker body (its share × 1.5)
      power: main.boss ? Math.round(s.power * (1 + main.share * (DD.BOSS_HP - 1))) : s.power };
  };
  /** Rage numbers of a lesser dragon in Hard (Draft 38): every 50–70 s, for 2–4 s, ×1.5; fixed per stage and dragon */
  DD.hardRage = (n, k) => [50 + ((n * 7 + k * 13) % 21), 2 + ((n + k) % 3), 1.5];
  DD.BOSS_HP = 1.5; // the boss dragon's body ×1.5 (Draft 38; not run against the curve yet)
  DD.DRAGON_GAP = 46; // px of path between two dragons (only used when two dragons share one track)
  DD.DRAGON_STAGGER = 10; // no. 102: s of battle between one dragon leaving its portal and the next one leaving its own
})();
