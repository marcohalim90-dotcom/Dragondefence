/* C53 (user no. 113–115, 2026-11-07: "banyak mythic tier kalah dengan kael … ini permasalahan dari jumlah hit, growth skill card
   dan lainnya" · "baik langsung perbaikan ke 4 nya" · "dragon kael ga usah turun"; Ledger Draft 42–43): hero strength by tier.
   Measured with tools/sim-hero-cards.mjs (each hero alone, Lv 10, elements neutral, Stage 12 dragon HP ×30) at two points: no
   Skill Cards and 10 Skill Cards. Kael (Epic) is the yardstick the user called right ("damage yang cukup baik dan pas"); every
   tier step is ×1.25 of the one below (Common 0.64 · Rare 0.8 · Epic 1 · Legendary 1.25 · Mythic 1.56 × Kael). Dragon Kael
   stays as he is (user no. 115).
   - DD.PATTERN_K: the hero's base damage coefficient (as before), set so both points land near the tier's target.
   - CARD_DMG: × on the values (and cap) of the hero's Damage Skill Card, for heroes whose cards grew too little.
   - CAPS: new caps on stats that multiply each other (more shots × more pierce …), for heroes whose cards grew too much.
   - L20: the hero's own damage step from Lv 10 to Lv 20 (× at Lv 20, in step between; 1 at Lv 10 and below). At Lv 20 each hero
     differs by its old Lv 20 bonus, the first Evo it starts with and its Lv 15 Mythic Card; L20 puts them back in tier order,
     measured the same way at Lv 20 (dragon HP ×300, no cards and 5 cards).
   Loaded after js/heroes-c43.js and js/dragons-g2.js, before js/state.js. */
