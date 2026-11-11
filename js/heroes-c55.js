/* C55 (user no. 118, 2026-11-08: "seharusnya serangan2 hero semua unique, masing2 punya arah serangan berbeda 1 sama lain, bukan
   lempar2, atau 1 garis ke kiri kanan … efek burn, slow dll itu2 doang. harusnya variasi lebih banyak … harusnya lebih liar … pastikan
   semua hero memiliki unique serangannya, tidak ada yang sama secara konsep"; Ledger Draft 45): 21 heroes get a new attack, each its
   own shape and direction and its own effect; the other 11 keep theirs (they were already one of a kind). This file holds the data
   (attack kind, weapon numbers, texts, Skill Card names, Unique / Evo / Mythic Card texts); js/attacks-c55.js is the battle side.
   Loaded after js/balance-c53.js, before js/state.js. */
(function () {
  const H55 = (DD.H55 = {
    ebenezer: { kind: "debt", weapon: "Debt Seal", noun: "Seal", w: { dmg: 70, cd: 1.6, count: 1, delay: 1.2 }, aim: "Seals the front",
      tech: "Stamps a debt seal on the body scale closest to the wall; 1.2 s later the debt is paid: the healthier the scale, the harder it pays (up to ×3).",
      role: "Breaks the thickest scales and the boss; slow to land.", effect: "Debt: up to ×3 on healthy scales",
      cards: { "Jet Damage": { name: "Debt Damage" }, "Jet Duration": { name: "Debt Term" }, "Jet Width": { name: "Seal Size" }, Jets: { name: "Debt Seals" },
        "Ricochet Coins": { text: "When a debt is paid, 3 coins fly on to 3 more scales for 50%." },
        "Penny Storm": { text: "Every attack stamps 2 more seals." },
        Taxman: { text: "Every 10th payout deals ×5." },
        "Golden Torrent": { text: "Debt Damage +200% and Debt Term +2 s (each second of term pays +25%)." } } },
    "half-goblin": { kind: "spine", weapon: "Shadow Run", noun: "Shadow", w: { dmg: 22, cd: 1.6, count: 1, pierce: 1, speed: 9 }, aim: "Runs the spine",
      tech: "A shadow runs along the dragon's spine from its tail toward its head, stabbing every scale it passes.",
      role: "Poisons the whole body; a scale that reaches 5 Poisoned stacks bursts.", effect: "Toxin: 5 Poisoned stacks burst for 100% onto it and the 2 beside it",
      cards: { "Dagger Damage": { name: "Shadow Damage" }, Daggers: { name: "Shadows" }, "Dagger Pierce": { name: "Stabs per Scale" }, "Throw Speed": { name: "Run Speed" },
        "Venom Tips": { text: "Toxin bursts deal 300% instead of 100%." },
        "Boomerang Blades": { text: "When a shadow reaches the head it runs back to the tail, stabbing again." },
        "Death by a Thousand Cuts": { text: "Shadows +2 and Poisoned stacks up to 10." } } },
    enchantress: { kind: "bubbles", weapon: "Heart Bubbles", noun: "Bubble", w: { dmg: 14, cd: 1.3, count: 3, multi: 2 }, aim: "Floats up in waves",
      tech: "Heart bubbles float up from the wall in waves and pop on the first scale they touch; every pop mends the wall a little.",
      role: "Steady damage and a wall that heals itself.", effect: "Mend: every pop heals the wall 0.3%",
      cards: { "Heartdrop Damage": { name: "Bubble Damage" }, Hops: { name: "Bubbles" }, "Hits per Scale": { name: "Pops per Bubble" },
        "Twin Hearts": { text: "Every bubble splits into 2 small bubbles when it pops." },
        "Mass Charm": { text: "Every pop puts the scale to Sleep: the next hit on it deals ×1.5. Near the wall, every pop also stops the dragon for 0.3 s." },
        "Heart Splash": { text: "Every pop splashes the 2 scales beside it: 10% of its damage, and Wet." },
        "True Love": { text: "Bubble Damage +200% and Bubbles +3." } } },
    mercenary: { kind: "longshot", weapon: "Longshot", noun: "Shot", w: { dmg: 80, cd: 2.2, crit: 0.15, aim: 0.45 }, aim: "Shoots the tail",
      tech: "Locks onto the last scale of the dragon, then one shot crosses the field to it, through every scale on the way: +10% for every scale passed.",
      role: "Pierces the whole body in one line; best when the dragon is long.", effect: "Longshot: +10% for every scale passed",
      cards: { "Double Tap": { text: "A second shot follows each shot 0.2 s later." } } },
    tracker: { effect: "Pack: wolves bite, leap and stay on the body" },
    dwarf: { kind: "tunnel", weapon: "Tunnel Axe", noun: "Tunnel", w: { dmg: 34, cd: 1.6, count: 1, shards: 5 }, aim: "Erupts from below",
      tech: "Digs under the field and bursts up beneath the front scale, throwing rock shards upward in a fan.",
      role: "Hits the scale closest to the wall from below, and everything above it.", effect: "Upheaval: the front scale takes ×2, then shards fly up through the body",
      cards: { "Axe Damage": { name: "Eruption Damage" }, Axes: { name: "Tunnels" }, "Axe Size": { name: "Shard Spread" }, "Throw Speed": { name: "Dig Speed" },
        "Quake Return": { text: "Every eruption shakes the ground: the 3 front scales take 150%. Near the wall the dragon is also pushed back 20 px." },
        "Mountain Stand": { text: "Eruptions throw 4 more shards." },
        Avalanche: { text: "Every eruption leaves a rock zone for 2 s (100% a second)." },
        "Mountain King": { text: "Eruption Damage +200% and Tunnels +2." } } },
    leprechaun: { kind: "clover", weapon: "Clover Mines", noun: "Clover", w: { dmg: 30, cd: 1.1, count: 1, max: 6 }, aim: "Mines on the path",
      tech: "Plants lucky clovers on the path ahead of the dragon's head; a scale that crawls over one calls down a lightning strike that jumps on.",
      role: "Traps the road the dragon must take; 1 strike in 5 is a Jackpot (×5).", effect: "Luck: 1 strike in 5 is a Jackpot ×5",
      cards: { "Arc Damage": { name: "Strike Damage" }, "Arc Bounce": { name: "Strike Jumps" }, "Cast Speed": { name: "Planting Speed" },
        "Lucky Charm": { text: "1 strike in 3 is a Jackpot instead of 1 in 5." },
        "Pot of Gold": { text: "Every clover plants a second clover 60 px further along the path." },
        Jackpot: { text: "Strike Jumps +4 and Crit Chance +30%." } } },
    knight: { kind: "cross", weapon: "Holy Cross", noun: "Cross", w: { dmg: 30, cd: 2.2, arm: 90 }, aim: "Cross on the front",
      tech: "Stamps a cross of light on the scale closest to the wall: every scale on its four arms takes the hit and is Judged; the cross burns for 2 s.",
      role: "Guards the wall; Judged scales take +15% from every hero.", effect: "Holy ground: the cross burns 2 s (30% a second)",
      cards: { "Beam Damage": { name: "Cross Damage" }, "Beam Width": { name: "Cross Size" },
        Skyfall: { text: "Stamps 3 crosses: on the front scale and on the two densest spots." },
        Dawnbreaker: { text: "Cross Damage +200% and Cross Size +60%." } } },
    crusader: { kind: "tide", weapon: "Holy Tide", noun: "Tide", w: { dmg: 50, cd: 2.4, band: 26, speed: 420 }, aim: "Rises from the wall",
      tech: "A band of holy fire rises from the wall to the top of the field, hitting every scale once; a scale left under 15% life is executed.",
      role: "Hits the whole field from the bottom up and finishes weak scales.", effect: "Execute: scales left under 15% life break",
      cards: { "Hammer Damage": { name: "Tide Damage" }, "Shockwave Size": { name: "Tide Height" }, "Grind Time": { name: "Afterburn" }, "Throw Speed": { name: "Prayer Speed" },
        Consecrate: { text: "The tide leaves holy ground under the last 3 scales it hits for 3 s (60% a second, Judged)." },
        "Holy Harvest": { text: "A second tide rises 0.5 s after the first." },
        Crusade: { text: "Every 4th tide is twice as tall." },
        Templar: { text: "Tide Damage +200% and Tide Height +60%." } } },
    "tou-lak": { kind: "totem", weapon: "Thunder Totem", noun: "Totem", w: { dmg: 16, cd: 2.6, count: 1, life: 3, zap: 0.5, reach: 170 }, aim: "Totem by the head",
      tech: "Plants a thunder totem beside the dragon's head that zaps the 2 nearest scales every half second; every 8th zap is a thunderclap around it.",
      role: "A small tower on the field; strong where the head crawls.", effect: "Static: every 8th zap is a thunderclap (150% within 110 px)",
      cards: { "Orb Damage": { name: "Zap Damage" }, Orbs: { name: "Zap Targets" }, "Orb Time": { name: "Totem Time" }, "Orb Size": { name: "Totem Reach" },
        "Thunder Roar": { text: "Every thunderclap roars: the 5 front scales take 100%. Near the wall the dragon is also pushed back 10 px (at most once a second)." },
        Intimidate: { text: "When a totem fades it explodes: 200% to every scale within 60 px." },
        "War Drums": { text: "While 2 or more totems stand, every hero attacks 20% faster." },
        Warlord: { text: "Zap Targets +2 and Zap Damage +200%." } } },
    alchemist: { kind: "spiral", weapon: "Elixir Spiral", noun: "Vial", w: { dmg: 26, cd: 2.4, count: 6, life: 1.1 }, aim: "Spiral of vials",
      tech: "Vials spin outward in a spiral from the densest part of the body; each vial is one of Pell's elements, so Reactions start.",
      role: "Every element at once; the best partner for Reactions.", effect: "Elixirs: every vial a random element of hers",
      cards: { "Flask Damage": { name: "Vial Damage" }, Flasks: { name: "Vials" }, "Zone Size": { name: "Vial Size" }, "Zone Time": { name: "Spiral Time" },
        "Mixed Brew": { text: "A Reaction a vial starts deals ×1.5." },
        Transmute: { text: "3 spirals at once: on the densest spot and the next two." },
        "Philosopher's Stone": { text: "Every Reaction a vial starts also hits the 2 scales beside it." },
        "Grand Alchemy": { text: "Vials +4 and Vial Size +60%." } } },
    "loeg-yllavyre": { kind: "flight", weapon: "Elder Flight", noun: "Spirit", w: { dmg: 40, cd: 10, life: 8, breath: 0.3, count: 1 }, aim: "Figure-eight flight",
      tech: "A spirit of an elder dragon flies a figure-eight over the field, breathing on the scales under it; every scale it breathes on carries a seed that blooms 2 s later.",
      role: "Covers the whole field for a long time; seeds bloom on their own.", effect: "Seeds: bloom 2 s later (150%, and 50% to the 2 beside)",
      cards: { "Dragonling Damage": { name: "Breath Damage" }, Dragonlings: { name: "Elder Spirits" }, "Breath Speed": { name: "Breath Speed" },
        Brood: { text: "One more elder spirit flies with the first." },
        Hatchery: { text: "A seed that blooms on a scale that breaks plants 2 more seeds beside it." },
        "Brood Mother": { text: "Elder Spirits +2 and Breath Damage +200%." } } },
    scout: { kind: "dive", weapon: "Hawk Dive", noun: "Hawk", w: { dmg: 40, cd: 1, count: 1, pierce: 1 }, aim: "Hawk dives",
      tech: "His hawk circles above the field and dives in an arc onto a scale, tearing it and the scale behind it, then climbs back.",
      role: "Picks the toughest scale in the upper field, two at a time.", effect: "Talon: every dive tears 2 scales",
      cards: { "Arrow Damage": { name: "Talon Damage" }, Arrows: { name: "Hawks" }, "Arrow Pierce": { name: "Talon Reach" }, "Draw Speed": { name: "Dive Speed" },
        Volley: { text: "Every 4th dive, 3 feathers for each hawk rain down onto the scales above Dace." },
        "Splitting Arrows": { text: "Every dive tears 2 more scales behind the first." },
        Hawk: { text: "Every 5 s the hawk marks the toughest scale and the 2 beside it for 5 s: dives on them deal ×2." },
        "Hail of Arrows": { text: "Hawks +3 and Talon Reach +3." } } },
    klaus: { kind: "fireworks", weapon: "Gift Fireworks", noun: "Rocket", w: { dmg: 22, cd: 2.6, count: 1, radius: 40 }, aim: "Rockets burst above",
      tech: "Launches gift rockets straight up that burst into stars over the body; each burst hides a gift: coins, ×2 damage or a short freeze.",
      role: "Bursts in the air over the thickest part; every burst is a surprise.", effect: "Gifts: coins, ×2 or a 0.2 s freeze, by chance",
      cards: { "Gift Damage": { name: "Firework Damage" }, "Burst Area": { name: "Burst Size" }, Gifts: { name: "Rockets" }, "Burst Duration": { name: "Sparkle Time" },
        "Second Burst": { text: "Every burst bursts again 1 s later for 60%." },
        "Sack of Plenty": { text: "3 rockets go up every launch." },
        "Surprise Box": { text: "Every 6th rocket is a giant firework: 400% within 88 px." },
        "Christmas Eve": { text: "Rockets +2 and Burst Size +60%." } } },
    archaeologist: { kind: "glyphs", weapon: "Glyph Triangle", noun: "Glyph", w: { dmg: 14, cd: 2.4, count: 1, life: 3, r: 90 }, aim: "Triangle of glyphs",
      tech: "Sets 3 relic glyphs around the middle of the body and links them with light; scales on the links are hit, scales inside are Petrified after 5 hits.",
      role: "Traps a part of the body; Petrified scales take ×2 from Physical and Rock.", effect: "Petrify: 5 hits inside → stone for 2 s",
      cards: { "Disc Damage": { name: "Glyph Damage" }, Discs: { name: "Glyph Sets" }, "Disc Time": { name: "Glyph Time" }, "Disc Size": { name: "Triangle Size" },
        "Relic Shards": { text: "When a triangle fades, its 3 glyphs burst for 150% within 50 px." },
        "Ancient Seal": { text: "Triangles are twice as big." },
        Petrify: { text: "Stone scales take ×3 instead of ×2 from Physical and Rock hits." },
        "Lost Expedition": { text: "Glyph Sets +2 and Glyph Time +2 s." } } },
    tristan: { kind: "rose", weapon: "Ember Rose", noun: "Petal", w: { dmg: 30, cd: 1.6, petals: 4, R: 80 }, aim: "Rose on the toughest",
      tech: "Four flaming blades trace a rose around the toughest scale; a scale hit 3 times by the rose bursts into embers.",
      role: "Shreds one thick spot; embers spread fire to the scales around.", effect: "Embers: 3 hits → a burst (150% within 40 px) and Burning",
      cards: { "Slash Damage": { name: "Petal Damage" }, "Slash Speed": { name: "Bloom Speed" }, Waves: { name: "Roses" },
        "Burning Trail": { text: "The rose leaves burning petals for 2 s: scales crossing them take 40% a second." },
        "Twin Edge": { text: "8 blades instead of 4." },
        "Flame Tornado": { text: "Every 5th rose becomes a flame tornado that rises from its centre for 2 s (200% a hit)." } } },
    "guild-leader": { kind: "chains", weapon: "Binding Contract", noun: "Chain", w: { dmg: 40, cd: 2.2, binds: 3, t: 3 }, aim: "Chains the strongest",
      tech: "Dark chains shoot from the top corners and bind the 3 strongest scales for 3 s; damage to one bound scale is shared with the others (30%).",
      role: "Ties the toughest scales together so every hit counts more than once.", effect: "Soul Link: 30% of the damage to one bound scale hits the others",
      cards: { "Dive Speed": { name: "Bind Speed" }, "Strike Damage": { name: "Chain Damage" },
        "Murder of Crows": { text: "Binds 5 scales instead of 3." } } },
    szopin: { kind: "rift", weapon: "Void Rift", noun: "Rift", w: { dmg: 14, cd: 2.6, count: 1, life: 2, r: 70 }, aim: "Rift on the densest",
      tech: "Opens a black rift on the densest part of the body that grinds the scales around it, harder the closer they are (up to ×2 at its heart).",
      role: "Crushes a crowded spot; more scales, more damage.", effect: "Void: up to ×2 near the rift's heart",
      cards: { "Blade Damage": { name: "Rift Damage" }, Blades: { name: "Rifts" }, "Blade Time": { name: "Rift Time" }, "Weave Width": { name: "Rift Size" },
        "Chain Hook": { text: "Every 0.4 s a dark chain lashes out of each rift at the nearest scale outside it for 100%." },
        "Wrath Unchained": { text: "When a rift closes it explodes: 200% to every scale inside it." },
        Bloodlust: { text: "A rift deals +10% for every scale it has hit this attack (up to +100%)." },
        "God Slayer": { text: "Rifts +2 and Rift Damage +200%." } } },
    "time-traveler": { kind: "sigil", weapon: "Time Sigils", noun: "Sigil", w: { dmg: 30, cd: 2.1, n: 3, delay: 1.5 }, aim: "Sigils replay",
      tech: "Stamps clock sigils on 3 scales; 1.5 s later each sigil replays half of all the damage its scale took meanwhile, from every hero.",
      role: "Doubles down on what the party already hits.", effect: "Echo: replays 50% of the damage taken under the sigil",
      cards: { "Ray Damage": { name: "Sigil Damage" }, "Ray Width": { name: "Echo Strength" },
        Paradox: { text: "Stamps 6 sigils instead of 3." },
        "Grandfather Clock": { text: "Sigil Damage +200% and Echo Strength +60%." } } },
    viking: { kind: "cyclone", weapon: "Frost Cyclone", noun: "Cyclone", w: { dmg: 40, cd: 2.4, speed: 200, life: 2.2, r: 26, count: 1 }, aim: "Cyclone climbs",
      tech: "A frost cyclone climbs up his lane, growing as it goes; a scale inside takes more damage for every tick it stays in (Shred, up to +50%).",
      role: "Grinds a column of the body; the longer, the harder.", effect: "Shred: +5% damage taken per tick inside (up to +50%)",
      cards: { "Axe Damage": { name: "Cyclone Damage" }, "Whirl Size": { name: "Cyclone Size" }, "Grind Time": { name: "Cyclone Time" }, "Throw Speed": { name: "Spin Speed" },
        Berserker: { text: "Each cyclone splits into 2 at its first hit." },
        Berserk: { text: "Every second a cyclone climbs, it hits 10% harder (up to +100%)." },
        Valhalla: { text: "Cyclone Damage +200% and Cyclone Time +2 s." } } },
    dreamwalker: { kind: "nightmare", weapon: "Nightmare Bloom", noun: "Dream", w: { dmg: 40, cd: 2, count: 3, t: 2 }, aim: "Blooms inside",
      tech: "Puts 3 scales to Sleep; 1 s later nightmare tendrils burst out of each and lash the 2 scales beside it. The next hit on a sleeping scale deals ×1.5.",
      role: "Spreads damage from inside the body.", effect: "Sleep + tendrils from inside the dragon",
      cards: { "Tide Damage": { name: "Nightmare Damage" }, Tides: { name: "Dreamers" }, "Tide Time": { name: "Sleep Time" }, "Tide Width": { name: "Tendril Reach" },
        Nightmare: { text: "Tendrils also lash the scales 2 away (4 scales). Near the wall, while 5 or more scales sleep, the dragon moves ×0.8." },
        "Deep Sleep": { text: "Sleep lasts twice as long, and sleeping scales take +20% from every hero." },
        "Endless Dream": { text: "Dreamers +2 and Nightmare Damage +200%." } } },
    sorceress: { kind: "backdraft", weapon: "Backdraft", noun: "Flame", w: { dps: 19, cd: 3.2, dur: 2.2, len: 230, angle: 0.4 }, aim: "From the head back",
      tech: "Turns the dragon's own fire against it: for 2.2 s a cone of flame pours from its head back along its body, burning every scale in it. The head is never burnt.",
      role: "Burns the front half of the body, whichever way the dragon turns.", effect: "Backfire: the dragon's own fire burns its body",
      cards: { "Dragon Fury": { text: "Two more cones pour back along the body from the 6th and the 12th scale behind the head." } } },
    "kael-dragon": { kind: "meteor", weapon: "Dragonfall", noun: "Meteor", w: { dmg: 60, cd: 1.1, count: 3, r: 34 }, aim: "Meteor shower",
      tech: "Calls a shower of dragonfire meteors onto the densest part of the body; each leaves a burning crater, and every hit Awes the dragon.",
      role: "The strongest damage there is, over a whole cluster at once.", effect: "Craters: burn 1.5 s (30% a second)",
      cards: { "Blade Damage": { name: "Meteor Damage" }, Blades: { name: "Meteors" }, "Blade Pierce": { name: "Crater Size" }, "Blade Speed": { name: "Call Speed" },
        "Dragon Split": { text: "Every meteor splits into 3 small meteors on impact (50% each)." },
        "Wings of Ruin": { text: "Every call drops 2 showers in a row." } } },
  });
  // the 10 heroes whose attack stays (already one of a kind): their effect, for the list in Ledger Draft 45
  Object.assign(H55, {
    spellsword: { effect: "Aim: bolts fly where you drag" }, occultist: { effect: "Curse: the next hit crits" }, "jack-frost": { effect: "Chill: 3 stacks freeze 0.4 s" },
    cassandra: { effect: "Thorns: Entangled and a short stun" }, alexandra: { effect: "Overcharge: every jump +10%" },
    marpesia: { effect: "Holy Pin: +20% from everyone" }, "amar-suen": { effect: "Gold: coins, ×2 with Midas" }, minstrel: { effect: "Echo rings" },
    "sugarplum-faerie": { effect: "Sticky: sweets hold on the scales" },
  });
  for (const [id, o] of Object.entries(H55)) {
    const h = DD.HERO[id];
    if (!h || !o.kind) continue;
    h.kind = o.kind;
    h.w = Object.assign({ cd: h.w.cd }, o.w);
    h.weapon = o.weapon;
    h.noun = o.noun;
    h.line = o.tech;
    h.tech = o.tech;
    h.role = o.role;
    for (const c of h.cards || []) {
      const ed = o.cards && o.cards[c.name];
      if (!ed) continue;
      if (ed.text) c.text = ed.text;
      if (ed.name) c.name = ed.name;
    }
  }
  // strength (tools/tune-c53.mjs on the new attacks, 2026-11-08; Rusk and Granny set again after the card fixes: K ×0.54 / ×0.55, L20 ÷ the same): PATTERN_K and the Damage Skill Card factor (absolute, replaces C53's)
  DD.C55 = { K: {"kael-dragon":1.364, "ebenezer":0.333, "tracker":0.271, "sorceress":1.597, "half-goblin":0.121, "enchantress":1.2, "mercenary":0.546, "dwarf":0.429, "leprechaun":1.433, "knight":1.508, "crusader":0.33, "tou-lak":2.121, "alchemist":0.353, "loeg-yllavyre":1.426, "scout":0.721, "klaus":1.436, "archaeologist":0.163, "tristan":0.089, "guild-leader":1.033, "szopin":0.239, "time-traveler":2.526, "viking":0.339, "dreamwalker":1.537},
    CARD_DMG: {"ebenezer":1.15, "sorceress":1.56, "half-goblin":0.67, "enchantress":1.32, "mercenary":2.83, "dwarf":1.15, "leprechaun":1.67, "knight":1, "crusader":2.16, "tou-lak":3, "alchemist":2.3, "loeg-yllavyre":1.32, "scout":1, "klaus":1.48, "archaeologist":3, "tristan":2.32, "guild-leader":2.3, "szopin":3, "time-traveler":2.68, "viking":1.79, "dreamwalker":3} };
  Object.assign(DD.PATTERN_K, DD.C55.K);
  // the Lv 10 → 20 step of these heroes (tools/tune-c53-l20.mjs, Epic baseline 659 / 6439, 2026-11-08)
  DD.C55.L20 = {"ebenezer":1.325, "tracker":1.181, "sorceress":1.865, "half-goblin":1.528, "enchantress":1.785, "mercenary":1.674, "dwarf":1.369, "leprechaun":1.614, "knight":1.212, "crusader":1.658, "tou-lak":1.818, "alchemist":1.673, "loeg-yllavyre":1.952, "scout":1.785, "klaus":1.885, "archaeologist":1.062, "tristan":2.966, "guild-leader":1.607, "szopin":1.972, "time-traveler":1.778, "viking":1.046, "dreamwalker":2.402};
  if (DD.C53) Object.assign(DD.C53.L20, DD.C55.L20);
  // C55 freeze cap (user no. 118: "ga boleh ada freeze yang lebih dari 0.4 detik"): texts that promised longer
  DD.STATUS.ice.freeze = DD.FREEZE_MAX;
  DD.ELEMENT_LINE.ice = "Ice · leaves Chilled (dragon ×0.85; 3 stacks freeze it 0.4 s) · Superconduct with Electric";
  const fix = { "jack-frost:Frostbite": "Chilled and Frozen scales take +30% from snowballs.", "jack-frost:Avalanche": "Every 20 s a giant snowball rolls down from the top through the whole body: 400% to every scale and Frozen 0.4 s.",
    "time-traveler:Time Stop": "Every 40 s time stops for 3 s: every hit in those 3 s lands together at the end, ×1.5. The dragon freezes for 0.4 s of it." };
  for (const h of DD.HEROES) for (const c of h.cards || []) {
    if (fix[c.key]) c.text = fix[c.key];
    if (c.key === "alchemist:Grand Experiment") c.text = c.text.replace("the dragon freezes 2.5 s", "the dragon freezes 0.4 s").replace("the 4 scales around freeze 2 s", "the 4 scales around freeze 0.4 s");
  }
  for (const [id, d] of Object.entries(DD.C55.CARD_DMG)) {
    const old = (DD.C53 && DD.C53.CARD_DMG[id]) || 1, c = (DD.HERO[id].cards || []).find((x) => x.type === "skill" && x.stat === "dmg");
    if (!c || d === old) continue;
    for (const t of Object.keys(c.tiers)) c.tiers[t] = Math.round((c.tiers[t] / old) * d * 100) / 100;
    if (c.cap !== null && c.cap !== undefined) c.cap = Math.round((c.cap / old) * d * 100) / 100;
    if (DD.C53) DD.C53.CARD_DMG[id] = d;
  }
  // Fen leads a random start too (C54): a new wolf pack every 10 s (was 14; a pack lives 12 s), so a lone Fen is never without wolves
  DD.HERO.tracker.w.cd = 10;
  const aim0 = DD.aimOf;
  DD.aimOf = (h) => (H55[h.id] && H55[h.id].aim) || aim0(h);
})();