(function () {
  DD.C53 = {
    tierK: { common: 0.64, rare: 0.8, epic: 1, legendary: 1.25, mythic: 1.5625 },
    ref: "spellsword",
    keep: ["spellsword", "kael-dragon"],
    K: {"spellsword":1.13, "ebenezer":2.125, "half-goblin":0.633, "enchantress":0.865, "mercenary":1.161, "tracker":0.392, "dwarf":1.31, "occultist":0.563, "leprechaun":0.929, "knight":1.47, "jack-frost":1.776, "cassandra":0.157, "sorceress":4.298, "crusader":0.299, "tou-lak":1.747, "alchemist":0.428, "alexandra":0.507, "marpesia":0.973, "loeg-yllavyre":0.782, "amar-suen":2.02, "minstrel":0.832, "scout":0.509, "klaus":0.618, "archaeologist":0.911, "sugarplum-faerie":0.682, "tristan":0.14, "guild-leader":1.297, "szopin":1.224, "time-traveler":0.502, "viking":0.663, "dreamwalker":2.601},
    CARD_DMG: {"ebenezer":1.15, "enchantress":1.32, "mercenary":2.83, "dwarf":1.15, "occultist":2.05, "leprechaun":2.07, "cassandra":3, "crusader":2.16, "tou-lak":1.32, "alexandra":1.15, "minstrel":2.45, "klaus":1.64, "archaeologist":2.82, "sugarplum-faerie":3, "tristan":1.75, "guild-leader":1.32, "szopin":1.83, "time-traveler":1.15, "viking":1.79, "half-goblin":0.67, "sorceress":0.71, "amar-suen":0.81},
    L20: {"spellsword":0.524, "ebenezer":1.058, "half-goblin":1.451, "enchantress":1.486, "mercenary":1.711, "tracker":1.319, "dwarf":1.485, "occultist":1.722, "leprechaun":1.349, "knight":1.284, "jack-frost":1.088, "cassandra":1.515, "sorceress":1.242, "crusader":1.066, "tou-lak":1.383, "alchemist":1.991, "alexandra":1.965, "marpesia":1.98, "loeg-yllavyre":1.682, "amar-suen":2.363, "minstrel":2.747, "scout":2.035, "klaus":1.96, "archaeologist":1.468, "sugarplum-faerie":2.019, "tristan":2.246, "guild-leader":1.186, "szopin":1.014, "time-traveler":1.188, "viking":1.704, "dreamwalker":1.058},
    CAPS: {
      spellsword: { critDmg: 1.6, rate: 2, count: 4 }, // his two Skill Cards without a limit (every other hero's Speed stops at +200 %); Bolt Count up to +4 like Nim
      "half-goblin": { count: 4, pierce: 4 },
      sorceress: { size: 1.2, dur: 2 },
      "jack-frost": { count: 3, dur: 2.5 },
      "loeg-yllavyre": { count: 3 },
      "amar-suen": { count: 4 },
    },
    // cards whose effect was changed so they add damage (js/battle.js, js/battle-c43.js "C53"): their new text and numbers.
    // "Near the wall" = some dragon's head is in the last quarter of its path (P.danger): pushes and slows act only then.
    CARD_EDIT: {
      "enchantress:Heart Splash": { text: "Every heartdrop splashes the 2 scales beside the one it hits: 10% of its damage, and Wet." },
      "mercenary:Armour Breaker": { text: "The scale he shoots gets 3 stacks of Cracked before the shot lands (+15% damage taken)." },
      "dwarf:Quake Return": { text: "When his axes come back they slam the wall: the 3 front scales take 150% for each axe thrown. Near the wall the dragon is also pushed back 20 px." },
      "occultist:Soul Harvest": { eff: { flag: "soulHarvest", stat: { count: 1 } }, text: "Skulls +1. Every scale killed inside the swarm adds a skull for the rest of the battle (up to 6 more)." },
      "jack-frost:Frostbite": { text: "Chilled and Frozen scales take +30% from snowballs. Near the wall, Frozen lasts twice as long." },
      "cassandra:Hook and Drag": { text: "Near the wall, every lash pulls the whole dragon back 15 px." },
      "sorceress:Scorch": { text: "Every second a Burning scale sets the scale behind it Burning, for 50% of a flame hit." },
      "marpesia:Holy Pin": { text: "A scale with a spear pinned in it takes +20% damage from every hero. Near the wall the dragon also moves ×0.8 while a spear is pinned." },
      "sugarplum-faerie:Sugar Rush": { text: "Near the wall, every scale with a sweet on it slows the dragon 2% (up to 30%)." },
      "time-traveler:Slow Time": { text: "Near the wall, every scale the ray touches slows the dragon ×0.5 for 1 s." },
      "dreamwalker:Nightmare": { text: "Scales the tide touches fall Asleep for 2 s. The next hit on a sleeping scale deals ×1.5 and wakes it; it can fall asleep again after 1 s. Near the wall, while 5 or more scales sleep, the dragon moves ×0.8." },
      "tou-lak:Thunder Roar": { text: "Every bounce off the bottom roars: the 5 front scales take 100%. Near the wall the dragon is also pushed back 10 px (at most once a second)." },
      "alchemist:Mixed Brew": { text: "Each flask's zone switches between the element the dragon is weakest to and a second, random element of Pell's that the dragon does not resist (not Ice, Rock or Nature), so Reactions start inside it." },
      "scout:Volley": { text: "Every 4th attack, 3 arrows for each arrow he fires rain down onto the scales above him." },
      "occultist:Lich": { text: "The skull swarm covers twice the area." },
      "jack-frost:Snowman": { text: "Snowballs grow 25% bigger and hit 25% harder at every bounce, up to ×2." },
      "tou-lak:Intimidate": { text: "When an orb fades it explodes on the nearest scale: 200% to every scale within 60 px." },
      "amar-suen:Golden Crown": { text: "Every touch turns 3 scales in a row to gold; gold scales take +50% from Amar-Suen." },
      "minstrel:Lullaby": { text: "Every note puts the scales it hits to Sleep: the next hit on them deals ×1.5. Near the wall, every note also stops the dragon for 0.3 s." },
      "sugarplum-faerie:Sugar Storm": { text: "Every drop brings 2 more sweets, falling anywhere on the upper field." },
      "jack-frost:Frost Storm": { text: "Every 8th snowball hit brings a blizzard: 20% to every scale on the field. Near the wall it also freezes the dragon for 0.4 s." },
      "cassandra:Moon Huntress": { eff: { stat: { dmg: 2, stun: 0.1 } }, text: "Lash Damage +200% and Stun Time +0.1 s (Stun Time works near the wall)." },
      "cassandra:Stun Time": { note: "near the wall" },
      "enchantress:Mass Charm": { text: "Every heartdrop puts the scale it hits to Sleep: the next hit on it deals ×1.5. Near the wall, every heartdrop also stops the whole dragon for 0.3 s." },
      "tracker:Spirit Howl": { text: "Every 15 s the wolves howl: for 3 s they deal ×2. Near the wall the whole dragon also moves ×0.7 for those 3 s." },
      "amar-suen:King's Ransom": { text: "Every 20 s the front third of the body turns to gold for 4 s. Gold scales take ×2 from Amar-Suen." },
      "guild-leader:Guild Bounty": { text: "Every crow hit Brands its scale and the 2 beside it (×1.5 damage taken for 3 s); a Branded scale that dies passes its Brand on." },
      "scout:Hawk": { text: "Every 5 s a hawk marks the first scale in his line and the 2 beside it for 5 s: arrows that hit them deal ×2." },
      "knight:Sunrise": { text: "Every 12 s the sky opens for 1.5 s: a holy light hits every scale on the screen, 300% a second." },
      "alexandra:Storm Tome": { eff: { mult: 7 }, text: "Every 5 s a thunderstorm strikes the whole screen: 700% to every scale, and Charged." },
      "occultist:Grave Call": { eff: { mult: 5 }, text: "Every 12 s the skulls fly out and bite every scale on the screen once for 500%." },
      "sugarplum-faerie:Jawbreaker": { eff: { mult: 9 }, text: "Every 10 s a giant jawbreaker rolls down the body from the head: 900% to every scale it rolls over." },
      "loeg-yllavyre:Elder Call": { eff: { mult: 11 }, text: "Every 30 s an elder dragon flies over the whole screen breathing: 1100% to every scale." },
      "sorceress:Phoenix Wings": { eff: { mult: 4 }, text: "Every 10 s a flaming phoenix flies across the whole screen: 400% to every scale and Burning." },
      "time-traveler:Rewind": { eff: { every: 15, back: 5 }, text: "Every 15 s time rewinds: the damage the dragon took in the last 5 s hits it again. Near the wall it is also pushed back 40 px." },
      "spellsword:Edge Bounce": { eff: { stat: { pierce: 1 } }, text: "Pierce +1, and a bolt that reaches the edge of the screen bounces back to hit again." },
      "szopin:Bloodlust": { text: "A blade deals +10% for every scale it has hit this throw (up to +100%)." },
      "minstrel:Crescendo": { text: "Each pulse hits 25% harder than the one before it (up to ×2)." },
      "tristan:Flame Tornado": { text: "Every 5th slash becomes a flame tornado that rises from the slash for 2 s (200% a hit)." },
    },
  };
  const C = DD.C53;
  Object.assign(DD.PATTERN_K, C.K);
  const lm0 = DD.levelMods;
  DD.levelMods = function (h, lv) {
    const m = lm0(h, lv), L = C.L20[h.id];
    if (L && lv > 10) m.dmgL *= 1 + (L - 1) * Math.min(1, (lv - 10) / 10);
    return m;
  };
  // the old per-hero coefficient after the first Evo (cut or doubled some Evo Cards out of sight): gone, each card counts by its own effect
  for (const k of Object.keys(DD.PATTERN_KE)) delete DD.PATTERN_KE[k];
  for (const h of DD.HEROES) for (const c of h.cards || []) {
    const ed = C.CARD_EDIT[c.key];
    if (!ed) continue;
    if (ed.text) c.text = ed.text;
    if (ed.note) c.note = ed.note;
    if (ed.eff) c.eff = Object.assign({}, c.eff, ed.eff, ed.eff.stat ? { stat: Object.assign({}, ed.eff.stat) } : {});
  }
  for (const h of DD.HEROES) {
    const dm = C.CARD_DMG[h.id], caps = C.CAPS[h.id];
    for (const c of h.cards || []) {
      if (c.type !== "skill") continue;
      if (dm && c.stat === "dmg") {
        for (const t of Object.keys(c.tiers)) c.tiers[t] = Math.round(c.tiers[t] * dm * 100) / 100;
        if (c.cap !== null && c.cap !== undefined) c.cap = Math.round(c.cap * dm * 100) / 100;
      }
      if (caps && caps[c.stat] !== undefined) c.cap = caps[c.stat];
    }
  }
})();
